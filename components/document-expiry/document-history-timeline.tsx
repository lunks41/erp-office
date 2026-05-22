"use client"

import { format, parseISO } from "date-fns"
import { History } from "lucide-react"

import {
  DocumentHistoryViewModel,
  RenewalHistoryReportRowViewModel,
} from "@/interfaces/document-expiry-view-model"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type TimelineItem = DocumentHistoryViewModel | RenewalHistoryReportRowViewModel

function fmtDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "dd/MM/yyyy HH:mm")
  } catch {
    return value
  }
}

function isHistoryDto(item: TimelineItem): item is DocumentHistoryViewModel {
  return "historyId" in item
}

export function DocumentHistoryTimeline({
  items,
  isLoading,
  className,
}: {
  items: TimelineItem[]
  isLoading?: boolean
  className?: string
}) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <History className="h-4 w-4" />
        No history recorded yet.
      </p>
    )
  }

  return (
    <ol className={cn("relative space-y-4 border-l pl-6", className)}>
      {items.map((item, idx) => {
        const key = isHistoryDto(item)
          ? item.historyId
          : `${item.documentId}-${item.changedDate}-${idx}`
        const action = item.actionType
        const title = isHistoryDto(item)
          ? action
          : `${action} — ${"documentTitle" in item ? item.documentTitle : ""}`

        return (
          <li key={key} className="relative">
            <span className="bg-primary absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full" />
            <div className="text-sm font-medium">{title}</div>
            <div className="text-muted-foreground text-xs">
              {fmtDate(item.changedDate)}
            </div>
            {(item.oldExpiryDate || item.newExpiryDate) && (
              <div className="text-muted-foreground mt-1 text-xs">
                {item.oldExpiryDate && (
                  <span>From {fmtDate(item.oldExpiryDate)} </span>
                )}
                {item.newExpiryDate && (
                  <span>→ {fmtDate(item.newExpiryDate)}</span>
                )}
              </div>
            )}
            {item.remarks && (
              <p className="text-muted-foreground mt-1 text-xs">{item.remarks}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
