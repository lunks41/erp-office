"use client"

import { Badge } from "@/components/ui/badge"
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type NotificationPriority,
} from "@/lib/notification-routes"
import { cn } from "@/lib/utils"

export function NotificationPriorityBadge({
  level = 1,
  className,
}: {
  level?: number
  className?: string
}) {
  const p = (Math.min(3, Math.max(1, level)) as NotificationPriority)
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 text-[10px] text-white",
        PRIORITY_COLORS[p],
        className
      )}
    >
      {PRIORITY_LABELS[p]}
    </Badge>
  )
}
