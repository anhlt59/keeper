# Plan — Zoo Asset Management MVP

> Phased implementation plan for the asset management system.

## Overview

- **Project:** Zoo Asset Management System
- **PRD:** [docs/prd-v1.md](../../docs/prd-v1.md)
- **Tech Stack:** Next.js 15 + Prisma + PostgreSQL + Better Auth + GPT-4o-mini
- **Timeline:** ~6–8 weeks (Phase 1: 3–4w, Phase 2: 2–3w, Phase 3: 1–2w)

## Phases

| Phase | Name | Status | Key Deliverables |
|-------|------|--------|-----------------|
| 0 | [Init Project](./phase-00-init-project.md) | ✅ Done | Next.js scaffold, Prisma schema, Better Auth, directory structure |
| 1 | [Asset + Lifecycle + Dashboard](./phase-01-asset-lifecycle-dashboard.md) | ✅ Done | Asset CRUD, FSM lifecycle, Assignment/Recall, Maintenance, Audit, Dashboard KPI |
| 2 | [Dynamic Attrs + QR + OCR](./phase-02-dynamic-attrs-qr-ocr.md) | ⏳ Pending | Dynamic attrs, QR generation/print, Mobile scan, OCR invoice |

### Future (Out of MVP Scope)
- Phase 3: Periodic Inventory Cycle + Performance optimization + Hardening

## Key Decisions (Locked)

1. **Custom FSM** — no xstate, validate at service layer
2. **JSONB + Zod** for dynamic attributes
3. **Prisma Middleware** for auto audit log
4. **GPT-4o-mini** for OCR (no self-hosted)
5. **html5-qrcode** for mobile web scan
6. **Office Supply + Periodic Inventory** — removed from MVP, Phase 3+
7. **Local dev** first, Vercel later

## Dependencies

- Phase 0 → Phase 1 → Phase 2 (sequential)
- Each phase builds on previous phase's foundation

## Getting Started

```bash
# Phase 0
./plans/260325-0106-asset-mgmt-init/phase-00-init-project.md
```
