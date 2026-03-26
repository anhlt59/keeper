"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PackageIcon } from "lucide-react";
import { EditableAssetRow, type EditableAsset } from "@/components/invoices/editable-asset-row";
import { EditableInvoiceRow } from "@/components/invoices/editable-invoice-row";
import { useLanguage } from "@/context/language-context";

interface InvoiceFormProps {
  initialData: {
    invoiceNumber?: string | null;
    vendor?: string | null;
    invoiceDate?: string | null;
    totalAmount?: number | null;
  };
  invoiceId: string;
  ocrExtractionId: string;
  assets?: EditableAsset[];
  vendor?: string | null;
  purchaseDate?: string | null;
  onSuccess?: () => void;
  categories?: string[];
}

/** Ensure assets are in EditableAsset string form */
function toEditableAssets(assets: EditableAsset[]): EditableAsset[] {
  return assets.map((a) => ({
    name: a.name,
    category: a.category ?? "",
    quantity: String(a.quantity ?? "1"),
    unitPrice: a.unitPrice != null ? String(a.unitPrice) : "",
    warrantyMonths: a.warrantyMonths != null ? String(a.warrantyMonths) : "",
  }));
}

export function InvoiceForm({ initialData, invoiceId, ocrExtractionId, assets = [], vendor, purchaseDate, onSuccess, categories = [] }: InvoiceFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({
    invoiceNumber: initialData.invoiceNumber ?? "",
    vendor: initialData.vendor ?? "",
    invoiceDate: initialData.invoiceDate ?? "",
    totalAmount: initialData.totalAmount != null ? String(initialData.totalAmount) : "",
  });
  const [editableAssets, setEditableAssets] = useState<EditableAsset[]>(() => toEditableAssets(assets));
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateAsset(index: number, field: keyof EditableAsset, value: string) {
    setEditableAssets((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function removeAsset(index: number) {
    setEditableAssets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: form.invoiceNumber || undefined,
          vendor: form.vendor || undefined,
          invoiceDate: form.invoiceDate || undefined,
          totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
          assets: editableAssets
            .filter((a) => a.name.trim())
            .map((a) => ({
              name: a.name.trim(),
              suggestedCategory: a.category || null,
              quantity: parseInt(a.quantity) || 1,
              unitPrice: a.unitPrice ? parseFloat(a.unitPrice) : null,
              warrantyMonths: a.warrantyMonths ? parseInt(a.warrantyMonths) : null,
            })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("invoiceUpload.confirmFailed"));
      }
      toast.success(t("invoiceUpload.confirmSuccess"));
      if (onSuccess) onSuccess();
      else router.push("/invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("invoiceUpload.confirmFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <EditableInvoiceRow
        invoiceNumber={form.invoiceNumber}
        vendor={form.vendor}
        invoiceDate={form.invoiceDate}
        totalAmount={form.totalAmount}
        onChange={set}
      />

      {/* Editable assets section */}
      {editableAssets.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <PackageIcon className="h-3.5 w-3.5" />
            {t("invoiceUpload.assetsToCreate")} ({editableAssets.length})
          </Label>
          <div className="space-y-3">
            {editableAssets.map((asset, i) => (
              <EditableAssetRow
                key={i}
                asset={asset}
                index={i}
                onChange={updateAsset}
                onRemove={removeAsset}
                categories={categories}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">
            {t("invoiceUpload.assetsHint")}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/invoices")}>{t("common.cancel")}</Button>
        <Button onClick={handleConfirm} disabled={loading}>
          {loading ? t("invoiceUpload.confirming") : t("invoiceUpload.confirmInvoice")}
        </Button>
      </div>
    </div>
  );
}
