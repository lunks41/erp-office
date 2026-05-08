"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, Clock3, DollarSign, FileText } from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AnyRecord = Record<string, unknown>

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null

const unwrapPayload = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload
  }

  const candidates = ["data", "result", "payload"] as const
  for (const key of candidates) {
    if (key in payload) {
      const unwrapped = payload[key]
      return unwrapped === undefined ? payload : unwrapped
    }
  }

  return payload
}

const asArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (!isRecord(value)) {
    return []
  }

  const listCandidates = [
    "items",
    "rows",
    "list",
    "transactions",
    "customers",
    "aging",
    "buckets",
  ] as const

  for (const key of listCandidates) {
    const candidate = value[key]
    if (Array.isArray(candidate)) {
      return candidate as T[]
    }
  }

  return []
}

const asObject = <T extends AnyRecord>(value: unknown): T => {
  if (isRecord(value)) {
    return value as T
  }

  if (Array.isArray(value)) {
    const firstObject = value.find((item) => isRecord(item))
    return (firstObject ?? {}) as T
  }

  return {} as T
}

const asNumber = (value: unknown): number =>
  typeof value === "number" ? value : Number(value || 0)

type ArKpi = {
  totalAROutstanding?: number
  overdueAR?: number
  pendingApprovals?: number
  dso?: number
}

type ArCustomer = { customerName?: string; amount?: number; outstanding?: number }
type ArTxn = {
  documentNo?: string
  invoiceNo?: string
  customerName?: string
  amount?: number
  status?: string
  trnDate?: string
  date?: string
}

export default function AROverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["ar-overview-kpi", companyId],
    queryFn: () => getData("/ar/kpi", { companyId }),
    enabled: !!companyId,
  })
  const agingQuery = useQuery({
    queryKey: ["ar-overview-aging", companyId],
    queryFn: () => getData("/ar/aging", { companyId }),
    enabled: !!companyId,
  })
  const overdueCustomersQuery = useQuery({
    queryKey: ["ar-overview-overdue-customers", companyId],
    queryFn: () => getData("/ar/overdue-customers", { companyId }),
    enabled: !!companyId,
  })
  const topCustomersQuery = useQuery({
    queryKey: ["ar-overview-top-customers", companyId],
    queryFn: () => getData("/ar/top-customers", { companyId }),
    enabled: !!companyId,
  })
  const todayTxnQuery = useQuery({
    queryKey: ["ar-overview-today-tx", companyId],
    queryFn: () => getData("/ar/transactions/today", { companyId }),
    enabled: !!companyId,
  })
  const weekTxnQuery = useQuery({
    queryKey: ["ar-overview-week-tx", companyId],
    queryFn: () => getData("/ar/transactions/week", { companyId }),
    enabled: !!companyId,
  })

  const kpi = asObject<ArKpi>(unwrapPayload(kpiQuery.data))
  const aging = asArray<{ bucket?: string; amount?: number; percentage?: number }>(
    unwrapPayload(agingQuery.data)
  )
  const topCustomers = asArray<ArCustomer>(unwrapPayload(topCustomersQuery.data))
  const overdueCustomers = asArray<ArCustomer>(unwrapPayload(overdueCustomersQuery.data))
  const weekRows = asArray<ArTxn>(unwrapPayload(weekTxnQuery.data))
  const todayRows = asArray<ArTxn>(unwrapPayload(todayTxnQuery.data))

  const formatMoney = (value: number) =>
    `AED ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`

  const chartBase = useMemo(() => {
    const maxFromAging = Math.max(...aging.map((x) => asNumber(x.amount)), 0)
    const maxFromCustomers = Math.max(
      ...topCustomers.map((x) => asNumber(x.outstanding ?? x.amount)),
      0
    )
    const maxFromOverdue = Math.max(
      ...overdueCustomers.map((x) => asNumber(x.outstanding ?? x.amount)),
      0
    )
    return Math.max(maxFromAging, maxFromCustomers, maxFromOverdue, 1)
  }, [aging, topCustomers, overdueCustomers])

  const progressWidth = (amount: number) =>
    `${Math.min(100, Math.max(0, (amount / chartBase) * 100))}%`

  const columns = useMemo<ColumnDef<ArTxn>[]>(
    () => [
      {
        accessorKey: "documentNo",
        header: "Document",
        cell: ({ row }) => row.original.documentNo || row.original.invoiceNo || "-",
      },
      { accessorKey: "customerName", header: "Customer" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatMoney(asNumber(row.original.amount)),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => row.original.trnDate || row.original.date || "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant="secondary">{row.original.status || "Open"}</Badge>,
      },
    ],
    []
  )

  const isLoading =
    kpiQuery.isLoading ||
    agingQuery.isLoading ||
    overdueCustomersQuery.isLoading ||
    topCustomersQuery.isLoading ||
    todayTxnQuery.isLoading ||
    weekTxnQuery.isLoading

  const hasError =
    kpiQuery.isError ||
    agingQuery.isError ||
    overdueCustomersQuery.isError ||
    topCustomersQuery.isError ||
    todayTxnQuery.isError ||
    weekTxnQuery.isError

  const errorMessage = [
    kpiQuery.error,
    agingQuery.error,
    overdueCustomersQuery.error,
    topCustomersQuery.error,
    todayTxnQuery.error,
    weekTxnQuery.error,
  ]
    .find((error): error is Error => error instanceof Error)
    ?.message

  const safeAging = aging.slice(0, 6)
  const safeTopCustomers = topCustomers.slice(0, 6)
  const safeOverdueCustomers = overdueCustomers.slice(0, 6)

  const overdueValue = asNumber(kpi.overdueAR)
  const totalOutstandingValue = asNumber(kpi.totalAROutstanding)
  const overdueRatio =
    totalOutstandingValue > 0 ? Math.min(100, (overdueValue / totalOutstandingValue) * 100) : 0

  const dsoValue = asNumber(kpi.dso)
  const pendingApprovalsValue = asNumber(kpi.pendingApprovals)

  const todayEmptyMessage = isLoading ? "Loading today transactions..." : "No today transactions found"
  const weekEmptyMessage = isLoading ? "Loading week transactions..." : "No weekly transactions found"

  return (
    <div className="@container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AR Overview</h1>
        <p className="text-muted-foreground">API: `/ar/*` via `/api/proxy`</p>
      </div>

      {hasError && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive text-sm">Some sections failed to load</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {errorMessage || "One or more AR overview requests returned an unexpected response."}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
            <Clock3 className="h-4 w-4" />
            Fetching AR metrics and transactions...
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total AR Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(totalOutstandingValue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue AR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-destructive flex items-center gap-2 text-2xl font-semibold">
              <AlertTriangle className="h-5 w-5" />
              {formatMoney(overdueValue)}
            </div>
            <div className="bg-muted h-2 rounded">
              <div className="bg-destructive h-2 rounded" style={{ width: `${overdueRatio}%` }} />
            </div>
            <p className="text-muted-foreground text-xs">{overdueRatio.toFixed(1)}% of total AR</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">DSO (Days)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <DollarSign className="h-5 w-5" />
            {dsoValue.toFixed(1)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <FileText className="h-5 w-5" />
            {pendingApprovalsValue}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{todayRows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Week Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{weekRows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Customers Listed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{safeTopCustomers.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue Customers Listed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{safeOverdueCustomers.length}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aging Buckets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeAging.length > 0 ? (
              safeAging.map((item, idx) => (
                <div key={`${item.bucket ?? "bucket"}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.bucket ?? "N/A"}</span>
                    <span>{formatMoney(asNumber(item.amount))}</span>
                  </div>
                  <div className="bg-muted h-2 rounded">
                    <div
                      className="bg-primary h-2 rounded"
                      style={{ width: progressWidth(asNumber(item.amount)) }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No aging bucket data found.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeTopCustomers.length > 0 ? (
              safeTopCustomers.map((item, idx) => {
                const amount = asNumber(item.outstanding ?? item.amount)
                return (
                  <div key={`${item.customerName ?? "customer"}-${idx}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.customerName ?? "Unknown"}</span>
                      <span>{formatMoney(amount)}</span>
                    </div>
                    <div className="bg-muted h-2 rounded">
                      <div className="bg-primary h-2 rounded" style={{ width: progressWidth(amount) }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-muted-foreground text-sm">No top customer data found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {safeOverdueCustomers.length > 0 ? (
            safeOverdueCustomers.map((item, idx) => {
              const amount = asNumber(item.outstanding ?? item.amount)
              return (
                <div key={`${item.customerName ?? "od"}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.customerName ?? "Unknown"}</span>
                    <span>{formatMoney(amount)}</span>
                  </div>
                  <div className="bg-muted h-2 rounded">
                    <div className="bg-destructive h-2 rounded" style={{ width: progressWidth(amount) }} />
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-muted-foreground text-sm">No overdue customer data found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewDataTable data={todayRows} columns={columns} emptyMessage={todayEmptyMessage} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Week Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewDataTable data={weekRows} columns={columns} emptyMessage={weekEmptyMessage} />
        </CardContent>
      </Card>
    </div>
  )
}
