# Design Guidelines — Keeper Asset Management

> AI-Native UI + Minimalism style. Based on shadcn/ui + Tailwind CSS v4.
> **Note:** Accessibility checklist unchecked. Component snippets are illustrative.

---

## 1) Style System

### AI-Native UI
- Minimal chrome — no visual clutter
- Conversational, ambient feel
- Streaming text animations, typing indicators (3-dot pulse)
- Context cards, smooth reveals
- Fast response feedback (no heavy loading states)

### Minimalism
- High contrast, generous whitespace
- Monochromatic base: black/white + single accent
- Grid-based layout, functional typography
- Subtle hover transitions (200–250ms)
- Essential elements only — nothing decorative

---

## 2) Color Palette

| Role | Hex | Tailwind |
|------|-----|----------|
| Primary | #2563EB | blue-600 |
| Secondary | #3B82F6 | blue-500 |
| Accent / CTA | #F97316 | orange-500 |
| Background | #F8FAFC | slate-50 |
| Surface | #FFFFFF | white |
| Border | #E2E8F0 | slate-200 |
| Text Primary | #1E293B | slate-800 |
| Text Secondary | #64748B | slate-500 |
| Text Muted | #94A3B8 | slate-400 |
| Success | #10B981 | emerald-500 |
| Warning | #F59E0B | amber-500 |
| Danger | #EF4444 | red-500 |

### Status Colors (FSM — from STATUS_CONFIG in lib/fsm.ts)
| Status | Color | Tailwind |
|--------|-------|----------|
| AVAILABLE | blue | blue-50 / blue-700 |
| ASSIGNED | violet | violet-50 / violet-700 |
| MAINTENANCE | amber | amber-50 / amber-700 |
| RETIRED | slate | slate-100 / slate-600 |
| DISPOSED | red | red-50 / red-700 |

---

## 3) Typography

- **Font:** Fira Code (headings/code) + Fira Sans (body)
- **Import:**
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
  ```
- **Heading scale:**
  - H1: `text-3xl font-bold tracking-tight`
  - H2: `text-2xl font-semibold tracking-tight`
  - H3: `text-xl font-semibold`
  - H4: `text-lg font-medium`
- **Body:** `text-sm font-normal leading-relaxed` (16px min on mobile)
- **Mono:** `font-mono text-xs` for codes, IDs, timestamps

---

## 4) Layout & Spacing

### Container
- Max width: `max-w-6xl` (dashboard), `max-w-4xl` (forms)
- Horizontal padding: `px-4 sm:px-6 lg:px-8`
- Centered with `mx-auto`

### Sidebar Navigation
- Width: `w-64` (expanded), `w-16` (collapsed)
- Fixed, `top-0 left-0 h-full`
- Mobile: drawer overlay with toggle button (shadcn/ui Dialog or @base-ui/react Drawer)

### Card
- `rounded-xl border border-slate-200 bg-white shadow-sm`
- Padding: `p-5` or `p-6`
- Hover: subtle `hover:shadow-md transition-shadow duration-200`

### Grid
- Asset list: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- Dashboard KPIs: `grid grid-cols-2 lg:grid-cols-4 gap-4`

---

## 5) Components

### Button
```tsx
// Primary (CTA)
<Button className="bg-orange-500 hover:bg-orange-600 text-white">
  Action
</Button>

// Secondary
<Button variant="outline" className="border-slate-300 hover:bg-slate-50">
  Cancel
</Button>

// Ghost
<Button variant="ghost" className="text-slate-600 hover:bg-slate-100">
  Link-style
</Button>

// Danger
<Button variant="destructive">
  Delete
</Button>
```

### Status Badge
```tsx
// Per FSM status — uses STATUS_CONFIG colors from lib/fsm.ts
<Badge variant="outline" className={cn(
  status === 'AVAILABLE' && 'border-blue-500 text-blue-600 bg-blue-50',
  status === 'ASSIGNED' && 'border-violet-500 text-violet-600 bg-violet-50',
  // ...
)}>
  {status}
</Badge>
```

### Form
- Use `react-hook-form` with Zod validation
- Labels above inputs (`text-sm font-medium text-slate-700`)
- Error messages: `text-xs text-red-500 mt-1`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-blue-500`

### Table
- Sticky header
- Zebra rows: `odd:bg-slate-50`
- Row hover: `hover:bg-slate-100 transition-colors`
- Actions column: right-aligned

### Dialog / Modal
- Centered, `max-w-md` for forms
- Overlay: `bg-black/50 backdrop-blur-sm`
- Close on escape + click outside

### Toast
- Position: `bottom-right` (from `app/providers.tsx`: `position="bottom-right"`)
- Use Sonner (`<Toaster />` in root layout, NOT in individual pages)
- Duration: 1800ms (from providers.tsx)

---

## 6) Navigation

### Sidebar Items
- Icon (Lucide, `w-5 h-5`) + Label
- Active: `bg-blue-50 text-blue-600 border-l-2 border-blue-600`
- Hover: `hover:bg-slate-100`

### Breadcrumb
- `text-xs text-slate-400` breadcrumbs above page titles
- Separator: `/`

### Page Header
```
[Breadcrumb]
[H1 Title]
[Description subtitle]
[Action buttons — right-aligned]
---
[Filters bar]
[Content]
```

---

## 7) Animations & Motion

| Type | Duration | Easing |
|------|----------|--------|
| Micro-interactions | 150ms | ease-out |
| Hover transitions | 200ms | ease-in-out |
| Page transitions | 300ms | ease-in-out |
| Toast enter | 200ms | spring |
| Toast exit | 150ms | ease-out |

- Use `transition-all duration-200`
- Respect `prefers-reduced-motion`
- Avoid layout-shifting animations (use `transform`/`opacity` only)
- AI streaming: pulse animation for loading indicators

---

## 8) Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, stacked |
| Tablet | 640–1023px | 2-column grids |
| Desktop | ≥ 1024px | Full sidebar + multi-col |

- Mobile-first approach
- Sidebar collapses to drawer on mobile (shadcn/ui Dialog or @base-ui/react)
- Tables: horizontal scroll on mobile (min-width preserved)
- Touch targets: minimum 44×44px

---

## 9) Accessibility

- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (large text/UI)
- [ ] Focus rings on all interactive elements
- [ ] `aria-label` on icon-only buttons
- [ ] `label` with `for` on all form inputs
- [ ] Alt text on all meaningful images
- [ ] Tab order matches visual order
- [ ] No emoji as icons — use Lucide SVGs
- [ ] `cursor-pointer` on all clickable non-button elements

---

## 10) Anti-patterns (Avoid)

- ❌ Heavy chrome / visual clutter
- ❌ Slow or no response feedback on actions
- ❌ `bg-white/10` glass cards in light mode
- ❌ `text-slate-400` for body text
- ❌ Scale transforms on hover (causes layout shift)
- ❌ Emojis as UI icons
- ❌ Mixing icon sets (use Lucide consistently)
- ❌ `border-white/10` borders (invisible in light mode)
- ❌ Instant state changes (always use transitions)
- ❌ Toaster placed in individual pages (root layout only)
