# Phase 1 — Asset CRUD + Lifecycle + Assignment/Recall + Maintenance + Audit + Dashboard

**Context:** [PRD v1](../../docs/prd-v1.md) | [Phase 0](./phase-00-init-project.md)

## Overview

- Priority: High
- Status: Pending
- Description: Implement core asset management — CRUD, lifecycle FSM, assignment/recall, maintenance tracking, audit logs, and KPI dashboard. This is the heart of the system.

## Key Insights

- **FSM is the core**: Asset lifecycle uses a custom FSM with clear state machine. All transitions must go through `lib/fsm.ts` for validation.
- **Audit log auto-capture**: Use Prisma middleware or event sourcing pattern to write logs without manual calls at each endpoint.
- **Dashboard KPI**: Use Prisma aggregation queries. With 200K events, need proper indexes on (asset_id, created_at) and (type, created_at).
- **Assignment vs Recall**: These are 2 distinct event types in asset_events, not 2 tables.

## Architecture

### FSM States & Transitions

```
purchased → assigned → in_use → maintenance → retired → disposed
                ↑_________↓          ↓
               (recall)    (back to in_use after maintenance)
```

| From State | Allowed Transitions |
|---|---|
| purchased | → assigned |
| assigned | → in_use, → retired |
| in_use | → maintenance, → assigned (recall) |
| maintenance | → in_use, → retired |
| retired | → disposed |
| disposed | (terminal) |

### Audit Log Pattern

Use **Prisma Middleware** to auto-capture:
- Name of model being changed
- ID of the record
- Old values (for updates)
- New values (for creates/updates)
- Who triggered (from session)
- When (timestamp)
- Action type: CREATE / UPDATE / DELETE

### API Routes Structure

```
app/api/assets/           GET (list) + POST (create)
app/api/assets/[id]/      GET + PUT + DELETE
app/api/assets/[id]/events     GET (timeline)
app/api/assets/[id]/assign     POST (assign to user/dept)
app/api/assets/[id]/recall     POST (recall)
app/api/assets/[id]/maintenance GET + POST
app/api/categories/       GET + POST
app/api/categories/[id]/ PUT + DELETE
app/api/maintenance/      GET (list all)
app/api/maintenance/[id]/ PUT + DELETE
app/api/dashboard/        GET (aggregated KPIs)
app/api/audit-logs/       GET (list, filterable)
```

## Related Code Files

### Create new
- `lib/fsm.ts` — Lifecycle FSM with transitions map + validator
- `lib/audit.ts` — Prisma middleware for auto audit log
- `lib/audit-logger.ts` — Helper for manual audit events
- `app/api/assets/route.ts` — List + Create
- `app/api/assets/[id]/route.ts` — Get + Update + Delete
- `app/api/assets/[id]/events/route.ts` — Timeline
- `app/api/assets/[id]/assign/route.ts` — Assignment action
- `app/api/assets/[id]/recall/route.ts` — Recall action
- `app/api/assets/[id]/maintenance/route.ts` — Maintenance records
- `app/api/categories/route.ts`
- `app/api/categories/[id]/route.ts`
- `app/api/maintenance/route.ts`
- `app/api/maintenance/[id]/route.ts`
- `app/api/dashboard/route.ts`
- `app/api/audit-logs/route.ts`
- `app/(dashboard)/assets/page.tsx` — Asset list page
- `app/(dashboard)/assets/new/page.tsx` — Create asset form
- `app/(dashboard)/assets/[id]/page.tsx` — Asset detail + timeline
- `app/(dashboard)/assets/[id]/edit/page.tsx` — Edit asset form
- `app/(dashboard)/categories/page.tsx` — Category management
- `app/(dashboard)/maintenance/page.tsx` — Maintenance list
- `app/(dashboard)/audit-logs/page.tsx` — Audit log viewer
- `components/assets/asset-list-table.tsx`
- `components/assets/asset-form.tsx`
- `components/assets/asset-timeline.tsx`
- `components/assets/assign-dialog.tsx`
- `components/assets/maintenance-form.tsx`
- `components/dashboard/kpi-card.tsx`
- `components/dashboard/asset-status-chart.tsx`
- `components/dashboard/recent-events.tsx`
- `components/categories/category-form.tsx`
- `components/shared/status-badge.tsx`
- `components/shared/confirm-dialog.tsx`

### Modify
- `prisma/schema.prisma` — Add indexes for performance
- `prisma/seed.ts` — Seed categories + sample assets
- `app/(dashboard)/layout.tsx` — Add sidebar nav items
- `lib/validators/asset.ts` — Full Zod schema

## Implementation Steps

### 1. FSM + Audit Infrastructure
1. [ ] Write `lib/fsm.ts` with transitions map and `validateTransition(from, to)` function
2. [ ] Write `lib/audit.ts` with Prisma middleware
3. [ ] Write `lib/audit-logger.ts` for manual events (assign, recall, maintenance)
4. [ ] Test FSM with all state transitions
5. [ ] Test audit middleware with create/update/delete

### 2. API Routes — Categories
6. [ ] `app/api/categories/route.ts` — GET list + POST create
7. [ ] `app/api/categories/[id]/route.ts` — GET + PUT + DELETE
8. [ ] Validate: name unique, parent_category_id exists
9. [ ] Seed 3–5 sample categories (Laptop, Phone, Furniture, Equipment, Other)

### 3. API Routes — Assets
10. [ ] `app/api/assets/route.ts` — GET (paginated, filterable by category, status) + POST
11. [ ] Auto-generate QR code content: `{baseUrl}/assets/{id}/lookup`
12. [ ] Validate FSM initial state = `purchased`
13. [ ] `app/api/assets/[id]/route.ts` — GET + PUT + DELETE (soft delete)
14. [ ] PUT: validate FSM transition, block if invalid
15. [ ] DELETE: soft delete (`is_deleted = true`, `deleted_at = now()`). Only allow delete if `disposed` state. Query always filters `WHERE is_deleted = false`.

### 4. API Routes — Lifecycle Events
16. [ ] `app/api/assets/[id]/events/route.ts` — GET timeline (ordered by created_at DESC)
17. [ ] Events are append-only, no update/delete

### 5. API Routes — Assignment/Recall
18. [ ] `app/api/assets/[id]/assign/route.ts` — POST: FSM purchased→assigned or in_use→assigned, write event
19. [ ] `app/api/assets/[id]/recall/route.ts` — POST: FSM assigned→in_use, write event + reason
20. [ ] Validate: do not assign disposed assets

### 6. API Routes — Maintenance
21. [ ] `app/api/assets/[id]/maintenance/route.ts` — GET list + POST create
22. [ ] POST: FSM → maintenance state (if currently in_use)
23. [ ] `app/api/maintenance/[id]/route.ts` — PUT (close/complete) + DELETE
24. [ ] PUT complete: FSM maintenance→in_use, write cost + result

### 7. API Routes — Dashboard
25. [ ] `app/api/dashboard/route.ts` — GET aggregated KPIs:
    - Total asset count + value
    - Count by status (using GROUP BY)
    - Count by category
    - Maintenance cost this month
    - Recent 10 lifecycle events
26. [ ] Verify: query < 500ms with seed data of 100 assets

### 8. API Routes — Audit Logs
27. [ ] `app/api/audit-logs/route.ts` — GET (paginated, filterable by model, action, user, date range)
28. [ ] Protection: Admin-only

### 9. UI — Asset Pages
29. [ ] `app/(dashboard)/assets/page.tsx` — Table with:
    - Columns: QR, Name, Category, Status, Assigned To, Purchase Date
    - Filters: category, status, search by name/qr
    - Sort: name, date, status
    - Pagination: 20/page
    - Actions: View, Edit, Delete
30. [ ] `app/(dashboard)/assets/new/page.tsx` — Create form
    - Fields: name, category, purchase_date, purchase_price, serial_number, notes
    - Auto-generate QR preview
    - Submit → POST → redirect to detail
31. [ ] `app/(dashboard)/assets/[id]/page.tsx` — Detail page
    - Header: name, QR preview, status badge, action buttons
    - Tabs: Info | Timeline | Maintenance | Assignments
    - Info: all fields + dynamic attrs (empty Phase 1)
    - Timeline: chronological event list
    - Maintenance: list + add button
    - Assignments: history
32. [ ] `app/(dashboard)/assets/[id]/edit/page.tsx` — Edit form (same as create)

### 10. UI — Other Pages
33. [ ] `app/(dashboard)/categories/page.tsx` — CRUD categories
34. [ ] `app/(dashboard)/maintenance/page.tsx` — All maintenance records
35. [ ] `app/(dashboard)/audit-logs/page.tsx` — Filterable log viewer

### 11. UI — Dashboard
36. [ ] `app/(dashboard)/page.tsx` — KPI dashboard:
    - 4 KPI cards: Total Assets, Total Value, Maintenance Cost (MTD), Pending Maintenance
    - Status distribution chart (bar/pie)
    - Recent events timeline (last 10)
37. [ ] Responsive: mobile-friendly

### 12. Polish & Seed
38. [ ] Seed: 50 sample assets across categories
39. [ ] Add breadcrumb navigation
40. [ ] Toast notifications for CRUD actions
41. [ ] Empty states for all list pages
42. [ ] Loading skeletons
43. [ ] Run lint + verify build pass

## Todo List

- [ ] FSM + Audit infrastructure
- [ ] Categories API + UI
- [ ] Assets API (CRUD + QR)
- [ ] Lifecycle events API
- [ ] Assignment/Recall API
- [ ] Maintenance API
- [ ] Dashboard API
- [ ] Audit logs API
- [ ] Asset list + create + detail + edit pages
- [ ] Categories page
- [ ] Maintenance page
- [ ] Audit logs page
- [ ] Dashboard page
- [ ] Seed data + polish

## Success Criteria

- CRUD asset: < 500ms response time.
- FSM transitions correct for all edge cases.
- Audit log captures 100% of actions (create/update/delete/assign/recall/maintenance).
- Dashboard loads < 3s with 100 seed assets.
- QR code content valid (encode `/assets/{id}/lookup`).
- No duplicate QR codes.
- All APIs protected by Better Auth.

## Risk Assessment

- **FSM edge cases**: Need thorough testing of all state transitions, especially recall from in_use.
- **Audit performance**: If middleware causes slowdown, consider batch insert.
- **Dashboard N+1**: Use Prisma aggregation, avoid N+1 queries.
- **Soft delete vs Hard delete**: Locked — soft delete (is_deleted + deleted_at). Only allow delete if disposed state.

## Security Considerations

- All API routes need session check (Better Auth).
- Audit logs: no delete from UI.
- Delete asset: only allowed if disposed, soft delete.
- Rate limiting on mutations (10 req/min per asset).
