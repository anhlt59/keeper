# Keeper — Codebase Summary

> **Version:** 0.1.0 | **Root:** `/Users/anhlt/Projects/vibe/zoo/`
> **Tech Stack:** Next.js 16.2.1 · Prisma 7.5.0 · Better Auth 1.5.6 · Tailwind CSS v4 · Zod 4.3.6 · TanStack React Query 5.95.2

---

## 1. Directory Structure

```
zoo/                               # Git root
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth route group
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/               # Protected route group
│   │   ├── layout.tsx             # Sidebar + header shell
│   │   ├── page.tsx              # Dashboard KPI
│   │   ├── assets/
│   │   │   ├── page.tsx          # Asset list
│   │   │   ├── new/page.tsx     # Create new asset
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Asset detail
│   │   │       ├── edit/page.tsx # Edit asset
│   │   │       └── lookup/page.tsx # Public QR lookup (no auth)
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── attributes/
│   │   │   └── page.tsx
│   │   ├── employees/
│   │   │   └── page.tsx         # Employee list
│   │   ├── maintenance/
│   │   │   └── page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx         # Invoice list
│   │   │   ├── new/page.tsx    # Create invoice
│   │   │   └── [id]/page.tsx   # Invoice detail + OCR confirm
│   │   ├── audit-logs/
│   │   │   └── page.tsx
│   │   └── scan/
│   │       └── page.tsx         # Mobile QR scanner
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
│   │   │       ├── qr/route.ts   # Download QR PNG
│   │   │       └── lookup/route.ts # Public QR → asset ID (no auth)
│   │   ├── categories/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts     # GET/PUT/DELETE category
│   │   ├── attributes/
│   │   │   └── definitions/
│   │   │       ├── route.ts       # GET/POST attribute definitions
│   │   │       └── [id]/route.ts  # GET/PUT/DELETE single definition
│   │   ├── employees/
│   │   │   └── route.ts          # GET/POST employees
│   │   ├── maintenance/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── invoices/
│   │   │   ├── route.ts
│   │   │   ├── ocr/route.ts       # POST: upload + GPT-4o-mini OCR extraction
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET/PUT/DELETE invoice
│   │   │       └── confirm/route.ts # Admin confirm OCR → create assets + categories
│   │   ├── dashboard/
│   │   │   └── route.ts
│   │   └── audit-logs/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx                 # Root layout
│   └── providers.tsx              # TanStack Query + Sonner Toaster + LanguageProvider
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── lib/
│   ├── db.ts                      # Prisma client singleton (PrismaPg adapter)
│   ├── auth.ts                    # Better Auth config (prismaAdapter + openAPI plugin)
│   ├── fsm.ts                     # Asset lifecycle FSM + STATUS_CONFIG
│   ├── qr-generator.ts             # QR generation (NOT qr.ts)
│   ├── ocr.ts                     # GPT-4o-mini invoice extraction
│   ├── utils.ts                   # cn() utility
│   ├── api-fetch.ts               # Client fetch wrapper (redirects to /login on 401)
│   ├── audit.ts                   # Request-scoped audit context (defined, not used in routes)
│   ├── audit-logger.ts            # logAssetEvent() — creates AssetEvent + AuditLog
│   ├── validators/                # Zod v4 schemas
│   │   ├── asset.ts
│   │   ├── category.ts
│   │   ├── employee.ts
│   │   ├── dynamic-attrs.ts
│   │   ├── invoice.ts
│   │   └── maintenance.ts
│   └── services/                  # Business logic layer
│       ├── asset-service.ts
│       └── asset-qr-service.ts
│
├── context/
│   └── language-context.tsx       # LanguageProvider + useLanguage hook
│
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── assets/
│   │   ├── asset-timeline.tsx     # Enriched w/ user names
│   │   ├── assign-dialog.tsx
│   │   ├── maintenance-form.tsx
│   │   ├── qr-preview-modal.tsx
│   │   └── qr-scanner.tsx
│   ├── dashboard/
│   │   ├── kpi-card.tsx
│   │   ├── asset-status-chart.tsx
│   │   ├── asset-value-chart.tsx   # 6m value trend
│   │   ├── maintenance-cost-chart.tsx # 6m cost chart
│   │   └── recent-events.tsx
│   ├── invoices/
│   │   ├── invoice-form.tsx
│   │   ├── invoice-preview.tsx
│   │   ├── invoice-upload.tsx
│   │   ├── editable-invoice-row.tsx
│   │   └── editable-asset-row.tsx  # OCR confirm edit rows
│   ├── categories/
│   │   └── category-form.tsx
│   ├── attributes/
│   │   ├── definition-form.tsx
│   │   └── dynamic-field-renderer.tsx
│   ├── shared/
│   │   ├── language-toggle.tsx    # VI/EN toggle
│   │   ├── theme-toggle.tsx      # Light/dark/system
│   │   ├── status-badge.tsx
│   │   └── confirm-dialog.tsx
│   └── scan/
│       └── mobile-scanner.tsx
│
├── public/
│   └── uploads/
│       └── invoices/              # Invoice image storage (YYYY/MM/)
│
├── scripts/
│   ├── start.sh                   # Full local stack: Docker + migrate + seed + dev
│   └── migrate.sh                 # Docker + migrations only
│
├── docker-compose.yml             # PostgreSQL local dev
├── .env.local                    # Local env vars (not committed)
├── .env.example                  # Env template (committed)
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
| `lib/db.ts` | Prisma client singleton with PrismaPg adapter (avoids connection exhaustion in dev) |
| `lib/auth.ts` | Better Auth: prismaAdapter, openAPI plugin, session, CSRF, rate limiting |
| `lib/fsm.ts` | Asset lifecycle FSM — `validateTransition()`, `canTransition()`, `getAvailableTransitions()`, `STATUS_CONFIG` |
| `lib/qr-generator.ts` | Generate QR as DataURL and PNG Buffer (NOT `qr.ts`) |
| `lib/ocr.ts` | Call `gpt-4o-mini` for invoice extraction, 30s timeout |
| `lib/api-fetch.ts` | Client-side fetch wrapper with 401 → `/login` redirect |
| `lib/audit.ts` | Request-scoped audit context (defined, not currently used in routes) |
| `lib/audit-logger.ts` | `logAssetEvent()` — atomic `AssetEvent` + `AuditLog` write |
| `lib/validators/*.ts` | Zod v4 schemas for all API inputs |
| `lib/services/asset-service.ts` | Core asset DB write logic (FSM transitions, events). Complex writes prefer service layer; simple reads/writes use direct Prisma calls in routes. |
| `lib/services/asset-qr-service.ts` | QR-specific business logic |
| `app/providers.tsx` | QueryClientProvider + Sonner Toaster (position: bottom-right) + LanguageProvider |
| `context/language-context.tsx` | LanguageProvider + useLanguage() hook + i18n translations |
| `prisma/seed.ts` | Sample categories + assets for local dev |

---

## 3. LOC Targets (Fresh Project)

| Component | Target LOC |
|---|---|
| `app/` (pages, layouts, API routes) | ~2,500–3,500 |
| `lib/services/` | ~1,500–2,000 |
| `lib/validators/` | ~600–900 |
| `lib/fsm.ts` + `lib/qr-generator.ts` + `lib/ocr.ts` | ~500–800 |
| `lib/db.ts` + `lib/auth.ts` + `lib/audit*.ts` | ~200–300 |
| `components/` (custom) | ~2,500–3,500 |
| `prisma/schema.prisma` | ~500–800 |
| **Total app code** | **~8,300–12,000** |

*Phase 2 complete — LOC targets are end-state estimates.*

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
| Language | TypeScript | — | Strict mode |
| ORM | Prisma | 7.5.0 | PostgreSQL via `pg` + PrismaPg adapter |
| Auth | Better Auth | 1.5.6 | Session-based, single Admin role, openAPI plugin |
| Validation | Zod | 4.3.6 | All API inputs |
| Client State | TanStack React Query | 5.95.2 | `staleTime: 0`, `refetchOnWindowFocus: false` |
| Server State/UI | Sonner | 2.0.7 | Toasts, `position="bottom-right"` |
| Styling | Tailwind CSS v4 | 4.2.2 | Uses `postcss.config.mjs`, NOT `tailwind.config.ts` |
| QR | `qrcode` npm package | 1.5.4 | DataURL + Buffer PNG |
| Mobile scan | `html5-qrcode` | 2.3.8 | Browser camera API |
| Charts | Recharts | 3.8.0 | Dashboard charts |
| Mobile UI | @base-ui/react | 1.3.0 | Mobile sidebar/drawer components |
| OCR | GPT-4o-mini (OpenAI) | — | Bilingual VN/EN, Vietnamese priority |
| Deployment | Local dev → Vercel | Phase 3 | |

---

## 6. i18n Subsystem

| File | Responsibility |
|---|---|
| `context/language-context.tsx` | `LanguageProvider`, `useLanguage()` hook |
| `lib/i18n/translations.ts` | Core translation strings |
| `lib/i18n/translations-extended.ts` | Extended translation strings |
| `components/shared/language-toggle.tsx` | VI/EN language switcher UI |
| `components/shared/theme-toggle.tsx` | Light/dark/system theme switcher |

## 7. Theme Subsystem

| File | Responsibility |
|---|---|
| `components/shared/theme-toggle.tsx` | Light/dark/system mode toggle |
| `app/globals.css` | Tailwind v4 dark mode via CSS vars |

---

*Resolved: Invoice images now saved to `public/uploads/invoices/YYYY/MM/` and stored as web-relative path in `Invoice.filePath`. Display implemented in invoice detail page.*
*Unresolved: Backup provider — not yet selected*
