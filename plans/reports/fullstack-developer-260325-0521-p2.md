# Phase 2 Report — Dynamic Attributes + QR/Barcode + Mobile Scan + OCR Invoice

**Date:** 2026-03-25
**Status:** ✅ Build passing

---

## Summary

All Phase 2 features implemented and building successfully.

## What Was Built

### Section 1: Dynamic Attributes Definitions
- `lib/validators/dynamic-attrs.ts` — Zod schemas + fieldTypeToZod() + buildDynamicAttrsSchema()
- `app/api/attributes/definitions/route.ts` — GET (list by categoryId) + POST (create)
- `app/api/attributes/definitions/[id]/route.ts` — GET + PUT + DELETE (soft)
- `app/(dashboard)/attributes/page.tsx` — Full management UI, grouped by category
- `components/attributes/definition-form.tsx` — Create/Edit dialog with field type selector
- `prisma/schema.prisma` — Added `AssetAttributeValue` model (assetId + values JSONB)

### Section 2: Dynamic Attributes — Asset Integration
- `components/attributes/dynamic-field-renderer.tsx` — Renders TEXT/NUMBER/BOOLEAN/ DATE/SELECT fields with required indicators
- Updated `app/(dashboard)/assets/new/page.tsx` — Dynamic fields card injected after static fields
- Updated `app/(dashboard)/assets/[id]/edit/page.tsx` — Dynamic fields card in edit form
- Updated `app/(dashboard)/assets/[id]/page.tsx` — "Attributes" tab in detail page, reads `attributeValue.values`
- Updated `lib/services/asset-service.ts` — `createAsset` + `updateAsset` both upsert `AssetAttributeValue`

### Section 3: QR Code Generation
- `lib/qr-generator.ts` — `generateQRCode()` (DataURL) + `generateQRBuffer()` (PNG Buffer)
- `lib/services/asset-qr-service.ts` — `generateAndStoreQR()`
- `app/api/assets/[id]/qr/route.ts` — Download QR as `image/png`
- `app/api/assets/[id]/lookup/route.ts` — Public GET (no auth) + in-memory rate limit 30 req/min/IP
- `components/assets/qr-preview-modal.tsx` — Modal with QR image + Download PNG + Print Label buttons
- Updated `app/(dashboard)/assets/[id]/page.tsx` — "QR" button opens preview modal
- `createAsset` in `asset-service.ts` now generates + stores QR on creation

### Section 4: Public QR Lookup
- `app/assets/[id]/lookup/page.tsx` — Public page (no auth), shows asset card + "View Full" + "Edit" buttons

### Section 5: Mobile QR Scanner
- `components/assets/qr-scanner.tsx` — html5-qrcode wrapper, camera permission flow, manual ID fallback
- `app/(dashboard)/scan/page.tsx` — Full-screen scanner page
- Updated `app/(dashboard)/layout.tsx` — Added "Scan" nav item + "Attributes" nav item

### Section 6: OCR Invoice — API
- `lib/ocr.ts` — OpenAI GPT-4o-mini Vision API extraction, Vietnamese-first prompt, 30s timeout, clear OPENAI_API_KEY error
- `app/api/invoices/ocr/route.ts` — Upload + OCR pipeline, JPG/PNG only (10MB max), returns extracted + confidence
- `app/api/invoices/route.ts` — GET (paginated list) + POST (create confirmed invoice)
- `app/api/invoices/[id]/route.ts` — GET + DELETE (soft)
- `app/api/invoices/[id]/confirm/route.ts` — POST: confirms PENDING invoice + marks OcrExtraction

### Section 7: OCR Invoice — UI
- `app/(dashboard)/invoices/page.tsx` — Invoice list with status badges, confidence %, actions
- `app/(dashboard)/invoices/new/page.tsx` — 3-step flow: Upload → OCR Preview → Confirm
- `app/(dashboard)/invoices/[id]/page.tsx` — Invoice detail, OCR vs confirmed data, raw response
- `components/invoices/invoice-upload.tsx` — Drag-drop upload with preview
- `components/invoices/invoice-preview.tsx` — Confidence-highlighted preview (green ≥90%, amber 70-89%, red <70%)
- `components/invoices/invoice-form.tsx` — Editable form, POST to confirm endpoint

### Section 8: Polish
- QR label print via CSS print media query (25mm×25mm) via JS window.open
- Empty states on all new pages
- Sidebar updated: Attributes + Scan + Invoices nav items

## Files Created (30+)
```
lib/validators/dynamic-attrs.ts
lib/qr-generator.ts
lib/services/asset-qr-service.ts
lib/ocr.ts
app/api/attributes/definitions/route.ts
app/api/attributes/definitions/[id]/route.ts
app/api/assets/[id]/qr/route.ts
app/api/assets/[id]/lookup/route.ts
app/api/invoices/route.ts
app/api/invoices/[id]/route.ts
app/api/invoices/[id]/confirm/route.ts
app/api/invoices/ocr/route.ts
components/attributes/dynamic-field-renderer.tsx
components/attributes/definition-form.tsx
components/assets/qr-preview-modal.tsx
components/assets/qr-scanner.tsx
components/invoices/invoice-upload.tsx
components/invoices/invoice-preview.tsx
components/invoices/invoice-form.tsx
app/(dashboard)/attributes/page.tsx
app/(dashboard)/scan/page.tsx
app/(dashboard)/invoices/page.tsx
app/(dashboard)/invoices/new/page.tsx
app/(dashboard)/invoices/[id]/page.tsx
app/assets/[id]/lookup/page.tsx
```

## Files Modified
- `prisma/schema.prisma` — Added `AssetAttributeValue` model + `attributeValue` relation on `Asset`
- `app/(dashboard)/layout.tsx` — Added nav items: Attributes, Scan
- `lib/services/asset-service.ts` — QR generation on create + attribute values upsert
- `app/(dashboard)/assets/[id]/page.tsx` — QR button + Attributes tab + qrImage field
- `app/(dashboard)/assets/new/page.tsx` — Dynamic fields card
- `app/(dashboard)/assets/[id]/edit/page.tsx` — Dynamic fields card + attributeValue

## Packages Installed
- `qrcode`, `@types/qrcode`, `html5-qrcode`

## Next Steps (DB Migration Required)
- Run `npx prisma migrate dev` to create `AssetAttributeValue` table
- Set `OPENAI_API_KEY` in `.env.local` for OCR to work
- Set `NEXT_PUBLIC_BASE_URL` for correct QR code URLs

## Unresolved Questions
- Should `attributeValues` be validated against `AttributeDefinition` schema at write time? Currently accepted as raw JSON.
- PDF support for invoices: plan skips pdf.js complexity; PDF uploads return error. Implement when needed.
