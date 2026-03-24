# Phase 0 — Init Project

**Context:** [PRD v1](../../docs/prd-v1.md)

## Overview

- Priority: Critical
- Status: Completed
- Description: Bootstrap Next.js project + Prisma + PostgreSQL + Better Auth. Create the foundation for the entire system.

## Key Insights

- Use `create-next-app` with App Router + TypeScript + Tailwind.
- Prisma schema needs to be designed from the start based on the data boundary in the PRD.
- Better Auth needs config for session + CSRF + rate limiting.
- Project structure is feature-based (not grouped by file type).

## Requirements

- Next.js 15 App Router + TypeScript.
- Prisma ORM + PostgreSQL connection.
- Better Auth (session-based).
- Tailwind CSS + shadcn/ui.
- ESLint + Prettier.

## Architecture

### Directory Structure

```
app/
├── (auth)/              # Auth pages (login, logout)
│   ├── login/page.tsx
│   └── layout.tsx
├── (dashboard)/         # Protected pages
│   ├── layout.tsx       # Sidebar + header
│   ├── page.tsx         # Dashboard KPI
│   ├── assets/
│   │   ├── page.tsx     # Asset list
│   │   ├── new/page.tsx # Create asset
│   │   └── [id]/page.tsx # Asset detail
│   ├── categories/
│   │   └── page.tsx
│   ├── maintenance/
│   │   └── page.tsx
│   ├── invoices/
│   │   └── page.tsx
│   └── audit-logs/
│       └── page.tsx
├── api/
│   ├── auth/[...better-auth]/route.ts
│   ├── assets/route.ts
│   ├── assets/[id]/route.ts
│   ├── assets/[id]/events/route.ts
│   ├── assets/[id]/assign/route.ts
│   ├── assets/[id]/recall/route.ts
│   ├── categories/route.ts
│   ├── maintenance/route.ts
│   ├── invoices/route.ts
│   └── dashboard/route.ts
├── globals.css
├── layout.tsx
└── providers.tsx

prisma/
├── schema.prisma
└── seed.ts

lib/
├── db.ts               # Prisma client singleton
├── auth.ts             # Better Auth config
├── fsm.ts              # Custom FSM transitions
├── validators/
│   ├── asset.ts        # Zod schemas
│   ├── category.ts
│   ├── maintenance.ts
│   └── invoice.ts
└── utils.ts

components/
├── ui/                 # shadcn/ui components
├── layout/             # Sidebar, Header, Breadcrumb
├── assets/             # Asset-specific components
├── dashboard/          # KPI cards, charts
└── invoices/           # Invoice upload, preview
```

## Related Code Files

### Create new
- `app/layout.tsx` — Root layout
- `app/providers.tsx` — TanStack Query + Zustand providers
- `app/(auth)/login/page.tsx` — Login page
- `app/(dashboard)/layout.tsx` — Dashboard shell
- `prisma/schema.prisma` — Full database schema
- `lib/db.ts` — Prisma singleton
- `lib/auth.ts` — Better Auth config
- `lib/fsm.ts` — Lifecycle FSM
- `lib/validators/*.ts` — Zod schemas
- `.env.local` — Environment template
- `docker-compose.yml` — PostgreSQL local

### Create after this phase
- All pages, API routes, components (phase 1)

## Implementation Steps

1. [x] Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes`
2. [x] Install dependencies: `prisma @prisma/client better-auth @tanstack/react-query zod recharts`
3. [x] Install shadcn/ui: `npx shadcn@latest init` + add components (button, card, table, form, dialog, badge, input, label, select, textarea, alert, dropdown-menu, tabs, breadcrumb)
4. [x] Setup `docker-compose.yml` with PostgreSQL 16
5. [x] Init Prisma: `prisma init` + write full schema.prisma
6. [x] Run `prisma migrate dev` to create database
7. [x] Setup Better Auth with session + CSRF + rate limiting
8. [x] Create `lib/db.ts`, `lib/auth.ts`, `lib/fsm.ts`
9. [x] Create `lib/validators/*.ts` for all entities
10. [x] Create `app/providers.tsx` with TanStack Query
11. [x] Create `app/layout.tsx` and `app/(auth)/login/page.tsx`
12. [x] Create `app/(dashboard)/layout.tsx` with sidebar + header
13. [x] Create `.env.local.example` with all required env vars
14. [x] Create `prisma/seed.ts` with sample data
15. [x] Run lint + verify build pass

## Todo List

- [x] Project bootstrap
- [x] Prisma schema + migration
- [x] Better Auth setup
- [x] Directory structure foundation
- [x] Environment config
- [x] Seed data

## Success Criteria

- `npm run dev` starts without errors.
- Database migration runs successfully.
- Login page renders correctly, auth flow works.
- Dashboard shell renders with sidebar/header placeholder.
- ESLint passes without errors.

## Risk Assessment

- **shadcn/ui version conflict** → Lock specific version, check compatibility with Next.js 15.
- **Better Auth breaking changes** → Read docs carefully, lock stable version.
- **Prisma schema design miss** → Review data boundary in PRD carefully before finalizing.

## Security Considerations

- Better Auth: session cookies HttpOnly + Secure.
- Rate limiting: 5 login attempts / 15 min.
- CSRF protection via Better Auth built-in.
- `.env` not committed, only `.env.example`.
