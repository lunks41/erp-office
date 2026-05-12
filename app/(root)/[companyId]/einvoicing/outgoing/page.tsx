"use client"

import { useCallback, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, startOfMonth, subMonths, lastDayOfMonth } from "date-fns"
import {
  AlertTriangle,
  Eye,
  FileCode2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
} from "lucide-react"

import { getData, saveData } from "@/lib/api-client"
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
type OutgoingRow = {
  id: string
  documentNo: string
  invoiceNo: string
  uuid: string
  customerName: string
  amount: number
  currency: string
  status: string
  trnDate: string
  submittedAt: string
  validatedAt: string
  errorMessage: string
}

type OutgoingFilter = {
  startDate: string
  endDate: string
  status: string
  search: string
  pageNumber: number
  pageSize: number
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Submitted", label: "Submitted" },
  { value: "Valid", label: "Valid" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const asString = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""))
const asNumber = (v: unknown) =>
  Number.isFinite(Number(v)) ? Number(v) : 0

const firstDefined = (...vals: unknown[]) =>
  vals.find((v) => v !== undefined && v !== null)

const normalizeRow = (row: Record<string, unknown>): OutgoingRow => ({
  id: asString(firstDefined(row.id, row.submissionId, row.documentId, "")),
  documentNo: asString(firstDefined(row.documentNo, row.docNo, "")),
  invoiceNo: asString(firstDefined(row.invoiceNo, row.internalId, "")),
  uuid: asString(firstDefined(row.uuid, row.longId, "")),
  customerName: asString(firstDefined(row.customerName, row.buyer, row.buyerName, "Unknown")),
  amount: asNumber(firstDefined(row.amount, row.totalAmount, row.totAmtAftGst, 0)),
  currency: asString(firstDefined(row.currency, row.currencyCode, "MYR")),
  status: asString(firstDefined(row.status, row.validationStatus, "Pending")),
  trnDate: asString(firstDefined(row.trnDate, row.issueDate, row.date, "")),
  submittedAt: asString(firstDefined(row.submittedAt, row.dateTimeReceived, "")),
  validatedAt: asString(firstDefined(row.validatedAt, row.dateTimeValidated, "")),
  errorMessage: asString(firstDefined(row.errorMessage, row.error, "")),
})

const normalizeList = (payload: unknown): { rows: OutgoingRow[]; total: number } => {
  if (typeof payload !== "object" || payload === null)
    return { rows: [], total: 0 }
  const d = payload as Record<string, unknown>
  const raw = Array.isArray(d.data) ? d.data
    : Array.isArray(d.items) ? d.items
    : Array.isArray(d.rows) ? d.rows
    : Array.isArray(payload) ? payload
    : []
  const total = asNumber(firstDefined(d.totalCount, d.total, d.count, raw.length))
  return {
    rows: (raw as Record<string, unknown>[]).map(normalizeRow),
    total,
  }
}

const statusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  const s = status.toLowerCase()
  if (s === "valid" || s === "approved") return "default"
  if (s === "rejected" || s === "failed" || s === "error") return "destructive"
  if (s === "submitted") return "secondary"
  return "outline"
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

// ─── Page ─────────────────────────────────────────────────────────────────────
const today = new Date()
const DEFAULT_FILTERS: OutgoingFilter = {
  startDate: format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
  endDate: format(lastDayOfMonth(today), "yyyy-MM-dd"),
  status: "all",
  search: "",
  pageNumber: 1,
  pageSize: 50,
}

export default function EInvoicingOutgoingPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = String(params?.companyId ?? "")
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<OutgoingFilter>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)

  const queryParams = {
    companyId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search ? { search: filters.search } : {}),
    pageNumber: String(filters.pageNumber),
    pageSize: String(filters.pageSize),
  }

  const listQuery = useQuery({
    queryKey: ["einvoicing-outgoing", queryParams],
    queryFn: () => getData(EInvoicing.outgoingList, queryParams),
    enabled: !!companyId,
  })

  const { rows, total } = normalizeList(listQuery.data)
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

  const submitMutation = useMutation({
    mutationFn: (id: string) =>
      saveData(`${EInvoicing.submit}/${id}`, {}),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["einvoicing-outgoing"] })
      setPendingId(null)
    },
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) =>
      saveData(`${EInvoicing.retry}/${id}`, {}),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["einvoicing-outgoing"] })
      setPendingId(null)
    },
  })

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: searchInput, pageNumber: 1 }))
  }, [searchInput])

  const handleStatusChange = (value: string) => {
    setFilters((f) => ({ ...f, status: value, pageNumber: 1 }))
  }

  const handleReset = () => {
    setSearchInput("")
    setFilters(DEFAULT_FILTERS)
  }

  const handleViewXml = (row: OutgoingRow) => {
    router.push(`/${companyId}/einvoicing/xml-viewer?docId=${row.id}&docNo=${row.documentNo}`)
  }

  const isBusy = (id: string) =>
    pendingId === id && (submitMutation.isPending || retryMutation.isPending)

  const canRetry = (status: string) => {
    const s = status.toLowerCase()
    return s === "rejected" || s === "failed" || s === "error"
  }

  const canSubmit = (status: string) => {
    const s = status.toLowerCase()
    return s === "pending" || s === "draft"
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outgoing Invoices</h1>
        <p className="text-muted-foreground">Submit and track outgoing e-invoice submissions.</p>
      </div>

      {listQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load outgoing invoices</AlertTitle>
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
          <label className="text-muted-foreground text-xs font-medium">Status</label>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
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
              placeholder="Doc no, invoice no, customer…"
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
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
          >
            {listQuery.isFetching ? (
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
                {["Document No", "Invoice No / UUID", "Customer", "Amount", "Date", "Status", "Submitted At", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {listQuery.isPending ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-muted-foreground px-4 py-12 text-center text-sm"
                  >
                    No outgoing invoices found. Adjust filters or submit new invoices.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id || row.documentNo}
                    className="hover:bg-muted/30 border-b transition-colors last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {row.documentNo || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium">{row.invoiceNo || "—"}</div>
                      {row.uuid && (
                        <div className="text-muted-foreground truncate font-mono text-[10px]" title={row.uuid}>
                          {row.uuid.length > 20 ? `${row.uuid.slice(0, 20)}…` : row.uuid}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-xs" title={row.customerName}>
                      {row.customerName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium">
                      {fmtMoney(row.amount, row.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {fmtDate(row.trnDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(row.status)} className="text-[10px]">
                        {row.status}
                      </Badge>
                      {row.errorMessage && (
                        <div className="mt-0.5 truncate text-[10px] text-rose-500" title={row.errorMessage}>
                          {row.errorMessage.slice(0, 40)}…
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {fmtDate(row.submittedAt) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canSubmit(row.status) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-6 px-2 text-[10px]"
                            disabled={isBusy(row.id)}
                            onClick={() => {
                              setPendingId(row.id)
                              submitMutation.mutate(row.id)
                            }}
                          >
                            {isBusy(row.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="mr-1 h-3 w-3" />
                            )}
                            Submit
                          </Button>
                        )}
                        {canRetry(row.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px]"
                            disabled={isBusy(row.id)}
                            onClick={() => {
                              setPendingId(row.id)
                              retryMutation.mutate(row.id)
                            }}
                          >
                            {isBusy(row.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 h-3 w-3" />
                            )}
                            Retry
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleViewXml(row)}
                          title="View XML payload"
                        >
                          <FileCode2 className="mr-1 h-3 w-3" />
                          XML
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleViewXml(row)}
                          title="View details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!listQuery.isPending && rows.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-muted-foreground text-xs">
              Showing {(filters.pageNumber - 1) * filters.pageSize + 1}–
              {Math.min(filters.pageNumber * filters.pageSize, total)} of {total.toLocaleString()} records
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={filters.pageNumber <= 1}
                onClick={() => setFilters((f) => ({ ...f, pageNumber: f.pageNumber - 1 }))}
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
                onClick={() => setFilters((f) => ({ ...f, pageNumber: f.pageNumber + 1 }))}
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
