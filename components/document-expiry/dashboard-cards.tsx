"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertTriangle,
  CalendarClock,
  FileCheck,
  FileX,
  RefreshCw,
} from "lucide-react"

import { DashboardSummaryDto } from "@/interfaces/document-expiry"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type CardConfig = {
  key: keyof DashboardSummaryDto
  title: string
  icon: LucideIcon
  href?: string
  iconBg: string
  iconColor: string
  valueColor: string
}

const cards: CardConfig[] = [
  {
    key: "totalDocuments",
    title: "Total",
    icon: FileCheck,
    href: "list",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    valueColor: "text-foreground",
  },
  {
    key: "activeCount",
    title: "Active",
    icon: FileCheck,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-700 dark:text-emerald-400",
  },
  {
    key: "expiringCount",
    title: "Expiring",
    icon: CalendarClock,
    href: "list?filter=expiring",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    valueColor: "text-amber-700 dark:text-amber-400",
  },
  {
    key: "expiring30DaysCount",
    title: "30 Days",
    icon: CalendarClock,
    href: "list?filter=expiring",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600",
    valueColor: "text-orange-700 dark:text-orange-400",
  },
  {
    key: "expiredCount",
    title: "Expired",
    icon: FileX,
    href: "list?filter=expired",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600",
    valueColor: "text-red-700 dark:text-red-400",
  },
  {
    key: "critical7DaysCount",
    title: "Critical",
    icon: AlertTriangle,
    href: "list?filter=critical",
    iconBg: "bg-red-600/10",
    iconColor: "text-red-700",
    valueColor: "text-red-700 dark:text-red-400",
  },
  {
    key: "renewedThisMonthCount",
    title: "Renewed",
    icon: RefreshCw,
    href: "reports",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    valueColor: "text-blue-700 dark:text-blue-400",
  },
]

function cardSubtitle(
  key: keyof DashboardSummaryDto,
  summary: DashboardSummaryDto
): string {
  const total = Math.max(summary.totalDocuments, 1)
  switch (key) {
    case "totalDocuments":
      return "In system"
    case "activeCount":
      return `${Math.round((summary.activeCount / total) * 100)}% portfolio`
    case "expiringCount":
      return "Soon"
    case "expiring30DaysCount":
      return "8–30 days"
    case "expiredCount":
      return "Action needed"
    case "critical7DaysCount":
      return "≤ 7 days"
    case "renewedThisMonthCount":
      return "This month"
    default:
      return ""
  }
}

export function DashboardCards({
  summary,
  isLoading,
}: {
  summary?: DashboardSummaryDto
  isLoading?: boolean
}) {
  const companyId = useParams().companyId as string
  const base = `/${companyId}/document-expiry`
  const reduceMotion = useReducedMotion()

  const rowClass =
    "flex w-full min-w-0 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] sm:overflow-visible"

  if (isLoading) {
    return (
      <div className={rowClass}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-20 min-w-22 flex-1 shrink-0 rounded-xl sm:min-w-0"
          />
        ))}
      </div>
    )
  }

  return (
    <div className={rowClass}>
      {cards.map((cfg, index) => {
        const Icon = cfg.icon
        const value = summary ? Number(summary[cfg.key] ?? 0) : 0
        const subtitle = summary ? cardSubtitle(cfg.key, summary) : ""

        const isAlert =
          (cfg.key === "critical7DaysCount" || cfg.key === "expiredCount") &&
          value > 0

        const content = (
          <Card
            className={cn(
              "h-full gap-0 py-0 transition-all hover:shadow-md",
              isAlert && "ring-destructive/30 ring-1"
            )}
          >
            <CardContent className="flex flex-col gap-1.5 px-3 py-2.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-muted-foreground truncate text-[11px] font-medium leading-tight">
                  {cfg.title}
                </span>
                <div className={cn("shrink-0 rounded-md p-1", cfg.iconBg)}>
                  <Icon className={cn("h-3 w-3", cfg.iconColor)} />
                </div>
              </div>
              <div className={cn("text-xl leading-none font-bold tabular-nums", cfg.valueColor)}>
                {value}
              </div>
              {subtitle && (
                <p className="text-muted-foreground truncate text-[10px] leading-tight">
                  {subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        )

        const wrapper = reduceMotion ? (
          content
        ) : (
          <motion.div
            className="min-w-22 flex-1 shrink-0 basis-0 sm:min-w-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
          >
            {content}
          </motion.div>
        )

        if (!cfg.href) {
          return (
            <div
              key={cfg.key}
              className="min-w-22 flex-1 shrink-0 basis-0 sm:min-w-0"
            >
              {wrapper}
            </div>
          )
        }

        return (
          <Link
            key={cfg.key}
            href={`${base}/${cfg.href}`}
            className="min-w-22 flex-1 shrink-0 basis-0 sm:min-w-0"
          >
            {wrapper}
          </Link>
        )
      })}
    </div>
  )
}
