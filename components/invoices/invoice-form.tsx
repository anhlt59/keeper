"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InvoiceFormProps {
  initialData: {
    invoiceNumber?: string | null;
    vendor?: string | null;
    invoiceDate?: string | null;
    totalAmount?: number | null;
  };
  invoiceId: string;
  ocrExtractionId: string;
  onSuccess?: () => void;
}

export function InvoiceForm({ initialData, invoiceId, ocrExtractionId, onSuccess }: InvoiceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    invoiceNumber: initialData.invoiceNumber ?? "",
    vendor: initialData.vendor ?? "",
    invoiceDate: initialData.invoiceDate ?? "",
    totalAmount: initialData.totalAmount != null ? String(initialData.totalAmount) : "",
  });
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to confirm invoice");
      }
      toast.success("Invoice confirmed and saved");
      if (onSuccess) onSuccess();
      else router.push("/invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="inv-number">Invoice Number</Label>
          <Input
            id="inv-number"
            value={form.invoiceNumber}
            onChange={(e) => set("invoiceNumber", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-vendor">Vendor</Label>
          <Input
            id="inv-vendor"
            value={form.vendor}
            onChange={(e) => set("vendor", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-date">Invoice Date</Label>
          <Input
            id="inv-date"
            type="date"
            value={form.invoiceDate}
            onChange={(e) => set("invoiceDate", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-amount">Total Amount</Label>
          <Input
            id="inv-amount"
            type="number"
            value={form.totalAmount}
            onChange={(e) => set("totalAmount", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/invoices")}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={loading}>
          {loading ? "Confirming..." : "Confirm Invoice"}
        </Button>
      </div>
    </div>
  );
}
