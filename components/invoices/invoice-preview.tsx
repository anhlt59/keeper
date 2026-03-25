"use client";

import { Label } from "@/components/ui/label";
import { PackageIcon } from "lucide-react";
import { EditableAssetRow, type EditableAsset } from "@/components/invoices/editable-asset-row";
import { EditableInvoiceRow } from "@/components/invoices/editable-invoice-row";

interface ExtractedAsset {
  name: string;
  suggestedCategory: string | null;
  quantity: number;
  unitPrice: number | null;
  warrantyMonths: number | null;
}

interface InvoiceExtractedData {
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
  assets?: ExtractedAsset[];
}

interface InvoicePreviewProps {
  extracted: InvoiceExtractedData;
  confidence: number;
  formData: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  editableAssets: EditableAsset[];
  onAssetChange: (index: number, field: keyof EditableAsset, value: string) => void;
  onAssetRemove: (index: number) => void;
  categories: string[];
}

export function InvoicePreview({
  extracted,
  confidence,
  formData,
  onFieldChange,
  editableAssets,
  onAssetChange,
  onAssetRemove,
  categories,
}: InvoicePreviewProps) {
  const overallPct = Math.round(confidence * 100);
  const overallCls =
    overallPct >= 90 ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
    : overallPct >= 70 ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";

  return (
    <div className="space-y-6">
      {/* Overall confidence banner */}
      <div className={`rounded-lg border p-4 ${overallCls}`}>
        <p className="text-sm font-medium">
          OCR Confidence: <span className="font-bold">{overallPct}%</span>
          {overallPct < 70 && (
            <span className="ml-2 text-destructive"> — Please review low-confidence fields (marked in amber/red)</span>
          )}
        </p>
      </div>

      {/* Invoice */}
      <EditableInvoiceRow
        invoiceNumber={formData.invoiceNumber ?? extracted.invoiceNumber ?? ""}
        vendor={formData.vendor ?? extracted.vendor ?? ""}
        invoiceDate={formData.invoiceDate ?? extracted.invoiceDate ?? ""}
        totalAmount={formData.totalAmount ?? (extracted.totalAmount != null ? String(extracted.totalAmount) : "")}
        currency={extracted.currency ?? undefined}
        confidence={{
          invoiceNumber: confidence > 0.8 ? confidence : confidence * 0.9,
          vendor: confidence > 0.8 ? confidence : confidence * 0.9,
          invoiceDate: confidence > 0.8 ? confidence : confidence * 0.85,
          totalAmount: confidence > 0.8 ? confidence : confidence * 0.8,
        }}
        onChange={onFieldChange}
      />

      {/* Detected Assets */}
      {editableAssets && editableAssets.length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <PackageIcon className="h-3.5 w-3.5" />
            Detected Assets ({editableAssets.length})
          </Label>
          <div className="space-y-3">
            {editableAssets.map((asset, i) => (
              <EditableAssetRow
                key={i}
                asset={asset}
                index={i}
                onChange={onAssetChange}
                onRemove={onAssetRemove}
                confidence={{
                  name: confidence * 0.9,
                  quantity: confidence * 0.85,
                  unitPrice: confidence * 0.8,
                }}
                categories={categories}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
