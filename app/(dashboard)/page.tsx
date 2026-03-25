"use client";

import { useQuery } from "@tanstack/react-query";
import { PackageIcon, DollarSignIcon, WrenchIcon, ClockIcon } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AssetStatusChart } from "@/components/dashboard/asset-status-chart";
import { RecentEvents } from "@/components/dashboard/recent-events";
import { AssetStatus } from "@prisma/client";

interface DashboardData {
  totalAssets: number;
  totalValue: number | string;
  byStatus: { status: AssetStatus; count: number }[];
  maintenanceCostMTD: number | string;
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
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard", { credentials: "include" }).then((r) => {
      if (!r.ok) throw new Error("Failed to load dashboard");
      return r.json();
    }),
  });

  const totalValue = data?.totalValue ?? 0;
  const maintenanceCost = data?.maintenanceCostMTD ?? 0;
  const pendingCount = (data?.byStatus ?? [])
    .filter((s) => s.status === "MAINTENANCE")
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Assets"
          value={isLoading ? "—" : data?.totalAssets ?? 0}
          subtext="Active assets"
          icon={<PackageIcon />}
          loading={isLoading}
        />
        <KpiCard
          label="Total Value"
          value={isLoading ? "—" : formatVND(totalValue)}
          subtext="All assets"
          icon={<DollarSignIcon />}
          loading={isLoading}
        />
        <KpiCard
          label="Maintenance Cost (MTD)"
          value={isLoading ? "—" : formatVND(maintenanceCost)}
          subtext="This month"
          icon={<WrenchIcon />}
          loading={isLoading}
        />
        <KpiCard
          label="In Maintenance"
          value={isLoading ? "—" : pendingCount}
          subtext="Pending assets"
          icon={<ClockIcon />}
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <AssetStatusChart
          data={data?.byStatus ?? []}
          loading={isLoading}
        />
        <RecentEvents
          events={(data?.recentEvents ?? []) as DashboardData["recentEvents"]}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
