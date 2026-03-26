# Phase 3 — Prisma Schema

## Files to Modify

### `prisma/schema.prisma`

Two changes: remove `IN_USE`, rename `PURCHASED` → `AVAILABLE`.

**Before:**
```prisma
enum AssetStatus {
  PURCHASED
  ASSIGNED
  IN_USE
  MAINTENANCE
  RETIRED
  DISPOSED
}
```

**After:**
```prisma
enum AssetStatus {
  AVAILABLE
  ASSIGNED
  MAINTENANCE
  RETIRED
  DISPOSED
}
```

**⚠️ Migration blocking issue:** FSM core (Phase 1) cannot compile until the Prisma enum is updated, because `AssetStatus.AVAILABLE` doesn't exist yet. Run this phase FIRST before Phase 1.

### `prisma/seed.ts`

Rename `AssetStatus.PURCHASED` → `AssetStatus.AVAILABLE` wherever it appears.

### Migration

After editing schema, run:
```bash
npx prisma migrate dev --name remove_in_use_rename_purchased_to_available
```

**Warning:** Existing rows with `status = IN_USE` will fail the migration. Fix first:
```sql
UPDATE "Asset" SET "status" = 'ASSIGNED' WHERE "status" = 'IN_USE';
UPDATE "Asset" SET "status" = 'AVAILABLE' WHERE "status" = 'PURCHASED';
```
Then re-run migrate.

## Success Criteria

- Schema compiles: `npx prisma validate`
- Migration generated and applied cleanly
- No runtime errors on app restart
