# Zoo — Deployment Guide

> **Version:** 1.0.0 | **Current phase:** Local development
> **Future:** Vercel deployment (Phase 2+)
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
git clone https://github.com/RebootW/Zoo
cd Zoo

# 2. Install dependencies
npm install

# 3. Start PostgreSQL via Docker
docker compose up -d

# 4. Copy env and fill in values
cp .env.local.example .env.local

# 5. Run Prisma migrations
npx prisma migrate dev --name init

# 6. Seed sample data
npx prisma db seed

# 7. Start dev server
npm run dev
```

App runs at `http://localhost:3000`.

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

# Optional: File storage (Phase 2+)
# STORAGE_TYPE="local" # or "r2" / "s3"
# R2_ACCOUNT_ID="..."
# R2_ACCESS_KEY_ID="..."
# R2_SECRET_ACCESS_KEY="..."
# R2_BUCKET_NAME="zoo-invoices"
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
    container_name: zoo_postgres
    environment:
      POSTGRES_USER: zoo
      POSTGRES_PASSWORD: zoo_secret
      POSTGRES_DB: zoo_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zoo"]
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
npx prisma migrate dev --name describe_change

# 3. Review generated SQL in prisma/migrations/
# 4. Test migration applies cleanly
npx prisma migrate deploy

# 5. Commit migration + schema.prisma in same PR
git add prisma/migrations/ prisma/schema.prisma
git commit -m "feat: add migration for ..."
```

**Rules:**

- `prisma migrate dev` for local development only
- `prisma migrate deploy` for production (CI/CD)
- Always commit migration files + schema in same PR
- Never edit committed migrations — create new migration instead

---

## 5. Vercel Deployment Plan (Future)

### Phase 2+ Deployment

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect repo to Vercel
# vercel.com → New Project → Import Zoo repo

# 3. Configure environment variables in Vercel dashboard
# DATABASE_URL → Vercel Postgres (or Neon/Railway)
# BETTER_AUTH_SECRET
# BETTER_AUTH_URL → https://your-app.vercel.app
# OPENAI_API_KEY

# 4. Add Prisma migration to Vercel build
# package.json scripts:
# "vercel-build": "prisma generate && next build"
```

### Vercel Postgres (Recommended)

```env
# Vercel dashboard → Storage → Create Postgres
# Copy connection string to Vercel env vars
DATABASE_URL="postgresql://..."
```

### Post-Deploy

```bash
# Run migrations on deploy (via vercel-build script)
npx prisma migrate deploy

# Seed on first deploy (manual or CI script)
npx prisma db seed
```

---

## 6. Backup Strategy

### Current Phase (Local Dev)

```bash
# Manual pg_dump for local dev
pg_dump -h localhost -U zoo -d zoo_db > backup_$(date +%Y%m%d).sql
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
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run type-check` | `tsc --noEmit` |
| `npx prisma studio` | Open Prisma Studio (DB browser) |
| `npx prisma migrate dev` | Create + apply migration (dev) |
| `npx prisma migrate deploy` | Apply migrations (production) |
| `npx prisma db seed` | Seed sample data |
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
