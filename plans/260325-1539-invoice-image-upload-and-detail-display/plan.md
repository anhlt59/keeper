# Plan — Invoice Image Upload and Detail Display

## Goal
Store original invoice image at create time, then display it in invoice detail.

## Scope
- OCR create API persistence (`Invoice.filePath`)
- Detail API/UI contract usage
- Validation, rollout, rollback notes

## Phases
| Phase | File | Status | Progress | Deliverable |
|---|---|---|---|---|
| 1 | [phase-01-design-storage-and-data-contract.md](./phase-01-design-storage-and-data-contract.md) | Complete | 100% | Locked storage design + API/data contract |
| 2 | [phase-02-implement-upload-persistence-in-ocr-route.md](./phase-02-implement-upload-persistence-in-ocr-route.md) | Complete | 100% | OCR route persists file + `invoice.filePath` |
| 3 | [phase-03-render-invoice-image-in-detail-page.md](./phase-03-render-invoice-image-in-detail-page.md) | Complete | 100% | Detail page renders image with fallback |
| 4 | [phase-04-validate-test-and-rollout.md](./phase-04-validate-test-and-rollout.md) | Complete | 100% | Validation checklist + rollout/rollback readiness |

## Dependencies
1. Phase 1 → Phase 2 (contract first)
2. Phase 2 → Phase 3 (`filePath` must exist)
3. Phase 3 → Phase 4 (validate integrated flow)

## Decision (v1)
- Storage backend: local filesystem at `/public/uploads/invoices`.
- Persist web-relative path in DB: `/uploads/invoices/YYYY/MM/<deterministic-name>.<ext>`.
- Keep API/UI backward compatible (additive only, null-safe).
- Design for future cloud migration via small storage abstraction boundary in API layer.

## Success Criteria
- New OCR-created invoices persist image + non-null `filePath`.
- Invoice detail shows image when `filePath` exists.
- Existing invoices with null `filePath` still work unchanged.
- Lint/build/prisma checks pass.

## Out of Scope (YAGNI)
- Cloud object storage integration now.
- Background retention cleanup job implementation now.
- New upload API endpoints.

## Unresolved Questions
- Confirm max retention enforcement owner (app job vs ops script) for 1-year requirement.
- Confirm deployment environment allows persistent local disk across restarts.
