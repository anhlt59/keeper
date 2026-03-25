"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { QrCodeIcon, PrinterIcon, ArrowDownIcon } from "lucide-react";

interface QRPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetName: string;
  assetCode: string;
  qrImage: string | null;
  assetId: string;
}

export function QRPreviewModal({
  open,
  onOpenChange,
  assetName,
  assetCode,
  qrImage: qrImageProp,
  assetId,
}: QRPreviewModalProps) {
  const [qrImage, setQrImage] = useState<string | null>(qrImageProp);

  // Fetch QR from API if not stored on asset
  useEffect(() => {
    if (!open) return;
    if (qrImage) return;
    fetch(`/api/assets/${assetId}/qr`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch QR");
        return res.blob();
      })
      .then((blob) => {
        setQrImage(URL.createObjectURL(blob));
      })
      .catch(console.error);
  }, [open, assetId, qrImage]);

  function handleDownload() {
    if (!qrImage) return;
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `qr-${assetCode}.png`;
    link.click();
  }

  function handlePrint() {
    if (!qrImage) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>QR Label - ${assetCode}</title></head>
        <body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;">
          <div style="width:25mm;height:25mm;text-align:center;border:1px dashed #ccc;padding:1mm;box-sizing:border-box;font-family:sans-serif;">
            <div style="font-size:6px;font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${assetName}</div>
            <div style="font-size:5px;color:#888;margin-bottom:0.5mm;">${assetCode}</div>
            <img src="${qrImage}" style="width:20mm;height:20mm;" />
          </div>
          <script>window.onload=()=>{window.print();window.close();}<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-4 w-4" />
            QR Code — {assetCode}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {qrImage ? (
            <img
              src={qrImage}
              alt={`QR Code for ${assetName}`}
              className="w-56 h-56 rounded-lg border bg-white p-2"
            />
          ) : (
            <div className="w-56 h-56 rounded-lg border bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Generating...</span>
            </div>
          )}
          <div className="text-center">
            <p className="font-medium text-sm">{assetName}</p>
            <p className="font-mono text-xs text-muted-foreground">{assetCode}</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Scan to view asset details without logging in.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!qrImage}
          >
            <ArrowDownIcon className="h-4 w-4" />
            Download PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!qrImage}
          >
            <PrinterIcon className="h-4 w-4" />
            Print Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
