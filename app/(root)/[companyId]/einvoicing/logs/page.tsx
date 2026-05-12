"use client"

import { useCallback, useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { format, startOfMonth, subMonths, lastDayOfMonth } from "date-fns"
import {
  AlertTriangle,
  FileCode2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
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
type LogRow = {
  id: string
  documentNo: string
  invoiceNo: string
  direction: string
  action: string
  status: string
  message: string
  performedBy: string
  timestamp: string
}

type LogFilter = {
  startDate: string
  endDate: string
  direction: string
  action: string
  search: string
  pageNumber: number
  pageSize: number
}

const DIRECTION_OPTIONS = [
  { value: "all", label: "All Direction" },
  { value: "Outgoing", label: "Outgoing" },
  { value: "Incoming", label: "Incoming" },
]

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "Submit", label: "Submit" },
  { value: "Retry", label: "Retry" },
  { value: "Acknowledge", label: "Acknowledge" },
  { value: "Reject", label: "Reject" },
  { value: "Cancel", label: "Cancel" },
  { value: "Validate", label: "Validate" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const asString = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""))
const asNumber = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const firstDefined = (...vals: unknown[]) =>
  vals.find((v) => v !== undefined && v !== null)

const normalizeRow = (row: Record<string, unknown>): LogRow => ({
  id: asString(firstDefined(row.id, row.logId, "")),
  documentNo: asString(firstDefined(row.documentNo, row.docNo, "")),
  invoiceNo: asString(firstDefined(row.invoiceNo, row.internalId, "")),
  direction: asString(firstDefined(row.direction, row.type, "")),
  action: asString(firstDefined(row.action, row.eventType, row.event, "")),
  status: asString(firstDefined(row.status, row.result, row.outcome, "")),
  message: asString(firstDefined(row.message, row.description, row.detail, row.errorMessage, "")),
  performedBy: asString(firstDefined(row.performedBy, row.userId, row.user, row.createdBy, "")),
  timestamp: (() => {
    const raw = asString(firstDefined(row.timestamp, row.createdAt, row.dateTime, ""))
    if (!raw) return "—"
    const d = new Date(raw)
    return isNaN(d.getTime()) ? raw : d.toLocaleString("en-GB")
  })(),
})

const normalizeList = (payload: unknown): { rows: LogRow[]; total: number } => {
  if (typeof payload !== "object" || payload === null) return { rows: [], total: 0 }
  const d = payload as Record<string, unknown>
  const raw = Array.isArray(d.data) ? d.data
    : Array.isArray(d.items) ? d.items
    : Array.isArray(d.rows) ? d.rows
    : Array.isArray(d.logs) ? d.logs
    : Array.isArray(payload) ? payload
    : []
  return {
    rows: (raw as Record<string, unknown>[]).map(normalizeRow),
    total: asNumber(firstDefined(d.totalCount, d.total, d.count, raw.length)),
  }
}

const statusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  const s = status.toLowerCase()
  if (s === "success" || s === "valid" || s === "acknowledged") return "default"
  if (s === "failed" || s === "rejected" || s === "error") return "destructive"
  if (s === "pending" || s === "processing") return "secondary"
  return "outline"
}

const directionChip = (direction: string) => {
  const d = direction.toLowerCase()
  if (d === "outgoing")
    return "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
  if (d === "incoming")
    return "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
  return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const today = new Date()
const DEFAULT_FILTERS: LogFilter = {
  startDate: format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
  endDate: format(lastDayOfMonth(today), "yyyy-MM-dd"),
  direction: "all",
  action: "all",
  search: "",
  pageNumber: 1,
  pageSize: 100,
}

export default function EInvoicingLogsPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const [filters, setFilters] = useState<LogFilter>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("")

  const queryParams = {
    companyId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.direction !== "all" ? { direction: filters.direction } : {}),
    ...(filters.action !== "all" ? { action: filters.action } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    pageNumber: String(filters.pageNumber),
    pageSize: String(filters.pageSize),
  }

  const logsQuery = useQuery({
    queryKey: ["einvoicing-logs", queryParams],
    queryFn: () => getData(EInvoicing.logsList, queryParams),
    enabled: !!companyId,
  })

  const { rows, total } = normalizeList(logsQuery.data)
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: searchInput, pageNumber: 1 }))
  }, [searchInput])

  const handleReset = () => {
    setSearchInput("")
    setFilters(DEFAULT_FILTERS)
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">E-Invoicing Logs</h1>
        <p className="text-muted-foreground">
          Audit trail of all submission events and system actions.
        </p>
      </div>

      {logsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load logs</AlertTitle>
          <AlertDescription>Check API availability or adjust filters.</AlertDescription>
        </Alert>
      )}

      {/* Filter bar */}
      <div className="bg-card flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">From</label>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={filters.startDate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, startDate: e.target.value, pageNumber: 1 }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">To</label>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={filters.endDate}
            onChange={(e) =>
              setFilters((f) => ({ ...f, endDate: e.target.value, pageNumber: 1 }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">Direction</label>
          <Select
            value={filters.direction}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, direction: v, pageNumber: 1 }))
            }
          >
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
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">Action</label>
          <Select
            value={filters.action}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, action: v, pageNumber: 1 }))
            }
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">Search</label>
          <div className="flex gap-1.5">
            <Input
              className="h-8 w-48 text-xs"
              placeholder="Doc no, user, message…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button size="sm" variant="secondary" className="h-8" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
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
            onClick={() => logsQuery.refetch()}
            disabled={logsQuery.isFetching}
          >
            {logsQuery.isFetching ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                {[
                  "Timestamp",
                  "Document",
                  "Direction",
                  "Action",
                  "Result",
                  "Message",
                  "Performed By",
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
              {logsQuery.isPending ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-muted-foreground px-4 py-12 text-center text-sm"
                  >
                    No log entries found. Adjust filters to broaden the search.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id || i}
                    className="hover:bg-muted/30 border-b transition-colors last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {row.timestamp}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-xs font-medium">
                        {row.documentNo || "—"}
                      </div>
                      {row.invoiceNo && (
                        <div className="text-muted-foreground text-[10px]">
                          {row.invoiceNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.direction ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${directionChip(row.direction)}`}
                        >
                          {row.direction}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium">{row.action || "—"}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {row.status ? (
                        <Badge
                          variant={statusVariant(row.status)}
                          className="text-[10px]"
                        >
                          {row.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td
                      className="max-w-[260px] px-4 py-2.5"
                      title={row.message}
                    >
                      {row.message ? (
                        <span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                          {row.message}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {row.performedBy || <FileCode2 className="h-3 w-3 opacity-40" />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!logsQuery.isPending && rows.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-muted-foreground text-xs">
              Showing {(filters.pageNumber - 1) * filters.pageSize + 1}–
              {Math.min(filters.pageNumber * filters.pageSize, total)} of{" "}
              {total.toLocaleString()} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={filters.pageNumber <= 1}
                onClick={() =>
                  setFilters((f) => ({ ...f, pageNumber: f.pageNumber - 1 }))
                }
              >
                Previous
              </Button>
              <span className="text-muted-foreground px-2 text-xs">
                {filters.pageNumber} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={filters.pageNumber >= totalPages}
                onClick={() =>
                  setFilters((f) => ({ ...f, pageNumber: f.pageNumber + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
