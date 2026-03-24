"use client";

import { QRScanner } from "@/components/assets/qr-scanner";
import { QrCodeIcon } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
          ← Dashboard
        </Link>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <QrCodeIcon className="h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">Scan Asset QR</h2>
        </div>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          Point your camera at an asset QR code to view its details instantly.
        </p>
      </div>

      <div className="max-w-sm mx-auto">
        <QRScanner />
      </div>
    </div>
  );
}
