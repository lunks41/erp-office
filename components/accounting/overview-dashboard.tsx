"use client"

import type { LucideIcon } from "lucide-react"
import {
  BanknoteArrowDown,
  ClipboardList,
  CreditCard,
  HandCoins,
  Scale,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type OverviewModuleKey = "ar" | "ap" | "cb" | "gl" | "hr" | "operations"
type OverviewTone = "brand" | "positive" | "warning" | "danger" | "neutral"

type OverviewTheme = {
  label: string
  description: string
  icon: LucideIcon
  badgeClassName: string
  iconChipClassName: string
  heroGlowClassName: string
  progressClassName: string
  softClassName: string
  borderClassName: string
}

export const OVERVIEW_MODULE_THEMES: Record<OverviewModuleKey, OverviewTheme> = {
  ar: {
    label: "AR",
    description: "Receivables and collection health",
    icon: HandCoins,
    badgeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
    iconChipClassName:
      "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-900/50",
    heroGlowClassName:
      "from-emerald-500/14 via-teal-500/10 to-transparent dark:from-emerald-500/18 dark:via-teal-500/12",
    progressClassName: "bg-emerald-500",
    softClassName:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300",
    borderClassName: "border-emerald-200/70 dark:border-emerald-900/40",
  },
  ap: {
    label: "AP",
    description: "Payables, suppliers, and outgoing cash",
    icon: CreditCard,
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
    iconChipClassName:
      "bg-amber-500/10 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-900/50",
    heroGlowClassName:
      "from-amber-500/14 via-orange-500/10 to-transparent dark:from-amber-500/18 dark:via-orange-500/12",
    progressClassName: "bg-amber-500",
    softClassName:
      "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300",
    borderClassName: "border-amber-200/70 dark:border-amber-900/40",
  },
  cb: {
    label: "CB",
    description: "Cash, banking, and treasury movements",
    icon: BanknoteArrowDown,
    badgeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
    iconChipClassName:
      "bg-sky-500/10 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-900/50",
    heroGlowClassName:
      "from-sky-500/14 via-cyan-500/10 to-transparent dark:from-sky-500/18 dark:via-cyan-500/12",
    progressClassName: "bg-sky-500",
    softClassName:
      "border-sky-200/80 bg-sky-50/80 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-300",
    borderClassName: "border-sky-200/70 dark:border-sky-900/40",
  },
  gl: {
    label: "GL",
    description: "Ledger balances and accounting controls",
    icon: Scale,
    badgeClassName:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300",
    iconChipClassName:
      "bg-violet-500/10 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-900/50",
    heroGlowClassName:
      "from-violet-500/14 via-indigo-500/10 to-transparent dark:from-violet-500/18 dark:via-indigo-500/12",
    progressClassName: "bg-violet-500",
    softClassName:
      "border-violet-200/80 bg-violet-50/80 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-300",
    borderClassName: "border-violet-200/70 dark:border-violet-900/40",
  },
  operations: {
    label: "Operations",
    description: "Checklists, job orders, and service activity",
    icon: ClipboardList,
    badgeClassName:
      "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/30 dark:text-teal-300",
    iconChipClassName:
      "bg-teal-500/10 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-900/50",
    heroGlowClassName:
      "from-teal-500/14 via-cyan-500/10 to-transparent dark:from-teal-500/18 dark:via-cyan-500/12",
    progressClassName: "bg-teal-500",
    softClassName:
      "border-teal-200/80 bg-teal-50/80 text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/20 dark:text-teal-300",
    borderClassName: "border-teal-200/70 dark:border-teal-900/40",
  },
  hr: {
    label: "HR",
    description: "Workforce, payroll, and people analytics",
    icon: Users,
    badgeClassName:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300",
    iconChipClassName:
      "bg-rose-500/10 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-900/50",
    heroGlowClassName:
      "from-rose-500/14 via-pink-500/10 to-transparent dark:from-rose-500/18 dark:via-pink-500/12",
    progressClassName: "bg-rose-500",
    softClassName:
      "border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300",
    borderClassName: "border-rose-200/70 dark:border-rose-900/40",
  },
}

const TONE_VALUE_CLASSNAME: Record<OverviewTone, string> = {
  brand: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
}

const TONE_BAR_CLASSNAME: Record<OverviewTone, string> = {
  brand: "",
  positive: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
  neutral: "bg-slate-400 dark:bg-slate-500",
}

export type OverviewBarListItem = {
  key: string
  label: string
  value: string
  hint?: string
  progress?: number
  tone?: OverviewTone
}

function clampProgress(progress?: number): number {
  if (!Number.isFinite(progress)) return 0
  return Math.max(0, Math.min(100, progress ?? 0))
}

export function formatOverviewCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0"
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function OverviewPageShell({
  module,
  title,
  description,
  children,
}: {
  module: OverviewModuleKey
  title: string
  description: string
  children: React.ReactNode
}) {
  const theme = OVERVIEW_MODULE_THEMES[module]
  const Icon = theme.icon

  return (
    <div className="@container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <section
        className={cn(
          "relative overflow-hidden rounded-3xl border bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6",
          theme.borderClassName
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-linear-to-l",
            theme.heroGlowClassName
          )}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className={cn("rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em]", theme.badgeClassName)}>
              {theme.label} OVERVIEW
            </Badge>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight sm:text-[2rem]">
                {title}
              </h1>
              <p className="text-muted-foreground max-w-3xl text-sm sm:text-base">
                {description}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl sm:size-16",
              theme.iconChipClassName
            )}
          >
            <Icon className="size-7 sm:size-8" />
          </div>
        </div>
      </section>
      {children}
    </div>
  )
}

export function OverviewMetricGrid({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      {children}
    </div>
  )
}

export function OverviewMetricCard({
  module,
  title,
  value,
  subtitle,
  meta,
  icon: Icon,
  tone = "brand",
}: {
  module: OverviewModuleKey
  title: string
  value: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
  icon: LucideIcon
  tone?: OverviewTone
}) {
  const theme = OVERVIEW_MODULE_THEMES[module]

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              {theme.label}
            </CardDescription>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              theme.iconChipClassName
            )}
          >
            <Icon className="size-4.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={cn(
            "text-2xl font-semibold tracking-tight sm:text-[1.75rem]",
            TONE_VALUE_CLASSNAME[tone]
          )}
        >
          {value}
        </div>
        {subtitle ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {subtitle}
          </p>
        ) : null}
        {meta ? <div className="text-xs font-medium">{meta}</div> : null}
      </CardContent>
    </Card>
  )
}

export function OverviewSectionCard({
  module,
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
}: {
  module: OverviewModuleKey
  title: string
  description?: React.ReactNode
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  const theme = OVERVIEW_MODULE_THEMES[module]

  return (
    <Card className={cn("border-border/70 bg-card/90 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div
              className={cn(
                "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                theme.iconChipClassName
              )}
            >
              <Icon className="size-4" />
            </div>
          ) : null}
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs leading-relaxed">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-3", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

export function OverviewBarList({
  module,
  items,
  emptyMessage,
}: {
  module: OverviewModuleKey
  items: OverviewBarListItem[]
  emptyMessage: string
}) {
  const theme = OVERVIEW_MODULE_THEMES[module]

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const progress = clampProgress(item.progress)
        const toneClassName =
          item.tone && item.tone !== "brand"
            ? TONE_BAR_CLASSNAME[item.tone]
            : theme.progressClassName

        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium">{item.label}</span>
              <span
                className={cn(
                  "shrink-0 font-semibold",
                  item.tone ? TONE_VALUE_CLASSNAME[item.tone] : undefined
                )}
              >
                {item.value}
              </span>
            </div>
            {item.hint ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                {item.hint}
              </p>
            ) : null}
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-[width]",
                  toneClassName
                )}
                style={{ width: `${Math.max(progress, progress > 0 ? 2 : 0)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function OverviewStatChip({
  module,
  children,
}: {
  module: OverviewModuleKey
  children: React.ReactNode
}) {
  const theme = OVERVIEW_MODULE_THEMES[module]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        theme.softClassName
      )}
    >
      {children}
    </span>
  )
}
