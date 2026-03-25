import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalAssets,
    totalValueResult,
    byStatus,
    byCategory,
    maintenanceCostMTD,
    totalMaintenanceCost,
    recentEvents,
  ] = await Promise.all([
    // Total active assets
    prisma.asset.count({ where: { isDeleted: false } }),

    // Total value (sum of purchasePrice)
    prisma.asset.aggregate({
      where: { isDeleted: false, purchasePrice: { not: null } },
      _sum: { purchasePrice: true },
    }),

    // Count by status
    prisma.asset.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { status: true },
    }),

    // Count by category
    prisma.asset.groupBy({
      by: ["categoryId"],
      where: { isDeleted: false },
      _count: { categoryId: true },
    }),

    // Maintenance cost MTD
    prisma.maintenance.aggregate({
      where: {
        isDeleted: false,
        status: "COMPLETED",
        endDate: { gte: startOfMonth },
        cost: { not: null },
      },
      _sum: { cost: true },
    }),

    // Total maintenance cost (all time)
    prisma.maintenance.aggregate({
      where: {
        isDeleted: false,
        cost: { not: null },
      },
      _sum: { cost: true },
    }),

    // Recent 10 events
    prisma.assetEvent.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      where: { isDeleted: false },
      include: { asset: { select: { id: true, name: true, code: true } } },
    }),
  ]);

  // Resolve category names
  const categoryIds = byCategory.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return NextResponse.json({
    totalAssets,
    totalValue: totalValueResult._sum.purchasePrice ?? 0,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
    byCategory: byCategory.map((c) => ({
      categoryId: c.categoryId,
      categoryName: categoryMap[c.categoryId] ?? "Unknown",
      count: c._count.categoryId,
    })),
    maintenanceCostMTD: maintenanceCostMTD._sum.cost ?? 0,
    totalMaintenanceCost: totalMaintenanceCost._sum.cost ?? 0,
    recentEvents,
  });
}
