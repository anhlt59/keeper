# Phase 02 — Implement Upload Persistence in OCR Route

## Context Links
- API route: [app/api/invoices/ocr/route.ts](../../app/api/invoices/ocr/route.ts)
- Prisma schema: [prisma/schema.prisma](../../prisma/schema.prisma)
- PRD: [docs/prd-v1.md](../../docs/prd-v1.md)

## Overview
- **Priority:** High
- **Status:** Complete
- **Description:** Extend OCR create route to store image file and persist `invoice.filePath` while preserving existing behavior.

## Requirements
### Functional
1. Save uploaded image to `/public/uploads/invoices/YYYY/MM`.
2. Persist generated relative URL into `Invoice.filePath` during create.
3. Keep existing OCR extraction + invoice creation response compatible.
4. Keep current validation (image-only, max size) intact.

### Non-functional
1. Deterministic, collision-safe naming.
2. Best-effort file cleanup if DB write fails after file write.
3. Keep route readable; extract tiny helper if needed to stay maintainable.

## Related Code Files
### Modify
- `app/api/invoices/ocr/route.ts`

### Create
- Optional only if needed for size/readability:
  - `lib/storage/invoice-image-storage.ts`

### Delete
- None

## Numbered Implementation Steps
1. Add fs/path imports and define upload root constants.
2. Map accepted MIME types to safe extensions.
3. Generate safe filename using server-side id/timestamp (no client filename trust).
4. Ensure monthly directory exists (`mkdir recursive`).
5. Write file buffer to disk.
6. Persist public relative path to `invoice.filePath` in `prisma.invoice.create`.
7. Keep response shape backward compatible; add `filePath` only if additive.
8. Add best-effort cleanup path when downstream DB step fails.
9. Keep auth/error handling behavior unchanged.

## Validation and Edge Cases
- Unsupported MIME → reject.
- Oversized file → reject.
- File write error → return controlled error; no partial DB state.
- DB failure after write → attempt delete of written file.

## Success Criteria
- New OCR-created invoice has non-null `filePath` and accessible file URL.
- Existing endpoint consumers continue working without contract break.
- No regression in OCR extraction flow.

## Risk Assessment
- **Orphan files** if cleanup fails.
  - Mitigation: best-effort delete + operational cleanup note.
- **Runtime write permission issues**.
  - Mitigation: explicit error message + deployment checklist.

## Security Considerations
- Strict MIME/size checks.
- No directory traversal vectors in filename/path.
- Write only under designated uploads directory.

## Migration Impact
- No Prisma migration expected.
- Deployment must ensure writable persistent uploads directory.

## Unresolved Questions
- Should endpoint return `filePath` immediately or rely detail fetch only?
