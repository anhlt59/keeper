/**
 * Manual event logger for lifecycle actions (assign, recall, maintenance).
 * Creates both an AssetEvent (timeline) and an AuditLog entry atomically.
 */
import { prisma } from "@/lib/db";
import { AssetEventType, AssetStatus, Prisma } from "@prisma/client";

interface AssetEventLogParams {
  assetId: string;
  eventType: AssetEventType;
  fromStatus?: AssetStatus;
  toStatus?: AssetStatus;
  description?: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
}

interface AuditLogParams {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a lifecycle event: creates AssetEvent + AuditLog atomically.
 */
export async function logAssetEvent(
  params: AssetEventLogParams,
  audit?: AuditLogParams
) {
  const { assetId, eventType, fromStatus, toStatus, description, performedBy, metadata } = params;
  const jsonMeta: Prisma.InputJsonValue | undefined = metadata as Prisma.InputJsonValue | undefined;

  const [event] = await prisma.$transaction([
    prisma.assetEvent.create({
      data: {
        assetId,
        eventType,
        fromStatus,
        toStatus,
        description,
        performedBy: performedBy ?? "system",
        metadata: jsonMeta,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: audit?.userId ?? null,
        action: eventType,
        entityType: "Asset",
        entityId: assetId,
        description: description ?? `${eventType} on asset ${assetId}`,
        ipAddress: audit?.ipAddress ?? null,
        userAgent: audit?.userAgent ?? null,
        metadata: jsonMeta,
      },
    }),
  ]);

  return event;
}
