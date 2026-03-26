# Keeper — Đặc Tả Nghiệp Vụ

> **v1.0.0** | 2026-03-27
> PRD: [prd-v1.md](../prd-v1.md) · Kiến trúc: [system-architecture-flow.md](./system-architecture-flow.md)

---

## Mục Lục

1. [Phạm Vi & Người Dùng](#1-phạm-vi--người-dùng)
2. [Quản Lý Tài Sản — FR-01](#2-quản-lý-tài-sản--fr-01)
3. [FSM Vòng Đời — FR-02](#3-fsm-vòng-đời--fr-02)
4. [Gán & Thu Hồi — FR-03](#4-gán--thu-hồi--fr-03)
5. [Bảo Trì — FR-04](#5-bảo-trì--fr-04)
6. [Thuộc Tính Động — FR-05](#6-thuộc-tính-động--fr-05)
7. [QR Code — FR-06](#7-qr-code--fr-06)
8. [Dashboard — FR-07](#8-dashboard--fr-07)
9. [OCR Hóa Đơn — FR-08](#9-ocr-hóa-đơn--fr-08)
10. [Danh Mục & Nhân Viên](#10-danh-mục--nhân-viên)
11. [Audit Log](#11-audit-log)
12. [Auth](#12-auth)
13. [NFRs](#13-nfrs)

---

## 1. Phạm Vi & Người Dùng

### Người dùng
| Actor | Role | Phạm vi |
|-------|------|---------|
| Admin | Single role | Toàn hệ thống |

### In-scope (Phase 1 & 2 ✅)

`CRUD tài sản · FSM vòng đời · Gán/Thu hồi · Bảo trì · Audit log · Dashboard KPI · Better Auth · Dynamic attrs · QR + scan · OCR hóa đơn`

### Out-of-scope
`Multi-location · Office Supply · Chu kỳ kiểm kê · Multi-role RBAC · Self-hosted OCR · ERP/HRM integration`

### Dung lượng Year-1
| Chỉ số | Giới hạn |
|--------|---------|
| Tổng tài sản | 5,000 |
| Lifecycle events | 200,000 |
| P95 API | < 500ms |
| Dashboard load | < 3s |
| Uptime | 99.5% |

---

## 2. Quản Lý Tài Sản — FR-01

### 2.1 Data Fields

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| name | String | ✅ | |
| assetCode | String | ✅ | Unique, auto-gen nếu trống |
| categoryId | FK→Category | ✅ | |
| status | Enum | ✅ | Default: `AVAILABLE` |
| description | String | | |
| serialNumber | String | | Unique |
| purchaseDate | Date | | |
| purchasePrice | Decimal | | VND |
| vendor | String | | |
| warrantyUntil | Date | | |
| qrImage | String (base64) | ✅ | Auto-generated |
| notes | String | | |
| employeeId | FK→Employee | | Null nếu chưa gán |
| invoiceId | FK→Invoice | | Null nếu không có |
| dynamicAttrs | JSONB | | Validated by category schema |
| isDeleted | Boolean | ✅ | Default `false` |
| deletedAt | DateTime | | Null nếu chưa xóa |

### 2.2 Use Cases

#### UC-01: Tạo Tài Sản

```
1. Admin → /assets → "Tạo tài sản"
2. Nhập: name*, categoryId*, assetCode* (hoặc auto-gen)
   Tùy chọn: description, serialNumber, purchaseDate,
   purchasePrice, vendor, warrantyUntil, notes, dynamicAttrs
3. Submit → Zod validate all fields + dynamic attrs schema
4. Prisma $transaction:
   a. INSERT asset (status=AVAILABLE)
   b. Generate QR → UPDATE qrImage
   c. logAssetEvent(type=CREATED)
   d. AuditLog(action=AssetCreated)
5. Toast success → redirect /assets/{id}

Exceptions:
  E1: name trống → "Tên tài sản là bắt buộc"
  E2: categoryId trống → "Vui lòng chọn danh mục"
  E3: assetCode trùng → "Mã tài sản đã tồn tại"
  E4: dynamic attr validation fail → lỗi per field
  E5: chưa login → redirect /login
```

#### UC-02: Xem Danh Sách

```
1. GET /assets
2. Hiển thị: bảng (Tên, Mã, Danh mục, Trạng thái,
   Người gán, Giá, Ngày mua)
   + phân trang (20/page)
   + bộ lọc: danh mục, trạng thái, date range
   + tìm kiếm: tên, mã, serial
3. Actions per row: Xem, Sửa, Xóa
```

#### UC-03: Xem Chi Tiết

```
1. GET /assets/{id}
2. Hiển thị: tất cả fields + dynamic attrs + QR preview +
   timeline (asset_events) + bảo trì + gán + hóa đơn
3. Actions: Sửa, Gán/Thu hồi, Tạo bảo trì,
   Tải QR, Xóa
```

#### UC-04: Cập Nhật

```
1. PUT /assets/{id}
2. Zod validate fields + dynamic attrs
3. Prisma $transaction:
   a. UPDATE asset
   b. UPDATE asset_attribute_values (nếu dynamic attrs đổi)
   c. AuditLog(action=AssetUpdated, metadata: old→new)
4. E1: DISPOSED → "Tài sản đã thanh lý, không thể sửa"
```

#### UC-05: Xóa (Soft Delete)

```
1. Admin → "Xóa" → confirm dialog
2. UPDATE asset SET isDeleted=true, deletedAt=NOW()
3. AuditLog(action=AssetDeleted)
4. (Không xóa AssetEvent, MaintenanceRecord)
```

### 2.3 Business Rules

| # | Rule |
|---|------|
| BR-01 | assetCode phải unique |
| BR-02 | Mỗi tài sản có đúng 1 QR, không trùng |
| BR-03 | Mọi thay đổi phải tạo AssetEvent + AuditLog (atomic) |
| BR-04 | DISPOSED: không sửa, không gán |
| BR-05 | Tất cả query filter `isDeleted = false` |

### 2.4 Acceptance Criteria

- [ ] Tạo tài sản → status=AVAILABLE, QR được tạo tự động
- [ ] AssetEvent + AuditLog ghi trong cùng transaction
- [ ] Xóa mềm: tài sản không hiện trong danh sách nhưng còn trong DB
- [ ] assetCode trùng → reject
- [ ] DISPOSED không thể sửa hoặc gán

---

## 3. FSM Vòng Đời — FR-02

### 3.1 States

| State | Label | Terminal |
|-------|-------|:--------:|
| AVAILABLE | Sẵn sàng | ❌ |
| ASSIGNED | Đã gán | ❌ |
| MAINTENANCE | Bảo trì | ❌ |
| RETIRED | Ngưng sử dụng | ❌ |
| DISPOSED | Thanh lý | ✅ |

### 3.2 State Diagram
```
┌─────────────┐  assign       ┌─────────────┐  maintenance  ┌─────────────┐
│ AVAILABLE  │─────────────▶│  ASSIGNED   │─────────────▶│ MAINTENANCE │
└─────────────┘              └──────┬──────┘               └──────┬──────┘
      │                            │                              │
      │ retire                     │ ◀────── recall ──────────────┘
      │                            │
      │                            │ complete
      ▼                            ▼
┌─────────────┐              ┌─────────────┐
│   RETIRED   │─────────────▶│  DISPOSED   │
└─────────────┘    dispose    └──────┬──────┘
      ▲                             │
      └────────────── restore ──────┘
```
```
### 3.3 Transition Matrix

| Từ | Sang | Event Type | Label |
|----|------|-----------|-------|
| AVAILABLE | ASSIGNED | `ASSIGNED` | Gán |
| ASSIGNED | MAINTENANCE | `MAINTENANCE_CREATED` | Đưa đi bảo trì |
| MAINTENANCE | ASSIGNED | `MAINTENANCE_COMPLETED` | Hoàn thành bảo trì |
| ASSIGNED | RETIRED | `STATUS_CHANGE` | Ngưng SD |
| AVAILABLE | RETIRED | `STATUS_CHANGE` | Ngưng SD (chưa dùng) |
| RETIRED | DISPOSED | `DISPOSED` | Thanh lý |
| DISPOSED | RETIRED | `RESTORED` | Khôi phục |
| ASSIGNED | AVAILABLE | `RECALLED` | Thu hồi |

### 3.4 Status Colors (UI)

| Status | Hex |
|--------|-----|
| AVAILABLE | `#3b82f6` |
| ASSIGNED | `#8b5cf6` |
| MAINTENANCE | `#f59e0b` |
| RETIRED | `#64748b` |
| DISPOSED | `#ef4444` |

### 3.5 Business Rules

| # | Rule |
|---|------|
| BR-06 | Chỉ transition trong matrix mới được phép |
| BR-07 | DISPOSED = terminal, không assign/maintenance |
| BR-08 | asset_events append-only, không UPDATE/DELETE |
| BR-09 | Mỗi transition ghi: old_status, new_status, performed_by, timestamp, metadata |
| BR-10 | RETIRED restore về RETIRED, không phải AVAILABLE |

### 3.6 Acceptance Criteria

- [ ] Transition không trong matrix → throw Error, không ghi DB
- [ ] asset_events không thể UPDATE/DELETE
- [ ] DISPOSED → mọi action (trừ restore) đều reject

---

## 4. Gán & Thu Hồi — FR-03

### 4.1 Use Cases

#### UC-06: Gán Tài Sản

```
1. GET /assets/{id} → "Gán"
2. Dialog: select employee*, date (default: hôm nay), lý do
3. Submit:
   a. FSM: validateTransition(AVAILABLE, ASSIGNED)
   b. Prisma $transaction:
      - UPDATE asset SET status=ASSIGNED, employeeId=?
      - INSERT asset_assignments
      - logAssetEvent(ASSIGNED, {employeeId, reason})
   E1: không ở AVAILABLE → FSM lỗi
   E2: đã DISPOSED → "Không thể gán tài sản đã thanh lý"
```

#### UC-07: Thu Hồi Tài Sản

```
1. GET /assets/{id} → "Thu hồi"
2. Dialog: lý do, confirm "Thu hồi khỏi {employeeName}"
3. Submit:
   a. FSM: validateTransition(ASSIGNED, AVAILABLE)
   b. Prisma $transaction:
      - UPDATE asset SET status=AVAILABLE, employeeId=null
      - logAssetEvent(RECALLED, {previousEmployeeId, reason})
   E1: không ở ASSIGNED → FSM lỗi
```

### 4.2 Business Rules

| # | Rule |
|---|------|
| BR-11 | DISPOSED không thể gán |
| BR-12 | Gán = AVAILABLE → ASSIGNED |
| BR-13 | Thu hồi = ASSIGNED → AVAILABLE |
| BR-14 | Ghi: ai gán, ai nhận, khi nào, lý do |

### 4.3 Acceptance Criteria

- [ ] Gán thành công → status=ASSIGNED, employeeId set, event created
- [ ] Thu hồi thành công → status=AVAILABLE, employeeId=null, event created
- [ ] DISPOSED → gán/thu hồi reject

---

## 5. Bảo Trì — FR-04

### 5.1 Data Fields

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| assetId | FK→Asset | ✅ | |
| description | String | ✅ | |
| vendor | String | | |
| cost | Decimal | ✅ | ≥ 0, VND |
| startDate | Date | ✅ | |
| endDate | Date | | ≥ startDate |
| result | String | | |
| status | Enum | ✅ | `OPEN` / `COMPLETED` |

### 5.2 Use Cases

#### UC-08: Tạo Bảo Trì

```
1. GET /assets/{id} → "Tạo bảo trì"
2. Form: description*, cost*, startDate* (default: today),
   endDate, vendor, result
3. Submit:
   a. Zod validate
   b. Nếu status=ASSIGNED → FSM validateTransition(ASSIGNED, MAINTENANCE)
   c. Prisma $transaction:
      - INSERT maintenance_record (status=OPEN)
      - Nếu từ ASSIGNED → UPDATE asset status=MAINTENANCE
      - logAssetEvent(MAINTENANCE_CREATED, {maintenanceId, cost})
```

#### UC-09: Hoàn Thành Bảo Trì

```
1. GET /assets/{id} → Maintenance tab → "Hoàn thành"
2. Form: result, endDate (default: today)
3. Submit:
   Prisma $transaction:
   - UPDATE maintenance_record SET endDate, result, status=COMPLETED
   - UPDATE asset SET status=ASSIGNED
   - logAssetEvent(MAINTENANCE_COMPLETED, {maintenanceId, cost, result})
```

#### UC-10: Danh Sách Bảo Trì

```
1. GET /maintenance
2. Bảng: Tài sản, Mô tả, Vendor, Chi phí, Bắt đầu,
   Kết thúc, Trạng thái
3. Bộ lọc: trạng thái, vendor, date range
4. KPI summary: tổng chi phí tháng này, số đang mở
```

### 5.3 Business Rules

| # | Rule |
|---|------|
| BR-15 | cost ≥ 0 |
| BR-16 | endDate ≥ startDate |
| BR-17 | Tổng chi phí tính realtime theo tài sản/tháng |
| BR-18 | Bảo trì tạo được khi status = ASSIGNED hoặc MAINTENANCE |
| BR-19 | Hoàn thành bảo trì → tài sản về ASSIGNED, không phải AVAILABLE |

### 5.4 Acceptance Criteria

- [ ] Tạo bảo trì → asset chuyển MAINTENANCE (nếu từ ASSIGNED)
- [ ] Hoàn thành → asset về ASSIGNED
- [ ] endDate < startDate → reject
- [ ] cost < 0 → reject

---

## 6. Thuộc Tính Động — FR-05

### 6.1 Attribute Definition

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| categoryId | FK→Category | ✅ | |
| key | String | ✅ | lowercase, unique per category |
| label | String | ✅ | Tiếng Việt |
| type | Enum | ✅ | `string` \| `number` \| `boolean` \| `date` \| `select` |
| required | Boolean | ✅ | Default false |
| options | String[] | | Chỉ khi type=`select` |

### 6.2 Attribute Value

| Field | Type | Notes |
|-------|------|-------|
| assetId | FK→Asset | |
| attrs | JSONB | Key-value map |

### 6.3 Use Cases

#### UC-11: Định Nghĩa Thuộc Tính

```
1. GET /categories/{id}/attributes → list definitions
2. "Thêm": key*, label*, type*, required*, options (nếu select)
3. Validate: key unique per category
4. INSERT asset_attribute_definition → AuditLog
```

#### UC-12: Tạo Tài Sản Với Dynamic Attrs

```
1. Admin chọn category → fetch AttributeDefinitions
2. Render form fields động theo definitions
3. Submit:
   a. Generate Zod schema từ definitions
   b. Validate dynamic attrs với schema
   c. INSERT asset_attribute_values (attrs: JSONB)
```

### 6.4 Zod Schema Generation (từ definitions)

```
Ví dụ category "Laptop":
  - screen_size: z.string()
  - ram:          z.number().min(0)
  - storage:     z.number().min(0)
  - color:        z.string().optional()

Ví dụ category "Điện thoại":
  - screen_size: z.string()
  - storage:     z.number().min(0)
  - imei:        z.string()
```

### 6.5 Business Rules

| # | Rule |
|---|------|
| BR-20 | Thêm definition không cần thay đổi code core |
| BR-21 | key unique trong cùng category |
| BR-22 | Type validation chạy trước save |
| BR-23 | JSONB có GIN index cho query |
| BR-24 | Xóa definition không xóa values đã lưu |

### 6.6 Acceptance Criteria

- [ ] Thêm definition mới → không cần deploy code
- [ ] Tạo tài sản → dynamic attrs validated bằng generated Zod schema
- [ ] Required field trống → reject
- [ ] Type mismatch → reject

---

## 7. QR Code — FR-06

### 7.1 QR Generation (automatic)

```
Sau INSERT asset thành công:
1. Encode: "/assets/{id}/lookup"
2. Generate PNG: qrcode library
   - errorCorrectionLevel: H (30% damage tolerance)
   - size: 300px
3. Return base64 DataURL → UPDATE asset SET qrImage
```

### 7.2 Label Spec

| Spec | Value |
|------|-------|
| Kích thước | 25mm × 25mm |
| Độ phân giải | 300dpi |
| Format | PNG |
| QR | 60% (15mm × 15mm) |
| Info | 40% — tên tài sản + mã ngắn |
| Background | Trắng |
| Printer | Zebra QL / Brother QL / A4 cut |

### 7.3 Mobile Scan

```
1. GET /scan (public, no auth)
2. html5-qrcode: bật camera
3. Scan QR → decode → GET /assets/{id}/lookup
4. Trả về trang public: tên, danh mục, trạng thái,
   người gán, thông tin mua hàng, dynamic attrs
Fallback: manual input mã tài sản khi camera lỗi
```

### 7.4 Business Rules

| # | Rule |
|---|------|
| BR-25 | QR URL: `/assets/{id}/lookup`, public, no auth |
| BR-26 | Scan được trên iOS Safari + Android Chrome |
| BR-27 | Mỗi tài sản 1 QR, không regenerate trừ khi mất |
| BR-28 | In được trên Zebra/Brother QL/A4 |

### 7.5 Acceptance Criteria

- [ ] Tạo tài sản → QR tự động tạo và lưu vào qrImage
- [ ] Scan QR → hiển thị thông tin công khai
- [ ] QR hợp lệ với errorCorrectionLevel H

---

## 8. Dashboard — FR-07

### 8.1 KPI Metrics

| # | KPI | Công thức |
|---|-----|---------|
| K-01 | Tổng tài sản | `COUNT assets WHERE isDeleted=false` |
| K-02 | Tổng giá trị | `SUM purchasePrice WHERE isDeleted=false` |
| K-03 | Phân bổ theo trạng thái | `COUNT GROUP BY status` |
| K-04 | Tài sản cần bảo trì | `COUNT WHERE status='MAINTENANCE'` |
| K-05 | Tài sản đã thanh lý | `COUNT WHERE status='DISPOSED'` |
| K-06 | Chi phí bảo trì tháng này | `SUM cost WHERE MONTH=current` |
| K-07 | Sự kiện gần đây | `asset_events ORDER BY createdAt DESC LIMIT 10` |

### 8.2 Layout

```
┌──────────────┬──────────────┬──────────────┬────────────────┐
│ Tổng tài sản│ Tổng giá trị │ Cần bảo trì  │ CP bảo trì(T) │
│    1,234     │   2.5 tỷ VND│     12       │    15 triệu    │
├──────────────┴──────────────┴──────────────┴────────────────┤
│  Biểu đồ trạng thái (Recharts PieChart)                     │
│  Sự kiện gần đây (timeline feed)                          │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Business Rules

| # | Rule |
|---|------|
| BR-29 | Dashboard load < 3s |
| BR-30 | KPI numbers khớp với detailed reports |
| BR-31 | Prisma query logging trong dev (`log: ['query']`) |
| BR-32 | P95 API < 500ms |

### 8.4 Acceptance Criteria

- [ ] Load time < 3s với 5,000 assets
- [ ] KPI đúng với aggregated data
- [ ] Status chart hiển thị đúng màu per status

---

## 9. OCR Hóa Đơn — FR-08

### 9.1 Data Fields

**invoice**

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| filePath | String | ✅ | Web-relative path |
| status | Enum | ✅ | `PENDING_OCR` → `READY_FOR_REVIEW` → `CONFIRMED` |
| vendor | String | | |
| invoiceDate | Date | | |
| totalAmount | Decimal | | VND |

**invoice_ocr_extraction**

| Field | Type | Notes |
|-------|------|-------|
| invoiceId | FK→Invoice | |
| status | Enum | `PENDING` → `EXTRACTED` → `CONFIRMED` |
| raw | JSON | GPT raw output |
| confirmedData | JSON | Admin's final values |
| confidence | JSON | Per-field confidence scores |

### 9.2 Use Cases

#### UC-13: Upload & OCR

```
1. POST /api/invoices/ocr (file: jpg/png/webp/PDF, max 10MB)
2. Validate file → save: public/uploads/invoices/YYYY/MM/{ts}-{random}.{ext}
3. INSERT invoice (status=PENDING_OCR)
4. INSERT invoice_ocr_extraction (status=PENDING)
5. lib/ocr.ts → extractInvoiceData():
   a. Gọi GPT-4o-mini
   b. System prompt: Vietnamese first, English fallback
   c. Extract: vendor, invoice_date, total_amount, line_items, categories
   d. Confidence scores per field
6. UPDATE extraction (raw, status=EXTRACTED)
7. UPDATE invoice (status=READY_FOR_REVIEW)
8. Redirect /invoices/{id} (review page)

E1: File type/size lỗi → reject
E2: GPT timeout 30s → "OCR thất bại"
E3: GPT parse lỗi → lưu raw, hiển thị "Không nhận diện được"
```

#### UC-14: Xác Nhận OCR

```
1. GET /invoices/{id} → review page
   Hiển thị: ảnh gốc + per-field confidence + editable fields
2. Admin review + edit → POST /invoices/{id}/confirm
3. Prisma $transaction:
   a. UPDATE extraction SET confirmedData, status=CONFIRMED
   b. UPDATE invoice SET vendor, invoiceDate, totalAmount, status=CONFIRMED
   c. AuditLog(action=InvoiceConfirmed)
4. E1: "Hủy" → xóa invoice + file (không confirm)
```

### 9.3 GPT Output Schema

```json
{
  "vendor": "string | null",
  "invoice_date": "YYYY-MM-DD | null",
  "total_amount": "number | null",
  "currency": "VND | USD",
  "line_items": [
    { "description": "string", "quantity": "number", "unit_price": "number", "total_price": "number" }
  ],
  "categories": ["string"],
  "confidence": {
    "vendor": "number (0.0-1.0)",
    "date": "number (0.0-1.0)",
    "total": "number (0.0-1.0)"
  }
}
```

### 9.4 Confidence Thresholds

| Score | Level | UI Color |
|-------|-------|----------|
| ≥ 0.9 | High | Xanh |
| ≥ 0.7 | Medium | Vàng |
| < 0.7 | Low | Đỏ (yêu cầu kiểm tra kỹ) |

### 9.5 Business Rules

| # | Rule |
|---|------|
| BR-33 | Không auto-create — bắt buộc admin confirm |
| BR-34 | Lưu cả raw OCR + confirmed data |
| BR-35 | Ảnh hóa đơn gốc lưu ≥ 1 năm |
| BR-36 | Production: pin GPT model version |
| BR-37 | Bilingual: ưu tiên tiếng Việt |

### 9.6 Acceptance Criteria

- [ ] Không invoice nào được tạo nếu admin chưa confirm
- [ ] Cả raw + confirmed đều được lưu
- [ ] Confidence score hiển thị per field
- [ ] GPT timeout → thông báo lỗi, không crash

---

## 10. Danh Mục & Nhân Viên

### 10.1 Asset Category

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| name | String | ✅ | |
| description | String | | |
| icon | String | | |
| color | String | | |
| isDeleted | Boolean | ✅ | Default false |

**CRUD:**
- CREATE → AuditLog
- UPDATE → AuditLog
- DELETE → soft delete; reject nếu có tài sản đang reference

### 10.2 Employee

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| name | String | ✅ | |
| email | String | ✅ | Unique |
| department | String | | |
| position | String | | |
| phone | String | | |
| isDeleted | Boolean | ✅ | Default false |

**CRUD:**
- Soft delete: giữ lại để xem assignment history
- CREATE/UPDATE/DELETE → AuditLog

---

## 11. Audit Log

### 11.1 Schema

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| userId | String | Ai thực hiện |
| action | String | AssetCreated, AssetAssigned, ... |
| entityType | String | Asset, Category, Invoice, ... |
| entityId | String | ID của entity |
| description | String | Người đọc hiểu được |
| ipAddress | String | Client IP |
| userAgent | String | Browser UA |
| metadata | JSON | old→new values, context |
| createdAt | DateTime | |

### 11.2 Logged Actions

| Action | Trigger | Entity |
|--------|---------|--------|
| AssetCreated | Tạo tài sản | Asset |
| AssetUpdated | Cập nhật tài sản | Asset |
| AssetDeleted | Soft delete | Asset |
| AssetAssigned | Gán tài sản | Asset |
| AssetRecalled | Thu hồi tài sản | Asset |
| MaintenanceCreated | Tạo bảo trì | Maintenance |
| MaintenanceCompleted | Hoàn thành bảo trì | Maintenance |
| StatusChanged | Đổi trạng thái | Asset |
| InvoiceConfirmed | Xác nhận hóa đơn | Invoice |
| CategoryCreated/Updated/Deleted | CRUD danh mục | Category |
| EmployeeCreated/Updated/Deleted | CRUD nhân viên | Employee |

### 11.3 Rules

| # | Rule |
|---|------|
| BR-38 | AuditLog append-only, không UPDATE/DELETE |
| BR-39 | AuditLog ghi trong cùng transaction với main data |
| BR-40 | Metadata chứa đủ context để reconstruct action |

---

## 12. Auth

### 12.1 Flow

```
Login:
  POST /api/auth/sign-in/email-password
  → validate → rate limit check → create session (PostgreSQL)
  → set HttpOnly + Secure + SameSite=Lax cookie
  → redirect /

Protected routes:
  auth.api.getSession({ headers })
  → no session → redirect /login

Logout:
  POST /api/auth/sign-out
  → delete session → clear cookie → redirect /login
```

### 12.2 Security Controls

| Control | Implementation |
|---------|---------------|
| Password | bcrypt (Better Auth internal) |
| Session storage | PostgreSQL (Session table) |
| Session expiry | 7 days |
| Cookie | HttpOnly + Secure (prod) + SameSite=Lax |
| CSRF | Double-submit cookie (built-in) |
| Rate limit | 5 failed logins / 15 min / IP |
| Session cache | 5 min server-side (cookie cache) |

---

## 13. NFRs

### Performance

| Metric | Target |
|--------|--------|
| P95 API CRUD/list | < 500ms |
| Dashboard load | < 3s |
| QR generation | < 1s |
| OCR processing | < 30s (timeout) |

### Data Retention

| Data | Retention |
|------|----------|
| Invoice images | ≥ 1 năm |
| Audit logs | Vĩnh viễn |
| Asset events | Vĩnh viễn |
| Sessions | 7 ngày (auto-cleanup) |

### Backup (TBD)

- Daily scheduled, 30-day retention minimum, provider not selected

### Observability (TBD)

`Sentry · Vercel Analytics · Prisma query log (dev) · Uptime monitoring`

---

## Tài Liệu Liên Quan

| File | Mô tả |
|------|--------|
| [system-architecture-flow.md](./system-architecture-flow.md) | Luồng kiến trúc |
| [prd-v1.md](../prd-v1.md) | PRD đầy đủ |
| [system-architecture.md](../system-architecture.md) | Kiến trúc (EN) |

*Claude Code — 2026-03-27*
