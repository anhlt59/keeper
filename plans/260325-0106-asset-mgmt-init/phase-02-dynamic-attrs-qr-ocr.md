# Phase 2 — Dynamic Attributes + QR/Barcode + Mobile Scan + OCR Invoice

**Context:** [PRD v1](../../docs/prd-v1.md) | [Phase 0](./phase-00-init-project.md) | [Phase 1](./phase-01-asset-lifecycle-dashboard.md)

## Overview

- Priority: Medium
- Status: Completed
- Description: Add dynamic attributes per category, QR code generation + printing, mobile web scanning, and OCR invoice processing. This phase enhances UX and automation.

## Key Insights

- **Dynamic Attributes**: Use JSONB + Zod. Each category has its own schema definition. Asset values stored in `asset_attribute_values` table with JSONB. GIN index on `attrs` column for queries.
- **QR Code**: `qrcode` library to generate PNG, store in `assets.qr_image` (base64 or file). Print label 25mm×25mm via CSS print media query.
- **Mobile Scan**: `html5-qrcode` library. Camera permission flow needs graceful degradation. Fallback: manual asset ID entry.
- **OCR**: GPT-4o-mini via OpenAI API. Upload file → convert to base64 → send to vision endpoint → parse JSON → show preview with confidence → admin confirm → save.

## Architecture

### Dynamic Attributes Flow

```
Admin defines schema
  → asset_attribute_definitions table
  → AssetForm reads schema → renders dynamic fields
  → Submit → Zod validates against schema
  → Save to asset_attribute_values (attrs JSONB)
  → Index GIN on attrs for queries
```

### QR Flow

```
Asset created
  → Generate QR content: {origin}/assets/{id}/lookup
  → qrcode library → PNG buffer
  → Store base64 in assets.qr_image
  → Show in detail page + downloadable
  → Print label via CSS @media print
```

### OCR Flow

```
Upload image/PDF
  → Convert to base64 (pdf → images via pdf.js)
  → POST /api/invoices/ocr
    → OpenAI Vision API (gpt-4o-mini)
    → Prompt: structured extraction (vendor, date, amount, items)
    → Return {extracted, confidence, raw}
  → Show preview page
    → Admin reviews, edits
    → POST /api/invoices (confirm)
  → Save: invoice + invoice_ocr_extraction (raw + confirmed)
```

### API Routes Structure

```
app/api/attributes/definitions/     GET + POST
app/api/attributes/definitions/[id]/ PUT + DELETE
app/api/assets/[id]/qr/              GET (download QR PNG)
app/api/assets/[id]/lookup/          GET (public, no auth — for QR scan)
app/api/assets/lookup/[code]/         GET (public, no auth — for QR scan)
app/api/invoices/                   GET (list) + POST (create from OCR)
app/api/invoices/ocr/               POST (upload → OCR extract)
app/api/invoices/[id]/              GET + DELETE
app/api/invoices/[id]/confirm/       POST (confirm OCR extraction)
```

## Related Code Files

### Create new

#### Dynamic Attributes
- `app/api/attributes/definitions/route.ts` — GET + POST schema definitions
- `app/api/attributes/definitions/[id]/route.ts` — PUT + DELETE
- `app/(dashboard)/attributes/page.tsx` — Schema management UI
- `components/attributes/definition-form.tsx`
- `components/attributes/definition-list.tsx`
- `components/attributes/dynamic-field-renderer.tsx` — Renders fields based on schema
- `lib/validators/dynamic-attrs.ts` — Zod schemas for each attribute type

#### QR/Barcode
- `lib/qr-generator.ts` — QR generation logic
- `app/api/assets/[id]/qr/route.ts` — Download QR PNG
- `app/api/assets/[id]/lookup/route.ts` — Public asset lookup (for QR)
- `components/assets/qr-preview-modal.tsx`
- `components/assets/qr-label-print.tsx` — Print-ready label component

#### Mobile Scan
- `components/assets/qr-scanner.tsx` — html5-qrcode wrapper
- `app/(dashboard)/scan/page.tsx` — Full-screen scanner page

#### OCR Invoice
- `lib/ocr.ts` — OpenAI Vision API call
- `app/api/invoices/ocr/route.ts` — Upload + OCR pipeline
- `app/api/invoices/[id]/confirm/route.ts` — Confirm extraction
- `app/(dashboard)/invoices/page.tsx` — Invoice list
- `app/(dashboard)/invoices/new/page.tsx` — Upload + OCR preview
- `app/(dashboard)/invoices/[id]/page.tsx` — Invoice detail
- `components/invoices/invoice-upload.tsx`
- `components/invoices/invoice-preview.tsx` — Shows OCR result + confidence
- `components/invoices/invoice-form.tsx`

### Modify
- `prisma/schema.prisma` — Add tables + indexes
- `app/(dashboard)/assets/[id]/page.tsx` — Add QR tab + dynamic attrs tab
- `app/(dashboard)/assets/[id]/edit/page.tsx` — Add dynamic fields
- `app/(dashboard)/assets/new/page.tsx` — Add dynamic fields
- `app/(dashboard)/layout.tsx` — Add nav: Attributes, Scan, Invoices
- `lib/validators/invoice.ts` — Zod schema for invoice

## Implementation Steps

### 1. Dynamic Attributes Definitions
1. [ ] Add `asset_attribute_definitions` to Prisma schema
2. [ ] Create `lib/validators/dynamic-attrs.ts` with Zod schemas (string, number, boolean, date, select)
3. [ ] `app/api/attributes/definitions/route.ts` — CRUD definitions
4. [ ] `app/(dashboard)/attributes/page.tsx` — UI: list definitions, add/edit/delete
5. [ ] `components/attributes/definition-form.tsx` — Form with field type selector
6. [ ] Test: Add definition "RAM" (number) for Laptop category

### 2. Dynamic Attributes — Asset Integration
7. [ ] Add `asset_attribute_values` table to schema (asset_id + attrs JSONB)
8. [ ] `components/attributes/dynamic-field-renderer.tsx` — Render fields from schema:
   - Input types: text, number, boolean (toggle), date, select (options)
   - Required indicator
   - Validation error display
9. [ ] Update asset create/edit forms — inject dynamic fields after static fields
10. [ ] Update asset detail page — show dynamic attrs in Info tab
11. [ ] `lib/validators/asset.ts` — Merge static + dynamic Zod validation
12. [ ] GIN index on attrs JSONB: `CREATE INDEX ON asset_attribute_values USING GIN (attrs)`
13. [ ] Test: Create Laptop asset with dynamic fields (RAM, Storage)

### 3. QR Code Generation
14. [ ] Create `lib/qr-generator.ts`:
    - Input: content string, size (pixels)
    - Output: PNG buffer (using `qrcode` npm package)
    - Error correction: H (high) for readability when printed small
15. [ ] Generate QR automatically when creating asset (in create handler)
16. [ ] Store base64 PNG in `assets.qr_image`
17. [ ] `app/api/assets/[id]/qr/route.ts` — Return QR PNG as file download
18. [ ] `components/assets/qr-preview-modal.tsx` — Show QR + download button + print label
19. [ ] `components/assets/qr-label-print.tsx` — Print-ready 25mm×25mm label
20. [ ] Add `@media print` CSS for label printing
21. [ ] Test: Verify QR scannable from iOS Safari + Android Chrome

### 4. Public QR Lookup
22. [ ] Create `app/assets/[id]/lookup/page.tsx` — Public page (no auth required):
    - Show basic asset info
    - Action buttons: View Full, Assign (prefill), Report Issue
23. [ ] `app/api/assets/[id]/lookup/route.ts` — Public API (rate limited)
24. [ ] QR content will be: `{baseUrl}/assets/{id}/lookup`
25. [ ] Test: Scan QR → redirect to correct page

### 5. Mobile QR Scanner
26. [ ] `components/assets/qr-scanner.tsx`:
    - html5-qrcode library
    - Request camera permission gracefully
    - On scan: redirect to `/assets/{id}/lookup`
    - On error: show manual input fallback
27. [ ] `app/(dashboard)/scan/page.tsx` — Full-screen scanner
28. [ ] Add to sidebar nav: "Scan Asset" button (opens scanner page)
29. [ ] Test: Scan real QR from asset label

### 6. OCR Invoice — API
30. [ ] Add `invoices` + `invoice_ocr_extractions` to schema
31. [ ] Create `lib/ocr.ts`:
    - Function: `extractInvoiceData(imageBase64: string): Promise<OcrResult>`
    - Prompt: Vietnamese-first, extract vendor, date, total, line items
    - Return structured JSON + confidence scores per field
    - Timeout: 30s
32. [ ] `app/api/invoices/ocr/route.ts`:
    - Accept: multipart/form-data (image or PDF)
    - PDF → images via pdf.js (if needed, fallback to first page)
    - Call `lib/ocr.ts`
    - Return: { extracted, confidence, raw }
    - Store: invoice (status=pending) + invoice_ocr_extraction (raw)

### 7. OCR Invoice — UI
33. [ ] `app/(dashboard)/invoices/page.tsx` — List: date, vendor, amount, status, actions
34. [ ] `app/(dashboard)/invoices/new/page.tsx`:
    - Step 1: Upload image/PDF
    - Step 2: Show OCR preview with confidence highlights
    - Step 3: Admin edits extracted data
    - Step 4: Confirm → save invoice
35. [ ] `components/invoices/invoice-upload.tsx` — Drag-drop upload
36. [ ] `components/invoices/invoice-preview.tsx` — Confidence-highlighted preview:
    - Green: confidence ≥ 90%
    - Yellow: 70–89%
    - Red: < 70% — editable field
37. [ ] `components/invoices/invoice-form.tsx` — Editable form pre-filled from OCR
38. [ ] `app/(dashboard)/invoices/[id]/page.tsx` — Invoice detail: raw OCR vs confirmed data side-by-side
39. [ ] Add to sidebar nav: Invoices
40. [ ] Test: Upload sample Vietnamese invoice → verify extraction accuracy

### 8. Polish
41. [ ] Add scanner to mobile nav (bottom bar or FAB)
42. [ ] Print label: CSS @media print for QR label
43. [ ] Empty state + loading skeletons for all new pages
44. [ ] Toast notifications for OCR upload + confirm
45. [ ] Run lint + verify build pass

## Todo List

- [ ] Dynamic attribute definitions API + UI
- [ ] Dynamic fields in asset create/edit
- [ ] Dynamic attrs in asset detail
- [ ] QR generation + storage
- [ ] QR preview + download + print label
- [ ] Public QR lookup page + API
- [ ] Mobile QR scanner (html5-qrcode)
- [ ] OCR API (GPT-4o-mini Vision)
- [ ] Invoice list + upload page
- [ ] OCR preview + confidence highlighting
- [ ] Invoice confirm + detail page
- [ ] Polish + test

## Success Criteria

- Admin creates dynamic attribute definition without code changes.
- Asset form renders correct dynamic fields per category schema.
- Zod validates dynamic values, rejects invalid types.
- QR generated and scannable by phone camera.
- QR label printable 25mm×25mm on standard printer.
- OCR returns structured data with confidence scores.
- Admin confirms invoice before saving to database.
- Both raw OCR + confirmed data are stored.

## Risk Assessment

- **GPT-4o-mini OCR accuracy**: Prompt engineering needs iteration. Test with 10+ sample invoices (VN + EN) before shipping.
- **PDF to image conversion**: pdf.js can be complex. Consider: only support JPG/PNG first, PDF later.
- **QR scan failure on dark/reflective surfaces**: Recommend printing on white matte label, not on glass.
- **Camera permission denied**: Fallback manual asset code entry.

## Security Considerations

- QR lookup API: rate limit 30 req/min/IP (public endpoint).
- OCR API: validate file type (jpg, png, pdf only), max 10MB.
- Invoice images: store locally or S3-compatible storage.
- Session required for all UI pages.
