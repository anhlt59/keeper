"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";
import {
  ChevronLeftIcon,
  EditIcon,
  Trash2Icon,
  WrenchIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  QrCodeIcon,
  Undo2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AssetTimeline } from "@/components/assets/asset-timeline";
import { AssignDialog } from "@/components/assets/assign-dialog";
import { MaintenanceForm } from "@/components/assets/maintenance-form";
import { QRPreviewModal } from "@/components/assets/qr-preview-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AssetStatus } from "@prisma/client";
import { getAvailableTransitions } from "@/lib/fsm";

interface AssetDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: AssetStatus;
  assignedTo: string | null;
  assignedDate: string | null;
  purchaseDate: string | null;
  purchasePrice: string | number | null;
  vendor: string | null;
  warrantyMonths: number | null;
  qrImage: string | null;
  categoryId: string;
  category: { id: string; name: string };
  attributeValue: { values: Record<string, unknown> } | null;
  events: Array<{
    id: string;
    eventType: string;
    fromStatus: string | null;
    toStatus: string | null;
    description: string | null;
    performedBy: string;
    createdAt: string;
  }>;
  maintenanceRecords: Array<{
    id: string;
    type: string;
    description: string;
    cost: string | number | null;
    startDate: string;
    endDate: string | null;
    status: string;
    performedBy: string | null;
  }>;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function formatVND(v: string | number | null): string {
  if (!v) return "—";
  const num = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(num);
}

// Labels resolved via t() in component body
const MAINT_TYPE_KEYS: Record<string, string> = {
  PREVENTIVE: "maint.type.PREVENTIVE",
  CORRECTIVE: "maint.type.CORRECTIVE",
  UPGRADE: "maint.type.UPGRADE",
};

const MAINT_STATUS_KEYS: Record<string, string> = {
  SCHEDULED: "maint.status.SCHEDULED",
  IN_PROGRESS: "maint.status.IN_PROGRESS",
  COMPLETED: "maint.status.COMPLETED",
  CANCELLED: "maint.status.CANCELLED",
};

const MAINT_STATUS_CLASS: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  CANCELLED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: asset, isLoading, error } = useQuery<AssetDetail>({
    queryKey: ["asset", id],
    queryFn: async () => {
      const r = await apiFetch(`/api/assets/${id}`);
      if (!r.ok) throw new Error("Asset not found");
      return r.json();
    },
  });

  const { data: eventsData, refetch: refetchEvents } = useQuery<AssetDetail["events"]>({
    queryKey: ["asset-events", id],
    queryFn: async () => {
      const r = await apiFetch(`/api/assets/${id}/events`);
      if (!r.ok) throw new Error("Failed to load events");
      return r.json();
    },
    enabled: !!asset,
  });

  const { data: maintenanceData } = useQuery<AssetDetail["maintenanceRecords"]>({
    queryKey: ["asset-maintenance", id],
    queryFn: async () => {
      const r = await apiFetch(`/api/assets/${id}/maintenance`);
      if (!r.ok) throw new Error("Failed to load maintenance records");
      return r.json();
    },
    enabled: !!asset,
  });

  const { data: attrDefinitions = [] } = useQuery<Array<{
    id: string; name: string; fieldType: string; required: boolean; options: string | null
  }>>({
    queryKey: ["attribute-definitions", asset?.categoryId],
    queryFn: async () => {
      const r = await apiFetch(`/api/attributes/definitions?categoryId=${asset?.categoryId ?? ""}`);
      if (!r.ok) throw new Error("Failed to load attribute definitions");
      return r.json();
    },
    enabled: !!asset,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);

  const transitions = asset ? getAvailableTransitions(asset.status) : [];

  const handleRecall = async () => {
    setTransitioning(true);
    try {
      const res = await apiFetch(`/api/assets/${id}/recall`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Recall failed");
      }
      toast.success(t("assetDetail.recalled"));
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      refetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("assetDetail.recallFailed"));
    } finally {
      setTransitioning(false);
    }
  };

  const handleStatusChange = async (toStatus: AssetStatus, label: string) => {
    setTransitioning(true);
    try {
      const res = await apiFetch(`/api/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Transition failed");
      }
      toast.success(t("assetDetail.statusChanged"));
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      refetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("assetDetail.transitionFailed"));
    } finally {
      setTransitioning(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      toast.success(t("assetDetail.deleted"));
      router.refresh();
      router.push("/assets");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("assetDetail.deleteFailed"));
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Asset not found or could not be loaded.</AlertDescription>
      </Alert>
    );
  }

  const events = eventsData ?? asset.events ?? [];
  const maintenance = maintenanceData ?? asset.maintenanceRecords ?? [];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/assets" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeftIcon className="h-4 w-4" />
          {t("assets.title")}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{asset.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight truncate">{asset.name}</h2>
            <StatusBadge status={asset.status} />
          </div>
          <p className="text-muted-foreground font-mono text-sm mt-1">{asset.code}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/assets/${id}/edit`}>
            <Button variant="outline" size="sm">
              <EditIcon className="h-4 w-4" />
              {t("common.edit")}
            </Button>
          </Link>

          <Button variant="outline" size="sm" onClick={() => setQrModalOpen(true)}>
            <QrCodeIcon className="h-4 w-4" />
            {t("assetDetail.qr")}
          </Button>

          {transitions.map((t) => {
            if (t.to === AssetStatus.MAINTENANCE) {
              return (
                <MaintenanceForm
                  key={t.to}
                  assetId={id}
                  assetName={asset.name}
                  trigger={
                    <Button variant="outline" size="sm" disabled={transitioning}>
                      <WrenchIcon className="h-4 w-4" />
                      {t.label}
                    </Button>
                  }
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["asset", id] });
                    queryClient.invalidateQueries({ queryKey: ["asset-maintenance", id] });
                    refetchEvents();
                  }}
                />
              );
            }
            if (t.to === AssetStatus.PURCHASED && t.eventType === "RECALLED") {
              return (
                <Button
                  key={`recall-${t.from}`}
                  variant="outline"
                  size="sm"
                  onClick={handleRecall}
                  disabled={transitioning}
                >
                  <Undo2Icon className="h-4 w-4" />
                  {t.label}
                </Button>
              );
            }
            if (t.to === AssetStatus.ASSIGNED) {
              return (
                <AssignDialog
                  key={t.to}
                  assetId={id}
                  assetName={asset.name}
                  trigger={
                    <Button variant="outline" size="sm">
                      <ArrowRightIcon className="h-4 w-4" />
                      {t.label}
                    </Button>
                  }
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["asset", id] });
                    refetchEvents();
                  }}
                />
              );
            }
            if (t.to === AssetStatus.RETIRED) {
              return (
                <Button
                  key={t.to}
                  variant="outline"
                  size="sm"
                  onClick={() => setRetireDialogOpen(true)}
                  disabled={transitioning}
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  {t.label}
                </Button>
              );
            }
            return (
              <Button
                key={t.to}
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(t.to, t.label)}
                disabled={transitioning}
              >
                {t.to === AssetStatus.DISPOSED ? (
                  <Trash2Icon className="h-4 w-4" />
                ) : t.to === AssetStatus.IN_USE ? (
                  <ArrowRightIcon className="h-4 w-4" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
                {t.label}
              </Button>
            );
          })}

          {asset.status === AssetStatus.DISPOSED && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2Icon className="h-4 w-4" />
              {t("common.delete")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t("assetDetail.info")}</TabsTrigger>
          <TabsTrigger value="attributes">{t("assetDetail.attributes")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("assets.timeline")}</TabsTrigger>
          <TabsTrigger value="maintenance">{t("assetDetail.maintenanceTab")} ({maintenance.length})</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("assets.details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  { label: t("common.name"), value: asset.name },
                  { label: t("common.code"), value: asset.code },
                  { label: t("common.category"), value: asset.category.name },
                  { label: t("common.status"), value: <StatusBadge status={asset.status} /> },
                  { label: t("assets.assignedTo"), value: asset.assignedTo ?? "—" },
                  { label: t("assets.purchaseDate"), value: formatDate(asset.purchaseDate) },
                  { label: t("assetDetail.purchasePrice"), value: formatVND(asset.purchasePrice) },
                  { label: t("assetDetail.vendor"), value: asset.vendor ?? "—" },
                  { label: t("assetDetail.warranty"), value: asset.warrantyMonths ? `${asset.warrantyMonths} months` : "—" },
                  { label: t("common.description"), value: asset.description ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</dt>
                    <dd className="text-foreground font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attributes Tab */}
        <TabsContent value="attributes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("assets.customAttributes")}</CardTitle>
            </CardHeader>
            <CardContent>
              {attrDefinitions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t("assets.noAttributes")}
                </p>
              ) : (
                <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {attrDefinitions.map((def) => {
                    const vals = asset.attributeValue?.values ?? {};
                    return (
                      <div key={def.id} className="space-y-1">
                        <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{def.name}</dt>
                        <dd className="font-medium">
                          {vals[def.name] != null ? String(vals[def.name]) : "—"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("assets.timeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AssetTimeline events={events as unknown as Parameters<typeof AssetTimeline>[0]["events"]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Maintenance Records</CardTitle>
              <MaintenanceForm
                assetId={id}
                assetName={asset.name}
                trigger={
                  <Button size="sm">
                    <WrenchIcon className="h-4 w-4" />
                    {t("assetDetail.addRecord")}
                  </Button>
                }
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["asset", id] });
                  queryClient.invalidateQueries({ queryKey: ["asset-maintenance", id] });
                  refetchEvents();
                }}
              />
            </CardHeader>
            <CardContent>
              {maintenance.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <WrenchIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t("assetDetail.noMaintenance")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("common.description")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("assetDetail.startDate")}</TableHead>
                      <TableHead>{t("assetDetail.endDate")}</TableHead>
                      <TableHead>{t("maintForm.costLabel")}</TableHead>
                      <TableHead>{t("assetDetail.performedBy")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <span className="text-xs font-medium">{MAINT_TYPE_KEYS[r.type] ? t(MAINT_TYPE_KEYS[r.type]) : r.type}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{r.description}</TableCell>
                        <TableCell>
                          <span className={`inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium ${MAINT_STATUS_CLASS[r.status] ?? ""}`}>
                            {MAINT_STATUS_KEYS[r.status] ? t(MAINT_STATUS_KEYS[r.status]) : r.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(r.startDate)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(r.endDate)}</TableCell>
                        <TableCell className="font-mono text-sm">{formatVND(r.cost)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{r.performedBy ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <QRPreviewModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        assetName={asset.name}
        assetCode={asset.code}
        qrImage={asset.qrImage}
        assetId={asset.id}
      />
      <ConfirmDialog
        open={retireDialogOpen}
        onOpenChange={setRetireDialogOpen}
        title="Retire Asset"
        description={<>Are you sure you want to retire &quot;{asset.name}&quot; ({asset.code})?<br />This cannot be undone.</>}
        onConfirm={() => {
          setRetireDialogOpen(false);
          handleStatusChange(AssetStatus.RETIRED, "Retired");
        }}
        loading={transitioning}
        confirmLabel="Retire"
        variant="destructive"
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Asset"
        description={<>Are you sure you want to permanently delete &quot;{asset.name}&quot; ({asset.code})?<br />This cannot be undone.</>}
        onConfirm={handleDelete}
        loading={deleting}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
