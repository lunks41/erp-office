"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  AlertTriangle,
  CalendarClock,
  FileCheck,
  FileX,
  RefreshCw,
} from "lucide-react"

import { DashboardSummaryDto } from "@/interfaces/document-expiry"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type CardConfig = {
  key: keyof DashboardSummaryDto
  title: string
  icon: LucideIcon
  href?: string
  accent: string
}

const cards: CardConfig[] = [
  {
    key: "totalDocuments",
    title: "Total Documents",
    icon: FileCheck,
    href: "list",
    accent: "text-primary",
  },
  {
    key: "activeCount",
    title: "Active",
    icon: FileCheck,
    accent: "text-emerald-600",
  },
  {
    key: "expiringCount",
    title: "Expiring Soon",
    icon: CalendarClock,
    href: "list?filter=expiring",
    accent: "text-amber-600",
  },
  {
    key: "expiredCount",
    title: "Expired",
    icon: FileX,
    href: "list?filter=expired",
    accent: "text-red-600",
  },
  {
    key: "critical7DaysCount",
    title: "Critical (7 days)",
    icon: AlertTriangle,
    href: "list?filter=critical",
    accent: "text-red-600",
  },
  {
    key: "renewedThisMonthCount",
    title: "Renewed This Month",
    icon: RefreshCw,
    href: "reports",
    accent: "text-blue-600",
  },
]

export function DashboardCards({
  companyId,
  summary,
  isLoading,
}: {
  companyId: string
  summary?: DashboardSummaryDto
  isLoading?: boolean
}) {
  const reduceMotion = useReducedMotion()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((cfg, index) => {
        const Icon = cfg.icon
        const value = summary ? Number(summary[cfg.key] ?? 0) : 0
        const content = (
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {cfg.title}
              </CardTitle>
              <Icon className={cn("h-4 w-4", cfg.accent)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        )

        const inner = reduceMotion ? (
          content
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {content}
          </motion.div>
        )

        if (!cfg.href) return <div key={cfg.key}>{inner}</div>

        return (
          <Link
            key={cfg.key}
            href={`/${companyId}/document-expiry/${cfg.href}`}
            className="block"
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
