# Keeper — Deployment Guide

> **Version:** 0.1.0 | **Current phase:** Local development
> **Future:** Vercel deployment (Phase 3)
> **Ref:** [code-standards.md](./code-standards.md)

---

## 1. Local Development Setup

### Prerequisites

- Node.js 20+ (use `nvm` or `fnm`)
- Docker + Docker Compose (PostgreSQL)
- Git

### Quick Start

```bash
# 1. Clone / navigate to project
git clone <repo-url>
cd zoo

# 2. Install dependencies
npm install

# 3. Start PostgreSQL via Docker
docker compose up -d

# 4. Copy env and fill in values
cp .env.local.example .env.local

# 5. Run Prisma migrations
npm run db:migrate

# 6. Seed sample data
npm run db:seed

# 7. Start dev server
npm run dev
```

App runs at `http://localhost:3000`.

### Scripts

| Command | Description |
|---|---|
| `npm run start` | `scripts/start.sh` — start Docker, run migrations, seed if needed, start dev server |
| `npm run migrate` | `scripts/migrate.sh` — start Docker, run migrations only |

---

## 2. Environment Variables

### `.env.local` (local, NOT committed)

```env
# Database
DATABASE_URL="postgresql://zoo:zoo_secret@localhost:5432/zoo_db"

# Better Auth
BETTER_AUTH_SECRET="your-32-char-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# OpenAI (OCR)
OPENAI_API_KEY="sk-..."
```

### `.env.local.example` (committed — template only)

```env
DATABASE_URL="postgresql://zoo:zoo_secret@localhost:5432/zoo_db"
BETTER_AUTH_SECRET="replace-with-32-char-secret"
BETTER_AUTH_URL="http://localhost:3000"
OPENAI_API_KEY="replace-with-your-key"
```

**Rule:** Never commit `.env.local`. Only commit `.env.local.example`.

---

## 3. Docker Compose — PostgreSQL

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: zoo-postgres
    environment:
      POSTGRES_USER: zoo
      POSTGRES_PASSWORD: zoo_secret
      POSTGRES_DB: zoo_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zoo -d zoo_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Stop + wipe data
docker compose down -v
```

---

## 4. Database Migration Workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run db:migrate

# 3. Review generated SQL in prisma/migrations/
# 4. Test migration applies cleanly
npx prisma migrate deploy

# 5. Commit migration + schema.prisma in same PR
git add prisma/migrations/ prisma/schema.prisma
git commit -m "feat: add migration for ..."
```

**Rules:**

- `npm run db:migrate` (`prisma migrate dev`) for local development only
- `prisma migrate deploy` for production (CI/CD)
- Always commit migration files + schema in same PR
- Never edit committed migrations — create new migration instead

---

## 5. Vercel Deployment Plan (Phase 3)

### Pre-requisites

```bash
# Push to GitHub
git push origin main
```

### Deployment Steps

1. Connect repo to Vercel
2. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL` → Vercel Postgres (or Neon/Railway)
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` → `https://your-app.vercel.app`
   - `OPENAI_API_KEY`
3. Add build script to `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && next build"
  }
}
```

### Auth Models for Production

Better Auth uses 4 tables: `User`, `Session`, `Account`, `Verification`. Ensure migration runs on first deploy to create these tables.

### Post-Deploy

```bash
# Run migrations on deploy (via vercel-build)
npx prisma migrate deploy
```

---

## 6. Backup Strategy

### Current Phase (Local Dev)

```bash
# Manual pg_dump for local dev
pg_dump -h localhost -U zoo -d zoo_dev > backup_$(date +%Y%m%d).sql
```

### Production Target (TBD — unresolved)

| Option | Pros | Cons |
|---|---|---|
| Vercel Postgres built-in backup | Zero config, daily | Retention policy TBD |
| Neon | Branching, point-in-time | Extra cost |
| pg_dump to S3 | Full control | Manual setup |
| Cloudflare R2 + pg_dump | Cheap, durable | Manual script needed |

**Decision pending:** Backup provider not yet selected.

**Minimum requirement:** Daily backup, 30-day retention.

---

## 7. Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (localhost:3000, turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run type-check` | `tsc --noEmit` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` (local only) |
| `npm run db:push` | `prisma db push` (fast schema sync) |
| `npm run db:seed` | `tsx prisma/seed.ts` |
| `npm run db:studio` | `prisma studio` |
| `npm run start` | `scripts/start.sh` — full local stack |
| `npm run migrate` | `scripts/migrate.sh` — migrations only |
| `docker compose up -d` | Start PostgreSQL |
| `docker compose down` | Stop PostgreSQL |

---

## 8. Troubleshooting

```bash
# Database connection refused
docker compose ps  # is postgres running?
docker compose logs postgres  # check postgres logs

# Prisma client out of sync with schema
npx prisma generate

# Migration conflicts
npx prisma migrate status
# If stuck: npx prisma migrate resolve --applied <migration-name>

# Auth session errors
# Check BETTER_AUTH_SECRET matches between env and DB
# Check BETTER_AUTH_URL matches current origin
```

---

*Unresolved: Invoice storage — local filesystem vs. cloud (S3/R2)?*
*Unresolved: Backup provider — not yet selected (Vercel Postgres vs. dedicated pg_dump to cloud storage)*
