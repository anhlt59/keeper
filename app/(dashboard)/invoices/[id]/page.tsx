"use client";

import { use, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ImageIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceStatus } from "@prisma/client";

interface InvoiceOcrExtraction {
  id: string;
  rawResponse: unknown;
  extractedData: Record<string, unknown>;
  confidence: number;
  confirmed: boolean;
  createdAt: string;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string | null;
  vendor: string | null;
  invoiceDate: string | null;
  totalAmount: string | null;
  status: InvoiceStatus;
  filePath: string | null;
  createdAt: string;
  ocrExtraction: InvoiceOcrExtraction | null;
}

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CONFIRMED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  // reset image state when navigating to a different invoice
  const prevId = useRef(id);
  if (prevId.current !== id) { prevId.current = id; setImgError(false); setImgOpen(false); }

  const { data, isLoading, error } = useQuery<InvoiceDetail>({
    queryKey: ["invoice", id],
    queryFn: () => fetch(`/api/invoices/${id}`, { credentials: "include" }).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json() as Promise<InvoiceDetail>;
    }),
  });

  async function handleDelete() {
    if (!data) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${data.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/invoices";
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
    }
  }

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Invoice not found.</AlertDescription>
      </Alert>
    );
  }

  const invoice: InvoiceDetail = data;
  const ed = invoice.ocrExtraction?.extractedData;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/invoices" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeftIcon className="h-4 w-4" />
          Invoices
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">
            {invoice.vendor ?? "Invoice"}
          </h2>
          <span className={`inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[invoice.status]}`}>
            {invoice.status}
          </span>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2Icon className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[
              { label: "Invoice Number", value: invoice.invoiceNumber },
              { label: "Vendor", value: invoice.vendor },
              { label: "Invoice Date", value: formatDate(invoice.invoiceDate) },
              { label: "Total Amount", value: invoice.totalAmount ? `${parseFloat(invoice.totalAmount).toLocaleString()} VND` : null },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium uppercase">{label}</dt>
                <dd className="font-medium">{value ?? "—"}</dd>
              </div>
            ))}
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase">Created</dt>
              <dd className="font-medium">{new Date(invoice.createdAt).toLocaleString("vi-VN")}</dd>
            </div>
            {invoice.filePath ? (
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium uppercase">Invoice Image</dt>
                <Button variant="outline" size="sm" onClick={() => setImgOpen(true)}>
                  <ImageIcon className="h-4 w-4" />
                  View Image
                </Button>
              </div>
            ) : <div />}
          </dl>
        </CardContent>
      </Card>

      {/* Invoice image popup */}
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="w-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice Image</DialogTitle>
          </DialogHeader>
          {imgError ? (
            <p className="text-sm text-muted-foreground py-4">Image could not be loaded.</p>
          ) : (
            <div className="flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={invoice.filePath ?? ""}
                alt="Invoice document"
                className="rounded-md object-contain"
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {invoice.ocrExtraction != null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              OCR Extraction Data
              <span className="text-xs text-muted-foreground font-normal">
                confidence: {Math.round(invoice.ocrExtraction.confidence * 100)}%
              </span>
              {invoice.ocrExtraction.confirmed ? (
                <Badge variant="outline" className="text-xs">Confirmed</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeof ed === "object" && ed !== null ? (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {Object.entries(ed)
                  .filter(([k]) => k !== "items")
                  .map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <dt className="text-muted-foreground text-xs font-medium uppercase">{key}</dt>
                      <dd className="font-mono">{val != null ? String(val) : "—"}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No OCR data available.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {invoice.ocrExtraction?.rawResponse != null ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
            Raw OCR Response
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64">
            {JSON.stringify(invoice.ocrExtraction.rawResponse, null, 2)}
          </pre>
        </details>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Invoice"
        description="Delete this invoice? This cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
