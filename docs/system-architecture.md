# Zoo — System Architecture

> **Version:** 1.2.0 | **PRD:** [prd-v1.md](./prd-v1.md)
> **Plan:** `plans/260325-0106-asset-mgmt-init/`

---

## 1. High-Level Architecture

```
[Browser]
    │ HTTPS
    ▼
[Next.js 16.2.1 App Router]
    ├── Server Components (RSC) — data fetching, SEO
    ├── Client Components — interactive UI (TanStack React Query 5.95.2)
    └── API Routes (REST) — /api/*
            │
            ▼
    [Service Layer — lib/services/*.ts]
            │
            ▼
    [Prisma 7.5.0 ORM via PrismaPg adapter]
            │
            ▼
    [PostgreSQL]
```

---

## 2. Database Schema Overview

```
admins                           (Better Auth: User, Session, Account, Verification)

asset_categories
  └── 1:N assets

asset_attribute_definitions
  └── (key, label, type, required, category_id)

assets
  ├── 1:N asset_events (append-only)
  ├── 1:N asset_attribute_values (JSONB)
  ├── 1:N maintenance_records
  ├── 1:N asset_assignments
  └── FK: category_id → asset_categories

employees                        (assignable people, soft delete)
  └── 1:N assets (via employeeId FK)

asset_events          ← append-only log
asset_attribute_values ← JSONB per asset
asset_assignments     ← assignment history
maintenance_records
invoices              ← confirmed OCR results
invoice_ocr_extractions ← raw + confirmed (audit)
audit_logs            ← via logAssetEvent() in lib/audit-logger.ts
```

**Tables count: 12** (User, Session, Account, Verification, Employee, Category, Asset, AssetEvent, Maintenance, AuditLog, Invoice, OcrExtraction, AssetAttributeValue, AttributeDefinition — 14 total via Prisma schema)

**Soft delete:** All core tables include `isDeleted Boolean @default(false)` + `deletedAt`. Prisma queries always filter `WHERE isDeleted = false`.

---

## 3. Asset Lifecycle FSM

### States

| State | Description |
|---|---|
| `AVAILABLE` | In stock, ready to assign |
| `ASSIGNED` | Assigned to an employee or department |
| `MAINTENANCE` | Under maintenance/repair |
| `RETIRED` | No longer in use, pending disposal |
| `DISPOSED` | Fully disposed (terminal) |

### Transitions

```
AVAILABLE ──assign──▶ ASSIGNED
                           │
        ◀──recall──┐       ├──[maintenance]──▶ MAINTENANCE
                   │       │                        │
                   │       ◀──[maintenance complete]┘
                   │
                   └──[retire]──▶ RETIRED ──[dispose]──▶ DISPOSED
                                                          ▲
                                        DISPOSED ◀──[restore]──┘
```

### Transition Rules

| From | To | Event Type | Label |
|---|---|---|---|
| AVAILABLE | ASSIGNED | `ASSIGNED` | Assign |
| ASSIGNED | MAINTENANCE | `MAINTENANCE_CREATED` | Send to maintenance |
| MAINTENANCE | ASSIGNED | `MAINTENANCE_COMPLETED` | Maintenance complete |
| ASSIGNED | RETIRED | `STATUS_CHANGE` | Retire |
| AVAILABLE | RETIRED | `STATUS_CHANGE` | Retire (unused) |
| RETIRED | DISPOSED | `DISPOSED` | Dispose |
| DISPOSED | RETIRED | `RESTORED` | Restore |
| ASSIGNED | AVAILABLE | `RECALLED` | Recall |

**Implementation:** `lib/fsm.ts` — custom state machine. Uses `AssetStatus` and `AssetEventType` enums from Prisma. `validateTransition()` throws plain `Error` if invalid. Service layer calls FSM validate then Prisma write.

**Status colors** (from `lib/fsm.ts` STATUS_CONFIG):
`AVAILABLE`=blue, `ASSIGNED`=violet, `MAINTENANCE`=amber, `RETIRED`=slate, `DISPOSED`=red

---

## 4. Auth Architecture (Better Auth 1.5.6)

```
[Login Page] POST /api/auth/sign-in/email-password
    │
    ▼
[Better Auth]
    ├── Session cookie (HttpOnly, Secure, SameSite=Lax)
    ├── CSRF token (via double-submit cookie)
    ├── Rate limiting (5 attempts / 15 min per IP)
    └── Cookie cache (5 min server-side)
    │
    ▼
[PostgreSQL via PrismaPg adapter — session stored in DB]
    │
    ▼
[Protected routes] — check via auth.api.getSession() in route handlers
```

**Auth Models:** User, Session, Account, Verification (Better Auth OAuth)
**User fields:** id, email, name, emailVerified, image, isDeleted, deletedAt, createdAt, updatedAt (no password field — Better Auth uses Account table)
**Adapter:** `PrismaPg` in `lib/db.ts`, passed to `prismaAdapter(prisma)` in `lib/auth.ts`
**Plugin:** `openAPI()` for OpenAPI-compatible auth routes

- **Single role:** Admin only (MVP)
- **Session:** Cookie-based, HttpOnly, Secure in production, 7-day expiry
- **CSRF:** Built-in via Better Auth double-submit cookie pattern
- **Rate limit:** 5 failed logins per 15 min per IP

### Auth Extension Points (RBAC path)

> [TBD] — Multi-role RBAC not yet implemented. When needed:

- Add roles column to `User` table
- Create `hasPermission(session, resource, action)` helper in `lib/auth.ts`
- Add middleware to check role on protected routes
- Reference: Better Auth supports custom `session` object extension via `additionalSessionFields`

---

## 5. i18n Subsystem

```
context/language-context.tsx     ← LanguageProvider + useLanguage() hook
lib/i18n/translations.ts         ← Core translations
lib/i18n/translations-extended.ts ← Extended/additional translations
components/shared/language-toggle.tsx ← UI toggle component
```

Supported languages via context. Components use translation keys rather than hardcoded strings.

---

## 6. OCR Pipeline

```
[Admin uploads invoice image/PDF]
    │
    ▼
[POST /api/invoices/ocr]
    └── Save image to public/uploads/invoices/YYYY/MM/ (web-relative path)
    └── Create invoice_ocr_extraction + invoice record with filePath
    │
    ▼
[lib/ocr.ts — extractInvoiceData()]
    └── Model: gpt-4o-mini (pin to specific version in production)
    └── System prompt: extract vendor, invoice_date, total_amount, line_items, categories
    └── Language priority: Vietnamese first, English fallback
    └── Categories field: pre-fills the Upload Invoices category dropdown (UI reads from `extracted.categories` — not hardcoded)
    │
    ▼
[Save raw extraction + confidence scores]
    └── invoice_ocr_extraction (raw: GPT output, status: extracted)
    │
    ▼
[Admin reviews on detail page]
    └── Displays uploaded invoice image from filePath
    └── Shows OCR confidence per field
    └── Admin can delete if needed
    │
    ▼
[Create confirmed invoice]
    └── invoice_ocr_extraction (confirmed_data: extracted values)
    └── invoice (full record with vendor, invoiceDate, totalAmount, filePath)
```

**Image Storage:** Local filesystem at `public/uploads/invoices/{YYYY}/{MM}/{timestamp}-{random}.{ext}`. Web-relative path stored in `Invoice.filePath`. Invoice detail page renders image when filePath present.

**OCR Model:** `gpt-4o-mini` — no version tag pinned in code. For production, pin to a specific model version (e.g., `gpt-4o-mini-2024-07-18`).

---

## 7. QR System

```
[Asset created]
    │
    ▼
[lib/services/asset-service.ts — createAsset()]
    └── Calls generateQRCode() from lib/qr-generator.ts
    └── Encoded URL: /assets/{id}/lookup
    └── Generate QR PNG via `qrcode` library (errorCorrectionLevel: H, 300px)
    └── Store as base64 DataURL in asset.qrImage column
    │
    ▼
[Print label]
    └── 25mm × 25mm PNG 300dpi
    └── Layout: QR (60%) + asset name + short code (40%)
    └── Print via Zebra/Brother QL or A4 cut
    │
    ▼
[GET /api/assets/[id]/qr] — Download PNG directly
    │
    ▼
[GET /assets/[id]/lookup] — Public page (no auth required)
    └── Scan redirects here — shows asset info without login
    └── html5-qrcode scanner component
```

---

## 8. API Layer Structure

```
app/api/
├── auth/[...better-auth]/route.ts        # Auth endpoints
├── assets/route.ts                        # GET list, POST create
├── assets/[id]/
│   ├── route.ts                          # GET, PUT, DELETE
│   ├── assign/route.ts                   # POST assign
│   ├── recall/route.ts                   # POST recall
│   ├── events/route.ts                   # GET lifecycle events
│   ├── maintenance/route.ts              # GET/POST maintenance records
│   └── qr/route.ts                       # GET download QR PNG
├── categories/route.ts                    # CRUD categories
├── categories/[id]/
│   └── attributes/route.ts              # GET/POST attribute definitions
├── employees/route.ts                    # GET/POST employees
├── maintenance/
│   ├── route.ts                          # GET/POST all maintenance records
│   └── [id]/route.ts                    # GET/PUT/DELETE single record
├── invoices/
│   ├── route.ts                          # GET all, POST upload (creates OCR job)
│   └── [id]/
│       ├── ocr/route.ts                  # POST: GPT-4o-mini extract
│       └── confirm/route.ts              # POST: admin confirm (create invoice)
├── dashboard/route.ts                    # GET KPI aggregates
└── audit-logs/route.ts                   # GET audit logs
```

**Patterns:**
- All mutating endpoints validate via Zod schemas from `lib/validators/`
- All endpoints check auth session before processing (`auth.api.getSession({ headers: req.headers })`)
- All writes go through service layer (not direct Prisma client in routes)
- Append-only event tables never exposed via PUT/PATCH

**Client utility:** `lib/api-fetch.ts` — wraps `fetch()` with `credentials: "include"` and redirects to `/login` on 401.

---

## 9. Component Architecture

```
components/
├── ui/                    # shadcn/ui primitives (button, card, table, dialog, etc.)
├── assets/
│   ├── asset-timeline.tsx  # Lifecycle event timeline
│   ├── assign-dialog.tsx   # Assign/recall dialog
│   ├── maintenance-form.tsx # Create maintenance record
│   ├── qr-preview-modal.tsx # Preview + print QR
│   └── qr-scanner.tsx      # html5-qrcode wrapper
├── dashboard/
│   ├── kpi-card.tsx        # Single KPI stat card
│   ├── asset-status-chart.tsx # Status distribution chart
│   └── recent-events.tsx   # Recent lifecycle events feed
├── invoices/
│   ├── invoice-form.tsx    # Create/edit invoice
│   ├── invoice-preview.tsx  # View confirmed invoice
│   └── invoice-upload.tsx  # Upload + trigger OCR
├── categories/
├── attributes/
├── shared/
│   └── language-toggle.tsx  # i18n toggle
└── scan/
    └── mobile-scanner.tsx  # html5-qrcode scan page
```

**RSC vs Client Components:**
- RSC: Pages (data fetching), layouts, static UI sections
- Client (`"use client"`): Forms, dialogs, charts, mobile scanner, real-time interactions

---

## 10. Audit Logging

### Architecture

```
[API Route Handler]
    │
    ├── setAuditContext({ userId, ipAddress, userAgent })  ← lib/audit.ts (optional)
    │
    ▼
[Service Layer — lib/services/asset-service.ts]
    │
    ├── logAssetEvent({ assetId, eventType, ... })        ← lib/audit-logger.ts
    │
    ▼
[Prisma $transaction]
    ├── INSERT asset_events (timeline, append-only)
    └── INSERT audit_logs (who/what/when, metadata)
```

**Note:** `setAuditContext()` is defined in `lib/audit.ts` but not currently used in route handlers. `logAssetEvent()` in `lib/audit-logger.ts` accepts `performedBy` directly as a parameter. Future: replace with Prisma middleware for automatic inference.

### Schema (from Prisma)

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  entityType  String   // "Asset", "Category", "Invoice", etc.
  entityId    String
  description String
  ipAddress   String?
  userAgent   String?
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("audit_logs")
}
```

---

## 11. Observability

> [TBD] — Not yet implemented.

| Concern | Solution | Status |
|---|---|---|
| Error tracking | Sentry | TBD |
| API performance | Vercel Analytics / custom timing logs | TBD |
| Database slow queries | Prisma query logging in dev (`log: ['query']`) | TBD |
| Uptime monitoring | Vercel built-in | TBD |
| Structured logging | Console.log → `pino` or `winston` | TBD |

---

## 12. Data Flow Diagrams

### Asset Creation Flow
```
[Create Form] → [Zod validate] → [Service: createAsset]
    → [FSM: validate initial state = AVAILABLE]
    → [Prisma: INSERT asset + generate QR]
    → [logAssetEvent: INSERT asset_events + audit_logs]
    → [Return asset + QR URL]
```

### Assignment Flow
```
[Assign Form] → [Zod validate] → [Service]
    → [FSM: check transition valid]
    → [Prisma: INSERT asset_assignments]
    → [logAssetEvent: INSERT asset_events + audit_logs]
    → [Return assignment record]
```

### OCR Flow
```
[Upload] → [Save raw file] → [extractInvoiceData — gpt-4o-mini]
    → [Save invoice_ocr_extraction (raw)]
    → [Admin confirm/edit] → [Save confirmed]
    → [Create invoice record]
    → [logAssetEvent: INSERT audit_logs]
```

### Dashboard KPI Flow
```
[Dashboard Page RSC]
    → [Direct Prisma aggregations in route]
    → [TanStack Query: staleTime = 0, refetchOnWindowFocus: false]
    → [Return KPI object]
```

> **Note:** `providers.tsx` sets `staleTime: 0` and `refetchOnWindowFocus: false` (no cache reuse). Data refetches on every mount.

---

*Resolved: Invoice images stored locally at `public/uploads/invoices/{YYYY}/{MM}/` with web-relative path in `Invoice.filePath`. Display implemented in invoice detail page.*
*Unresolved: Backup provider for invoice images — not yet selected*
*Unresolved: Periodic Inventory logic — needs detailed design when Phase 3 starts*
