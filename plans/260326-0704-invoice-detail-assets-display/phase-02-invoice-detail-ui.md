# Phase 2: Invoice Detail UI — Redesign to Match Upload Invoice Style

## Overview
Redesign `app/(dashboard)/invoices/[id]/page.tsx` to use the same visual language as the Upload Invoice screen (step-indicator + `Card` shell layout).

## Key Insights
- Upload Invoice (`new/page.tsx`) uses: breadcrumb + heading + step indicator + `<Card><CardHeader><CardContent>` shell
- Invoice Detail currently uses: plain `<Card>` stacks without step indicator or card header
- Need to adapt: 2 "steps" — (1) Invoice Details, (2) Created Assets
- Asset list should display asset IDs (from API) with links to asset pages

## Requirements
- Invoice Detail page styled like Upload Invoice screen
- Display created assets with their IDs and names (linked to asset detail page)
- Show "No assets created" state when none exist

## Related Code Files
- `app/(dashboard)/invoices/[id]/page.tsx` — complete redesign
- `app/(dashboard)/invoices/new/page.tsx` — reference for style pattern
- `components/invoices/invoice-upload.tsx` — reference for upload component

## Architecture
- Two-step layout: (1) Invoice Info Card, (2) Created Assets Card
- Use `step` state to toggle between "details" and "assets" views (or just show both sequentially as cards)
- Actually — keep it simple: just 2 sequential cards like Upload Invoice's single-card shell, no step toggling needed since there's no multi-step flow

## Implementation Steps

### Step 1: Add breadcrumb + heading + step indicator
Match Upload Invoice's header pattern:
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <Link href="/invoices" className="hover:text-foreground flex items-center gap-1">
    <ChevronLeftIcon className="h-4 w-4" /> Invoices
  </Link>
  <span>/</span>
  <span className="text-foreground font-medium">
    {step === "details" ? "Invoice Details" : "Created Assets"}
  </span>
</div>

<h2 className="text-2xl font-bold tracking-tight">Invoice Details</h2>
<p className="text-muted-foreground text-sm mt-1">View confirmed invoice and its associated assets.</p>

{/* Step indicator — 2 steps: Info, Assets */}
<div className="flex items-center gap-2 text-sm">
  {(["details", "assets"] as Step[]).map((s, i) => (
    <div key={s} className="flex items-center gap-1">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
        i <= currentStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>{i + 1}</span>
      <span className={step === s ? "font-medium" : "text-muted-foreground"}>
        {s === "details" ? "Details" : "Assets"}
      </span>
    </div>
  ))}
</div>
```

### Step 2: Card 1 — Invoice Details
Wrap existing invoice detail section in `<Card><CardHeader><CardTitle>Step 1: Invoice Details</CardTitle></CardHeader><CardContent>`:
- Invoice number, vendor, date, amount
- Status badge
- Created timestamp
- Invoice image button
- OCR extraction section (if present)
- Raw OCR response (collapsible, if present)

### Step 3: Card 2 — Created Assets
New card showing assets linked to this invoice:
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <PackageIcon className="h-4 w-4" />
      Step 2: Created Assets ({assets.length})
    </CardTitle>
  </CardHeader>
  <CardContent>
    {assets.length === 0 ? (
      <p className="text-sm text-muted-foreground">No assets were created from this invoice.</p>
    ) : (
      <ul className="space-y-2">
        {assets.map((asset) => (
          <li key={asset.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">{asset.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{asset.code ?? asset.id}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/assets/${asset.id}`}>View →</Link>
            </Button>
          </li>
        ))}
      </ul>
    )}
  </CardContent>
</Card>
```

### Step 4: Update type interface
```ts
interface InvoiceDetail {
  ...
  assets: Array<{ id: string; code: string | null; name: string }>;
}
```

### Step 5: Update data fetching
Pass assets from GET to the display component.

## Todo
- [ ] Add breadcrumb + heading + step indicator
- [ ] Wrap invoice details in Card with step header
- [ ] Add Created Assets card with asset list + links
- [ ] Update InvoiceDetail interface with assets field
- [ ] Wire assets data from API to UI

## Success Criteria
- Invoice Detail page visually matches Upload Invoice screen structure
- Created assets are listed with ID/code + link to asset detail
- Empty state shown when no assets exist
