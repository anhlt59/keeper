"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon, Trash2Icon, FileTextIcon, EyeIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { InvoiceStatus } from "@prisma/client";

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
const STATUS_LABEL: Record<InvoiceStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  REJECTED: "Rejected",
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const { data, isLoading } = useQuery<{ items: Invoice[]; total: number }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const r = await fetch("/api/invoices", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load invoices");
      return r.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Invoice deleted");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete invoice"),
  });

  const invoices = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Upload and manage purchase invoices with OCR extraction.
          </p>
        </div>
        <Button onClick={() => router.push("/invoices/new")} size="sm">
          <PlusIcon className="h-4 w-4" />
          Upload Invoice
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
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a photo of an invoice to extract data automatically.
            </p>
            <Button className="mt-4" size="sm" onClick={() => router.push("/invoices/new")}>
              <PlusIcon className="h-4 w-4" />
              Upload First Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
        title="Delete Invoice"
        description={`Delete invoice from ${deleteTarget?.vendor ?? "unknown vendor"}? This cannot be undone.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
