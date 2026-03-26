"use client";

import Link from "next/link";
import {
  PlusCircleIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  WrenchIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

interface RecentEvent {
  id: string;
  eventType: string;
  description: string | null;
  createdAt: string;
  asset?: { id: string; name: string; code: string } | null;
}

interface RecentEventsProps {
  events: RecentEvent[];
  loading?: boolean;
}

const EVENT_ICON_MAP: Partial<Record<string, React.ElementType>> = {
  CREATED: PlusCircleIcon,
  STATUS_CHANGE: ArrowRightIcon,
  ASSIGNED: ArrowRightIcon,
  RECALLED: RotateCcwIcon,
  MAINTENANCE_CREATED: WrenchIcon,
  MAINTENANCE_COMPLETED: CheckCircleIcon,
};

export function RecentEvents({ events, loading = false }: RecentEventsProps) {
  const { t } = useLanguage();

  function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t("time.justNow");
    if (diffMins < 60) return t("time.mAgo").replace("{n}", String(diffMins));
    if (diffHours < 24) return t("time.hAgo").replace("{n}", String(diffHours));
    if (diffDays < 30) return t("time.dAgo").replace("{n}", String(diffDays));
    return d.toLocaleDateString();
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("activity.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full animate-pulse bg-muted shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                <div className="h-2 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!events.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("activity.title")}</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("activity.noActivity")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{t("activity.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        {events.map((event) => {
          const Icon = EVENT_ICON_MAP[event.eventType] ?? ClockIcon;
          return (
            <div key={event.id} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  {event.asset ? (
                    <Link
                      href={`/assets/${event.asset.id}`}
                      className="text-sm font-medium text-foreground hover:underline truncate"
                    >
                      {event.asset.code}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      {event.eventType}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {event.description ?? event.eventType}
                  {event.asset && ` — ${event.asset.name}`}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
