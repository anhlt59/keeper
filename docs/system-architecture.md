# Zoo — System Architecture

> **Version:** 1.0.0 | **PRD:** [prd-v1.md](./prd-v1.md)
> **Plan:** `plans/260325-0106-asset-mgmt-init/`

---

## 1. High-Level Architecture

```
[Browser]
    │ HTTPS
    ▼
[Next.js 15 App Router]
    ├── Server Components (RSC) — data fetching, SEO
    ├── Client Components — interactive UI (TanStack Query)
    └── API Routes (REST) — /api/*
            │
            ▼
    [Service Layer — lib/services/*.ts]
            │
            ▼
    [Prisma ORM]
            │
            ▼
    [PostgreSQL]
    └── Prisma Middleware → audit_logs table
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
audit_logs            ← auto via Prisma middleware
```

**Soft delete:** All core tables include `is_deleted BOOLEAN DEFAULT false` + `deleted_at TIMESTAMP`. Prisma queries always filter `WHERE is_deleted = false`.

---

## 3. Asset Lifecycle FSM

### States

| State | Description |
|---|---|
| `purchased` | Newly purchased, not yet assigned |
| `assigned` | Assigned to an employee or department |
| `in_use` | Actively in use (after assignment) |
| `maintenance` | Under maintenance/repair |
| `retired` | No longer in use, pending disposal |
| `disposed` | Fully disposed (terminal) |

### Transitions

```
purchased ──assign──▶ assigned ──start_use──▶ in_use
                                         │
        ◀──recall──┐                     │
                   │                     ▼
  maintenance ◀───┘              in_use ──send_maintenance──▶ maintenance
        │                                           │
        └─────────────complete──────────────────────┘
                   (──▶ in_use)

in_use ──retire──▶ retired ──dispose──▶ disposed
```

### Transition Rules

| From | To | Trigger | Guard |
|---|---|---|---|
| purchased | assigned | assign | — |
| assigned | in_use | start_use | assigned must exist |
| assigned | in_use | recall (back) | assigned exists |
| in_use | assigned | recall (back) | — |
| in_use | maintenance | send_maintenance | — |
| maintenance | in_use | complete_maintenance | — |
| in_use | retired | retire | — |
| retired | disposed | dispose | — |

**Implementation:** `lib/fsm.ts` — custom state machine, validates transitions at service layer before DB write. Invalid transitions throw `BadRequestError`.

---

## 4. Auth Architecture (Better Auth)

```
[Login Page] POST /api/auth/sign-in/email-password
    │
    ▼
[Better Auth]
    ├── Session cookie (HttpOnly, Secure, SameSite=Lax)
    ├── CSRF token (via double-submit cookie)
    └── Rate limiting (5 attempts / 15 min per IP)
    │
    ▼
[Session stored in DB via Better Auth adapter]
    │
    ▼
[Protected routes] — check via auth-hook in Server Components / API routes
```

- **Single role:** Admin only (MVP)
- **Session:** Cookie-based, HttpOnly, Secure in production
- **CSRF:** Built-in via Better Auth double-submit cookie pattern
- **Rate limit:** 5 failed logins per 15 min per IP

---

## 5. OCR Pipeline

```
[Admin uploads invoice image/PDF]
    │
    ▼
[POST /api/invoices/upload]
    └── Store raw file (local/cloud TBD)
    └── Create invoice_ocr_extraction (raw: null, status: pending)
    │
    ▼
[Server action calls GPT-4o-mini]
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

---

## 6. QR System

```
[Asset created]
    │
    ▼
[lib/qr.ts — generateQR(assetId)]
    └── Encoded URL: /assets/{id}/lookup
    └── Generate QR PNG via `qrcode` library
    └── Store PNG in /public/qrs/ (local) or cloud storage
    │
    ▼
[Print label]
    └── 25mm × 25mm PNG 300dpi
    └── Layout: QR (60%) + asset name + short code (40%)
    └── Print via Zebra/Brother QL or A4 cut
    │
    ▼
[Mobile scan — html5-qrcode]
    └── Camera access via browser
    └── Decode URL → redirect to /assets/{id}
    └── Fallback: manual code entry
```

---

## 7. API Layer Structure

```
app/api/
├── auth/[...better-auth]/route.ts     # Auth endpoints
├── assets/route.ts                     # GET list, POST create
├── assets/[id]/route.ts               # GET, PATCH, DELETE
├── assets/[id]/events/route.ts        # GET lifecycle events
├── assets/[id]/assign/route.ts        # POST assign
├── assets/[id]/recall/route.ts        # POST recall
├── assets/[id]/transition/route.ts    # POST FSM transition
├── categories/route.ts                # CRUD categories
├── categories/[id]/attributes/route.ts # Attribute definitions per category
├── maintenance/route.ts               # CRUD maintenance records
├── invoices/route.ts                  # Upload + OCR + confirm
├── invoices/[id]/confirm/route.ts     # Confirm OCR result
└── dashboard/route.ts                 # KPI aggregates
```

**Patterns:**
- All mutating endpoints validate via Zod schemas from `lib/validators/`
- All endpoints check auth session before processing
- All writes go through Prisma service layer (not direct Prisma client in routes)
- Append-only event tables never exposed via PUT/PATCH

---

## 8. Component Architecture

```
components/
├── ui/                    # shadcn/ui primitives (button, card, table, dialog, etc.)
├── layout/
│   ├── sidebar.tsx        # Navigation sidebar
│   ├── header.tsx         # Top bar with user info
│   └── breadcrumb.tsx     # Breadcrumb nav
├── assets/
│   ├── asset-list.tsx      # Paginated asset table
│   ├── asset-form.tsx      # Create/edit form
│   ├── asset-detail.tsx    # Detail page sections
│   ├── asset-timeline.tsx  # Lifecycle event timeline
│   └── asset-qr.tsx        # QR display + print
├── dashboard/
│   ├── kpi-cards.tsx       # Summary stat cards
│   ├── status-chart.tsx    # Asset distribution pie/bar
│   └── maintenance-cost-chart.tsx
├── maintenance/
│   └── maintenance-form.tsx
├── invoices/
│   ├── upload-form.tsx     # Drag-drop upload
│   ├── ocr-preview.tsx     # Review + edit extracted data
│   └── invoice-table.tsx
└── scan/
    └── mobile-scanner.tsx  # html5-qrcode wrapper
```

**RSC vs Client Components:**
- RSC: Pages (data fetching), layouts, static UI sections
- Client (`"use client"`): Forms, dialogs, charts, mobile scanner, real-time interactions

---

## 9. Data Flow Diagrams

### Asset Creation Flow
```
[Create Form] → [Zod validate] → [Service: createAsset]
    → [FSM: validate initial state = purchased]
    → [Prisma: INSERT asset + generate QR]
    → [Prisma Middleware: INSERT audit_log]
    → [Return asset + QR URL]
```

### Assignment Flow
```
[Assign Form] → [Zod validate] → [Service: assignAsset]
    → [FSM: purchased|assigned|in_use → assigned valid?]
    → [Prisma: INSERT asset_assignments]
    → [Prisma: INSERT asset_events (type: assigned)]
    → [Prisma Middleware: INSERT audit_log]
    → [Return assignment record]
```

### OCR Flow
```
[Upload] → [Save raw file] → [GPT-4o-mini extraction]
    → [Save invoice_ocr_extraction (raw)]
    → [Admin confirm/edit] → [Save confirmed]
    → [Create invoice record]
    → [Prisma Middleware: INSERT audit_log]
```

### Dashboard KPI Flow
```
[Dashboard Page RSC]
    → [lib/services/dashboard.ts — getKpiData()]
    → [Prisma aggregations (COUNT, SUM, GROUP BY)]
    → [Cache: 60s via TanStack Query staleTime]
    → [Return KPI object]
```

---

*Unresolved: Invoice storage — local filesystem vs. cloud (S3/R2)?*
*Unresolved: Backup provider — not yet selected*
*Unresolved: Periodic Inventory logic — needs detailed design when Phase 3 starts*
