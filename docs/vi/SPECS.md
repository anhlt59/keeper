# SPEC — Thiết Kế Nghiệp Vụ Hệ Thống Zoo

> Phiên bản: 1.0 | Trạng thái: Draft
> Dựa trên: `docs/prd-v1.md` (MVP v1)

---

## 1. Tổng Quan Nghiệp Vụ

### 1.1 Mục tiêu hệ thống

- **Theo dõi vòng đời tài sản** từ khi mua sắm đến thanh lý.
- **Tăng minh bạch** — biết tài sản đang ở đâu, của ai, tình trạng ra sao.
- **Giảm thủ công** — quét QR thay nhập tay, OCR hóa đơn thay tự nhập.
- **Hỗ trợ quyết định** — dashboard KPI realtime.

### 1.2 Phạm vi MVP

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| 1 | CRUD tài sản, FSM vòng đời, gán/thu hồi, bảo trì, audit log, dashboard | ✅ Hoàn thành |
| 2 | Thuộc tính động, QR + quét di động, OCR hóa đơn bán tự động | ✅ Hoàn thành |
| 3 | Kiểm kê định kỳ, tối ưu hiệu năng | ⏳ Chờ thiết kế |

### 1.3 Đối tượng người dùng

- **Admin** — toàn quyền thao tác mọi nghiệp vụ.

---

## 2. Các Nghiệp Vụ Chính

### 2.1 Quản Lý Tài Sản (FR-01)

**Tạo tài sản mới**

```
Actor: Admin
Trigger: Nhấn "Tạo tài sản" hoặc duyệt hóa đơn OCR xong
Input: tên, danh mục, mã tài sản (auto), thông tin mua (ngày, giá, bảo hành), thuộc tính động
Process:
  1. Validate input (Zod schema)
  2. Check trùng mã QR (raise error nếu trùng)
  3. Tạo asset record (status = AVAILABLE)
  4. Sinh QR code (lưu file PNG vào public/uploads/qr/)
  5. Tạo AssetEvent: ASSET_CREATED
  6. Tạo AuditLog: ASSET_CREATED
Output: Asset record + QR image URL
```

**Cập nhật tài sản**

- Cho phép sửa: tên, danh mục, thông tin mua, thuộc tính động.
- Không cho phép sửa: mã tài sản, mã QR, ngày tạo.
- Mỗi thay đổi → AssetEvent + AuditLog.

**Xóa tài sản**

- Soft delete (`isDeleted = true`, `deletedAt = now`).
- Query luôn filter `WHERE isDeleted = false`.
- Không xóa vĩnh viễn để preserve audit trail.

---

### 2.2 Vòng Đời Tài Sản — FSM (FR-02)

**5 trạng thái:**

| Trạng thái | Ký hiệu | Mô tả |
|-------------|---------|-------|
| Sẵn sàng | `AVAILABLE` | Tài sản chưa gán, sẵn sàng sử dụng |
| Đã gán | `ASSIGNED` | Đang được sử dụng bởi nhân viên |
| Bảo trì | `MAINTENANCE` | Đang sửa chữa/bảo trì |
| Ngưng sử dụng | `RETIRED` | Không còn dùng, chờ thanh lý |
| Đã thanh lý | `DISPOSED` | Đã hoàn tất thanh lý |

**Các transition hợp lệ:**

```
┌─────────────┐  assign   ┌─────────────┐
│ AVAILABLE  │ ────────► │  ASSIGNED   │
└──────┬──────┘           └──────┬──────┘
       │                         │
       │ recall                  │ recall
       ▼                         ▼
┌─────────────┐           ┌────────────┐
│ AVAILABLE  │           │ AVAILABLE  │
└─────────────┘           └────────────┘
                                │
                                │ send-to-maintenance
                                ▼
                          ┌─────────────┐
                          │ MAINTENANCE│
                          └──────┬──────┘
                                 │ complete-maintenance
                                 ▼
                          ┌─────────────┐
                          │  ASSIGNED   │
                          └─────────────┘

┌─────────────┐           ┌────────────┐
│  ASSIGNED   │ ── retire ──► RETIRED  │
└─────────────┘             └──────┬────┘
                                   │ dispose
                                   ▼
                             ┌────────────┐
                             │  DISPOSED  │
                             └────────────┘
```

**Ma trận transition:**

| Từ \ Đến | AVAILABLE | ASSIGNED | MAINTENANCE | RETIRED | DISPOSED |
|-----------|-----------|----------|-------------|---------|----------|
| AVAILABLE | — | assign | send | retire | — |
| ASSIGNED | recall | — | send | retire | — |
| MAINTENANCE | recall | complete | — | retire | — |
| RETIRED | restore | assign | send | — | dispose |
| DISPOSED | — | — | — | — | — |

**Quy tắc FSM:**

- Transition không hợp lệ → trả `400 Bad Request` với message rõ.
- Mỗi transition → tạo `AssetEvent` (immutable, append-only).
- `DISPOSED` là trạng thái cuối cùng — không transition ra khỏi nó.

---

### 2.3 Gán & Thu Hồi (FR-03)

**Gán tài sản (assign)**

```
Input: assetId, employeeId, lý do (tùy chọn)
Pre-check:
  - asset.status phải là AVAILABLE hoặc RETIRED
  - employeeId phải tồn tại
  - asset không ở trạng thái DISPOSED
Process:
  1. Update asset: status = ASSIGNED, employeeId = input.employeeId
  2. Tạo AssetEvent: ASSET_ASSIGNED (ghi employeeId, assignedBy, reason, timestamp)
  3. Tạo AuditLog
Output: asset updated + event created
```

**Thu hồi tài sản (recall)**

```
Input: assetId, lý do (tùy chọn)
Pre-check:
  - asset.status phải là ASSIGNED hoặc MAINTENANCE
Process:
  1. Update asset: status = AVAILABLE, employeeId = null
  2. Tạo AssetEvent: ASSET_RECALLED
  3. Tạo AuditLog
Output: asset updated + event created
```

---

### 2.4 Bảo Trì (FR-04)

**Gửi bảo trì (send-to-maintenance)**

```
Input: assetId, mô tả, nhà cung cấp, chi phí dự kiến
Pre-check: asset.status phải là ASSIGNED hoặc AVAILABLE hoặc RETIRED
Process:
  1. Update asset: status = MAINTENANCE
  2. Tạo Maintenance record (status = PENDING)
  3. Tạo AssetEvent: SENT_TO_MAINTENANCE
  4. Tạo AuditLog
Output: asset + maintenance record
```

**Hoàn thành bảo trì (complete-maintenance)**

```
Input: maintenanceId, mô tả kết quả, chi phí thực tế, ngày hoàn thành
Pre-check: maintenance.status = PENDING hoặc IN_PROGRESS
Process:
  1. Update maintenance: status = COMPLETED, result, actualCost, completedAt
  2. Update asset: status = ASSIGNED (hoặc AVAILABLE nếu không có assignee)
  3. Tạo AssetEvent: MAINTENANCE_COMPLETED
  4. Tạo AuditLog
Output: asset + maintenance record updated
```

**Chi phí bảo trì:**

- Tổng chi phí = SUM(actualCost) theo asset hoặc theo tháng.
- Filter được theo: status, vendor, date range.

---

### 2.5 Ngưng Sử Dụng & Thanh Lý (FR-02)

**Ngưng sử dụng (retire)**

```
Pre-check: asset.status = ASSIGNED
Process:
  1. Update asset: status = RETIRED, employeeId = null
  2. Tạo AssetEvent: ASSET_RETIRED
  3. Tạo AuditLog
Output: asset updated
```

**Thanh lý (dispose)**

```
Pre-check: asset.status = RETIRED
Process:
  1. Update asset: status = DISPOSED
  2. Tạo AssetEvent: ASSET_DISPOSED
  3. Tạo AuditLog
Output: asset updated (final state)
```

**Khôi phục (restore)**

```
Pre-check: asset.status = RETIRED
Process:
  1. Update asset: status = AVAILABLE
  2. Tạo AssetEvent: ASSET_RESTORED
  3. Tạo AuditLog
Output: asset updated
```

---

### 2.6 Thuộc Tính Động (FR-05)

**Admin định nghĩa schema thuộc tính theo danh mục:**

```
Input: categoryId, key, label, type (string/number/boolean/date), required
Storage: attribute_definitions table
Validation layer: Zod schema generated at runtime
Index: GIN index on JSONB column in asset_attribute_values
```

**Tạo/cập nhật tài sản → populate dynamic attributes:**

```
Input: assetId, attrs (key-value map)
Process:
  1. Lấy category của asset
  2. Lấy attribute_definitions cho category đó
  3. Generate Zod schema from definitions
  4. Validate attrs against Zod schema
  5. Upsert vào asset_attribute_values (asset_id + attrs JSONB)
Output: validated attrs saved
```

**Ràng buộc:**

- Không thể xóa definition nếu có asset đang dùng và có giá trị.
- Thêm definition mới → không affect assets cũ (backward compatible).

---

### 2.7 QR Code & Quét Di Động (FR-06)

**Sinh QR:**

```
Trigger: asset creation
Content: baseUrl/assets/{assetId}/lookup
Format: PNG 300dpi, 25mm × 25mm
Layout: QR 60% + asset name + short code 40% dưới
Storage: public/uploads/qr/{assetId}.png
```

**Quét QR (mobile):**

```
Flow:
  1. User mở /scan → camera activates (html5-qrcode)
  2. Quét mã QR → extract assetId từ URL
  3. Navigate đến /assets/{assetId}/lookup
  4. Hiển thị asset detail + quick actions
Fallback: manual input nếu camera fails
```

---

### 2.8 OCR Hóa Đơn (FR-08)

**Upload & OCR flow:**

```
Step 1 — Upload:
  Input: file (image/PDF), invoice_number
  Process: lưu file vào public/uploads/invoices/{YYYY}/{MM}/{filename}
  Output: invoice record (status = PENDING_OCR)

Step 2 — OCR:
  Trigger: file uploaded thành công (hoặc admin nhấn "Chạy OCR")
  Process:
    - Gọi GPT-4o-mini với prompt ưu tiên tiếng Việt
    - Extract: vendor, invoice_date, total_amount, line_items
    - Tính confidence score
    - Lưu: invoice_ocr_extractions (raw + extraction + confidence)
  Output: invoice status = OCR_COMPLETED, hiển thị extracted data

Step 3 — Admin duyệt:
  Input: admin sửa các trường đã extract, nhấn "Xác nhận"
  Process:
    - Validate final data
    - Lưu confirmed data vào invoice record
    - Tạo asset (nếu mua tài sản mới) hoặc link với asset existing
    - Tạo AuditLog
  Output: invoice status = APPROVED

Step 4 — Tạo tài sản (tùy chọn):
  Trigger: admin nhấn "Tạo tài sản từ hóa đơn"
  Process: tương tự tạo tài sản mới (2.1), link invoiceId
  Output: asset record linked to invoice
```

**Lưu trữ hóa đơn:**

- Giữ file gốc tối thiểu **1 năm** từ ngày upload.
- Backup: daily scheduled backup (provider TBD).

---

## 3. Luồng Nghiệp Vụ Tổng Hợp

### 3.1 Luồng tạo tài sản từ hóa đơn

```
[Upload hóa đơn]
    → OCR chạy tự động
    → Admin xem kết quả OCR + confidence
    → Admin sửa / xác nhận dữ liệu
    → Nhấn "Tạo tài sản"
    → Tài sản được tạo (AVAILABLE)
    → AssetEvent + AuditLog được tạo
    → QR code được sinh
```

### 3.2 Luồng bảo trì tài sản

```
[Tài sản đang ASSIGNED]
    → Admin gửi bảo trì (MAINTENANCE)
    → Maintenance record tạo (PENDING)
    → Nhà cung cấp sửa xong
    → Admin nhập kết quả + chi phí thực tế
    → Hoàn thành bảo trì → ASSIGNED lại
    → AssetEvent + AuditLog
    → Chi phí bảo trì được tính vào KPI
```

### 3.3 Luồng thanh lý tài sản

```
[Tài sản ASSIGNED]
    → Thu hồi (AVAILABLE)
    → Ngưng sử dụng (RETIRED)
    → Thanh lý (DISPOSED) ← final state
    → Audit trail đầy đủ qua AssetEvent
```

---

## 4. Ràng Buộc Nghiệp Vụ

| # | Ràng buộc | Mức ưu tiên |
|---|-----------|-------------|
| BC-01 | Mã QR mỗi tài sản là DUY NHẤT — không cho phép trùng | P0 |
| BC-02 | Tài sản đã DISPOSED không thể gán hay khôi phục | P0 |
| BC-03 | Mọi transition trạng thái phải tạo AssetEvent | P0 |
| BC-04 | AssetEvent là append-only — không sửa, không xóa | P0 |
| BC-05 | AuditLog ghi mọi action quan trọng | P0 |
| BC-06 | OCR hóa đơn bắt BUỘC admin xác nhận trước khi lưu | P0 |
| BC-07 | Lưu cả raw OCR output và confirmed data | P0 |
| BC-08 | Dynamic attrs validate bằng Zod trước khi lưu JSONB | P1 |
| BC-09 | Tài sản soft delete — không hard delete | P1 |
| BC-10 | QR label: 25mm × 25mm, scannable trên iOS Safari / Android Chrome | P1 |

---

## 5. Dashboard KPI

| KPI | Công thức | Nguồn dữ liệu |
|-----|-----------|---------------|
| Tổng giá trị tài sản | SUM(purchasePrice) where isDeleted = false | assets table |
| Phân bổ theo trạng thái | COUNT(*) GROUP BY status | assets table |
| Số tài sản cần bảo trì | COUNT(*) WHERE status = MAINTENANCE | assets table |
| Chi phí bảo trì tháng | SUM(actualCost) WHERE completedAt THIS_MONTH | maintenance_records |
| Biểu đồ phân bổ giá trị | GROUP BY category | assets + categories |
| Timeline sự kiện gần đây | ORDER BY createdAt DESC LIMIT 20 | asset_events |

---

## 6. Bảng Tham Chiếu Sự Kiện

| Sự kiện | Trigger | Actor |
|---------|---------|-------|
| `ASSET_CREATED` | Tạo asset mới | System |
| `ASSET_UPDATED` | Cập nhật thông tin asset | Admin |
| `ASSET_DELETED` | Soft delete | Admin |
| `ASSET_ASSIGNED` | Gán cho nhân viên | Admin |
| `ASSET_RECALLED` | Thu hồi | Admin |
| `SENT_TO_MAINTENANCE` | Gửi bảo trì | Admin |
| `MAINTENANCE_COMPLETED` | Hoàn thành bảo trì | Admin |
| `ASSET_RETIRED` | Ngưng sử dụng | Admin |
| `ASSET_RESTORED` | Khôi phục từ RETIRED | Admin |
| `ASSET_DISPOSED` | Thanh lý | Admin |
| `INVOICE_OCR_COMPLETED` | OCR xong, chờ duyệt | System |
| `INVOICE_APPROVED` | Admin duyệt hóa đơn | Admin |

---

## 7. Out-of-Scope (Chưa Thiết Kế)

- Multi-location / multi-branch
- Multi-role RBAC (Admin-only trong MVP)
- Periodic Inventory Cycle (Phase 3)
- Office Supply Inventory
- Advanced depreciation / accounting
- ERP / HRM integration
- Self-hosted OCR (Ollama)

---

## 8. Rủi Ro & Giảm Thiểu

| Rủi ro | Xác suất | Giảm thiểu |
|--------|----------|-------------|
| OCR đọc sai trường quan trọng | Trung bình | Confirmation bắt buộc + confidence score hiển thị |
| Quét QR di động không ổn định | Thấp | Fallback manual input + hướng dẫn chụp ảnh chuẩn |
| Dashboard chậm khi dữ liệệ lớn | Trung bình | Index + cache cho heavy KPIs |
| Thuộc tính động hỗn loạn | Thấp | Chỉ Admin được định nghĩa, schema governance |
| FSM transition không hợp lệ | Thấp | Validate tự động ở service layer |

---

## 9. Ghi Chú Triển Khai

- **FSM validate:** ở `src/lib/fsm.ts`, không dùng xstate.
- **Auth:** Better Auth session-based, `lib/auth.ts`, `openAPI()` plugin.
- **DB:** Prisma + PostgreSQL, `lib/db.ts`.
- **OCR prompt:** Ưu tiên tiếng Việt, fallback English khi confidence thấp.
- **Invoice storage:** `public/uploads/invoices/{YYYY}/{MM}/{filename}`.
- **QR storage:** `public/uploads/qr/{assetId}.png`.
- **Backup:** Daily scheduled, min 30-day retention, 1-year invoice retention.
