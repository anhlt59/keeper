"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileTextIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";

interface EditableInvoiceRowProps {
  invoiceNumber: string;
  vendor: string;
  invoiceDate: string;
  totalAmount: string;
  currency?: string;
  confidence?: {
    invoiceNumber?: number | null;
    vendor?: number | null;
    invoiceDate?: number | null;
    totalAmount?: number | null;
  };
  onChange: (field: string, value: string) => void;
}

function ConfidenceBadge({ confidence }: { confidence: number | null | undefined }) {
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

function FieldWithBadge({ label, value, confidence, type = "text", onChange }: {
  label: string;
  value: string;
  confidence?: number | null;
  type?: string;
  onChange: (v: string) => void;
}) {
  const isLow = confidence != null && confidence < 0.7;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <ConfidenceBadge confidence={confidence} />
      </div>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 text-sm ${isLow ? "border-amber-400 dark:border-amber-600" : ""}`}
      />
    </div>
  );
}

/**
 * Invoice fields card matching EditableAssetRow visual style.
 * Used in Step 2 (InvoicePreview) and Step 3 (InvoiceForm) for visual consistency.
 */
export function EditableInvoiceRow({
  invoiceNumber,
  vendor,
  invoiceDate,
  totalAmount,
  currency = "VND",
  confidence,
  onChange,
}: EditableInvoiceRowProps) {
  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <FileTextIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Invoice Details
        </Label>
      </div>

      {/* Card */}
      <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
        {/* Row 1: Number + Vendor */}
        <div className="grid grid-cols-2 gap-2">
          <FieldWithBadge
            label="Number"
            value={invoiceNumber}
            confidence={confidence?.invoiceNumber}
            onChange={(v) => onChange("invoiceNumber", v)}
          />
          <FieldWithBadge
            label="Vendor"
            value={vendor}
            confidence={confidence?.vendor}
            onChange={(v) => onChange("vendor", v)}
          />
        </div>

        {/* Row 2: Date + Total Amount */}
        <div className="grid grid-cols-2 gap-2">
          <FieldWithBadge
            label="Date"
            value={invoiceDate}
            confidence={confidence?.invoiceDate}
            type="date"
            onChange={(v) => onChange("invoiceDate", v)}
          />
          <FieldWithBadge
            label={`Total Amount (${currency})`}
            value={totalAmount}
            confidence={confidence?.totalAmount}
            type="number"
            onChange={(v) => onChange("totalAmount", v)}
          />
        </div>
      </div>
    </div>
  );
}
