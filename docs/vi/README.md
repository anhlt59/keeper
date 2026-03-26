# Zoo — Hệ Thống Quản Lý Tài Sản

> Phiên bản: 1.2.0 | Thư mục gốc: `/Users/anhlt/Projects/vibe/zoo/`
> Trạng thái: Phase 1/2 hoàn thành, Phase 3 đang chờ

**Zoo Asset Management System** là hệ thống quản lý tài sản doanh nghiệp tập trung, theo dõi toàn bộ vòng đời tài sản từ mua sắm đến thanh lý.

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Bắt đầu nhanh](#2-bắt-đầu-nhanh)
3. [Stack công nghệ](#3-stack-công-nghệ)
4. [Tính năng chính](#4-tính-năng-chính)
5. [Cấu trúc dự án](#5-cấu-trúc-dự-án)
6. [Mô hình dữ liệu](#6-mô-hình-dữ-liệu)
7. [Vòng đời tài sản (FSM)](#7-vòng-đời-tài-sản-fsm)
8. [API endpoints](#8-api-endpoints)
9. [Scripts hữu ích](#9-scripts-hữu-ích)
10. [Đóng góp](#10-đóng-góp)

---

## 1. Giới thiệu

Hệ thống Zoo giải quyết các vấn đề:

- **Tài sản rải rác** — không có công cụ thống nhất theo dõi thiết bị.
- **Thủ công** — nhập liệu Excel, gắn nhãn tay, không có QR.
- **Thiếu minh bạch** — không rõ tài sản đang ở đâu, của ai, tình trạng ra sao.
- **Bảo trì lộn xộn** — không có log chi phí, nhà cung cấp, lịch sử sửa chữa.

**Đối tượng người dùng:** Quản trị viên (Admin) — toàn quyền truy cập hệ thống.

---

## 2. Bắt đầu nhanh

### Yêu cầu

- Node.js 20+
- PostgreSQL 15+
- pnpm / npm / yarn / bun

### Các bước

```bash
# 1. Clone và cài đặt phụ thuộc
git clone <repo-url>
cd zoo
pnpm install

# 2. Cấu hình biến môi trường
cp .env.example .env
# Chỉnh sửa DATABASE_URL, OPENAI_API_KEY trong .env.local

# 3. Thiết lập database
npx prisma migrate dev          # Chạy migration
npx prisma db seed             # Seed dữ liệu mẫu
npx prisma generate             # Generate Prisma client

# 4. Chạy development server
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) để truy cập ứng dụng.

**Tài khoản mặc định:**

- Email: `admin@zoo.local`
- Mật khẩu: `admin123`

---

## 3. Stack công nghệ

| Lớp | Công nghệ | Phiên bản |
|-----|-----------|-----------|
| Framework | Next.js (App Router, TypeScript) | 16.2.1 |
| ORM | Prisma + PostgreSQL | 7.5.0 |
| Auth | Better Auth (session-based) | 1.5.6 |
| AI/OCR | GPT-4o-mini (OpenAI API) | unversioned |
| Dynamic Attrs | PostgreSQL JSONB + Zod | Zod 4.3.6 |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.2.2 |
| State | TanStack React Query | 5.95.2 |
| QR | `qrcode` | 1.5.4 |
| Mobile Scan | `html5-qrcode` | 2.3.8 |
| Charts | Recharts | 3.8.0 |
| Validation | Zod | 4.x |

---

## 4. Tính năng chính

### Phase 1 — Cốt lõi ✅

- **CRUD tài sản** — tạo, xem, sửa, xóa (soft delete) tài sản.
- **Mã QR tự động** — sinh mã QR mỗi tài sản, in nhãn 25mm × 25mm.
- **Vòng đời tài sản (FSM)** — trạng thái chuyển đổi có kiểm soát:
  `AVAILABLE → ASSIGNED ↔ MAINTENANCE → RETIRED / DISPOSED`
- **Gán / Thu hồi** — gán tài sản cho nhân viên, thu hồi khi cần.
- **Bảo trì** — theo dõi mô tả, nhà cung cấp, chi phí, kết quả.
- **Audit log** — log bất biến cho mọi hành động nghiệp vụ.
- **Dashboard KPI** — tổng giá trị, phân bổ trạng thái, chi phí bảo trì.

### Phase 2 — Nâng cao ✅

- **Thuộc tính động theo danh mục** — lưu trong JSONB, validate bằng Zod.
- **Quét QR di động** — web app quét mã QR qua `html5-qrcode`.
- **OCR hóa đơn bán tự động** — GPT-4o-mini đọc hóa đơn VN/EN, ưu tiên tiếng Việt.

### Phase 3 — Hoàn thiện ⏳

- Kiểm kê định kỳ (Periodic Inventory Cycle)
- Tối ưu hiệu năng + hardening vận hành

---

## 5. Cấu trúc dự án

```
zoo/
├── prisma/
│   ├── schema.prisma          # Định nghĩa schema database
│   ├── seed.ts                # Seed dữ liệu mẫu
│   └── data/                  # CSV seed data
│       ├── categories.csv
│       ├── employees.csv
│       └── products.csv
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Trang login
│   │   ├── (dashboard)/       # Trang chính (protected)
│   │   │   ├── assets/        # CRUD tài sản
│   │   │   ├── employees/    # Quản lý nhân viên
│   │   │   ├── categories/   # Quản lý danh mục
│   │   │   ├── maintenance/  # Bảo trì
│   │   │   ├── scan/         # Quét QR
│   │   │   ├── invoices/     # OCR hóa đơn
│   │   │   ├── attributes/  # Thuộc tính động
│   │   │   └── dashboard/   # Dashboard KPI
│   │   └── api/              # API routes
│   │       ├── auth/
│   │       ├── assets/
│   │       ├── employees/
│   │       ├── categories/
│   │       ├── maintenance/
│   │       ├── invoices/
│   │       └── attributes/
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── assets/           # Asset-specific components
│   │   ├── dashboard/        # Dashboard widgets
│   │   └── attributes/       # Dynamic field components
│   ├── lib/
│   │   ├── db.ts             # Prisma client singleton
│   │   ├── auth.ts           # Better Auth config
│   │   ├── fsm.ts            # Asset lifecycle FSM
│   │   ├── validators/       # Zod schemas
│   │   └── utils.ts          # Utility functions
│   └── types/                # TypeScript types
└── docs/                     # Tài liệu dự án
```

---

## 6. Mô hình dữ liệu

Các model chính trong `prisma/schema.prisma`:

| Model | Mô tả |
|-------|-------|
| `Asset` | Tài sản — mã, tên, trạng thái, giá, bảo hành |
| `Category` | Danh mục — phân cấp cha/con |
| `Employee` | Nhân viên — tên, email, phòng ban, vị trí |
| `Maintenance` | Bảo trì — loại, chi phí, ngày, nhà cung cấp |
| `AssetEvent` | Event log bất biến — mọi thay đổi trạng thái |
| `Invoice` | Hóa đơn — ảnh, dữ liệu OCR, trạng thái duyệt |
| `AttributeDefinition` | Định nghĩa thuộc tính động theo danh mục |
| `AssetAttributeValue` | Giá trị thuộc tính động của từng tài sản |

Xem chi tiết tại [model-design.md](../model-design.md).

---

## 7. Vòng đời tài sản (FSM)

```
                    ┌──────────────────────────────────┐
                    │                                  │
                    ▼                                  │
┌─────────────┐  assign  ┌─────────────┐              │
│ AVAILABLE  │ ────────► │  ASSIGNED   │              │
└─────────────┘          └──────┬──────┘              │
      ▲                        │                      │
      │                        │ recall               │
      │            ┌───────────┴───────────┐          │
      │            │                       │          │
      │      assign│                  send │▼recall   │
      │            ▼                       ▼          │
      │     ┌─────────────┐         ┌────────────┐   │
      └─recall│  MAINTENANCE│◄──────│  RETIRED   │   │
              └─────────────┘       └────────────┘   │
                                         │            │
                                         │ dispose    │
                                         ▼            │
                                   ┌────────────┐     │
                                   │  DISPOSED  │     │
                                   └────────────┘     │
                                                     │
                                         dispose─────┘
```

- **AVAILABLE** — Sẵn sàng gán.
- **ASSIGNED** — Đang được sử dụng.
- **MAINTENANCE** — Đang bảo trì/sửa chữa.
- **RETIRED** — Không còn sử dụng (chờ thanh lý).
- **DISPOSED** — Đã thanh lý.

FSM được validate tại service layer (`src/lib/fsm.ts`), không dùng thư viện xstate.

---

## 8. API endpoints

| Route | Method | Mô tả |
|-------|--------|-------|
| `/api/assets` | GET, POST | Danh sách / Tạo tài sản |
| `/api/assets/[id]` | GET, PUT, DELETE | Chi tiết / Cập nhật / Xóa tài sản |
| `/api/assets/[id]/assign` | POST | Gán tài sản cho nhân viên |
| `/api/assets/[id]/recall` | POST | Thu hồi tài sản |
| `/api/assets/[id]/maintenance` | POST | Gửi bảo trì |
| `/api/assets/[id]/retire` | POST | Ngưng sử dụng |
| `/api/assets/[id]/dispose` | POST | Thanh lý |
| `/api/employees` | GET, POST | Danh sách / Tạo nhân viên |
| `/api/categories` | GET, POST | Danh sách / Tạo danh mục |
| `/api/maintenance` | GET, POST | Danh sách / Tạo bảo trì |
| `/api/attributes/definitions` | GET, POST | Danh sách / Tạo định nghĩa thuộc tính |
| `/api/invoices` | GET, POST | Danh sách / Tạo hóa đơn (OCR) |
| `/api/invoices/[id]/approve` | POST | Duyệt hóa đơn |

---

## 9. Scripts hữu ích

```bash
# Database
npx prisma migrate dev          # Chạy migration (dev)
npx prisma migrate deploy       # Deploy migration (prod)
npx prisma db seed              # Seed dữ liệu mẫu
npx prisma db push              # Sync schema (không migrate)
npx prisma generate             # Generate Prisma client

# Development
pnpm dev                        # Chạy dev server
pnpm build                      # Build production
pnpm lint                       # ESLint

# Testing
pnpm test                       # Chạy tests
pnpm test:e2e                   # E2E tests (Playwright)
```

---

## 10. Đóng góp

1. Fork repo và tạo branch theo feature: `feat/tên-tính-năng`
2. Tuân thủ code standards trong [code-standards.md](../code-standards.md)
3. Chạy lint trước khi commit: `pnpm lint`
4. Commit theo conventional commits format
5. Tạo Pull Request vào nhánh `master`

---

## Liên kết

- [PRD v1](./prd-v1.md) — Yêu cầu sản phẩm chi tiết
- [System Architecture](./system-architecture.md) — Kiến trúc hệ thống
- [Code Standards](./code-standards.md) — Tiêu chuẩn code
- [Model Design](./model-design.md) — Thiết kế database
- [Deployment Guide](./deployment-guide.md) — Hướng dẫn triển khai
- [Changelog](./project-changelog.md) — Lịch sử thay đổi
