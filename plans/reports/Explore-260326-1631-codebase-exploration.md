# Zoo — Codebase Exploration Report
> **Date:** 2026-03-26 | **Explorer:** Explore sub-agent
> **CWD:** `/Users/anhlt/Projects/vibe/zoo`
> **Purpose:** Comprehensive codebase inventory for docs-manager to update `docs/` files

---

## 1. Project Structure

Top-level files: `AGENTS.md`, `CLAUDE.md`, `README.md`, `docker-compose.yml`,`eslint.config.mjs`, `next.config.ts`, `package.json`, `postcss.config.mjs`,`prisma.config.ts`, `proxy.ts`, `tsconfig.json`

```
zoo/                               # Git root
├── app/                           # Next.js 16 App Router
│   ├── (auth)/                   # Auth route group
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected route group
│   │   ├── layout.tsx           # Sidebar + header shell
│   │   └── page.tsx             # Dashboard KPI page
│   ├── api/                     # REST API routes (see Section 4)
│   ├── assets/
│   │   └── [id]/lookup/page.tsx # Public QR lookup (no auth)
│   ├── globals.css
│   ├── layout.tsx               # Root layout
│   └── providers.tsx            # QueryClient + Sonner + LanguageProvider
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── assets/                  # asset-timeline, assign-dialog, maintenance-form, qr-*
│   ├── attributes/              # definition-form, dynamic-field-renderer
│   ├── categories/              # category-form
│   ├── dashboard/              # kpi-card, asset-status-chart, recent-events, maintenance-cost-chart
│   ├── invoices/               # invoice-form, invoice-preview, invoice-upload, editable-*
│   └── shared/                 # confirm-dialog, language-toggle, status-badge
├── context/
│   └── language-context.tsx    # i18n context (en/vi), useLanguage hook
├── docs/                        # Project documentation (11 files)
├── lib/
│   ├── db.ts                   # Prisma singleton (pg Pool + PrismaPg adapter)
│   ├── auth.ts                  # Better Auth config
│   ├── fsm.ts                  # Asset lifecycle FSM
│   ├── qr-generator.ts          # QR code generation
│   ├── ocr.ts                  # GPT-4o-mini invoice extraction
│   ├── utils.ts                # cn() utility
│   ├── audit.ts                # Request-scoped audit context
│   ├── audit-logger.ts         # logAssetEvent() — atomic dual write
│   ├── api-fetch.ts            # Client-side fetch wrapper
│   ├── i18n/
│   │   ├── translations.ts       # Core translation dict (en/vi)
│   │   └── translations-extended.ts  # Extended page-specific translations
│   ├── services/
│   │   ├── asset-service.ts     # Asset business logic (FSM, dual audit)
│   │   └── asset-qr-service.ts  # QR-specific logic
│   └── validators/             # Zod v4 schemas
│       ├── asset.ts, category.ts, dynamic-attrs.ts
│       ├── employee.ts, invoice.ts, maintenance.ts
├── prisma/
│   ├── schema.prisma           # Full DB schema (11 tables, 6 enums)
│   ├── seed.ts                 # CSV-based seed (reads prisma/data/*.csv)
│   ├── data/                   # categories.csv, employees.csv, products.csv
│   └── migrations/
├── scripts/                    # migrate.sh, start.sh
├── public/                     # uploads/invoices/YYYY/MM/ (runtime created)
├── docker-compose.yml          # PostgreSQL 16 Alpine
├── next.config.ts
├── postcss.config.mjs         # Tailwind CSS v4 (NOT tailwind.config.ts)
└── .env.local / .env.example

.claude/                        # ClaudeKit Engineer framework (NOT project code)
```

**Key structural notes:**
- Only two service files exist: `asset-service.ts` and `asset-qr-service.ts`
  — `model-design.md` references category/maintenance/invoice services that do NOT exist yet
- Seed data is CSV-based, not hardcoded
- `qrs/` directory does NOT exist — QR stored as base64 DataURL in DB
- `proxy.ts` at root — purpose and status unknown
- `app/assets/` only contains `[id]/lookup/page.tsx` — list/detail/edit pages may be dynamically generated or missing

---

## 2. Technology Stack

### Framework & Runtime
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | 16.2.1 |
| Language | TypeScript | 5.9.3 |
| CSS | Tailwind CSS v4 | 4.2.2 |
| Bundler | Next.js Turbopack (dev) | — |

### Data Layer
| Layer | Technology | Version |
|---|---|---|
| ORM | Prisma | 7.5.0 |
| DB Driver | pg + PrismaPg adapter | pg 8.16.3 |
| Database | PostgreSQL 16 Alpine | via Docker |

### Auth & Validation
| Layer | Technology | Version |
|---|---|---|
| Auth | Better Auth | 1.5.6 |
| Crypto | bcryptjs | 3.0.3 |
| Validation | Zod | 4.3.6 |

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Client state | TanStack React Query | 5.95.2 |
| Toasts | Sonner | 2.0.7 |
| Icons | Lucide React | 1.6.0 |
| QR gen | qrcode | 1.5.4 |
| QR scan | html5-qrcode | 2.3.8 |
| Charts | Recharts | 3.8.0 |
| UI | shadcn + CVA | 4.1.0 + 0.7.1 |

### AI/OCR
| Layer | Technology |
|---|---|
| OCR | GPT-4o-mini (OpenAI Vision API) |
| Env var | OPENAI_API_KEY |

### Dev/Build
| Layer | Technology | Version |
|---|---|---|
| Linter | ESLint | 9.39.4 |
| Seed runner | tsx | 4.21.0 |

---

## 3. Core Features / Modules

### 3.1 Asset Management (CRUD + FSM)
- Create, read, update, soft-delete assets (only if DISPOSED)
- Auto-generate asset code: `ASSET-YYYYMMDD-XXXX` format
- 5 FSM states: AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED, DISPOSED
- 8 valid transitions (see Section 3 of system-architecture.md)
- QR code auto-generated on creation (base64 DataURL in `asset.qrImage`)
- Assignment (to employee), recall (unassign)
- Status chart (pie) on dashboard

### 3.2 Dynamic Attributes
- `AttributeDefinition` — category-scoped custom field schemas (TEXT, NUMBER, BOOLEAN, DATE, SELECT)
- `AssetAttributeValue` — JSONB values per asset
- Components: `definition-form.tsx`, `dynamic-field-renderer.tsx`

### 3.3 QR System
- `lib/qr-generator.ts`: encodes `/assets/{id}/lookup` URL
- QR as base64 DataURL stored in `asset.qrImage` column
- `qr-preview-modal.tsx` — preview + print layout
- `qr-scanner.tsx` — html5-qrcode mobile camera scanner
- Public lookup at `/assets/[id]/lookup` — no auth required

### 3.4 OCR Invoice Processing
1. Upload image (JPEG/PNG, max 10MB) → `POST /api/invoices/ocr`
2. Save image to `public/uploads/invoices/YYYY/MM/{ts}-{random}.{ext}`
3. GPT-4o-mini Vision extracts: vendor, invoiceDate, invoiceNumber, totalAmount, line items → assets + categories
4. Store in `OcrExtraction` (raw + extractedData + confidence)
5. Admin reviews, edits → `POST /api/invoices/[id]/confirm`
6. Confirm: creates Invoice + creates Asset records (qty expansion), creates/fetches Categories
- OCR route saves image first, then extracts; cleanup on failure
- Confirm uses `Serializable` transaction isolation

### 3.5 Maintenance Tracking
- Types: PREVENTIVE, CORRECTIVE, UPGRADE
- Status: SCHEDULED → IN_PROGRESS → COMPLETED / CANCELLED
- MAINTENANCE_COMPLETED transition auto-completes active maintenance records

### 3.6 Dashboard / KPIs
- KPI cards (counts by status)
- Asset status pie chart (Recharts)
- Recent lifecycle events feed
- Maintenance cost chart (component exists, may be WIP)

### 3.7 Audit Logging (Dual Write)
Every asset mutation writes atomically to `AssetEvent` + `AuditLog`:
```
Route: setAuditContext({ userId, ipAddress, userAgent })
  → Service: logAssetEvent({ assetId, eventType, ... })
    → prisma.$transaction([ INSERT AssetEvent, INSERT AuditLog ])
```
- Append-only: `AssetEvent` has no update/delete API
- IP + UA captured from request headers

### 3.8 Internationalization
- English (en) + Vietnamese (vi)
- Flat dot-notation dict in `translations.ts` + `translations-extended.ts`
- `LanguageToggle` component + `LanguageProvider`
- `t(key)` via `useLanguage()` hook

---

## 4. API Design

All routes: auth check → Zod parse → service call → JSON response.
Auth: `auth.api.getSession({ headers: req.headers })` returns 401 if null.

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/[...better-auth]` | All Better Auth endpoints |

### Assets
| Method | Route | Description |
|---|---|---|
| GET | `/api/assets` | List (paginated, filterable) |
| POST | `/api/assets` | Create (generates QR, logs event) |
| GET | `/api/assets/[id]` | Get asset detail |
| PUT | `/api/assets/[id]` | Update (FSM validated) |
| DELETE | `/api/assets/[id]` | Soft delete (only if DISPOSED) |
| POST | `/api/assets/[id]/assign` | Assign to employee |
| POST | `/api/assets/[id]/recall` | Recall (unassign) |
| GET | `/api/assets/[id]/events` | Lifecycle events |
| GET/POST | `/api/assets/[id]/maintenance` | Get/create maintenance |
| GET | `/api/assets/[id]/qr` | Download QR PNG |
| GET | `/api/assets/[id]/lookup` | Public QR lookup |

### Other Resources
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/categories` | List/create categories |
| GET/PUT/DELETE | `/api/categories/[id]` | Single category CRUD |
| GET/POST | `/api/categories/[id]/attributes` | Attribute definitions |
| GET/POST | `/api/attributes/definitions` | All attribute definitions |
| GET/PUT/DELETE | `/api/attributes/definitions/[id]` | Single definition CRUD |
| GET/POST | `/api/employees` | Employee CRUD |
| GET/POST | `/api/maintenance` | All maintenance records |
| GET/PUT/DELETE | `/api/maintenance/[id]` | Single maintenance CRUD |
| GET/POST | `/api/invoices` | List/create invoices |
| GET/PUT/DELETE | `/api/invoices/[id]` | Single invoice CRUD |
| POST | `/api/invoices/[id]/ocr` | Upload image + GPT-4o-mini extract |
| POST | `/api/invoices/[id]/confirm` | Confirm OCR → create assets |
| GET | `/api/dashboard` | KPI aggregates |
| GET | `/api/audit-logs` | Audit log list |

### Error Response Pattern
```ts
// Validation error
return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
// Not found
return NextResponse.json({ error: 'Not found' }, { status: 404 })
// Success
return NextResponse.json(result)
return NextResponse.json(asset, { status: 201 })
```

---

## 5. Database Schema

**Provider:** PostgreSQL | **ORM:** Prisma 7.5.0 with PrismaPg adapter

### Tables (11)

| Table | Purpose |
|---|---|
| User | Better Auth user identity |
| Session | Better Auth sessions |
| Account | Better Auth OAuth/password accounts |
| Verification | Better Auth email verification tokens |
| Category | Hierarchical asset categories (self-ref parentId) |
| Asset | Core tracked asset |
| AssetEvent | Append-only lifecycle event log |
| Maintenance | Maintenance/repair records |
| AuditLog | System-wide audit trail |
| Invoice | Confirmed purchase invoice |
| OcrExtraction | Raw + extracted OCR data |
| AssetAttributeValue | Dynamic attrs as JSONB (1:1 with Asset) |
| AttributeDefinition | Dynamic field schemas per category |

### Key Design Patterns

1. **Soft delete:** All core tables have `isDeleted Boolean @default(false)` + `deletedAt DateTime?`. Every Prisma query filters `isDeleted = false`.
2. **Dual audit:** Every asset mutation atomically writes `AssetEvent` + `AuditLog` via `prisma.$transaction`.
3. **FSM:** Custom in `lib/fsm.ts` (no xstate). `validateTransition()` called before every status write, throws `Error` on invalid.
4. **JSONB dynamic attrs:** `AttributeDefinition` defines schema; `AssetAttributeValue.values` stores `Record<string, unknown>`.
5. **Decimal precision:** `DECIMAL(12, 2)` at DB level for `purchasePrice`, `cost`, `totalAmount`.
6. **MAINTENANCE_COMPLETED auto-complete:** When asset transitions back from MAINTENANCE, all non-completed maintenance records auto-complete.

### Enums (6)

| Enum | Values |
|---|---|
| AssetStatus | AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED, DISPOSED |
| AssetEventType | CREATED, STATUS_CHANGE, ASSIGNED, RECALLED, MAINTENANCE_CREATED, MAINTENANCE_COMPLETED, ATTRIBUTE_UPDATED, DISPOSED, RESTORED |
| MaintenanceType | PREVENTIVE, CORRECTIVE, UPGRADE |
| MaintenanceStatus | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| InvoiceStatus | PENDING, CONFIRMED, REJECTED |
| AttributeFieldType | TEXT, NUMBER, BOOLEAN, DATE, SELECT |

---

## 6. UI Structure

### App Shell
- **Root layout** (`app/layout.tsx`): Fira Sans + Fira Code fonts, metadata, `Providers` wrapper
- **Dashboard layout** (`app/(dashboard)/layout.tsx`):
  - Desktop sidebar (hidden on mobile): Logo + nav items + user menu
  - Mobile bottom nav (hidden on desktop): same nav items
  - Sticky page header: dynamic title (from `pageConfig`) + optional action button + language toggle
  - Main content area: scrollable

### Navigation (8 sections)

| Nav key | Label (en) | Label (vi) | Icon |
|---|---|---|---|
| nav.dashboard | Dashboard | Trang chu | LayoutDashboard |
| nav.assets | Assets | Tai san | Package |
| nav.categories | Categories | Danh muc | Tags |
| nav.attributes | Attributes | Thuoc tinh | Settings2Icon |
| nav.maintenance | Maintenance | Bao tri | Wrench |
| nav.invoices | Invoices | Hoa don | FileText |
| nav.auditLogs | Audit Logs | Nhat ky | ScrollText |
| nav.scan | Scan | Quet ma | QrCodeIcon |

### Client State Management
- **TanStack React Query**: `staleTime: 0`, `refetchOnWindowFocus: false`
  (Note: system-architecture.md says `staleTime: 60_000` — discrepancy to resolve)
- **Sonner** toaster: `position='bottom-right'`, `richColors`, `closeButton`, `duration={1800}`
- **No Zustand** — codebase summary explicitly confirms

### UI Primitives (shadcn/ui)
`button`, `card`, `input`, `label`, `select`, `textarea`, `table`, `dialog`,`dropdown-menu`, `badge`, `alert`, `avatar`, `breadcrumb`, `separator`,`skeleton`, `tabs`, `sonner`

### Feature Components

| Component | Purpose |
|---|---|
| `asset-timeline.tsx` | Lifecycle event timeline with icons, colors, relative timestamps |
| `assign-dialog.tsx` | Assign/recall dialog |
| `maintenance-form.tsx` | Create maintenance record |
| `qr-preview-modal.tsx` | QR preview + print layout |
| `qr-scanner.tsx` | html5-qrcode camera scanner |
| `definition-form.tsx` | Create/edit attribute definitions |
| `dynamic-field-renderer.tsx` | Render dynamic fields from schema |
| `category-form.tsx` | Create/edit categories |
| `kpi-card.tsx` | Single KPI stat card |
| `asset-status-chart.tsx` | Pie chart of asset status distribution |
| `recent-events.tsx` | Recent lifecycle events feed |
| `maintenance-cost-chart.tsx` | Maintenance cost bar chart (exists in codebase-summary, not found in components/) |
| `invoice-form.tsx` | Review + edit OCR results, confirm invoice |
| `invoice-preview.tsx` | View confirmed invoice |
| `invoice-upload.tsx` | Upload invoice image, trigger OCR |
| `editable-asset-row.tsx` | Editable asset line item in invoice form |
| `editable-invoice-row.tsx` | Editable invoice field row |
| `confirm-dialog.tsx` | Reusable confirm dialog |
| `language-toggle.tsx` | EN/VI toggle |
| `status-badge.tsx` | Asset status badge with color |

---

## 7. Notable Patterns & Architectural Decisions

### Architecture Layers
```
API Route (auth check, Zod parse)
  -> Service Layer (lib/services/*.ts) — business logic, FSM, audit
    -> Prisma ORM (never called directly from routes)
      -> PostgreSQL via PrismaPg adapter
```

### Auth (Better Auth 1.5.6)
- Session cookie (HttpOnly), CSRF via double-submit cookie
- Rate limiting: 5 attempts / 15 min / IP
- PrismaPg adapter for PostgreSQL storage
- `openAPI()` plugin generates OpenAPI spec
- **Single Admin role** — RBAC TBD
- Session: 7-day expiry, 1-day update age, 5-min cookie cache

### FSM (No xstate — custom implementation)
- `lib/fsm.ts`: `ASSET_TRANSITIONS` table, `validateTransition()`, `canTransition()`, `getAvailableTransitions()`
- `STATUS_CONFIG`: label, color, bgClass, textClass per status
- Validated in service layer BEFORE Prisma write; throws `Error` on invalid

### OCR Pipeline
```
Upload image -> save to public/uploads/invoices/YYYY/MM/
             -> base64 encode
             -> POST to OpenAI GPT-4o-mini Vision (30s timeout)
             -> parse JSON response
             -> create OcrExtraction (raw + extractedData + confidence)
             -> create Invoice (PENDING)
Admin confirm:
  -> edit extracted data
  -> POST /api/invoices/[id]/confirm
  -> atomic transaction: mark OCR confirmed, update Invoice,
     create/fetch Categories, create Assets (qty expansion)
```
- Image stored at `public/uploads/invoices/YYYY/MM/{ts}-{random}.{ext}`
- Web-relative path stored in `Invoice.filePath`
- GPT-4o-mini model (no version pin — production should pin)
- Language: Vietnamese primary, English fallback

### QR System
- `lib/qr-generator.ts`: `qrcode` library
- `toDataURL()` — base64 PNG stored in DB `asset.qrImage`
- `toBuffer()` — for PNG download via `/api/assets/[id]/qr`
- Encoded URL: `{baseUrl}/assets/{id}/lookup`

### Seed Data (CSV-based)
- `prisma/seed.ts` reads CSV from `prisma/data/`
- Tables seeded: Category, Employee, Product
- Uses `better-auth/crypto` `hashPassword()` for passwords

### Docker / Dev Setup
- `docker-compose.yml`: PostgreSQL 16 Alpine, persistent at `.local/data/postgres`
- `scripts/migrate.sh`: runs `prisma migrate`
- `scripts/start.sh`: starts dev server

### CSS / Styling
- Tailwind CSS v4 with `@tailwindcss/postcss` (NOT `tailwind.config.ts`)
- Dark mode via `next-themes`
- `components.json` → shadcn/ui managed

---

## 8. Existing Docs Assessment

| File | Status | Notes |
|---|---|---|
| `prd-v1.md` | OK | MVP PRD, phases 1-3 defined |
| `system-architecture.md` | Needs update | cache semantics discrepancy (staleTime 60s vs 0) |
| `model-design.md` | Needs update | references non-existent services; FSM has PURCHASED state |
| `codebase-summary.md` | Needs update | references `qrs/` dir that does not exist; service files mismatch |
| `code-standards.md` | Review | verify standards still followed |
| `deployment-guide.md` | Needs update | commands may not match current package.json scripts |
| `design-guidelines.md` | Unknown | not read |
| `project-roadmap.md` | Needs update | phase statuses likely outdated |
| `project-changelog.md` | Unknown | not read |
| `project-overview-pdr.md` | Unknown | not read |

---

## 9. Gaps & Discrepancies for Docs-Manager

### Model Design Discrepancies
1. **FSM state `PURCHASED`** appears in `model-design.md` FSM diagram but does NOT exist   in `prisma/schema.prisma`. Actual initial state is `AVAILABLE`.
2. **Service files** referenced in `model-design.md` §7 that don't exist:
   - `lib/services/category-service.ts` — TBD
   - `lib/services/maintenance-service.ts` — TBD
   - `lib/services/invoice-service.ts` — TBD
3. **`qrs/` directory** in `codebase-summary.md` doesn't exist;
   QR stored as base64 DataURL in DB, not as PNG files

### Cache Semantics Discrepancy
- `system-architecture.md` §11 says `staleTime: 60_000`
- `app/providers.tsx` uses `staleTime: 0`
- Need to determine authoritative source and update

### Maintenance Cost Chart
- `maintenance-cost-chart.tsx` listed in `codebase-summary.md`
- Not found in `components/dashboard/` directory
- May be missing from codebase or misnamed

---

## Unresolved Questions

1. **Backup provider** — TBD, not yet selected
2. **Periodic Inventory** — deferred to Phase 3+, no design yet
3. **Prisma middleware for auto audit log** — TBD, currently uses explicit `logAssetEvent()`
4. **Products table** — `prisma/data/products.csv` exists but no model in schema.
   Used in seed only, or planned for future?
5. **Login page** — `app/(auth)/layout.tsx` exists but no login page file found.
   Redirects to Better Auth built-in page?
6. **Asset list/detail/edit pages** — listed in codebase-summary.md but only
   `app/assets/[id]/lookup/page.tsx` found. Generated via dynamic routing or missing?
7. **`proxy.ts`** — purpose and status unknown
8. **Cache staleTime** — system-architecture.md says 60s, providers.tsx says 0.
   Which is authoritative?
9. **`maintenance-cost-chart.tsx`** — listed in codebase-summary but not in components dir.
