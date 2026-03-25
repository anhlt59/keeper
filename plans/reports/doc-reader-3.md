# Doc Reader Report — prd-v1.md + project-roadmap.md

**Date:** 2026-03-25  
**Files analyzed:** `docs/prd-v1.md` (238 lines), `docs/project-roadmap.md` (157 lines)

---

## 1. prd-v1.md

### Purpose
The **Product Requirements Document** for the Asset & Office Supply Management System MVP v1. Serves as the authoritative source of truth for: problem statement, objectives, locked tech stack, feature scope (in/out), functional requirements (FR-01–FR-08), data model, NFRs, risks, and key architectural decisions.

### Key Sections
| # | Section | Description |
|---|---|---|
| §1 | Problem Statement | Manual, non-traceable asset ops; need full lifecycle visibility |
| §2 | Objectives | Centralize assets, trace history, reduce manual work (OCR/QR), realtime dashboard |
| §3 | Tech Stack (Locked) | Next.js 15, Prisma+PG, Better Auth, GPT-4o-mini, JSONB+Zod, custom FSM, Tailwind+shadcn, TanStack Query+Zustand |
| §4 | Scope | Phase 1 (3–4 wks): CRUD, assignment/recall, lifecycle FSM, maintenance, audit, dashboard, auth. Phase 2 (2–3 wks): dynamic attrs, QR/barcode, OCR. Out-of-scope clearly listed. |
| §5 | Users & Permissions | Admin-only (single role), session-based, rate-limited, CSRF |
| §6 | Capacity & SLA | ≤5,000 assets, ≤200,000 events, P95 API <500ms, dashboard <3s, uptime 99.5% |
| §7 | Functional Requirements | FR-01 (Asset CRUD), FR-02 (Lifecycle FSM), FR-03 (Assign/Recall), FR-04 (Maintenance), FR-05 (Dynamic Attrs), FR-06 (QR/Scan), FR-07 (Dashboard), FR-08 (OCR Invoice) — each with acceptance criteria |
| §8 | Data Boundary | 10 core tables listed; office_supply tables explicitly removed |
| §9 | NFRs | Session auth, audit log, 1-yr invoice retention, daily backups 30-day retention |
| §10 | Risks & Mitigation | 5 risks: OCR misreads, mobile scan issues, dashboard perf, attrs chaos, invalid FSM transitions |
| §11 | Milestones | Phase 1 → Phase 2 → Phase 3 |
| §12 | Success Metrics | 100% capture rate, ≥95% log coverage, ≥30% op-time reduction, discrepancy reduction |
| §13 | Decisions Locked | 10 locked decisions (tech, FSM, QR spec, bilingual OCR, soft delete, deploy order) |

### Areas Likely Needing Update
1. **Office Supply Inventory** — currently "removed from MVP"; if business pivots, this would re-enter scope and must be reflected here and in §4/§11.
2. **Phase 3 Periodic Inventory** — deferred; when Phase 3 nears, this section needs a full spec (currently placeholder in roadmap §2).
3. **Backup provider** — flagged as unresolved in roadmap; §9 states "daily scheduled backups" but provider TBD. Should be resolved before Phase 1 ends.
4. **Vercel deployment target** — listed as "future" in §3; if timeline shifts, §3 and roadmap Phase 3 need syncing.
5. **FR-06 QR spec** — 25mm×25mm fixed; if label printer requirements change, this needs update.
6. **GPT-4o-mini** — if OpenAI pricing/availability changes, §3 and §10 risk #1 need review.
7. **Uptime SLA** — §6 says 99.5%; if enterprise customers require 99.9%, update both §6 and roadmap capacity table.
8. **Soft delete policy** (§13 Decision #9) — aligns with roadmap §5 deprecation policy; ensure both stay in sync if policy changes.

---

## 2. project-roadmap.md

### Purpose
The living **project roadmap** that tracks current phase status, phase deliverables, capacity targets, success metrics, deprecation policy, and contributing guidelines. Acts as the operational counterpart to the PRD — where the PRD defines *what* to build, the roadmap tracks *when* and *how*.

### Key Sections
| # | Section | Description |
|---|---|---|
| §1 | Current Phase | Phase 0 (Init Project) in progress; 5 sub-items all Pending |
| §2 | Phase Breakdown | Phase 0 (1 wk), Phase 1 (3–4 wks), Phase 2 (2–3 wks), Phase 3 (1–2 wks) — each with deliverables and success criteria |
| §3 | Capacity Targets | ≤5,000 assets, ≤200,000 events, P95 <500ms, dashboard <3s, uptime 99.5% |
| §4 | Success Metrics | 100% capture, ≥95% log coverage, ≥30% op-time reduction, discrepancy target TBD |
| §5 | Deprecation Policy | Soft delete (is_deleted flag), 1-yr invoice retention, archived data >2 yrs (partition + cold storage TBD) |
| §6 | Contributing Guidelines | 8 rules including: Zod + service layer, Prisma Middleware audit, FSM validation, PR requirements, migration commits, docs updates |
| §7 | Phase History | 4 phases tracked (0–3) with status icons |

### Areas Likely Needing Update
1. **Phase 0 status** — Currently all ⏳ Pending. Should update to ✅ In Progress or Completed once scaffold is done.
2. **Phase 1–3 timelines** — No actual start dates; once Phase 0 completes, estimated dates should be added for tracking.
3. **Success Metrics / Discrepancy target** — "Inventory discrepancy after 2 cycles: < target TBD" — must be defined before Phase 3.
4. **Backup provider** — unresolved; §5 deprecation policy references cold storage TBD. Should be resolved and documented.
5. **Periodic Inventory logic** — roadmap notes "needs detailed design when Phase 3 starts"; keep a design doc link here.
6. **Phase 2/3 dependency chain** — if Phase 1 slips, Phase 2 and 3 timelines need adjusting.
7. **Vercel + Sentry/Vercel Analytics** — Phase 3 deliverables mention these; confirm licenses/costs when Phase 3 approaches.
8. **Docs sync** — §6 rule #8 says update `./docs/` when features land; confirm a docs-update step is wired into each phase's definition of done.

---

## 3. Cross-Cutting Observations

### Alignment Between Both Files
- **Capacity targets** (§6 in PRD, §3 in roadmap): identical numbers — ✅ in sync.
- **Success metrics** (§12 in PRD, §4 in roadmap): mostly identical, except discrepancy target is TBD in both.
- **Soft delete** (§13 Decision #9 in PRD, §5 in roadmap): consistent policy in both.
- **Phase names and order**: Phase 0/1/2/3 appear in both; scope mapping (FR-01→FR-04 = Phase 1, FR-05→FR-08 = Phase 2) is consistent.

### Gaps / Conflicts
1. **Backup provider** — flagged unresolved in roadmap; referenced but not detailed in PRD §9.
2. **Periodic Inventory** — described in PRD §4 (out-of-scope, Phase 3+); roadmap §2 Phase 3 lists it; both need a design spec before Phase 3.
3. **Docs update cadence** — roadmap §6 says docs must be updated; PRD §13 doesn't mention docs maintenance. Consider adding a "docs updates" requirement to PRD for visibility.
4. **No RACI or team size** — neither doc specifies who implements what; helpful for onboarding if added to roadmap.

### Recommended Priority Updates
| Priority | File | Action |
|---|---|---|
| 🔴 High | roadmap | Mark Phase 0 progress as work starts |
| 🔴 High | roadmap | Add actual start/completion dates for Phase 0 once known |
| 🟡 Medium | both | Define TBD: inventory discrepancy target |
| 🟡 Medium | both | Resolve backup provider and document in §9 (PRD) + §5 (roadmap) |
| 🟡 Medium | PRD §4 | Consider noting "Office Supply Inventory deferred indefinitely" if confirmed |
| 🟢 Low | roadmap §6 | Add RACI or team assignment column to phase breakdown |

---

*Report generated by doc-reader agent on 2026-03-25.*
