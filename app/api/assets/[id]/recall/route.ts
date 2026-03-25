import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateTransition } from "@/lib/fsm";
import { recallAssetSchema } from "@/lib/validators/asset";
import { AssetEventType, AssetStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = recallAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const asset = await prisma.asset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const recallableStatuses: AssetStatus[] = [AssetStatus.ASSIGNED, AssetStatus.IN_USE];
  if (!recallableStatuses.includes(asset.status)) {
    return NextResponse.json(
      { error: `Cannot recall asset in '${asset.status}' status. Must be ASSIGNED or IN_USE.` },
      { status: 400 }
    );
  }

  validateTransition(asset.status, AssetStatus.PURCHASED);

  const [updated] = await prisma.$transaction([
    prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.PURCHASED,
        employeeId: null,
        assignedTo: null,
        assignedDate: null,
      },
      include: { category: true },
    }),
    prisma.assetEvent.create({
      data: {
        assetId: id,
        eventType: AssetEventType.RECALLED,
        fromStatus: asset.status,
        toStatus: AssetStatus.PURCHASED,
        description: parsed.data.description ?? "Asset recalled (unassigned)",
        performedBy: session.user.id,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
