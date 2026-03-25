"use client";

import { AssetEventType } from "@prisma/client";
import {
  PlusCircleIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  WrenchIcon,
  CheckCircleIcon,
  Trash2Icon,
  RefreshCwIcon,
  EditIcon,
  ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/fsm";

interface TimelineEvent {
  id: string;
  eventType: AssetEventType;
  fromStatus?: string | null;
  toStatus?: string | null;
  description?: string | null;
  performedBy?: string | null;
  performedByName?: string | null;
  createdAt: string | Date;
}

interface AssetTimelineProps {
  events: TimelineEvent[];
}

const EVENT_ICON_MAP: Partial<Record<AssetEventType, React.ElementType>> = {
  CREATED: PlusCircleIcon,
  STATUS_CHANGE: ArrowRightIcon,
  ASSIGNED: ArrowRightIcon,
  RECALLED: RotateCcwIcon,
  MAINTENANCE_CREATED: WrenchIcon,
  MAINTENANCE_COMPLETED: CheckCircleIcon,
  ATTRIBUTE_UPDATED: EditIcon,
  DISPOSED: Trash2Icon,
  RESTORED: RefreshCwIcon,
};

const EVENT_COLOR_MAP: Partial<Record<AssetEventType, string>> = {
  CREATED: "text-blue-500 bg-blue-50",
  STATUS_CHANGE: "text-slate-500 bg-slate-50",
  ASSIGNED: "text-violet-500 bg-violet-50",
  RECALLED: "text-amber-500 bg-amber-50",
  MAINTENANCE_CREATED: "text-amber-500 bg-amber-50",
  MAINTENANCE_COMPLETED: "text-emerald-500 bg-emerald-50",
  ATTRIBUTE_UPDATED: "text-slate-500 bg-slate-50",
  DISPOSED: "text-red-500 bg-red-50",
  RESTORED: "text-blue-500 bg-blue-50",
};

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function StatusChangeDescription(event: TimelineEvent): string {
  if (event.fromStatus && event.toStatus) {
    const from = STATUS_CONFIG[event.fromStatus]?.label ?? event.fromStatus;
    const to = STATUS_CONFIG[event.toStatus]?.label ?? event.toStatus;
    return `${from} → ${to}`;
  }
  return event.description ?? "Status changed";
}

export function AssetTimeline({ events }: AssetTimelineProps) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <ClockIcon className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const Icon = EVENT_ICON_MAP[event.eventType] ?? ClockIcon;
        const colorClass = EVENT_COLOR_MAP[event.eventType] ?? "text-slate-400 bg-slate-50";

        const description =
          event.eventType === "STATUS_CHANGE" || event.eventType === "ASSIGNED" || event.eventType === "RECALLED"
            ? StatusChangeDescription(event)
            : event.description ?? event.eventType;

        return (
          <div key={event.id} className="flex gap-3 relative">
            {/* Connector line */}
            {index < events.length - 1 && (
              <div className="absolute left-4 top-9 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "shrink-0 flex h-8 w-8 rounded-full items-center justify-center z-10 mt-0.5",
                colorClass
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {description}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(event.createdAt)}
                </span>
              </div>
              {event.performedByName && event.performedByName !== "system" && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {event.performedByName}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
