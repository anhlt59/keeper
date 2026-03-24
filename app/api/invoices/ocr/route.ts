import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractInvoiceData } from "@/lib/ocr";
import { Prisma } from "@prisma/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(", ")}. PDF support is not yet available.` },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  // Convert to base64
  let imageBase64: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    imageBase64 = arrayBufferToBase64(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 422 });
  }

  // Extract data via OpenAI
  let result;
  try {
    result = await extractInvoiceData(imageBase64);
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR extraction failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Store OCR extraction + pending invoice
  const [ocrExtraction, invoice] = await prisma.$transaction([
    prisma.ocrExtraction.create({
      data: {
        rawResponse: { raw: result.raw },
        extractedData: result.extracted as Prisma.InputJsonValue,
        confidence: result.confidence,
        confirmed: false,
      },
    }),
    prisma.invoice.create({
      data: {
        vendor: result.extracted.vendor,
        invoiceDate: result.extracted.invoiceDate ? new Date(result.extracted.invoiceDate) : null,
        invoiceNumber: result.extracted.invoiceNumber,
        totalAmount: result.extracted.totalAmount != null
          ? new Prisma.Decimal(result.extracted.totalAmount)
          : null,
        status: "PENDING",
      },
    }),
  ]);

  // Link OCR extraction to invoice
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { ocrExtractionId: ocrExtraction.id },
  });

  return NextResponse.json({
    invoiceId: invoice.id,
    ocrExtractionId: ocrExtraction.id,
    extracted: result.extracted,
    confidence: result.confidence,
    raw: result.raw,
  });
}
