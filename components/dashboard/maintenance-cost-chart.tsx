"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyCost {
  month: string; // "YYYY-MM"
  cost: number;
}

interface MaintenanceCostChartProps {
  data: MonthlyCost[];
  loading?: boolean;
}

/** Format month string "2025-10" → "Oct 25" */
function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/** Format VND for axis/tooltip */
function formatVND(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("vi-VN");
}

export function MaintenanceCostChart({ data, loading = false }: MaintenanceCostChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance Costs (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance Costs (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No maintenance data available
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    cost: d.cost,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Maintenance Costs (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <YAxis tickFormatter={formatVND} tick={{ fontSize: 12 }} className="fill-muted-foreground" width={50} />
            <Tooltip
              formatter={(value) => [
                new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value)),
                "Cost",
              ]}
              contentStyle={{ fontSize: 13 }}
            />
            <Area type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} fill="url(#costGradient)" dot={{ r: 4, fill: "#f59e0b" }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
