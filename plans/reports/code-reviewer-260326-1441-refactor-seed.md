# Code Review: `prisma/seed.ts` CSV Refactor

**Reviewer:** code-reviewer
**Date:** 2026-03-26
**File:** `prisma/seed.ts`
**Plan:** `plans/260326-1433-refactor-seed-use-csv-data/phase-01-refactor-seed.md`

---

## Score: 7.5 / 10

Implementation is solid overall — plan alignment is high, architecture is clean, and the two-pass category strategy is correct. Three issues prevent a higher score.

---

## Critical Issues

### 1. Misleading log — "Upserted" for `deleteMany` + `createMany` (line 136)

```typescript
console.log(`✅ Upserted ${rows.length} employees from CSV`);
```

The employee loader uses `deleteMany` + `createMany`, not upserts. The log should say "Seeded" or "Inserted". Minor but misleading — a future debug session could waste time hunting for upsert logic that doesn't exist.

**Fix:** Change log to `"✅ Seeded ${rows.length} employees from CSV"`.

---

### 2. `skipDuplicates: true` has no unique constraint to match against

The `Employee` model has no `@@unique` on `email`:
```prisma
email String?  // optional, no @@unique
```

`createMany({ skipDuplicates: true })` requires a unique constraint to compare against. Without one, `skipDuplicates` is a no-op — Prisma will insert all rows regardless. In practice this works (because of `deleteMany` before it), but the `skipDuplicates` flag is dead code that adds confusion.

**Fix options:**
- **(A)** Remove `skipDuplicates: true` since `deleteMany` already resets state.
- **(B)** Keep it (harmless) and add `@@unique([email])` to schema as future-proofing.
- **(C)** Log a warning that the flag is ineffective until a unique constraint exists.

Recommended: **Option A** — remove `skipDuplicates` to avoid implying a guarantee that doesn't exist.

---

### 3. `main()` is async but not called with `await` (line 243)

```typescript
main()
  .catch((e) => {
```

This is fine at module level for seed scripts. However, the function returns a `Promise` that is not explicitly awaited — TypeScript's top-level await handling depends on `tsconfig.json` settings (`module`, `moduleResolution`). If the project tsconfig uses `"module": "commonjs"` (standard for Node), top-level await is not supported and this could cause silent failures.

**Fix:** Wrap in an IIFE or verify tsconfig has `"module": "nodenext"` or `"moduleResolution": "bundler"`.

---

## Warnings (Non-Blocking)

### W1. Logged row count includes skipped rows

- `seedEmployees`: logs `${rows.length}` (all CSV rows), but `deleteMany` deletes all + inserts only rows where `r.name` is truthy. If any CSV row has empty `name`, the count is off.
- `seedCategories`: logs `${rows.length}` (all rows), but skipped parent-not-found children are silently skipped.

**Fix:** Use actual inserted/upserted count instead of raw CSV row count.

---

### W2. `products.csv` has no guaranteed unique constraint on `code`

The plan shows `products.csv` has a `code` column used as `where: { code: row.code }` in upsert. No schema check was performed, but if `code` is not `@@unique` in the Prisma schema, the upsert may behave unexpectedly on duplicates.

**Action:** Verify `code` is `@@unique` in `schema.prisma`.

---

### W3. `eventType: "CREATED"` is string, not enum (line 172)

```typescript
eventType: "CREATED",
```

The `AssetEvent` model likely uses an enum for `eventType`. Passing a bare string bypasses type safety. Should be:
```typescript
eventType: AssetEventType.CREATED,  // needs import
```

Check the schema and import.

---

### W4. `products.csv` path has no extension check

`readCSV("products.csv")` will silently return `[]` if the file is missing (no throw). For a seed script this is arguably fine (tested data), but worth a note.

---

## What Was Done Correctly

| Area | Verdict |
|------|---------|
| BOM strip on headers | ✅ Correct — checks `charCodeAt(0) === 0xFEFF`, only on first header field |
| Empty-line filtering | ✅ `filter(l => l.trim() !== "")` handles trailing newlines |
| Two-pass category loading | ✅ Root first (no parent), children second (parentId lookup) |
| Parent-not-found skip | ✅ Warning + `continue` — no crash |
| `categoryMap` populated after each upsert | ✅ Children can reference newly-created parents in same pass |
| `seedMaintenanceHistory` unchanged | ✅ Correct — no dependency on old data arrays |
| `seedAdmin` unchanged | ✅ Correct |
| `AssetStatus.PURCHASED` enum used | ✅ Type-safe |
| `PrismaPg` adapter setup | ✅ Correct for PostgreSQL |
| `finally { prisma.$disconnect() }` | ✅ Proper cleanup |
| Plan alignment | ✅ Implementation follows phase-01 plan closely |

---

## Summary

| Category | Count |
|----------|-------|
| Critical issues | 3 |
| Warnings | 4 |
| Correct implementations | 12 |

**Overall approval: ✅ APPROVED with reservations**

The three critical issues are all low-risk for a seed script (which runs in a controlled environment), but they should be fixed before the file is used in CI or as a routine data reset tool.

---

## Unresolved Questions

1. Is `code` declared `@@unique` in `schema.prisma` for the `Asset` model?
2. Does `AssetEvent.eventType` use a string or an enum?
3. Does `tsconfig.json` support top-level `await`?
