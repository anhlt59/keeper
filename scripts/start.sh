#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ── Step 1: Ensure zoo-postgres container is running ───────────────────────────
echo "🐳 Checking zoo-postgres container..."
CONTAINER_NAME="zoo-postgres"

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "✅ Container '$CONTAINER_NAME' is already running."
else
  echo "⚠️  Container '$CONTAINER_NAME' is not running. Starting Docker Compose..."
  docker compose up -d
  echo "✅ Docker Compose started."
fi

# Wait for postgres to be healthy
echo "⏳ Waiting for postgres to be ready..."
for i in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" pg_isready -U zoo -d zoo_dev -q 2>/dev/null; then
    echo "✅ Postgres is ready."
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Postgres did not become ready in time. Aborting."
    exit 1
  fi
  sleep 1
done

# ── Step 2: Ensure seed data exists ──────────────────────────────────────────
echo "🌱 Checking for seed data..."
# Check by looking for the master admin user created by seed
EXISTING_USER=$(docker exec "$CONTAINER_NAME" psql -U zoo -d zoo_dev -tAc \
  "SELECT 1 FROM \"User\" WHERE email='admin@zoo.local' LIMIT 1" 2>/dev/null || true)

if [ "$EXISTING_USER" = "1" ]; then
  echo "✅ Seed data already exists (admin@zoo.local found)."
else
  echo "📦 Seed data not found. Running db:seed..."
  npm run db:seed
  echo "✅ Seed complete."
fi

# ── Step 3: Start the dev server ──────────────────────────────────────────────
echo "🚀 Starting dev server..."
npm run dev
