# Plan: Refactor seed.ts to Use CSV Data

## Overview

Refactor `prisma/seed.ts` to load seed data from `prisma/data/*.csv` instead of hardcoding it inline. Replace the hardcoded `categories`, `employeeData`, and `assets` arrays.

## Status
- [x] Phase 1: Refactor seed.ts to use CSV loaders

## Dependencies
None — this is a single-file refactor.

## Key Decisions

| Concern | Decision |
|---------|----------|
| CSV parser | Native Node.js `fs` + manual split — no extra dep |
| Hierarchical categories | Two-pass: (1) create all non-child categories, (2) link children via `parentId` |
| CSV encoding | UTF-8 BOM strip for Vietnamese text |
| Idempotency | Keep `upsert` on `code`/`email`/`name` — no `deleteMany` resets |
| Products → Assets | `products.csv` rows become `Asset` records; `code` field used as-is |
| Maintenance seed | Keep in-memory (historical data — not in CSV) |
| Employees reset | Remove `deleteMany` on employees — upsert is sufficient |

## Phases

- [Phase 1](./phase-01-refactor-seed.md) — Implement CSV loaders and refactor `seed.ts`
