# Zoo — Codebase Summary

> **Version:** 1.1.0 | **Root:** `/Users/anhlt/Projects/vibe/zoo/`
> **Tech Stack:** Next.js 16.2.1 · TypeScript 5.9.3 · Prisma 7.5.0 · Better Auth 1.5.6 · Tailwind CSS v4 · Zod 4.3.6 · TanStack React Query 5.95.2

---

## 1. Target Directory Structure

```
zoo/                               # Git root
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth route group
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/               # Protected route group
│   │   ├── layout.tsx            # Sidebar + header shell
│   │   ├── page.tsx              # Dashboard KPI
│   │   ├── assets/
│   │   │   ├── page.tsx          # Asset list
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Asset detail
│   │   │       ├── edit/page.tsx # Edit asset
│   │   │       └── lookup/page.tsx # Public QR lookup (no auth)
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── attributes/
│   │   │   └── page.tsx
│   │   ├── maintenance/
│   │   │   └── page.tsx
│   │   ├── invoices/
│   │   │   └── page.tsx
│   │   ├── audit-logs/
│   │   │   └── page.tsx
│   │   └── scan/
│   │       └── page.tsx
│   ├── api/                       # REST API routes
│   │   ├── auth/[...better-auth]/
│   │   │   └── route.ts
│   │   ├── assets/
│   │   │   ├── route.ts          # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PUT, DELETE
│   │   │       ├── assign/route.ts
│   │   │       ├── recall/route.ts
│   │   │       ├── events/route.ts
│   │   │       ├── maintenance/route.ts
│   │   │       └── qr/route.ts   # Download QR PNG
│   │   ├── categories/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── attributes/route.ts
│   │   ├── maintenance/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── invoices/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── ocr/route.ts  # Upload → GPT-4o-mini OCR
│   │   │       └── confirm/route.ts # Admin confirm OCR result
│   │   ├── dashboard/
│   │   │   └── route.ts
│   │   └── audit-logs/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx                 # Root layout
│   └── providers.tsx              # TanStack Query + Sonner (NO Zustand)
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── auth.ts                    # Better Auth config (PrismaPg adapter)
│   ├── fsm.ts                     # Asset lifecycle FSM
│   ├── qr-generator.ts            # QR generation (NOT qr.ts)
│   ├── ocr.ts                     # GPT-4o-mini invoice extraction
│   ├── utils.ts                   # cn() utility
│   ├── audit.ts                   # Request-scoped audit context
│   ├── audit-logger.ts            # logAssetEvent() — creates AssetEvent + AuditLog
│   ├── validators/                # Zod v4 schemas
│   │   ├── asset.ts
│   │   ├── category.ts
│   │   ├── dynamic-attrs.ts
│   │   ├── invoice.ts
│   │   └── maintenance.ts
│   └── services/                  # Business logic layer
│       ├── asset-service.ts
│       └── asset-qr-service.ts    # (NO category/maintenance/invoice/dashboard services)
│
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── assets/
│   │   ├── asset-timeline.tsx
│   │   ├── assign-dialog.tsx
│   │   ├── maintenance-form.tsx
│   │   ├── qr-preview-modal.tsx
│   │   └── qr-scanner.tsx
│   ├── dashboard/
│   │   ├── kpi-card.tsx           # (NOT kpi-cards.tsx)
│   │   ├── asset-status-chart.tsx
│   │   └── recent-events.tsx
│   ├── invoices/
│   │   ├── invoice-form.tsx
│   │   ├── invoice-preview.tsx
│   │   └── invoice-upload.tsx
│   ├── categories/
│   ├── attributes/
│   ├── shared/
│   └── scan/
│
├── public/
│   └── qrs/                       # Generated QR PNGs (local storage)
│
├── docker-compose.yml             # PostgreSQL local dev
├── .env.local                     # Local env vars (not committed)
├── .env.local.example             # Env template (committed)
├── .gitignore
├── package.json
├── next.config.ts
├── postcss.config.mjs             # Tailwind CSS v4 (NOT tailwind.config.ts)
├── tsconfig.json
└── eslint.config.mjs
```

---

## 2. Key Files & Responsibilities

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | All tables, relations, indexes, soft delete fields |
| `lib/db.ts` | Prisma client singleton (avoids connection exhaustion in dev) |
| `lib/auth.ts` | Better Auth config: PrismaPg adapter, session, CSRF, rate limiting |
| `lib/fsm.ts` | Asset lifecycle FSM — `validateTransition()`, `canTransition()`, `getAvailableTransitions()` |
| `lib/qr-generator.ts` | Generate QR as DataURL and PNG Buffer (NOT `qr.ts`) |
| `lib/ocr.ts` | Call `gpt-4o-mini` for invoice extraction, 30s timeout |
| `lib/audit.ts` | Request-scoped audit context (`setAuditContext`, `getAuditContext`) |
| `lib/audit-logger.ts` | `logAssetEvent()` — atomic `AssetEvent` + `AuditLog` write |
| `lib/validators/*.ts` | Zod v4 schemas for all API inputs |
| `lib/services/asset-service.ts` | All asset DB write logic — routes call services, not Prisma directly |
| `lib/services/asset-qr-service.ts` | QR-specific business logic |
| `app/providers.tsx` | TanStack Query `QueryClientProvider` + Sonner `Toaster` (NO Zustand) |
| `prisma/seed.ts` | Sample categories + assets for local dev |

---

## 3. LOC Targets (Fresh Project)

| Component | Target LOC |
|---|---|
| `app/` (pages, layouts, API routes) | ~2,000–3,000 |
| `lib/services/` | ~1,500–2,000 |
| `lib/validators/` | ~500–800 |
| `lib/fsm.ts` + `lib/qr-generator.ts` + `lib/ocr.ts` | ~500–800 |
| `lib/db.ts` + `lib/auth.ts` + `lib/audit*.ts` | ~200–300 |
| `components/` (custom) | ~2,000–3,000 |
| `prisma/schema.prisma` | ~500–800 |
| **Total app code** | **~7,200–10,700** |

*Phase 0 starts from 0 — these are end-state targets after Phase 2.*

---

## 4. File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Pages | `page.tsx` | `app/assets/page.tsx` |
| Layouts | `layout.tsx` | `app/(dashboard)/layout.tsx` |
| API routes | `route.ts` | `app/api/assets/route.ts` |
| Server Components | `*.tsx` (default) | — |
| Client Components | `*.tsx` + `"use client"` | `qr-scanner.tsx` |
| Zod validators | `kebab-case.ts` | `asset.ts`, `dynamic-attrs.ts` |
| Service files | `kebab-case.service.ts` | `asset.service.ts` |
| shadcn/ui components | `ui/` | `components/ui/button.tsx` |
| Feature components | `kebab-case.tsx` | `kpi-card.tsx`, `qr-scanner.tsx` |
| Prisma schema | `schema.prisma` | `prisma/schema.prisma` |

---

## 5. Tech Stack Map

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.1 | App Router, RSC default |
| Language | TypeScript | 5.9.3 | Strict mode |
| ORM | Prisma | 7.5.0 | PostgreSQL via `pg` + PrismaPg adapter |
| Auth | Better Auth | 1.5.6 | Session-based, single Admin role |
| Validation | Zod | 4.3.6 | All API inputs |
| Client State | TanStack React Query | 5.95.2 | Query caching |
| Server State/UI | Sonner | 2.0.7 | Toasts |
| Styling | Tailwind CSS v4 | 4.2.2 | Uses `postcss.config.mjs`, NOT `tailwind.config.ts` |
| QR | `qrcode` npm package | 1.5.4 | DataURL + Buffer PNG |
| Mobile scan | `html5-qrcode` | 2.3.8 | Browser camera API |
| OCR | GPT-4o-mini (OpenAI) | — | Bilingual VN/EN, Vietnamese priority |
| Deployment | Local dev → Vercel | Phase 2+ | |

---

*Resolved: Invoice images now saved to `public/uploads/invoices/YYYY/MM/` and stored as web-relative path in `Invoice.filePath`. Display implemented in invoice detail page.*
*Unresolved: Backup provider — not yet selected*
