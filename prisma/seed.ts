import { PrismaClient, AssetStatus, MaintenanceType, MaintenanceStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "path";

// Load .env.local first (must be before any process.env access)
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

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@zoo.local" },
    update: {},
    create: {
      email: "admin@zoo.local",
      name: "Admin User",
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

  // Create sample assets
  const assets = [
    {
      code: "ASSET-001",
      name: "MacBook Pro 14\" M3",
      categoryId: categories[0].id,
      status: AssetStatus.IN_USE,
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
