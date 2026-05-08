"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, DollarSign, FileText } from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type AnyRecord = Record<string, unknown>
const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null

const firstDefined = (...values: unknown[]): unknown =>
  values.find((value) => value !== undefined && value !== null)

const asRecord = (value: unknown): AnyRecord =>
  isRecord(value) ? value : {}

const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[]
  }
  if (isRecord(value)) {
    const candidates = [
      value.items,
      value.rows,
      value.results,
      value.list,
      value.data,
      value.transactions,
      value.suppliers,
      value.aging,
    ]
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as T[]
      }
    }
  }
  return []
}

const unwrapData = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload
  }
  return firstDefined(
    payload.data,
    payload.result,
    payload.payload,
    payload.response,
    payload
  )
}

const asNumber = (value: unknown): number =>
  Number.isFinite(Number(value)) ? Number(value) : 0
const asString = (value: unknown): string =>
  typeof value === "string" ? value : String(value ?? "")

const formatDate = (value: unknown): string => {
  const raw = asString(value)
  if (!raw) {
    return "-"
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }
  return parsed.toLocaleDateString("en-GB")
}

type ApKpi = {
  totalOutstanding: number
  overdueOutstanding: number
  pendingApprovals: number
  dpoDays: number
}
type ApAgingBucket = { bucket: string; amount: number }
type ApSupplier = { supplierName: string; amount: number }
type ApTxn = {
  documentNo: string
  invoiceNo: string
  supplierName: string
  amount: number
  status: string
  date: string
}

const normalizeKpi = (payload: unknown): ApKpi => {
  const data = asRecord(unwrapData(payload))
  return {
    totalOutstanding: asNumber(
      firstDefined(data.totalAPOutstanding, data.totalOutstanding, data.total, data.apTotal)
    ),
    overdueOutstanding: asNumber(
      firstDefined(data.overdueAP, data.overdueOutstanding, data.overdue, data.totalOverdue)
    ),
    pendingApprovals: asNumber(
      firstDefined(data.pendingApprovals, data.pending, data.approvalsPending)
    ),
    dpoDays: asNumber(firstDefined(data.dpo, data.dpoDays, data.daysPayableOutstanding)),
  }
}

const normalizeAging = (payload: unknown): ApAgingBucket[] =>
  asArray<AnyRecord>(unwrapData(payload))
    .map((entry) => {
      const bucket = asString(firstDefined(entry.bucket, entry.label, entry.range, entry.name))
      return {
        bucket: bucket || "Unclassified",
        amount: asNumber(firstDefined(entry.amount, entry.value, entry.outstanding)),
      }
    })
    .filter((entry) => entry.amount >= 0)

const normalizeSuppliers = (payload: unknown): ApSupplier[] =>
  asArray<AnyRecord>(unwrapData(payload))
    .map((entry) => ({
      supplierName:
        asString(firstDefined(entry.supplierName, entry.name, entry.supplier, entry.vendor)) ||
        "Unknown Supplier",
      amount: asNumber(firstDefined(entry.outstanding, entry.amount, entry.total)),
    }))
    .filter((entry) => entry.amount >= 0)

const normalizeTransactions = (payload: unknown): ApTxn[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((entry) => ({
    documentNo: asString(firstDefined(entry.documentNo, entry.docNo, entry.voucherNo)),
    invoiceNo: asString(firstDefined(entry.invoiceNo, entry.billNo, entry.referenceNo)),
    supplierName:
      asString(firstDefined(entry.supplierName, entry.supplier, entry.vendorName)) ||
      "Unknown Supplier",
    amount: asNumber(firstDefined(entry.amount, entry.total, entry.netAmount)),
    status: asString(firstDefined(entry.status, entry.state, entry.paymentStatus)) || "Open",
    date: formatDate(firstDefined(entry.trnDate, entry.date, entry.txnDate, entry.createdAt)),
  }))

export default function APOverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["ap-overview-kpi", companyId],
    queryFn: () => getData("/ap/kpi", { companyId }),
    enabled: !!companyId,
  })
  const agingQuery = useQuery({
    queryKey: ["ap-overview-aging", companyId],
    queryFn: () => getData("/ap/aging", { companyId }),
    enabled: !!companyId,
  })
  const overdueSuppliersQuery = useQuery({
    queryKey: ["ap-overview-overdue-suppliers", companyId],
    queryFn: () => getData("/ap/overdue-suppliers", { companyId }),
    enabled: !!companyId,
  })
  const topSuppliersQuery = useQuery({
    queryKey: ["ap-overview-top-suppliers", companyId],
    queryFn: () => getData("/ap/top-suppliers", { companyId }),
    enabled: !!companyId,
  })
  const todayTxnQuery = useQuery({
    queryKey: ["ap-overview-today-tx", companyId],
    queryFn: () => getData("/ap/transactions/today", { companyId }),
    enabled: !!companyId,
  })
  const weekTxnQuery = useQuery({
    queryKey: ["ap-overview-week-tx", companyId],
    queryFn: () => getData("/ap/transactions/week", { companyId }),
    enabled: !!companyId,
  })

  const kpi = normalizeKpi(kpiQuery.data)
  const aging = normalizeAging(agingQuery.data)
  const topSuppliers = normalizeSuppliers(topSuppliersQuery.data)
  const overdueSuppliers = normalizeSuppliers(overdueSuppliersQuery.data)
  const txRows = normalizeTransactions(weekTxnQuery.data)
  const todayRows = normalizeTransactions(todayTxnQuery.data)

  const formatMoney = (value: number) =>
    `AED ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`

  const chartBase = useMemo(() => {
    const maxFromAging = Math.max(...aging.map((x) => asNumber(x.amount)), 0)
    const maxFromSuppliers = Math.max(...topSuppliers.map((x) => asNumber(x.amount)), 0)
    return Math.max(maxFromAging, maxFromSuppliers, 1)
  }, [aging, topSuppliers])

  const columns: ColumnDef<ApTxn>[] = [
    {
      accessorKey: "documentNo",
      header: "Document",
      cell: ({ row }) => row.original.documentNo || row.original.invoiceNo || "-",
    },
    { accessorKey: "supplierName", header: "Supplier" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatMoney(asNumber(row.original.amount)),
    },
    { accessorKey: "date", header: "Date", cell: ({ row }) => row.original.date || "-" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="secondary">{row.original.status || "Open"}</Badge>,
    },
  ]

  const isInitialLoading =
    kpiQuery.isPending &&
    agingQuery.isPending &&
    topSuppliersQuery.isPending &&
    overdueSuppliersQuery.isPending &&
    todayTxnQuery.isPending &&
    weekTxnQuery.isPending

  const hasError =
    kpiQuery.isError ||
    agingQuery.isError ||
    topSuppliersQuery.isError ||
    overdueSuppliersQuery.isError ||
    todayTxnQuery.isError ||
    weekTxnQuery.isError

  return (
    <div className="@container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AP Overview</h1>
        <p className="text-muted-foreground">API: `/ap/*` via `/api/proxy`</p>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some AP data failed to load</AlertTitle>
          <AlertDescription>
            The page is showing available data only. Please refresh or check API availability.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total AP</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {kpiQuery.isPending ? <Skeleton className="h-7 w-36" /> : formatMoney(kpi.totalOutstanding)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overdue AP</CardTitle></CardHeader>
          <CardContent className="text-destructive flex items-center gap-2 text-2xl font-semibold">
            <AlertTriangle className="h-5 w-5" />
            {kpiQuery.isPending ? <Skeleton className="h-7 w-36" /> : formatMoney(kpi.overdueOutstanding)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">DPO</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <DollarSign className="h-5 w-5" />
            {kpiQuery.isPending ? <Skeleton className="h-7 w-16" /> : `${kpi.dpoDays} days`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Approvals</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <FileText className="h-5 w-5" />
            {kpiQuery.isPending ? <Skeleton className="h-7 w-20" /> : kpi.pendingApprovals}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Aging (Chart)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {agingQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : aging.length === 0 ? (
              <p className="text-muted-foreground text-sm">No aging data found.</p>
            ) : (
              aging.map((item, idx) => (
                <div key={`${item.bucket}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.bucket}</span>
                    <span>{formatMoney(asNumber(item.amount))}</span>
                  </div>
                  <div className="bg-muted h-2 rounded">
                    <div
                      className="bg-primary h-2 rounded"
                      style={{ width: `${(asNumber(item.amount) / chartBase) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Suppliers (Chart)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topSuppliersQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : topSuppliers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No supplier ranking data found.</p>
            ) : (
              topSuppliers.map((item, idx) => {
                const amount = asNumber(item.amount)
                return (
                  <div key={`${item.supplierName}-${idx}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.supplierName}</span>
                      <span>{formatMoney(amount)}</span>
                    </div>
                    <div className="bg-muted h-2 rounded">
                      <div
                        className="bg-primary h-2 rounded"
                        style={{ width: `${(amount / chartBase) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Transactions (TanStack Table)</CardTitle></CardHeader>
        <CardContent>
          <OverviewDataTable
            data={txRows}
            columns={columns}
            emptyMessage={weekTxnQuery.isPending ? "Loading..." : "No weekly transactions found"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Today Transactions</CardTitle></CardHeader>
        <CardContent>
          <OverviewDataTable
            data={todayRows}
            columns={columns}
            emptyMessage={todayTxnQuery.isPending ? "Loading..." : "No today transactions found"}
          />
        </CardContent>
      </Card>

      {(overdueSuppliers.length > 0 || overdueSuppliersQuery.isPending || isInitialLoading) && (
        <Card>
          <CardHeader><CardTitle>Overdue Suppliers</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdueSuppliersQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : overdueSuppliers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No overdue suppliers found.</p>
            ) : (
              overdueSuppliers.slice(0, 8).map((item, idx) => (
                <div
                  key={`${item.supplierName}-od-${idx}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.supplierName}</span>
                  <span>{formatMoney(asNumber(item.amount))}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
