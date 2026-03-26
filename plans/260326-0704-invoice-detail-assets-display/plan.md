# Plan: Invoice Detail — Asset IDs + Style Alignment

## Overview
Two targeted changes to the Invoice Detail page (`app/(dashboard)/invoices/[id]/page.tsx`):
1. **Add `assetIds` to Invoice model** — store IDs of assets created during confirm, display on detail screen
2. **Redesign Invoice Detail screen** — follow the same step-indicator + Card-based layout as Upload Invoice (`app/(dashboard)/invoices/new/page.tsx`)

## Changes
| # | Change | Files |
|---|--------|-------|
| 1 | Add `assetIds` relation to Invoice model, update confirm route to store IDs | `prisma/schema.prisma`, `app/api/invoices/[id]/confirm/route.ts` |
| 2 | Update GET API to include assets | `app/api/invoices/[id]/route.ts` |
| 3 | Redesign Invoice Detail page — step-indicator + Card shell | `app/(dashboard)/invoices/[id]/page.tsx` |

## Phases
- [Phase 1: Schema & API](./phase-01-schema-api.md) — add `assetIds` to DB, update confirm route, update GET
- [Phase 2: Invoice Detail UI](./phase-02-invoice-detail-ui.md) — redesign detail page to match Upload Invoice style

## Status
- **Phase 1:** ✅ Complete — `assetIds` added to Invoice model, confirm route stores IDs, GET API includes assets
- **Phase 2:** ✅ Complete — Invoice Detail page redesigned with step-indicator + Card-based layout matching Upload Invoice style
