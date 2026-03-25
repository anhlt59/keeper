# Zoo — System Architecture

> **Version:** 1.1.0 | **PRD:** [prd-v1.md](./prd-v1.md)
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
    [Prisma 7.5.0 ORM]
            │
            ▼
    [PostgreSQL]
```

---

## 2. Database Schema Overview

```
admins
  └── (Better Auth session table)

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

asset_events          ← append-only log
asset_attribute_values ← JSONB per asset
asset_assignments     ← assignment history
maintenance_records
invoices              ← confirmed OCR results
invoice_ocr_extractions ← raw + confirmed (audit)
audit_logs            ← via logAssetEvent() in lib/audit-logger.ts
```

**Soft delete:** All core tables include `isDeleted Boolean @default(false)` + `deletedAt`. Prisma queries always filter `WHERE isDeleted = false`.

---

## 3. Asset Lifecycle FSM

### States

| State | Description |
|---|---|
| `PURCHASED` | Newly purchased, not yet assigned |
| `ASSIGNED` | Assigned to an employee or department |
| `IN_USE` | Actively in use (after assignment) |
| `MAINTENANCE` | Under maintenance/repair |
| `RETIRED` | No longer in use, pending disposal |
| `DISPOSED` | Fully disposed (terminal) |

### Transitions

```
PURCHASED ──assign──▶ ASSIGNED ──[mark in use]──▶ IN_USE
                                               │
        ◀──recall──┐                    ▼
                   │              IN_USE ──[send to maintenance]──▶ MAINTENANCE
  MAINTENANCE ◀───┘                    │
        │                              │
        └───────────[maintenance complete]──────────────┘

IN_USE ──[retire]──▶ RETIRED ──[dispose]──▶ DISPOSED
                                            │
  DISPOSED ◀──[restore]─────────────────────┘
```

### Transition Rules

| From | To | Event Type | Label |
|---|---|---|---|
| PURCHASED | ASSIGNED | `ASSIGNED` | Assign |
| ASSIGNED | IN_USE | `STATUS_CHANGE` | Mark in use |
| ASSIGNED | RETIRED | `STATUS_CHANGE` | Retire (unassigned) |
| PURCHASED | RETIRED | `STATUS_CHANGE` | Retire (unused) |
| IN_USE | MAINTENANCE | `MAINTENANCE_CREATED` | Send to maintenance |
| MAINTENANCE | IN_USE | `MAINTENANCE_COMPLETED` | Maintenance complete |
| IN_USE | RETIRED | `STATUS_CHANGE` | Retire |
| RETIRED | DISPOSED | `DISPOSED` | Dispose |
| DISPOSED | RETIRED | `RESTORED` | Restore |
| ASSIGNED | PURCHASED | `RECALLED` | Recall |

**Implementation:** `lib/fsm.ts` — custom state machine. Uses `AssetStatus` and `AssetEventType` enums from Prisma. `validateTransition()` throws plain `Error` if invalid. Service layer calls FSM validate then Prisma write.

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

- **Single role:** Admin only (MVP)
- **Session:** Cookie-based, HttpOnly, Secure in production, 7-day expiry
- **CSRF:** Built-in via Better Auth double-submit cookie pattern
- **Rate limit:** 5 failed logins per 15 min per IP

### Auth Extension Points (RBAC path)

> [TBD] — Multi-role RBAC not yet implemented. When needed:

- Add roles column to `admins` table (`role TEXT DEFAULT 'admin'`)
- Create `hasPermission(session, resource, action)` helper in `lib/auth.ts`
- Add middleware to check role on protected routes
- Reference: Better Auth supports custom `session` object extension via `additionalSessionFields`

---

## 5. OCR Pipeline

```
[Admin uploads invoice image/PDF]
    │
    ▼
[POST /api/invoices/ocr]
    └── Store raw file (local/cloud TBD — unresolved)
    └── Create invoice_ocr_extraction (raw: null, status: pending)
    │
    ▼
[lib/ocr.ts — extractInvoiceData()]
    └── Model: gpt-4o-mini (pin to specific version in production)
    └── System prompt: extract vendor, invoice_date, total_amount, line_items
    └── Language priority: Vietnamese first, English fallback
    │
    ▼
[Save raw extraction + confidence scores]
    └── invoice_ocr_extraction (raw: GPT output, status: extracted)
    │
    ▼
[Admin reviews on confirmation page]
    └── Shows confidence per field
    └── Admin edits if needed
    │
    ▼
[Admin confirms → create invoice]
    └── invoice_ocr_extraction (confirmed_data: admin values, status: confirmed)
    └── invoice (full record)
    └── NO auto-create without confirmation
```

**OCR Model:** `gpt-4o-mini` — no version tag pinned in code. For production, pin to a specific model version (e.g., `gpt-4o-mini-2024-07-18`).

---

## 6. QR System

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

## 7. API Layer Structure

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
├── maintenance/
│   ├── route.ts                          # GET/POST all maintenance records
│   └── [id]/route.ts                    # GET/PUT/DELETE single record
├── invoices/
│   ├── route.ts                          # GET all, POST upload (creates OCR job)
│   └── [id]/
│       ├── ocr/route.ts                  # POST: GPT-4o-mini extract (upload step)
│       └── confirm/route.ts              # POST: admin confirm (create invoice)
├── dashboard/route.ts                    # GET KPI aggregates
└── audit-logs/route.ts                   # GET audit logs
```

**Patterns:**
- All mutating endpoints validate via Zod schemas from `lib/validators/`
- All endpoints check auth session before processing
- All writes go through service layer (not direct Prisma client in routes)
- Append-only event tables never exposed via PUT/PATCH

---

## 8. Component Architecture

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
└── scan/
    └── mobile-scanner.tsx  # [TBD] dedicated scan page component
```

**RSC vs Client Components:**
- RSC: Pages (data fetching), layouts, static UI sections
- Client (`"use client"`): Forms, dialogs, charts, mobile scanner, real-time interactions

---

## 9. Audit Logging

### Architecture

```
[API Route Handler]
    │
    ├── setAuditContext({ userId, ipAddress, userAgent })  ← lib/audit.ts
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

### Registration

> [TBD] — Prisma middleware for automatic audit logging not yet set up. Currently using explicit `logAssetEvent()` calls in service layer.

When implementing middleware (Phase 2+):

```ts
// lib/db.ts
prisma.$use(async (params, next) => {
  // Log writes to core tables: assets, categories, invoices, maintenance_records
  // Extract userId from audit context set by route handler
  // Write to audit_logs after successful commit
});
```

---

## 10. Observability

> [TBD] — Not yet implemented.

| Concern | Solution | Status |
|---|---|---|
| Error tracking | Sentry | TBD |
| API performance | Vercel Analytics / custom timing logs | TBD |
| Database slow queries | Prisma query logging in dev (`log: ['query']`) | TBD |
| Uptime monitoring | Vercel built-in | TBD |
| Structured logging | Console.log → `pino` or `winston` | TBD |

---

## 11. Data Flow Diagrams

### Asset Creation Flow
```
[Create Form] → [Zod validate] → [Service: createAsset]
    → [FSM: validate initial state = PURCHASED]
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
    → [TanStack Query: staleTime = 60s]
    → [Cache: 60s (staleTime), NOT gcTime]
    → [Return KPI object]
```

> **Note on cache semantics:** `providers.tsx` sets `staleTime: 60_000` (60s). Data is fresh for 60s then refetches. `gcTime` defaults to 30 minutes (when entry is evicted from cache). For dashboard, use `staleTime` as the primary control.

---

*Unresolved: Invoice storage — local filesystem vs. cloud (S3/R2)?*
*Unresolved: Backup provider — not yet selected*
*Unresolved: Periodic Inventory logic — needs detailed design when Phase 3 starts*
*Unresolved: Prisma middleware for auto audit log — currently using explicit logAssetEvent()*
