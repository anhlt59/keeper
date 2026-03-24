# Zoo — Codebase Summary

> **Version:** 1.0.0 | **Root:** `/Users/anhlt/Projects/vibe/Zoo/`
> **Tech Stack:** Next.js 15 · Prisma · PostgreSQL · Better Auth · Tailwind · shadcn/ui

---

## 1. Target Directory Structure

```
Zoo/                               # Git root
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth route group
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/               # Protected route group
│   │   ├── layout.tsx             # Sidebar + header shell
│   │   ├── page.tsx               # Dashboard KPI
│   │   ├── assets/
│   │   │   ├── page.tsx           # Asset list
│   │   │   ├── new/page.tsx       # Create asset
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Asset detail
│   │   │       └── edit/page.tsx  # Edit asset
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── maintenance/
│   │   │   └── page.tsx
│   │   ├── invoices/
│   │   │   └── page.tsx
│   │   └── audit-logs/
│   │       └── page.tsx
│   ├── api/                       # REST API routes
│   │   ├── auth/[...better-auth]/
│   │   │   └── route.ts
│   │   ├── assets/
│   │   │   ├── route.ts           # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET, PATCH, DELETE
│   │   │       ├── events/route.ts
│   │   │       ├── assign/route.ts
│   │   │       ├── recall/route.ts
│   │   │       └── transition/route.ts
│   │   ├── categories/
│   │   │   ├── route.ts
│   │   │   └── [id]/attributes/route.ts
│   │   ├── maintenance/route.ts
│   │   ├── invoices/
│   │   │   ├── route.ts
│   │   │   └── [id]/confirm/route.ts
│   │   └── dashboard/route.ts
│   ├── globals.css
│   ├── layout.tsx                 # Root layout
│   └── providers.tsx              # TanStack Query + Zustand
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── auth.ts                    # Better Auth config
│   ├── fsm.ts                     # Custom FSM transitions
│   ├── qr.ts                      # QR generation
│   ├── ocr.ts                     # GPT-4o-mini extraction
│   ├── validators/                # Zod schemas
│   │   ├── asset.ts
│   │   ├── category.ts
│   │   ├── maintenance.ts
│   │   └── invoice.ts
│   └── services/                  # Business logic layer
│       ├── asset.service.ts
│       ├── category.service.ts
│       ├── maintenance.service.ts
│       ├── invoice.service.ts
│       └── dashboard.service.ts
│
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── breadcrumb.tsx
│   ├── assets/
│   │   ├── asset-list.tsx
│   │   ├── asset-form.tsx
│   │   ├── asset-detail.tsx
│   │   ├── asset-timeline.tsx
│   │   └── asset-qr.tsx
│   ├── dashboard/
│   │   ├── kpi-cards.tsx
│   │   ├── status-chart.tsx
│   │   └── maintenance-cost-chart.tsx
│   ├── maintenance/
│   │   └── maintenance-form.tsx
│   ├── invoices/
│   │   ├── upload-form.tsx
│   │   ├── ocr-preview.tsx
│   │   └── invoice-table.tsx
│   └── scan/
│       └── mobile-scanner.tsx
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
├── tailwind.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

---

## 2. Key Files & Responsibilities

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | All 10 tables, relations, indexes, soft delete fields |
| `lib/db.ts` | Prisma client singleton (avoids connection exhaustion in dev) |
| `lib/auth.ts` | Better Auth config: session, CSRF, rate limiting, admin adapter |
| `lib/fsm.ts` | Asset lifecycle state machine — validate + transition |
| `lib/qr.ts` | Generate QR PNG from asset ID, return public URL |
| `lib/ocr.ts` | Call GPT-4o-mini for invoice extraction, handle errors |
| `lib/validators/*.ts` | Zod schemas for all API inputs |
| `lib/services/*.ts` | All DB write logic — routes call services, not Prisma directly |
| `app/providers.tsx` | TanStack Query `QueryClientProvider` + Zustand store |
| `prisma/seed.ts` | Sample categories + assets for local dev |

---

## 3. LOC Targets (Fresh Project)

| Component | Target LOC |
|---|---|
| `app/` (pages, layouts, API routes) | ~2,000–3,000 |
| `lib/services/` | ~1,500–2,000 |
| `lib/validators/` | ~500–800 |
| `lib/fsm.ts` + `lib/qr.ts` + `lib/ocr.ts` | ~500–800 |
| `lib/db.ts` + `lib/auth.ts` | ~200–300 |
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
| Client Components | `*.tsx` + `"use client"` | `asset-form.tsx` |
| Zod validators | `*.ts` (kebab-case) | `asset-validator.ts` |
| Service files | `*.service.ts` | `asset.service.ts` |
| shadcn/ui components | `ui/` | `components/ui/button.tsx` |
| Feature components | `feature-name.tsx` | `asset-list.tsx` |
| Prisma schema | `schema.prisma` | `prisma/schema.prisma` |

---

## 5. Tech Stack Map

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 App Router | RSC default, `"use client"` where needed |
| Language | TypeScript | Strict mode |
| ORM | Prisma 6+ | PostgreSQL 16 |
| Auth | Better Auth | Session-based, single Admin role |
| Validation | Zod | All API inputs |
| State (client) | TanStack Query + Zustand | Query caching + local UI state |
| Styling | Tailwind CSS + shadcn/ui | Mobile-first |
| QR | `qrcode` npm package | 25mm × 25mm PNG |
| Mobile scan | `html5-qrcode` | Browser camera API |
| OCR | GPT-4o-mini (OpenAI) | Bilingual VN/EN, Vietnamese priority |
| Deployment | Local dev → Vercel | Phase 2+ |

---

*Unresolved: Invoice storage (local `public/` vs. cloud S3/Cloudflare R2)*
*Unresolved: Backup provider — not yet selected*
