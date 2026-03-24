# Phase 1 UI Report — Asset Lifecycle Dashboard

**Date:** 2026-03-25
**Files created/modified:** 27 files
**Build status:** ✅ Pass

---

## Files Created

### Shared Components
| File | Purpose |
|---|---|
| `components/shared/status-badge.tsx` | Reusable FSM status badge |
| `components/shared/confirm-dialog.tsx` | Confirmation dialog for destructive actions |
| `components/assets/asset-timeline.tsx` | Event timeline with icons, relative time |
| `components/assets/assign-dialog.tsx` | Assign asset to employee/dept |
| `components/assets/maintenance-form.tsx` | Add maintenance record dialog |
| `components/categories/category-form.tsx` | Add/edit category dialog |
| `components/dashboard/kpi-card.tsx` | KPI metric card with hover |
| `components/dashboard/asset-status-chart.tsx` | Horizontal bar chart by status |
| `components/dashboard/recent-events.tsx` | Recent activity feed |

### API Routes
| File | Purpose |
|---|---|
| `app/api/maintenance/route.ts` | List all maintenance records |

### Pages
| File | Purpose |
|---|---|
| `app/(dashboard)/page.tsx` | KPI Dashboard (upgraded) |
| `app/(dashboard)/assets/page.tsx` | Asset list with filters + pagination |
| `app/(dashboard)/assets/new/page.tsx` | Create asset form |
| `app/(dashboard)/assets/[id]/page.tsx` | Asset detail + tabs (Info/Timeline/Maintenance) |
| `app/(dashboard)/assets/[id]/edit/page.tsx` | Edit asset form |
| `app/(dashboard)/categories/page.tsx` | Category CRUD |
| `app/(dashboard)/maintenance/page.tsx` | All maintenance records |
| `app/(dashboard)/audit-logs/page.tsx` | Audit log viewer |

---

## Key Design Decisions

### 1. Base UI + no `asChild`
All shadcn/ui components use Base UI primitives. `asChild` prop does not exist — replaced with `render` prop for `DialogTrigger` and type `React.ReactElement` for trigger children.

### 2. Prisma types vs JSON
Components use JSON-compatible local interfaces (e.g., `TimelineEvent`, `RecentEvent`) instead of Prisma-generated types. `STATUS_CONFIG` key type widened from `AssetStatus` → `string` to allow string indexing from JSON API responses.

### 3. `useSearchParams` + Suspense
Next.js 16 requires `useSearchParams()` inside a Suspense boundary. All 3 paginated/filterable pages (`/assets`, `/maintenance`, `/audit-logs`) split into outer page (Suspense wrapper) + inner content component.

### 4. Existing API routes
All Phase 1 API routes existed already with auth, services, and validators. Only `app/api/maintenance/route.ts` was missing — created it.

### 5. TypeScript strictness
Fixed all `onValueChange` handlers — Base UI `Select` returns `string | null`, required `v ?? ""` coalescing throughout.

---

## Unresolved Issues

- **`use(params)` pattern** in `assets/[id]/page.tsx` and `assets/[id]/edit/page.tsx` — Next.js 16 params are Promises; `require("react").use(params)` works but is non-standard. Consider migrating to `params` prop directly once stable.
- **No auth guard in UI pages** — API routes have Better Auth; pages redirect to login if session missing (handled by API calls returning 401, but UI doesn't show login redirect).
- **In-memory state sync** in edit page (`if (asset && form.name !== asset.name...)`) — a `useEffect` would be cleaner; current approach is a workaround for `useState` initialization timing.
