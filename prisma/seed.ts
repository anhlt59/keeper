import { PrismaClient, AssetStatus, MaintenanceType, MaintenanceStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import path from "path";

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

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user with Better Auth account
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
  // Create credential account for the admin user
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
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Laptop" },
      update: {},
      create: { name: "Laptop", description: "Laptop computers" },
    }),
    prisma.category.upsert({
      where: { name: "Monitor" },
      update: {},
      create: { name: "Monitor", description: "External monitors" },
    }),
    prisma.category.upsert({
      where: { name: "Keyboard & Mouse" },
      update: {},
      create: { name: "Keyboard & Mouse", description: "Input devices" },
    }),
    prisma.category.upsert({
      where: { name: "Office Furniture" },
      update: {},
      create: { name: "Office Furniture", description: "Desks, chairs, etc." },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Create employees
  const employeeData = [
    { name: "Nguyen Van A", email: "a.nguyen@zoo.local", department: "Engineering", position: "Developer" },
    { name: "Tran Thi B", email: "b.tran@zoo.local", department: "Design", position: "UI Designer" },
    { name: "Le Van C", email: "c.le@zoo.local", department: "Engineering", position: "Developer" },
    { name: "Pham Van D", email: "d.pham@zoo.local", department: "Operations", position: "IT Support" },
  ];
  // Delete existing employees first (seed is idempotent via reset)
  await prisma.employee.deleteMany();
  const employees = [];
  for (const emp of employeeData) {
    const employee = await prisma.employee.create({ data: emp });
    employees.push(employee);
  }
  console.log(`✅ Created ${employees.length} employees`);

  // Create sample assets
  const assets = [
    {
      code: "ASSET-001",
      name: "MacBook Pro 14\" M3",
      categoryId: categories[0].id,
      status: AssetStatus.IN_USE,
      employeeId: employees[0].id,
      assignedTo: "Nguyen Van A",
      purchaseDate: new Date("2024-01-15"),
      purchasePrice: 34990000,
      vendor: "Apple Store VN",
      warrantyMonths: 24,
    },
    {
      code: "ASSET-002",
      name: "Dell UltraSharp 27\"",
      categoryId: categories[1].id,
      status: AssetStatus.ASSIGNED,
      employeeId: employees[1].id,
      assignedTo: "Tran Thi B",
      purchaseDate: new Date("2024-03-01"),
      purchasePrice: 12500000,
      vendor: "Dell VN",
      warrantyMonths: 36,
    },
    {
      code: "ASSET-003",
      name: "Logitech MX Keys + MX Master 3",
      categoryId: categories[2].id,
      status: AssetStatus.IN_USE,
      employeeId: employees[2].id,
      assignedTo: "Le Van C",
      purchaseDate: new Date("2024-02-20"),
      purchasePrice: 4500000,
      vendor: "Logitech VN",
      warrantyMonths: 12,
    },
    {
      code: "ASSET-004",
      name: "Herman Miller Aeron",
      categoryId: categories[3].id,
      status: AssetStatus.PURCHASED,
      purchaseDate: new Date("2024-06-01"),
      purchasePrice: 45000000,
      vendor: "Herman Miller APAC",
      warrantyMonths: 120,
    },
    {
      code: "ASSET-005",
      name: "ThinkPad X1 Carbon Gen 11",
      categoryId: categories[0].id,
      status: AssetStatus.MAINTENANCE,
      employeeId: employees[3].id,
      assignedTo: "Pham Van D",
      purchaseDate: new Date("2023-11-10"),
      purchasePrice: 28900000,
      vendor: "Lenovo VN",
      warrantyMonths: 36,
    },
  ];

  for (const assetData of assets) {
    const asset = await prisma.asset.upsert({
      where: { code: assetData.code },
      update: {},
      create: assetData,
    });
    console.log(`✅ Created asset: ${asset.code} — ${asset.name}`);

    // Create lifecycle event
    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: "CREATED",
        description: "Initial asset creation",
        performedBy: "seed",
      },
    });
  }

  // Create a maintenance record
  const laptopAsset = await prisma.asset.findUnique({ where: { code: "ASSET-005" } });
  if (laptopAsset) {
    await prisma.maintenance.create({
      data: {
        assetId: laptopAsset.id,
        type: MaintenanceType.CORRECTIVE,
        description: "Keyboard replacement — some keys not working",
        startDate: new Date("2024-12-01"),
        status: MaintenanceStatus.IN_PROGRESS,
        performedBy: "IT Support",
      },
    });
    console.log("✅ Created maintenance record for ASSET-005");
  }

  // Seed completed maintenance records for last 6 months (for cost chart)
  const allAssets = await prisma.asset.findMany({ where: { isDeleted: false }, select: { id: true } });
  const maintenanceSeeds = [
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
  for (const m of maintenanceSeeds) {
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
  console.log(`✅ Created ${maintenanceSeeds.length} maintenance cost records (last 6 months)`);

  console.log("\n🎉 Seeding complete!");
  console.log("   Login: admin@zoo.local / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
