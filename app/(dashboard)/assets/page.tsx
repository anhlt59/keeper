"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  PlusIcon,
  PackageIcon,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetStatus } from "@prisma/client";
import { apiFetch } from "@/lib/api-fetch";

interface Asset {
  id: string;
  code: string;
  name: string;
  status: AssetStatus;
  assignedTo: string | null;
  purchaseDate: string | null;
  category: { id: string; name: string };
}

interface ListResponse {
  items: Asset[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function AssetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") ?? "");

  const page = parseInt(searchParams.get("page") ?? "1");
  const categoryId = searchParams.get("categoryId") ?? "";
  const status = searchParams.get("status") as AssetStatus | "";

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", "20");
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (categoryId) params.set("categoryId", categoryId);
  if (status) params.set("status", status);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["assets", params.toString()],
    queryFn: async () => {
      const r = await apiFetch(`/api/assets?${params}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load assets");
      return r.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await apiFetch("/api/categories");
      if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load categories");
      return r.json();
    },
  });

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "page") p.delete("page");
    router.push(`/assets?${p.toString()}`);
  };

  const goPage = (p: number) => {
    const p2 = new URLSearchParams(searchParams.toString());
    p2.set("page", String(p));
    router.push(`/assets?${p2.toString()}`);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); setDebouncedSearch(search); }}
          className="flex gap-2 flex-1 min-w-[200px]"
        >
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>

        <Select value={categoryId} onValueChange={(v) => updateParam("categoryId", v ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {categoryId ? categories.find((c) => c.id === categoryId)?.name : "All Categories"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem>All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => updateParam("status", v ?? "")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem>All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
            <SelectItem value="DISPOSED">Disposed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
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
                  <PackageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No assets found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or create a new asset.</p>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {data.items.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">{asset.code}</span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/assets/${asset.id}`} className="font-medium hover:underline">
                      {asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>{asset.category.name}</TableCell>
                  <TableCell><StatusBadge status={asset.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {asset.assignedTo ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(asset.purchaseDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/assets/${asset.id}`}>
                        <Button variant="ghost" size="icon-sm" title="View">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/assets/${asset.id}/edit`}>
                        <Button variant="ghost" size="icon-sm" title="Edit">
                          <EditIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
          {Array.from({ length: 8 }).map((_, i) => (
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

export default function AssetsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
          <Suspense fallback={<Skeleton className="h-4 w-24 mt-1" />}>
            <AssetsContentHeader />
          </Suspense>
        </div>
        <Link href="/assets/new">
          <Button>
            <PlusIcon className="h-4 w-4" />
            New Asset
          </Button>
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AssetsContent />
      </Suspense>
    </div>
  );
}

// Separate header to read searchParams inside Suspense
function AssetsContentHeader() {
  return (
    <p className="text-muted-foreground text-sm">
      All assets
    </p>
  );
}
