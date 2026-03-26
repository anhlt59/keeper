# Phase 4 — Frontend UI

## Files to Modify

### `app/(dashboard)/assets/page.tsx`

- Remove `<SelectItem value="IN_USE">In Use</SelectItem>`
- Rename `value="PURCHASED"` → `value="AVAILABLE"`, label `"Purchased"` → `"Available"`

### `app/(dashboard)/assets/[id]/page.tsx`

- Remove `t.to === AssetStatus.IN_USE` branch from transition icon mapping
- Check if any hardcoded `PURCHASED` labels need updating (STATUS_CONFIG drives most labels via Phase 1)

### `app/assets/[id]/lookup/page.tsx`

- Remove `IN_USE` from `STATUS_LABELS`
- Rename key `PURCHASED` → `AVAILABLE`, label `"Purchased"` → `"Available"`

## Success Criteria

- All status filter dropdowns show 5 options (AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED, DISPOSED)
- No `IN_USE` or `PURCHASED` string literals remain in these 3 files
- TypeScript compile passes
