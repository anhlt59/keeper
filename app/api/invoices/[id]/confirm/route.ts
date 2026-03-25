import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AssetEventType, AssetStatus, Prisma } from "@prisma/client";
import { confirmInvoiceSchema } from "@/lib/validators/invoice";

type Params = { params: Promise<{ id: string }> };

function generateAssetCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ASSET-${date}-${rand}`;
}

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
  const performedBy = session?.user?.name ?? "system";

  // Collect unique category names from assets
  const categoryNames = data.assets
    ? [...new Set((data.assets as Array<{ suggestedCategory?: string | null }>)
        .map((a) => a.suggestedCategory)
        .filter(Boolean) as string[])]
    : [];

  // All work happens in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // Mark OCR extraction as confirmed
    if (invoice.ocrExtractionId) {
      await tx.ocrExtraction.update({
        where: { id: invoice.ocrExtractionId },
        data: { confirmed: true },
      });
    }

    // Update invoice to confirmed
    const updatedInvoice = await tx.invoice.update({
      where: { id },
      data: {
        invoiceNumber: data.invoiceNumber ?? invoice.invoiceNumber,
        vendor: data.vendor ?? invoice.vendor,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : invoice.invoiceDate,
        totalAmount: data.totalAmount ? new Prisma.Decimal(data.totalAmount) : invoice.totalAmount,
        status: "CONFIRMED",
      },
    });

    // Fetch/create categories
    const existingCats = await tx.category.findMany({
      where: { name: { in: categoryNames }, isDeleted: false },
      select: { id: true, name: true },
    });
    const catByName = new Map(existingCats.map((c) => [c.name, c.id]));

    const missing = categoryNames.filter((n) => !catByName.has(n));
    for (const name of missing) {
      const created = await tx.category.create({ data: { name }, select: { id: true, name: true } });
      catByName.set(created.name, created.id);
    }

    // Default category fallback
    const DEFAULT = "Other";
    let defaultCategoryId = catByName.get(DEFAULT);
    if (!defaultCategoryId) {
      const first = await tx.category.findFirst({
        where: { isDeleted: false },
        orderBy: { name: "asc" },
        select: { id: true },
      });
      defaultCategoryId = first?.id;
    }

    // Create assets
    const createdAssets: Array<{ id: string; code: string; name: string }> = [];
    if (data.assets && defaultCategoryId) {
      for (const assetData of data.assets) {
        const categoryId = assetData.suggestedCategory
          ? (catByName.get(assetData.suggestedCategory) ?? defaultCategoryId)
          : defaultCategoryId;

        const qty = Math.max(1, assetData.quantity ?? 1);
        const trimmedName = assetData.name.trim();
        for (let i = 0; i < qty; i++) {
          const assetName = qty > 1
            ? `${trimmedName} (${i + 1}/${qty})`
            : trimmedName;

          const asset = await tx.asset.create({
            data: {
              code: generateAssetCode(),
              name: assetName,
              categoryId,
              status: AssetStatus.PURCHASED,
              purchaseDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
              purchasePrice: assetData.unitPrice != null
                ? new Prisma.Decimal(assetData.unitPrice)
                : undefined,
              warrantyMonths: assetData.warrantyMonths ?? undefined,
              vendor: data.vendor ?? undefined,
            },
            select: { id: true, code: true, name: true },
          });

          await tx.assetEvent.create({
            data: {
              assetId: asset.id,
              eventType: AssetEventType.CREATED,
              toStatus: AssetStatus.PURCHASED,
              description: `Asset '${asset.name}' (${asset.code}) created from invoice '${updatedInvoice.invoiceNumber ?? id}'`,
              performedBy,
            },
          });

          createdAssets.push(asset);
        }
      }
    }

    return { invoice: updatedInvoice, createdAssets };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });

  return NextResponse.json(result);
}
