import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { confirmInvoiceSchema } from "@/lib/validators/invoice";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = confirmInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id, isDeleted: false },
    include: { ocrExtraction: true },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "CONFIRMED") {
    return NextResponse.json({ error: "Invoice already confirmed" }, { status: 409 });
  }

  const data = parsed.data;
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      invoiceNumber: data.invoiceNumber ?? invoice.invoiceNumber,
      vendor: data.vendor ?? invoice.vendor,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : invoice.invoiceDate,
      totalAmount: data.totalAmount ? new Prisma.Decimal(data.totalAmount) : invoice.totalAmount,
      status: "CONFIRMED",
    },
  });

  // Mark OCR extraction as confirmed
  if (invoice.ocrExtractionId) {
    await prisma.ocrExtraction.update({
      where: { id: invoice.ocrExtractionId },
      data: { confirmed: true },
    });
  }

  return NextResponse.json(updated);
}
