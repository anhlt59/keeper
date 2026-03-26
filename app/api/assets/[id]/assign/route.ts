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

  // Only allow assignment from AVAILABLE or ASSIGNED (reassign)
  const validFromStatuses: AssetStatus[] = [AssetStatus.AVAILABLE, AssetStatus.ASSIGNED];
  if (!validFromStatuses.includes(asset.status)) {
    return NextResponse.json(
      { error: `Cannot assign asset in '${asset.status}' status. Must be AVAILABLE or ASSIGNED.` },
      { status: 400 }
    );
  }

  // Skip FSM validation for same-status reassign
  if (asset.status !== AssetStatus.ASSIGNED) {
    validateTransition(asset.status, AssetStatus.ASSIGNED);
  }

  // Look up employee to get name
  const employee = await prisma.employee.findFirst({
    where: { id: parsed.data.employeeId, isDeleted: false },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.ASSIGNED,
        employeeId: employee.id,
        assignedTo: employee.name,
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
        description: parsed.data.description ?? `Assigned to ${employee.name}`,
        performedBy: session.user.id,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
