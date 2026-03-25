# Doc Reader Report — Deployment Guide + Design Guidelines

**Date:** 2026-03-25  
**Files reviewed:**
- `docs/deployment-guide.md` (252 lines, v1.0.0)
- `docs/design-guidelines.md` (235 lines)

---

## 1. deployment-guide.md

### Purpose
Step-by-step setup and operational guide for the Zoo project — from local dev environment through Docker, Prisma migrations, and planned Vercel production deployment.

### Key Sections

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | Local Development Setup | ✅ Complete | Full quick-start (clone → npm install → Docker → env → migrate → seed → dev) |
| 2 | Environment Variables | ✅ Complete | `.env.local` template, secret rules |
| 3 | Docker Compose — PostgreSQL | ✅ Complete | Full YAML + start/stop/wipe commands |
| 4 | Database Migration Workflow | ✅ Complete | `migrate dev` vs `deploy`, PR rules |
| 5 | Vercel Deployment Plan (Future) | ⚠️ Placeholder | Phase 2+, no actual CI/CD config committed |
| 6 | Backup Strategy | ⚠️ Incomplete | All options listed, **no decision made** |
| 7 | Development Scripts | ✅ Complete | Table of npm/prisma/docker commands |
| 8 | Troubleshooting | ✅ Complete | DB, Prisma, auth session fixes |

**Unresolved items flagged in doc itself:**
- Invoice storage: local filesystem vs. S3/R2 (Phase 2+)
- Backup provider: Vercel Postgres vs. dedicated pg_dump to cloud storage

### Areas Likely Needing Updates

1. **Section 5 (Vercel Deployment)** — Will need real Vercel config files (e.g., `vercel.json`, `vercel-build` script in `package.json`) once Phase 2 begins. Currently a sketch.
2. **Section 6 (Backup Strategy)** — Must be resolved before production go-live. A decision table exists but no action is assigned.
3. **Phase indicator in header** — Currently says `Current phase: Local development`. When Phase 2 starts, update to reflect new deployment reality.
4. **Storage env vars** — R2/S3 vars in `.env.local.example` are commented out (Phase 2+). Will need activation + real key entries.
5. **Prisma migration rules** — The `prisma migrate deploy` in CI is mentioned but no CI config (GitHub Actions, Vercel build hook) is documented.
6. **Seed script** — Noted as "manual" for production. Should be automated in CI post-deploy once Phase 2 is live.

---

## 2. design-guidelines.md

### Purpose
Visual and interaction design specification for the Zoo Asset Management UI — covering style system, color palette, typography, layout, components, animation, responsive behavior, and accessibility.

### Key Sections

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | Style System (AI-Native + Minimalism) | ✅ Complete | Philosophy stated, aesthetic goals defined |
| 2 | Color Palette | ✅ Complete | Full hex + Tailwind mapping; FSM status colors |
| 3 | Typography | ✅ Complete | Fira Code/Sans, heading scale, body/mono specs |
| 4 | Layout & Spacing | ✅ Complete | Container, sidebar, card, grid specs |
| 5 | Components | ✅ Complete | Button, Badge, Input, Table, Dialog, Toast examples |
| 6 | Navigation | ✅ Complete | Sidebar, breadcrumb, page header template |
| 7 | Animations & Motion | ✅ Complete | Duration/easing table; reduced-motion noted |
| 8 | Responsive Breakpoints | ✅ Complete | Mobile/tablet/desktop + mobile-first guidance |
| 9 | Accessibility | ⚠️ Partial | Checklist format (checkboxes not checked off) |
| 10 | Anti-patterns | ✅ Complete | 10 items to avoid |

### Areas Likely Needing Updates

1. **Section 9 (Accessibility checklist)** — All items are unchecked `[ ]`. Should be reviewed and checked off as implementation proceeds, or converted to a status table tracking each criterion.
2. **Color palette** — No dark mode defined. If dark mode is added in a future phase, Section 2 will need a full dark palette addition.
3. **Fira Code + Fira Sans** — Imported via Google Fonts in CSS. No self-hosted variant documented. If performance requires self-hosting, this section needs updating.
4. **Sidebar width** — `w-64` / `w-16` hardcoded. If sidebar behavior changes (e.g., responsive collapse breakpoints), update Section 4.
5. **Sonner Toaster placement** — Spec says root layout only. If a multi-root-layout pattern emerges (e.g., dashboard vs. marketing pages), this rule may need nuance.
6. **Component examples** — All inline TSX snippets. As the actual component library grows (shadcn/ui customizations), snippets here may drift from real implementations — should be cross-checked against `src/components/ui/`.
7. **Animation specs** — Duration/easing are documented but not enforced via a shared constants or CSS variable file. If a `tailwind.config.ts` motion plugin is added, Section 7 should link to it.

---

## Cross-Cutting Observations

| Concern | deployment-guide | design-guidelines |
|---------|-----------------|-------------------|
| Phase alignment | Explicitly scoped to Phase 1 vs. Phase 2+ | No phase markers |
| Update owner | Likely `dev-ops` / lead | Likely `frontend` / designer |
| Staleness risk | **High** — Vercel/backup sections are stubs | **Low** — mostly concrete specs |
| Missing enforcement | No CI config for migrations | No link to actual component source files |

---

## Unresolved Questions

1. **Deployment:** Who owns the backup provider decision, and what's the target date for resolving Section 6 of `deployment-guide.md`?
2. **Deployment:** Is there a GitHub Actions CI pipeline being set up in parallel, or is everything Vercel-native?
3. **Design:** Has the accessibility checklist (Section 9) been reviewed against the actual implemented UI, or is it still theoretical?
4. **Design:** Is dark mode on the roadmap? If yes, the color palette section will need a major rework.
5. **Both docs:** Neither document has a "last reviewed" or changelog entry — consider adding a meta header (version, date, owner) for maintainability.
