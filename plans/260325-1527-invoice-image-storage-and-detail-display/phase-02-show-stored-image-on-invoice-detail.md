# Phase 02 — Show Stored Image on Invoice Detail

## Context Links
- Invoice detail page: [app/(dashboard)/invoices/[id]/page.tsx](../../app/(dashboard)/invoices/[id]/page.tsx)
- Invoice detail API: [app/api/invoices/[id]/route.ts](../../app/api/invoices/[id]/route.ts)
- OCR create page: [app/(dashboard)/invoices/new/page.tsx](../../app/(dashboard)/invoices/new/page.tsx)

## Overview
- **Priority:** High
- **Status:** Planned
- **Description:** Render persisted invoice image on detail page when `filePath` exists; keep graceful fallback for older invoices.

## Key Insights
- API already returns full invoice object from Prisma; `filePath` should be included automatically.
- Current detail page TypeScript interface omits `filePath`, so UI cannot access it.
- Minimal UX change: insert image section above OCR data card.

## Requirements
### Functional
1. Extend invoice detail TS type to include `filePath: string | null`.
2. Show image card/section when `filePath` is present.
3. Keep existing detail fields and OCR/raw sections unchanged.
4. If image path missing or load fails, show non-blocking fallback text.

### Non-functional
1. Avoid layout shift (bounded container height and object-fit).
2. Avoid UI break for null `filePath` invoices.
3. Keep page accessible (`alt` text, semantic heading).

## Architecture
### UI render logic
```text
fetch /api/invoices/:id
  -> data.filePath
    -> truthy: render <img src={filePath} ...>
    -> falsy: hide image block
  -> on image load error: show fallback message/placeholder
```

### API/data contract notes
- API route shape unchanged; this phase uses existing server payload.
- Client interface updates to reflect existing server field.

## Related Code Files
### Modify
- `app/(dashboard)/invoices/[id]/page.tsx`

### Create
- None

### Delete
- None

## Implementation Steps
1. Update `InvoiceDetail` interface to include `filePath`.
2. Add “Invoice Image” card/section in detail page with:
   - `img src={invoice.filePath}`
   - max height + object-contain class
   - descriptive alt text (invoice number/vendor fallback).
3. Add local state for image error fallback (simple boolean).
4. Render fallback text when image cannot load.
5. Ensure section hidden when `filePath` is null.
6. Keep existing cards ordering readable (Details → Image → OCR).

## Todo List
- [ ] Add `filePath` into client type
- [ ] Add conditional image render block
- [ ] Add image-error fallback state
- [ ] Verify null-path invoices still render correctly

## Success Criteria
- Newly OCR-created invoice displays uploaded image on detail page.
- Legacy invoices without image still load without errors.
- Broken image path does not crash page.

## Risk Assessment
- **404 image URLs** for moved/deleted files.
  - Mitigation: onError fallback and neutral message.
- **Large image rendering cost**.
  - Mitigation: constrained display box and object-fit.

## Security Considerations
- Render only trusted stored local path format (`/uploads/invoices/...`).
- Do not allow arbitrary external URL injection from client input.

## Next Steps
- Execute integrated checks and rollout notes in Phase 3.

## Migration Notes
- No Prisma migration needed for this UI phase.

## Rollback Notes
- Remove/disable image section in detail UI while preserving stored `filePath` data for future reuse.

## Unresolved Questions
- None.
