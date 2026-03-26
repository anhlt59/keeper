# Zoo — Model Design

> **Version:** 1.2.0 | **Schema:** `prisma/schema.prisma` (Prisma 7.5.0 + PostgreSQL)
> **Ref:** [system-architecture.md](./system-architecture.md) · [code-standards.md](./code-standards.md)

---

## 1. Overview

**Data layer:** Prisma 7.5.0 ORM over PostgreSQL. All writes go through service layer; API routes never call Prisma directly.

**Design philosophy — four cross-cutting concerns:**

| Concern         | Mechanism                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Safe deletion   | Soft delete (`isDeleted` + `deletedAt`) on all core tables; queries always filter `isDeleted = false`                          |
| Auditability    | Dual append-only logs: `AssetEvent` (lifecycle timeline) + `AuditLog` (who/what/when), written atomically via `$transaction`     |
| State integrity | Custom FSM (`lib/fsm.ts`) — `validateTransition()` called before every status write, throws on invalid paths                    |
| Extensibility   | Dynamic attributes via `AttributeDefinition` (category-scoped schema) + `AssetAttributeValue` (JSONB values per asset)           |

**Money fields:** `Decimal(12, 2)` enforced at DB level — `purchasePrice`, `cost`, `totalAmount`.

---

## 2. ER Diagram

```
┌─────────────┐     1:N      ┌─────────────┐
│    User     │──────────────│   Session   │
│─────────────│              │─────────────│
│ id (PK)     │              │ id (PK)     │
│ email (U)   │              │ userId (FK) │
│ name        │              │ token (U)   │
│ emailVerified│             │ expiresAt   │
│ image?      │              │ ipAddress?  │
│ isDeleted   │              │ userAgent?  │
│ deletedAt?  │              │ createdAt   │
│ createdAt   │              └─────────────┘
│ updatedAt   │                    │
└─────────────┘                    │
      │                            │
      │ 1:N                        │
      ▼                            │
┌─────────────┐              ┌─────────────┐
│   Account   │              │Verification │
│─────────────│              │─────────────│
│ id (PK)     │              │ id (PK)     │
│ userId (FK) │              │ identifier  │
│ providerId  │              │ value       │
│ accountId   │              │ expiresAt   │
│ accessToken?│              └─────────────┘
│ refreshToken?│
│ password?   │
│ createdAt   │
└─────────────┘

┌─────────────┐     1:N      ┌──────────────────────┐     1:N
│  Employee   │──────────────│ AttributeDefinition  │
│─────────────│              │──────────────────────│
│ id (PK)     │              │ id (PK)             │
│ name        │              │ name                │
│ email?      │              │ fieldType           │
│ department? │              │ categoryId? (FK)   │
│ position?   │              │ required            │
│ isDeleted   │              │ options?            │
│ deletedAt?  │              │ validation? (Json)  │
│ createdAt   │              │ order               │
│ updatedAt   │              │ isDeleted           │
└──────┬──────┘              │ deletedAt?          │
       │                     └──────────┬───────────┘
       │ 1:N                            │ 1:N (categoryId)
       ▼                               ▼
┌──────────────────────────────────────────────────────────┐
│                      Category                            │
│─────────────────────────────────────────────────────────│
│ id (PK)               │ 1:N children                    │
│ name (U)              │ 1:1 parent                      │
│ description?          └─────────────────────────────────│
│ parentId? (self-ref)  │
└──────────┬─────────────┘
           │ 1:N
           ▼
┌─────────────┐     1:1      ┌─────────────────┐     1:N      ┌────────────┐
│    Asset    │─────────────│AssetAttributeValue│─────────────│ AssetEvent │
│─────────────│              │─────────────────│             │────────────│
│ id (PK)     │              │ id (PK)          │             │ id (PK)    │
│ code (U)    │              │ assetId (U,FK)  │             │ assetId(FK)│
│ name        │              │ values (Json)   │             │ eventType  │
│ description?│              └─────────────────┘             │ fromStatus?│
│ categoryId  │                                           │ toStatus?  │
│ status      │ 1:N                                        │ description?│
│ qrImage?    │  ▼                                         │ performedBy │
│ assignedTo? │ ┌────────────┐                             │ metadata?   │
│ employeeId?─┼─│ Employee   │                             │ createdAt   │
│ invoiceId?  │ │ (FK)       │                             └────────────┘
│ purchaseDate│ └────────────┘                                     │
│ purchasePrice?│                                                │
│ vendor?     │     ┌──────────────────────────────────────────────┘
│ warrantyMonths?                                                 │ 1:N
│ nextMaintenanceDate?                                            ▼
│ disposedAt?  │                    ┌─────────────────┐    ┌─────────────────┐
│ disposedNote?│                    │   Maintenance   │    │   AuditLog     │
│ isDeleted   │                    │─────────────────│    │─────────────────│
│ deletedAt?  │                    │ id (PK)         │    │ id (PK)         │
│ createdAt   │                    │ assetId (FK)    │    │ userId? (FK)    │
│ updatedAt   │                    │ type            │    │ action          │
└──────┬──────┘                    │ description     │    │ entityType      │
       │                           │ cost? (Decimal) │    │ entityId?       │
       │ 1:N                       │ startDate       │    │ description?     │
       ▼                           │ endDate?        │    │ ipAddress?       │
┌────────────┐                     │ status          │    │ userAgent?       │
│  Invoice   │                     │ performedBy?    │    │ metadata?        │
│────────────│                     │ notes?          │    │ createdAt        │
│ id (PK)    │                     │ isDeleted       │    └─────────────────┘
│ invoiceNumber?│                   │ deletedAt?      │
│ vendor?    │                     │ createdAt       │
│ invoiceDate?│                     │ updatedAt       │
│ totalAmount?│                    └─────────────────┘
│ filePath?  │
│ status     │
│ ocrExtractId? (U)
│ createdAt  │
│ updatedAt  │
│ isDeleted  │
│ deletedAt? │
└──────┬─────┘
       │ 1:N
       ▼
┌─────────────────────┐
│   OcrExtraction     │
│─────────────────────│
│ id (PK)             │
│ rawResponse (Json)  │
│ extractedData (Json)│
│ confidence (Float)  │
│ confirmed (Bool)    │
│ createdAt           │
│ updatedAt            │
│ isDeleted            │
│ deletedAt?           │
└─────────────────────┘
```

### Cardinality Summary

| Relation                        | Type  | Note                                       |
| ------------------------------ | ----- | ------------------------------------------ |
| User → Session                 | 1:N   | Cascade delete                             |
| User → Account                 | 1:N   | Cascade delete (Better Auth OAuth)         |
| Employee → Asset               | 1:N   | Cascade delete                             |
| Invoice → Asset                | 1:N   | Assets created from invoice (invoiceId FK) |
| Invoice → OcrExtraction        | 1:0..1| Invoice holds ocrExtractionId FK           |
| Category → AttributeDefinition | 1:N   | Cascade on delete                          |
| Asset → AssetAttributeValue    | 1:1   | Cascade on delete, unique assetId          |
| Asset → AssetEvent             | 1:N   | Cascade on delete                          |
| Asset → Maintenance            | 1:N   | Cascade on delete                          |
| Asset → Category               | N:1   | —                                          |

---

## 3. Entity Reference

### 3.1 User

Auth identity. Better Auth session table (no password field — auth via `Account` table for OAuth/social login).

| Field         | Type      | Constraints   | Notes                   |
| ------------- | --------- | ------------- | ---------------------- |
| id            | String    | PK, cuid      | —                      |
| email         | String    | unique        | Login identifier        |
| name          | String    | —             | Display name           |
| emailVerified | Boolean   | default false | —                      |
| image         | String?   | —             | Avatar URL              |
| isDeleted     | Boolean   | default false | Soft delete flag        |
| deletedAt     | DateTime? | —             | Soft delete timestamp   |
| createdAt     | DateTime  | default now   | —                      |
| updatedAt     | DateTime  | @updatedAt    | —                      |

**Indexes:** `@@index([isDeleted])`
**Relations:** 1→N Session (cascade), 1→N Account (cascade), 1→N AuditLog (setnull)

---

### 3.2 Session

Better Auth session record. One session per login device/session.

| Field     | Type     | Constraints        | Notes               |
| --------- | -------- | ------------------ | ------------------- |
| id        | String   | PK, cuid           | —                   |
| userId    | String   | FK → User, cascade | —                   |
| token     | String   | unique             | Session token       |
| expiresAt | DateTime | not null           | 7-day expiry        |
| ipAddress | String?  | —                  | From request headers |
| userAgent | String?  | —                  | From request headers |
| createdAt | DateTime | default now        | —                   |
| updatedAt | DateTime | @updatedAt         | —                   |

**Indexes:** `@@index([userId])`

---

### 3.3 Account

OAuth/social account linking (Better Auth plugin). Used for OAuth providers.

| Field               | Type     | Constraints   | Notes |
| ------------------- | -------- | ------------- | ----- |
| id                  | String   | PK, cuid      | —     |
| userId              | String   | FK → User     | —     |
| accountId           | String   | —             | Provider account ID |
| providerId          | String   | —             | e.g. "github"       |
| accessToken         | String?  | —             | —     |
| refreshToken        | String?  | —             | —     |
| accessTokenExpiresAt | DateTime?| —            | —     |
| refreshTokenExpiresAt| DateTime?| —            | —     |
| scope               | String?  | —             | —     |
| idToken             | String?  | —             | —     |
| password            | String?  | —             | bcrypt hashed (email/pass) |
| createdAt           | DateTime | default now   | —     |
| updatedAt           | DateTime | @updatedAt    | —     |

**Indexes:** `@@index([userId])`

---

### 3.4 Verification

Better Auth token/verification storage (email verification, magic links, etc.).

| Field      | Type     | Constraints   | Notes |
| ---------- | -------- | ------------ | ----- |
| id         | String   | PK, cuid     | —     |
| identifier | String   | —            | e.g. email address |
| value      | String   | —            | Token value |
| expiresAt  | DateTime | —            | Expiry time |
| createdAt  | DateTime | default now  | —     |
| updatedAt  | DateTime | @updatedAt   | —     |

---

### 3.5 Employee

Assignable people (not auth users — separate from `User`).

| Field      | Type      | Constraints   | Notes |
| ---------- | --------- | ------------ | ----- |
| id         | String    | PK, cuid     | —     |
| name       | String    | —            | Employee name |
| email      | String?   | —            | —     |
| department | String?   | —            | —     |
| position   | String?   | —            | —     |
| isDeleted  | Boolean   | default false | Soft delete |
| deletedAt  | DateTime? | —            | —     |
| createdAt  | DateTime  | default now  | —     |
| updatedAt  | DateTime  | @updatedAt   | —     |

**Indexes:** `@@index([isDeleted])`
**Relations:** 1→N Asset (via `Asset.employeeId` FK)

---

### 3.6 Category

Hierarchical asset category tree. Root categories have `parentId = null`.

| Field       | Type      | Constraints          | Notes                |
| ----------- | --------- | -------------------- | -------------------- |
| id          | String    | PK, cuid             | —                    |
| name        | String    | unique               | Category name        |
| description | String?   | —                    | —                    |
| parentId    | String?   | FK → Category (self) | Null = root category |
| isDeleted   | Boolean   | default false         | —                    |
| deletedAt   | DateTime? | —                    | —                    |
| createdAt   | DateTime  | default now           | —                    |
| updatedAt   | DateTime  | @updatedAt            | —                    |

**Indexes:** `@@index([isDeleted])`
**Relations:** 1→N Category children, 1→1 Category parent (self-ref), 1→N Asset, 1→N AttributeDefinition

---

### 3.7 Asset

Core entity. Represents a tracked asset.

| Field               | Type        | Constraints        | Notes                              |
| ------------------- | ----------- | ------------------ | ---------------------------------- |
| id                  | String      | PK, cuid           | —                                  |
| code                | String      | unique             | Human-readable code (e.g. ASSET-001) |
| name                | String      | —                  | —                                  |
| description         | String?     | —                  | —                                  |
| categoryId          | String      | FK → Category      | —                                  |
| status              | AssetStatus | default AVAILABLE  | FSM-governed                        |
| qrImage             | String?     | —                  | Base64 PNG DataURL                  |
| assignedTo          | String?     | —                  | Employee/department name (plain)   |
| employeeId          | String?     | FK → Employee      | Employee FK (nullable)             |
| invoiceId           | String?     | FK → Invoice       | Origin invoice (nullable)          |
| purchaseDate        | DateTime?   | —                  | —                                  |
| purchasePrice       | Decimal?    | @db.Decimal(12, 2) | —                                  |
| vendor              | String?     | —                  | —                                  |
| warrantyMonths      | Int?        | —                  | —                                  |
| nextMaintenanceDate | DateTime?   | —                  | —                                  |
| disposedAt          | DateTime?   | —                  | Set on DISPOSED transition         |
| disposedNote        | String?     | —                  | Disposal reason                    |
| isDeleted           | Boolean     | default false      | —                                  |
| deletedAt           | DateTime?   | —                  | —                                  |
| createdAt           | DateTime    | default now        | —                                  |
| updatedAt           | DateTime    | @updatedAt          | —                                  |

**Indexes:** `@@index([isDeleted])`, `@@index([status])`
**Relations:** N→1 Category, N→1 Employee (nullable), N→1 Invoice (nullable), 1→1 AssetAttributeValue (cascade), 1→N AssetEvent (cascade), 1→N Maintenance (cascade)

---

### 3.8 AssetEvent

Append-only lifecycle log. Immutable — no update/delete endpoints exposed.

| Field       | Type            | Constraints          | Notes                     |
| ----------- | --------------- | ------------------- | ------------------------- |
| id          | String          | PK, cuid            | —                         |
| assetId     | String          | FK → Asset, cascade | —                         |
| eventType   | AssetEventType  | not null            | Which transition occurred |
| fromStatus  | AssetStatus?    | —                   | State before              |
| toStatus    | AssetStatus?    | —                   | State after               |
| description | String?         | —                   | Human-readable note       |
| performedBy | String          | default "system"    | User ID or "system"       |
| metadata    | Json?           | —                   | Extra context             |
| createdAt   | DateTime        | default now         | —                         |

**Indexes:** `@@index([assetId, createdAt])`

---

### 3.9 Maintenance

Maintenance/repair record tied to an asset.

| Field       | Type               | Constraints          | Notes                              |
| ----------- | ------------------ | ------------------- | ---------------------------------- |
| id          | String             | PK, cuid             | —                                  |
| assetId     | String             | FK → Asset, cascade  | —                                  |
| type        | MaintenanceType     | not null             | PREVENTIVE / CORRECTIVE / UPGRADE  |
| description | String             | —                    | Work performed                     |
| cost        | Decimal?           | @db.Decimal(12, 2)  | —                                  |
| startDate   | DateTime           | —                    | Required                           |
| endDate     | DateTime?          | —                    | —                                  |
| status      | MaintenanceStatus  | default SCHEDULED    | —                                  |
| performedBy | String?            | —                    | Vendor or technician               |
| notes       | String?            | —                    | —                                  |
| isDeleted   | Boolean            | default false        | —                                  |
| deletedAt   | DateTime?          | —                    | —                                  |
| createdAt   | DateTime           | default now          | —                                  |
| updatedAt   | DateTime           | @updatedAt           | —                                  |

**Indexes:** `@@index([isDeleted])`, `@@index([assetId])`

---

### 3.10 AuditLog

System-wide audit trail. Written for all mutating operations.

| Field       | Type      | Constraints        | Notes                                         |
| ----------- | --------- | ------------------ | -------------------------------------------- |
| id          | String    | PK, cuid           | —                                             |
| userId      | String?   | FK → User, setnull | Null = system action                          |
| action      | String    | —                  | e.g. "asset.created", "asset.status_changed" |
| entityType  | String    | —                  | "Asset", "Category", "Invoice"               |
| entityId    | String?   | —                  | ID of affected entity                         |
| description | String?   | —                  | Human-readable summary                        |
| ipAddress   | String?   | —                  | —                                             |
| userAgent   | String?   | —                  | —                                             |
| metadata    | Json?     | —                  | Full payload diff                             |
| isDeleted   | Boolean   | default false      | —                                             |
| deletedAt   | DateTime? | —                  | —                                             |
| createdAt   | DateTime  | default now        | —                                             |
| updatedAt   | DateTime  | @updatedAt          | —                                             |

**Indexes:** `@@index([userId])`, `@@index([entityType, entityId])`, `@@index([isDeleted])`

---

### 3.11 Invoice

Confirmed invoice record after OCR approval. Also created as a pending record during OCR upload.

| Field           | Type          | Constraints         | Notes                              |
| --------------- | ------------- | ------------------- | ---------------------------------- |
| id              | String        | PK, cuid            | —                                  |
| invoiceNumber   | String?       | —                   | —                                  |
| vendor          | String?       | —                   | —                                  |
| invoiceDate     | DateTime?     | —                   | —                                  |
| totalAmount     | Decimal?      | @db.Decimal(12, 2)  | —                                  |
| filePath        | String?       | —                   | Stored file location               |
| status          | InvoiceStatus | default PENDING      | PENDING → CONFIRMED / REJECTED     |
| ocrExtractionId | String?       | unique              | Links to OcrExtraction             |
| isDeleted       | Boolean       | default false        | —                                  |
| deletedAt       | DateTime?     | —                   | —                                  |
| createdAt       | DateTime      | default now         | —                                  |
| updatedAt       | DateTime      | @updatedAt          | —                                  |

**Indexes:** `@@index([isDeleted])`
**Relations:** 1→0..1 OcrExtraction, 1→N Asset (via `Asset.invoiceId` FK)

---

### 3.12 OcrExtraction

Stores raw GPT response + confirmed data for audit and re-editing.

| Field         | Type     | Constraints   | Notes                       |
| ------------- | -------- | ------------ | --------------------------- |
| id            | String   | PK, cuid     | —                           |
| rawResponse   | Json     | not null     | GPT-4o-mini raw output      |
| extractedData | Json     | not null     | Normalized extracted fields |
| confidence    | Float    | 0.0–1.0      | Overall confidence score     |
| confirmed     | Boolean  | default false | Admin has approved          |
| createdAt     | DateTime | default now  | —                           |
| updatedAt     | DateTime | @updatedAt   | —                           |
| isDeleted     | Boolean  | default false | —                          |
| deletedAt     | DateTime?| —            | —                           |

---

### 3.13 AssetAttributeValue

Stores dynamic custom-field values per asset as JSONB.

| Field     | Type     | Constraints         | Notes                     |
| --------- | -------- | ------------------ | ------------------------- |
| id        | String   | PK, cuid           | —                         |
| assetId   | String   | unique, FK → Asset  | 1:1 with Asset            |
| values    | Json     | default {}         | `Record<string, unknown>` |
| createdAt | DateTime | default now        | —                         |
| updatedAt | DateTime | @updatedAt         | —                         |

**Indexes:** `@@index([assetId])`
**Validation:** Schema enforced by `AttributeDefinition` + Zod validators in service layer.

---

### 3.14 AttributeDefinition

Defines custom fields scoped to a category.

| Field       | Type                 | Constraints            | Notes                                   |
| ----------- | -------------------- | ---------------------- | --------------------------------------- |
| id          | String               | PK, cuid               | —                                       |
| name        | String               | —                      | Field key name                          |
| description | String?              | —                      | —                                       |
| fieldType   | AttributeFieldType    | not null               | TEXT / NUMBER / BOOLEAN / DATE / SELECT |
| categoryId  | String?              | FK → Category, cascade | Null = global field                     |
| required    | Boolean              | default false          | —                                       |
| options     | String?              | —                      | JSON array for SELECT type              |
| validation  | Json?                | —                      | Min/max/length rules                    |
| order       | Int                  | default 0              | Display order                           |
| isDeleted   | Boolean              | default false          | —                                       |
| deletedAt   | DateTime?            | —                      | —                                       |
| createdAt   | DateTime             | default now            | —                                       |
| updatedAt   | DateTime             | @updatedAt             | —                                       |

**Indexes:** `@@unique([categoryId, name])`, `@@index([isDeleted])`

---

## 4. Enum Reference

| Enum                   | Values                                                                                                                                                   | Used By                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **AssetStatus**        | `AVAILABLE` · `ASSIGNED` · `MAINTENANCE` · `RETIRED` · `DISPOSED`                                                                             | Asset.status, AssetEvent.fromStatus/toStatus |
| **AssetEventType**     | `CREATED` · `STATUS_CHANGE` · `ASSIGNED` · `RECALLED` · `MAINTENANCE_CREATED` · `MAINTENANCE_COMPLETED` · `ATTRIBUTE_UPDATED` · `DISPOSED` · `RESTORED` | AssetEvent.eventType                         |
| **MaintenanceType**    | `PREVENTIVE` · `CORRECTIVE` · `UPGRADE`                                                                                                                | Maintenance.type                             |
| **MaintenanceStatus**  | `SCHEDULED` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`                                                                                                | Maintenance.status                           |
| **InvoiceStatus**      | `PENDING` · `CONFIRMED` · `REJECTED`                                                                                                                     | Invoice.status                               |
| **AttributeFieldType** | `TEXT` · `NUMBER` · `BOOLEAN` · `DATE` · `SELECT`                                                                                                       | AttributeDefinition.fieldType                |

---

## 5. Design Patterns

### 5.1 Soft Delete

All core tables (User, Session, Account, Verification, Employee, Category, Asset, AssetEvent, Maintenance, AuditLog, Invoice, OcrExtraction, AttributeDefinition) include:

```prisma
isDeleted  Boolean   @default(false)
deletedAt DateTime?
```

Every Prisma query filter includes `where: { isDeleted: false }`. `OcrExtraction` and `AssetAttributeValue` intentionally omit soft-delete fields (short-lived, low-risk).

### 5.2 Dual Audit Logging

Every asset mutation writes two records atomically inside a `prisma.$transaction`:

1. **AssetEvent** — append-only lifecycle log: `eventType`, `fromStatus`, `toStatus`, `description`, `performedBy`. Exposes asset history timeline.
2. **AuditLog** — system-wide audit: `userId`, `action`, `entityType`, `entityId`, `ipAddress`, `userAgent`, `metadata`. Exposes who-did-what system-wide.

Flow:

```
API route → service method → logAssetEvent({ assetId, eventType, ... })
         → prisma.$transaction([ INSERT AssetEvent, INSERT AuditLog ])
```

`logAssetEvent()` in `lib/audit-logger.ts` reads request context from a module-level variable (set by `setAuditContext()` in `lib/audit.ts`). `setAuditContext()` is defined but NOT currently used in route handlers — `performedBy` is passed directly instead.

### 5.3 FSM State Machine

`lib/fsm.ts` implements a custom finite state machine for `Asset.status`. No external library (xstate not used).

```
AVAILABLE ──assign──▶ ASSIGNED ──maintenance──▶ MAINTENANCE
                                             ◀──complete───┘

ASSIGNED ──retire──▶ RETIRED ──dispose──▶ DISPOSED
                                        ◀──restore───┘

ASSIGNED ──recall──▶ AVAILABLE
```

- `validateTransition(from, to)` throws `Error` if not in `ASSET_TRANSITIONS` list
- Service layer calls FSM validate → Prisma write in sequence
- `getAvailableTransitions(status)` returns valid next states (used in UI to disable invalid actions)
- `STATUS_CONFIG` maps status → colors for UI badges

### 5.4 Dynamic Attributes (JSONB)

Each `Category` can define custom fields via `AttributeDefinition`. Each `Asset` stores its values in `AssetAttributeValue.values` (JSONB):

```jsonc
// AttributeDefinition for "Laptop" category
{ "name": "screen_size", "fieldType": "NUMBER", "required": true, "validation": { "min": 10, "max": 20 } }
{ "name": "os", "fieldType": "SELECT", "options": ["Windows", "macOS", "Linux"] }

// AssetAttributeValue.values on a specific laptop asset
{ "screen_size": 15.6, "os": "macOS" }
```

Validation against `AttributeDefinition` schema is done in the service layer with Zod before writing.

### 5.5 Decimal Precision

Monetary fields use PostgreSQL `DECIMAL(12, 2)` enforced at DB level:

| Field         | Model       | Precision      |
| ------------- | ----------- | -------------- |
| purchasePrice | Asset       | DECIMAL(12, 2) |
| cost          | Maintenance | DECIMAL(12, 2) |
| totalAmount   | Invoice     | DECIMAL(12, 2) |

---

## 6. Indexes & Performance

### Explicit Indexes

| Model                | Index                             | Purpose                   |
| -------------------- | --------------------------------- | ------------------------- |
| User                 | `@@index([isDeleted])`            | Filter active users       |
| Session              | `@@index([userId])`               | Session lookup by user    |
| Account              | `@@index([userId])`               | OAuth account lookup      |
| Employee             | `@@index([isDeleted])`            | Filter active employees   |
| Category             | `@@index([isDeleted])`            | Filter active categories  |
| Asset                | `@@index([isDeleted])`            | Default list filter       |
| Asset                | `@@index([status])`               | Status dashboard queries  |
| AssetEvent           | `@@index([assetId, createdAt])`   | Timeline retrieval         |
| Maintenance          | `@@index([isDeleted])`            | —                         |
| Maintenance          | `@@index([assetId])`              | Asset maintenance history |
| AuditLog             | `@@index([userId])`               | User activity lookup      |
| AuditLog             | `@@index([entityType, entityId])` | Entity audit trail        |
| AuditLog             | `@@index([isDeleted])`            | —                         |
| Invoice              | `@@index([isDeleted])`            | —                         |
| AssetAttributeValue  | `@@index([assetId])`              | Per-asset attrs lookup    |
| AttributeDefinition  | `@@unique([categoryId, name])`    | Prevent duplicate attrs   |
| AttributeDefinition  | `@@index([isDeleted])`            | —                         |

### Query Optimization Notes

- **Soft delete filter** on all core model reads — `isDeleted = false` is always applied.
- **JSONB fields** (`values` in AssetAttributeValue, `metadata` in AuditLog/AssetEvent, `rawResponse`/`extractedData` in OcrExtraction) are PostgreSQL JSONB — enable GIN indexing if ad-hoc key queries are needed in future.
- **Decimal fields** — avoid casting to Float in application code; use Prisma's `Decimal` type or `toFixed()` for display.
- **Session table** — Better Auth manages this; high-frequency reads (every request). Keep it narrow.
- **AssetEvent** — append-only, no update path needed. `createdAt` index sufficient for timeline ordering.

---

## 7. Migration History

| Migration                                    | Timestamp            | Scope                                                                                                                                     |
| -------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `init`                                        | 2026-03-24           | Full schema: User, Session, Account, Verification, Employee, Category, Asset, AssetEvent, Maintenance, AuditLog, Invoice, OcrExtraction + all enums |
| `add_asset_attribute_values`                  | 2026-03-24           | Adds `AssetAttributeValue` + `AttributeDefinition` tables (Phase 2 dynamic attrs)                                                        |
| `add_invoice_assets_relation`                 | 2026-03-26           | Adds `Asset.invoiceId` FK + `Invoice.assets[]` relation for procurement traceability                                                        |

---

## 8. Related Files

### Service Layer

| Service                                 | Responsibility                                  |
| --------------------------------------- | ---------------------------------------------- |
| `lib/services/asset-service.ts`          | Asset CRUD, FSM transitions, dual audit logging |
| `lib/services/asset-qr-service.ts`      | QR-specific business logic                      |

### Utilities & Validators

| File                                  | Responsibility                                                            |
| ------------------------------------- | ------------------------------------------------------------------------- |
| `lib/fsm.ts`                          | FSM transition table, `validateTransition()`, `getAvailableTransitions()`, `STATUS_CONFIG` |
| `lib/audit-logger.ts`                  | `logAssetEvent()` — atomic AssetEvent + AuditLog write                    |
| `lib/audit.ts`                        | `setAuditContext()`, `clearAuditContext()` — request-scoped context (defined, not used in routes) |
| `lib/validators/asset.ts`              | Zod schemas: `createAssetSchema`, `changeStatusSchema`                    |
| `lib/validators/dynamic-attrs.ts`      | Zod schemas for dynamic attribute validation                              |
| `lib/qr-generator.ts`                  | QR code generation from asset ID                                          |
| `lib/ocr.ts`                          | GPT-4o-mini invoice extraction                                            |

### API Routes

| Route                                              | Operation                              |
| -------------------------------------------------- | -------------------------------------- |
| `app/api/assets/route.ts`                          | GET list, POST create                  |
| `app/api/assets/[id]/route.ts`                    | GET, PUT, DELETE                      |
| `app/api/assets/[id]/assign/route.ts`             | POST assign                            |
| `app/api/assets/[id]/recall/route.ts`              | POST recall                            |
| `app/api/assets/[id]/events/route.ts`              | GET lifecycle events                   |
| `app/api/assets/[id]/maintenance/route.ts`         | GET/POST maintenance                   |
| `app/api/assets/[id]/qr/route.ts`                  | GET download QR PNG                    |
| `app/api/assets/[id]/lookup/route.ts`              | GET public asset info (no auth, rate-limited) |
| `app/api/categories/route.ts`                      | GET/POST categories                   |
| `app/api/categories/[id]/route.ts`                 | GET/PUT/DELETE category               |
| `app/api/categories/[id]/attributes/route.ts`       | GET/POST attribute definitions         |
| `app/api/attributes/definitions/route.ts`           | GET/POST all attribute definitions     |
| `app/api/attributes/definitions/[id]/route.ts`      | GET/PUT/DELETE single definition        |
| `app/api/employees/route.ts`                        | GET/POST employees                    |
| `app/api/maintenance/route.ts`                      | GET/POST all maintenance records        |
| `app/api/maintenance/[id]/route.ts`                | GET/PUT/DELETE single record           |
| `app/api/invoices/route.ts`                        | GET all, POST create (manual)           |
| `app/api/invoices/ocr/route.ts`                    | POST upload + OCR extraction (Phase 2) |
| `app/api/invoices/[id]/route.ts`                    | GET/PATCH/DELETE invoice               |
| `app/api/invoices/[id]/confirm/route.ts`            | POST confirm OCR → create assets       |
| `app/api/audit-logs/route.ts`                       | GET audit logs                        |
| `app/api/dashboard/route.ts`                        | GET KPI aggregates                    |

---

_Unresolved: GIN index on JSONB fields if ad-hoc key queries needed_
_Unresolved: Prisma middleware for automatic audit log inference (currently explicit `logAssetEvent()` calls)_
