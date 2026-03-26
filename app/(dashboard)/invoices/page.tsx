"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon, Trash2Icon, FileTextIcon, EyeIcon } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { InvoiceStatus } from "@prisma/client";
import { useLanguage } from "@/context/language-context";

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  vendor: string | null;
  invoiceDate: string | null;
  totalAmount: string | null;
  status: InvoiceStatus;
  ocrExtraction: { confidence: number; confirmed: boolean } | null;
  createdAt: string;
}

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CONFIRMED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function formatVND(v: string | null): string {
  if (!v) return "—";
  const num = parseFloat(v);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(num);
}

export default function InvoicesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const { data, isLoading } = useQuery<{ items: Invoice[]; total: number }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const r = await apiFetch("/api/invoices");
      if (!r.ok) throw new Error("Failed to load invoices");
      return r.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success(t("invoices.deleted"));
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error(t("invoices.deleteFailed")),
  });

  const invoices = data?.items ?? [];

  const STATUS_LABEL: Record<InvoiceStatus, string> = {
    PENDING: t("invoice.status.PENDING"),
    CONFIRMED: t("invoice.status.CONFIRMED"),
    REJECTED: t("invoice.status.REJECTED"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("nav.invoices")}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("invoices.subtitle")}
          </p>
        </div>
        <Button onClick={() => router.push("/invoices/new")} size="sm">
          <PlusIcon className="h-4 w-4" />
          {t("invoices.upload")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileTextIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">{t("invoices.noInvoices")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("invoices.noInvoicesHint")}
            </p>
            <Button className="mt-4" size="sm" onClick={() => router.push("/invoices/new")}>
              <PlusIcon className="h-4 w-4" />
              {t("invoices.uploadFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.date")}</TableHead>
                <TableHead>{t("invoices.vendor")}</TableHead>
                <TableHead>{t("invoices.amount")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("invoices.created")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{formatDate(inv.invoiceDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.vendor ?? "—"}</TableCell>
                  <TableCell className="font-mono">{formatVND(inv.totalAmount)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(inv.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/invoices/${inv.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <EyeIcon className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(inv)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title={t("invoices.deleteTitle")}
        description={t("invoices.deleteConfirm").replace("{vendor}", deleteTarget?.vendor ?? t("invoices.unknownVendor"))}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        confirmLabel={t("common.delete")}
        variant="destructive"
      />
    </div>
  );
}
