# Docs Manager Report — 260325-0847

**Scope:** Update 8 project docs in `docs/` per scout findings and cross-cutting issues.

---

## Changes Made

### 1. `codebase-summary.md`
- Root path: `Zoo/` → `zoo/`; header updated with exact versions
- **Directory tree:** Fixed stale entries
  - Removed: `components/layout/`, `components/assets/asset-list/form/detail/qr`, `components/dashboard/kpi-cards`, `components/invoices/upload-form/ocr-preview/invoice-table`, `components/scan/mobile-scanner`
  - Removed: `lib/services/category/maintenance/invoice/dashboard.service.ts`, `lib/qr.ts`
  - Added: `app/(dashboard)/scan/`, `app/api/maintenance/`, `app/api/invoices/ocr/`, `app/api/assets/[id]/qr/`, `app/api/assets/[id]/maintenance/`, `app/api/assets/[id]/lookup/`
  - Added: `lib/qr-generator.ts` (not `qr.ts`), `lib/audit.ts`, `lib/audit-logger.ts`, `lib/services/asset-qr-service.ts`, `lib/validators/dynamic-attrs.ts`
  - Added: `components/assets/asset-timeline.tsx`, `assign-dialog.tsx`, `maintenance-form.tsx`, `qr-preview-modal.tsx`, `qr-scanner.tsx`, `components/dashboard/kpi-card.tsx`, `asset-status-chart.tsx`, `recent-events.tsx`
  - Added: `components/invoices/invoice-form/preview/upload.tsx`, `postcss.config.mjs`
- **Tech Stack Map:** Pinned exact versions; Tailwind v4 with `postcss.config.mjs`; removed Zustand; OCR model unversioned note
- **Key Files table:** Updated to match actual files

### 2. `code-standards.md`
- **Better Auth:** Verified `PrismaPg` adapter (not `drizzleAdapter`); added `cookieCache` block matching v1.5.6 API; session uses literal numbers (not deprecated v1.x `maxAge`)
- **FSM:** Replaced code stub with actual `ASSET_TRANSITIONS` array (10 transitions including RESTORED/RECALLED); uses `AssetStatus` + `AssetEventType` enums; throws plain `Error`
- **Zod:** Updated to Zod v4 `.cuid()` chaining style; added note on `.omit()` + `.partial()` composition
- **"use server":** Added explicit file-level vs inline distinction; API routes do NOT need `"use server"` (Next.js default)
- **Error Handling:** Marked `BadRequestError`/`NotFoundError` as reference-only (not introduced in codebase yet); plain `Error` used instead
- **Testing:** Added placeholder Section 12 with `[TBD]` for Vitest/Playwright when introduced
- **Audit logging:** Added Section 8 with `setAuditContext`/`logAssetEvent` patterns
- Updated validator reference from `asset-validator.ts` → `asset.ts`

### 3. `system-architecture.md`
- **FSM transitions:** Aligned trigger names (Assign, Mark in use, Recall, Dispose, Restore, etc.) with actual `ASSET_TRANSITIONS` array; added RESTORED + RECALLED transitions
- **OCR pipeline:** Added model version pin note (`gpt-4o-mini` without version tag → pin in prod)
- **Dashboard cache:** Fixed to `staleTime = 60s` (not `gcTime`); added `providers.tsx` config note
- **API layer:** Removed `assets/[id]/transition/route.ts` and `categories/[id]/attributes/route.ts`; added `maintenance/`, `invoices/[id]/ocr/`, `assets/[id]/qr/`, `assets/[id]/maintenance/`, `assets/[id]/lookup/`
- **Component tree:** Removed stale `asset-list/form/detail/qr`, `kpi-cards`, `upload-form/ocr-preview/invoice-table`; added actual components
- **Audit log middleware:** Added Section 9 with schema (from `AuditLog` Prisma model) and registration placeholder `[TBD]`
- **Auth RBAC:** Added Section 4 extension point (roles column, `hasPermission`, Better Auth `additionalSessionFields`) with `[TBD]`
- **Observability:** Added Section 10 placeholder (Sentry, Vercel Analytics, Prisma query logging) with `[TBD]`

### 4. `deployment-guide.md`
- Version bump 1.0.0 → 1.1.0
- Added `[SKETCH]` banner on Section 5 (Vercel CI/CD — pipeline, build hooks, env propagation need full spec)
- Bottom unresolved items remain unchanged

### 5. `design-guidelines.md`
- Added header note: accessibility checklist unchecked, no dark mode defined, component snippets not linked to source files
- Added `---` divider after header

### 6. `prd-v1.md`
- Tech stack table: Added `Version` column, pinned exact versions (Next.js 16.2.1, Prisma 7.5.0, Better Auth 1.5.6, Zod 4.3.6, TanStack Query 5.95.2, Tailwind v4)
- NFR: Added `[TBD]` on backup provider, added `[UNRESOLVED]` on invoice storage
- Phase 3 milestones: Added `[TBD — design deferred]` on Periodic Inventory

### 7. `project-roadmap.md`
- Unresolved items: Reformatted as `[TBD]` inline markers (backup provider, periodic inventory)

### 8. `project-overview-pdr.md`
- Root path: Fixed `Zoo/` → `zoo/` in header
- Tech stack table: Added version column with exact pinned versions
- Version bump 1.0.0 → 1.1.0

---

## Validation

```
$ node .claude/scripts/validate-docs.cjs docs/
(no warnings — non-blocking script)

$ wc -l docs/*.md | sort -rn
  414 docs/code-standards.md
  394 docs/system-architecture.md
  254 docs/deployment-guide.md
  239 docs/prd-v1.md
  238 docs/design-guidelines.md
  203 docs/codebase-summary.md
  155 docs/project-roadmap.md
  118 docs/project-overview-pdr.md
```

All 8 files under 800-line limit. No validation warnings.

---

## Unresolved Items Still Outstanding

| # | Item | Docs Mentioned |
|---|---|---|
| 1 | Invoice storage (local vs S3/R2) | codebase-summary, code-standards, system-architecture, deployment-guide, prd-v1 |
| 2 | Backup provider selection | codebase-summary, deployment-guide, prd-v1, project-roadmap |
| 3 | Periodic Inventory design (Phase 3) | system-architecture, prd-v1, project-roadmap |
| 4 | Prisma middleware for auto audit log | system-architecture |
| 5 | Observability stack (Sentry, logging) | system-architecture |
| 6 | RBAC extension (multi-role) | system-architecture |
| 7 | Testing framework introduction | code-standards |
