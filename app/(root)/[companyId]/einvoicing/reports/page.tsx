"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { format, startOfMonth, subMonths, lastDayOfMonth } from "date-fns"
import {
  AlertTriangle,
  Download,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react"

import { getData } from "@/lib/api-client"
import { EInvoicing } from "@/lib/api-routes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportSummary = {
  totalSubmitted: number
  totalValid: number
  totalRejected: number
  totalPending: number
  successRate: number
  totalAmount: number
  currency: string
}

type MonthlyBucket = {
  month: string
  submitted: number
  valid: number
  rejected: number
}

type ReportRow = {
  documentNo: string
  invoiceNo: string
  customerName: string
  supplierName: string
  direction: string
  amount: number
  currency: string
  status: string
  trnDate: string
  submittedAt: string
}

const REPORT_TYPES = [
  { value: "submission", label: "Submission Summary" },
  { value: "monthly", label: "Monthly Breakdown" },
  { value: "detail", label: "Transaction Detail" },
]

const DIRECTION_OPTIONS = [
  { value: "all", label: "All Direction" },
  { value: "Outgoing", label: "Outgoing" },
  { value: "Incoming", label: "Incoming" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const asStr = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""))
const asNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const first = (...vals: unknown[]) =>
  vals.find((v) => v !== undefined && v !== null)

const normalizeSummary = (payload: unknown): ReportSummary => {
  const d = (typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {}) as Record<string, unknown>
  const inner = (
    typeof d.data === "object" && d.data !== null ? d.data : d
  ) as Record<string, unknown>
  const total = asNum(first(inner.totalSubmitted, inner.total, inner.totalCount, 0))
  const valid = asNum(first(inner.totalValid, inner.valid, inner.validCount, 0))
  return {
    totalSubmitted: total,
    totalValid: valid,
    totalRejected: asNum(first(inner.totalRejected, inner.rejected, inner.rejectedCount, 0)),
    totalPending: asNum(first(inner.totalPending, inner.pending, inner.pendingCount, 0)),
    successRate: total > 0
      ? Math.round((valid / total) * 100)
      : asNum(first(inner.successRate, inner.validRate, 0)),
    totalAmount: asNum(first(inner.totalAmount, inner.amount, inner.total, 0)),
    currency: asStr(first(inner.currency, inner.currencyCode, "MYR")),
  }
}

const normalizeMonthly = (payload: unknown): MonthlyBucket[] => {
  const d = (typeof payload === "object" && payload !== null
    ? payload as Record<string, unknown>
    : {}) as Record<string, unknown>
  const raw = Array.isArray(d.data) ? d.data
    : Array.isArray(d.items) ? d.items
    : Array.isArray(payload) ? payload
    : []
  return (raw as Record<string, unknown>[]).map((row) => ({
    month: asStr(first(row.month, row.period, row.label, "")),
    submitted: asNum(first(row.submitted, row.total, row.count, 0)),
    valid: asNum(first(row.valid, row.validCount, 0)),
    rejected: asNum(first(row.rejected, row.rejectedCount, 0)),
  }))
}

const normalizeRows = (payload: unknown): ReportRow[] => {
  const d = (typeof payload === "object" && payload !== null
    ? payload as Record<string, unknown>
    : {}) as Record<string, unknown>
  const raw = Array.isArray(d.data) ? d.data
    : Array.isArray(d.items) ? d.items
    : Array.isArray(d.rows) ? d.rows
    : Array.isArray(payload) ? payload
    : []
  return (raw as Record<string, unknown>[]).map((row) => ({
    documentNo: asStr(first(row.documentNo, row.docNo, "")),
    invoiceNo: asStr(first(row.invoiceNo, row.internalId, "")),
    customerName: asStr(first(row.customerName, row.buyer, row.buyerName, "")),
    supplierName: asStr(first(row.supplierName, row.seller, row.sellerName, "")),
    direction: asStr(first(row.direction, row.type, "")),
    amount: asNum(first(row.amount, row.totalAmount, 0)),
    currency: asStr(first(row.currency, row.currencyCode, "MYR")),
    status: asStr(first(row.status, row.validationStatus, "")),
    trnDate: asStr(first(row.trnDate, row.issueDate, row.date, "")),
    submittedAt: asStr(first(row.submittedAt, row.dateTimeReceived, "")),
  }))
}

const fmtDate = (v: string) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB")
}

const fmtMoney = (amount: number, currency = "MYR") =>
  `${currency} ${new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`

const statusVariant = (
  s: string
): "default" | "secondary" | "destructive" | "outline" => {
  const v = s.toLowerCase()
  if (v === "valid" || v === "acknowledged") return "default"
  if (v === "rejected" || v === "failed") return "destructive"
  if (v === "submitted" || v === "received") return "secondary"
  return "outline"
}

// bar chart: returns width% relative to max
const BarChart = ({ buckets }: { buckets: MonthlyBucket[] }) => {
  const maxVal = Math.max(...buckets.map((b) => b.submitted), 1)
  return (
    <div className="space-y-3">
      {buckets.map((b) => (
        <div key={b.month} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">{b.month}</span>
            <div className="flex gap-3 text-[10px] text-slate-500">
              <span className="text-teal-600 dark:text-teal-400">{b.submitted} submitted</span>
              <span className="text-emerald-600 dark:text-emerald-400">{b.valid} valid</span>
              <span className="text-rose-600 dark:text-rose-400">{b.rejected} rejected</span>
            </div>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="absolute left-0 top-0 h-2 rounded-full bg-teal-500 opacity-30"
              style={{ width: `${(b.submitted / maxVal) * 100}%` }}
            />
            <div
              className="absolute left-0 top-0 h-2 rounded-full bg-emerald-500"
              style={{ width: `${(b.valid / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const today = new Date()
const DEFAULT_START = format(startOfMonth(subMonths(today, 5)), "yyyy-MM-dd")
const DEFAULT_END = format(lastDayOfMonth(today), "yyyy-MM-dd")

export default function EInvoicingReportsPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const [reportType, setReportType] = useState("submission")
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [direction, setDirection] = useState("all")

  const baseParams = {
    companyId,
    startDate,
    endDate,
    ...(direction !== "all" ? { direction } : {}),
  }

  const summaryQuery = useQuery({
    queryKey: ["einvoicing-report-summary", baseParams],
    queryFn: () => getData(`${EInvoicing.logsList}/report/summary`, baseParams),
    enabled: !!companyId && reportType === "submission",
  })

  const monthlyQuery = useQuery({
    queryKey: ["einvoicing-report-monthly", baseParams],
    queryFn: () => getData(`${EInvoicing.logsList}/report/monthly`, baseParams),
    enabled: !!companyId && reportType === "monthly",
  })

  const detailQuery = useQuery({
    queryKey: ["einvoicing-report-detail", baseParams],
    queryFn: () => getData(`${EInvoicing.logsList}/report/detail`, baseParams),
    enabled: !!companyId && reportType === "detail",
  })

  const summary = normalizeSummary(summaryQuery.data)
  const monthly = normalizeMonthly(monthlyQuery.data)
  const detailRows = normalizeRows(detailQuery.data)

  const activeQuery =
    reportType === "submission" ? summaryQuery
    : reportType === "monthly" ? monthlyQuery
    : detailQuery

  const handleReset = () => {
    setStartDate(DEFAULT_START)
    setEndDate(DEFAULT_END)
    setDirection("all")
  }

  const handleExportCsv = () => {
    if (reportType !== "detail" || detailRows.length === 0) return
    const headers = ["Document No", "Invoice No", "Customer/Supplier", "Direction", "Amount", "Currency", "Status", "Date", "Submitted At"]
    const csvRows = detailRows.map((r) =>
      [
        r.documentNo,
        r.invoiceNo,
        r.customerName || r.supplierName,
        r.direction,
        r.amount,
        r.currency,
        r.status,
        fmtDate(r.trnDate),
        fmtDate(r.submittedAt),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = [headers.join(","), ...csvRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `einvoicing-report-${startDate}-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const summaryCards = [
    { label: "Total Submitted", value: summary.totalSubmitted, color: "text-teal-600 dark:text-teal-400" },
    { label: "Valid", value: summary.totalValid, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Rejected", value: summary.totalRejected, color: "text-rose-600 dark:text-rose-400" },
    { label: "Pending", value: summary.totalPending, color: "text-amber-600 dark:text-amber-400" },
    { label: "Success Rate", value: `${summary.successRate}%`, color: "text-blue-600 dark:text-blue-400" },
    { label: "Total Amount", value: fmtMoney(summary.totalAmount, summary.currency), color: "text-slate-700 dark:text-slate-200" },
  ]

  return (
    <div className="@container mx-auto space-y-4 px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Invoicing Reports</h1>
          <p className="text-muted-foreground">Compliance and submission reports.</p>
        </div>
        {reportType === "detail" && detailRows.length > 0 && (
          <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-card flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">Report Type</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">From</label>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">To</label>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">Direction</label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" className="h-8" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => activeQuery.refetch()}
            disabled={activeQuery.isFetching}
          >
            {activeQuery.isFetching ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {activeQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load report</AlertTitle>
          <AlertDescription>Check API availability or adjust the date range.</AlertDescription>
        </Alert>
      )}

      {/* ── Submission Summary ───────────────────────────────────────── */}
      {reportType === "submission" && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {summaryQuery.isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            : summaryCards.map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-lg border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <p className="text-muted-foreground mb-1 text-[11px] font-medium">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </p>
                </div>
              ))}
        </div>
      )}

      {/* ── Monthly Breakdown ────────────────────────────────────────── */}
      {reportType === "monthly" && (
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Monthly Submission Breakdown
          </h2>
          {monthlyQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          ) : monthly.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data for this period.</p>
          ) : (
            <BarChart buckets={monthly} />
          )}
        </div>
      )}

      {/* ── Transaction Detail ───────────────────────────────────────── */}
      {reportType === "detail" && (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  {[
                    "Document No",
                    "Invoice No",
                    "Party",
                    "Direction",
                    "Amount",
                    "Status",
                    "Date",
                    "Submitted At",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailQuery.isPending ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : detailRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-muted-foreground px-4 py-12 text-center text-sm"
                    >
                      No transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  detailRows.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-muted/30 border-b transition-colors last:border-0"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs font-medium">
                        {row.documentNo || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{row.invoiceNo || "—"}</td>
                      <td
                        className="max-w-[130px] truncate px-4 py-2.5 text-xs"
                        title={row.customerName || row.supplierName}
                      >
                        {row.customerName || row.supplierName || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{row.direction || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-medium">
                        {fmtMoney(row.amount, row.currency)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={statusVariant(row.status)} className="text-[10px]">
                          {row.status || "—"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                        {fmtDate(row.trnDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs">
                        {fmtDate(row.submittedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!detailQuery.isPending && detailRows.length > 0 && (
            <div className="text-muted-foreground border-t px-4 py-3 text-xs">
              {detailRows.length.toLocaleString()} records returned
            </div>
          )}
        </div>
      )}
    </div>
  )
}
