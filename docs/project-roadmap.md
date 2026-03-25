# Zoo — Project Roadmap

> **Version:** 1.0.0 | **Status:** Phase 0 in progress
> **PRD:** [prd-v1.md](./prd-v1.md)

---

## 1. Current Phase: Phase 0 — Init Project

| Item | Status |
|---|---|
| Phase | 0 — Init Project |
| Next.js 15 scaffold | ⏳ Pending |
| Prisma schema + migration | ⏳ Pending |
| Better Auth setup | ⏳ Pending |
| Directory structure | ⏳ Pending |
| Environment config | ⏳ Pending |

**Goal:** Foundation ready for Phase 1 implementation.

---

## 2. Phase Breakdown

### Phase 0: Init Project (Foundation) ⏳ In Progress
**Timeline:** ~1 week

| Deliverable | Description |
|---|---|
| Next.js 15 scaffold | App Router, TypeScript, Tailwind, ESLint, Prettier |
| Prisma schema | Full schema design (10 tables), migrate dev |
| Better Auth | Session-based, CSRF, rate limiting, single Admin role |
| Directory structure | app/, lib/, prisma/, components/ skeleton |
| Environment config | docker-compose.yml (PostgreSQL), .env.local |
| Seed data | Sample assets, categories for dev |

**Success criteria:** `npm run dev` starts without error, login works, dashboard shell renders.

---

### Phase 1: Core Features (3–4 weeks) ⏳ Pending
**PRD:** [prd-v1.md FR-01 to FR-04, FR-07]

| Deliverable | Description |
|---|---|
| Asset CRUD | Create/read/update/soft-delete assets with categories |
| Lifecycle FSM | purchased → assigned → in_use → maintenance → retired → disposed |
| Assignment/Recall | Assign to employee/department, recall with reason logged |
| Maintenance tracking | Record description, vendor, cost, duration, result |
| Audit log | Prisma Middleware auto-logs all business actions |
| Dashboard KPI | Total value, status distribution, maintenance cost/month, recent events |

**Dependencies:** Phase 0 complete

**Success criteria:**
- 100% new assets captured via system
- ≥ 95% assignment/recall transactions fully logged
- Dashboard loads < 3s
- P95 API < 500ms

---

### Phase 2: Enhanced Features (2–3 weeks) ⏳ Pending
**PRD:** [prd-v1.md FR-05 to FR-08]

| Deliverable | Description |
|---|---|
| Dynamic attributes | Admin defines schema per category (key/label/type/required) |
| QR/barcode generation | Auto-generate on asset create, 25mm × 25mm label |
| Mobile scan | html5-qrcode, scan to open asset page or prefill form |
| OCR invoice | Upload → GPT-4o-mini extract (VN/EN) → Admin confirm → Save |

**Dependencies:** Phase 1 complete

**Success criteria:**
- Dynamic attrs: add category without code changes
- QR: scannable on iOS Safari + Android Chrome
- OCR: confidence displayed, no auto-create without confirm

---

### Phase 3: Hardening (1–2 weeks) ⏳ Pending

| Deliverable | Description |
|---|---|
| Periodic Inventory Cycle | Scheduled physical count + discrepancy tracking |
| Performance optimization | Query index tuning, dashboard caching |
| Production hardening | Vercel deployment, monitoring (Sentry/Vercel Analytics) |

**Dependencies:** Phase 2 complete

---

## 3. Capacity Targets (Year-1)

| Metric | Target |
|---|---|
| Max assets | 5,000 |
| Max lifecycle events | 200,000 |
| P95 API latency | < 500ms |
| Dashboard load | < 3s |
| Uptime | 99.5% |

---

## 4. Success Metrics

| Metric | Target |
|---|---|
| Asset capture rate | 100% new assets via system |
| Assignment/recall log coverage | ≥ 95% |
| Allocation/recall operation time reduction | ≥ 30% |
| Inventory discrepancy after 2 cycles | < target TBD |

---

## 5. Deprecation Policy

### Soft Delete
All core entities use `is_deleted BOOLEAN DEFAULT false` + `deleted_at TIMESTAMP`. Never hard delete in MVP. Queries always filter `WHERE is_deleted = false`.

### Invoice Retention
Upload files retained for **1 year** from upload date. After 1 year, archived or deleted per policy (TBD).

### Archived Data
Old audit logs (> 2 years): partition by year, archive to cold storage (TBD backup provider).

---

## 6. Contributing Guidelines

1. Follow [code-standards.md](./code-standards.md) strictly
2. Every feature needs Zod validation + Prisma service layer (no direct DB in routes)
3. All writes must go through Prisma Middleware audit log
4. FSM transitions validated in service layer before DB write
5. No new dependencies without team discussion
6. PR requires: lint pass, build pass, relevant test coverage
7. **Prisma migrations must be committed** in same PR as code that uses them
8. Docs (`./docs/`) updated when features land or decisions change

**Commit format:** `feat:` · `fix:` · `docs:` · `refactor:` · `test:` · `chore:`

---

## 7. Phase History

| Phase | Name | Status |
|---|---|---|
| 0 | Init Project | ⏳ In Progress |
| 1 | Core Features | ⏳ Pending |
| 2 | Enhanced Features | ⏳ Pending |
| 3 | Hardening | ⏳ Pending |

**[TBD]** Backup provider — not yet selected (Vercel Postgres vs. dedicated pg_dump service)
**[TBD]** Periodic Inventory logic — needs detailed design when Phase 3 starts
