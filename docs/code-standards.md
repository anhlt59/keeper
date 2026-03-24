# Zoo — Code Standards

> **Version:** 1.0.0 | **Applies to:** All app code (`app/`, `lib/`, `components/`, `prisma/`)
> **Ref:** [codebase-summary.md](./codebase-summary.md)

---

## 1. File Naming

| Type | Convention | Example |
|---|---|---|
| Pages | `page.tsx` | `app/assets/page.tsx` |
| Layouts | `layout.tsx` | `app/(dashboard)/layout.tsx` |
| API routes | `route.ts` | `app/api/assets/route.ts` |
| Zod validators | `kebab-case.ts` | `asset-validator.ts` |
| Service files | `kebab-case.service.ts` | `asset.service.ts` |
| FSM / utilities | `kebab-case.ts` | `fsm.ts`, `qr.ts`, `ocr.ts` |
| Components | `kebab-case.tsx` | `asset-list.tsx`, `kpi-cards.tsx` |
| shadcn/ui | `ui/` dir | `components/ui/button.tsx` |

**Rule:** Descriptive kebab-case names — LLMs infer purpose from filename without reading content.

---

## 2. Component Patterns

### Server vs. Client Components

```tsx
// Server Component (default) — data fetching, SEO, static UI
// app/assets/page.tsx
export default async function AssetListPage() {
  const assets = await assetService.getAll(); // direct await in RSC
  return <AssetList data={assets} />;
}

// Client Component — forms, dialogs, charts, real-time
// components/assets/asset-list.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function AssetList({ data }: { data: Asset[] }) {
  const { data: freshData } = useQuery({ ... });
  // interactive logic here
}
```

**Rule:** Keep RSC for data fetching + static structure. Use `"use client"` only where interactivity, browser APIs, or TanStack Query is needed.

### Server Actions

```tsx
// app/actions/asset-actions.ts
"use server";

import { assetService } from "@/lib/services/asset.service";
import { assetValidator } from "@/lib/validators/asset-validator";
import { revalidatePath } from "next/cache";

export async function createAsset(formData: FormData) {
  const parsed = assetValidator.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }
  const asset = await assetService.create(parsed.data);
  revalidatePath("/assets");
  return { data: asset };
}
```

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
  is_deleted  Boolean   @default(false)  @map("is_deleted")
  deleted_at  DateTime? @db.Timestamp   @map("deleted_at")
  created_at  DateTime  @default(now())  @map("created_at")
  updated_at  DateTime  @updatedAt      @map("updated_at")

  // ... fields

  @@index([is_deleted])
  @@index([category_id])
  @@map("assets")
}

// Append-only event log — NO soft delete, NO updatedAt
model AssetEvent {
  id        String   @id @default(cuid())
  asset_id  String   @map("asset_id")
  type      String
  metadata  Json?
  created_at DateTime @default(now()) @map("created_at")

  @@index([asset_id, created_at])
  @@map("asset_events")
}
```

**Rules:**
- All core tables: `is_deleted`, `deleted_at`, `created_at`, `updated_at`
- Event/audit tables: only `id`, FK, `created_at` — append-only
- Index on: FKs, soft delete flag, frequently filtered fields
- Prisma migrations must be committed in same PR as code that uses new fields

---

## 4. Better Auth Setup Patterns

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/prisma/db-schema"; // exported from Prisma

export const auth = betterAuth({
  database: drizzleAdapter(drizzle(db), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // update session every 24h
  },
  rateLimit: {
    max: 5,
    window: 15 * 60, // 5 attempts per 15 min
  },
  secret: process.env.BETTER_AUTH_SECRET,
});
```

**Rules:**
- Cookie: HttpOnly + Secure (production) + SameSite=Lax
- Session expires: 7 days, update every 24h
- Rate limit: 5 failed logins / 15 min per IP
- Protect all API routes and dashboard routes via auth hook

---

## 5. Zod Validation Patterns

```ts
// lib/validators/asset-validator.ts
import { z } from "zod";

export const assetCreateSchema = z.object({
  name: z.string().min(1).max(255),
  category_id: z.string().cuid(),
  purchase_date: z.string().datetime().optional(),
  purchase_price: z.number().positive().optional(),
  serial_number: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  custom_attrs: z.record(z.unknown()).optional(),
});

export const assetTransitionSchema = z.object({
  target_state: z.enum([
    "assigned", "in_use", "maintenance", "retired", "disposed",
  ]),
  metadata: z.record(z.unknown()).optional(),
});

// Type inference
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
```

**Rules:**
- All API inputs validated before service call
- Use `safeParse` + return structured errors (never throw Zod errors directly to client)
- Shared schemas between API routes and Server Actions

---

## 6. FSM Implementation Patterns

```ts
// lib/fsm.ts
import { BadRequestError } from "@/lib/errors";

const STATES = [
  "purchased",
  "assigned",
  "in_use",
  "maintenance",
  "retired",
  "disposed",
] as const;

type AssetState = (typeof STATES)[number];

const TRANSITIONS: Record<AssetState, AssetState[]> = {
  purchased: ["assigned"],
  assigned: ["in_use", "maintenance"],
  in_use: ["assigned", "maintenance", "retired"],
  maintenance: ["in_use"],
  retired: ["disposed"],
  disposed: [], // terminal
};

export function validateTransition(
  from: AssetState,
  to: AssetState
): void {
  const allowed = TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new BadRequestError(
      `Invalid transition: ${from} → ${to}. Allowed: ${allowed.join(", ") || "none"}`
    );
  }
}

export function getNextStates(current: AssetState): AssetState[] {
  return TRANSITIONS[current] ?? [];
}
```

**Rules:**
- FSM validates BEFORE DB write — throw `BadRequestError` if invalid
- No direct state assignment without going through `validateTransition`
- Service layer calls FSM validate then Prisma write in same logical unit

---

## 7. API Route Conventions

```ts
// app/api/assets/route.ts — GET list, POST create
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assetService } from "@/lib/services/asset.service";
import { assetCreateSchema } from "@/lib/validators/asset-validator";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await assetService.getAll();
  return NextResponse.json({ data: assets });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = assetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const asset = await assetService.create(parsed.data, session.user.id);
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

## 8. Code Quality

| Check | Command | Target |
|---|---|---|
| TypeScript | `tsc --noEmit` | Zero errors |
| ESLint | `npm run lint` | Zero errors |
| Build | `npm run build` | Pass |
| Max file size | — | < 200 LOC per file (modularize larger) |
| Prisma | `prisma validate` | Valid schema |

**Rule:** Pre-commit: lint + type-check. Pre-push: build + tests.

---

## 9. Git Conventions

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

## 10. Error Handling

```ts
// lib/errors.ts
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
```

**Rules:**
- Service layer throws typed errors (`BadRequestError`, `NotFoundError`)
- API routes catch and return structured JSON responses
- Never expose internal stack traces to client

---

*Unresolved: Invoice storage strategy — local `public/` vs. cloud (S3/R2)*
