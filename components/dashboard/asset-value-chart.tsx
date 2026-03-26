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
import { useLanguage } from "@/context/language-context";

interface MonthlyValue {
  month: string; // "YYYY-MM"
  value: number;
}

interface AssetValueChartProps {
  data: MonthlyValue[];
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

export function AssetValueChart({ data, loading = false }: AssetValueChartProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("chart.assetValue")}</CardTitle>
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
          <CardTitle className="text-base">{t("chart.assetValue")}</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("chart.noData")}
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    value: d.value,
  }));

  const latest = data[data.length - 1];
  const formattedLatest = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(latest.value);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{t("chart.assetValue")}</CardTitle>
        <span className="text-sm font-medium text-muted-foreground">
          {t("chart.latest")}: <span className="text-foreground">{formattedLatest}</span>
        </span>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
            <YAxis tickFormatter={formatVND} tick={{ fontSize: 12 }} className="fill-muted-foreground" width={50} />
            <Tooltip
              formatter={(value) => [
                new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value)),
                t("common.value"),
              ]}
              contentStyle={{ fontSize: 13 }}
            />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#valueGradient)" dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
