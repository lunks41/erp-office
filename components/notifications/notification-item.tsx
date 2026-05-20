"use client"

import Link from "next/link"
import { Info, AlertTriangle, AlertCircle, ClipboardCheck } from "lucide-react"
import { NotificationPriorityBadge } from "@/components/notifications/notification-priority-badge"
import type { NotificationHistoryItem } from "@/stores/notification-store"
import { cn } from "@/lib/utils"

const TYPE_CONFIG = {
  error: { icon: AlertCircle, iconClass: "text-red-500", bgClass: "bg-red-50/80 dark:bg-red-950/30" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-500", bgClass: "bg-amber-50/80 dark:bg-amber-950/30" },
  info: { icon: Info, iconClass: "text-blue-500", bgClass: "bg-blue-50/80 dark:bg-blue-950/30" },
  success: { icon: Info, iconClass: "text-emerald-500", bgClass: "bg-emerald-50/80 dark:bg-emerald-950/30" },
  approval: { icon: ClipboardCheck, iconClass: "text-violet-500", bgClass: "bg-violet-50/80 dark:bg-violet-950/30" },
} as const

function formatRelative(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (diff < 60_000) return "just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

export function NotificationItem({
  item,
  onMarkRead,
  showPriority,
}: {
  item: NotificationHistoryItem
  onMarkRead?: (id: string, notificationId: number) => void
  showPriority?: boolean
}) {
  const cfg = TYPE_CONFIG[item.type]
  const Icon = cfg.icon
  const content = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onMarkRead?.(item.id, item.notificationId)}
      onKeyDown={(e) => e.key === "Enter" && onMarkRead?.(item.id, item.notificationId)}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60",
        !item.read && cfg.bgClass
      )}
    >
      {!item.read && (
        <span className="absolute right-2.5 top-3 h-1.5 w-1.5 rounded-full bg-primary" />
      )}
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.iconClass)} />
      <div className="min-w-0 flex-1 pr-4">
        <div className="mb-0.5 flex flex-wrap items-center gap-2">
          {item.title ? (
            <p className="text-xs font-semibold text-foreground">{item.title}</p>
          ) : null}
          {showPriority && item.priorityLevel ? (
            <NotificationPriorityBadge level={item.priorityLevel} />
          ) : null}
        </div>
        <p
          className={cn(
            "text-xs leading-snug",
            item.read ? "text-muted-foreground" : "font-medium text-foreground"
          )}
        >
          {item.message}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {formatRelative(item.createdAt)}
        </p>
      </div>
    </div>
  )

  if (item.actionUrl) {
    return (
      <Link href={item.actionUrl} className="block" onClick={() => onMarkRead?.(item.id, item.notificationId)}>
        {content}
      </Link>
    )
  }
  return content
}
