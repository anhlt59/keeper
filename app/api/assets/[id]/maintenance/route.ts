import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateTransition } from "@/lib/fsm";
import { createMaintenanceSchema } from "@/lib/validators/maintenance";
import { AssetEventType, AssetStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const asset = await prisma.asset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const records = await prisma.maintenance.findMany({
    where: { assetId: id, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = createMaintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.assetId !== id) {
    return NextResponse.json({ error: "assetId mismatch" }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  // If asset not already in maintenance, transition it
  const statusChangeEvents: Parameters<typeof prisma.assetEvent.create>[0]["data"][] = [];
  let newStatus: AssetStatus | undefined;

  if (asset.status !== AssetStatus.MAINTENANCE) {
    validateTransition(asset.status, AssetStatus.MAINTENANCE);
    newStatus = AssetStatus.MAINTENANCE;
    statusChangeEvents.push({
      assetId: id,
      eventType: AssetEventType.MAINTENANCE_CREATED,
      fromStatus: asset.status,
      toStatus: AssetStatus.MAINTENANCE,
      description: `Sent to maintenance: ${parsed.data.description}`,
      performedBy: session.user.id,
    });
  }

  const record = await prisma.maintenance.create({
    data: {
      assetId: id,
      type: parsed.data.type,
      description: parsed.data.description,
      cost: parsed.data.cost !== undefined ? new Prisma.Decimal(parsed.data.cost) : undefined,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      performedBy: parsed.data.performedBy,
      notes: parsed.data.notes,
    },
  });

  if (newStatus) {
    await prisma.asset.update({ where: { id }, data: { status: newStatus } });
    await Promise.all(statusChangeEvents.map((e) => prisma.assetEvent.create({ data: e })));
  }

  return NextResponse.json(record, { status: 201 });
}
