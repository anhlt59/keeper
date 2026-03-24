import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify asset exists
  const asset = await prisma.asset.findFirst({ where: { id, isDeleted: false } });
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const events = await prisma.assetEvent.findMany({
    where: { assetId: id, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}
