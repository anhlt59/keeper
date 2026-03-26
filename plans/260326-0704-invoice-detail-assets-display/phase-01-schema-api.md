# Phase 1: Schema & API — Add Asset IDs to Invoice

## Overview
Add `assetIds` to Invoice model to track which assets were created from it. Update confirm route to store those IDs and update GET to return them.

## Key Insights
- Invoice `assetIds` is a relation — 1 invoice can have many assets
- Confirm route already returns `{ invoice, createdAssets }` — just need to save asset IDs back to the invoice
- Must do in same transaction to avoid inconsistency

## Requirements
- Asset IDs stored on Invoice after confirm
- GET endpoint returns asset IDs

## Related Code Files
- `prisma/schema.prisma` — add `Asset[]` relation to `Invoice`
- `app/api/invoices/[id]/confirm/route.ts` — update `invoice.update` call to include `assetIds`
- `app/api/invoices/[id]/route.ts` — update GET `include` to include `assets`

## Implementation Steps

### Step 1: Update schema.prisma
Add `assets Asset[]` relation field to `Invoice` model:
```prisma
model Invoice {
  ...
  assets Asset[] // assets created from this invoice
}
```

### Step 2: Run Prisma migration
```bash
npx prisma migrate dev --name add_invoice_assets_relation
```

### Step 3: Update confirm route
After creating assets in the loop, collect their IDs and update the invoice:
```ts
// Collect created asset IDs
const createdAssetIds = createdAssets.map((a) => a.id);

// Update invoice with asset IDs
const updatedInvoice = await tx.invoice.update({
  where: { id },
  data: {
    assetIds: createdAssetIds, // new field
    ...
  },
});
```

### Step 4: Update GET route
Include `assets` in the Prisma findFirst include:
```ts
const invoice = await prisma.invoice.findFirst({
  where: { id, isDeleted: false },
  include: { ocrExtraction: true, assets: { select: { id: true, code: true, name: true } } },
});
```

## Todo
- [ ] Add `assets Asset[]` to Invoice model in schema.prisma
- [ ] Run Prisma migration
- [ ] Update confirm route to store `assetIds`
- [ ] Update GET route to include assets

## Success Criteria
- Invoice record includes array of created asset IDs after confirmation
- GET `/api/invoices/:id` returns assets array with id/code/name
