"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeftIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceUpload } from "@/components/invoices/invoice-upload";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { type EditableAsset } from "@/components/invoices/editable-asset-row";

interface ExtractedAsset {
  name: string;
  suggestedCategory: string | null;
  quantity: number;
  unitPrice: number | null;
  warrantyMonths: number | null;
}

interface OcrResult {
  invoiceId: string;
  ocrExtractionId: string;
  extracted: {
    vendor: string | null;
    invoiceDate: string | null;
    invoiceNumber: string | null;
    totalAmount: number | null;
    currency: string | null;
    items: Array<{
      description: string;
      quantity: number | null;
      unitPrice: number | null;
      amount: number | null;
    }>;
    assets: ExtractedAsset[];
    categories: string[];
  };
  confidence: number;
  raw: string;
}

type Step = "upload" | "preview" | "confirm";

export default function NewInvoicePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [editableAssets, setEditableAssets] = useState<EditableAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  function handleFileSelected(f: File) {
    setFile(f);
  }

  async function handleUpload() {
    if (!file) { toast.error("Please select an image first"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/invoices/ocr", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "OCR extraction failed");
      }
      const result: OcrResult = await res.json();
      setOcrResult(result);
      setEditableAssets(result.extracted.assets?.map((a) => ({
        name: a.name,
        category: a.suggestedCategory ?? "",
        quantity: String(a.quantity ?? 1),
        unitPrice: a.unitPrice != null ? String(a.unitPrice) : "",
        warrantyMonths: a.warrantyMonths != null ? String(a.warrantyMonths) : "",
      })) ?? []);
      setFormData({
        invoiceNumber: result.extracted.invoiceNumber ?? "",
        vendor: result.extracted.vendor ?? "",
        invoiceDate: result.extracted.invoiceDate ?? "",
        totalAmount: result.extracted.totalAmount != null ? String(result.extracted.totalAmount) : "",
      });
      setStep("preview");
      toast.success("Invoice data extracted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFieldChange(field: string, value: string) {
    setFormData((f) => ({ ...f, [field]: value }));
  }

  function updateAsset(index: number, field: keyof EditableAsset, value: string) {
    setEditableAssets((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function removeAsset(index: number) {
    setEditableAssets((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/invoices" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeftIcon className="h-4 w-4" />
          Invoices
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {step === "upload" ? "Upload Invoice" : step === "preview" ? "Review & Confirm" : "Confirm"}
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Invoice</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Take a photo or upload an image of your invoice. The data will be extracted automatically.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "preview", "confirm"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
              i === ["upload", "preview", "confirm"].indexOf(step)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </span>
            <span className={step === s ? "font-medium" : "text-muted-foreground"}>
              {s === "upload" ? "Upload" : s === "preview" ? "Review" : "Confirm"}
            </span>
            {i < 2 && <span className="text-muted-foreground mx-1">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 1: Upload Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InvoiceUpload onFileSelected={handleFileSelected} />
            <div className="flex justify-end">
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? "Extracting..." : "Extract Data →"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2: Review Extracted Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {file && (
              <div className="rounded-lg border overflow-hidden max-w-xs">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Invoice preview"
                  className="max-h-40 mx-auto object-contain"
                />
              </div>
            )}
            <InvoicePreview
              extracted={ocrResult.extracted}
              confidence={ocrResult.confidence}
              editableAssets={editableAssets}
              onAssetChange={updateAsset}
              onAssetRemove={removeAsset}
              formData={formData}
              onFieldChange={handleFieldChange}
              categories={ocrResult.extracted.categories ?? []}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                ← Re-upload
              </Button>
              <Button onClick={() => setStep("confirm")}>
                Looks Good →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              Step 3: Confirm & Save
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              invoiceId={ocrResult.invoiceId}
              ocrExtractionId={ocrResult.ocrExtractionId}
              initialData={ocrResult.extracted}
              assets={editableAssets}
              vendor={ocrResult.extracted.vendor}
              purchaseDate={ocrResult.extracted.invoiceDate}
              categories={ocrResult.extracted.categories ?? []}
              onSuccess={() => {
                if (typeof window !== "undefined") {
                  router.push("/invoices");
                }
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
