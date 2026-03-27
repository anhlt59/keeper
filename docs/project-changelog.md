# Project Changelog

Significant changes, features, and fixes are documented here. Most recent first.

---

## 2026-03-26

**Phase 2 Complete — Enhanced Features**

- **FSM Refactor:** States reduced to 5 (`AVAILABLE`, `ASSIGNED`, `MAINTENANCE`, `RETIRED`, `DISPOSED`). `PURCHASED` and `IN_USE` removed from enum and codebase. FSM transition table updated in `lib/fsm.ts`.
- **Employee Model Added:** `Employee` model in Prisma schema — separate from auth `User`, used for asset assignment.
- **Better Auth OAuth Setup:** `Account` and `Verification` models added. `openAPI()` plugin enabled in `lib/auth.ts`.
- **OCR Invoice Pipeline:** Full implementation: upload image → save to `public/uploads/invoices/YYYY/MM/` → GPT-4o-mini extraction → admin review → confirm → create assets + categories.
- **Invoice ↔ Assets Relation:** `Invoice.assets[]` relation added — assets created from an invoice are linked via `Asset.invoiceId` FK. Migration: `add_invoice_assets_relation`.
- **Invoice Detail Page Redesign:** Upload Invoice style with step indicator + Card shell layout.
- **i18n Subsystem:** `context/language-context.tsx`, `lib/i18n/translations.ts`, `lib/i18n/translations-extended.ts`, `components/shared/language-toggle.tsx` implemented.
- **Dynamic Attributes:** `AttributeDefinition` + `AssetAttributeValue` + Zod validators fully implemented.
- **QR System:** Auto-generate on asset create, `qrcode` library, 25mm × 25mm, `/assets/[id]/lookup` public endpoint with rate limiting.
- **Mobile Scanner:** `html5-qrcode` scanner component + dedicated `/scan` page.
- **Scripts:** `scripts/start.sh` and `scripts/migrate.sh` added for local dev convenience.
- **API Client Utility:** `lib/api-fetch.ts` wraps `fetch()` with 401 → `/login` redirect.

---

## 2026-03-25

**Phase 1 Complete — Core Features**

- **Phase 0 Done:** Next.js scaffold, Prisma schema (14 tables), Better Auth setup, directory structure, seed data.
- **Asset CRUD:** Full create/read/update/soft-delete with categories.
- **FSM Lifecycle:** `lib/fsm.ts` with `validateTransition()`, `canTransition()`, `getAvailableTransitions()`, `ASSET_TRANSITIONS` table.
- **Assignment/Recall:** Assign to employee/department, recall with reason, tracked via `Asset.employeeId` FK + `AssetEvent` log.
- **Maintenance:** `Maintenance` model with type, description, vendor, cost, duration, status.
- **Dual Audit Logging:** `AssetEvent` (lifecycle) + `AuditLog` (who/what/when) via `logAssetEvent()` in `lib/audit-logger.ts`.
- **Dashboard KPI:** Total value, status distribution chart (Recharts), recent events, maintenance cost/month.
- **Public QR Lookup:** `/assets/[id]/lookup` page with rate limiting.
- **OCR Invoice Skeleton:** Invoice model + OcrExtraction model defined, routes stubbed.

---

## 2026-03-24

**Project Init**

- Repository initialized with Next.js 16.2.1 + TypeScript
- Prisma schema v1: User, Session, Account, Verification, Employee, Category, Asset, AssetEvent, Maintenance, AuditLog, Invoice, OcrExtraction, AttributeDefinition + all enums
- Docker Compose PostgreSQL setup
- `.env.example` committed
- README scaffold

---

*Add new entries above, most recent first.*
