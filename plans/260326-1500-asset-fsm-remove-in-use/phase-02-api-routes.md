# Phase 2 — API Routes

## Files to Modify

### `app/api/assets/[id]/assign/route.ts`

- Remove `IN_USE` from the assign guard, rename `PURCHASED` → `AVAILABLE`
- Re-assign (ASSIGNED → ASSIGNED): wrap `validateTransition` in try/catch; if same-status, skip FSM check

```ts
// Guard — rename PURCHASED → AVAILABLE
const validFromStatuses: AssetStatus[] = [AssetStatus.AVAILABLE, AssetStatus.ASSIGNED];
// Error message: "Must be AVAILABLE or ASSIGNED"

// validateTransition — handle same-status reassign
try {
  if (asset.status === parsed.data.employeeId ? AssetStatus.ASSIGNED : asset.status) {
    // no-op if already ASSIGNED to same employee — skip FSM check
  } else {
    validateTransition(asset.status, AssetStatus.ASSIGNED);
  }
} catch {
  return NextResponse.json({ error: "Invalid state transition" }, { status: 400 });
}
// Simpler: just check if already ASSIGNED and skip FSM call entirely
if (asset.status !== AssetStatus.ASSIGNED) {
  validateTransition(asset.status, AssetStatus.ASSIGNED);
}
```

### `app/api/assets/[id]/recall/route.ts`

- Remove `IN_USE` from recallableStatuses
- Rename `AssetStatus.PURCHASED` → `AssetStatus.AVAILABLE` (recall target + error message)

```ts
const recallableStatuses: AssetStatus[] = [AssetStatus.ASSIGNED];
// Error: "Must be ASSIGNED"
// toStatus: AssetStatus.AVAILABLE  // was PURCHASED
```

### `app/api/maintenance/[id]/route.ts`

Maintenance complete: `toStatus` → `ASSIGNED` (was `IN_USE`). Rename PURCHASED not needed here.

### `app/api/invoices/[id]/confirm/route.ts`

Rename `AssetStatus.PURCHASED` → `AssetStatus.AVAILABLE`. Check if this file references `PURCHASED` in transitions or guards.

### `lib/services/asset-service.ts`

Rename all `AssetStatus.PURCHASED` → `AssetStatus.AVAILABLE`. Check for IN_USE references.

## Success Criteria

- All 5 files: no `IN_USE` or `PURCHASED` references remain
- Re-assign (ASSIGNED → ASSIGNED) succeeds without FSM throw
- Recall: toStatus = AVAILABLE, from ASSIGNED only
- All routes pass TypeScript compile
