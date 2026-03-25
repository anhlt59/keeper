# Phase 03 — Validation, Migration Checks, and Rollout

## Context Links
- OCR API: [app/api/invoices/ocr/route.ts](../../app/api/invoices/ocr/route.ts)
- Invoice detail page: [app/(dashboard)/invoices/[id]/page.tsx](../../app/(dashboard)/invoices/[id]/page.tsx)
- Invoice schema: [prisma/schema.prisma](../../prisma/schema.prisma)

## Overview
- **Priority:** Medium
- **Status:** Planned
- **Description:** Validate correctness, ensure migration safety, and document rollback path before merge.

## Key Insights
- Feature spans API + filesystem + UI; must verify end-to-end, not only unit scope.
- Schema already includes `filePath`, so migration is likely unnecessary but must be validated.
- Existing invoices without file path are valid and expected.

## Requirements
### Functional validation
1. Upload JPG/PNG invoice via new invoice flow and confirm invoice.
2. Open created invoice detail from list and verify image is visible.
3. Verify OCR data and status behavior unchanged.

### Non-functional validation
1. Build/lint pass.
2. Prisma schema validate pass.
3. No crash on missing image file or null path.

## Architecture
### Validation flow
```text
Run static checks -> run Prisma checks -> manual e2e (upload/create/detail) -> review logs -> finalize
```

## Related Code Files
### Modify
- None (execution/checklist phase)

### Create
- None

### Delete
- None

## Implementation Steps
1. Run compile/quality checklist:
   - `npm run lint`
   - `npm run build`
2. Run Prisma checks:
   - `npx prisma validate`
   - `npx prisma migrate status`
3. Migration decision:
   - If current DB already has `Invoice.filePath`: no migration file.
   - If drift/missing column: generate migration and apply in environment process.
4. Manual scenario tests:
   - Happy path: upload -> OCR -> confirm -> detail image visible.
   - Null path: open pre-existing invoice with no image.
   - Broken image: temporarily invalid path and confirm graceful fallback.
   - Validation: unsupported type/oversize still rejected.
5. Capture rollout notes for ops/dev.

## Todo List
- [ ] Run lint/build
- [ ] Run Prisma validate/migrate status
- [ ] Execute manual e2e happy path
- [ ] Execute edge-case checks (null/broken path, invalid file)
- [ ] Confirm rollback steps are clear

## Success Criteria
- All checks pass without new errors.
- End-to-end workflow works for new invoices with image.
- No regression for existing invoices and OCR flow.

## Risk Assessment
- **Environment mismatch** (DB drift across local/staging).
  - Mitigation: explicit `prisma validate` + `migrate status` before release.
- **Disk growth** from invoice image storage.
  - Mitigation: monitor upload directory size; plan retention policy later if needed.

## Security Considerations
- Keep file type and size validation enforced server-side.
- Ensure uploads stay under project public uploads directory only.
- No sensitive metadata leakage in file naming.

## Next Steps
- If validated, proceed to implementation and then docs sync check (`docs impact: minor`).

## Migration Notes
- Baseline expectation: **no new migration**.
- Command checklist includes migration status verification to catch drift early.

## Rollback Notes
1. Revert OCR route persistence changes.
2. Revert detail image render block.
3. Keep DB schema unchanged (`filePath` nullable remains harmless).
4. Optional: remove newly uploaded files under `public/uploads/invoices/` for rollback window.

## Compile/Test Checklist
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npx prisma validate`
- [ ] `npx prisma migrate status`

## Unresolved Questions
- None.
