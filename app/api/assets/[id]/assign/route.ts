import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateTransition } from "@/lib/fsm";
import { assignAssetSchema } from "@/lib/validators/asset";
import { AssetEventType, AssetStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = assignAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  // Only allow assignment from PURCHASED or IN_USE (reassign)
  const validFromStatuses: AssetStatus[] = [AssetStatus.PURCHASED, AssetStatus.IN_USE];
  if (!validFromStatuses.includes(asset.status)) {
    return NextResponse.json(
      { error: `Cannot assign asset in '${asset.status}' status. Must be PURCHASED or IN_USE.` },
      { status: 400 }
    );
  }

  validateTransition(asset.status, AssetStatus.ASSIGNED);

  const [updated] = await prisma.$transaction([
    prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.ASSIGNED,
        assignedTo: parsed.data.assignedTo,
        assignedDate: new Date(),
      },
      include: { category: true },
    }),
    prisma.assetEvent.create({
      data: {
        assetId: id,
        eventType: AssetEventType.ASSIGNED,
        fromStatus: asset.status,
        toStatus: AssetStatus.ASSIGNED,
        description: parsed.data.description ?? `Assigned to ${parsed.data.assignedTo}`,
        performedBy: session.user.id,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
