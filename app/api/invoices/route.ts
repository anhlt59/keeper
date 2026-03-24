import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createInvoiceSchema } from "@/lib/validators/invoice";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "20"), 100);
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { isDeleted: false },
      include: {
        ocrExtraction: { select: { confidence: true, confirmed: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.invoice.count({ where: { isDeleted: false } }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: data.invoiceNumber,
      vendor: data.vendor,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
      totalAmount: data.totalAmount ? new Prisma.Decimal(data.totalAmount) : null,
      filePath: data.filePath,
      status: "CONFIRMED",
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
