"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CameraIcon, KeyboardIcon } from "lucide-react";
import { toast } from "sonner";

export function QRScanner() {
  const { t } = useLanguage();
  const router = useRouter();
  const [cameraAllowed, setCameraAllowed] = useState<boolean | null>(null);
  const [manualId, setManualId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const scannerStartedRef = useRef(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (showManual) return;

    // Prevent double-init from React StrictMode double-mount
    if (initializingRef.current) return;
    initializingRef.current = true;

    let mounted = true;

    async function startScanner() {
      // 1. Check device availability first
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        if (mounted) {
          setCameraAllowed(false);
          setShowManual(true);
          toast.error(t("scan.cameraNotAvailable"), { id: "camera-not-found" });
        }
        return;
      }

      // 2. Load html5-qrcode
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scannerId = "qr-reader";
        const el = document.getElementById(scannerId);
        if (!el || !mounted) return;

        const scanner = new Html5Qrcode(scannerId);

        // Assign ref AFTER scanner is instantiated, not after start()
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
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
                  toast.error(t("scan.assetNotFound"));
                }
              } catch {
                toast.error(t("scan.validateFailed"));
              }
            } else {
              toast.error(t("scan.invalidQR"));
            }
          },
          () => {} // ignore scan errors
        );

        scannerStartedRef.current = true;
        if (mounted) setCameraAllowed(true);
      } catch (err) {
        // Camera not available or failed to start — fall back to manual
        if (mounted) {
          setCameraAllowed(false);
          setShowManual(true);
          toast.error(t("scan.cameraNotAvailable"), { id: "camera-not-available" });
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      initializingRef.current = false;
      if (scannerStartedRef.current && html5QrRef.current) {
        scannerStartedRef.current = false;
        html5QrRef.current.stop().catch(() => {});
        html5QrRef.current = null;
      }
    };
  }, [showManual, router]);

  async function handleManualLookup() {
    const id = manualId.trim();
    if (!id) { toast.error(t("scan.enterAssetId")); return; }
    try {
      const res = await fetch(`/api/assets/${id}/lookup`, { credentials: "include" });
      if (res.ok) {
        router.push(`/assets/${id}/lookup`);
      } else {
        toast.error(t("scan.assetNotFound"));
      }
    } catch {
      toast.error(t("scan.validateFailed"));
    }
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
              {t("scan.pointCamera")}
            </p>
          )}
        </div>
      )}

      {/* Permission denied / manual fallback */}
      {(cameraAllowed === false || showManual) && (
        <div className="w-full max-w-sm space-y-3 border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <CameraIcon className="h-4 w-4" />
            {t("scan.cameraNotAvailable")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("scan.cameraHint")}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="manual-id">{t("scan.assetId")}</Label>
            <div className="flex gap-2">
              <Input
                id="manual-id"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder={t("scan.enterAssetId")}
                onKeyDown={async (e) => e.key === "Enter" && await handleManualLookup()}
              />
              <Button onClick={handleManualLookup} size="sm">
                {t("scan.lookup")}
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
        {showManual ? t("scan.useCamera") : t("scan.enterManually")}
      </Button>
    </div>
  );
}
