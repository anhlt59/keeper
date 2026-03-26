import { AssetStatus, AssetEventType } from "@prisma/client";

// FSM state machine for asset lifecycle
// States: AVAILABLE → ASSIGNED ↔ MAINTENANCE → RETIRED → DISPOSED
// RECALLED: ASSIGNED → AVAILABLE  RESTORED: DISPOSED → RETIRED

export type FSMTransition = {
  from: AssetStatus;
  to: AssetStatus;
  eventType: AssetEventType;
  label: string;
};

// Allowed transitions with event types
export const ASSET_TRANSITIONS: FSMTransition[] = [
  // Available → assign
  { from: AssetStatus.AVAILABLE, to: AssetStatus.ASSIGNED, eventType: AssetEventType.ASSIGNED, label: "Assign to employee/department" },
  // Assigned → maintenance
  { from: AssetStatus.ASSIGNED, to: AssetStatus.MAINTENANCE, eventType: AssetEventType.MAINTENANCE_CREATED, label: "Send to maintenance" },
  // Maintenance → assigned (back from maintenance)
  { from: AssetStatus.MAINTENANCE, to: AssetStatus.ASSIGNED, eventType: AssetEventType.MAINTENANCE_COMPLETED, label: "Maintenance complete" },
  // Assigned → retired
  { from: AssetStatus.ASSIGNED, to: AssetStatus.RETIRED, eventType: AssetEventType.STATUS_CHANGE, label: "Retire asset" },
  // Available → retired
  { from: AssetStatus.AVAILABLE, to: AssetStatus.RETIRED, eventType: AssetEventType.STATUS_CHANGE, label: "Retire asset" },
  // Retired → disposed
  { from: AssetStatus.RETIRED, to: AssetStatus.DISPOSED, eventType: AssetEventType.DISPOSED, label: "Dispose asset" },
  // Disposed → retired (restore)
  { from: AssetStatus.DISPOSED, to: AssetStatus.RETIRED, eventType: AssetEventType.RESTORED, label: "Restore from disposal" },
  // Recall: ASSIGNED → AVAILABLE
  { from: AssetStatus.ASSIGNED, to: AssetStatus.AVAILABLE, eventType: AssetEventType.RECALLED, label: "Recall (unassign)" },
];

export function canTransition(
  from: AssetStatus,
  to: AssetStatus
): FSMTransition | undefined {
  return ASSET_TRANSITIONS.find((t) => t.from === from && t.to === to);
}

export function getAvailableTransitions(
  currentStatus: AssetStatus
): FSMTransition[] {
  return ASSET_TRANSITIONS.filter((t) => t.from === currentStatus);
}

/**
 * Validate a status transition. Throws if invalid.
 */
export function validateTransition(from: AssetStatus, to: AssetStatus): FSMTransition {
  const transition = canTransition(from, to);
  if (!transition) {
    throw new Error(
      `Invalid FSM transition: '${from}' → '${to}'. ` +
      `Available transitions from '${from}': ${getAvailableTransitions(from).map(t => t.to).join(", ") || "none"}.`
    );
  }
  return transition;
}

/**
 * Derive AssetEventType from a status change transition.
 */
export function buildEventType(transition: FSMTransition): AssetEventType {
  return transition.eventType;
}

// Status display config
export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  AVAILABLE: {
    label: "Available",
    color: "#3b82f6",
    bgClass: "bg-blue-50 dark:bg-blue-950",
    textClass: "text-blue-700 dark:text-blue-300",
  },
  ASSIGNED: {
    label: "Assigned",
    color: "#8b5cf6",
    bgClass: "bg-violet-50 dark:bg-violet-950",
    textClass: "text-violet-700 dark:text-violet-300",
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: "#f59e0b",
    bgClass: "bg-amber-50 dark:bg-amber-950",
    textClass: "text-amber-700 dark:text-amber-300",
  },
  RETIRED: {
    label: "Retired",
    color: "#64748b",
    bgClass: "bg-slate-100 dark:bg-slate-800",
    textClass: "text-slate-600 dark:text-slate-300",
  },
  DISPOSED: {
    label: "Disposed",
    color: "#ef4444",
    bgClass: "bg-red-50 dark:bg-red-950",
    textClass: "text-red-700 dark:text-red-300",
  },
};
