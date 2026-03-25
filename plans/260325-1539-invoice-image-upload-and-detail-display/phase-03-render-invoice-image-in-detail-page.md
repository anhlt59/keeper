# Phase 03 — Render Invoice Image in Detail Page

## Context Links
- Detail page: [app/(dashboard)/invoices/[id]/page.tsx](../../app/(dashboard)/invoices/[id]/page.tsx)
- Detail API: [app/api/invoices/[id]/route.ts](../../app/api/invoices/[id]/route.ts)

## Overview
- **Priority:** High
- **Status:** Complete
- **Description:** Show original invoice image in detail view when `filePath` exists; keep old invoices safe.

## Requirements
### Functional
1. Extend client invoice type to include nullable `filePath`.
2. Render image section conditionally when `filePath` exists.
3. Provide graceful fallback when image load fails.
4. Keep existing OCR/data sections unchanged.

### Non-functional
1. Accessible alt text and clear section heading.
2. Constrained image container to avoid layout break.
3. Backward compatible for `filePath = null`.

## Related Code Files
### Modify
- `app/(dashboard)/invoices/[id]/page.tsx`

### Create
- None

### Delete
- None

## Numbered Implementation Steps
1. Update invoice detail TypeScript type/interface with `filePath?: string | null`.
2. Add “Invoice Image” block in detail layout.
3. Render `<img>`/`Image` with bounded dimensions + object contain.
4. Add local error state via `onError` fallback message.
5. Hide image block when `filePath` is null/empty.
6. Verify no rendering regression for legacy records.

## Edge Cases
- Null `filePath` (legacy data) → no image section.
- Broken/missing file URL → fallback message, page still usable.
- Non-image URL should not be accepted by server path policy (covered in Phase 2).

## Success Criteria
- New invoices show image in detail screen.
- Legacy invoices remain fully functional.
- Broken image path does not crash UI.

## Risk Assessment
- **Visual clutter on detail page**
  - Mitigation: compact card and consistent order.
- **404 image URL noise**
  - Mitigation: error fallback and optional logging.

## Security Considerations
- Render only trusted local relative paths.
- Do not allow arbitrary external URL injection through UI.

## Migration Impact
- No DB migration.
- UI only; safe additive behavior.

## Unresolved Questions
- Preferred placement order: image before or after metadata card?
