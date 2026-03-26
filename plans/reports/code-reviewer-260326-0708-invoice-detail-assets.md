# Code Review: Invoice Detail Feature (Asset Linkage)

Date: 2026-03-26
Reviewer: code-reviewer
Files: `prisma/schema.prisma`, `app/api/invoices/[id]/confirm/route.ts`, `app/api/invoices/[id]/route.ts`, `app/(dashboard)/invoices/[id]/page.tsx`

---

## Summary

Feature adds a one-to-many `Invoice → Asset[]` relation and surfaces it in the detail page. Schema and backend are solid; one low-priority UX improvement noted for the frontend.

---

## 1. Schema (`schema.prisma`)

**✅ Correct**

- `invoiceId String?` on Asset is optional — correct (assets can exist without an invoice)
- `invoice Invoice? @relation(...)` is the correct pattern for a many-side optional FK
- `assets Asset[]` on Invoice exposes the reverse relation
- No extra indexes needed; `isDeleted` and `status` indexes cover existing queries

---

## 2. Confirm Route (`confirm/route.ts`)

**✅ All checks pass**

### Security
- Auth: `auth.api.getSession` — 401 on unauthenticated ✅
- Input validation: `confirmInvoiceSchema.safeParse(body)` — rejects malformed payloads ✅
- 404 guard: `findFirst` with `isDeleted: false` ✅
- 409 guard: prevents double-confirm ✅
- No SQL injection — Prisma parameterized queries throughout ✅

### Prisma Correctness
- `invoiceId: id` correctly links created assets to the invoice ✅
- Assets are created **inside** the transaction, ensuring atomicity ✅
- `Serializable` isolation level is appropriate given the fetch-or-create category logic (avoids duplicate categories under race conditions) ✅
- `isDeleted: false` filter on category lookup prevents referencing soft-deleted categories ✅

### Code Quality
- `generateAssetCode()` uses `Math.random()` — acceptable for non-cryptographic asset codes, but note this is non-deterministic and can produce collisions under high volume. Not a blocker for v1.
- Descriptive `description` in `AssetEvent.CREATED` — good audit trail ✅
- `performedBy` defaults to `"system"` — sensible fallback ✅
- Error flattening on 400 response gives clients structured validation feedback ✅

---

## 3. Invoice GET/DELETE Route (`invoices/[id]/route.ts`)

**✅ All checks pass**

### Security
- Auth: 401 guard ✅
- 404 guard: `findFirst` with `isDeleted: false` ✅
- Soft-delete on `DELETE` (`isDeleted: true`) — correct, avoids orphaned `invoiceId` on assets ✅

### Prisma Correctness
- `include: { assets: { where: { isDeleted: false }, select: { id, code, name } } }` — correct; only non-deleted assets returned, only required fields selected ✅

### Minor: No PATCH/PUT route exists
- If partial updates are needed, a separate `PATCH` route should be added. Not a blocker for this PR but worth tracking.

---

## 4. Invoice Detail Page (`page.tsx`)

**✅ All checks pass — one low-priority UX note**

### React/TanStack Query Patterns
- `queryKey: ["invoice", id]` — correct, invalidates on mutation will auto-refetch ✅
- `credentials: "include"` — matches auth cookie-based session ✅
- Error thrown on `!r.ok` — triggers React Query error state ✅
- No `refetchInterval` or polling — appropriate for detail view ✅

### UX: Step indicator is cosmetic only
- Steps `["details", "assets"]` are UI labels; `currentStepIdx` drives styling but there is no actual tab navigation or route change.
- This is fine for the current scope, but if the UI is meant to be interactive (switching between detail/asset views), it currently doesn't — users see both sections regardless of which step is "active".
- **Not a bug** — both sections are always visible, which is arguably better UX. The step indicator reads more as a progress tracker than a nav control. Acceptable.

### Other Observations
- `useRef(prevId)` pattern correctly resets `imgError`, `imgOpen`, `step` on invoice change ✅
- Empty asset list renders a clean "No assets were created from this invoice." message ✅
- Image dialog handles `onError` gracefully ✅
- `window.location.href` redirect after delete — acceptable; could use `router.push` for a lighter redirect but not a regression ✅
- `type Step = typeof STEPS[number]` — minor: prefer `z.enum` for type safety; current pattern works but `STEPS[number]` can produce `string` in strict mode. Low priority.

---

## No Regressions Detected

- Asset creation flow unchanged
- Invoice CRUD routes unchanged
- No breaking changes to existing API contracts (GET response is additive — `assets` field added)

---

## Unresolved Questions

1. **Asset code collision**: `generateAssetCode()` uses `Math.random()`. Under high volume or rapid creation, collisions are theoretically possible. Should `Asset.code` use a database sequence or ULID for v1 production? Low priority.
2. **Invoice PATCH route**: No partial-update route exists. Will partial updates be needed before full confirmation?
3. **Asset soft-delete cascade**: Deleting an asset sets `isDeleted: true` but does NOT clear `invoiceId`. This means a deleted asset still "belongs" to the invoice in the schema. Should deleted assets be excluded from the `assets` relation, or is this intentional for audit purposes?

---

## Verdict

**✅ APPROVED** — ready to merge. All schema relations, auth checks, input validation, Prisma patterns, and React Query usage are correct. One minor UX observation noted above is non-blocking.
