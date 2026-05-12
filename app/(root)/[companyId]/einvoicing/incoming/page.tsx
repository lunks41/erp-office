"use client"

import { useCallback, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, startOfMonth, subMonths, lastDayOfMonth } from "date-fns"
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileCode2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
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
type IncomingRow = {
  id: string
  documentNo: string
  invoiceNo: string
  uuid: string
  supplierName: string
  supplierTin: string
  amount: number
  currency: string
  status: string
  trnDate: string
  receivedAt: string
  acknowledgedAt: string
  errorMessage: string
}

type IncomingFilter = {
  startDate: string
  endDate: string
  status: string
  search: string
  pageNumber: number
  pageSize: number
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "Received", label: "Received" },
  { value: "Acknowledged", label: "Acknowledged" },
  { value: "Rejected", label: "Rejected" },
  { value: "Valid", label: "Valid" },
  { value: "Cancelled", label: "Cancelled" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const asString = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""))
const asNumber = (v: unknown) =>
  Number.isFinite(Number(v)) ? Number(v) : 0

const firstDefined = (...vals: unknown[]) =>
  vals.find((v) => v !== undefined && v !== null)

const normalizeRow = (row: Record<string, unknown>): IncomingRow => ({
  id: asString(firstDefined(row.id, row.submissionId, row.documentId, "")),
  documentNo: asString(firstDefined(row.documentNo, row.docNo, "")),
  invoiceNo: asString(firstDefined(row.invoiceNo, row.internalId, "")),
  uuid: asString(firstDefined(row.uuid, row.longId, "")),
  supplierName: asString(
    firstDefined(row.supplierName, row.seller, row.sellerName, row.issuerName, "Unknown")
  ),
  supplierTin: asString(firstDefined(row.supplierTin, row.sellerTin, row.issuerTin, "")),
  amount: asNumber(firstDefined(row.amount, row.totalAmount, row.totAmtAftGst, 0)),
  currency: asString(firstDefined(row.currency, row.currencyCode, "MYR")),
  status: asString(firstDefined(row.status, row.validationStatus, "Received")),
  trnDate: asString(firstDefined(row.trnDate, row.issueDate, row.date, "")),
  receivedAt: asString(firstDefined(row.receivedAt, row.dateTimeReceived, row.createdAt, "")),
  acknowledgedAt: asString(firstDefined(row.acknowledgedAt, row.dateTimeAcknowledged, "")),
  errorMessage: asString(firstDefined(row.errorMessage, row.error, "")),
})

const normalizeList = (payload: unknown): { rows: IncomingRow[]; total: number } => {
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
  if (s === "valid" || s === "acknowledged") return "default"
  if (s === "rejected" || s === "failed" || s === "error") return "destructive"
  if (s === "received") return "secondary"
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
const DEFAULT_FILTERS: IncomingFilter = {
  startDate: format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
  endDate: format(lastDayOfMonth(today), "yyyy-MM-dd"),
  status: "all",
  search: "",
  pageNumber: 1,
  pageSize: 50,
}

export default function EInvoicingIncomingPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = String(params?.companyId ?? "")
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IncomingFilter>(DEFAULT_FILTERS)
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
    queryKey: ["einvoicing-incoming", queryParams],
    queryFn: () => getData(EInvoicing.incomingList, queryParams),
    enabled: !!companyId,
  })

  const { rows, total } = normalizeList(listQuery.data)
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) =>
      saveData(`${EInvoicing.incomingList}/${id}/acknowledge`, {}),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["einvoicing-incoming"] })
      setPendingId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      saveData(`${EInvoicing.incomingList}/${id}/reject`, {}),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["einvoicing-incoming"] })
      setPendingId(null)
    },
  })

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: searchInput, pageNumber: 1 }))
  }, [searchInput])

  const handleReset = () => {
    setSearchInput("")
    setFilters(DEFAULT_FILTERS)
  }

  const handleViewXml = (row: IncomingRow) => {
    router.push(`/${companyId}/einvoicing/xml-viewer?docId=${row.id}&docNo=${row.documentNo}`)
  }

  const isBusy = (id: string) =>
    pendingId === id && (acknowledgeMutation.isPending || rejectMutation.isPending)

  const canAcknowledge = (status: string) => {
    const s = status.toLowerCase()
    return s === "received" || s === "valid"
  }

  const canReject = (status: string) => {
    const s = status.toLowerCase()
    return s === "received" || s === "valid"
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incoming Invoices</h1>
        <p className="text-muted-foreground">
          Review and acknowledge e-invoices received from suppliers.
        </p>
      </div>

      {listQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to load incoming invoices</AlertTitle>
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
          <Select
            value={filters.status}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, status: v, pageNumber: 1 }))
            }
          >
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
              placeholder="Doc no, invoice no, supplier…"
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
                {[
                  "Document No",
                  "Invoice No / UUID",
                  "Supplier",
                  "Amount",
                  "Date",
                  "Status",
                  "Received At",
                  "Actions",
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
                    No incoming invoices found. Adjust filters to broaden the search.
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
                        <div
                          className="text-muted-foreground truncate font-mono text-[10px]"
                          title={row.uuid}
                        >
                          {row.uuid.length > 20 ? `${row.uuid.slice(0, 20)}…` : row.uuid}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[140px] px-4 py-3" title={row.supplierName}>
                      <div className="truncate text-xs">{row.supplierName}</div>
                      {row.supplierTin && (
                        <div className="text-muted-foreground text-[10px]">
                          TIN: {row.supplierTin}
                        </div>
                      )}
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
                        <div
                          className="mt-0.5 truncate text-[10px] text-rose-500"
                          title={row.errorMessage}
                        >
                          {row.errorMessage.slice(0, 40)}…
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {fmtDate(row.receivedAt) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canAcknowledge(row.status) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-6 px-2 text-[10px]"
                            disabled={isBusy(row.id)}
                            onClick={() => {
                              setPendingId(row.id)
                              acknowledgeMutation.mutate(row.id)
                            }}
                          >
                            {isBusy(row.id) && acknowledgeMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                            )}
                            Ack
                          </Button>
                        )}
                        {canReject(row.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700"
                            disabled={isBusy(row.id)}
                            onClick={() => {
                              setPendingId(row.id)
                              rejectMutation.mutate(row.id)
                            }}
                          >
                            {isBusy(row.id) && rejectMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            Reject
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
                          title="View details"
                          onClick={() => handleViewXml(row)}
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
              {Math.min(filters.pageNumber * filters.pageSize, total)} of{" "}
              {total.toLocaleString()} records
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
