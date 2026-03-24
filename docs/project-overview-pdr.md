# Zoo — Asset Management System: Overview & PDR

> **Version:** 1.0.0 | **Type:** Asset Management System | **Status:** Phase 0 in progress
> **PRD:** [prd-v1.md](./prd-v1.md) | **Plan:** `plans/260325-0106-asset-mgmt-init/`

---

## 1. Purpose & Goals

Zoo Asset Management System is a centralized enterprise asset management system that tracks the full asset lifecycle from procurement to disposal.

**Primary Goals:**
- Create/update/delete assets with full status and lifecycle events.
- Trace each asset's history via immutable event log (append-only).
- Assign/recall assets to employees or departments.
- Track maintenance costs in realtime.
- Audit log for all business actions.
- Realtime KPI dashboard (total value, status distribution, maintenance cost).
- QR code + mobile scan to reduce manual operations.
- Semi-auto OCR invoice processing with GPT-4o-mini.

---

## 2. Target Users

| Persona | Use Case |
|---|---|
| **Admin** | Full access to the entire system. Asset CRUD, assignment, maintenance, invoice OCR, dashboard. Single role (MVP). |

---

## 3. Key Features (from PRD)

### Phase 1 (3–4 weeks) — Core
- Asset CRUD + auto QR generation
- Asset Lifecycle FSM (purchased → assigned → in_use → maintenance → retired / disposed)
- Assignment & Recall
- Maintenance tracking (description, vendor, cost, result)
- Audit log for all business actions
- Dashboard KPI (total value, status distribution, maintenance cost)
- Better Auth (session-based, Admin only)

### Phase 2 (2–3 weeks) — Enhanced
- Dynamic attributes per category (JSONB + Zod)
- QR/barcode generation + print (25mm × 25mm)
- Mobile web scan via `html5-qrcode`
- Semi-auto OCR invoice (GPT-4o-mini, bilingual VN/EN, Vietnamese priority)

### Phase 3 — Hardening
- Periodic Inventory Cycle
- Performance optimization + operational hardening

---

## 4. Out-of-Scope (MVP)

- Multi-location (multiple branches/warehouses)
- Office Supply Inventory
- Periodic Inventory Cycle (removed from Phase 1)
- Multi-role RBAC (Admin only)
- Advanced depreciation
- ERP/HRM integration
- Self-hosted OCR (Ollama)

---

## 5. Tech Stack (Locked)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| ORM | Prisma + PostgreSQL |
| Auth | Better Auth (session-based, single Admin role) |
| AI/OCR | GPT-4o-mini (OpenAI API) |
| Dynamic Attrs | PostgreSQL JSONB + Zod validation |
| Lifecycle FSM | Custom FSM + validation (no xstate) |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query + Zustand (if needed) |
| QR | `qrcode` library |
| Mobile Scan | `html5-qrcode` library |
| Deployment | Local dev → Vercel (future) |

---

## 6. Key Decisions (Locked)

1. **Custom FSM** — no xstate, validate at service layer
2. **JSONB + Zod** for dynamic attributes
3. **Prisma Middleware** for auto audit log
4. **GPT-4o-mini** for OCR (no Ollama/self-hosted)
5. **html5-qrcode** for mobile web scan
6. **Soft delete** — `is_deleted` + `deleted_at`, query always filters `WHERE is_deleted = false`
7. **Office Supply removed from MVP**
8. **Periodic Inventory removed from Phase 1**
9. **Local dev first, Vercel later**
10. **Bilingual OCR, Vietnamese priority** (fallback to English when confidence is low)
11. **Store original invoice images for 1 year** for audit/compliance

---

## 7. Capacity & Success Metrics

| Metric | Target |
|---|---|
| Max assets | 5,000 |
| Max lifecycle events | 200,000 |
| P95 API latency | < 500ms (CRUD/list) |
| Dashboard load | < 3s |
| Uptime | 99.5% |
| Asset capture rate | 100% new assets via system |
| Assignment/recall log coverage | ≥ 95% |
| Allocation/recall operation time reduction | ≥ 30% |

---

*Unresolved: Invoice storage — local filesystem vs. cloud? (not yet decided)*
*Unresolved: Backup provider — not yet selected*
