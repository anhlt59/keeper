# Doc Reader Report — code-standards.md & system-architecture.md

**Date:** 2026-03-25
**Source files:**
- `/docs/code-standards.md` (v1.0.0, 356 lines)
- `/docs/system-architecture.md` (v1.0.0, 298 lines)

---

## Part 1 — code-standards.md

### Purpose
Single source of truth for all code conventions. Covers: file naming, component patterns, Prisma schema conventions, Better Auth setup, Zod validation, FSM implementation, API route conventions, code quality, git conventions, error handling.

**Unresolved:** Invoice storage — local `public/` vs. cloud (S3/R2)

### Areas Likely Needing Updates

#### High priority
1. **Section 4 — Better Auth session config** — `session.expiresIn` and `updateAge` as literal numbers. Better Auth v1.x changed session lifecycle config. Verify against current version.
2. **Section 2 — Server Actions pattern** — doc doesn't clarify file-level vs. inline `"use server"`. File-level marks ALL exports as server actions — often unintended.
3. **Section 5 — Zod v4** — `z.record(z.unknown())` still works but `z.record(z.string(), z.unknown())` is more precise.
4. **Section 8 — Max 200 LOC unenforced** — prose only, no ESLint rule.

#### Medium priority
5. **Section 7 — API route error handling** — catches all errors and returns 500, even for `BadRequestError` (400) and `NotFoundError` (404).
6. **Section 10 — `ForbiddenError`** defined but never thrown. Remove or document intended use.
7. **Section 3 — Prisma migration process underspecified** — no `prisma validate && prisma migrate status` in CI.
8. **Section 1 — shadcn/ui path** — confirm `components/ui/` is still canonical (shadcn v1 supports custom registries).

#### Low priority
9. **No testing conventions** — no test framework, naming conventions, or coverage targets.
10. **FSM has no saga/async side-effect guidance** — forward-reference for future async workflows.

---

## Part 2 — system-architecture.md

### Purpose
High-level system design: data model, auth architecture, key workflows (asset lifecycle FSM, OCR pipeline, QR system, API layer, component tree, data flows).

**Unresolved items:** Invoice storage, backup provider, periodic inventory logic (Phase 3).

### Areas Likely Needing Updates

#### High priority
1. **Section 5 — OCR model not pinned** — `gpt-4o-mini` without version/revision. Also multi-page PDFs not handled.
2. **Section 2 — Schema overview is high-level** — no field-level types (JSONB, ENUM, relations, indexes). Will drift from actual `prisma/schema.prisma`.
3. **Section 1 — Audit log middleware** — appears in diagram but no schema or middleware registration in docs.
4. **Section 4 — No auth extension point** — "admin only (MVP)" stated but no RBAC path documented.

#### Medium priority
5. **Section 3 — FSM trigger vocabulary inconsistent with code-standards.md** — trigger names differ between docs. Need alignment.
6. **Section 7 — OCR confirm endpoint not idempotent** — double-confirm behavior undocumented.
7. **Section 6 — QR storage TBD** — local or cloud unresolved.
8. **Section 9 — Dashboard `staleTime` semantics wrong** — `staleTime: 60_000` doesn't set absolute cache TTL; need `gcTime: 60_000` explicitly.

#### Low priority
9. **Section 8 — Component tree doesn't distinguish planned vs. implemented** files.
10. **No observability section** — no structured logging, Sentry, or OpenTelemetry.
11. **Backup/disaster recovery unresolved** — persists as known gap.

---

## Cross-Cutting Issues

| Issue | Impact |
|---|---|
| Invoice storage unresolved | Blocks production deployment |
| FSM trigger naming inconsistent | Implementation confusion |
| Auth extension points not documented | Re-architecture risk post-MVP |
| Audit log middleware: no schema or reg. | Compliance gap |
| OCR model not pinned | Cost/reliability drift |
| Dashboard cache semantics incorrect | Subtle caching bugs |
