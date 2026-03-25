# Docs Impact Report: Invoice Confirm → Asset Creation

**Change:** `POST /api/invoices/[id]/confirm` now creates `Asset` records (+ `AssetEvent.CREATED` events) inside a serializable transaction, not just update the invoice record.

---

## Impact: **minor**

Three targeted doc updates needed. No structural changes, no new sections required.

---

## Changes Required

### 1. `docs/prd-v1.md` — FR-08 OCR Invoice (lines 158–170)

**Add clarification note** to acceptance criteria. The criterion "No auto-creation without admin confirmation" is still satisfied (OCR doesn't auto-create; admin confirmation triggers it). A one-liner should clarify the post-confirmation side effect.

**Suggested edit** (after line 167):
```markdown
**Acceptance Criteria:**
- No auto-creation without admin confirmation.
- Both raw OCR and confirmed data are stored.
- Default pipeline prioritizes Vietnamese recognition.
- **Admin confirmation creates Asset records** (one per line item, respecting quantity), in `PURCHASED` status with `CREATED` lifecycle event.
```

---

### 2. `docs/system-architecture.md` — Section 5 OCR Pipeline (lines 174–177)

The pipeline diagram ends at "Create confirmed invoice" — it should reflect asset creation.

**Suggested edit** (replace lines 174–177):
```markdown
[Create confirmed invoice + assets]
    └── invoice_ocr_extraction (confirmed_data: extracted values)
    └── invoice (full record with vendor, invoiceDate, totalAmount, filePath)
    └── Asset records — one per line item, respecting quantity
        └── status: PURCHASED, purchaseDate/vendor from invoice
        └── AssetEvent: CREATED (linked to invoice)
```

---

### 3. `docs/system-architecture.md` — Section 11 OCR Flow (lines 372–379)

The OCR Flow data flow diagram doesn't mention asset creation.

**Suggested edit** (replace lines 372–379):
```markdown
### OCR Flow
```
[Upload] → [Save raw file] → [extractInvoiceData — gpt-4o-mini]
    → [Save invoice_ocr_extraction (raw)]
    → [Admin confirm/edit] → [Save confirmed]
    → [Create invoice record]
    → [Create Asset records (PURCHASED, one per line item)]
    → [logAssetEvent: INSERT CREATED events + audit_logs]
```
```

---

## Not Needed

- **Section 7 API Layer** — `POST /api/invoices/[id]/confirm` description ("POST: admin confirm (create invoice)") is fine as-is; adding "create assets" detail is optional and low-value.
- **PRD Phase 2 description** — "Semi-auto OCR invoice (extract → admin confirm → save)" is generic enough; no change needed.
- **FR-08 functional description** — lines 159–165 cover extraction behavior; asset creation is an implementation detail, not a user-facing functional requirement.

---

## Unresolved Questions

- Should the invoice detail page show the list of created assets? (Not a docs question — a UI feature decision.)
