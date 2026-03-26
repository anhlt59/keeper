"use client";

import { AssetStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/fsm";

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-4xl border px-2 py-0.5 text-xs font-medium transition-all duration-150 hover:shadow-sm hover:opacity-90 cursor-default",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {config.label}
    </span>
  );
}
