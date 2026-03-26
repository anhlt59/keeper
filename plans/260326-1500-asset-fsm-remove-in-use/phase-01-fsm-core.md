# Phase 1 — FSM Core (`lib/fsm.ts`)

## Context

- `lib/fsm.ts` — single source of truth for FSM transitions and status config
- Two changes: (1) remove IN_USE, (2) rename PURCHASED → AVAILABLE

## Changes

### `AssetStatus` references

Replace all `AssetStatus.PURCHASED` → `AssetStatus.AVAILABLE`.

### `ASSET_TRANSITIONS` array

**Remove all IN_USE transitions + rename PURCHASED → AVAILABLE:**

Remove:
```ts
{ from: AssetStatus.ASSIGNED,   to: AssetStatus.IN_USE,      eventType: AssetEventType.STATUS_CHANGE,        label: "Mark as in use" },
{ from: AssetStatus.IN_USE,     to: AssetStatus.MAINTENANCE, eventType: AssetEventType.MAINTENANCE_CREATED, label: "Send to maintenance" },
{ from: AssetStatus.MAINTENANCE, to: AssetStatus.IN_USE,     eventType: AssetEventType.MAINTENANCE_COMPLETED, label: "Maintenance complete" },
{ from: AssetStatus.IN_USE,     to: AssetStatus.RETIRED,     eventType: AssetEventType.STATUS_CHANGE,        label: "Retire asset" },
{ from: AssetStatus.IN_USE,     to: AssetStatus.PURCHASED,   eventType: AssetEventType.RECALLED,             label: "Recall (unassign)" },
```

Update existing transitions (PURCHASED → AVAILABLE):
```ts
// Before                              After
{ from: AssetStatus.PURCHASED, to: AssetStatus.ASSIGNED, ... }  →  { from: AssetStatus.AVAILABLE, to: AssetStatus.ASSIGNED, ... }
// { from: AssetStatus.ASSIGNED, to: AssetStatus.RETIRED, ... }   →  keep (no PURCHASED ref)
// { from: AssetStatus.PURCHASED, to: AssetStatus.RETIRED, ... }  →  { from: AssetStatus.AVAILABLE, to: AssetStatus.RETIRED, ... }
// { from: AssetStatus.ASSIGNED, to: AssetStatus.PURCHASED, ... } →  { from: AssetStatus.ASSIGNED, to: AssetStatus.AVAILABLE, ... }
```

Add new ASSIGNED → MAINTENANCE:
```ts
{ from: AssetStatus.ASSIGNED,   to: AssetStatus.MAINTENANCE, eventType: AssetEventType.MAINTENANCE_CREATED, label: "Send to maintenance" },
{ from: AssetStatus.MAINTENANCE, to: AssetStatus.ASSIGNED,  eventType: AssetEventType.MAINTENANCE_COMPLETED, label: "Maintenance complete" },
```

### Top-of-file comment

```ts
// States: AVAILABLE → ASSIGNED ↔ MAINTENANCE → RETIRED → DISPOSED
// RECALLED: ASSIGNED → AVAILABLE  RESTORED: DISPOSED → RETIRED
```

### `STATUS_CONFIG`

- Remove `IN_USE` entry
- Rename `PURCHASED` key → `AVAILABLE`; update label to `"Available"`

## Success Criteria

- No `PURCHASED` or `IN_USE` anywhere in file
- `getAvailableTransitions(AssetStatus.AVAILABLE)` returns: ASSIGNED, RETIRED
- `getAvailableTransitions(AssetStatus.ASSIGNED)` returns: MAINTENANCE, RETIRED, AVAILABLE
- `getAvailableTransitions(AssetStatus.MAINTENANCE)` returns: ASSIGNED
