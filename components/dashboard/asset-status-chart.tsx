"use client";

import { AssetStatus } from "@prisma/client";
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
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-3 w-8 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            </div>
          ))}
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item) => {
          const config = STATUS_CONFIG[item.status];
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;

          return (
            <div key={item.status} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-sm text-foreground">{config.label}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {item.count} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: config.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
