"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  TrendingUp,
  XCircle,
} from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDashboardRoutes } from "@/lib/overview-dashboard-routes"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Generic helpers (same pattern as other overview pages) ─────────────────
type AnyRecord = Record<string, unknown>
const isRecord = (v: unknown): v is AnyRecord =>
  typeof v === "object" && v !== null

const firstDefined = (...values: unknown[]): unknown =>
  values.find((v) => v !== undefined && v !== null)

const asRecord = (v: unknown): AnyRecord => (isRecord(v) ? v : {})

const asArray = <T,>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[]
  if (isRecord(v)) {
    for (const key of ["items", "rows", "results", "data", "list", "submissions"]) {
      if (Array.isArray((v as AnyRecord)[key])) return (v as AnyRecord)[key] as T[]
    }
  }
  return []
}

const unwrap = (payload: unknown): unknown => {
  if (!isRecord(payload)) return payload
  return firstDefined(payload.data, payload.result, payload.payload, payload)
}

const asNumber = (v: unknown): number =>
  Number.isFinite(Number(v)) ? Number(v) : 0

const asString = (v: unknown): string =>
  typeof v === "string" ? v : String(v ?? "")

const formatDate = (v: unknown): string => {
  const raw = asString(v)
  if (!raw) return "—"
  const d = new Date(raw)
  return isNaN(d.getTime()) ? raw : d.toLocaleString("en-GB")
}

// ─── Types ───────────────────────────────────────────────────────────────────
type EInvoicingKpi = {
  totalSubmitted: number
  pending: number
  valid: number
  rejected: number
  successRate: number
  todayCount: number
}

type StatusBucket = { status: string; count: number }

type Submission = {
  documentNo: string
  invoiceNo: string
  customerName: string
  amount: number
  status: string
  submittedAt: string
}

// ─── Normalizers ─────────────────────────────────────────────────────────────
const normalizeKpi = (payload: unknown): EInvoicingKpi => {
  const d = asRecord(unwrap(payload))
  const total = asNumber(firstDefined(d.totalSubmitted, d.total, d.totalCount))
  const valid = asNumber(firstDefined(d.valid, d.validCount, d.approved))
  const rejected = asNumber(firstDefined(d.rejected, d.rejectedCount, d.failed))
  const pending = asNumber(firstDefined(d.pending, d.pendingCount, d.inProgress))
  const rate = total > 0 ? Math.round((valid / total) * 100) : 0
  return {
    totalSubmitted: total,
    valid,
    rejected,
    pending,
    successRate: asNumber(firstDefined(d.successRate, d.validRate, rate)),
    todayCount: asNumber(firstDefined(d.todayCount, d.today, d.todaySubmissions)),
  }
}

const normalizeStatusSummary = (payload: unknown): StatusBucket[] =>
  asArray<AnyRecord>(unwrap(payload)).map((row) => ({
    status: asString(firstDefined(row.status, row.label, row.name)) || "Unknown",
    count: asNumber(firstDefined(row.count, row.total, row.value)),
  }))

const normalizeSubmissions = (payload: unknown): Submission[] =>
  asArray<AnyRecord>(unwrap(payload)).map((row) => ({
    documentNo: asString(firstDefined(row.documentNo, row.docNo, row.uuid)),
    invoiceNo: asString(firstDefined(row.invoiceNo, row.referenceNo, row.internalId)),
    customerName:
      asString(firstDefined(row.customerName, row.buyer, row.supplierName)) ||
      "Unknown",
    amount: asNumber(firstDefined(row.amount, row.total, row.totalAmount)),
    status: asString(firstDefined(row.status, row.validationStatus)) || "Pending",
    submittedAt: formatDate(firstDefined(row.submittedAt, row.dateTime, row.createdAt)),
  }))

// ─── Status badge variant ─────────────────────────────────────────────────────
const statusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  const s = status.toLowerCase()
  if (s.includes("valid") || s.includes("approved") || s.includes("success"))
    return "default"
  if (s.includes("reject") || s.includes("fail") || s.includes("error"))
    return "destructive"
  return "secondary"
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EInvoicingDashboardPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["einvoicing-kpi", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.einvoicing.kpi, { companyId }),
    enabled: !!companyId,
  })
  const statusQuery = useQuery({
    queryKey: ["einvoicing-status-summary", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.einvoicing.statusSummary, { companyId }),
    enabled: !!companyId,
  })
  const recentQuery = useQuery({
    queryKey: ["einvoicing-recent", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.einvoicing.recentSubmissions, { companyId }),
    enabled: !!companyId,
  })
  const todayQuery = useQuery({
    queryKey: ["einvoicing-today", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.einvoicing.todaySubmissions, { companyId }),
    enabled: !!companyId,
  })

  const kpi = normalizeKpi(kpiQuery.data)
  const statusBuckets = normalizeStatusSummary(statusQuery.data)
  const recentRows = normalizeSubmissions(recentQuery.data)
  const todayRows = normalizeSubmissions(todayQuery.data)

  const maxCount = useMemo(
    () => Math.max(...statusBuckets.map((b) => b.count), 1),
    [statusBuckets]
  )

  const hasError =
    kpiQuery.isError || statusQuery.isError || recentQuery.isError || todayQuery.isError

  const columns: ColumnDef<Submission>[] = [
    {
      accessorKey: "documentNo",
      header: "Document No",
      cell: ({ row }) => row.original.documentNo || row.original.invoiceNo || "—",
    },
    { accessorKey: "customerName", header: "Customer" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) =>
        `MYR ${new Intl.NumberFormat("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(row.original.amount)}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "submittedAt", header: "Submitted At" },
  ]

  return (
    <div className="@container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-Invoicing Dashboard</h1>
        <p className="text-muted-foreground">Overview of e-invoicing activity and submission stats.</p>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some data failed to load</AlertTitle>
          <AlertDescription>
            Showing available data only. Check API availability or refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="text-teal-600 h-4 w-4" />
              Total Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {kpiQuery.isPending ? <Skeleton className="h-7 w-20" /> : kpi.totalSubmitted.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Valid
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-600">
            {kpiQuery.isPending ? <Skeleton className="h-7 w-20" /> : kpi.valid.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-600">
            {kpiQuery.isPending ? <Skeleton className="h-7 w-20" /> : kpi.pending.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-rose-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-destructive text-2xl font-semibold">
            {kpiQuery.isPending ? <Skeleton className="h-7 w-20" /> : kpi.rejected.toLocaleString()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-blue-600">
            {kpiQuery.isPending ? <Skeleton className="h-7 w-16" /> : `${kpi.successRate}%`}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-violet-500" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-violet-600">
            {kpiQuery.isPending ? <Skeleton className="h-7 w-16" /> : kpi.todayCount.toLocaleString()}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : statusBuckets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No status data available.</p>
          ) : (
            statusBuckets.map((bucket) => (
              <div key={bucket.status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{bucket.status}</span>
                  <span className="font-medium">{bucket.count.toLocaleString()}</span>
                </div>
                <div className="bg-muted h-2 rounded">
                  <div
                    className="bg-primary h-2 rounded"
                    style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewDataTable
            data={recentRows}
            columns={columns}
            emptyMessage={recentQuery.isPending ? "Loading..." : "No recent submissions found."}
          />
        </CardContent>
      </Card>

      {/* Today's Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewDataTable
            data={todayRows}
            columns={columns}
            emptyMessage={todayQuery.isPending ? "Loading..." : "No submissions today."}
          />
        </CardContent>
      </Card>
    </div>
  )
}
