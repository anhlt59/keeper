import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractInvoiceData, fetchCategoryNames } from "@/lib/ocr";
import { Prisma } from "@prisma/client";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Saves invoice image under public/uploads/invoices/YYYY/MM. Returns web-relative path. */
async function saveInvoiceImage(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  const ext = MIME_TO_EXT[mimeType] ?? "jpg";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  // Collision-safe: millisecond timestamp + random suffix
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const relDir = `uploads/invoices/${year}/${month}`;
  const absDir = join(process.cwd(), "public", relDir);
  await mkdir(absDir, { recursive: true });
  await writeFile(join(absDir, filename), Buffer.from(buffer));
  return `/${relDir}/${filename}`;
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

  // Read buffer once — used for both file save and OCR base64 encoding
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 422 });
  }

  // Persist image to disk; path will be stored in DB
  let filePath: string;
  try {
    filePath = await saveInvoiceImage(arrayBuffer, file.type);
  } catch {
    return NextResponse.json({ error: "Failed to save invoice image" }, { status: 500 });
  }

  // Extract data via OpenAI; cleanup written file on failure
  const categoryNames = await fetchCategoryNames();
  let result;
  try {
    result = await extractInvoiceData(arrayBufferToBase64(arrayBuffer), categoryNames);
  } catch (err) {
    unlink(join(process.cwd(), "public", filePath.slice(1))).catch(() => {});
    const message = err instanceof Error ? err.message : "OCR extraction failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Store OCR extraction + pending invoice (with filePath) in one transaction
  let ocrExtraction, invoice;
  try {
    [ocrExtraction, invoice] = await prisma.$transaction([
      prisma.ocrExtraction.create({
        data: {
          rawResponse: { raw: result.raw },
          extractedData: result.extracted as unknown as Prisma.InputJsonValue,
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
          filePath,
        },
      }),
    ]);
  } catch {
    // Best-effort cleanup: remove the saved file when DB write fails
    unlink(join(process.cwd(), "public", filePath.slice(1))).catch(() => {});
    return NextResponse.json({ error: "Failed to store invoice" }, { status: 500 });
  }

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
