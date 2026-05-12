"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, DollarSign, FileText } from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDashboardRoutes } from "@/lib/overview-dashboard-routes"
import { pickNumber, pickString } from "@/lib/overview-row-pickers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"

type AnyRecord = Record<string, unknown>
const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asRecord = (value: unknown): AnyRecord => (isRecord(value) ? value : {})

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
      value.Data,
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
  if ("data" in payload) {
    const data = payload.data
    if (data !== undefined && data !== null) {
      return data
    }
    return {}
  }
  if ("Data" in payload && (payload as AnyRecord).Data !== undefined) {
    const data = (payload as AnyRecord).Data
    if (data !== undefined && data !== null) {
      return data
    }
    return {}
  }
  if ("payload" in payload && payload.payload !== undefined) {
    return payload.payload
  }
  if ("response" in payload && (payload as AnyRecord).response !== undefined) {
    return (payload as AnyRecord).response
  }
  return payload
}

/** SqlResponse `data` is often a single-row array for KPI endpoints. */
const firstRowOrRecord = (payload: unknown): AnyRecord => {
  const inner = unwrapData(payload)
  if (Array.isArray(inner) && inner.length > 0) {
    const row = inner[0]
    if (isRecord(row)) return row
  }
  return asRecord(inner)
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
  const data = firstRowOrRecord(payload)
  return {
    totalOutstanding: pickNumber(data, [
      "totalAPOutstanding",
      "totalOutstanding",
      "TotalOutstandingLocal",
      "total",
      "apTotal",
    ]),
    overdueOutstanding: pickNumber(data, [
      "overdueAP",
      "overdueOutstanding",
      "OverdueOutstandingLocal",
      "overdue",
      "totalOverdue",
    ]),
    pendingApprovals: pickNumber(data, [
      "pendingApprovals",
      "pending",
      "approvalsPending",
      "PendingApprovalCount",
    ]),
    dpoDays: pickNumber(data, ["dpo", "dpoDays", "daysPayableOutstanding", "DpoDays"]),
  }
}

const isWideApAgingRow = (entry: AnyRecord): boolean => {
  const keys = Object.keys(entry)
  const hasDayBand = keys.some((k) => /Days_\d|days[_-]?\d/i.test(k))
  if (!hasDayBand) return false
  const hasSupplierLike = keys.some(
    (k) =>
      /(supplier|vendor|payee)(id|code|key)$/i.test(k) ||
      /^partyid$/i.test(k),
  )
  const hasSupplierName = keys.some((k) =>
    /^(suppliername|vendorname|payeename)$/i.test(k),
  )
  return hasSupplierLike || hasSupplierName
}

const normalizeWideApAging = (rows: AnyRecord[]): ApAgingBucket[] => {
  const specs: { re: RegExp; bucket: string }[] = [
    { re: /Days_0_30/i, bucket: "0–30 Days" },
    { re: /Days_31_60/i, bucket: "31–60 Days" },
    { re: /Days_61_90/i, bucket: "61–90 Days" },
    { re: /Days_91_120/i, bucket: "91–120 Days" },
    { re: /Days_121_180/i, bucket: "121–180 Days" },
    { re: /Days_181_360/i, bucket: "181–360 Days" },
    { re: /Days_361/i, bucket: "361+ Days" },
  ]
  return specs.map(({ re, bucket }) => {
    let amount = 0
    for (const row of rows) {
      for (const [k, v] of Object.entries(row)) {
        if (re.test(k)) amount += asNumber(v)
      }
    }
    return { bucket, amount }
  })
}

const normalizeAging = (payload: unknown): ApAgingBucket[] => {
  const rows = asArray<AnyRecord>(unwrapData(payload))
  if (rows.length > 0 && isWideApAgingRow(rows[0])) {
    return normalizeWideApAging(rows)
  }
  return rows
    .map((entry) => {
      const bucket = pickString(entry, ["bucket", "label", "range", "name"], "Unclassified")
      return {
        bucket: bucket || "Unclassified",
        amount: pickNumber(entry, [
          "amount",
          "value",
          "outstanding",
          "AllLocalAmt",
          "TotLocalAmt",
          "totLocalAmt",
        ]),
      }
    })
    .filter((entry) => entry.amount >= 0)
}

const mapSupplierRow = (entry: AnyRecord, amountKeys: string[]): ApSupplier => ({
  supplierName: pickString(
    entry,
    ["supplierName", "name", "supplier", "vendor"],
    "Unknown Supplier",
  ),
  amount: pickNumber(entry, amountKeys),
})

const normalizeTopSuppliers = (payload: unknown): ApSupplier[] =>
  asArray<AnyRecord>(unwrapData(payload))
    .map((entry) =>
      mapSupplierRow(entry, [
        "outstanding",
        "totalBalance",
        "totalLocal",
        "allLocalAmt",
        "amount",
        "total",
      ]),
    )
    .filter((entry) => entry.amount >= 0)

const normalizeOverdueSuppliers = (payload: unknown): ApSupplier[] =>
  asArray<AnyRecord>(unwrapData(payload))
    .map((entry) =>
      mapSupplierRow(entry, [
        "overdueLocal",
        "overdueAmount",
        "overdueOutstanding",
        "outstanding",
        "amount",
      ]),
    )
    .filter((entry) => entry.amount >= 0)

const normalizeTransactions = (payload: unknown): ApTxn[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((entry) => ({
    documentNo: pickString(entry, ["documentNo", "docNo", "voucherNo"], ""),
    invoiceNo: pickString(entry, ["invoiceNo", "billNo", "referenceNo"], ""),
    supplierName: pickString(
      entry,
      ["supplierName", "supplier", "vendorName"],
      "Unknown Supplier",
    ),
    amount: pickNumber(entry, [
      "totLocalAmt",
      "totAmt",
      "amount",
      "total",
      "netAmount",
    ]),
    status: pickString(entry, ["status", "state", "paymentStatus"], "Open"),
    date: formatDate(
      pickString(entry, [
        "trnDate",
        "accountDate",
        "date",
        "txnDate",
        "createdAt",
      ]),
    ),
  }))

export default function APOverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["ap-overview-kpi", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.ap.kpi, { companyId }),
    enabled: !!companyId,
  })
  const agingQuery = useQuery({
    queryKey: ["ap-overview-aging", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.ap.aging, { companyId }),
    enabled: !!companyId,
  })
  const overdueSuppliersQuery = useQuery({
    queryKey: ["ap-overview-overdue-suppliers", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.overdueSuppliers, { companyId }),
    enabled: !!companyId,
  })
  const topSuppliersQuery = useQuery({
    queryKey: ["ap-overview-top-suppliers", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.topSuppliers, { companyId }),
    enabled: !!companyId,
  })
  const todayTxnQuery = useQuery({
    queryKey: ["ap-overview-today-tx", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.todayTransactions, { companyId }),
    enabled: !!companyId,
  })
  const weekTxnQuery = useQuery({
    queryKey: ["ap-overview-week-tx", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.weekTransactions, { companyId }),
    enabled: !!companyId,
  })

  const kpi = normalizeKpi(kpiQuery.data)
  const aging = normalizeAging(agingQuery.data)
  const topSuppliers = normalizeTopSuppliers(topSuppliersQuery.data)
  const overdueSuppliers = normalizeOverdueSuppliers(overdueSuppliersQuery.data)
  const txRows = normalizeTransactions(weekTxnQuery.data)
  const todayRows = normalizeTransactions(todayTxnQuery.data)

  const formatMoney = (value: number) =>
    `AED ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`

  const chartBase = useMemo(() => {
    const maxFromAging = Math.max(...aging.map((x) => asNumber(x.amount)), 0)
    const maxFromSuppliers = Math.max(
      ...topSuppliers.map((x) => asNumber(x.amount)),
      0
    )
    return Math.max(maxFromAging, maxFromSuppliers, 1)
  }, [aging, topSuppliers])

  const columns: ColumnDef<ApTxn>[] = [
    {
      accessorKey: "documentNo",
      header: "Document",
      cell: ({ row }) =>
        row.original.documentNo || row.original.invoiceNo || "-",
    },
    { accessorKey: "supplierName", header: "Supplier" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatMoney(asNumber(row.original.amount)),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => row.original.date || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.status || "Open"}</Badge>
      ),
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
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some AP data failed to load</AlertTitle>
          <AlertDescription>
            The page is showing available data only. Please refresh or check API
            availability.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total AP</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {kpiQuery.isPending ? (
              <Skeleton className="h-7 w-36" />
            ) : (
              formatMoney(kpi.totalOutstanding)
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue AP</CardTitle>
          </CardHeader>
          <CardContent className="text-destructive flex items-center gap-2 text-2xl font-semibold">
            <AlertTriangle className="h-5 w-5" />
            {kpiQuery.isPending ? (
              <Skeleton className="h-7 w-36" />
            ) : (
              formatMoney(kpi.overdueOutstanding)
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">DPO</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <DollarSign className="h-5 w-5" />
            {kpiQuery.isPending ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              `${kpi.dpoDays} days`
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <FileText className="h-5 w-5" />
            {kpiQuery.isPending ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              kpi.pendingApprovals
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aging (Chart)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agingQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : aging.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No aging data found.
              </p>
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
                      style={{
                        width: `${(asNumber(item.amount) / chartBase) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers (Chart)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSuppliersQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : topSuppliers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No supplier ranking data found.
              </p>
            ) : (
              topSuppliers.map((item, idx) => {
                const amount = asNumber(item.amount)
                return (
                  <div
                    key={`${item.supplierName}-${idx}`}
                    className="space-y-1"
                  >
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
        <CardHeader>
          <CardTitle>Transactions (TanStack Table)</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewDataTable
            data={txRows}
            columns={columns}
            emptyMessage={
              weekTxnQuery.isPending
                ? "Loading..."
                : "No weekly transactions found"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewDataTable
            data={todayRows}
            columns={columns}
            emptyMessage={
              todayTxnQuery.isPending
                ? "Loading..."
                : "No today transactions found"
            }
          />
        </CardContent>
      </Card>

      {(overdueSuppliers.length > 0 ||
        overdueSuppliersQuery.isPending ||
        isInitialLoading) && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue Suppliers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueSuppliersQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : overdueSuppliers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No overdue suppliers found.
              </p>
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
