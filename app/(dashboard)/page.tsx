"use client";

import { useQuery } from "@tanstack/react-query";
import { PackageIcon, DollarSignIcon, WrenchIcon, ClockIcon, CalculatorIcon } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AssetStatusChart } from "@/components/dashboard/asset-status-chart";
import { RecentEvents } from "@/components/dashboard/recent-events";
import { MaintenanceCostChart } from "@/components/dashboard/maintenance-cost-chart";
import { AssetValueChart } from "@/components/dashboard/asset-value-chart";
import { AssetStatus } from "@prisma/client";
import { useLanguage } from "@/context/language-context";

interface DashboardData {
  totalAssets: number;
  totalValue: number | string;
  byStatus: { status: AssetStatus; count: number }[];
  maintenanceCostMTD: number | string;
  totalMaintenanceCost: number | string;
  monthlyCosts: { month: string; cost: number }[];
  monthlyAssetValues: { month: string; value: number }[];
  recentEvents: Array<{
    id: string;
    asset?: { id: string; name: string; code: string };
    eventType: string;
    description: string | null;
    createdAt: string;
  }>;
}

function formatVND(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(num);
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const r = await apiFetch("/api/dashboard");
      if (!r.ok) throw new Error("Failed to load dashboard");
      return r.json();
    },
  });

  const totalValue = data?.totalValue ?? 0;
  const maintenanceCost = data?.maintenanceCostMTD ?? 0;
  const totalMaintenance = data?.totalMaintenanceCost ?? 0;
  const pendingCount = (data?.byStatus ?? [])
    .filter((s) => s.status === "MAINTENANCE")
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label={t("kpi.totalAssets")}
          value={isLoading ? "—" : data?.totalAssets ?? 0}
          subtext={t("kpi.activeAssets")}
          icon={<PackageIcon />}
          loading={isLoading}
        />
        <KpiCard
          label={t("kpi.totalValue")}
          value={isLoading ? "—" : formatVND(totalValue)}
          subtext={t("kpi.allAssets")}
          icon={<DollarSignIcon />}
          loading={isLoading}
        />
        <KpiCard
          label={t("kpi.maintenanceCostMTD")}
          value={isLoading ? "—" : formatVND(maintenanceCost)}
          subtext={t("kpi.thisMonth")}
          icon={<WrenchIcon />}
          loading={isLoading}
        />
        <KpiCard
          label={t("kpi.totalMaintenance")}
          value={isLoading ? "—" : formatVND(totalMaintenance)}
          subtext={t("kpi.allTime")}
          icon={<CalculatorIcon />}
          loading={isLoading}
        />
        <KpiCard
          label={t("kpi.inMaintenance")}
          value={isLoading ? "—" : pendingCount}
          subtext={t("kpi.pendingAssets")}
          icon={<ClockIcon />}
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-stretch">
        <div className="lg:col-span-2 [&>*]:h-full">
          <AssetStatusChart
            data={data?.byStatus ?? []}
            loading={isLoading}
          />
        </div>
        <div className="lg:col-span-3 [&>*]:h-full">
          <RecentEvents
            events={(data?.recentEvents ?? []) as DashboardData["recentEvents"]}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Charts: Asset Value & Maintenance Cost */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AssetValueChart
          data={data?.monthlyAssetValues ?? []}
          loading={isLoading}
        />
        <MaintenanceCostChart
          data={data?.monthlyCosts ?? []}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
