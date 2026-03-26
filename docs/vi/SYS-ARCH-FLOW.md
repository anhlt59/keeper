# Quy Trình Thiết Kế Project Từ Đầu — System Architecture Flow

> **Mục đích:** Mô tả chi tiết toàn bộ quy trình thiết kế project "Keeper" — Asset & Office Supply Management System — từ góc nhìn của một system architect/technical lead. Bao gồm tất cả các phase từ xác định yêu cầu, phân tích hệ thống, thiết kế kiến trúc, đến triển khai và vận hành.
>
> **Base on:** PRD v1, codebase hiện tại (Phase 0–2 hoàn thành), code standards, roadmap.
>
> **Ngôn ngữ:** Tiếng Việt cho phần mềm, thuật ngữ kỹ thuật giữ nguyên tiếng Anh.

---

## Tổng Quan Quy Trình Thiết Kế

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 0: Discovery & Requirements Gathering            │
│  PHASE 1: System Analysis & Problem Decomposition       │
│  PHASE 2: Architecture Design                           │
│  PHASE 3: Technical Decisions & Trade-offs              │
│  PHASE 4: Implementation Planning                        │
│  PHASE 5: Development & Integration                     │
│  PHASE 6: Testing & Quality Assurance                   │
│  PHASE 7: Deployment & Operations                        │
└─────────────────────────────────────────────────────────┘
```

---

## PHASE 0: Discovery & Requirements Gathering

### Mục tiêu
Hiểu bài toán thực tế, xác định người dùng, và nắm được domain knowledge.

### Bước 0.1 — Stakeholder Interview (1–2 tuần)

**Ai tham gia:**
- Chủ doanh nghiệp / người quản lý tài sản
- Nhân viên kho / nhân viên IT
- Kế toán (nếu cần tính khấu hao)

**Câu hỏi then chốt:**

```
1. Định danh và xác định tài sản hiện tại như thế nào? Phân loại ra sao?
2. Quy trình mua tài sản mới như thế nào? Ai duyệt?
3. Tài sản được gán (assign) cho ai? Theo quy trình nào?
4. Khi tài sản hỏng / cần bảo trì, quy trình ra sao?
5. Audit (kiểm kê) được thực hiện mấy lần/năm? Bằng cách nào?
6. Hóa đơn mua tài sản được lưu ở đâu?
7. Báo cáo nào được sử dụng thường xuyên nhất?
8. Vấn đề lớn nhất hiện tại là gì?
9. Người dùng có cần dùng mobile không? Thiết bị gì?
```

**Output:** User story list, pain points, existing workflow documentation.

### Bước 0.2 — Domain Modeling sơ bộ

Sau khi hiểu bài toán, tôi sẽ sketch domain model trên giấy:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Employee   │       │    Asset     │       │  Category    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │◄──────│ employeeId   │       │ id           │
│ name         │       │ categoryId   │──────►│ name         │
│ department   │       │ status       │       │ description  │
│ position     │       │ purchaseInfo │       └──────────────┘
└──────────────┘       └──────────────┘
                               │
                               │ 1:N
                               ▼
                       ┌──────────────┐
                       │AssetEvent    │  ← Append-only log
                       ├──────────────┤
                       │ assetId      │
                       │ eventType    │
                       │ metadata     │
                       │ timestamp    │
                       └──────────────┘
```

**Khó khăn ở đây:**
- Một số quy trình (ví dụ: kiểm kê định kỳ) có thể không được formalize — stakeholder có thể không nhận ra họ cần nó.

---

## PHASE 1: System Analysis & Problem Decomposition

### Mục tiêu
Phân tích sâu các vấn đề, chia nhỏ thành các problem domain có thể giải quyết độc lập.

### Bước 1.1 — Problem Statement

Dựa trên stakeholder interview:

```
VẤN ĐỀ CỐT LÕI:
- Quản lý tài sản thủ công, phân tán, thiếu lịch sử (audit trail)
- Không theo dõi được vòng đời (lifecycle) tài sản: mua → gán → bảo trì → thanh lý
- Khó khăn trong kiểm kê, audit hàng năm
- Hóa đơn dạng giấy/scan, không extract được data tự động
- Không có QR/barcode → nhập liệu thủ công dễ sai

=> CẦN: Hệ thống centralized, full audit trail, QR-enabled, OCR-assisted
```

### Bước 1.2 — Actor Analysis

```
PRIMARY ACTORS:
├── Admin          → full CRUD, approve OCR, manage categories, view all reports
├── Employee       → xem tài sản được gán (read-only, có thể scan QR)
└── System         → auto-generate QR, trigger FSM validation, log events

SECONDARY ACTORS:
├── Auditor        → read-only access to audit logs, asset history
└── Finance        → read-only access to maintenance cost, asset value reports
```

### Bước 1.3 — Problem Decomposition (Domain Breakdown)

Tôi chia bài toán lớn thành 5 sub-domain:

```
┌─────────────────────────────────────────────────────┐
│  Domain 1: Asset Lifecycle Management               │
│  - CRUD tài sản, FSM trạng thái                     │
│  - Assignment/Recall, Maintenance                   │
│  - Event timeline (append-only)                     │
├─────────────────────────────────────────────────────┤
│  Domain 2: Authentication & Authorization          │
│  - Admin login, session management                   │
│  - Role-based access (MVP: Admin-only)              │
├─────────────────────────────────────────────────────┤
│  Domain 3: Data Capture & Digitization              │
│  - QR code generation + printing                     │
│  - QR scanning via mobile web                        │
│  - OCR invoice processing (GPT-4o-mini)             │
├─────────────────────────────────────────────────────┤
│  Domain 4: Dynamic Schema (Metadata)                 │
│  - Admin define attributes per category              │
│  - JSONB storage + Zod validation                   │
├─────────────────────────────────────────────────────┤
│  Domain 5: Reporting & Dashboard                    │
│  - KPI dashboard (value, status, maintenance)      │
│  - Audit log viewer                                 │
│  - Asset event timeline                              │
└─────────────────────────────────────────────────────┘
```

**Khó khăn ở đây:**
- Domain 3 (OCR) phụ thuộc vào external API (OpenAI). Đây là một risk cần được address ngay từ đầu: fallback strategy là gì? Rate limit handling?
- Domain 4 (Dynamic Schema) có thể dẫn đến schema chaos nếu không có governance. Cần quy định ngay: chỉ Admin mới được tạo attribute, không có user-defined attributes tự do.

### Bước 1.4 — Non-Functional Requirements Analysis

```
PERFORMANCE:
- P95 API latency < 500ms (CRUD/list operations)
- Dashboard load < 3s
- Support 5,000 assets + 200,000 events

SCALABILITY:
- Thiết kế hướng theo 5,000 assets nhưng nên có index strategy cho 10x growth

SECURITY:
- Session-based auth (HttpOnly cookie)
- CSRF protection
- Rate limiting
- No direct DB access from client

RELIABILITY:
- Append-only event log (không bao giờ sửa/xóa event)
- Soft delete để preserve audit trail
- 99.5% uptime target

COMPLIANCE:
- Lưu hóa đơn gốc 1 năm
- Audit log đầy đủ cho every action
```

---

## PHASE 2: Architecture Design

### Mục tiêu
Chọn kiến trúc tổng thể, xác định các layer và component chính.
x
### Bước 2.1 — Architectural Style: Layered Monolithic với Service Separation

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Next.js App Router)                │
│  ├── Server Components (RSC) — data fetching, SEO        │
│  ├── Client Components — forms, dialogs, charts         │
│  └── Route Handlers — API endpoints                     │
├─────────────────────────────────────────────────────────┤
│  SERVICE LAYER (lib/services/*.ts)                       │
│  ├── Business logic, FSM validation                      │
│  ├── Orchestration (Prisma + audit)                    │
│  └── No HTTP/DB knowledge here                          │
├─────────────────────────────────────────────────────────┤
│  DATA LAYER (Prisma ORM + PostgreSQL)                   │
│  ├── Schema definitions                                 │
│  ├── Query building                                     │
│  └── Transaction management                              │
└─────────────────────────────────────────────────────────┘
```

**Tại sao không chọn microservices?**
- MVP scope nhỏ (5 domain), team nhỏ (1–3 dev)
- Độ phức tạp của microservices (service discovery, distributed tracing, data consistency) không justified cho bài toán này.
- Next.js App Router đã tách được presentation/server logic tốt.

**Tại sao không chọn serverless (Lambda)?**
- OCR pipeline cần stateful processing (upload → GPT → confirm)
- Database connection pooling phức tạp hơn với Lambda cold starts
- Giữ đơn giản: Next.js + PostgreSQL là đủ.

### Bước 2.2 — Database Architecture

```
┌──────────────────────────────────────────────────────┐
│  POSTGRESQL 16+                                      │
│                                                      │
│  CORE TABLES (soft-deletable):                       │
│  ├── users (Better Auth)                             │
│  ├── employees                                       │
│  ├── categories                                      │
│  ├── assets                                          │
│  └── maintenance_records                             │
│                                                      │
│  APPEND-ONLY TABLES (no soft delete):               │
│  ├── asset_events          ← lifecycle timeline      │
│  ├── audit_logs            ← who did what/when       │
│  └── invoice_ocr_extractions ← raw + confirmed       │
│                                                      │
│  SCHEMA TABLES:                                      │
│  ├── asset_attribute_definitions                     │
│  └── asset_attribute_values                          │
│                                                      │
│  CONFIRMED DATA:                                     │
│  ├── invoices                                         │
│                                                      │
│  INDEX STRATEGY:                                     │
│  - GIN index on JSONB columns (dynamic attrs)        │
│  - Composite index on (assetId, createdAt) for events│
│  - Index on isDeleted for all soft-deletable tables  │
│  - Index on status, categoryId for asset queries     │
└──────────────────────────────────────────────────────┘
```

**Quyết định quan trọng:**
- **Soft delete** thay vì hard delete: preserve audit trail, recoverable.
- **Append-only event log**: đảm bảo compliance, không có event nào bị sửa/xóa.
- **JSONB cho dynamic attributes**: linh hoạt hơn EAV, performance tốt với GIN index, Zod validate ở app layer.

### Bước 2.3 — FSM (Finite State Machine) Design

```
┌──────────────────────────────────────────────────────────┐
│  ASSET LIFECYCLE FSM                                     │
│                                                          │
│  AVAILABLE ──[assign]──► ASSIGNED ◄──[recall]──┐         │
│                              │                      │    │
│            ┌──[maintenance]──▼──[complete]───────┘    │
│            │                                            │
│            ▼                                         │
│         MAINTENANCE ◄─────────────────────────────────┘
│                                                          │
│  [retire]──► RETIRED ◄──[restore]──◄── DISPOSED           │
│                     ▲                                   │
│                     └──[dispose]─────────────────────────►│
│                                                          │
│  Transition Rules: Service layer validates BEFORE write  │
│  No direct state mutation allowed                        │
└──────────────────────────────────────────────────────────┘
```

**Khó khăn ở đây:**
- FSM phải là single source of truth cho trạng thái. Cần quyết định: trạng thái được lưu trong `Asset.status` field (denormalized) hay chỉ suy từ event log?
- **Chọn:** Lưu `status` trong `Asset` table như một materialized view của event log. Khi tạo asset → status = AVAILABLE. Mỗi transition event update cả `status` và tạo `AssetEvent`. Đảm bảo query nhanh (không cần aggregate events mỗi lần) nhưng vẫn có full timeline.

### Bước 2.4 — API Design

```
REST API STRUCTURE (flat, not nested beyond 2 levels):

GET    /api/assets                    ← list with pagination, filter
POST   /api/assets                    ← create
GET    /api/assets/[id]               ← get single
PUT    /api/assets/[id]               ← update
DELETE /api/assets/[id]               ← soft delete

POST   /api/assets/[id]/assign        ← assign to employee
POST   /api/assets/[id]/recall        ← recall from employee
GET    /api/assets/[id]/events        ← timeline
POST   /api/assets/[id]/maintenance   ← create maintenance record
GET    /api/assets/[id]/qr            ← download QR PNG

GET    /api/categories
POST   /api/categories
GET    /api/categories/[id]/attributes
POST   /api/categories/[id]/attributes

GET    /api/employees
POST   /api/employees

GET    /api/maintenance               ← all records, filterable
POST   /api/maintenance
GET    /api/maintenance/[id]
PUT    /api/maintenance/[id]
DELETE /api/maintenance/[id]

POST   /api/invoices/upload           ← upload + trigger OCR
GET    /api/invoices/[id]
POST   /api/invoices/[id]/ocr         ← re-run OCR
POST   /api/invoices/[id]/confirm     ← admin confirm

GET    /api/dashboard                 ← KPI aggregates
GET    /api/audit-logs               ← audit log viewer
```

**Pattern:** Zod validation → auth check → service call → structured response.

### Bước 2.5 — Component Architecture

```
components/
├── ui/                      ← shadcn/ui primitives (shared)
├── assets/                  ← Asset-specific components
│   ├── asset-list.tsx        ← RSC: table with RSC data
│   ├── asset-form.tsx        ← Client: create/edit form
│   ├── assign-dialog.tsx     ← Client: assign/recall modal
│   ├── maintenance-form.tsx  ← Client: maintenance record form
│   ├── asset-timeline.tsx    ← RSC: event timeline
│   ├── qr-preview-modal.tsx  ← Client: QR preview + print
│   └── qr-scanner.tsx        ← Client: html5-qrcode wrapper
├── dashboard/
│   ├── kpi-card.tsx          ← Client: single KPI stat
│   ├── asset-status-chart.tsx ← Client: chart
│   └── recent-events.tsx     ← RSC: events feed
├── invoices/
│   ├── invoice-upload.tsx    ← Client: upload + OCR trigger
│   ├── invoice-form.tsx      ← Client: confirmed invoice form
│   └── invoice-preview.tsx   ← Client: confirmed invoice view
├── categories/
├── shared/
│   └── language-toggle.tsx   ← Client: i18n
└── scan/
    └── mobile-scanner.tsx   ← Client: scan page
```

**Khó khăn ở đây:**
- Quyết định RSC vs Client component: đây là confusion point thường gặp với Next.js developers. Rule of thumb: data fetching = RSC, interactivity = Client. Cần clear guidelines trong code standards.

---

## PHASE 3: Technical Decisions & Trade-offs

### Mục tiêu
Đưa ra các quyết định kỹ thuật cụ thể, document rationale và trade-offs.

### Bước 3.1 — Tech Stack Selection

```
┌──────────────────────────────────────────────────────┐
│  TECH STACK DECISIONS (Locked)                        │
│                                                      │
│  Framework:      Next.js 16.2.1 (App Router)         │
│  Database:       PostgreSQL + Prisma 7.5.0           │
│  Auth:           Better Auth 1.5.6 (session-based)   │
│  AI/OCR:         GPT-4o-mini (OpenAI API)            │
│  Dynamic Attrs:  PostgreSQL JSONB + Zod 4.3.6        │
│  State:          TanStack React Query 5.95.2         │
│  Styling:        Tailwind CSS v4 + shadcn/ui         │
│  Lifecycle FSM:  Custom FSM (no xstate)               │
│  Deployment:     Local dev → Vercel (future)         │
└──────────────────────────────────────────────────────┘
```

**Tại sao Better Auth thay vì NextAuth?**
- Better Auth là TypeScript-first, API design tốt hơn, session-based (not JWT) phù hợp với server-side rendering.
- Plugin ecosystem tốt (`openAPI()`, rate limiting built-in).
- Prisma adapter chính chủ.

**Tại sao Custom FSM thay vì XState?**
- Asset lifecycle FSM chỉ có 5 states, 8 transitions — quá đơn giản cho XState.
- Custom FSM dễ debug, dễ test, không có dependency overhead.
- XState phù hợp khi có complex branching logic, parallel states, hoặc khi cần state persistence across server restarts.

**Tại sao JSONB + Zod thay vì EAV hoặc separate tables?**
- EAV (Entity-Attribute-Value): flexible nhưng query phức tạp, type unsafe.
- Separate tables per attribute: rigid, cần schema migration mỗi khi thêm attribute.
- JSONB + Zod: flexible, queryable (GIN index), type-safe qua Zod schemas, no migration needed cho new attributes.

### Bước 3.2 — Hard Problems & Solutions

```
┌──────────────────────────────────────────────────────┐
│  PROBLEM 1: OCR Reliability                           │
├──────────────────────────────────────────────────────┤
│  GPT-4o-mini có thể misread số tiền, ngày tháng.       │
│                                                      │
│  Solution:                                           │
│  - NEVER auto-create invoice. Luôn qua confirm.       │
│  - Hiển thị confidence score per field.               │
│  - Store cả raw OCR + confirmed data (audit).         │
│  - Priority Vietnamese, fallback English.            │
│  - Production: pin model version (gpt-4o-mini-YYYY)  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PROBLEM 2: Dynamic Attribute Schema Chaos             │
├──────────────────────────────────────────────────────┤
│  Admin có thể tạo 100 attributes không có quy         │
│  chuẩn → phí bảo trì, khó query.                      │
│                                                      │
│  Solution:                                           │
│  - Chỉ Admin được tạo attribute definitions.         │
│  - Mỗi attribute có: key, label, type, required.     │
│  - Type validation via Zod trước khi save.           │
│  - UI chỉ hiển thị attributes nào đã được define.    │
│  - [TBD] Review board cho new attributes.             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PROBLEM 3: QR Scanning Reliability                   │
├──────────────────────────────────────────────────────┤
│  Mobile camera không hoạt động tốt trong môi          │
│  trường ánh sáng yếu, có reflections.                 │
│                                                      │
│  Solution:                                           │
│  - html5-qrcode library (cross-platform).              │
│  - Manual input fallback (asset code lookup).          │
│  - QR design: high contrast (black on white).         │
│  - Error correction level H (30% damage tolerant).   │
│  - Hướng dẫn người dùng: chụp ảnh trong ánh sáng     │
│    tốt, giữ camera ổn định.                          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PROBLEM 4: Dashboard Performance với Growing Data    │
├──────────────────────────────────────────────────────┤
│  Với 200,000 events, aggregate queries có thể chậm.    │
│                                                      │
│  Solution:                                           │
│  - Index strategy: composite indexes cho common        │
│    queries (status, categoryId, date range).          │
│  - Denormalize KPI data into summary tables            │
│    (materialized view pattern).                        │
│  - TanStack Query caching (staleTime: 0 nhưng          │
│    refetchOnWindowFocus: false).                       │
│  - [TBD] Periodic background job để precompute KPIs.  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PROBLEM 5: Invoice Image Storage                      │
├──────────────────────────────────────────────────────┤
│  Lưu local không scale được khi deploy lên cloud.     │
│                                                      │
│  Solution (MVP):                                      │
│  - Local filesystem: public/uploads/invoices/          │
│  - Struct: /YYYY/MM/{timestamp}-{random}.{ext}        │
│  - Web-relative path trong DB.                        │
│                                                      │
│  Solution (Production - TBD):                          │
│  - S3 hoặc Cloudflare R2.                            │
│  - Backup strategy: pg_dump + file backup.            │
│  - Retention: 1 year, then archive/delete.            │
└──────────────────────────────────────────────────────┘
```

### Bước 3.3 — Security Architecture

```
┌──────────────────────────────────────────────────────┐
│  AUTHENTICATION FLOW                                  │
│                                                      │
│  1. Login POST /api/auth/sign-in/email-password       │
│  2. Better Auth validates credentials                  │
│  3. Session created in PostgreSQL (Prisma)           │
│  4. HttpOnly, Secure, SameSite=Lax cookie set        │
│  5. Subsequent requests: cookie auto-sent             │
│  6. Protected routes: auth.api.getSession()           │
│                                                      │
│  SECURITY LAYERS:                                     │
│  ├── CSRF: double-submit cookie (Better Auth built-in)│
│  ├── Rate Limiting: 5 attempts/15min per IP          │
│  ├── Session: 7-day expiry, 24h update age           │
│  ├── Cookie Cache: 5min server-side                  │
│  └── Input Validation: Zod on ALL API inputs          │
└──────────────────────────────────────────────────────┘
```

---

## PHASE 4: Implementation Planning

### Mục tiêu
Lên kế hoạch chi tiết từng phase, xác định dependencies và milestones.

### Bước 4.1 — Phase Planning

```
┌──────────────────────────────────────────────────────┐
│  PHASE 0: Project Initialization (~1 tuần)           │
├──────────────────────────────────────────────────────┤
│  • Next.js scaffold (App Router, TypeScript)          │
│  • PostgreSQL + Prisma schema design (12 tables)    │
│  • Better Auth setup (session, CSRF, rate limit)      │
│  • Directory structure: app/, lib/, prisma/, comps/  │
│  • Docker Compose (PostgreSQL for local dev)          │
│  • Seed data (sample categories, assets)             │
│  • Basic layout + navigation                          │
│                                                      │
│  Exit Criteria: npm run dev → works, login → works   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PHASE 1: Core Features (~3-4 tuần)                  │
├──────────────────────────────────────────────────────┤
│  FR-01: Asset CRUD + Category management             │
│  FR-02: Lifecycle FSM (5 states, 8 transitions)     │
│  FR-03: Assignment/Recall                            │
│  FR-04: Maintenance tracking                          │
│  FR-05: Audit logging (explicit service layer)        │
│  FR-06: Dashboard KPI                                │
│                                                      │
│  Exit Criteria: All acceptance criteria met           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PHASE 2: Enhanced Features (~2-3 tuần)              │
├──────────────────────────────────────────────────────┤
│  FR-07: Dynamic attribute definitions (JSONB+Zod)    │
│  FR-08: QR code generation + label printing           │
│  FR-09: Mobile QR scanning (html5-qrcode)           │
│  FR-10: OCR invoice (GPT-4o-mini → confirm → save) │
│                                                      │
│  Exit Criteria: All acceptance criteria met           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  PHASE 3: Hardening & Production (~2 tuần, TBD)      │
├──────────────────────────────────────────────────────┤
│  • Periodic Inventory Cycle (scheduled count)         │
│  • Dashboard query optimization (index tuning)        │
│  • Vercel deployment + monitoring (Sentry)            │
│  • Backup strategy (pg_dump + file backup)           │
│  • Stress test với 200k events                       │
└──────────────────────────────────────────────────────┘
```

### Bước 4.2 — File Ownership Map

```
app/                           ← page.tsx, layout.tsx (RSC)
app/api/                       ← route.ts (API handlers)
lib/
├── db.ts                       ← PrismaClient singleton
├── auth.ts                     ← Better Auth config
├── fsm.ts                      ← Asset lifecycle FSM
├── audit-logger.ts             ← logAssetEvent()
├── qr-generator.ts             ← QR code generation
├── ocr.ts                      ← GPT-4o-mini extraction
└── services/
    ├── asset-service.ts        ← Asset CRUD + business logic
    ├── category-service.ts
    └── maintenance-service.ts
lib/validators/                 ← Zod schemas (shared)
lib/i18n/                       ← Translations
components/
├── ui/                        ← shadcn/ui primitives
├── assets/                    ← Asset-specific UI
├── dashboard/                  ← Dashboard widgets
├── invoices/                   ← Invoice components
└── scan/                      ← QR scanning
prisma/
├── schema.prisma               ← Database schema
└── migrations/                ← Migration history
```

**Khó khăn ở đây:**
- Service layer vs. API route boundaries: đây là nơi dễ gây confusion. Rule: tất cả DB writes phải qua service layer. Route chỉ validate + call service + return response.
- Khi nào dùng `$transaction`? Khi write cần atomicity (tạo asset + log event).

---

## PHASE 5: Development & Integration

### Mục tiêu
Triển khai theo kế hoạch, tuân thủ code standards.

### Bước 5.1 — Development Order (Critical Path)

```
1. Setup + Auth Foundation
   ├── prisma/schema → prisma migrate
   ├── lib/db.ts → lib/auth.ts
   ├── app/api/auth/[...better-auth]/route.ts
   └── login page

2. Category + Asset Core
   ├── category API + service
   ├── asset API + service
   ├── asset list page (RSC)
   └── asset detail page (RSC + Client components)

3. FSM + Assignment
   ├── lib/fsm.ts (validateTransition)
   ├── assign API + service
   ├── recall API + service
   └── assign dialog (Client)

4. Maintenance
   ├── maintenance API + service
   ├── maintenance form (Client)
   └── maintenance list page

5. Audit Logging
   ├── lib/audit-logger.ts
   ├── Integrate vào tất cả service writes
   └── Audit log viewer page

6. Dashboard
   ├── dashboard API (aggregations)
   ├── KPI cards (Client)
   ├── Status chart (Client)
   └── Recent events feed

7. Dynamic Attributes
   ├── attribute definition API
   ├── JSONB storage + Zod validation
   ├── Dynamic form rendering
   └── Filter by attributes

8. QR System
   ├── lib/qr-generator.ts
   ├── QR generation on asset create
   ├── QR preview + print page
   └── Mobile scan page

9. OCR Invoice
   ├── lib/ocr.ts (GPT-4o-mini call)
   ├── upload + OCR trigger API
   ├── admin confirm page
   └── invoice detail + image display

10. i18n
    └── Vietnamese + English translations
```

### Bước 5.2 — Code Quality Gates

```
BEFORE COMMIT:
├── tsc --noEmit              → Zero type errors
├── npm run lint              → Zero lint errors
└── Review: no secrets in code

BEFORE PUSH:
├── npm run build             → Build passes
└── Test suite (when introduced) → All pass

BEFORE MERGE:
├── PR review (code reviewer agent)
├── Documentation updated
└── Migration committed with code
```

**Khó khăn ở đây:**
- Prisma migrations cần được commit cùng PR với code sử dụng migration đó. Nếu migration chưa chạy trên production, code sẽ fail. Cần clear process: migration review trước khi merge.
- Dynamic attributes với Zod validation cần synchronous giữa UI (form fields) và API (validation). Nếu Admin thay đổi attribute definition, asset cũ vẫn phải pass validation. Cần backward compatibility strategy.

---

## PHASE 6: Testing & Quality Assurance

### Mục tiêu
Đảm bảo code hoạt động đúng, không regression.

### Bước 6.1 — Testing Strategy

```
UNIT TESTS (Vitest):
├── lib/fsm.test.ts            ← All FSM transitions
├── lib/validators/*.test.ts   ← All Zod schemas
└── lib/services/*.test.ts     ← Service business logic

INTEGRATION TESTS (Vitest + Prisma test DB):
├── API route handlers
└── Service + Prisma interactions

E2E TESTS (Playwright):
├── Critical flows:
│   ├── Login → Dashboard
│   ├── Create asset → assign → recall
│   ├── Maintenance: create → complete
│   ├── OCR: upload → confirm → verify invoice
│   └── QR: create → scan → verify lookup page
└── Mobile responsive tests

PERFORMANCE TESTS:
├── k6: load test với 100 concurrent users
└── Prisma query timing: verify P95 < 500ms
```

### Bước 6.2 — Edge Cases to Test

```
FSM EDGE CASES:
├── Cannot assign DISPOSED asset
├── Cannot retire DISPOSED asset directly (must restore first)
├── Cannot assign asset already assigned (must recall first)
└── Cannot send AVAILABLE asset to maintenance

OCR EDGE CASES:
├── Vietnamese + English mixed invoice
├── Very low quality image (blur, low resolution)
├── Invoice with no line items (total only)
├── Non-standard date format
└── Amount with multiple currency symbols

DYNAMIC ATTRIBUTES EDGE CASES:
├── Asset created before attribute added → should still be valid
├── Attribute removed after asset created → no validation error
├── Required attribute added after assets exist → only new assets affected
└── JSONB query with GIN index: verify performance

SECURITY EDGE CASES:
├── Rate limit: 6 failed logins in 15 min
├── CSRF: request without CSRF token
├── Session expiry: action after 7 days
└── Zod bypass: malformed JSON in request body
```

---

## PHASE 7: Deployment & Operations

### Mục tiêu
Deploy lên production, thiết lập monitoring và operation runbooks.

### Bước 7.1 — Deployment Architecture (Production)

```
┌──────────────────────────────────────────────────────┐
│  VERCEL DEPLOYMENT                                   │
│                                                      │
│  [git push main]                                     │
│        │                                              │
│        ▼                                             │
│  Vercel CI/CD Pipeline                              │
│  ├── npm run lint                                    │
│  ├── tsc --noEmit                                    │
│  ├── npm run build                                   │
│  ├── npx prisma migrate deploy                       │
│  └── Deploy to edge network                          │
│                                                      │
│  POSTGRESQL: Vercel Postgres (or managed pg)         │
│  ENV VARIABLES: DATABASE_URL, OPENAI_API_KEY, etc.  │
│                                                      │
│  MONITORING:                                         │
│  ├── Vercel Analytics (performance)                  │
│  ├── Sentry (error tracking) ← TBD                   │
│  └── Structured logging (pino) ← TBD                 │
│                                                      │
│  BACKUP:                                             │
│  ├── pg_dump: daily, 30-day retention ← TBD         │
│  └── Invoice files: sync to R2/S3 ← TBD              │
└──────────────────────────────────────────────────────┘
```

### Bước 7.2 — Operational Runbooks

```
INCIDENT: API returns 500
→ Check Vercel logs
→ Check PostgreSQL connection (DATABASE_URL valid?)
→ Check Prisma migration status: npx prisma migrate status

INCIDENT: OCR returns error
→ Check OPENAI_API_KEY quota
→ Check invoice file size (max 10MB)
→ Verify GPT-4o-mini model available

INCIDENT: Dashboard slow
→ Check Prisma query performance
→ Check if missing index on status/categoryId
→ Review number of audit_events records

INCIDENT: Login fails for all users
→ Check DATABASE_URL connection
→ Check if session table exists
→ Check rate limit: wait 15 min or reset

ROUTINE: Backup verification
→ pg_dump test restore monthly
→ Invoice file count matches DB records
```

---

## Tổng Kết: Flow Từ Đầu Đến Cuối

```
DISCOVERY ─────────────────────────────────────────────►
  │ Stakeholder interviews
  │ Domain modeling
  │ Problem decomposition
  ▼
REQUIREMENTS ──────────────────────────────────────────►
  │ Actor analysis
  │ Functional requirements (user stories)
  │ Non-functional requirements
  ▼
ARCHITECTURE ─────────────────────────────────────────►
  │ Layered architecture
  │ Database schema (12 tables)
  │ FSM design (5 states)
  │ API design (REST)
  │ Component architecture
  ▼
TECH DECISIONS ───────────────────────────────────────►
  │ Tech stack selection
  │ Hard problems (OCR, QR, dynamic attrs, perf)
  │ Security architecture
  ▼
IMPLEMENTATION PLANNING ───────────────────────────────►
  │ Phase breakdown (Phase 0 → Phase 3)
  │ File ownership
  │ Critical path
  ▼
DEVELOPMENT ─────────────────────────────────────────►
  │ Code standards enforcement
  │ FSM + audit in service layer
  │ Zod validation on all inputs
  ▼
TESTING ─────────────────────────────────────────────►
  │ Unit: FSM, validators, services
  │ E2E: critical flows (CRUD, FSM, OCR, QR)
  │ Performance: P95 < 500ms
  ▼
DEPLOYMENT ─────────────────────────────────────────►
  │ Vercel CI/CD
  │ Monitoring (Sentry, Analytics)
  │ Backup strategy
  ▼
OPERATIONS
  │ Runbooks
  │ Incident response
  │ Regular maintenance
```

---

## Các Điểm Khó Khăn Tổng Hợp

| # | Điểm khó | Lý do | Giải pháp |
|---|---|---|---|
| 1 | **FSM state vs. event log** | Dual source of truth giữa `Asset.status` và `AssetEvent` timeline | Materialized view: lưu `status` trong Asset nhưng update qua event |
| 2 | **OCR reliability** | GPT có thể misread critical fields | Mandatory confirmation, confidence scores, store raw + confirmed |
| 3 | **Dynamic schema governance** | Attribute chaos khi nhiều người tạo không kiểm soát | Admin-only, Zod validation, UI chỉ hiển thị defined attrs |
| 4 | **QR scanning on mobile** | Camera không reliable trong mọi điều kiện | Manual fallback, high-contrast QR design, error correction level H |
| 5 | **Dashboard performance** | 200k events có thể làm chậm aggregate queries | Index strategy, denormalized KPI summaries, caching |
| 6 | **Invoice image storage** | Local filesystem không scale lên cloud | MVP: local → Production: S3/R2 với backup strategy |
| 7 | **Session + CSRF management** | Better Auth có nhiều config options dễ nhầm | Clear setup pattern trong code standards, never deviate |
| 8 | **Migration + code co-dependency** | Migration phải chạy trước code sử dụng nó | PR process: migration review + same-PR commit rule |

---

## Unresolved Questions (TBD)

1. **Backup provider** — Vercel Postgres backup vs. dedicated pg_dump service? Chưa quyết định.
2. **Periodic Inventory Cycle** — Chi tiết logic kiểm kê định kỳ cần thiết kế kỹ khi Phase 3 bắt đầu.
3. **Invoice cloud storage** — S3 vs. Cloudflare R2 vs. Vercel Blob? Cần evaluate cost + performance.
4. **Sentry integration** — Error tracking có cần thiết cho MVP không?
5. **Multi-role RBAC** — Khi nào cần? MVP chỉ Admin, nhưng architecture đã预留 extension point.
