# Brainstorm Report — Zoo PRD Review & Optimization

**Date:** 2026-03-25
**Duration:** ~30 mins
**Participants:** User + Brainstormer

---

## Problem Statement

Review và optimize bản PRD draft cho hệ thống Asset Management (Zoo), sau đó chia thành implementation plans.

---

## Decisions Made

| Area | Decision | Rationale |
|------|----------|-----------|
| Tech Stack | Next.js + Prisma + PostgreSQL + Better Auth + GPT-4o-mini | Stack phổ biến, maintain được, MVP nhanh |
| Database ORM | Prisma + PostgreSQL | Studio, migrations, type-safe, phù hợp team nhỏ |
| Lifecycle FSM | Custom FSM + validation | Nhẹ hơn xstate, đủ flexible cho use case này |
| Dynamic Attrs | JSONB + Zod | GIN index được, validation mạnh, không cần EAV table |
| OCR AI | GPT-4o-mini | Ecosystem tốt, structured output ổn, chi phí thấp |
| QR Scan | Mobile Web (html5-qrcode) | Không cần native app, MVP phù hợp |
| Auth | Better Auth | TypeScript-first, session-based, CSRF + rate limiting built-in |
| Deployment | Local dev | Không cần deploy ở giai đoạn này |
| Office Supply | Bỏ MVP | Scope reduction — không có trong features list |
| Periodic Inventory | Bỏ Phase 1 | Scope reduction — complex, chuyển Phase 3+ |

## Scope Reductions from Draft

1. **Office Supply Inventory** — Bỏ hoàn toàn (không có trong features list, chỉ trong data boundary)
2. **Periodic Inventory Cycle** — Bỏ Phase 1, để Phase 3+
3. **Self-hosted OCR** — Bỏ Ollama option
4. **xstate** — Bỏ, dùng custom FSM nhẹ hơn
5. **Multi-location** — Giữ như out-of-scope (đúng spec)
6. **RBAC nhiều vai** — Giữ như out-of-scope (đúng spec)

## Trade-offs Accepted

- **FSM custom vs xstate**: Bớt declarative safety nhưng đỡ dependency, dễ debug.
- **JSONB vs EAV**: Query dynamic attrs hơi phức tạp hơn nhưng schema linh hoạt, không cần migration khi thêm attr.
- **GPT-4o-mini vs Gemini**: Confidence ổn định hơn, prompt engineering dễ hơn.

---

## Phase Breakdown

| Phase | Effort | Key Features |
|-------|--------|-------------|
| **Phase 0** (Init) | ~0.5-1 day | Scaffold + Prisma schema + Auth foundation |
| **Phase 1** (Core) | ~3-4 weeks | Asset CRUD + FSM + Assignment + Maintenance + Audit + Dashboard |
| **Phase 2** (Enhance) | ~2-3 weeks | Dynamic Attrs + QR + Mobile Scan + OCR Invoice |

## Key Risks & Mitigations

1. **OCR accuracy**: Iterate prompt + test với 10+ invoices VN/EN trước ship
2. **FSM edge cases**: Unit test all transitions
3. **Dashboard perf**: Dùng Prisma aggregation, index đúng
4. **Dynamic attrs query**: GIN index trên JSONB column

---

## Unresolved Questions

1. **Asset soft delete vs hard delete** — Chưa quyết định final. Khuyến nghị soft delete để preserve audit trail.
2. **Invoice storage** — Local filesystem hay S3-compatible? Quyết định khi cần deploy.
3. **Periodic Inventory logic** — Cần design chi tiết khi bắt đầu Phase 3.

---

## Deliverables

- [docs/prd-v1.md](../../docs/prd-v1.md) — PRD final
- [plans/260325-0106-asset-mgmt-init/plan.md](./phase-00-init-project.md) — Master plan
- [plans/260325-0106-asset-mgmt-init/phase-00-init-project.md](./phase-00-init-project.md) — Phase 0
- [plans/260325-0106-asset-mgmt-init/phase-01-asset-lifecycle-dashboard.md](./phase-01-asset-lifecycle-dashboard.md) — Phase 1
- [plans/260325-0106-asset-mgmt-init/phase-02-dynamic-attrs-qr-ocr.md](./phase-02-dynamic-attrs-qr-ocr.md) — Phase 2
