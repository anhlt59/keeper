"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ScrollTextIcon,
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

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

interface ListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  STATUS_CHANGE: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  ASSIGNED: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  RECALLED: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  MAINTENANCE_CREATED: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  MAINTENANCE_COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  DISPOSED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  RESTORED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

const ENTITY_OPTIONS = ["Asset", "Category", "Maintenance", "User"];
const ACTION_OPTIONS = [
  "CREATED", "STATUS_CHANGE", "ASSIGNED", "RECALLED",
  "MAINTENANCE_CREATED", "MAINTENANCE_COMPLETED", "DISPOSED", "RESTORED",
];

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("vi-VN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function AuditLogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityType = searchParams.get("entityType") ?? "";
  const action = searchParams.get("action") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", "20");
  if (entityType) params.set("entityType", entityType);
  if (action) params.set("action", action);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["audit-logs", params.toString()],
    queryFn: async () => {
      const r = await fetch(`/api/audit-logs?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load audit logs");
      return r.json();
    },
  });

  const updateParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "page") p.delete("page");
    router.push(`/audit-logs?${p.toString()}`);
  };

  const goPage = (p: number) => {
    const p2 = new URLSearchParams(searchParams.toString());
    p2.set("page", String(p));
    router.push(`/audit-logs?${p2.toString()}`);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={entityType} onValueChange={(v) => updateParam("entityType", v ?? null)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Entities</SelectItem>
            {ENTITY_OPTIONS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={(v) => updateParam("action", v ?? null)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Actions</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          ) : !data?.items.length ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <ScrollTextIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No audit logs found</p>
                  <p className="text-sm mt-1">Try adjusting your filters.</p>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {data.items.map((log) => {
                const colorClass = ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground";
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user?.name ?? "System"}
                      {log.user?.email && (
                        <div className="text-xs text-muted-foreground">{log.user.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{log.entityType}</div>
                      {log.entityId && (
                        <div className="text-xs font-mono text-muted-foreground">{log.entityId}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                      {log.description ?? "—"}
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
            {Array.from({ length: 5 }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 5 }).map((_, j) => (
                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground text-sm">System-wide activity history</p>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <AuditLogsContent />
      </Suspense>
    </div>
  );
}
