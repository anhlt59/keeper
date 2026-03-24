/**
 * Central asset business logic service.
 * All asset mutations go through here for consistency.
 */
import { prisma } from "@/lib/db";
import { AssetEventType, AssetStatus, Prisma } from "@prisma/client";
import { validateTransition } from "@/lib/fsm";
import { logAssetEvent } from "@/lib/audit-logger";
import type { CreateAssetInput, UpdateAssetInput, ListAssetsInput } from "@/lib/validators/asset";

function generateAssetCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASSET-${date}-${rand}`;
}

export async function createAsset(
  data: CreateAssetInput,
  performedBy = "system"
) {
  const code = data.code ?? generateAssetCode();

  const asset = await prisma.asset.create({
    data: {
      code,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      status: data.status ?? AssetStatus.PURCHASED,
      assignedTo: data.assignedTo,
      assignedDate: data.assignedDate ? new Date(data.assignedDate) : undefined,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
      purchasePrice: data.purchasePrice ? new Prisma.Decimal(data.purchasePrice) : undefined,
      vendor: data.vendor,
      warrantyMonths: data.warrantyMonths,
      nextMaintenanceDate: data.nextMaintenanceDate
        ? new Date(data.nextMaintenanceDate)
        : undefined,
    },
    include: { category: true },
  });

  await logAssetEvent({
    assetId: asset.id,
    eventType: AssetEventType.CREATED,
    toStatus: asset.status,
    description: `Asset '${asset.name}' (${asset.code}) created`,
    performedBy,
  });

  return asset;
}

export async function updateAsset(
  id: string,
  data: UpdateAssetInput,
  performedBy = "system"
) {
  const asset = await prisma.asset.findFirst({
    where: { id, isDeleted: false },
    include: { category: true },
  });
  if (!asset) throw new Error("Asset not found");

  const previousStatus = asset.status;

  const updateData: Prisma.AssetUpdateInput = {
    name: data.name,
    description: data.description,
    ...(data.categoryId && { category: { connect: { id: data.categoryId } } }),
    assignedTo: data.assignedTo,
    assignedDate: data.assignedDate ? new Date(data.assignedDate) : undefined,
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    purchasePrice: data.purchasePrice !== undefined
      ? new Prisma.Decimal(data.purchasePrice)
      : undefined,
    vendor: data.vendor,
    warrantyMonths: data.warrantyMonths,
    nextMaintenanceDate: data.nextMaintenanceDate
      ? new Date(data.nextMaintenanceDate)
      : undefined,
  };

  const updated = await prisma.asset.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  // FSM: if status changed, validate and log
  if (data.status && data.status !== previousStatus) {
    const transition = validateTransition(previousStatus, data.status);
    await prisma.asset.update({ where: { id }, data: { status: data.status } });
    await logAssetEvent({
      assetId: id,
      eventType: transition.eventType,
      fromStatus: previousStatus,
      toStatus: data.status,
      description: `Status changed: ${previousStatus} → ${data.status}`,
      performedBy,
    });
    // Return fresh asset with new status
    return prisma.asset.findUnique({ where: { id }, include: { category: true } });
  }

  return updated;
}

export async function softDeleteAsset(id: string, performedBy = "system") {
  const asset = await prisma.asset.findFirst({
    where: { id, isDeleted: false },
  });
  if (!asset) throw new Error("Asset not found");
  if (asset.status !== AssetStatus.DISPOSED) {
    throw new Error("Only disposed assets can be deleted");
  }

  const deleted = await prisma.asset.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  await logAssetEvent({
    assetId: id,
    eventType: AssetEventType.DISPOSED,
    fromStatus: asset.status,
    description: `Asset '${asset.name}' soft-deleted`,
    performedBy,
  });

  return deleted;
}

export async function getAsset(id: string) {
  return prisma.asset.findFirst({
    where: { id, isDeleted: false },
    include: {
      category: true,
      events: { orderBy: { createdAt: "desc" }, take: 50 },
      maintenanceRecords: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function listAssets(params: ListAssetsInput) {
  const { page, pageSize, search, categoryId, status, sortBy, sortDir } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.AssetWhereInput = {
    isDeleted: false,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(status && { status }),
  };

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { category: true },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
