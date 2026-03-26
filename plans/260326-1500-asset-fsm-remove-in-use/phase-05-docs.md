# Phase 5 — Documentation

## Files to Modify

### `docs/system-architecture.md`

- State table: rename `PURCHASED` → `AVAILABLE`, remove `IN_USE` row
- FSM diagram: replace all `PURCHASED` → `AVAILABLE`, remove IN_USE nodes
- Transition table: rename all `PURCHASED` → `AVAILABLE`, remove IN_USE rows

### `docs/model-design.md`

- Enum values table: rename `PURCHASED` → `AVAILABLE`, remove `IN_USE`
- FSM diagram: replace all `PURCHASED` → `AVAILABLE`, remove IN_USE

### `docs/code-standards.md`

- FSM comment: `PURCHASED` → `AVAILABLE`, remove IN_USE reference
- Transition table: rename `PURCHASED` → `AVAILABLE`, remove IN_USE transitions

## Success Criteria

- All 3 docs: no `PURCHASED` or `IN_USE` string literals remain
- FSM diagrams reflect 5-state model: AVAILABLE, ASSIGNED, MAINTENANCE, RETIRED, DISPOSED
- No broken markdown links
