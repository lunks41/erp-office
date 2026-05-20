"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  EXPIRY_PRIORITY_LABELS,
  type DocumentExpiryPriority,
} from "@/lib/document-expiry-routes"

const priorityStyles: Record<DocumentExpiryPriority, string> = {
  1: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  2: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  3: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
}

export function ExpiryBadge({
  priorityLevel,
  statusName,
  daysUntilExpiry,
  className,
}: {
  priorityLevel?: number
  statusName?: string | null
  daysUntilExpiry?: number
  className?: string
}) {
  const level = Math.min(3, Math.max(1, priorityLevel ?? 1)) as DocumentExpiryPriority
  const label =
    statusName ||
    EXPIRY_PRIORITY_LABELS[level] ||
    (daysUntilExpiry != null
      ? daysUntilExpiry < 0
        ? "Expired"
        : `${daysUntilExpiry}d left`
      : "—")

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", priorityStyles[level], className)}
    >
      {label}
    </Badge>
  )
}
