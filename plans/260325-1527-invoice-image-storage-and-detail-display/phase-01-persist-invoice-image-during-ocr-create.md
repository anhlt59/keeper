# Phase 01 — Persist Invoice Image During OCR Create

## Context Links
- PRD: [docs/prd-v1.md](../../docs/prd-v1.md)
- System architecture OCR section: [docs/system-architecture.md](../../docs/system-architecture.md)
- API route to modify: [app/api/invoices/ocr/route.ts](../../app/api/invoices/ocr/route.ts)
- Prisma model: [prisma/schema.prisma](../../prisma/schema.prisma)

## Overview
- **Priority:** High
- **Status:** Planned
- **Description:** Extend OCR upload/create API to persist uploaded image file to local storage and save public path in `Invoice.filePath`.

## Key Insights
- `Invoice.filePath` already exists and nullable; no schema extension needed.
- OCR route currently reads uploaded file and creates invoice/ocr records, but does not store file.
- Minimal change path: keep one endpoint (`POST /api/invoices/ocr`) and append storage behavior.

## Requirements
### Functional
1. Save uploaded invoice image to local filesystem in public web path.
2. Persist saved file path into `invoice.filePath` for OCR-created invoice.
3. Keep existing OCR response payload backward compatible.
4. Keep validation constraints: image type only, max 10MB.

### Non-functional
1. Deterministic file naming to avoid collisions.
2. Prevent path traversal; never use untrusted filename directly as path.
3. Fail safely: do not return success if DB record failed.
4. Keep route file maintainable and under practical size limit.

## Architecture
### Storage flow
```text
Client uploads file
  -> /api/invoices/ocr
  -> validate mime + size
  -> read ArrayBuffer once
  -> OCR extraction from base64
  -> write file to /public/uploads/invoices/YYYY/MM/<invoiceId>-<ts>.<ext>
  -> create ocrExtraction + invoice(filePath=publicPath)
  -> link OCR to invoice
  -> return OCR result + invoiceId
```

### Data contract updates
- Request: unchanged (`multipart/form-data`, `file`)
- Response: keep existing fields; optionally add `filePath` for immediate client use (non-breaking additive)
- DB write:
  - `invoice.filePath` = `"/uploads/invoices/YYYY/MM/<name>.ext"`

## Related Code Files
### Modify
- `app/api/invoices/ocr/route.ts`

### Create
- None (prefer KISS in current route unless file exceeds maintainable size)

### Delete
- None

## Implementation Steps
1. Add Node fs/path imports (`fs/promises`, `path`) in OCR route.
2. Define constants:
   - upload root: `<project>/public/uploads/invoices`
   - extension map by mime type (`jpeg/jpg/png`).
3. Generate safe file name using server-generated values (invoice id candidate or cuid + timestamp).
4. Ensure monthly folder exists (`YYYY/MM`) via `mkdir(..., { recursive: true })`.
5. Write binary buffer to disk using `writeFile`.
6. Set `filePath` in `prisma.invoice.create` data.
7. Add cleanup handling:
   - if DB create/link fails after file write, remove written file in catch/finally best effort.
8. Keep existing validation and OCR error behavior unchanged for compatibility.
9. Optional additive response field: include `filePath`.

## Todo List
- [ ] Add local file storage logic in OCR route
- [ ] Persist `invoice.filePath` on create
- [ ] Add best-effort cleanup on post-write DB failure
- [ ] Keep response backward compatible

## Success Criteria
- New invoice created via OCR has non-null `filePath` in DB.
- Stored file exists in `public/uploads/invoices/...` and is browser accessible.
- Endpoint still returns OCR extraction payload and invoice ID.
- No regression to auth/validation behavior.

## Risk Assessment
- **Orphan files** if write succeeds but DB write fails.
  - Mitigation: best-effort delete on failure.
- **Large file memory use** from buffer conversion.
  - Mitigation: keep 10MB limit; no additional in-memory copies beyond current need.
- **Filename collisions**.
  - Mitigation: include unique id/timestamp in filename.

## Security Considerations
- Enforce whitelist mime types and extensions.
- Never trust client-provided filename for path.
- Store only relative public path in DB, not absolute server path.
- Keep auth requirement unchanged.

## Next Steps
- After Phase 1 complete, implement detail rendering in Phase 2.

## Migration Notes
- Expected DB migration: **none** (field already exists).
- Run `npx prisma validate` to confirm schema/client consistency.

## Rollback Notes
- If issue occurs, disable file write branch and continue OCR-create without `filePath` (current baseline behavior).
- Existing stored files can remain; cleanup can be done with one-off script if needed.

## Unresolved Questions
- None.
