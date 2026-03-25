# PRD — Asset & Office Supply Management System (MVP v1)

---

## 1) Problem Statement

The business currently manages assets and office supplies through manual, distributed operations — lacking full history traceability, making audits difficult, and obscuring maintenance costs and asset utilization rates. A centralized system is needed to manage the entire asset lifecycle from procurement to disposal.

## 2) Objectives

- Centralize management of all assets.
- Trace full history per asset.
- Reduce manual work via QR/barcode and OCR invoice processing.
- Provide a realtime dashboard to support decision-making.

## 3) Tech Stack (Locked)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | 16.2.1 |
| ORM | Prisma + PostgreSQL | 7.5.0 |
| Auth | Better Auth (TypeScript-first, session-based) | 1.5.6 |
| AI/OCR | GPT-4o-mini (OpenAI API) | unversioned (pin in prod) |
| Dynamic Attrs | PostgreSQL JSONB + Zod validation | Zod 4.3.6 |
| Lifecycle FSM | Custom FSM + validation (no xstate) | — |
| Deployment | Local dev → Vercel (future) | — |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.2.2 |
| State | TanStack React Query | 5.95.2 |

## 4) Scope

### 4.1 In-scope MVP

**Phase 1 (3–4 weeks):**
1. Per-item Asset CRUD.
2. Assignment/Recall (assign, recall).
3. Lifecycle event log (purchase → handover → in use → maintenance → recall/disposal).
4. Maintenance tracking (description, cost, duration, result).
5. Audit log for all business actions.
6. Basic realtime KPI dashboard.
7. Better Auth (Admin only, single role).

**Phase 2 (2–3 weeks):**
8. Dynamic attributes per category.
9. Unique QR/barcode per asset + mobile web scan.
10. Semi-auto OCR invoice (extract → admin confirm → save).

### 4.2 Out-of-scope MVP

- Multi-location (multiple branches/warehouses).
- Office Supply Inventory (removed from MVP).
- Periodic Inventory Cycle (removed from Phase 1, deferred to Phase 3+).
- Multi-role RBAC (MVP is Admin-only).
- Advanced depreciation / complex accounting standards.
- ERP/HRM integration.
- Self-hosted OCR (Ollama).

## 5) Users & Permissions

- **Admin (single role):** full access to all modules.
- Auth: Better Auth with session-based sessions, rate limiting, and CSRF protection.

## 6) Capacity & SLA (Year-1)

- Up to **5,000 assets**.
- Up to **200,000 lifecycle events**.
- **P95 API < 500ms** for standard CRUD/list operations.
- Main dashboard **< 3s** load time.
- Target uptime **99.5%**.

---

## 7) Functional Requirements

### FR-01 Asset Management

- Create/update/delete assets.
- Auto-generate unique QR/barcode.
- Manage category, status, and purchase information.
- Assign assets to employees or departments.

**Acceptance Criteria:**
- Duplicate QR/barcode assets cannot be created.
- Every change generates an event log + audit log.
- Invalid operations by status are blocked.

### FR-02 Lifecycle Management (FSM)

- Custom FSM with states: `purchased` → `assigned` → `in_use` → `maintenance` → `retired` / `disposed`.
- Transitions are automatically validated (invalid state transitions are rejected).
- Events are immutable and append-only (old events cannot be modified or deleted).

**Acceptance Criteria:**
- Old events cannot be directly modified or deleted.
- Timeline is in correct chronological order, fast retrieval per asset.
- Invalid transitions return a clear error.

### FR-03 Assignment & Recall

- Assign assets to employees/departments.
- Recall assets when not in use.

**Acceptance Criteria:**
- Sufficient data is stored: who acted, when, and reason.
- Disposed assets cannot be assigned.

### FR-04 Maintenance

- Create maintenance/repair records: description, vendor, cost, duration, result.

**Acceptance Criteria:**
- Total maintenance cost is calculable per asset/month in realtime.
- Filterable by status, vendor, and date range.

### FR-05 Dynamic Attributes (JSONB + Zod)

- Admin defines attribute schemas per category (key, label, type, required).
- Assets are populated according to their category's schema.
- Storage: PostgreSQL JSONB column + Zod validation at the app layer.
- GIN index on JSONB column for queries.

**Acceptance Criteria:**
- Adding a new category/attribute requires no core code changes.
- Type/required validation runs before saving.
- Dynamic attributes are queryable (filter, search).

### FR-06 QR/Barcode & Mobile Scan

- Each asset has a **unique QR code** (containing `/assets/{id}/lookup`).
- Auto-generated on asset creation (using the `qrcode` library).
- Scanned via mobile web camera (`html5-qrcode` library) to open the asset page or prefill an action.

**QR Label Spec (MVP):**
- Size: **25mm × 25mm**.
- Layout: QR occupies 60%, asset name + short code occupy 40% below.
- Print format: PNG 300dpi, on white label.
- Print with: standard label printers (Zebra, Brother QL) or A4 cut by hand.

**Acceptance Criteria:**
- QR is valid and scannable with iOS Safari and Android Chrome.
- Manual input fallback when camera fails or is denied.
- Printable on standard label/consumer printers.

### FR-07 Dashboard & Reports

- Basic KPIs:
  - Total asset original value.
  - Asset count by status.
  - Asset count needing maintenance.
  - Monthly maintenance cost.
- Asset value distribution chart.
- Recent lifecycle events timeline.

**Acceptance Criteria:**
- Dashboard loads in < 3 seconds with target data.
- Aggregated numbers match detailed reports.

### FR-08 OCR Invoice (Semi-auto)

- Upload invoice image/PDF.
- Call GPT-4o-mini to extract: vendor, invoice_date, total_amount, line_items (if any).
- **Bilingual support (Vietnamese/English), prioritizing Vietnamese** in parsing and field mapping.
- Show confidence scores + allow admin edits before confirmation.
- Store both raw OCR output and confirmed data for audit.

**Acceptance Criteria:**
- No auto-creation without admin confirmation.
- Both raw OCR and confirmed data are stored.
- Default pipeline prioritizes Vietnamese recognition.

---

## 8) Data Boundary (MVP)

### Core Tables
- `admins` — Admin accounts (Better Auth)
- `asset_categories` — Asset categories
- `asset_attribute_definitions` — Schema definitions for dynamic attrs (key, label, type, required, category_id)
- `assets` — Core asset table (category_id, name, qr_code, status, purchase_info, custom_attrs JSONB, ...)
- `asset_attribute_values` — JSONB values per asset (asset_id + attrs JSONB)
- `asset_events` — Append-only lifecycle event log
- `asset_assignments` — Assignment history (assigned_to, assigned_by, reason, timestamps)
- `maintenance_records` — Maintenance history

### Invoice Tables
- `invoices` — Confirmed invoice records
- `invoice_ocr_extractions` — Raw OCR + confirmed extraction data (audit)

### Audit
- `audit_logs` — All action logs (who, what, when, old_value, new_value)

### Out of MVP
- ~~`office_supply_items`~~ — Removed
- ~~`office_supply_movements`~~ — Removed

## 9) Non-functional Requirements

- Security: Better Auth is mandatory for Admin (session-based, rate limiting, CSRF).
- Audit log for all important business actions.
- **Original invoice retention: 1 year** from upload date.
- Daily scheduled data backups, minimum 30-day retention. **[TBD]** Backup provider not yet selected.
- System error and API latency monitoring (future: Vercel Analytics / Sentry).
- **Invoice storage:** Original images/PDFs — local filesystem or cloud (S3/R2) **[UNRESOLVED]**.

## 10) Risks & Mitigation

1. **OCR misreads critical fields** → Confirmation is mandatory before saving, confidence is displayed.
2. **Mobile scan unreliable** → Manual input fallback, guide to standard scan photos.
3. **Realtime dashboard slow with growing data** → Appropriate indexes, short-term cache for heavy KPIs.
4. **Dynamic attributes become chaotic** → Schema governance, only Admin can standardize.
5. **FSM invalid state transitions** → Custom FSM auto-validates at the service layer.

## 11) Milestones

- **Phase 1:** Asset CRUD + Lifecycle FSM + Assignment/Recall + Maintenance + Audit + Dashboard + Better Auth.
- **Phase 2:** Dynamic Attributes + QR/Barcode + Mobile Scan + OCR Semi-auto.
- **Phase 3:** Periodic Inventory Cycle **[TBD — design deferred]** + Performance optimization + Operational hardening.

## 12) Success Metrics

- 100% of new assets are recorded through the system.
- ≥95% of assign/recall transactions have complete logs.
- ≥30% reduction in time for allocation/recall operations.
- Inventory discrepancies reduced after 2 monthly cycles.

---

## Decisions Locked

1. **Tech stack:** Next.js + Prisma + PostgreSQL + Better Auth + GPT-4o-mini.
2. **Dynamic attrs:** JSONB + Zod validation (no EAV).
3. **Lifecycle FSM:** Custom FSM (no xstate).
4. **OCR:** GPT-4o-mini (no Ollama/self-hosted).
5. **QR:** 25mm × 25mm, QR + asset name + short code.
6. **Bilingual OCR, Vietnamese priority** (fallback to English when confidence is low).
7. **Store original invoice images for 1 year** for audit/compliance.
8. **Office Supply + Periodic Inventory:** Removed from MVP, moved to Phase 3+.
9. **Asset Delete:** Soft delete (`is_deleted` flag + `deleted_at` timestamp). Query always filters `WHERE is_deleted = false`. Recoverable, preserves audit trail.
10. **Deployment:** Local dev first, Vercel later (Phase 2+).
