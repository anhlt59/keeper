# Plan — Invoice Image Storage and Detail Display

## Overview
- **Issue:** Persist uploaded invoice image when creating invoice via OCR, then show image in invoice detail view.
- **Scope:** Invoice OCR create flow + invoice detail UI + validation and rollout checks.
- **Strategy:** Local file storage under `public/uploads/invoices/` + save relative public path in `Invoice.filePath`.
- **PRD Context:** Improves invoice traceability and auditability by showing original image with OCR data.

## Phases
| Phase | File | Status | Deliverable |
|---|---|---|---|
| 1 | [phase-01-persist-invoice-image-during-ocr-create.md](./phase-01-persist-invoice-image-during-ocr-create.md) | Planned | OCR create flow saves image and persists `invoice.filePath` |
| 2 | [phase-02-show-stored-image-on-invoice-detail.md](./phase-02-show-stored-image-on-invoice-detail.md) | Planned | Invoice detail page renders stored image with fallback UX |
| 3 | [phase-03-validation-migration-and-rollout.md](./phase-03-validation-migration-and-rollout.md) | Planned | Validation checklist, migration notes, rollback notes |

## Dependencies
- Phase 1 → Phase 2 → Phase 3 (sequential)
- Phase 2 depends on `filePath` persisted by Phase 1.
- Phase 3 validates full integrated flow.

## Key Decisions (Locked)
1. Keep existing DB field `Invoice.filePath` (no schema shape change).
2. Use local storage in `public/uploads/invoices/` (YAGNI, no object storage integration now).
3. Store web-safe relative path (e.g. `/uploads/invoices/2026/03/<id>.jpg`) for direct rendering.
4. Keep current OCR extraction route and extend minimally (DRY, avoid parallel APIs).

## Success Criteria
- New OCR-created invoice stores non-null `filePath` when upload succeeds.
- Invoice detail page shows image preview for invoices with `filePath`.
- Existing invoices with `filePath = null` continue to work without UI break.
- Lint/build/prisma checks pass.

## Unresolved Questions
- None.
