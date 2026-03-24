"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";

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
}

interface FieldProps {
  label: string;
  value: string | number | null;
  confidence: number | null;
  editable?: boolean;
  onChange?: (v: string) => void;
  type?: "text" | "date" | "number";
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  const cls =
    pct >= 90 ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-300"
    : pct >= 70 ? "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
    : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${cls}`}>
      {pct >= 70 ? <CheckCircleIcon className="h-3 w-3" /> : <AlertCircleIcon className="h-3 w-3" />}
      {pct}%
    </span>
  );
}

function EditableField({ label, value, confidence, editable = true, onChange, type = "text" }: FieldProps) {
  const isLow = confidence != null && confidence < 0.7;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <ConfidenceBadge confidence={confidence} />
      </div>
      {editable ? (
        <Input
          type={type}
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange?.(e.target.value)}
          className={isLow ? "border-amber-400 dark:border-amber-600" : ""}
        />
      ) : (
        <p className={`text-sm font-medium py-1 ${!value ? "text-muted-foreground italic" : ""}`}>
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}

interface InvoicePreviewProps {
  extracted: InvoiceExtractedData;
  confidence: number;
  formData: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
}

export function InvoicePreview({
  extracted,
  confidence,
  formData,
  onFieldChange,
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

      {/* Extracted fields */}
      <div className="grid grid-cols-2 gap-4">
        <EditableField
          label="Invoice Number"
          value={formData.invoiceNumber ?? extracted.invoiceNumber ?? ""}
          confidence={confidence > 0.8 ? confidence : confidence * 0.9}
          onChange={(v) => onFieldChange("invoiceNumber", v)}
        />
        <EditableField
          label="Vendor"
          value={formData.vendor ?? extracted.vendor ?? ""}
          confidence={confidence > 0.8 ? confidence : confidence * 0.9}
          onChange={(v) => onFieldChange("vendor", v)}
        />
        <EditableField
          label="Invoice Date"
          value={formData.invoiceDate ?? extracted.invoiceDate ?? ""}
          confidence={confidence > 0.8 ? confidence : confidence * 0.85}
          type="date"
          onChange={(v) => onFieldChange("invoiceDate", v)}
        />
        <EditableField
          label={`Total Amount (${extracted.currency ?? "VND"})`}
          value={formData.totalAmount ?? (extracted.totalAmount != null ? String(extracted.totalAmount) : "")}
          confidence={confidence > 0.8 ? confidence : confidence * 0.8}
          type="number"
          onChange={(v) => onFieldChange("totalAmount", v)}
        />
      </div>

      {/* Line items */}
      {extracted.items.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Line Items
          </Label>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Unit Price</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {extracted.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.quantity ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{item.unitPrice != null ? item.unitPrice.toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-right font-medium">{item.amount != null ? item.amount.toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
