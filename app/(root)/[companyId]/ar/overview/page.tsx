"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock3,
  FileText,
  Landmark,
  Percent,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDashboardRoutes } from "@/lib/overview-dashboard-routes"
import { pickNumber, pickString } from "@/lib/overview-row-pickers"
import { cn } from "@/lib/utils"
import {
  formatOverviewCompactNumber,
  OverviewBarList,
  OverviewMetricCard,
  OverviewMetricGrid,
  OverviewPageShell,
  OverviewSectionCard,
  OverviewStatChip,
} from "@/components/accounting/overview-dashboard"
import { Badge } from "@/components/ui/badge"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type AnyRecord = Record<string, unknown>

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** Arrays are typeof "object" — exclude them from plain record handling. */
const isPlainObject = (value: unknown): value is AnyRecord =>
  isRecord(value) && !Array.isArray(value)

const unwrapPayload = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload
  }
  if ("data" in payload) {
    const d = payload.data
    if (d !== undefined && d !== null) {
      return d
    }
    return null
  }
  if ("Data" in payload) {
    const d = (payload as AnyRecord).Data as unknown
    if (d !== undefined && d !== null) {
      return d
    }
    return null
  }
  if ("payload" in payload && payload.payload !== undefined) {
    return payload.payload
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
    "data",
    "Data",
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
  if (Array.isArray(value)) {
    const firstObject = value.find((item) => isPlainObject(item))
    return (firstObject ?? {}) as T
  }

  if (isPlainObject(value)) {
    return value as T
  }

  return {} as T
}

const asNumber = (value: unknown): number =>
  typeof value === "number" ? value : Number(value || 0)

const firstDefined = (...values: unknown[]): unknown =>
  values.find((value) => value !== undefined && value !== null)

/**
 * Overview row shapes come from Dapper `dynamic` → JSON keys match SQL column names (often PascalCase).
 *
 * | Stored proc (api-core)        | Used for |
 * |-------------------------------|----------|
 * | Ovw_AR_Kpi                    | KPI cards |
 * | Ovw_AR_Aging                  | Aging buckets |
 * | Ovw_AR_TopCustomers           | Top customers |
 * | Ovw_AR_OverdueCustomers       | Overdue list (often overdue-style amounts) |
 * | Ovw_AR_TransactionsToday      | Today grid |
 * | Ovw_AR_TransactionsWeek       | Week grid (often ArTransactions-style: TotAmt, AccountDate) |
 */
const AGING_STACK_SEGMENT = [
  "bg-emerald-600",
  "bg-sky-600",
  "bg-amber-500",
  "bg-orange-600",
  "bg-red-600",
  "bg-violet-600",
] as const

const AMOUNT_KEY =
  /(amt|bal|amount|outstanding|total|local|tran|value|balance|lc|lcy|gross|net)/i
const AMOUNT_KEY_EXCLUDE =
  /(id|count|rank|pct|percent|day|rate|currency|exh|company|module|transaction|customer|document|sort|srno|lineno|qty|quantity|price)/i
const LABEL_KEY =
  /(desc|name|label|range|bucket|period|title|group|aging|day|from|to|str|text)/i

const inferNumericAmount = (entry: AnyRecord): number => {
  let best = 0
  for (const [k, v] of Object.entries(entry)) {
    if (!AMOUNT_KEY.test(k) || AMOUNT_KEY_EXCLUDE.test(k)) continue
    const n = asNumber(v)
    if (Number.isFinite(n) && Math.abs(n) > Math.abs(best)) best = n
  }
  return best
}

const inferStringLabel = (entry: AnyRecord): string => {
  for (const [k, v] of Object.entries(entry)) {
    if (typeof v !== "string") continue
    const s = v.trim()
    if (!s || s.length > 120) continue
    if (LABEL_KEY.test(k)) return s
  }
  return ""
}

const daysRangeLabel = (entry: AnyRecord): string | undefined => {
  const from = firstDefined(
    entry.fromDays,
    entry.FromDays,
    entry.daysFrom,
    entry.DaysFrom
  )
  const to = firstDefined(
    entry.toDays,
    entry.ToDays,
    entry.daysTo,
    entry.DaysTo
  )
  if (from === undefined && to === undefined) return undefined
  return `${asNumber(from)}–${asNumber(to)} days`
}

const formatApiDate = (value: unknown): string => {
  if (value === undefined || value === null) return ""
  const raw =
    typeof value === "string"
      ? value
      : value instanceof Date
        ? value.toISOString()
        : String(value)
  if (!raw) return ""
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-GB")
}

type ArKpi = {
  totalAROutstanding: number
  overdueAR: number
  pendingApprovals: number
  dso: number
  cei: number
}

/** Maps SqlResponse / Ovw_AR_Kpi row (PascalCase) and legacy camelCase keys to UI fields. */
const normalizeArKpi = (payload: unknown): ArKpi => {
  const row = asObject<AnyRecord>(unwrapPayload(payload))
  return {
    totalAROutstanding: pickNumber(row, [
      "totalAROutstanding",
      "TotalOutstandingLocal",
      "totalOutstandingTran",
      "totalOutstanding",
    ]),
    overdueAR: pickNumber(row, [
      "overdueAR",
      "OverdueOutstandingLocal",
      "overdueOutstandingTran",
      "overdueOutstanding",
    ]),
    pendingApprovals: pickNumber(row, [
      "pendingApprovals",
      "PendingApprovals",
      "pendingCount",
      "PendingApprovalCount",
    ]),
    dso: pickNumber(row, ["dso", "Dso", "DSO", "dsoDays", "DaysSalesOutstanding"]),
    cei: pickNumber(row, [
      "cei",
      "CEI",
      "collectionEffectivenessIndex",
      "CollectionEffectivenessIndex",
    ]),
  }
}

type ArAgingRow = { bucket: string; amount: number; percentage?: number }

type ArCustomer = {
  customerName?: string
  amount?: number
  outstanding?: number
}

type ArTxn = {
  documentNo?: string
  invoiceNo?: string
  customerName?: string
  amount?: number
  status?: string
  trnDate?: string
  date?: string
}

const normalizeAging = (payload: unknown): ArAgingRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => {
    const bucketFromColumns = pickString(
      entry,
      [
        "bucket",
        "label",
        "range",
        "name",
        "agingBucket",
        "description",
        "desc",
        "groupName",
        "period",
        "strBucket",
        "agingDesc",
        "ageingDesc",
      ],
      "",
    ).trim()
    const rangeLabel = daysRangeLabel(entry)?.trim() ?? ""
    const bucketRaw = (bucketFromColumns || rangeLabel).trim()
    const bucket =
      bucketRaw ||
      inferStringLabel(entry) ||
      rangeLabel ||
      "N/A"
    const explicitAmount = pickNumber(entry, [
      "amount",
      "value",
      "outstanding",
      "totalAmount",
      "outstandingLocal",
      "totLocalAmt",
      "totAmt",
      "balance",
      "localAmount",
      "tranAmount",
      "osAmt",
      "invoiceAmt",
    ])
    const amount =
      explicitAmount !== 0 ? explicitAmount : inferNumericAmount(entry)
    return {
      bucket,
      amount,
      percentage: pickNumber(entry, ["percentage", "pct"]),
    }
  })

const customerNameFrom = (entry: AnyRecord): string | undefined => {
  const n = pickString(entry, ["customerName", "name", "customer"], "").trim()
  return n || undefined
}

/** Ovw_AR_TopCustomers — balance-style columns. */
const normalizeArTopCustomers = (payload: unknown): ArCustomer[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    customerName: customerNameFrom(entry),
    outstanding: pickNumber(entry, [
      "outstanding",
      "outstandingLocal",
      "balance",
      "totalBalance",
      "totalBalanceLocal",
      "totalOutstanding",
      "amount",
      "totLocalAmt",
    ]),
    amount: pickNumber(entry, ["amount"]),
  }))

/** Ovw_AR_OverdueCustomers — same names as Kendo overview types (`overdueAmount`). */
const normalizeArOverdueCustomers = (payload: unknown): ArCustomer[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    customerName: customerNameFrom(entry),
    outstanding: pickNumber(entry, [
      "overdueAmount",
      "overdueOutstanding",
      "overdueOutstandingLocal",
      "overdueLocal",
      "overdueBalance",
      "outstanding",
      "balance",
      "amount",
      "totLocalAmt",
    ]),
    amount: pickNumber(entry, ["overdueAmount", "amount"]),
  }))

const normalizeArTxns = (payload: unknown): ArTxn[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => {
    const rawDate = pickString(
      entry,
      [
        "trnDate",
        "txnDate",
        "transactionDate",
        "accountDate",
        "refAccountDate",
        "postDate",
        "docDate",
        "date",
      ],
      "",
    )
    const dateStr = formatApiDate(rawDate)
    const explicitAmount = pickNumber(entry, [
      "amount",
      "totAmt",
      "totLocalAmt",
      "balAmt",
      "balLocalAmt",
      "netAmount",
      "total",
      "localAmount",
    ])
    const amount =
      explicitAmount !== 0 ? explicitAmount : inferNumericAmount(entry)
    return {
      documentNo: pickString(entry, ["documentNo", "docNo", "referenceNo"], ""),
      invoiceNo: pickString(entry, ["invoiceNo", "billNo"], ""),
      customerName: pickString(entry, ["customerName", "customer"], ""),
      amount,
      status: pickString(entry, ["status", "state"], "Open"),
      trnDate: dateStr,
      date: dateStr,
    }
  })

type CreditLimitRow = {
  customerId?: string
  customerName?: string
  creditLimit: number
  outstanding: number
  utilizationPct: number
}

type DisputedInvoice = {
  documentNo?: string
  customerName?: string
  amount: number
  disputeReason?: string
  disputeDate?: string
}

type UnappliedReceipt = {
  documentNo?: string
  customerName?: string
  amount: number
  receiptDate?: string
}

type OpenCollectionTask = {
  customerName?: string
  amount: number
  daysPastDue: number
  taskType?: string
  assignedTo?: string
}

const normalizeCreditLimitUtilization = (payload: unknown): CreditLimitRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => {
    const creditLimit = pickNumber(entry, ["creditLimit", "crLimit"])
    const outstanding = pickNumber(entry, [
      "outstanding",
      "outstandingBalance",
      "osAmt",
      "totalOutstanding",
    ])
    const rawPct = pickNumber(entry, ["utilizationPct", "utilization"])
    const utilizationPct =
      rawPct !== 0
        ? rawPct
        : creditLimit > 0
          ? (outstanding / creditLimit) * 100
          : 0
    return {
      customerId: pickString(entry, ["customerId"], ""),
      customerName: pickString(entry, ["customerName", "name"], "Unknown"),
      creditLimit,
      outstanding,
      utilizationPct: Math.min(100, Math.max(0, utilizationPct)),
    }
  })

const normalizeDisputedInvoices = (payload: unknown): DisputedInvoice[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    documentNo: pickString(entry, ["documentNo", "docNo"], ""),
    customerName: pickString(entry, ["customerName", "name"], "Unknown"),
    amount: pickNumber(entry, ["amount", "invoiceAmt", "totAmt"]),
    disputeReason: pickString(
      entry,
      ["disputeReason", "reason", "description"],
      "—",
    ),
    disputeDate: formatApiDate(
      pickString(entry, ["disputeDate", "trnDate", "date"], ""),
    ),
  }))

const normalizeUnappliedReceipts = (payload: unknown): UnappliedReceipt[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    documentNo: pickString(entry, ["documentNo", "receiptNo", "docNo"], ""),
    customerName: pickString(entry, ["customerName", "name"], "Unknown"),
    amount: pickNumber(entry, ["amount", "receiptAmt", "totAmt"]),
    receiptDate: formatApiDate(
      pickString(entry, ["receiptDate", "trnDate", "date"], ""),
    ),
  }))

type SalesVsCollectionsRow = {
  period?: string
  salesAmount: number
  collectionsAmount: number
}

type CollectionTargetRow = {
  period?: string
  target: number
  actual: number
  achievementPct: number
}

type CashInflowForecastRow = {
  period?: string
  expectedAmount: number
  probability: number
}

type DsoTrendRow = {
  period: string
  dso: number
  targetDso: number
}

type InvoiceDueRow = {
  documentNo?: string
  customerName?: string
  dueDate?: string
  amount: number
  daysUntilDue: number
}

type PaymentBehaviorRow = {
  customerId?: string
  customerName?: string
  avgDaysToPay: number
  creditTermsDays: number
  delinquencyDays: number
  invoiceCount: number
}

type BadDebtRow = {
  customerId?: string
  customerName?: string
  documentNo?: string
  amount: number
  daysPastDue: number
  riskCategory: string
}

type OnHoldCustomerRow = {
  customerId?: string
  customerName?: string
  outstandingAmount: number
  holdReason?: string
  holdDate?: string
  blockedOrders: number
}

const normalizeSalesVsCollections = (payload: unknown): SalesVsCollectionsRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    period: pickString(
      entry,
      [
        "period",
        "month",
        "periodName",
        "monthName",
        "yearMonth",
      ],
      "",
    ),
    salesAmount: pickNumber(entry, [
      "salesAmount",
      "sales",
      "creditSales",
      "invoicedAmount",
      "invoiced",
    ]),
    collectionsAmount: pickNumber(entry, [
      "collectionsAmount",
      "collections",
      "cashCollected",
      "collectedAmount",
      "collected",
      "receiptsAmount",
    ]),
  }))

const normalizeCollectionTarget = (payload: unknown): CollectionTargetRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => {
    const target = pickNumber(entry, [
      "target",
      "targetAmount",
      "collectionTarget",
    ])
    const actual = pickNumber(entry, [
      "actual",
      "actualAmount",
      "collected",
      "collectedAmount",
    ])
    const rawPct = pickNumber(entry, [
      "achievementPct",
      "achievement",
      "pct",
    ])
    return {
      period: pickString(entry, ["period", "month", "periodMonth"], ""),
      target,
      actual,
      achievementPct: rawPct !== 0 ? Math.min(150, rawPct) : target > 0 ? Math.min(150, (actual / target) * 100) : 0,
    }
  })

const normalizeCashInflowForecast = (payload: unknown): CashInflowForecastRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    period: pickString(
      entry,
      [
        "period",
        "bucket",
        "forecastPeriod",
        "forecastDate",
        "daysRange",
      ],
      "",
    ),
    expectedAmount: pickNumber(entry, [
      "expectedAmount",
      "expectedInflow",
      "amount",
      "forecastAmount",
      "projectedAmount",
    ]),
    probability: pickNumber(entry, [
      "probability",
      "confidence",
      "likelihoodPct",
    ]),
  }))

const normalizeOpenCollectionTasks = (payload: unknown): OpenCollectionTask[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    customerName: pickString(entry, ["customerName", "name"], "Unknown"),
    amount: pickNumber(entry, ["amount", "outstandingAmt", "totAmt"]),
    daysPastDue: Math.round(
      pickNumber(entry, ["daysPastDue", "daysOverdue"]),
    ),
    taskType: pickString(entry, ["taskType", "task", "type"], "Follow Up"),
    assignedTo: pickString(entry, ["assignedTo", "assignee"], ""),
  }))

const normalizeBadDebt = (payload: unknown): BadDebtRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    customerId: pickString(entry, ["customerId"], ""),
    customerName: pickString(entry, ["customerName", "name"], "Unknown"),
    documentNo: pickString(entry, ["documentNo", "docNo"], ""),
    amount: pickNumber(entry, [
      "amount",
      "badDebtAmount",
      "writeOffAmount",
      "totAmt",
    ]),
    daysPastDue: Math.round(
      pickNumber(entry, ["daysPastDue", "daysOverdue", "ageDays"]),
    ),
    riskCategory: pickString(
      entry,
      ["riskCategory", "risk", "category"],
      "Watch",
    ),
  }))

const normalizeOnHoldCustomers = (payload: unknown): OnHoldCustomerRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    customerId: pickString(entry, ["customerId"], ""),
    customerName: pickString(entry, ["customerName", "name"], "Unknown"),
    outstandingAmount: pickNumber(entry, [
      "outstandingAmount",
      "outstanding",
      "osAmt",
      "amount",
    ]),
    holdReason: pickString(
      entry,
      ["holdReason", "reason", "description"],
      "Credit hold",
    ),
    holdDate: formatApiDate(
      pickString(entry, ["holdDate", "creditHoldDate", "date"], ""),
    ),
    blockedOrders: Math.round(
      pickNumber(entry, [
        "blockedOrders",
        "pendingOrders",
        "openOrders",
      ]),
    ),
  }))

const normalizeDsoTrend = (payload: unknown): DsoTrendRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => ({
    period: pickString(entry, ["period", "month", "periodName"], ""),
    dso: pickNumber(entry, ["dso", "dsoDays"]),
    targetDso: pickNumber(entry, [
      "targetDso",
      "dsoTarget",
      "benchmarkDso",
    ]),
  }))

const normalizeInvoicesDue = (payload: unknown): InvoiceDueRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => {
    const rawDays = pickNumber(entry, [
      "daysUntilDue",
      "daysRemaining",
      "daysToMaturity",
    ])
    return {
      documentNo: pickString(
        entry,
        ["documentNo", "docNo", "invoiceNo"],
        "",
      ),
      customerName: pickString(entry, ["customerName", "name"], "Unknown"),
      dueDate: formatApiDate(
        pickString(entry, ["dueDate", "maturityDate", "paymentDueDate"], ""),
      ),
      amount: pickNumber(entry, ["amount", "invoiceAmt", "totAmt"]),
      daysUntilDue: rawDays,
    }
  })

const normalizePaymentBehavior = (payload: unknown): PaymentBehaviorRow[] =>
  asArray<AnyRecord>(unwrapPayload(payload)).map((entry) => {
    const avgDaysToPay = pickNumber(entry, [
      "avgDaysToPay",
      "averageDaysToPay",
      "avgDays",
    ])
    const creditTermsDays = pickNumber(entry, [
      "creditTermsDays",
      "creditTerms",
      "paymentTerms",
    ])
    const rawDelinquency = pickNumber(entry, [
      "delinquencyDays",
      "daysLate",
    ])
    return {
      customerId: pickString(entry, ["customerId"], ""),
      customerName: pickString(entry, ["customerName", "name"], "Unknown"),
      avgDaysToPay,
      creditTermsDays,
      delinquencyDays: rawDelinquency !== 0 ? rawDelinquency : avgDaysToPay - creditTermsDays,
      invoiceCount: Math.round(pickNumber(entry, ["invoiceCount", "count"])),
    }
  })

export default function AROverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["ar-overview-kpi", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.ar.kpi, { companyId }),
    enabled: !!companyId,
  })
  const agingQuery = useQuery({
    queryKey: ["ar-overview-aging", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.ar.aging, { companyId }),
    enabled: !!companyId,
  })
  const overdueCustomersQuery = useQuery({
    queryKey: ["ar-overview-overdue-customers", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.overdueCustomers, { companyId }),
    enabled: !!companyId,
  })
  const topCustomersQuery = useQuery({
    queryKey: ["ar-overview-top-customers", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.ar.topCustomers, { companyId }),
    enabled: !!companyId,
  })
  const todayTxnQuery = useQuery({
    queryKey: ["ar-overview-today-tx", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.todayTransactions, { companyId }),
    enabled: !!companyId,
  })
  const weekTxnQuery = useQuery({
    queryKey: ["ar-overview-week-tx", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.weekTransactions, { companyId }),
    enabled: !!companyId,
  })
  const creditLimitQuery = useQuery({
    queryKey: ["ar-overview-credit-limit", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.creditLimitUtilization, { companyId }),
    enabled: !!companyId,
  })
  const disputedQuery = useQuery({
    queryKey: ["ar-overview-disputed", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.disputedInvoices, { companyId }),
    enabled: !!companyId,
  })
  const unappliedQuery = useQuery({
    queryKey: ["ar-overview-unapplied", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.unappliedReceipts, { companyId }),
    enabled: !!companyId,
  })
  const collectionTasksQuery = useQuery({
    queryKey: ["ar-overview-collection-tasks", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.openCollectionTasks, { companyId }),
    enabled: !!companyId,
  })
  const salesVsCollectionsQuery = useQuery({
    queryKey: ["ar-overview-sales-vs-collections", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.salesVsCollections, { companyId }),
    enabled: !!companyId,
  })
  const collectionTargetQuery = useQuery({
    queryKey: ["ar-overview-collection-target", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.collectionTargetVsActual, {
        companyId,
      }),
    enabled: !!companyId,
  })
  const cashInflowForecastQuery = useQuery({
    queryKey: ["ar-overview-cash-inflow-forecast", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.cashInflowForecast, { companyId }),
    enabled: !!companyId,
  })
  const badDebtQuery = useQuery({
    queryKey: ["ar-overview-bad-debt", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.ar.badDebt, { companyId }),
    enabled: !!companyId,
  })
  const onHoldQuery = useQuery({
    queryKey: ["ar-overview-on-hold", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.onHoldCustomers, { companyId }),
    enabled: !!companyId,
  })
  const dsoTrendQuery = useQuery({
    queryKey: ["ar-overview-dso-trend", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.dsoTrend, { companyId, months: "12" }),
    enabled: !!companyId,
  })
  const invoicesDueQuery = useQuery({
    queryKey: ["ar-overview-invoices-due", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.invoicesDue, {
        companyId,
        horizonDays: "30",
      }),
    enabled: !!companyId,
  })
  const paymentBehaviorQuery = useQuery({
    queryKey: ["ar-overview-payment-behavior", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.ar.paymentBehavior, { companyId }),
    enabled: !!companyId,
  })

  const kpi = normalizeArKpi(kpiQuery.data)
  const aging = normalizeAging(agingQuery.data)
  const topCustomers = normalizeArTopCustomers(topCustomersQuery.data)
  const overdueCustomers = normalizeArOverdueCustomers(
    overdueCustomersQuery.data
  )
  const weekRows = normalizeArTxns(weekTxnQuery.data)
  const todayRows = normalizeArTxns(todayTxnQuery.data)
  const creditLimitRows = normalizeCreditLimitUtilization(creditLimitQuery.data)
  const disputedRows = normalizeDisputedInvoices(disputedQuery.data)
  const unappliedRows = normalizeUnappliedReceipts(unappliedQuery.data)
  const collectionTaskRows = normalizeOpenCollectionTasks(collectionTasksQuery.data)
  const salesVsCollectionsRows = normalizeSalesVsCollections(salesVsCollectionsQuery.data)
  const collectionTargetRows = normalizeCollectionTarget(collectionTargetQuery.data)
  const cashInflowForecastRows = normalizeCashInflowForecast(cashInflowForecastQuery.data)
  const dsoTrendRows = normalizeDsoTrend(dsoTrendQuery.data)
  const invoicesDueRows = normalizeInvoicesDue(invoicesDueQuery.data)
  const paymentBehaviorRows = normalizePaymentBehavior(paymentBehaviorQuery.data)
  const badDebtRows = normalizeBadDebt(badDebtQuery.data)
  const onHoldRows = normalizeOnHoldCustomers(onHoldQuery.data)

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
        cell: ({ row }) =>
          row.original.documentNo || row.original.invoiceNo || "-",
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
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.status || "Open"}</Badge>
        ),
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
    weekTxnQuery.isLoading ||
    creditLimitQuery.isLoading ||
    disputedQuery.isLoading ||
    unappliedQuery.isLoading ||
    collectionTasksQuery.isLoading

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
  ].find((error): error is Error => error instanceof Error)?.message

  const safeAging = useMemo(() => aging.slice(0, 6), [aging])
  const safeTopCustomers = useMemo(
    () => topCustomers.slice(0, 6),
    [topCustomers]
  )
  const safeOverdueCustomers = useMemo(
    () => overdueCustomers.slice(0, 6),
    [overdueCustomers]
  )

  const agingGrandTotal = useMemo(
    () => safeAging.reduce((s, r) => s + Math.max(0, asNumber(r.amount)), 0),
    [safeAging]
  )

  const overdueValue = asNumber(kpi.overdueAR)
  const totalOutstandingValue = asNumber(kpi.totalAROutstanding)
  const overdueRatio =
    totalOutstandingValue > 0
      ? Math.min(100, (overdueValue / totalOutstandingValue) * 100)
      : 0

  const withinTermsAR = useMemo(
    () => Math.max(0, totalOutstandingValue - overdueValue),
    [totalOutstandingValue, overdueValue]
  )

  const dsoValue = asNumber(kpi.dso)
  const ceiValue = asNumber(kpi.cei)
  const pendingApprovalsValue = asNumber(kpi.pendingApprovals)

  const todayEmptyMessage = isLoading
    ? "Loading today transactions..."
    : "No today transactions found"
  const weekEmptyMessage = isLoading
    ? "Loading week transactions..."
    : "No weekly transactions found"

  return (
    <OverviewPageShell
      module="ar"
      title="Accounts Receivable Overview"
      description="A modern receivables dashboard for liquidity, collections, customer risk, and transaction flow."
    >
      {hasError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some AR sections failed to load</AlertTitle>
          <AlertDescription>
            {errorMessage ||
              "One or more AR overview requests returned an unexpected response."}
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <Alert>
          <Clock3 className="h-4 w-4" />
          <AlertTitle>Refreshing receivable metrics</AlertTitle>
          <AlertDescription>
            Fetching AR metrics, customer exposure, and transaction activity.
          </AlertDescription>
        </Alert>
      ) : null}

      <OverviewMetricGrid>
        <OverviewMetricCard
          module="ar"
          title="Total outstanding"
          value={formatMoney(totalOutstandingValue)}
          subtitle="Open receivable balance across the portfolio."
          meta={<OverviewStatChip module="ar">Within terms {formatMoney(withinTermsAR)}</OverviewStatChip>}
          icon={Landmark}
        />
        <OverviewMetricCard
          module="ar"
          title="Overdue AR"
          value={formatMoney(overdueValue)}
          subtitle={`${overdueRatio.toFixed(1)}% of total receivables are overdue.`}
          meta={<OverviewStatChip module="ar">Ratio {overdueRatio.toFixed(1)}%</OverviewStatChip>}
          icon={AlertTriangle}
          tone="danger"
        />
        <OverviewMetricCard
          module="ar"
          title="DSO"
          value={`${dsoValue.toFixed(1)} days`}
          subtitle="Average days sales outstanding across the current cycle."
          meta={
            <OverviewStatChip module="ar">
              Turnover {dsoValue > 0 ? `${(365 / dsoValue).toFixed(1)}x` : "—"}
            </OverviewStatChip>
          }
          icon={CalendarDays}
        />
        <OverviewMetricCard
          module="ar"
          title="Collection effectiveness"
          value={`${ceiValue.toFixed(1)}%`}
          subtitle={
            ceiValue >= 80
              ? "Healthy collection efficiency."
              : ceiValue >= 60
                ? "Collections need monitoring."
                : "Collections require action."
          }
          meta={<OverviewStatChip module="ar">Pending approvals {formatOverviewCompactNumber(pendingApprovalsValue)}</OverviewStatChip>}
          icon={Percent}
          tone={
            ceiValue >= 80 ? "positive" : ceiValue >= 60 ? "warning" : "danger"
          }
        />
        <OverviewMetricCard
          module="ar"
          title="Today transactions"
          value={formatOverviewCompactNumber(todayRows.length)}
          subtitle="Documents raised or moved through AR today."
          meta={<OverviewStatChip module="ar">This week {formatOverviewCompactNumber(weekRows.length)}</OverviewStatChip>}
          icon={Clock3}
        />
        <OverviewMetricCard
          module="ar"
          title="Customer exposure"
          value={formatOverviewCompactNumber(safeTopCustomers.length)}
          subtitle="Key customers currently driving the largest balances."
          meta={<OverviewStatChip module="ar">Overdue customers {formatOverviewCompactNumber(safeOverdueCustomers.length)}</OverviewStatChip>}
          icon={Users}
        />
      </OverviewMetricGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <OverviewSectionCard
          module="ar"
          title="Portfolio mix"
          description="Receivable composition using the normalized aging rows."
          icon={BarChart3}
        >
          {agingGrandTotal > 0 && safeAging.length > 0 ? (
            <>
              <div className="border-border flex h-9 w-full overflow-hidden rounded-2xl border">
                {safeAging.map((item, idx) => {
                  const amt = Math.max(0, asNumber(item.amount))
                  const pct = agingGrandTotal > 0 ? (amt / agingGrandTotal) * 100 : 0
                  return (
                    <div
                      key={`seg-${item.bucket}-${idx}`}
                      title={`${item.bucket}: ${formatMoney(amt)} (${pct.toFixed(1)}%)`}
                      className={cn(
                        "min-w-px shrink-0 transition-all",
                        AGING_STACK_SEGMENT[idx % AGING_STACK_SEGMENT.length]
                      )}
                      style={{ width: `${Math.max(pct, 0.05)}%` }}
                    />
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {safeAging.map((item, idx) => (
                  <OverviewStatChip key={`aging-chip-${idx}`} module="ar">
                    <span
                      className={cn(
                        "mr-1.5 inline-block h-2 w-2 rounded-full",
                        AGING_STACK_SEGMENT[idx % AGING_STACK_SEGMENT.length]
                      )}
                    />
                    {item.bucket}: {formatMoney(asNumber(item.amount))}
                  </OverviewStatChip>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              No aging amounts are available yet.
            </p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="Operational pulse"
          description="Fast counters for the latest receivable activity."
          icon={TrendingUp}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Today
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatOverviewCompactNumber(todayRows.length)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Transactions posted today.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                This week
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatOverviewCompactNumber(weekRows.length)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Weekly transaction volume.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Top customers
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatOverviewCompactNumber(safeTopCustomers.length)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Highest balance accounts surfaced.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Overdue customers
              </p>
              <p className="mt-2 text-2xl font-semibold text-destructive">
                {formatOverviewCompactNumber(safeOverdueCustomers.length)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Customers currently behind terms.
              </p>
            </div>
          </div>
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ar"
          title="Aging buckets"
          description="Where the receivable balance is sitting by age band."
          icon={CalendarDays}
        >
          <OverviewBarList
            module="ar"
            items={safeAging.map((item, idx) => ({
              key: `aging-${idx}`,
              label: item.bucket ?? "N/A",
              value: formatMoney(asNumber(item.amount)),
              progress: Number.parseFloat(progressWidth(asNumber(item.amount))),
            }))}
            emptyMessage="No aging bucket data found."
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="Top customers"
          description="Largest customer balances ranked by current exposure."
          icon={Users}
        >
          <OverviewBarList
            module="ar"
            items={safeTopCustomers.map((item, idx) => {
              const amount = asNumber(item.outstanding ?? item.amount)
              return {
                key: `customer-${idx}`,
                label: item.customerName ?? "Unknown",
                value: formatMoney(amount),
                progress: Number.parseFloat(progressWidth(amount)),
              }
            })}
            emptyMessage="No top customer data found."
          />
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ar"
          title="Credit limit utilization"
          description="Outstanding versus approved credit limit by customer."
          icon={Wallet}
        >
          {creditLimitRows.length > 0 ? (
            creditLimitRows.slice(0, 6).map((row, idx) => {
              const barTone =
                row.utilizationPct >= 90
                  ? "danger"
                  : row.utilizationPct >= 75
                    ? "warning"
                    : row.utilizationPct >= 50
                      ? "warning"
                      : "positive"
              return (
                <div key={row.customerId ?? idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {row.customerName ?? "Unknown"}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-semibold",
                        barTone === "danger"
                          ? "text-destructive"
                          : barTone === "warning"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {row.utilizationPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-muted h-2 rounded-full">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        barTone === "danger"
                          ? "bg-destructive"
                          : barTone === "warning"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.max(row.utilizationPct, 2)}%` }}
                    />
                  </div>
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>OS: {formatMoney(row.outstanding)}</span>
                    <span>Limit: {formatMoney(row.creditLimit)}</span>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-muted-foreground text-sm">
              No credit limit data.
            </p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="Open collection tasks"
          description="Follow-up workload ordered by urgency."
          icon={FileText}
        >
          {collectionTaskRows.length > 0 ? (
            collectionTaskRows.slice(0, 6).map((task, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {task.customerName ?? "Unknown"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {task.taskType} · {task.daysPastDue}d overdue
                    {task.assignedTo ? ` · ${task.assignedTo}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold",
                    task.daysPastDue > 60
                      ? "text-destructive"
                      : task.daysPastDue > 30
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-foreground"
                  )}
                >
                  {formatMoney(task.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No open collection tasks.
            </p>
          )}
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ar"
          title="Disputed invoices"
          description="Invoices under dispute requiring resolution."
          icon={AlertTriangle}
        >
          {disputedRows.length > 0 ? (
            disputedRows.slice(0, 6).map((row, idx) => (
              <div
                key={row.documentNo ?? idx}
                className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {row.customerName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {row.documentNo || "—"} · {row.disputeDate}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {row.disputeReason}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-destructive">
                  {formatMoney(row.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No disputed invoices.</p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="Unapplied receipts"
          description="Cash received but not yet matched back to invoices."
          icon={FileText}
        >
          {unappliedRows.length > 0 ? (
            unappliedRows.slice(0, 6).map((row, idx) => (
              <div
                key={row.documentNo ?? idx}
                className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {row.customerName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {row.documentNo || "—"} · {row.receiptDate}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {formatMoney(row.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No unapplied receipts.</p>
          )}
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ar"
          title="Sales vs collections"
          description="Monthly invoiced value against cash collected."
          icon={TrendingUp}
        >
          {salesVsCollectionsRows.length > 0 ? (
            (() => {
              const maxAmt = Math.max(
                ...salesVsCollectionsRows.flatMap((r) => [
                  r.salesAmount,
                  r.collectionsAmount,
                ]),
                1
              )
              const totalS = salesVsCollectionsRows.reduce(
                (sum, row) => sum + row.salesAmount,
                0
              )
              const totalC = salesVsCollectionsRows.reduce(
                (sum, row) => sum + row.collectionsAmount,
                0
              )
              const rate = totalS > 0 ? (totalC / totalS) * 100 : 0

              return (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <OverviewStatChip module="ar">
                      Collection rate {rate.toFixed(1)}%
                    </OverviewStatChip>
                    <OverviewStatChip module="ar">
                      Sales {formatMoney(totalS)}
                    </OverviewStatChip>
                    <OverviewStatChip module="ar">
                      Collections {formatMoney(totalC)}
                    </OverviewStatChip>
                  </div>
                  <div className="space-y-2">
                    {salesVsCollectionsRows.slice(0, 6).map((row, idx) => {
                      const sPct = (row.salesAmount / maxAmt) * 100
                      const cPct = (row.collectionsAmount / maxAmt) * 100
                      const net = row.collectionsAmount - row.salesAmount

                      return (
                        <div key={row.period ?? idx} className="space-y-1">
                          <div className="flex justify-between gap-3 text-xs">
                            <span>{row.period || "—"}</span>
                            <span
                              className={cn(
                                "font-semibold",
                                net >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-destructive"
                              )}
                            >
                              {net >= 0 ? "+" : "-"}
                              {formatMoney(Math.abs(net))}
                            </span>
                          </div>
                          <div className="bg-muted h-1.5 rounded-full">
                            <div
                              className="h-1.5 rounded-full bg-sky-500"
                              style={{ width: `${Math.max(sPct, 1)}%` }}
                            />
                          </div>
                          <div className="bg-muted h-1.5 rounded-full">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500"
                              style={{ width: `${Math.max(cPct, 1)}%` }}
                            />
                          </div>
                          <div className="text-muted-foreground flex justify-between text-xs">
                            <span>Sales {formatMoney(row.salesAmount)}</span>
                            <span>Collections {formatMoney(row.collectionsAmount)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">No data available.</p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="Collection target vs actual"
          description="Monthly performance against collection goals."
          icon={Percent}
        >
          {collectionTargetRows.length > 0 ? (
            (() => {
              const totalTarget = collectionTargetRows.reduce(
                (sum, row) => sum + row.target,
                0
              )
              const totalActual = collectionTargetRows.reduce(
                (sum, row) => sum + row.actual,
                0
              )
              const overallPct =
                totalTarget > 0
                  ? Math.min(150, (totalActual / totalTarget) * 100)
                  : 0

              return (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <OverviewStatChip module="ar">
                      Achievement {overallPct.toFixed(1)}%
                    </OverviewStatChip>
                    <OverviewStatChip module="ar">
                      Actual {formatMoney(totalActual)}
                    </OverviewStatChip>
                    <OverviewStatChip module="ar">
                      Target {formatMoney(totalTarget)}
                    </OverviewStatChip>
                  </div>
                  <div className="space-y-2">
                    {collectionTargetRows.slice(0, 5).map((row, idx) => {
                      const barW = Math.min(100, row.achievementPct)
                      const barColor =
                        row.achievementPct >= 100
                          ? "bg-emerald-500"
                          : row.achievementPct >= 75
                            ? "bg-amber-500"
                            : "bg-destructive"

                      return (
                        <div key={row.period ?? idx} className="space-y-1">
                          <div className="flex justify-between gap-3 text-xs">
                            <span>{row.period || "—"}</span>
                            <span
                              className={cn(
                                "font-semibold",
                                row.achievementPct >= 100
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : row.achievementPct >= 75
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-destructive"
                              )}
                            >
                              {row.achievementPct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-muted h-2 rounded-full">
                            <div
                              className={cn("h-2 rounded-full", barColor)}
                              style={{ width: `${Math.max(barW, 1)}%` }}
                            />
                          </div>
                          <div className="text-muted-foreground flex justify-between text-xs">
                            <span>Actual {formatMoney(row.actual)}</span>
                            <span>Target {formatMoney(row.target)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">No data available.</p>
          )}
        </OverviewSectionCard>
      </div>

      <OverviewSectionCard
        module="ar"
        title="Cash inflow forecast"
        description="Projected collections by upcoming period."
        icon={Wallet}
      >
        {cashInflowForecastRows.length > 0 ? (
          (() => {
            const maxAmt = Math.max(
              ...cashInflowForecastRows.map((row) => row.expectedAmount),
              1
            )
            const total = cashInflowForecastRows.reduce(
              (sum, row) => sum + row.expectedAmount,
              0
            )
            const colors = [
              "bg-sky-500",
              "bg-cyan-500",
              "bg-blue-500",
              "bg-indigo-500",
              "bg-violet-500",
            ]

            return (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {cashInflowForecastRows.map((row, idx) => {
                  const barW = (row.expectedAmount / maxAmt) * 100
                  const share = total > 0 ? (row.expectedAmount / total) * 100 : 0

                  return (
                    <div
                      key={row.period ?? idx}
                      className="space-y-1 rounded-2xl border border-border/70 bg-muted/20 p-3"
                    >
                      <div className="flex justify-between gap-3 text-xs">
                        <span className="font-medium">
                          {row.period || `Period ${idx + 1}`}
                        </span>
                        {row.probability > 0 ? (
                          <span className="text-muted-foreground">
                            {row.probability.toFixed(0)}% conf.
                          </span>
                        ) : null}
                      </div>
                      <div className="bg-muted h-2 rounded-full">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            colors[idx % colors.length]
                          )}
                          style={{ width: `${Math.max(barW, 1)}%` }}
                        />
                      </div>
                      <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{formatMoney(row.expectedAmount)}</span>
                        <span>{share.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()
        ) : (
          <p className="text-muted-foreground text-sm">
            No forecast data available.
          </p>
        )}
      </OverviewSectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ar"
          title="Bad debt exposure"
          description="Accounts at risk of write-off, grouped by risk profile."
          icon={AlertTriangle}
        >
          {badDebtRows.length > 0 ? (
            (() => {
              const total = badDebtRows.reduce((sum, row) => sum + row.amount, 0)
              const highCount = badDebtRows.filter(
                (row) => row.riskCategory.toLowerCase() === "high"
              ).length
              const riskClassNames: Record<string, string> = {
                high: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300",
                medium:
                  "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
                watch:
                  "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
                low: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
              }

              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    <OverviewStatChip module="ar">
                      Total {formatMoney(total)}
                    </OverviewStatChip>
                    {highCount > 0 ? (
                      <OverviewStatChip module="ar">
                        {highCount} high-risk
                      </OverviewStatChip>
                    ) : null}
                  </div>
                  {badDebtRows.slice(0, 7).map((row, idx) => {
                    const riskKey = row.riskCategory.toLowerCase()
                    const riskClassName =
                      riskClassNames[riskKey] ?? riskClassNames.watch

                    return (
                      <div
                        key={row.documentNo ?? idx}
                        className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {row.customerName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {row.documentNo || "—"} · {row.daysPastDue}d past due
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">
                            {formatMoney(row.amount)}
                          </p>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                              riskClassName
                            )}
                          >
                            {row.riskCategory}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">
              No bad debt exposure on record.
            </p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="On-hold customers"
          description="Customers with credit hold currently blocking downstream orders."
          icon={Users}
        >
          {onHoldRows.length > 0 ? (
            (() => {
              const totalOS = onHoldRows.reduce(
                (sum, row) => sum + row.outstandingAmount,
                0
              )
              const totalOrders = onHoldRows.reduce(
                (sum, row) => sum + row.blockedOrders,
                0
              )

              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    <OverviewStatChip module="ar">
                      Blocked OS {formatMoney(totalOS)}
                    </OverviewStatChip>
                    {totalOrders > 0 ? (
                      <OverviewStatChip module="ar">
                        {totalOrders} orders blocked
                      </OverviewStatChip>
                    ) : null}
                  </div>
                  {onHoldRows.slice(0, 7).map((row, idx) => (
                    <div
                      key={row.customerId ?? idx}
                      className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {row.customerName}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {row.holdReason}
                          {row.holdDate ? ` · since ${row.holdDate}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {formatMoney(row.outstandingAmount)}
                        </p>
                        {row.blockedOrders > 0 ? (
                          <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                            {row.blockedOrders} order
                            {row.blockedOrders !== 1 ? "s" : ""} blocked
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">
              No customers currently on hold.
            </p>
          )}
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ar"
          title="DSO trend"
          description="Monthly movement in days sales outstanding against target."
          icon={TrendingUp}
        >
          {dsoTrendRows.length > 0 ? (
            (() => {
              const maxDso = Math.max(...dsoTrendRows.map((row) => row.dso), 1)
              const latest = dsoTrendRows[dsoTrendRows.length - 1]
              const prev = dsoTrendRows[dsoTrendRows.length - 2]
              const trend = latest && prev ? latest.dso - prev.dso : null

              return (
                <>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-3xl font-bold">{latest.dso.toFixed(1)}</p>
                      <p className="text-muted-foreground text-xs">
                        days · {latest.period}
                      </p>
                    </div>
                    {trend !== null ? (
                      <span
                        className={cn(
                          "mb-1 text-sm font-semibold",
                          trend <= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        )}
                      >
                        {trend <= 0 ? "▼" : "▲"} {Math.abs(trend).toFixed(1)}d
                      </span>
                    ) : null}
                    {latest.targetDso > 0 ? (
                      <div className="ml-auto text-right">
                        <p className="text-muted-foreground text-xs">Target</p>
                        <p className="text-sm font-semibold">
                          {latest.targetDso.toFixed(0)}d
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {dsoTrendRows.slice(-6).map((row, idx) => {
                      const barPct = (row.dso / maxDso) * 100
                      const targetPct =
                        row.targetDso > 0
                          ? Math.min(100, (row.targetDso / maxDso) * 100)
                          : 0
                      const color =
                        row.targetDso <= 0
                          ? row.dso <= 30
                            ? "bg-emerald-500"
                            : row.dso <= 60
                              ? "bg-amber-500"
                              : "bg-destructive"
                          : row.dso <= row.targetDso
                            ? "bg-emerald-500"
                            : row.dso <= row.targetDso * 1.2
                              ? "bg-amber-500"
                              : "bg-destructive"

                      return (
                        <div key={row.period || idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {row.period || `M${idx + 1}`}
                            </span>
                            <span className="font-semibold">
                              {row.dso.toFixed(1)}d
                            </span>
                          </div>
                          <div className="bg-muted relative h-2 overflow-hidden rounded-full">
                            <div
                              className={cn("h-full rounded-full", color)}
                              style={{ width: `${Math.max(barPct, 1)}%` }}
                            />
                            {targetPct > 0 ? (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-slate-600/70"
                                style={{ left: `${targetPct}%` }}
                              />
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">No DSO trend data.</p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="Invoices due"
          description="Upcoming and overdue invoices within the configured horizon."
          icon={CalendarDays}
        >
          {invoicesDueRows.length > 0 ? (
            (() => {
              const totalDue = invoicesDueRows.reduce(
                (sum, row) => sum + row.amount,
                0
              )
              const overdueCount = invoicesDueRows.filter(
                (row) => row.daysUntilDue < 0
              ).length

              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    <OverviewStatChip module="ar">
                      Total {formatMoney(totalDue)}
                    </OverviewStatChip>
                    {overdueCount > 0 ? (
                      <OverviewStatChip module="ar">
                        {overdueCount} overdue
                      </OverviewStatChip>
                    ) : null}
                  </div>
                  {invoicesDueRows.slice(0, 7).map((row, idx) => {
                    const isOverdue = row.daysUntilDue < 0
                    const isSoon = !isOverdue && row.daysUntilDue <= 7
                    const badgeClassName = isOverdue
                      ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                      : isSoon
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    const badgeLabel = isOverdue
                      ? `${Math.abs(row.daysUntilDue)}d late`
                      : `${row.daysUntilDue}d`

                    return (
                      <div
                        key={row.documentNo ?? idx}
                        className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {row.customerName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {row.documentNo || "—"} · {row.dueDate || "—"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">
                            {formatMoney(row.amount)}
                          </p>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                              badgeClassName
                            )}
                          >
                            {badgeLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">
              No invoices due in the next 30 days.
            </p>
          )}
        </OverviewSectionCard>
      </div>

      <OverviewSectionCard
        module="ar"
        title="Payment behavior"
        description="Average days to pay versus agreed credit terms by customer."
        icon={TrendingUp}
      >
        {paymentBehaviorRows.length > 0 ? (
          (() => {
            const maxDays = Math.max(
              ...paymentBehaviorRows.map((row) => row.avgDaysToPay),
              1
            )
            const avgDelinquency =
              paymentBehaviorRows.reduce(
                (sum, row) => sum + row.delinquencyDays,
                0
              ) / paymentBehaviorRows.length

            return (
              <>
                <div className="flex flex-wrap gap-2">
                  <OverviewStatChip module="ar">
                    Portfolio avg{" "}
                    {avgDelinquency <= 0
                      ? "On time"
                      : `+${avgDelinquency.toFixed(1)}d`}
                  </OverviewStatChip>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {paymentBehaviorRows.slice(0, 9).map((row, idx) => {
                    const avgPct = (row.avgDaysToPay / maxDays) * 100
                    const termsPct = Math.min(
                      100,
                      (row.creditTermsDays / maxDays) * 100
                    )
                    const barColor =
                      row.delinquencyDays <= 0
                        ? "bg-emerald-500"
                        : row.delinquencyDays <= 15
                          ? "bg-amber-500"
                          : "bg-destructive"
                    const labelColor =
                      row.delinquencyDays <= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : row.delinquencyDays <= 15
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-destructive"

                    return (
                      <div
                        key={row.customerId ?? idx}
                        className="space-y-1 rounded-2xl border border-border/70 bg-muted/20 p-3"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-medium">
                            {row.customerName}
                          </span>
                          <span className={cn("font-semibold", labelColor)}>
                            {row.delinquencyDays <= 0
                              ? "On time"
                              : `+${row.delinquencyDays}d`}
                          </span>
                        </div>
                        <div className="bg-muted relative h-2 overflow-hidden rounded-full">
                          <div
                            className={cn("h-full rounded-full", barColor)}
                            style={{ width: `${Math.max(avgPct, 1)}%` }}
                          />
                          {termsPct > 0 ? (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-600/70"
                              style={{ left: `${termsPct}%` }}
                            />
                          ) : null}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {row.avgDaysToPay}d avg · {row.creditTermsDays}d terms
                        </p>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()
        ) : (
          <p className="text-muted-foreground text-sm">
            No payment behavior data.
          </p>
        )}
      </OverviewSectionCard>

      <OverviewSectionCard
        module="ar"
        title="Overdue customers"
        description="Customers currently contributing the highest overdue balances."
        icon={Users}
      >
        <OverviewBarList
          module="ar"
          items={safeOverdueCustomers.map((item, idx) => {
            const amount = asNumber(item.outstanding ?? item.amount)
            return {
              key: `overdue-${idx}`,
              label: item.customerName ?? "Unknown",
              value: formatMoney(amount),
              progress: Number.parseFloat(progressWidth(amount)),
              tone: "danger" as const,
            }
          })}
          emptyMessage="No overdue customer data found."
        />
      </OverviewSectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="ar"
          title="Today transactions"
          description="Latest receivable transactions posted today."
          icon={Clock3}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={todayRows}
            columns={columns}
            emptyMessage={todayEmptyMessage}
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="ar"
          title="Week transactions"
          description="Weekly receivable transaction activity."
          icon={FileText}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={weekRows}
            columns={columns}
            emptyMessage={weekEmptyMessage}
          />
        </OverviewSectionCard>
      </div>
    </OverviewPageShell>
  )
}
