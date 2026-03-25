# Phase 04 — Validate, Test, and Rollout

## Context Links
- OCR route: [app/api/invoices/ocr/route.ts](../../app/api/invoices/ocr/route.ts)
- Detail page: [app/(dashboard)/invoices/[id]/page.tsx](../../app/(dashboard)/invoices/[id]/page.tsx)
- Prisma schema: [prisma/schema.prisma](../../prisma/schema.prisma)

## Overview
- **Priority:** Medium
- **Status:** Complete
- **Description:** Verify end-to-end behavior, confirm migration safety, and prepare rollout/rollback notes.

## Requirements
### Functional validation
1. Upload image in new invoice flow → confirm invoice created.
2. Open invoice detail → image visible.
3. OCR and metadata behavior unchanged.

### Non-functional validation
1. Lint/build pass.
2. Prisma validate/migrate status clean.
3. Null/broken image path handled without crash.

## Related Code Files
### Modify
- None (verification phase)

### Create
- None

### Delete
- None

## Numbered Implementation Steps
1. Run static checks: `npm run lint`, `npm run build`.
2. Run schema checks: `npx prisma validate`, `npx prisma migrate status`.
3. Manual E2E happy path: upload → OCR confirm → detail display.
4. Manual edge cases:
   - Invalid file type and oversized file rejection.
   - Legacy invoice with null `filePath`.
   - Broken `filePath` fallback UX.
5. Confirm deployment assumptions (writable + persistent uploads directory).
6. Prepare rollback steps and release notes.

## Success Criteria
- All checks pass.
- Feature works end-to-end for new invoices.
- No regressions for existing invoices.
- Rollback path documented and executable.

## Risk Assessment
- **Environment drift** (schema or FS permissions).
  - Mitigation: explicit pre-release checks in each environment.
- **Storage growth over time**.
  - Mitigation: monitor folder size; schedule retention automation follow-up.

## Security Considerations
- Validate upload constraints remain enforced server-side.
- Ensure upload directory is not writable outside expected route path.
- Avoid logging sensitive OCR/image payloads.

## Migration Impact
- Expected DB migration: none.
- Operational impact: local storage persistence requirements must be met.

## Rollback Plan
1. Revert OCR route file persistence logic.
2. Revert detail image render block.
3. Keep nullable `filePath` column as-is (harmless).
4. Optionally remove newly stored files from uploads path during rollback window.

## Unresolved Questions
- Who executes storage monitoring + retention follow-up after release?
