"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CameraIcon, KeyboardIcon, QrCodeIcon } from "lucide-react";
import { toast } from "sonner";

export function QRScanner() {
  const router = useRouter();
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
  const [manualId, setManualId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);

  useEffect(() => {
    if (showManual) return;
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scannerId = "qr-reader";
        const el = document.getElementById(scannerId);
        if (!el || !mounted) return;

        const scanner = new Html5Qrcode(scannerId);
        html5QrRef.current = scanner;
        setCameraAllowed(true);

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            setScanning(true);
            // Expect URL like .../assets/{id}/lookup or just {id}
            const match = decodedText.match(/\/assets\/([a-z0-9]+)\/lookup/i)
              ?? decodedText.match(/([a-z0-9]{20,})/i);
            if (match) {
              const assetId = match[1];
              try {
                const res = await fetch(`/api/assets/${assetId}/lookup`, { credentials: "include" });
                if (res.ok) {
                  router.push(`/assets/${assetId}/lookup`);
                } else {
                  toast.error("Asset not found");
                  setScanning(false);
                }
              } catch {
                toast.error("Failed to validate asset");
                setScanning(false);
              }
            } else {
              toast.error("Invalid QR code format");
              setScanning(false);
            }
          },
          () => {} // ignore errors during scanning
        );
      } catch (err) {
        console.error("Camera error:", err);
        if (mounted) {
          setCameraAllowed(false);
          setShowManual(true);
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, [showManual, router]);

  function handleManualLookup() {
    const id = manualId.trim();
    if (!id) { toast.error("Enter an asset ID"); return; }
    router.push(`/assets/${id}/lookup`);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera view */}
      {!showManual && (
        <div className="w-full max-w-sm">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full rounded-lg overflow-hidden border"
          />
          {cameraAllowed && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Point camera at QR code
            </p>
          )}
        </div>
      )}

      {/* Permission denied / manual fallback */}
      {(cameraAllowed === false || showManual) && (
        <div className="w-full max-w-sm space-y-3 border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <CameraIcon className="h-4 w-4" />
            Camera not available
          </div>
          <p className="text-xs text-muted-foreground">
            Allow camera access or enter the asset ID manually below.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="manual-id">Asset ID</Label>
            <div className="flex gap-2">
              <Input
                id="manual-id"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Enter asset ID"
                onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
              />
              <Button onClick={handleManualLookup} size="sm">
                Lookup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle manual */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowManual((v) => !v)}
      >
        <KeyboardIcon className="h-4 w-4" />
        {showManual ? "Use Camera" : "Enter Manually"}
      </Button>
    </div>
  );
}
