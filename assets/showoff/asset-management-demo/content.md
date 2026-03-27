# Keeper — Asset Management Showcase Content

> Mission: asset-management-demo | Bilingual VI/EN | 6 sections
> Source of truth: `docs/prd-v1.md`, `docs/project-overview-pdr.md`, `docs/system-architecture.md`, live app screenshots (localhost:3000)

---

## Section 1 — Hero (`#hero`)

**EN**
- Badge: Internal Demo · v0.1.0 · Phase 1 & 2 Complete
- Title: **Keeper** — Every asset. Every event. One source of truth.
- Subtitle: Centralized enterprise asset management that tracks the full lifecycle — from procurement to disposal — with an immutable event log, QR-powered operations, and AI invoice OCR.
- Stats strip (live seed data): 22 active assets · ₫625.101.000 total value · 5 lifecycle states · 14 DB tables
- CTA: Explore the demo ↓

**VI**
- Badge: Demo nội bộ · v0.1.0 · Hoàn thành Phase 1 & 2
- Title: **Keeper** — Mọi tài sản. Mọi sự kiện. Một nguồn dữ liệu duy nhất.
- Subtitle: Hệ thống quản lý tài sản doanh nghiệp tập trung, theo dõi toàn bộ vòng đời — từ mua sắm đến thanh lý — với nhật ký sự kiện bất biến, vận hành bằng mã QR và OCR hóa đơn bằng AI.
- Stats: 22 tài sản đang hoạt động · ₫625.101.000 tổng giá trị · 5 trạng thái vòng đời · 14 bảng dữ liệu
- CTA: Khám phá demo ↓

---

## Section 2 — Problem → Solution + Personas (`#overview`)

**EN — The problem**
- Spreadsheet asset tracking is error-prone: studies report ~88% of spreadsheets contain significant errors [1].
- "Ghost assets" — on the books but physically missing — inflate taxes and insurance and break audits [2].
- Manual assign/recall flows leave no reliable history of who holds what.

**EN — The solution (Keeper)**
- One centralized system for the entire asset lifecycle.
- Append-only event log: every assignment, recall, maintenance, and disposal is recorded forever.
- QR tags + mobile scan replace manual lookups; audits go from weeks to days [3].

**EN — Persona (MVP)**
- **Admin** — single role with full access: asset CRUD, assignment, maintenance, invoice OCR, dashboard. (Multi-role RBAC is a post-MVP extension point.)

**VI — Vấn đề**
- Theo dõi tài sản bằng bảng tính dễ sai sót: ~88% bảng tính chứa lỗi nghiêm trọng [1].
- "Tài sản ma" — có trên sổ sách nhưng không tìm thấy thực tế — làm tăng thuế, bảo hiểm và phá vỡ kiểm toán [2].
- Cấp phát / thu hồi thủ công không để lại lịch sử đáng tin cậy.

**VI — Giải pháp (Keeper)**
- Một hệ thống tập trung cho toàn bộ vòng đời tài sản.
- Nhật ký sự kiện chỉ-ghi-thêm: mọi lần cấp phát, thu hồi, bảo trì, thanh lý đều được lưu vĩnh viễn.
- Tem QR + quét bằng điện thoại thay cho tra cứu thủ công; kiểm kê từ vài tuần xuống vài ngày [3].

**VI — Người dùng (MVP)**
- **Admin** — một vai trò duy nhất, toàn quyền: CRUD tài sản, cấp phát, bảo trì, OCR hóa đơn, dashboard. (RBAC đa vai trò là hướng mở rộng sau MVP.)

---

## Section 3 — Key Features & Use Cases (`#features`)

**EN (feature cards — Phase 1 ✅ + Phase 2 ✅)**
1. **Asset CRUD + auto QR** — create assets, QR generated automatically; printable 25×25mm labels.
2. **Lifecycle FSM** — AVAILABLE → ASSIGNED ↔ MAINTENANCE → RETIRED → DISPOSED; invalid transitions rejected at service layer.
3. **Assign & Recall** — hand assets to employees/departments and recall with full history.
4. **Maintenance tracking** — description, vendor, cost, result; realtime cost aggregation.
5. **Audit log** — every business action recorded via `logAssetEvent()`.
6. **KPI Dashboard** — total value, status distribution, 6-month maintenance cost trends (Recharts).
7. **Dynamic attributes** — per-category custom fields (JSONB + Zod validation).
8. **Mobile QR scan** — `html5-qrcode` web scanner, no native app needed.
9. **AI Invoice OCR** — semi-auto extraction with GPT-4o-mini, bilingual VN/EN, Vietnamese priority; originals stored 1 year for audit.

**Use cases:** onboard new equipment from invoice → assign laptop to new hire → send monitor to repair vendor → retire & dispose end-of-life PCs → audit trail for finance.

**VI (thẻ tính năng)**
1. **CRUD tài sản + QR tự động** — tạo tài sản, QR sinh tự động; tem in 25×25mm.
2. **Vòng đời FSM** — AVAILABLE → ASSIGNED ↔ MAINTENANCE → RETIRED → DISPOSED; chặn chuyển trạng thái không hợp lệ.
3. **Cấp phát & Thu hồi** — giao tài sản cho nhân viên/phòng ban, thu hồi với lịch sử đầy đủ.
4. **Theo dõi bảo trì** — mô tả, nhà cung cấp, chi phí, kết quả; tổng hợp chi phí realtime.
5. **Nhật ký kiểm toán** — mọi thao tác nghiệp vụ đều được ghi lại.
6. **Dashboard KPI** — tổng giá trị, phân bố trạng thái, xu hướng chi phí bảo trì 6 tháng.
7. **Thuộc tính động** — trường tùy chỉnh theo danh mục (JSONB + Zod).
8. **Quét QR di động** — quét ngay trên web mobile, không cần app.
9. **OCR hóa đơn AI** — trích xuất bán tự động với GPT-4o-mini, song ngữ Việt/Anh, ưu tiên tiếng Việt; lưu ảnh gốc 1 năm.

**Tình huống:** nhập thiết bị mới từ hóa đơn → cấp laptop cho nhân viên mới → gửi màn hình đi sửa → thanh lý PC hết đời → truy vết cho tài chính.

---

## Section 4 — UI Walkthrough (`#walkthrough`)

Screenshots (real app, dark theme, seed data):
- `images/app/dashboard.png` — KPI dashboard: total assets, total value ₫625M, maintenance cost MTD, status pie, activity feed, 6-month trend charts.
- `images/app/assets-list.png` — asset registry with codes (ASSET-YYYYMMDD-XXXX), category, status badges, quick actions.
- `images/app/asset-detail.png` — asset detail: info, dynamic attributes, lifecycle timeline, maintenance tabs; Edit / QR / Assign / Retire actions.
- `images/app/maintenance.png` — maintenance records with vendor & cost.
- `images/app/invoices.png` — OCR invoice intake list.
- `images/app/scan.png` — mobile QR scan page.

**EN captions:** Real-time KPI dashboard / Asset registry with FSM status badges / Full lifecycle timeline per asset / Maintenance cost tracking / AI-assisted invoice intake / Scan-to-lookup on mobile.

**VI captions:** Dashboard KPI thời gian thực / Sổ tài sản với nhãn trạng thái FSM / Dòng thời gian vòng đời từng tài sản / Theo dõi chi phí bảo trì / Nhập hóa đơn hỗ trợ AI / Quét-để-tra-cứu trên di động.

Note: App UI itself already bilingual (VI toggle) and dark-mode native.

---

## Section 5 — Architecture (`#architecture`)

**EN**
- Stack: Next.js 16 App Router (RSC + Client Components) · TanStack Query 5 · Tailwind v4 + shadcn/ui · Prisma 7 → PostgreSQL · Better Auth (session, CSRF, rate-limit) · GPT-4o-mini OCR · Recharts.
- Flow: Browser → Next.js API routes → Service layer (`lib/services/*`) → FSM validate (`lib/fsm.ts`) → Prisma → PostgreSQL. Every mutation also writes `asset_events` (append-only) + `audit_logs`.
- 14 tables; soft delete everywhere (`isDeleted` + `deletedAt`).
- Capacity targets: 5,000 assets · 200k events · P95 < 500ms · dashboard < 3s · 99.5% uptime.

**VI**
- Stack: Next.js 16 App Router · TanStack Query 5 · Tailwind v4 + shadcn/ui · Prisma 7 → PostgreSQL · Better Auth · OCR GPT-4o-mini · Recharts.
- Luồng: Trình duyệt → API routes → Tầng service → Kiểm tra FSM → Prisma → PostgreSQL. Mọi thay đổi đều ghi thêm `asset_events` (chỉ-ghi-thêm) + `audit_logs`.
- 14 bảng; soft delete toàn hệ thống.
- Mục tiêu: 5.000 tài sản · 200k sự kiện · P95 < 500ms · dashboard < 3s · uptime 99,5%.

FSM diagram (render as visual):
AVAILABLE →assign→ ASSIGNED ↔maintenance↔ MAINTENANCE; ASSIGNED →recall→ AVAILABLE; →retire→ RETIRED →dispose→ DISPOSED (→restore→ RETIRED).

---

## Section 6 — Demo Script, Outcomes & Next Steps (`#demo`)

**EN — 5-minute demo script**
1. Login (`admin@keeper.local`) → Dashboard: read the KPIs & activity feed. (~1 min)
2. Assets → open a PC → walk Info / Attributes / Lifecycle Timeline tabs. (~1 min)
3. Assign it to an employee → show the new event in the timeline + audit log. (~1 min)
4. Print QR → open /scan on a phone → scan → instant asset lookup. (~1 min)
5. Invoices → upload an invoice photo → OCR pre-fills the asset draft → confirm. (~1 min)

**EN — Expected outcomes** (targets from PRD)
- 100% of new assets captured in the system.
- ≥95% assignment/recall log coverage.
- ≥30% reduction in allocation/recall operation time.
- Faster audits & ghost-asset elimination (industry: audit time cut roughly in half with scan-based verification [3]; ghost assets can silently drain 15–20% of fixed-asset value [4]).

**EN — Known limitations / next steps (Phase 3 ⏳)**
- Single Admin role (no RBAC yet) · single location · no office-supply inventory · no depreciation engine · no ERP/HRM integration.
- Next: periodic inventory cycle, performance hardening, Vercel deployment. Backup provider not yet selected.

**VI — Kịch bản demo 5 phút**
1. Đăng nhập → Dashboard: đọc KPI & hoạt động gần đây. (~1 phút)
2. Assets → mở một PC → xem tab Info / Attributes / Lifecycle Timeline. (~1 phút)
3. Cấp phát cho nhân viên → sự kiện mới hiện trong timeline + audit log. (~1 phút)
4. In QR → mở /scan trên điện thoại → quét → tra cứu tức thì. (~1 phút)
5. Invoices → tải ảnh hóa đơn → OCR điền sẵn → xác nhận. (~1 phút)

**VI — Kết quả kỳ vọng**
- 100% tài sản mới được ghi nhận qua hệ thống.
- ≥95% thao tác cấp phát/thu hồi có log.
- Giảm ≥30% thời gian thao tác cấp phát/thu hồi.
- Kiểm kê nhanh hơn, loại bỏ tài sản ma (ngành: thời gian kiểm kê giảm gần một nửa [3]; tài sản ma có thể âm thầm bào mòn 15–20% giá trị tài sản cố định [4]).

**VI — Hạn chế / bước tiếp theo (Phase 3 ⏳)**
- Chỉ 1 vai trò Admin · 1 địa điểm · chưa có kho văn phòng phẩm · chưa có khấu hao · chưa tích hợp ERP/HRM.
- Tiếp theo: kiểm kê định kỳ, tối ưu hiệu năng, triển khai Vercel. Chưa chọn nhà cung cấp backup.

---

## Assumptions (marked, conservative)

- Seed-data numbers (22 assets, ₫625M) are demo data, labeled "live seed data" in hero.
- Industry statistics are external benchmarks, not measured product results — cited [1]–[4].
- Personas limited to Admin per PRD; no invented roles.

## References

1. Sage — Fixed asset management isn't built for spreadsheets: https://www.sage.com/en-us/blog/fixed-asset-management-spreadsheets/
2. Sage — Ghost and zombie assets: https://www.sage.com/en-us/blog/technology-mitigate-risks-ghost-zombie-assets/
3. AssetCues — QR code asset tracking (audit time reduction): https://www.assetcues.com/blog/qr-code-asset-tracking/
4. Wasp Barcode — Asset tracking ROI white paper: https://www.waspbarcode.com/asset-tracking/roi-white-paper

## Unresolved Questions

- agentwiki publish target folder naming (will use `showoff/asset-management-demo` if CLI available).
