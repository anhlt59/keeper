# PRD — Asset & Office Supply Management System (MVP Draft)

---

## 1) Problem Statement

The business currently manages assets and office supplies through manual, distributed operations — lacking full history traceability, making audits difficult, and obscuring maintenance costs and asset utilization rates. A centralized system is needed to manage the entire asset lifecycle from procurement to disposal.

## 2) Objectives

- Centralize management of all assets + office supply inventory.
- Trace full history per asset.
- Reduce manual work via QR/barcode and OCR invoice processing.
- Provide a realtime dashboard to support decision-making.

## 3) Scope

### 3.1 In-scope MVP

1. Per-item Asset CRUD.
2. Assignment/Recall (assign, recall).
3. Lifecycle event log (purchase → handover → in use → maintenance → recall/disposal).
4. Maintenance tracking (description, cost, duration, result).
5. Dynamic attributes per category.
6. Unique QR/barcode per asset + mobile web scan.
7. Basic realtime KPI dashboard.
8. Semi-auto OCR invoice (extract → admin confirm → save).
9. Monthly periodic inventory cycle.

### 3.2 Out-of-scope MVP

- Multi-location (multiple branches/warehouses).
- Multi-role RBAC (MVP is Admin-only).
- Advanced depreciation / complex accounting standards.
- ERP/HRM integration.

## 4) Users & Permissions

- **Admin (single role):** full access to all modules.

## 5) Capacity & SLA (Year-1)

- Up to **5,000 assets**.
- Up to **200,000 lifecycle events**.
- **P95 API < 500ms** for standard CRUD/list operations.
- Main dashboard **< 3s** load time.
- Target uptime **99.5%**.

---

## 6) Functional Requirements

### FR-01 Asset Management

- Create/update/delete assets.
- Auto-generate unique QR/barcode.
- Manage category, status, and purchase information.
- Assign assets to employees or departments.

**Acceptance Criteria**

- Duplicate QR/barcode assets cannot be created.
- Every change generates an event log + audit log.
- Invalid operations by status are blocked.

### FR-02 Lifecycle Management

- Record every status change as an immutable event (append-only).
- Display full timeline in chronological order.

**Acceptance Criteria**

- Old events cannot be directly modified or deleted.
- Timeline is in correct chronological order, fast retrieval per asset.

### FR-03 Assignment & Recall

- Assign assets to employees/departments.
- Recall assets when not in use.

**Acceptance Criteria**

- Sufficient data is stored: who acted, when, and reason.
- Disposed assets cannot be assigned.

### FR-04 Maintenance

- Create maintenance/repair records: description, vendor, cost, duration, result.

**Acceptance Criteria**

- Total maintenance cost is calculable per asset/month in realtime.
- Filterable by status, vendor, and date range.

### FR-05 Dynamic Attributes

- Admin defines attribute schemas per category (key, label, type, required).
- Assets are populated according to their category's schema.

**Acceptance Criteria**

- Adding a new category/attribute requires no core code changes.
- Type/required validation runs before saving.

### FR-06 QR/Barcode & Mobile Scan

- Each asset has a **unique QR code** (containing `/assets/{id}/lookup`).
- Auto-generated on asset creation.
- Scanned via mobile web camera to open the asset page or prefill an action.

**QR Label Spec (MVP)**

- Size: **25mm × 25mm** (small enough for compact assets, readable by phone camera).
- Layout: QR occupies 60%, asset name + short code occupy 40% below.
- Print format: PNG 300dpi, on white label.
- Print with: standard label printers (Zebra, Brother QL series) or A4 cut by hand.

**Acceptance Criteria**

- QR is valid and scannable with iOS Safari and Android Chrome.
- Manual input fallback when camera fails or is denied.
- Printable on standard label/consumer printers without special software.

### FR-07 Dashboard & Reports

- Basic KPIs:
  - Total asset original value.
  - Asset count by status.
  - Office supply inventory level.
  - Monthly maintenance cost.

**Acceptance Criteria**

- Dashboard loads in < 3 seconds with target data.
- Aggregated numbers match detailed reports.

### FR-08 OCR Invoice (Semi-auto)

- Upload invoice image/PDF.
- Extract vendor, invoice_date, total_amount, line_items (if any).
- **Bilingual support (Vietnamese/English), prioritizing Vietnamese** in parsing and field mapping.
- Show confidence scores + allow admin edits before confirmation.

**Acceptance Criteria**

- No auto-creation without admin confirmation.
- Both raw OCR and confirmed data are stored for audit.
- Default pipeline prioritizes Vietnamese recognition, fallback to English when confidence is low.

---

## 7) OCR Strategy Comparison (for implementation decision)

| Option                             | VN Accuracy | Contextual Layout | Cost (50 inv/mo) | Maintenance | Notes                               |
| ---------------------------------- | ----------: | ---------------- | ----------------: | ----------- | ----------------------------------- |
| Cloud Vision API (Textract/Vision)  |      85–92% | Good             |          ~$0.50–2 | Low         | Traditional OCR, needs post-process  |
| Claude Vision                      |      96–99% | Excellent        |          ~$0.30–1 | Low         | Best quality for edge cases         |
| GPT-4o / 4o-mini                   |      96–98% | Excellent        |         ~$0.15–0.50 | Low        | Best cost-performance               |
| Gemini 2.0 Flash                   |      95–98% | Excellent        |         ~$0.05–0.15 | Low        | Cheapest                           |
| Ollama self-hosted (Vision)        |      88–93% | Good             |       ~$20–60 (infra) | Medium-high | Cloud-independent, needs GPU        |
| Tesseract/TrOCR self-host          |      60–75% | Low              |            Free    | High        | Not recommended as primary          |

### Recommendation

- **Primary:** GPT-4o-mini or Gemini 2.0 Flash (high quality, low cost, fast deployment).
- **Fallback:** self-hosted vision (Ollama) if data policy changes require reducing cloud dependency.
- **Not recommended as primary:** Tesseract/TrOCR.

---

## 8) Non-functional Requirements

- Mandatory authentication for Admin.
- Audit log for all important business actions.
- **Original invoice retention: 1 year** from upload date, then archived or deleted per policy.
- Daily scheduled data backups, minimum 30-day retention.
- System error and API latency monitoring.

## 9) Data Boundary (MVP)

- `assets`
- `asset_categories`
- `asset_attribute_definitions`
- `asset_attribute_values`
- `asset_events` (append-only)
- `asset_assignments`
- `maintenance_records`
- `office_supply_items`
- `office_supply_movements`
- `invoices`
- `invoice_ocr_extractions`
- `audit_logs`
- `admins`

## 10) Risks & Mitigation

1. OCR misreads critical fields
   → Confirmation is mandatory before saving, confidence is displayed.

2. Mobile scan unreliable
   → Manual input fallback, guide to standard scan photos.

3. Realtime dashboard slow with growing data
   → Appropriate indexes, short-term cache for heavy KPIs.

4. Dynamic attributes become chaotic
   → Schema governance, only Admin can standardize.

## 11) Milestones (proposed)

- **Phase 1:** Asset + Lifecycle + Assignment + Maintenance + Audit + Basic Dashboard.
- **Phase 2:** Dynamic attributes + QR/mobile scan + inventory cycle.
- **Phase 3:** Semi-auto OCR + performance optimization + operational hardening.

## 12) Success Metrics

- 100% of new assets are recorded through the system.
- ≥95% of assign/recall transactions have complete logs.
- ≥30% reduction in time for allocation/recall operations.
- Inventory discrepancies reduced after 2 monthly cycles.

---

## Decisions Locked

1. **QR template set at MVP:** 25mm × 25mm, QR + asset name + short code.
2. **Bilingual OCR, Vietnamese priority** (fallback to English when confidence is low).
3. **Store original invoice images for 1 year** for audit/compliance.
