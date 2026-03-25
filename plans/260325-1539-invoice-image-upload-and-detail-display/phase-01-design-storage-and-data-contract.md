# Phase 01 — Design Storage and Data Contract

## Context Links
- PRD: [docs/prd-v1.md](../../docs/prd-v1.md)
- OCR route: [app/api/invoices/ocr/route.ts](../../app/api/invoices/ocr/route.ts)
- Invoice detail API: [app/api/invoices/[id]/route.ts](../../app/api/invoices/[id]/route.ts)
- Invoice detail page: [app/(dashboard)/invoices/[id]/page.tsx](../../app/(dashboard)/invoices/[id]/page.tsx)
- Prisma model: [prisma/schema.prisma](../../prisma/schema.prisma)

## Overview
- **Priority:** High
- **Status:** Complete
- **Description:** Lock minimal v1 storage strategy and additive data contract before implementation.

## Key Insights
- `Invoice.filePath` already exists and nullable; no schema expansion expected.
- Current OCR create flow already receives and validates image; only persistence gap.
- Detail API returns invoice object; UI mostly needs type/render update.

## Requirements
### Functional
1. Decide deterministic local file path scheme.
2. Define API response compatibility strategy (additive only).
3. Define null-safe UI behavior for legacy invoices.

### Non-functional
1. Keep design simple (KISS) and no extra infra (YAGNI).
2. Keep migration path to cloud storage clear.
3. Keep naming/path generation DRY and secure.

## Architecture
### Proposed v1 storage contract
```text
Server write target: <repo>/public/uploads/invoices/YYYY/MM/
DB value: /uploads/invoices/YYYY/MM/<invoiceId-or-cuid>-<timestamp>.<ext>
Allowed ext: jpg, jpeg, png
```

### Forward migration boundary
- Keep write/read logic centralized in OCR route helper block.
- Later cloud migration swaps write/read implementation, keeps DB `filePath` semantic stable.

## Related Code Files
### Modify
- `app/api/invoices/ocr/route.ts`
- `app/(dashboard)/invoices/[id]/page.tsx`

### Create
- None (unless route exceeds maintainable size)

### Delete
- None

## Implementation Steps
1. Confirm path contract format and extension policy.
2. Confirm response shape: keep existing fields, optional additive `filePath` only.
3. Confirm fallback behavior when `filePath` missing/invalid.
4. Confirm migration impact: no required Prisma schema migration expected.
5. Capture risks + rollout assumptions for junior dev handoff.

## Todo List
- [ ] Lock path format and naming convention
- [ ] Lock additive API contract
- [ ] Lock UI fallback contract
- [ ] Document migration and rollback assumptions

## Success Criteria
- Team has one agreed storage contract and null-safe UI contract.
- No breaking API change introduced by design.
- Implementation-ready checklist is clear for junior dev.

## Risk Assessment
- **Ephemeral disk risk in some hosting setups**
  - Mitigation: document deployment assumption + cloud migration follow-up.
- **Path inconsistency across code paths**
  - Mitigation: single helper logic for path creation.

## Security Considerations
- Never trust client filename for server path.
- Enforce MIME + size checks server-side.
- Persist only relative public path, never absolute disk path.

## Migration Impact
- DB schema: expected none.
- Ops: ensure upload directory writable and retained in deployment.

## Unresolved Questions
- Is production runtime using persistent volume for `public/uploads`?
- Who owns 1-year cleanup policy execution (app cron vs infra script)?
