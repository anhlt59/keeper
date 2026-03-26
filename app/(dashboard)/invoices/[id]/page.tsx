"use client";

import { use, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircleIcon, ChevronLeftIcon, FileTextIcon, ImageIcon, Trash2Icon, PackageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
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
import { useLanguage } from "@/context/language-context";

interface InvoiceOcrExtraction {
  id: string;
  rawResponse: unknown;
  extractedData: Record<string, unknown>;
  confidence: number;
  confirmed: boolean;
  createdAt: string;
}

interface AssetSummary {
  id: string;
  code: string | null;
  name: string;
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
  assets: AssetSummary[];
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
  const { t } = useLanguage();
  const { id } = use(params);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  // reset image state when navigating to a different invoice
  const prevId = useRef(id);
  if (prevId.current !== id) { prevId.current = id; setImgError(false); setImgOpen(false); }

  const { data, isLoading, error, refetch } = useQuery<InvoiceDetail>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const r = await apiFetch(`/api/invoices/${id}`);
      if (!r.ok) throw new Error("Not found");
      return r.json() as Promise<InvoiceDetail>;
    },
  });

  async function handleDelete() {
    if (!data) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/invoices/${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/invoices";
    } catch {
      toast.error(t("invoices.deleteFailed"));
      setDeleting(false);
    }
  }

  async function handleConfirm() {
    if (!data) return;
    setConfirmOpen(false);
    setConfirming(true);
    try {
      const res = await apiFetch(`/api/invoices/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      if (!res.ok) throw new Error("Confirm failed");
      toast.success(t("invoiceDetail.confirmSuccess"));
      await refetch();
    } catch {
      toast.error(t("invoiceDetail.confirmFailed"));
    } finally {
      setConfirming(false);
    }
  }

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("invoiceDetail.notFound")}</AlertDescription>
      </Alert>
    );
  }

  const invoice: InvoiceDetail = data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/invoices" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeftIcon className="h-4 w-4" />
          {t("nav.invoices")}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{t("invoiceDetail.title")}</span>
      </div>

      {/* Heading */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {invoice.vendor ?? "Invoice"}
          </h2>
          <span className={`inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[invoice.status]}`}>
            {invoice.status}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          {invoice.status === "CONFIRMED"
            ? t("invoiceDetail.confirmed")
            : t("invoiceDetail.review")}
        </p>
      </div>

      {/* Card 1: Invoice Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              Invoice
            </CardTitle>
            <div className="flex gap-2">
              {invoice.status === "PENDING" && (
                <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={confirming}>
                  <CheckCircleIcon className="h-4 w-4" />
                  {t("common.confirm")}
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon className="h-4 w-4" />
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[
              { label: t("invoiceDetail.invoiceNumber"), value: invoice.invoiceNumber },
              { label: t("invoices.vendor"), value: invoice.vendor },
              { label: t("invoiceDetail.invoiceDate"), value: formatDate(invoice.invoiceDate) },
              { label: t("invoiceDetail.totalAmount"), value: invoice.totalAmount ? `${parseFloat(invoice.totalAmount).toLocaleString()} VND` : null },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium uppercase">{label}</dt>
                <dd className="font-medium">{value ?? "—"}</dd>
              </div>
            ))}
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase">{t("invoices.created")}</dt>
              <dd className="font-medium">{new Date(invoice.createdAt).toLocaleString("vi-VN")}</dd>
            </div>
            {invoice.filePath ? (
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium uppercase">{t("invoiceDetail.invoiceImage")}</dt>
                <Button variant="outline" size="sm" onClick={() => setImgOpen(true)}>
                  <ImageIcon className="h-4 w-4" />
                  {t("invoiceDetail.viewImage")}
                </Button>
              </div>
            ) : <div />}
          </dl>

          {/* OCR Extraction section inside the same card */}
          {invoice.ocrExtraction != null ? (
            <div className="mt-6 border-t pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{t("invoiceDetail.ocrData")}</CardTitle>
                <span className="text-xs text-muted-foreground font-normal">
                  {t("invoiceDetail.confidence")}: {Math.round(invoice.ocrExtraction.confidence * 100)}%
                </span>
                {invoice.ocrExtraction.confirmed ? (
                  <Badge variant="outline" className="text-xs">{t("invoice.status.CONFIRMED")}</Badge>
                ) : null}
              </div>

              {invoice.ocrExtraction.rawResponse != null ? (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                    {t("invoiceDetail.ocrResponse")}
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(invoice.ocrExtraction.rawResponse, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Card 2: Created Assets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageIcon className="h-4 w-4" />
              Assets ({invoice.assets?.length ?? 0})
            </CardTitle>
            {invoice.assets && invoice.assets.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {invoice.assets.length} {t("invoiceDetail.assetsCreated")}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!invoice.assets || invoice.assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("invoiceDetail.noAssets")}
            </p>
          ) : (
            <ul className="space-y-2">
              {invoice.assets.map((asset) => (
                <li key={asset.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {asset.code ?? asset.id}
                    </p>
                  </div>
                  <Link
                    href={`/assets/${asset.id}`}
                    className="text-sm text-primary hover:underline ml-2 shrink-0"
                  >
                    {t("common.view")} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Invoice image popup */}
      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent className="w-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("invoiceDetail.invoiceImage")}</DialogTitle>
          </DialogHeader>
          {imgError ? (
            <p className="text-sm text-muted-foreground py-4">{t("invoiceDetail.imageError")}</p>
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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("invoices.deleteTitle")}
        description={
          invoice.assets && invoice.assets.length > 0
            ? t("invoiceDetail.deleteWithAssets").replace("{count}", String(invoice.assets.length))
            : t("invoiceDetail.deleteNoAssets")
        }
        onConfirm={handleDelete}
        loading={deleting}
        confirmLabel={t("common.delete")}
        variant="destructive"
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("invoiceDetail.confirmTitle")}
        description={t("invoiceDetail.confirmDesc")}
        onConfirm={handleConfirm}
        loading={confirming}
        confirmLabel={t("common.confirm")}
      />
    </div>
  );
}
