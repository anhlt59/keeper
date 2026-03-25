# Zoo — Code Standards

> **Version:** 1.1.0 | **Applies to:** All app code (`app/`, `lib/`, `components/`, `prisma/`)
> **Ref:** [codebase-summary.md](./codebase-summary.md)

---

## 1. File Naming

| Type | Convention | Example |
|---|---|---|
| Pages | `page.tsx` | `app/assets/page.tsx` |
| Layouts | `layout.tsx` | `app/(dashboard)/layout.tsx` |
| API routes | `route.ts` | `app/api/assets/route.ts` |
| Zod validators | `kebab-case.ts` | `asset.ts`, `dynamic-attrs.ts` |
| Service files | `kebab-case.service.ts` | `asset.service.ts` |
| FSM / utilities | `kebab-case.ts` | `fsm.ts`, `qr-generator.ts`, `ocr.ts` |
| Components | `kebab-case.tsx` | `kpi-card.tsx`, `qr-scanner.tsx` |
| shadcn/ui | `ui/` dir | `components/ui/button.tsx` |

**Rule:** Descriptive kebab-case names — LLMs infer purpose from filename without reading content.

---

## 2. Component Patterns

### Server vs. Client Components

```tsx
// Server Component (default) — data fetching, SEO, static UI
// app/assets/page.tsx
export default async function AssetListPage() {
  const assets = await assetService.listAssets({ page: 1 }); // direct await in RSC
  return <AssetList data={assets} />;
}

// Client Component — forms, dialogs, charts, real-time
// components/assets/qr-scanner.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function QRScanner() {
  const { data } = useQuery({ ... });
  // interactive logic here
}
```

**Rule:** Keep RSC for data fetching + static structure. Use `"use client"` only where interactivity, browser APIs, or TanStack Query is needed.

### File-Level vs Inline `"use server"`

```ts
// File-level: entire file is a Server Action module
// app/actions/asset-actions.ts
"use server";

import { assetService } from "@/lib/services/asset-service";
import { revalidatePath } from "next/cache";

export async function createAsset(formData: FormData) {
  // ...
  revalidatePath("/assets");
  return { data: asset };
}

// Inline: only the exported function runs on the server
// app/api/assets/route.ts  (no "use server" needed — API routes are server by default)
import { NextRequest, NextResponse } from "next/server";
// All code here runs on the server automatically.
```

**Rule:** API route files (`route.ts`) do NOT need `"use server"` — Next.js treats them as server-only by default. Only Server Action files explicitly need `"use server"` at the top. Do NOT add `"use server"` to shared utility files — it would break client-side imports.

---

## 3. Prisma Schema Conventions

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Soft delete mixin — all core tables include these fields
model Asset {
  id          String    @id @default(cuid())
  isDeleted   Boolean   @default(false)  @map("is_deleted")
  deletedAt   DateTime? @db.Timestamp   @map("deleted_at")
  createdAt   DateTime  @default(now())  @map("created_at")
  updatedAt   DateTime  @updatedAt      @map("updated_at")

  // ... fields

  @@index([isDeleted])
  @@index([categoryId])
  @@map("assets")
}

// Append-only event log — NO soft delete, NO updatedAt
model AssetEvent {
  id        String   @id @default(cuid())
  assetId   String   @map("asset_id")
  eventType String
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  @@index([assetId, createdAt])
  @@map("asset_events")
}
```

**Rules:**
- All core tables: `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`
- Event/audit tables: only `id`, FK, `createdAt` — append-only
- Index on: FKs, soft delete flag, frequently filtered fields
- Prisma migrations must be committed in same PR as code that uses new fields

---

## 4. Better Auth Setup Patterns

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);

export const auth = betterAuth({
  database: prismaAdapter(adapter, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,        // 7 days
    updateAge: 60 * 60 * 24,             // update session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,                    // cache session cookie for 5 min
    },
  },
  rateLimit: {
    max: 5,
    window: 15 * 60,                     // 5 attempts per 15 min
  },
});
```

**Rules:**
- Use `PrismaPg` adapter (not `drizzleAdapter`) — matches current codebase
- Cookie: HttpOnly + Secure (production) + SameSite=Lax
- Session expires: 7 days, update every 24h
- Rate limit: 5 failed logins / 15 min per IP
- Protect all API routes and dashboard routes via auth hook

---

## 5. Zod Validation Patterns

```ts
// lib/validators/asset.ts
import { z } from "zod";
import { AssetStatus } from "@prisma/client";

const assetStatusSchema = z.nativeEnum(AssetStatus);

// Zod v4: use .cuid() directly (not .string().cuid())
export const createAssetSchema = z.object({
  code: z.string().min(1, "Asset code is required").max(50),
  name: z.string().min(1, "Asset name is required").max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().cuid("Invalid category ID"),        // Zod v4 chained
  status: assetStatusSchema.optional().default(AssetStatus.PURCHASED),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  serialNumber: z.string().max(100).optional(),
  assignedTo: z.string().max(200).optional(),
  attributeValues: z.record(z.string(), z.unknown()).optional(),
});

export const changeStatusSchema = z.object({
  toStatus: assetStatusSchema,
  description: z.string().max(500).optional(),
});

// Type inference
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
```

**Rules:**
- All API inputs validated before service call
- Use `safeParse` + return structured errors (never throw Zod errors directly to client)
- Zod v4: chain validators directly (e.g., `z.string().cuid()` not `z.string().min(1).cuid()` where min conflicts)
- Shared schemas between API routes and Server Actions

---

## 6. FSM Implementation Patterns

```ts
// lib/fsm.ts
import { AssetStatus, AssetEventType } from "@prisma/client";

// States: PURCHASED → ASSIGNED → IN_USE ↔ MAINTENANCE → RETIRED → DISPOSED
// RESTORED: DISPOSED → RETIRED   RECALLED: ASSIGNED → PURCHASED

export type FSMTransition = {
  from: AssetStatus;
  to: AssetStatus;
  eventType: AssetEventType;
  label: string;
};

export const ASSET_TRANSITIONS: FSMTransition[] = [
  { from: AssetStatus.PURCHASED,   to: AssetStatus.ASSIGNED,    eventType: AssetEventType.ASSIGNED,             label: "Assign" },
  { from: AssetStatus.ASSIGNED,   to: AssetStatus.IN_USE,      eventType: AssetEventType.STATUS_CHANGE,        label: "Mark in use" },
  { from: AssetStatus.IN_USE,     to: AssetStatus.MAINTENANCE, eventType: AssetEventType.MAINTENANCE_CREATED, label: "Send to maintenance" },
  { from: AssetStatus.MAINTENANCE, to: AssetStatus.IN_USE,     eventType: AssetEventType.MAINTENANCE_COMPLETED, label: "Maintenance complete" },
  { from: AssetStatus.IN_USE,     to: AssetStatus.RETIRED,     eventType: AssetEventType.STATUS_CHANGE,        label: "Retire" },
  { from: AssetStatus.ASSIGNED,   to: AssetStatus.RETIRED,     eventType: AssetEventType.STATUS_CHANGE,        label: "Retire (unassigned)" },
  { from: AssetStatus.PURCHASED,  to: AssetStatus.RETIRED,     eventType: AssetEventType.STATUS_CHANGE,        label: "Retire (unused)" },
  { from: AssetStatus.RETIRED,   to: AssetStatus.DISPOSED,    eventType: AssetEventType.DISPOSED,             label: "Dispose" },
  { from: AssetStatus.DISPOSED,  to: AssetStatus.RETIRED,     eventType: AssetEventType.RESTORED,             label: "Restore" },
  { from: AssetStatus.ASSIGNED,   to: AssetStatus.PURCHASED,  eventType: AssetEventType.RECALLED,            label: "Recall" },
];

export function validateTransition(from: AssetStatus, to: AssetStatus): FSMTransition {
  const transition = ASSET_TRANSITIONS.find(t => t.from === from && t.to === to);
  if (!transition) {
    throw new Error(
      `Invalid FSM transition: '${from}' → '${to}'. ` +
      `Available from '${from}': ${getAvailableTransitions(from).map(t => t.to).join(", ") || "none"}.`
    );
  }
  return transition;
}

export function getAvailableTransitions(current: AssetStatus): FSMTransition[] {
  return ASSET_TRANSITIONS.filter(t => t.from === current);
}
```

**Rules:**
- FSM validates BEFORE DB write — throw plain `Error` if invalid
- No direct state assignment without going through `validateTransition`
- Service layer calls FSM validate then Prisma write in same logical unit
- Use `AssetEventType` enums (from Prisma), NOT string literals for event types

---

## 7. API Route Conventions

```ts
// app/api/assets/route.ts — GET list, POST create
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assetService } from "@/lib/services/asset-service";
import { createAssetSchema } from "@/lib/validators/asset";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await assetService.listAssets({ page: 1 });
  return NextResponse.json({ data: assets });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const asset = await assetService.createAsset(parsed.data, session.user.id);
    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Rules:**
- Auth check first on every endpoint
- Zod validation before service call
- Structured error responses: `{ error: string | object }`
- Service layer handles all DB logic — routes never call Prisma directly

---

## 8. Audit Logging Patterns

```ts
// lib/audit.ts — set request-scoped context before work
import { setAuditContext, clearAuditContext } from "@/lib/audit";

// app/api/assets/[id]/route.ts
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  setAuditContext({
    userId: session.user.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  try {
    // ... service call
  } finally {
    clearAuditContext();
  }
}

// lib/audit-logger.ts — atomic AssetEvent + AuditLog write
import { logAssetEvent } from "@/lib/audit-logger";
await logAssetEvent({
  assetId: asset.id,
  eventType: AssetEventType.CREATED,
  toStatus: asset.status,
  description: `Asset '${asset.name}' created`,
  performedBy,
});
```

**Rules:**
- Call `setAuditContext()` at the start of every mutating API route handler
- Use `logAssetEvent()` for lifecycle actions — it writes both `AssetEvent` (timeline) and `AuditLog` atomically
- Wrap in `try/finally` to ensure `clearAuditContext()` is called

---

## 9. Code Quality

| Check | Command | Target |
|---|---|---|
| TypeScript | `tsc --noEmit` | Zero errors |
| ESLint | `npm run lint` | Zero errors |
| Build | `npm run build` | Pass |
| Max file size | — | < 200 LOC per file (modularize larger) |
| Prisma | `npx prisma validate` | Valid schema |

**Rule:** Pre-commit: lint + type-check. Pre-push: build + tests.

---

## 10. Git Conventions

```
feat:     new feature
fix:      bug fix
docs:     documentation only
refactor: code restructure (no behavior change)
test:     adding/updating tests
chore:    maintenance, deps, config
```

**Rules:**
- No AI references in commit messages
- Prisma migrations: one migration per PR, committed with the code that uses it
- Commit message format: `<type>: <short description>`
- Example: `feat: add asset lifecycle FSM with transition validation`

---

## 11. Error Handling

```ts
// Service layer — throw plain Error (typed errors via lib/errors.ts are optional)
export async function updateAsset(id: string, data: UpdateAssetInput) {
  const asset = await prisma.asset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) throw new Error("Asset not found"); // NotFoundError unused in current code
  // ...
}
```

**Rules:**
- Service layer throws plain `Error` for not-found and bad-request cases
- API routes catch and return structured JSON responses
- Never expose internal stack traces to client
- `BadRequestError`/`NotFoundError` defined in code-standards as reference but not yet introduced in codebase

---

## 12. Testing Conventions

> [TBD] — testing setup not yet introduced. When added:

- Use **Vitest** for unit tests, **Playwright** for E2E
- Unit: test FSM transitions, Zod validators, service functions
- E2E: critical flows — asset CRUD, FSM transitions, OCR confirm
- Mock Prisma client with `jest-mock` or `prisma-client-js` mock
- Fixtures in `tests/fixtures/`

---

*Unresolved: Invoice storage strategy — local `public/` vs. cloud (S3/R2)*
