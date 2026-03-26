import { PrismaClient, AssetStatus, MaintenanceType, MaintenanceStatus, AssetEventType, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import path from "path";
import fs from "fs";

// Load .env first, then .env.local as override (must be before any process.env access)
config();
config({ path: path.resolve(__dirname, "..", ".env.local") });

function buildPoolConfig() {
  const url = new URL(process.env.DATABASE_URL!);
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
  };
}

const pool = new Pool(buildPoolConfig());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// ─── CSV Helper ──────────────────────────────────────────────────────────────

/**
 * Parse a UTF-8 CSV file into an array of record objects.
 * Strips BOM if present on the first header field.
 * Values containing commas are not supported (no quoted-string handling).
 */
function readCSV(filename: string): Record<string, string>[] {
  const filePath = path.resolve(__dirname, "data", filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  // Parse headers — strip BOM if present
  const rawHeaders = lines[0].split(",");
  const headers = rawHeaders.map((h) => {
    const trimmed = h.trim();
    return trimmed.charCodeAt(0) === 0xfeff ? trimmed.slice(1) : trimmed;
  });

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (values[i] || "").trim();
    });
    return record;
  });
}

// ─── Seed Loaders ────────────────────────────────────────────────────────────

async function seedAdmin() {
  const hashedPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@zoo.local" },
    update: {},
    create: {
      email: "admin@zoo.local",
      name: "Admin User",
      emailVerified: true,
    },
  });
  await prisma.account.upsert({
    where: { id: `credential-${admin.id}` },
    update: { password: hashedPassword },
    create: {
      id: `credential-${admin.id}`,
      userId: admin.id,
      accountId: admin.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });
  console.log(`✅ Admin user: ${admin.email} / admin123`);
}

async function seedCategories(): Promise<Record<string, string>> {
  // name → id map for linking children
  const categoryMap: Record<string, string> = {};
  const rows = readCSV("categories.csv");

  // Pass 1: root categories (no parent)
  const rootRows = rows.filter((r) => !r.parent);
  for (const row of rootRows) {
    const cat = await prisma.category.upsert({
      where: { name: row.name },
      update: { description: row.description },
      create: { name: row.name, description: row.description },
    });
    categoryMap[cat.name] = cat.id;
  }

  // Pass 2: child categories (has parent)
  const childRows = rows.filter((r) => r.parent);
  for (const row of childRows) {
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

  console.log(`✅ Upserted ${rows.length} categories from CSV`);
  return categoryMap;
}

async function seedEmployees(): Promise<void> {
  const rows = readCSV("employees.csv");
  // Reset for clean re-seed
  await prisma.employee.deleteMany();
  await prisma.employee.createMany({
    data: rows
      .filter((r) => r.name)
      .map((r) => ({
        name: r.name,
        email: r.email,
        department: r.department,
        position: r.position,
      })),
  });
  console.log(`✅ Seeded ${rows.length} employees from CSV`);
}

async function seedAssets(categoryMap: Record<string, string>): Promise<string[]> {
  const rows = readCSV("products.csv");
  const createdCodes: string[] = [];

  for (const row of rows) {
    if (!row.code || !row.name) continue;
    const categoryId = categoryMap[row.category];
    if (!categoryId) {
      console.warn(`⚠️  Category "${row.category}" not found for asset "${row.code}" — skipping`);
      continue;
    }

    const purchasePrice = row.price ? new Prisma.Decimal(Number(row.price)) : null;
    const purchaseDate = row.created_at ? new Date(row.created_at) : null;
    const warrantyMonths = row.warranty_months ? Number(row.warranty_months) : null;

    const asset = await prisma.asset.upsert({
      where: { code: row.code },
      update: {
        name: row.name,
        description: row.description,
        categoryId,
        status: AssetStatus.AVAILABLE,
        employeeId: null,
        assignedTo: null,
        assignedDate: null,
        purchasePrice,
        purchaseDate,
        vendor: row.vendor || null,
        warrantyMonths,
      },
      create: {
        code: row.code,
        name: row.name,
        description: row.description,
        categoryId,
        status: AssetStatus.AVAILABLE,
        purchasePrice,
        purchaseDate,
        vendor: row.vendor || null,
        warrantyMonths,
      },
    });
    createdCodes.push(asset.code);

    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: AssetEventType.CREATED,
        description: "Initial asset from product catalog seed",
        performedBy: "seed",
      },
    });
  }

  console.log(`✅ Upserted ${createdCodes.length} assets from CSV`);

  // Randomly assign 10 assets to 10 distinct employees
  const allEmployees = await prisma.employee.findMany({ where: { isDeleted: false } });
  const allAssets = await prisma.asset.findMany({ where: { isDeleted: false, status: AssetStatus.AVAILABLE } });

  const assignCount = Math.min(10, allEmployees.length, allAssets.length);
  const shuffledAssets = allAssets.sort(() => Math.random() - 0.5).slice(0, assignCount);
  const shuffledEmployees = allEmployees.sort(() => Math.random() - 0.5).slice(0, assignCount);

  for (let i = 0; i < assignCount; i++) {
    const asset = shuffledAssets[i];
    const employee = shuffledEmployees[i];
    const assignedDate = new Date();
    assignedDate.setMonth(assignedDate.getMonth() - Math.floor(Math.random() * 6)); // up to 6 months ago

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        employeeId: employee.id,
        assignedTo: employee.name,
        assignedDate,
        status: AssetStatus.ASSIGNED,
      },
    });

    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: AssetEventType.ASSIGNED,
        fromStatus: AssetStatus.AVAILABLE,
        toStatus: AssetStatus.ASSIGNED,
        description: `Assigned to ${employee.name} (${employee.department ?? "N/A"}) via seed`,
        performedBy: "seed",
      },
    });

    console.log(`  🔗 ${asset.code} → ${employee.name} (${employee.department ?? "N/A"})`);
  }
  console.log(`✅ Randomly assigned ${assignCount} assets to employees`);

  // Set 3 assets to MAINTENANCE status
  const availableForMaintenance = await prisma.asset.findMany({
    where: { isDeleted: false, status: AssetStatus.AVAILABLE },
    take: 3,
    orderBy: { createdAt: "asc" },
  });

  for (const asset of availableForMaintenance) {
    await prisma.asset.update({
      where: { id: asset.id },
      data: { status: AssetStatus.MAINTENANCE },
    });
    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: AssetEventType.STATUS_CHANGE,
        fromStatus: AssetStatus.AVAILABLE,
        toStatus: AssetStatus.MAINTENANCE,
        description: "Asset sent to maintenance via seed",
        performedBy: "seed",
      },
    });
    console.log(`  🔧 ${asset.code} → ${AssetStatus.MAINTENANCE}`);
  }
  if (availableForMaintenance.length > 0) {
    console.log(`✅ Set ${availableForMaintenance.length} assets to ${AssetStatus.MAINTENANCE} status`);
  }

  return createdCodes;
}

async function seedMaintenanceHistory(): Promise<void> {
  const allAssets = await prisma.asset.findMany({
    where: { isDeleted: false },
    select: { id: true },
  });
  if (allAssets.length === 0) return;

  const seeds = [
    { monthsAgo: 5, cost: 2500000, desc: "Battery replacement", type: MaintenanceType.CORRECTIVE },
    { monthsAgo: 5, cost: 800000, desc: "Screen cleaning & calibration", type: MaintenanceType.PREVENTIVE },
    { monthsAgo: 4, cost: 1200000, desc: "SSD upgrade", type: MaintenanceType.UPGRADE },
    { monthsAgo: 4, cost: 3500000, desc: "Motherboard repair", type: MaintenanceType.CORRECTIVE },
    { monthsAgo: 3, cost: 500000, desc: "Preventive dust cleaning", type: MaintenanceType.PREVENTIVE },
    { monthsAgo: 3, cost: 4200000, desc: "Display panel replacement", type: MaintenanceType.CORRECTIVE },
    { monthsAgo: 2, cost: 1800000, desc: "RAM upgrade to 32GB", type: MaintenanceType.UPGRADE },
    { monthsAgo: 2, cost: 600000, desc: "Thermal paste replacement", type: MaintenanceType.PREVENTIVE },
    { monthsAgo: 2, cost: 2200000, desc: "Keyboard mechanism repair", type: MaintenanceType.CORRECTIVE },
    { monthsAgo: 1, cost: 950000, desc: "Trackpad replacement", type: MaintenanceType.CORRECTIVE },
    { monthsAgo: 1, cost: 3800000, desc: "GPU repair", type: MaintenanceType.CORRECTIVE },
    { monthsAgo: 0, cost: 1500000, desc: "Annual preventive checkup", type: MaintenanceType.PREVENTIVE },
    { monthsAgo: 0, cost: 2700000, desc: "Power supply replacement", type: MaintenanceType.CORRECTIVE },
  ];

  const now = new Date();
  for (const m of seeds) {
    const endDate = new Date(now.getFullYear(), now.getMonth() - m.monthsAgo, 10 + Math.floor(Math.random() * 15));
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (3 + Math.floor(Math.random() * 7)));
    const assetId = allAssets[Math.floor(Math.random() * allAssets.length)].id;

    await prisma.maintenance.create({
      data: {
        assetId,
        type: m.type,
        description: m.desc,
        cost: m.cost,
        startDate,
        endDate,
        status: MaintenanceStatus.COMPLETED,
        performedBy: "IT Support",
      },
    });
  }
  console.log(`✅ Seeded ${seeds.length} historical maintenance records`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database from CSV...\n");

  await seedAdmin();
  const categoryMap = await seedCategories();
  await seedEmployees();
  await seedAssets(categoryMap);
  await seedMaintenanceHistory();

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
