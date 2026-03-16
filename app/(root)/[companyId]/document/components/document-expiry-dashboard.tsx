"use client"

import { IUniversalDocumentHd } from "@/interfaces/universal-documents"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ShieldAlert,
  TrendingDown,
} from "lucide-react"

import {
  useGetExpiredDocuments,
  useGetExpiringDocuments,
  useGetUniversalDocuments,
} from "@/hooks/use-universal-documents"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ─── Helpers ────────────────────────────────────────────────────────────────

const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null
  return Math.ceil(
    (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
}

type ExpiryStatus = "expired" | "critical" | "warning" | "valid" | "none"

const getExpiryStatus = (days: number | null): ExpiryStatus => {
  if (days === null) return "none"
  if (days < 0) return "expired"
  if (days <= 7) return "critical"
  if (days <= 30) return "warning"
  return "valid"
}

const STATUS_CONFIG: Record<
  ExpiryStatus,
  { label: string; className: string }
> = {
  expired: {
    label: "Expired",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  critical: {
    label: "Critical",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  warning: {
    label: "Expiring Soon",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  valid: {
    label: "Valid",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  none: {
    label: "No Expiry",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
}

const formatDaysLabel = (days: number | null): string => {
  if (days === null) return "No expiry set"
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return "Expires today"
  return `${days}d remaining`
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: number
  sub: string
  icon: React.ReactNode
  accent: string // tailwind border-l color
  valueColor?: string
}

function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
  valueColor = "text-foreground",
}: StatCardProps) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {title}
            </p>
            <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
            <p className="text-muted-foreground text-xs">{sub}</p>
          </div>
          <div className="text-muted-foreground mt-1">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Risk Bar ────────────────────────────────────────────────────────────────

interface RiskBarProps {
  label: string
  count: number
  total: number
  barColor: string
  textColor: string
}

function RiskBar({ label, count, total, barColor, textColor }: RiskBarProps) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${textColor}`}>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {count} / {total} &nbsp;
          <span className="text-xs">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function DocumentExpiryDashboard() {
  const { data: allRes } = useGetUniversalDocuments()
  const { data: expiringRes } = useGetExpiringDocuments(30)
  const { data: expiredRes } = useGetExpiredDocuments()

  const toArray = (res: unknown): IUniversalDocumentHd[] => {
    if (Array.isArray(res)) return res
    const r = res as { data?: unknown } | null
    if (r?.data && Array.isArray(r.data)) return r.data as IUniversalDocumentHd[]
    return []
  }

  const all = toArray(allRes)
  const expiring = toArray(expiringRes)
  const expired = toArray(expiredRes)

  const totalDetails = all.reduce(
    (n, d) => n + (d.data_details?.length ?? 0),
    0
  )
  const verifiedCount = all.filter((d) =>
    d.data_details?.some((dt) => dt.renewalRequired === false)
  ).length
  const criticalCount = expiring.filter((d) => {
    const earliest = d.data_details
      ?.filter((dt) => dt.expiryOn)
      .sort(
        (a, b) =>
          new Date(a.expiryOn!).getTime() - new Date(b.expiryOn!).getTime()
      )[0]
    const days = getDaysUntilExpiry(earliest?.expiryOn ?? null)
    return days !== null && days >= 0 && days <= 7
  }).length

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={all.length}
          sub={`${totalDetails} total entries`}
          icon={<FileText className="h-5 w-5" />}
          accent="border-l-blue-500"
        />
        <StatCard
          title="Expiring Within 30d"
          value={expiring.length}
          sub={`${criticalCount} critical (≤ 7 days)`}
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          accent="border-l-yellow-500"
          valueColor="text-yellow-600"
        />
        <StatCard
          title="Expired"
          value={expired.length}
          sub="Past expiry date"
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          accent="border-l-red-500"
          valueColor="text-red-600"
        />
        <StatCard
          title="Verified"
          value={verifiedCount}
          sub="No renewal required"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          accent="border-l-green-500"
          valueColor="text-green-600"
        />
      </div>

      {/* ── Risk Assessment + Expiry List ─────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk Assessment */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-muted-foreground h-4 w-4" />
              <CardTitle className="text-sm font-semibold">
                Compliance Overview
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Document health at a glance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RiskBar
              label="Expired"
              count={expired.length}
              total={all.length}
              barColor="bg-red-500"
              textColor="text-red-600"
            />
            <RiskBar
              label="Expiring Soon"
              count={expiring.length}
              total={all.length}
              barColor="bg-yellow-400"
              textColor="text-yellow-600"
            />
            <RiskBar
              label="Verified"
              count={verifiedCount}
              total={all.length}
              barColor="bg-green-500"
              textColor="text-green-600"
            />

            {all.length === 0 && (
              <p className="text-muted-foreground py-2 text-center text-sm">
                No data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-sm font-semibold">
                Upcoming Expirations
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Documents requiring attention within 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiring.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs">No documents expiring within 30 days</p>
              </div>
            ) : (
              <div className="divide-y">
                {expiring.slice(0, 6).map((doc) => {
                  const earliest = doc.data_details
                    ?.filter((dt) => dt.expiryOn)
                    .sort(
                      (a, b) =>
                        new Date(a.expiryOn!).getTime() -
                        new Date(b.expiryOn!).getTime()
                    )[0]

                  const days = getDaysUntilExpiry(earliest?.expiryOn ?? null)
                  const status = getExpiryStatus(days)
                  const cfg = STATUS_CONFIG[status]

                  return (
                    <div
                      key={doc.documentId}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {doc.documentName ||
                            `Document #${doc.documentId}`}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {doc.entityTypeName} &middot;{" "}
                          {doc.data_details?.length ?? 0} entries
                        </p>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${cfg.className}`}
                        >
                          {cfg.label}
                        </Badge>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {formatDaysLabel(days)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {expiring.length > 6 && (
                  <p className="text-muted-foreground pt-2 text-center text-xs">
                    +{expiring.length - 6} more documents
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Expired Documents ────────────────────────── */}
      {expired.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm font-semibold text-red-600">
                Expired Documents — Action Required
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              These documents have passed their expiry date and need immediate
              renewal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {expired.slice(0, 5).map((doc) => {
                const earliest = doc.data_details
                  ?.filter((dt) => dt.expiryOn)
                  .sort(
                    (a, b) =>
                      new Date(a.expiryOn!).getTime() -
                      new Date(b.expiryOn!).getTime()
                  )[0]
                const days = getDaysUntilExpiry(earliest?.expiryOn ?? null)

                return (
                  <div
                    key={doc.documentId}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {doc.documentName || `Document #${doc.documentId}`}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {doc.entityTypeName} &middot;{" "}
                        {doc.data_details?.length ?? 0} entries
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className="border-red-200 bg-red-100 text-xs text-red-700"
                      >
                        Expired
                      </Badge>
                      <span className="text-xs font-medium text-red-500 tabular-nums">
                        {formatDaysLabel(days)}
                      </span>
                    </div>
                  </div>
                )
              })}
              {expired.length > 5 && (
                <p className="text-muted-foreground pt-2 text-center text-xs">
                  +{expired.length - 5} more expired
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
