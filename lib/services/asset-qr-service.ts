import { prisma } from "@/lib/db";
import { generateQRCode } from "@/lib/qr-generator";

export async function generateAndStoreQR(assetId: string): Promise<string> {
  const host = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const qrDataUrl = await generateQRCode(assetId, host);

  await prisma.asset.update({
    where: { id: assetId },
    data: { qrImage: qrDataUrl },
  });

  return qrDataUrl;
}
