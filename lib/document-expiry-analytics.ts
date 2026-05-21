import type { ChartConfig } from "@/components/ui/chart"
import {
  DashboardSummaryDto,
  DocumentDto,
} from "@/interfaces/document-expiry"

export type DocumentExpiryBarItem = {
  label: string
  value: number
  colorClass: string
  hint?: string
  /** Stable key for shadcn chart config (--color-{key}) */
  chartKey: string
}

export type DocumentExpiryChartRow = {
  label: string
  shortLabel: string
  value: number
  chartKey: string
  fill: string
  hint?: string
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

function slugKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32)
}

function shortLabel(label: string, max = 14): string {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}…`
}

function toChartRows(items: DocumentExpiryBarItem[]): DocumentExpiryChartRow[] {
  return items.map((item, i) => ({
    label: item.label,
    shortLabel: shortLabel(item.label),
    value: item.value,
    chartKey: item.chartKey || slugKey(item.label) || `item_${i}`,
    fill: `var(--color-${item.chartKey || slugKey(item.label) || `item_${i}`})`,
    hint: item.hint,
  }))
}

export function buildChartConfigFromRows(
  rows: DocumentExpiryChartRow[]
): ChartConfig {
  const config: ChartConfig = {
    value: { label: "Documents" },
  }
  rows.forEach((row, i) => {
    config[row.chartKey] = {
      label: row.label,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }
  })
  return config
}

export function toChartData(rows: DocumentExpiryChartRow[]) {
  return rows.map((row) => ({
    label: row.shortLabel,
    fullLabel: row.label,
    value: row.value,
    fill: row.fill,
    chartKey: row.chartKey,
    hint: row.hint,
  }))
}

export { toChartRows }

const UNCATEGORIZED = "Uncategorized"

function countByLabel(
  docs: DocumentDto[],
  pickLabel: (doc: DocumentDto) => string | null | undefined
): DocumentExpiryBarItem[] {
  const map = new Map<string, number>()
  for (const doc of docs) {
    const label = pickLabel(doc)?.trim() || UNCATEGORIZED
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([label, value]) => ({
      label,
      value,
      colorClass: "bg-primary",
      chartKey: slugKey(label),
    }))
    .sort((a, b) => b.value - a.value)
}

export function buildStatusBarsFromSummary(
  summary: DashboardSummaryDto
): DocumentExpiryBarItem[] {
  const total = Math.max(summary.totalDocuments, 1)
  return [
    {
      label: "Active",
      value: summary.activeCount,
      colorClass: "bg-emerald-500",
      chartKey: "active",
      hint: `${Math.round((summary.activeCount / total) * 100)}%`,
    },
    {
      label: "Expiring soon",
      value: summary.expiringCount,
      colorClass: "bg-amber-500",
      chartKey: "expiring",
      hint: `${Math.round((summary.expiringCount / total) * 100)}%`,
    },
    {
      label: "Next 30 days",
      value: summary.expiring30DaysCount,
      colorClass: "bg-orange-500",
      chartKey: "next_30",
      hint: "8–30 days left",
    },
    {
      label: "Critical (7 days)",
      value: summary.critical7DaysCount,
      colorClass: "bg-red-600",
      chartKey: "critical",
      hint: "Due within a week",
    },
    {
      label: "Expired",
      value: summary.expiredCount,
      colorClass: "bg-red-400",
      chartKey: "expired",
      hint: `${Math.round((summary.expiredCount / total) * 100)}%`,
    },
    {
      label: "Renewed this month",
      value: summary.renewedThisMonthCount,
      colorClass: "bg-blue-500",
      chartKey: "renewed",
      hint: "Recently renewed",
    },
  ].filter((item) => item.value > 0 || summary.totalDocuments === 0)
}

export function buildCategoryBars(docs: DocumentDto[]): DocumentExpiryBarItem[] {
  const colors = [
    "bg-violet-500",
    "bg-indigo-500",
    "bg-sky-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-primary",
  ]
  return countByLabel(docs, (d) => d.documentCategoryName).map((item, i) => ({
    ...item,
    chartKey: item.chartKey || `cat_${i}`,
    colorClass: colors[i % colors.length] ?? "bg-primary",
  }))
}

export function buildTypeBars(docs: DocumentDto[]): DocumentExpiryBarItem[] {
  const colors = [
    "bg-rose-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-amber-500",
    "bg-lime-500",
    "bg-emerald-500",
  ]
  return countByLabel(docs, (d) => d.documentTypeName).map((item, i) => ({
    ...item,
    chartKey: item.chartKey || `type_${i}`,
    colorClass: colors[i % colors.length] ?? "bg-primary",
  }))
}

export function buildReferenceTypeBars(
  docs: DocumentDto[]
): DocumentExpiryBarItem[] {
  return countByLabel(docs, (d) => d.referenceTypeName).map((item) => ({
    ...item,
    colorClass: "bg-slate-500",
  }))
}

export function buildMandatoryBars(docs: DocumentDto[]): DocumentExpiryBarItem[] {
  const mandatory = docs.filter((d) => d.isMandatory).length
  const optional = docs.length - mandatory
  return [
    {
      label: "Mandatory",
      value: mandatory,
      colorClass: "bg-red-500",
      chartKey: "mandatory",
      hint: "Compliance required",
    },
    {
      label: "Optional",
      value: optional,
      colorClass: "bg-slate-400",
      chartKey: "optional",
      hint: "Informational",
    },
  ].filter((item) => item.value > 0)
}

export interface ExpiryTimelineItem {
  month: string
  total: number
  critical: number
  monthKey: string
}

export function buildExpiryTimeline(docs: DocumentDto[]): ExpiryTimelineItem[] {
  const now = new Date()
  const items: ExpiryTimelineItem[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const month = d.toLocaleString("en", { month: "short" })
    const yr = String(d.getFullYear()).slice(-2)
    items.push({
      month: `${month} '${yr}`,
      total: 0,
      critical: 0,
      monthKey: `${d.getFullYear()}-${d.getMonth()}`,
    })
  }
  for (const doc of docs) {
    if (!doc.expiryDate) continue
    try {
      const expiry = new Date(doc.expiryDate)
      const key = `${expiry.getFullYear()}-${expiry.getMonth()}`
      const slot = items.find((m) => m.monthKey === key)
      if (slot) {
        slot.total++
        if (doc.priorityLevel >= 3) slot.critical++
      }
    } catch {
      /* skip */
    }
  }
  return items
}

export function getDashboardInsight(summary?: DashboardSummaryDto): {
  tone: "ok" | "warning" | "critical"
  title: string
  description: string
} {
  if (!summary || summary.totalDocuments === 0) {
    return {
      tone: "ok",
      title: "No documents yet",
      description:
        "Add your first license or certificate to start tracking expiry dates and reminders.",
    }
  }
  if (summary.expiredCount > 0) {
    return {
      tone: "critical",
      title: `${summary.expiredCount} document${summary.expiredCount === 1 ? "" : "s"} expired`,
      description:
        "Renew or archive expired items to stay compliant. Critical and expiring lists are updated below.",
    }
  }
  if (summary.critical7DaysCount > 0) {
    return {
      tone: "critical",
      title: `${summary.critical7DaysCount} due within 7 days`,
      description:
        "Prioritize renewals in the critical list. Configure reminder rules to notify owners before expiry.",
    }
  }
  if (summary.expiringCount > 0) {
    return {
      tone: "warning",
      title: `${summary.expiringCount} expiring soon`,
      description:
        "Review the expiring-soon table and plan renewals before documents move to expired status.",
    }
  }
  return {
    tone: "ok",
    title: "Portfolio is in good shape",
    description: `${summary.activeCount} active document${summary.activeCount === 1 ? "" : "s"} with no urgent expiry actions right now.`,
  }
}
