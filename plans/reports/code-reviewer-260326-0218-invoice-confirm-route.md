# Code Review: Invoice Confirm Route

**File:** `app/api/invoices/[id]/confirm/route.ts`
**Validator:** `lib/validators/invoice.ts`
**Result:** **FAIL** — 2 critical issues, 2 minor issues

---

## Transaction Safety

**Status: PASS**

All writes (OCR update, invoice update, category creates, asset creates, assetEvent creates) are inside `prisma.$transaction` with `Serializable` isolation. No writes outside the transaction.

---

## Category Resolution

**Status: PASS (with edge case noted)**

- Existing categories fetched with `isDeleted: false` guard.
- Missing categories created inline — both done in tx.
- Default category fallback (`DEFAULT = "Other"`) handled: first non-deleted category used if "Other" absent.

**Edge case (non-blocking):** If `defaultCategoryId` is still `undefined` (no categories exist at all in DB), `data.assets` block is skipped silently — no assets created, no error thrown. Acceptable given `purchaseDate` would also be undefined, but worth noting.

---

## Asset Creation — Quantity Expansion

**Status: FAIL — Bug: asset code collision**

```ts
const code = generateAssetCode(); // called per asset, not per loop
for (let i = 0; i < qty; i++) {
  await tx.asset.create({ data: { code: generateAssetCode(), ... } });
```

`generateAssetCode()` is called **once before the inner loop**, so all `qty` expanded assets for the same entry get the **same code** — a unique-constraint violation in the DB. Must move the call inside the loop.

Also: `assetData.name.trim()` called in loop — should be hoisted.

---

## Asset Creation — Lifecycle Event Logging

**Status: PASS**

Every created asset gets exactly one `AssetEventType.CREATED` event with correct `toStatus: PURCHASED` and descriptive description. No orphaned events.

---

## Auth

**Status: PASS**

`auth.api.getSession` checked; 401 returned if no session. `session?.user?.name` used safely for `performedBy`.

---

## Error Handling

**Status: PASS (with minor note)**

- Missing invoice → 404.
- Already confirmed → 409.
- Parse failure → 400 with flattened errors.
- Missing asset fields → Zod validation catches at schema level.

**Minor:** No explicit rollback on partial failure within the tx, but Prisma rolls back automatically on uncaught exceptions within `$transaction`. All code is await-based with no unhandled rejections, so this is fine.

---

## No Regressions

**Status: PASS**

Existing `[id]/route.ts` behaviors (GET, DELETE, POST at collection level) are untouched. Invoice update path in confirm route uses `??` for all fields, preserving existing DB values when fields are absent — matches pattern in `updateInvoiceSchema`.

---

## Summary

| Check | Result |
|---|---|
| Transaction safety | ✅ Pass |
| Category resolution | ✅ Pass |
| Asset creation — qty expansion | ❌ FAIL (code collision bug) |
| Asset creation — lifecycle events | ✅ Pass |
| Auth | ✅ Pass |
| Error handling | ✅ Pass |
| No regressions | ✅ Pass |

---

## Issues to Fix

### 1. **[CRITICAL] Asset code generated once, used for all qty-expanded copies** (lines 108–120)

```ts
// CURRENT (buggy)
const code = generateAssetCode();
for (let i = 0; i < qty; i++) {
  const asset = await tx.asset.create({ data: { code: generateAssetCode(), ... } });
  //                             ^^^^^^^^^^^^^^^^ wrong — same value every iteration
```

Move `generateAssetCode()` call inside the inner loop. Also hoist `assetData.name.trim()` before the loop.

### 2. **[MINOR] Silent skip if no default category** (line 94)

When `defaultCategoryId` is undefined and `data.assets` is non-empty, assets are silently skipped. Consider returning a warning or partial-success response so the caller knows assets weren't created.

---

## Unresolved Questions

- None.
