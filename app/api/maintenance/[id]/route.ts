import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { completeMaintenanceSchema } from "@/lib/validators/maintenance";
import { AssetEventType, AssetStatus, MaintenanceStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = completeMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.maintenance.findFirst({
    where: { id, isDeleted: false },
    include: { asset: true },
  });
  if (!record) return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });

  if (record.status === MaintenanceStatus.COMPLETED) {
    return NextResponse.json({ error: "Maintenance already completed" }, { status: 409 });
  }

  const [updated] = await prisma.$transaction([
    prisma.maintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        endDate: new Date(parsed.data.endDate),
        cost: parsed.data.cost !== undefined ? new Prisma.Decimal(parsed.data.cost) : undefined,
        notes: parsed.data.notes ?? record.notes,
      },
    }),
    prisma.asset.update({
      where: { id: record.assetId },
      data: { status: AssetStatus.IN_USE },
    }),
    prisma.assetEvent.create({
      data: {
        assetId: record.assetId,
        eventType: AssetEventType.MAINTENANCE_COMPLETED,
        fromStatus: AssetStatus.MAINTENANCE,
        toStatus: AssetStatus.IN_USE,
        description: `Maintenance completed${parsed.data.notes ? `: ${parsed.data.notes}` : ""}`,
        performedBy: session.user.id,
      },
    }),
  ]);

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const record = await prisma.maintenance.findFirst({
    where: { id, isDeleted: false },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.maintenance.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
