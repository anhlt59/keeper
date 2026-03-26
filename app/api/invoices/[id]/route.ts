import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, isDeleted: false },
    include: {
      ocrExtraction: true,
      assets: { where: { isDeleted: false }, select: { id: true, code: true, name: true } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const invoice = await prisma.invoice.findFirst({ where: { id, isDeleted: false } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: body.status ?? invoice.status,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { id, isDeleted: false } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.asset.updateMany({
      where: { invoiceId: id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    }),
    prisma.invoice.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true });
}
