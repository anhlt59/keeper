import QRCode from "qrcode";

export async function generateQRCode(assetId: string, baseUrl: string): Promise<string> {
  const content = `${baseUrl.replace(/\/$/, "")}/assets/${assetId}/lookup`;
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function generateQRBuffer(assetId: string, baseUrl: string): Promise<Buffer> {
  const content = `${baseUrl.replace(/\/$/, "")}/assets/${assetId}/lookup`;
  return QRCode.toBuffer(content, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
    type: "png",
  });
}
