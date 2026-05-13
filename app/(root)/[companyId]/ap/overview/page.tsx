"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  Clock3,
  DollarSign,
  FileText,
  Landmark,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDashboardRoutes } from "@/lib/overview-dashboard-routes"
import { pickNumber, pickString } from "@/lib/overview-row-pickers"
import {
  formatOverviewCompactNumber,
  OverviewBarList,
  OverviewMetricCard,
  OverviewMetricGrid,
  OverviewPageShell,
  OverviewSectionCard,
  OverviewStatChip,
} from "@/components/accounting/overview-dashboard"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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
  if (!raw) return "-"
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleDateString("en-GB")
}

const formatPeriodLabel = (value: unknown): string => {
  const raw = asString(value)
  if (!raw) return "—"
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  })
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
type ApSpendVsPaymentsRow = {
  period: string
  invoicedAmount: number
  paidAmount: number
}
type ApPaymentTargetRow = {
  period: string
  targetAmount: number
  actualAmount: number
  achievementPct: number
}
type ApCashOutflowRow = {
  period: string
  expectedOutflow: number
}
type ApVendorConcentrationRow = {
  supplierId?: string
  supplierName: string
  payablesAmount: number
  pctOfTotal: number
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
    dpoDays: pickNumber(data, [
      "dpo",
      "dpoDays",
      "daysPayableOutstanding",
      "DpoDays",
    ]),
  }
}

const isWideApAgingRow = (entry: AnyRecord): boolean => {
  const keys = Object.keys(entry)
  const hasDayBand = keys.some((key) => /Days_\d|days[_-]?\d/i.test(key))
  if (!hasDayBand) return false
  const hasSupplierLike = keys.some(
    (key) =>
      /(supplier|vendor|payee)(id|code|key)$/i.test(key) ||
      /^partyid$/i.test(key)
  )
  const hasSupplierName = keys.some((key) =>
    /^(suppliername|vendorname|payeename)$/i.test(key)
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
      for (const [key, value] of Object.entries(row)) {
        if (re.test(key)) amount += asNumber(value)
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
    .map((entry) => ({
      bucket:
        pickString(entry, ["bucket", "label", "range", "name"], "Unclassified") ||
        "Unclassified",
      amount: pickNumber(entry, [
        "amount",
        "value",
        "outstanding",
        "AllLocalAmt",
        "TotLocalAmt",
        "totLocalAmt",
      ]),
    }))
    .filter((entry) => entry.amount >= 0)
}

const mapSupplierRow = (entry: AnyRecord, amountKeys: string[]): ApSupplier => ({
  supplierName: pickString(
    entry,
    ["supplierName", "name", "supplier", "vendor"],
    "Unknown Supplier"
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
      ])
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
      ])
    )
    .filter((entry) => entry.amount >= 0)

const normalizeTransactions = (payload: unknown): ApTxn[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((entry) => ({
    documentNo: pickString(entry, ["documentNo", "docNo", "voucherNo"], ""),
    invoiceNo: pickString(entry, ["invoiceNo", "billNo", "referenceNo"], ""),
    supplierName: pickString(
      entry,
      ["supplierName", "supplier", "vendorName"],
      "Unknown Supplier"
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
      ])
    ),
  }))

const normalizeSpendVsPayments = (payload: unknown): ApSpendVsPaymentsRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((entry) => ({
    period: formatPeriodLabel(
      pickString(entry, ["YearMonth", "yearMonth", "PeriodMonth", "periodMonth"], "")
    ),
    invoicedAmount: pickNumber(entry, ["InvoicedAmount", "invoicedAmount"]),
    paidAmount: pickNumber(entry, ["PaidAmount", "paidAmount"]),
  }))

const normalizePaymentTargetVsActual = (payload: unknown): ApPaymentTargetRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((entry) => {
    const targetAmount = pickNumber(entry, ["TargetAmount", "targetAmount"])
    const actualAmount = pickNumber(entry, ["ActualAmount", "actualAmount"])
    const rawPct = targetAmount > 0 ? (actualAmount / targetAmount) * 100 : 0
    return {
      period: formatPeriodLabel(
        pickString(entry, ["PeriodMonth", "periodMonth", "YearMonth"], "")
      ),
      targetAmount,
      actualAmount,
      achievementPct: Math.min(150, rawPct),
    }
  })

const normalizeCashOutflowForecast = (payload: unknown): ApCashOutflowRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((entry) => ({
    period: formatPeriodLabel(
      pickString(entry, ["ForecastDate", "forecastDate", "PeriodMonth"], "")
    ),
    expectedOutflow: pickNumber(entry, [
      "ExpectedOutflow",
      "expectedOutflow",
      "amount",
    ]),
  }))

const normalizeVendorConcentration = (
  payload: unknown
): ApVendorConcentrationRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((entry) => {
    const rawPct = pickNumber(entry, ["PctOfTotal", "pctOfTotal", "percentage"])
    const pctOfTotal = rawPct > 0 && rawPct <= 1 ? rawPct * 100 : rawPct
    return {
      supplierId: pickString(entry, ["SupplierId", "supplierId"], ""),
      supplierName: pickString(
        entry,
        ["SupplierName", "supplierName", "name"],
        "Unknown Supplier"
      ),
      payablesAmount: pickNumber(entry, [
        "PayablesAmount",
        "payablesAmount",
        "amount",
      ]),
      pctOfTotal,
    }
  })

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
  const spendVsPaymentsQuery = useQuery({
    queryKey: ["ap-overview-spend-vs-payments", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.spendVsPayments, { companyId }),
    enabled: !!companyId,
  })
  const paymentTargetQuery = useQuery({
    queryKey: ["ap-overview-payment-target", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.paymentTargetVsActual, { companyId }),
    enabled: !!companyId,
  })
  const cashOutflowForecastQuery = useQuery({
    queryKey: ["ap-overview-cash-outflow-forecast", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.cashOutflowForecast, {
        companyId,
        horizonDays: "90",
      }),
    enabled: !!companyId,
  })
  const vendorConcentrationQuery = useQuery({
    queryKey: ["ap-overview-vendor-concentration", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ap.vendorConcentration, { companyId }),
    enabled: !!companyId,
  })

  const kpi = normalizeKpi(kpiQuery.data)
  const aging = normalizeAging(agingQuery.data)
  const topSuppliers = normalizeTopSuppliers(topSuppliersQuery.data)
  const overdueSuppliers = normalizeOverdueSuppliers(overdueSuppliersQuery.data)
  const txRows = normalizeTransactions(weekTxnQuery.data)
  const todayRows = normalizeTransactions(todayTxnQuery.data)
  const spendVsPaymentsRows = normalizeSpendVsPayments(spendVsPaymentsQuery.data)
  const paymentTargetRows = normalizePaymentTargetVsActual(paymentTargetQuery.data)
  const cashOutflowRows = normalizeCashOutflowForecast(
    cashOutflowForecastQuery.data
  )
  const vendorConcentrationRows = normalizeVendorConcentration(
    vendorConcentrationQuery.data
  )

  const formatMoney = (value: number) =>
    `AED ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`

  const chartBase = useMemo(() => {
    const maxFromAging = Math.max(...aging.map((row) => asNumber(row.amount)), 0)
    const maxFromSuppliers = Math.max(
      ...topSuppliers.map((row) => asNumber(row.amount)),
      ...overdueSuppliers.map((row) => asNumber(row.amount)),
      0
    )
    return Math.max(maxFromAging, maxFromSuppliers, 1)
  }, [aging, overdueSuppliers, topSuppliers])

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

  const hasError =
    kpiQuery.isError ||
    agingQuery.isError ||
    topSuppliersQuery.isError ||
    overdueSuppliersQuery.isError ||
    todayTxnQuery.isError ||
    weekTxnQuery.isError ||
    spendVsPaymentsQuery.isError ||
    paymentTargetQuery.isError ||
    cashOutflowForecastQuery.isError ||
    vendorConcentrationQuery.isError

  const todayEmptyMessage = todayTxnQuery.isPending
    ? "Loading today transactions..."
    : "No today transactions found"
  const weekEmptyMessage = weekTxnQuery.isPending
    ? "Loading weekly transactions..."
    : "No weekly transactions found"

  return (
    <OverviewPageShell
      module="ap"
      title="Accounts Payable Overview"
      description="A modern payables dashboard for supplier exposure, payment timing, and cash-outflow planning."
    >
      {hasError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some AP data failed to load</AlertTitle>
          <AlertDescription>
            The page is showing available data only. Please refresh or check API
            availability.
          </AlertDescription>
        </Alert>
      ) : null}

      <OverviewMetricGrid>
        <OverviewMetricCard
          module="ap"
          title="Total AP"
          value={kpiQuery.isPending ? <Skeleton className="h-8 w-32" /> : formatMoney(kpi.totalOutstanding)}
          subtitle="Open payable balance across suppliers."
          meta={<OverviewStatChip module="ap">Overdue {formatMoney(kpi.overdueOutstanding)}</OverviewStatChip>}
          icon={Landmark}
        />
        <OverviewMetricCard
          module="ap"
          title="Overdue AP"
          value={kpiQuery.isPending ? <Skeleton className="h-8 w-32" /> : formatMoney(kpi.overdueOutstanding)}
          subtitle="Supplier balances already outside terms."
          meta={<OverviewStatChip module="ap">Top suppliers {formatOverviewCompactNumber(topSuppliers.length)}</OverviewStatChip>}
          icon={AlertTriangle}
          tone="danger"
        />
        <OverviewMetricCard
          module="ap"
          title="DPO"
          value={kpiQuery.isPending ? <Skeleton className="h-8 w-20" /> : `${kpi.dpoDays} days`}
          subtitle="Average days payable outstanding."
          meta={<OverviewStatChip module="ap">Pending approvals {formatOverviewCompactNumber(kpi.pendingApprovals)}</OverviewStatChip>}
          icon={DollarSign}
        />
        <OverviewMetricCard
          module="ap"
          title="Today transactions"
          value={formatOverviewCompactNumber(todayRows.length)}
          subtitle="Documents processed through AP today."
          meta={<OverviewStatChip module="ap">This week {formatOverviewCompactNumber(txRows.length)}</OverviewStatChip>}
          icon={Clock3}
        />
        <OverviewMetricCard
          module="ap"
          title="Payment target"
          value={
            paymentTargetRows.length > 0 ? `${paymentTargetRows[0]?.achievementPct.toFixed(1)}%` : "—"
          }
          subtitle="Most recent payment target achievement snapshot."
          meta={<OverviewStatChip module="ap">Forecast rows {formatOverviewCompactNumber(cashOutflowRows.length)}</OverviewStatChip>}
          icon={TrendingUp}
          tone={
            paymentTargetRows[0]?.achievementPct >= 100
              ? "positive"
              : paymentTargetRows[0]?.achievementPct >= 75
                ? "warning"
                : "neutral"
          }
        />
        <OverviewMetricCard
          module="ap"
          title="Vendor concentration"
          value={
            vendorConcentrationRows.length > 0
              ? `${vendorConcentrationRows[0]?.pctOfTotal.toFixed(1)}%`
              : "—"
          }
          subtitle="Largest supplier share of current AP exposure."
          meta={<OverviewStatChip module="ap">Suppliers {formatOverviewCompactNumber(vendorConcentrationRows.length)}</OverviewStatChip>}
          icon={Users}
        />
      </OverviewMetricGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ap"
          title="Aging buckets"
          description="Where the payable balance is sitting by maturity band."
          icon={Clock3}
        >
          <OverviewBarList
            module="ap"
            items={aging.map((item, idx) => ({
              key: `aging-${idx}`,
              label: item.bucket,
              value: formatMoney(item.amount),
              progress: (item.amount / chartBase) * 100,
            }))}
            emptyMessage={
              agingQuery.isPending ? "Loading aging data..." : "No aging data found."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ap"
          title="Top suppliers"
          description="Largest supplier exposures in the AP portfolio."
          icon={Users}
        >
          <OverviewBarList
            module="ap"
            items={topSuppliers.map((item, idx) => ({
              key: `supplier-${idx}`,
              label: item.supplierName,
              value: formatMoney(item.amount),
              progress: (item.amount / chartBase) * 100,
            }))}
            emptyMessage={
              topSuppliersQuery.isPending
                ? "Loading supplier rankings..."
                : "No supplier ranking data found."
            }
          />
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ap"
          title="Overdue suppliers"
          description="Suppliers contributing the most overdue payable balances."
          icon={AlertTriangle}
        >
          <OverviewBarList
            module="ap"
            items={overdueSuppliers.slice(0, 8).map((item, idx) => ({
              key: `overdue-${idx}`,
              label: item.supplierName,
              value: formatMoney(item.amount),
              progress: (item.amount / chartBase) * 100,
              tone: "danger" as const,
            }))}
            emptyMessage={
              overdueSuppliersQuery.isPending
                ? "Loading overdue suppliers..."
                : "No overdue suppliers found."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ap"
          title="Vendor concentration"
          description="Supplier share of total AP exposure using the available concentration endpoint."
          icon={Landmark}
        >
          <OverviewBarList
            module="ap"
            items={vendorConcentrationRows.slice(0, 8).map((row, idx) => ({
              key: row.supplierId || `vendor-${idx}`,
              label: row.supplierName,
              value: `${row.pctOfTotal.toFixed(1)}%`,
              hint: formatMoney(row.payablesAmount),
              progress: row.pctOfTotal,
            }))}
            emptyMessage={
              vendorConcentrationQuery.isPending
                ? "Loading vendor concentration..."
                : "No vendor concentration data."
            }
          />
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ap"
          title="Spend vs payments"
          description="Monthly invoiced amount against payments made."
          icon={TrendingUp}
        >
          {spendVsPaymentsRows.length > 0 ? (
            (() => {
              const maxAmt = Math.max(
                ...spendVsPaymentsRows.flatMap((row) => [
                  row.invoicedAmount,
                  row.paidAmount,
                ]),
                1
              )
              const totalSpend = spendVsPaymentsRows.reduce(
                (sum, row) => sum + row.invoicedAmount,
                0
              )
              const totalPaid = spendVsPaymentsRows.reduce(
                (sum, row) => sum + row.paidAmount,
                0
              )
              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    <OverviewStatChip module="ap">
                      Spend {formatMoney(totalSpend)}
                    </OverviewStatChip>
                    <OverviewStatChip module="ap">
                      Paid {formatMoney(totalPaid)}
                    </OverviewStatChip>
                  </div>
                  <div className="space-y-2">
                    {spendVsPaymentsRows.slice(0, 6).map((row, idx) => {
                      const spendPct = (row.invoicedAmount / maxAmt) * 100
                      const paidPct = (row.paidAmount / maxAmt) * 100
                      const gap = row.paidAmount - row.invoicedAmount

                      return (
                        <div key={row.period || idx} className="space-y-1">
                          <div className="flex justify-between gap-3 text-xs">
                            <span>{row.period}</span>
                            <span
                              className={
                                gap >= 0
                                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                  : "font-semibold text-destructive"
                              }
                            >
                              {gap >= 0 ? "+" : "-"}
                              {formatMoney(Math.abs(gap))}
                            </span>
                          </div>
                          <div className="bg-muted h-1.5 rounded-full">
                            <div
                              className="h-1.5 rounded-full bg-amber-500"
                              style={{ width: `${Math.max(spendPct, 1)}%` }}
                            />
                          </div>
                          <div className="bg-muted h-1.5 rounded-full">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500"
                              style={{ width: `${Math.max(paidPct, 1)}%` }}
                            />
                          </div>
                          <div className="text-muted-foreground flex justify-between text-xs">
                            <span>Spend {formatMoney(row.invoicedAmount)}</span>
                            <span>Paid {formatMoney(row.paidAmount)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">
              {spendVsPaymentsQuery.isPending
                ? "Loading spend vs payments..."
                : "No spend vs payments data."}
            </p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ap"
          title="Payment target vs actual"
          description="Monthly payment achievement against target."
          icon={FileText}
        >
          {paymentTargetRows.length > 0 ? (
            <div className="space-y-2">
              {paymentTargetRows.slice(0, 6).map((row, idx) => {
                const barWidth = Math.min(100, row.achievementPct)
                const tone =
                  row.achievementPct >= 100
                    ? "bg-emerald-500"
                    : row.achievementPct >= 75
                      ? "bg-amber-500"
                      : "bg-destructive"

                return (
                  <div key={row.period || idx} className="space-y-1">
                    <div className="flex justify-between gap-3 text-xs">
                      <span>{row.period}</span>
                      <span
                        className={
                          row.achievementPct >= 100
                            ? "font-semibold text-emerald-600 dark:text-emerald-400"
                            : row.achievementPct >= 75
                              ? "font-semibold text-amber-600 dark:text-amber-400"
                              : "font-semibold text-destructive"
                        }
                      >
                        {row.achievementPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-muted h-2 rounded-full">
                      <div
                        className={tone}
                        style={{
                          width: `${Math.max(barWidth, 1)}%`,
                          height: "100%",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>Actual {formatMoney(row.actualAmount)}</span>
                      <span>Target {formatMoney(row.targetAmount)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {paymentTargetQuery.isPending
                ? "Loading payment target performance..."
                : "No payment target data."}
            </p>
          )}
        </OverviewSectionCard>
      </div>

      <OverviewSectionCard
        module="ap"
        title="Cash outflow forecast"
        description="Upcoming payables expected to convert to cash outflow over the selected horizon."
        icon={Wallet}
      >
        <OverviewBarList
          module="ap"
          items={cashOutflowRows.map((row, idx) => {
            const forecastBase = Math.max(
              ...cashOutflowRows.map((entry) => entry.expectedOutflow),
              1
            )
            return {
              key: `forecast-${idx}`,
              label: row.period,
              value: formatMoney(row.expectedOutflow),
              progress: (row.expectedOutflow / forecastBase) * 100,
            }
          })}
          emptyMessage={
            cashOutflowForecastQuery.isPending
              ? "Loading cash outflow forecast..."
              : "No cash outflow forecast data."
          }
        />
      </OverviewSectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ap"
          title="Week transactions"
          description="Recent payable transactions over the latest weekly window."
          icon={Clock3}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={txRows}
            columns={columns}
            emptyMessage={weekEmptyMessage}
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ap"
          title="Today transactions"
          description="Supplier and payable documents raised today."
          icon={FileText}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={todayRows}
            columns={columns}
            emptyMessage={todayEmptyMessage}
          />
        </OverviewSectionCard>
      </div>
    </OverviewPageShell>
  )
}
