# Doc Reader Report: codebase-summary.md + project-overview-pdr.md

**Files analyzed:**
- `/Users/anhlt/Projects/vibe/zoo/docs/codebase-summary.md` (190 lines)
- `/Users/anhlt/Projects/vibe/zoo/docs/project-overview-pdr.md` (117 lines)

**Reference cross-check:** `docs/project-roadmap.md` (158 lines) consulted to resolve ambiguities.

---

## 1. Document Purpose

### codebase-summary.md
Architectural blueprint — describes the *intended* end-state directory structure, file responsibilities, LOC targets, naming conventions, and tech stack map. Serves as the implementation guardrail for Phase 0–2.

### project-overview-pdr.md
Product-level overview — covers purpose/goals, target users, feature phases, out-of-scope items, locked decisions, and capacity/success metrics. Serves as the product decision record and success contract.

> **Relationship:** `project-overview-pdr.md` drives the *what/why*, `codebase-summary.md` encodes the *how/where*. They are complementary; both reference the same PRD and plan.

---

## 2. Key Sections

### codebase-summary.md

| Section | Lines | Description |
|---|---|---|
| Target Directory Structure | 8–115 | Full file tree with all planned routes, lib files, components |
| Key Files & Responsibilities | 119–132 | Table of critical files and their single responsibility |
| LOC Targets | 136–149 | Per-layer line-count targets (end-state after Phase 2) |
| File Naming Conventions | 153–166 | kebab-case/feature-name rules per type |
| Tech Stack Map | 170–184 | Technology per layer with version hints |
| Unresolved Items | 188–189 | Invoice storage (local vs. cloud), backup provider |

### project-overview-pdr.md

| Section | Lines | Description |
|---|---|---|
| Purpose & Goals | 8–21 | Asset lifecycle management, 8 primary goals |
| Target Users | 24–29 | Single Admin persona, full access |
| Key Features (from PRD) | 32–52 | Phase 1–3 feature breakdown |
| Out-of-Scope (MVP) | 55–64 | 9 explicitly excluded items |
| Tech Stack (Locked) | 67–82 | Layer→technology table |
| Key Decisions (Locked) | 85–97 | 11 decision records |
| Capacity & Success Metrics | 101–113 | 7 measurable targets |
| Unresolved Items | 116–117 | Invoice storage, backup provider |

---

## 3. Cross-Document Consistency

### ✅ Already Consistent
- **Tech stack** — both docs list identical stack (Next.js 15, Prisma + PostgreSQL, Better Auth, Tailwind + shadcn/ui, TanStack Query + Zustand, qrcode, html5-qrcode, GPT-4o-mini).
- **Asset lifecycle states** — `purchased → assigned → in_use → maintenance → retired → disposed` matches across PDR Phase 1 and codebase `lib/fsm.ts`.
- **Soft delete** — `is_deleted` + `deleted_at` convention appears in both docs.
- **Bilingual OCR** — Vietnamese priority, GPT-4o-mini, no Ollama.
- **Phase timelines** — P1 3–4 wks, P2 2–3 wks, P3 1–2 wks consistent across both.
- **Unresolved items** — Both list invoice storage and backup provider as open.

### ⚠️ Minor Inconsistencies / Gaps

| Issue | codebase-summary | project-overview-pdr |
|---|---|---|
| **Root path** | `/Users/anhlt/Projects/vibe/Zoo/` (capital Z) | `/Users/anhlt/Projects/vibe/Zoo/` but refers to plan `260325-0106-…` (Phase 0 in title) |
| **Project name casing** | `Zoo` capital | `Zoo` capital |
| **Project status** | `Phase 0 in progress` | `Phase 0 in progress` ✅ |
| **Phase 3 Periodic Inventory** | Listed in Phase 3 (Hardening) | Listed in Phase 3 (Hardening) ✅ |
| **Phase 0 deliverables** | Not listed (blueprint, not a plan) | Phase 0 table with 6 deliverables ✅ |
| **Contributing guidelines** | Not present | project-roadmap.md has them (not this file) |
| **Deprecation policy** | Not present | project-roadmap.md has it (soft delete, invoice retention, archived data) |
| **Prisma version** | `Prisma 6+` | Not specified |
| **PostgreSQL version** | `PostgreSQL 16` | `PostgreSQL` (no version) |
| **Docker-compose reference** | Listed in directory tree | Not mentioned |
| **Seed data reference** | In directory tree + key files table | Not mentioned |

---

## 4. Areas Likely Needing Updates

### High Priority

1. **`project-overview-pdr.md` — Phase status (ongoing)**
   - Currently all ⏳ Pending. Needs to reflect actual Phase 0 completion as work progresses.

2. **`codebase-summary.md` — LOC Targets (Phase 0–2 end-state)**
   - These are aspirational numbers. Should be recalibrated after Phase 1 to reflect actual measured LOC, or removed if tracking proves noisy.

3. **`codebase-summary.md` — Unresolved items (once resolved)**
   - **Invoice storage**: once a decision is made (local `public/` vs. S3/Cloudflare R2), document it here and remove the unresolved tag.
   - **Backup provider**: same — close once selected.

4. **Both docs — `codebase-summary.md` naming discrepancy**
   - The root path says `/Users/anhlt/Projects/vibe/Zoo/` (capital Z) but the actual CWD is `/Users/anhlt/Projects/vibe/zoo` (lowercase `zoo`). Align the documented path to the real one.

### Medium Priority

5. **`project-overview-pdr.md` — Prisma/PostgreSQL versions**
   - `codebase-summary.md` specifies `Prisma 6+` and `PostgreSQL 16`. `project-overview-pdr.md` says just "Prisma + PostgreSQL". Add version specificity to avoid ambiguity.

6. **`codebase-summary.md` — Missing sections from sibling docs**
   - Contributing guidelines (in `project-roadmap.md`) and deprecation policy (also in `project-roadmap.md`) are relevant to implementers but absent from `codebase-summary.md`. Consider cross-referencing or consolidating.

7. **`codebase-summary.md` — Directory tree may drift from actual**
   - As components are implemented, the planned tree will diverge from reality. Requires a periodic sync step (e.g., after each phase).

### Low Priority / Future

8. **`codebase-summary.md` — LOC targets may become stale**
   - If actual LOC significantly diverges from targets (>20%), update or remove the targets to avoid confusion.

9. **Both docs — Align unresolved items with `project-roadmap.md`**
   - `project-roadmap.md` adds a third unresolved item: *"Periodic Inventory logic — needs detailed design when Phase 3 starts"*. This should be reflected in both PDR and codebase-summary if those docs are meant to be standalone references.

---

## 5. Summary

| | codebase-summary.md | project-overview-pdr.md |
|---|---|---|
| **Type** | Architectural blueprint | Product decision record |
| **Audience** | Developers (where/which file) | PM + devs (what/why) |
| **Staleness risk** | High (tree drifts from actual) | Medium (status needs updating) |
| **Action needed now** | Fix root path casing | Add Prisma/PG versions |
| **Action on phase complete** | Sync directory tree | Update phase status |
| **Action on decision made** | Close unresolved items | Close unresolved items |

**Cross-reference:** `docs/project-roadmap.md` is the living tracker for phase status and should be the source of truth for "what is currently in progress". Both analyzed docs should link to it more explicitly.
