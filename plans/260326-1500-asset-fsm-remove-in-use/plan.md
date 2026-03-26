---
title: "Remove IN_USE, rename PURCHASED→AVAILABLE from Asset FSM"
description: "Collapse ASSIGNED/IN_USE into ASSIGNED. Rename PURCHASED→AVAILABLE. ASSIGNED gains direct RETIRED and MAINTENANCE transitions."
status: pending
priority: P2
effort: 3h
branch: master
tags: [backend, api, refactor]
created: 2026-03-26
---

## Overview

Two coordinated changes:
1. Remove `IN_USE` state — `ASSIGNED` becomes the sole active state
2. Rename `PURCHASED` → `AVAILABLE` — better reflects the meaning (asset in inventory, not yet assigned)

## Phases

- [Phase 1: FSM Core (`lib/fsm.ts`)](./phase-01-fsm-core.md) — transitions + STATUS_CONFIG + AVAILABLE rename
- [Phase 2: API Routes](./phase-02-api-routes.md) — assign, recall, confirm invoice, asset-service
- [Phase 3: Prisma Schema](./phase-03-prisma-schema.md) — remove IN_USE + rename PURCHASED→AVAILABLE
- [Phase 4: Frontend UI](./phase-04-frontend-ui.md) — filter dropdown, asset detail, lookup
- [Phase 5: Docs](./phase-05-docs.md) — system-architecture, model-design, code-standards

## New FSM Diagram

```
AVAILABLE ──assign──▶ ASSIGNED
                         │
                         ├──[retire]──▶ RETIRED ──[dispose]──▶ DISPOSED
                         │                                     ▲
                         ├──[maintenance]──▶ MAINTENANCE ───────┘
                         │                       │
                         │              ◀──[complete]──┘

Also: ASSIGNED/AVAILABLE ──[retire]──▶ RETIRED
      DISPOSED ────[restore]──▶ RETIRED
      ASSIGNED ──[recall]──▶ AVAILABLE
```

## Key Decisions

- `ASSIGNED` is the only "active" state — no IN_USE split
- `AVAILABLE` replaces `PURCHASED` everywhere (semantic: asset in stock, ready to assign)
- Maintenance completion → ASSIGNED (not IN_USE)
- Recall: ASSIGNED → AVAILABLE (was ASSIGNED → PURCHASED)
- Recall from AVAILABLE blocked (already unassigned)
- No DB migration needed for existing IN_USE data
