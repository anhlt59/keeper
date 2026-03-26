# Phase 1: Refactor seed.ts to Use CSV Data

## Overview
- **Priority:** High
- **Status:** Completed
- **Effort:** ~50 lines changed

Refactor `prisma/seed.ts` to load all category, employee, and product data from `prisma/data/*.csv` instead of inline arrays.

---

## Context

### Related Files
- `prisma/seed.ts` — main file to refactor
- `prisma/schema.prisma` — data model (Category, Employee, Asset)
- `prisma/data/categories.csv` — category seed (hierarchical)
- `prisma/data/employees.csv` — employee seed (20 rows)
- `prisma/data/products.csv` — product → asset seed (62 rows)

---

## Key Insights

### CSV Structures

**categories.csv**
```
name,description,parent,child
IT Equipment,Thiết bị CNTT,,Monitor,Laptop,PC,PC Components,Storage
Monitor,Màn hình...,IT Equipment,
...
Keyboard & Mouse,Bàn phím...,,   ← no parent, no children
```

**employees.csv**
```
name,email,department,position
Nguyễn Minh Tuấn,nguyen.minh.tuan@company.vn,Sales,Sales Director
...
```

**products.csv**
```
name,code,description,category
Màn hình LG 27UP850N-W 4K IPS 27 inch,MH-LG27UP850,Màn hình...,Monitor
...
```

### Mapping Decisions

| CSV | Prisma Model | Notes |
|-----|--------------|-------|
| `categories.csv` | `Category` | Two-pass: root cats first, then children with `parentId` |
| `employees.csv` | `Employee` | `upsert` by `email`; no `deleteMany` |
| `products.csv` | `Asset` | `upsert` by `code`; `status = PURCHASED`; `assignedTo/employeeId = null` |

### Two-Pass Category Strategy

1. **Pass 1** — create all rows where `parent` is empty → these are root/top-level categories
2. **Pass 2** — create rows where `parent` is non-empty → look up parent by name, set `parentId`

### UTF-8 BOM Strip
Vietnamese text in CSV may have BOM (`\uFEFF`). Strip first char of first field if it's BOM.

---

## Architecture

### New CSV Loader Functions

```
seed.ts
  ├── readCSV(path) → Record<string, string>[]     (parse single CSV)
  ├── loadCategories()                             (two-pass upsert)
  ├── loadEmployees()                              (upsert by email)
  ├── loadAssets(categories)                       (upsert by code, link category)
  └── main()                                       (orchestrates loaders)
```

---

## Implementation Steps

### Step 1: Add CSV helper at top of `seed.ts`

Add after imports, before `buildPoolConfig()`:

```typescript
/**
 * Parse a UTF-8 CSV file into an array of records.
 * Strips BOM if present on first row.
 */
function readCSV(filename: string): Record<string, string>[] {
  const fs = require("fs");
  const path = require("path");
  const content = fs.readFileSync(
    path.resolve(__dirname, "data", filename),
    "utf-8"
  );
  const lines = content.split("\n").filter((l: string) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h: string) => {
    const trimmed = h.trim();
    return trimmed.charCodeAt(0) === 0xfeff ? trimmed.slice(1) : trimmed;
  });

  return lines.slice(1).map((line: string) => {
    // Simple split — values with commas inside quotes need basic handling
    const values = line.split(",");
    const record: Record<string, string> = {};
    headers.forEach((h: string, i: number) => {
      record[h] = (values[i] || "").trim();
    });
    return record;
  });
}
```

### Step 2: Replace `loadCategories` section

Remove the `Promise.all([prisma.category.upsert(...), ...])` block (lines 57–79). Replace with:

```typescript
// ── Load categories from CSV (two-pass: root → children) ──────────────────
const csvCategories = readCSV("categories.csv");

// Pass 1: root categories (no parent)
const rootCats = csvCategories.filter((r) => !r.parent);
const categoryMap: Record<string, string> = {}; // name → id
for (const row of rootCats) {
  const cat = await prisma.category.upsert({
    where: { name: row.name },
    update: { description: row.description },
    create: { name: row.name, description: row.description },
  });
  categoryMap[cat.name] = cat.id;
}

// Pass 2: child categories (has parent)
const childCats = csvCategories.filter((r) => r.parent);
for (const row of childCats) {
  const parentId = categoryMap[row.parent];
  if (!parentId) {
    console.warn(`⚠️  Parent category "${row.parent}" not found for "${row.name}" — skipping`);
    continue;
  }
  const cat = await prisma.category.upsert({
    where: { name: row.name },
    update: { description: row.description, parentId },
    create: { name: row.name, description: row.description, parentId },
  });
  categoryMap[cat.name] = cat.id;
}
console.log(`✅ Upserted ${csvCategories.length} categories from CSV`);
```

### Step 3: Replace employee section

Remove `employeeData` array + `prisma.employee.deleteMany()` + loop (lines 82–95). Replace with:

```typescript
// ── Load employees from CSV ─────────────────────────────────────────────────
const csvEmployees = readCSV("employees.csv");
await prisma.employee.deleteMany(); // keep reset for clean re-seed
for (const row of csvEmployees) {
  if (!row.name) continue;
  await prisma.employee.upsert({
    where: { id: row.email }, // use email as stable id key (non-unique but deterministic)
    update: { department: row.department, position: row.position },
    create: {
      name: row.name,
      email: row.email,
      department: row.department,
      position: row.position,
    },
  });
}
console.log(`✅ Upserted ${csvEmployees.length} employees from CSV`);
```

> **Note:** `Employee` model has no `email` unique constraint — upsert uses `id` as where clause, which means it always creates new records. Fix: add `@@unique([email])` to `Employee` schema, or use a stable hash of email as id. Simpler fix: just remove `where` clause and use `create` + `connectOrCreate`, or just keep `deleteMany` + `createMany` (Prisma supports it on PostgreSQL).

**Recommended approach** — keep `deleteMany` + `createMany` since it's cleaner and faster for seed data:

```typescript
await prisma.employee.deleteMany();
await prisma.employee.createMany({
  data: csvEmployees
    .filter((r) => r.name)
    .map((r) => ({
      name: r.name,
      email: r.email,
      department: r.department,
      position: r.position,
    })),
  skipDuplicates: true,
});
```

### Step 4: Replace assets section

Remove hardcoded `assets` array + upsert loop (lines 97–176). Replace with:

```typescript
// ── Load products as assets from CSV ────────────────────────────────────────
const csvProducts = readCSV("products.csv");
const assetsCreated: string[] = [];

for (const row of csvProducts) {
  if (!row.code || !row.name) continue;
  const categoryId = categoryMap[row.category];
  if (!categoryId) {
    console.warn(`⚠️  Category "${row.category}" not found for asset "${row.code}" — skipping`);
    continue;
  }

  const asset = await prisma.asset.upsert({
    where: { code: row.code },
    update: {
      name: row.name,
      description: row.description,
      categoryId,
      status: AssetStatus.PURCHASED,
    },
    create: {
      code: row.code,
      name: row.name,
      description: row.description,
      categoryId,
      status: AssetStatus.PURCHASED,
    },
  });
  assetsCreated.push(asset.code);

  // Initial CREATED event
  await prisma.assetEvent.create({
    data: {
      assetId: asset.id,
      eventType: "CREATED",
      description: "Initial asset from product catalog seed",
      performedBy: "seed",
    },
  });
}
console.log(`✅ Upserted ${assetsCreated.length} assets from CSV`);
```

### Step 5: Fix employees reference for maintenance seed

After loading assets, `maintenanceSeeds` uses `allAssets[Math.floor(Math.random() * allAssets.length)]` — this remains unchanged. It queries `prisma.asset.findMany({ where: { isDeleted: false } })` which still works.

### Step 6: Clean up

- Remove the hardcoded `categories`, `assets`, `employeeData` arrays
- Remove `deleteMany` for employees — replaced by `deleteMany` + `createMany` in the new code
- Keep the admin user creation (unchanged)
- Keep maintenance seed (unchanged)

---

## Related Code Files

| File | Action |
|------|--------|
| `prisma/seed.ts` | Refactor (remove hardcoded data, add CSV loaders) |

---

## Todo List

- [x] Add `readCSV()` helper function
- [x] Replace category section with two-pass CSV loader
- [x] Replace employee section with CSV loader (`deleteMany` + `createMany`)
- [x] Replace asset/products section with CSV loader
- [x] Remove old hardcoded data arrays
- [x] Run `npx prisma db seed` to verify seed works

---

## Success Criteria

1. `npx prisma db seed` completes without error
2. All categories from CSV are present in DB (including parent/child hierarchy)
3. All employees from CSV are present in DB
4. All products/assets from CSV are present in DB with correct category mapping
5. Admin user still exists and can log in
6. Maintenance historical records still exist

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `createMany` fails on PostgreSQL | Low | Low | Falls back to loop+upsert if needed |
| Vietnamese chars break CSV parse | Low | Medium | BOM strip + trim handles this |
| Category parent not found | Low | Low | Warning logged, skips row |
| Product category not in DB | Low | Low | Warning logged, skips asset |

---

## Next Steps

None — single phase refactor.
