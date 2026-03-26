"use client";

import { AssetStatus } from "@prisma/client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CONFIG } from "@/lib/fsm";

interface StatusData {
  status: AssetStatus;
  count: number;
}

interface AssetStatusChartProps {
  data: StatusData[];
  loading?: boolean;
}

export function AssetStatusChart({ data, loading = false }: AssetStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length || total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: STATUS_CONFIG[item.status]?.label ?? item.status,
    value: item.count,
    color: STATUS_CONFIG[item.status]?.color ?? "#94a3b8",
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-4">
          {/* Pie chart */}
          <div className="shrink-0" style={{ width: 220, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={1}
                  strokeWidth={0}
                  label={(props: PieLabelRenderProps) => {
                    const { cx, cy, midAngle, outerRadius: or, percent } = props;
                    const pct = Math.round((percent as number) * 100);
                    if (pct < 5) return null;
                    const RADIAN = Math.PI / 180;
                    const r = (or as number) * 0.65;
                    const x = (cx as number) + r * Math.cos(-((midAngle as number) * RADIAN));
                    const y = (cy as number) + r * Math.sin(-((midAngle as number) * RADIAN));
                    return (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-white text-xs font-medium">
                        {pct}%
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} (${Math.round((Number(value) / total) * 100)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend on the side */}
          <div className="flex flex-col gap-2">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="flex-1 text-foreground">{entry.name}</span>
                <span className="font-mono text-muted-foreground tabular-nums">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
