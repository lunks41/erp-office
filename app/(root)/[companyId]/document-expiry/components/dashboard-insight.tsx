"use client"

import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

import { getDashboardInsight } from "@/lib/document-expiry-analytics"
import { DashboardSummaryViewModel } from "@/interfaces/document-expiry-view-model"
import { cn } from "@/lib/utils"

export function DashboardInsight({
  summary,
}: {
  summary?: DashboardSummaryViewModel
}) {
  const insight = getDashboardInsight(summary)

  const Icon =
    insight.tone === "critical"
      ? AlertTriangle
      : insight.tone === "warning"
        ? AlertTriangle
        : insight.tone === "ok" && summary?.totalDocuments
          ? CheckCircle2
          : Info

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3",
        insight.tone === "critical" &&
          "border-red-200 bg-red-50/80 dark:border-red-900 dark:bg-red-950/40",
        insight.tone === "warning" &&
          "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/40",
        insight.tone === "ok" &&
          "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          insight.tone === "critical" && "text-red-600",
          insight.tone === "warning" && "text-amber-600",
          insight.tone === "ok" && "text-emerald-600"
        )}
      />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold">{insight.title}</p>
        <p className="text-muted-foreground text-sm">{insight.description}</p>
      </div>
    </div>
  )
}
