"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  WrenchIcon,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaintenanceStatus } from "@prisma/client";

interface MaintenanceRecord {
  id: string;
  type: string;
  description: string;
  cost: string | number | null;
  startDate: string;
  endDate: string | null;
  status: MaintenanceStatus;
  performedBy: string | null;
  asset: { id: string; name: string; code: string };
}

interface ListResponse {
  items: MaintenanceRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const TYPE_LABEL: Record<string, string> = {
  PREVENTIVE: "Preventive",
  CORRECTIVE: "Corrective",
  UPGRADE: "Upgrade",
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  SCHEDULED: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300" },
  IN_PROGRESS: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300" },
  COMPLETED: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-300" },
  CANCELLED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" },
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function formatVND(v: string | number | null): string {
  if (!v) return "—";
  const num = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(num);
}

function MaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", "20");
  if (status) params.set("status", status);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["maintenance", params.toString()],
    queryFn: async () => {
      const r = await apiFetch(`/api/maintenance?${params}`);
      if (!r.ok) throw new Error("Failed to load maintenance records");
      return r.json();
    },
  });

  const goPage = (p: number) => {
    const p2 = new URLSearchParams(searchParams.toString());
    p2.set("page", String(p));
    router.push(`/maintenance?${p2.toString()}`);
  };

  const updateStatus = (v: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (v) p.set("status", v);
    else p.delete("status");
    p.delete("page");
    router.push(`/maintenance?${p.toString()}`);
  };

  return (
    <>
      {/* Filter */}
      <div className="flex gap-2 items-center">
        <Select value={status} onValueChange={updateStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem>All Status</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ) : !data?.items.length ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <WrenchIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No maintenance records found</p>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {data.items.map((r) => {
                const style = STATUS_STYLE[r.status] ?? { bg: "bg-muted", text: "text-muted-foreground" };
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/assets/${r.asset.id}`} className="hover:underline">
                        <div className="font-medium text-sm">{r.asset.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{r.asset.code}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">{TYPE_LABEL[r.type] ?? r.type}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {r.description}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(r.startDate)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatVND(r.cost)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/assets/${r.asset.id}`}>
                        <Button variant="ghost" size="icon-sm" title="View Asset">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} — {data.total} results
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => goPage(page - 1)} disabled={page <= 1}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => goPage(page + 1)} disabled={page >= data.totalPages}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 7 }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 7 }).map((_, j) => (
                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Maintenance</h2>
        <Suspense fallback={<Skeleton className="h-4 w-24 mt-1" />}>
          <MaintenanceHeader />
        </Suspense>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <MaintenanceContent />
      </Suspense>
    </div>
  );
}

function MaintenanceHeader() {
  return (
    <p className="text-muted-foreground text-sm">
      All maintenance records
    </p>
  );
}
