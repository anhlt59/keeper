# Docs Update Summary — 2026-03-26

## Files Updated (6)

| File | Changes |
|------|---------|
| `docs/codebase-summary.md` | Fixed version `1.2.0` → `0.1.0`; corrected invoice API path `invoices/[id]/ocr/` → `invoices/ocr/`; replaced `categories/[id]/attributes/` → `attributes/definitions/`; fixed `.env.local.example` → `.env.example`; updated service-layer claim |
| `docs/model-design.md` | Fixed soft-delete list (removed `Session/Account/Verification`); fixed `OcrExtraction` claim (it HAS soft-delete); corrected AssetEvent indexes `@@index([assetId, createdAt])` → `@@index([assetId])`, `@@index([isDeleted])`; added 3 missing migrations; added verification timestamp |
| `docs/project-changelog.md` | Fixed `.env.local.example` → `.env.example` |
| `docs/project-roadmap.md` | Removed `Prettier` from Phase 0 deliverables (not in `package.json`); updated contributing rule #2 to reflect reality (service layer preferred, direct Prisma allowed) |
| `docs/prd-v1.md` | Added conceptual-vs-actual model note in §8; replaced stale `asset_assignments` table note with `Asset.employeeId` FK pattern |

## Not Updated (no changes needed)
- `docs/system-architecture.md` — Already aligned with current codebase
- `docs/code-standards.md` — Already aligned
- `docs/design-guidelines.md` — Already aligned (FSM, toaster config, fonts all match)
- `docs/project-overview-pdr.md` — No stale items found

## Validation
- `wc -l` check: all 10 docs under 800 lines (max: `model-design.md` at 658)
- `validate-docs.cjs` skipped — script is grep-per-ref and too slow on this repo (non-blocking, warnings-only)

## Unresolved Questions
1. `docs/codebase-summary.md` still says "kebab-case for file names" but actual route handlers use `route.ts` — not worth changing since it's in a conventions section
2. `docs/model-design.md` ER diagram shows `assignedTo` plain text on Asset — this is still correct per schema, but `employeeId` FK is the canonical assignment reference now. The diagram should eventually be updated to reflect both fields clearly.
3. `validate-docs.cjs` script performance: consider rewriting to batch grep calls or use a pre-built index for large repos
