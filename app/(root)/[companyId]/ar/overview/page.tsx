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
} from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDashboardRoutes } from "@/lib/overview-dashboard-routes"
import { pickNumber, pickString } from "@/lib/overview-row-pickers"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"

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
    <div className="@container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AR Overview</h1>
      </div>

      {hasError && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive text-sm">
              Some sections failed to load
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {errorMessage ||
              "One or more AR overview requests returned an unexpected response."}
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

      <section className="space-y-3">
        <div>
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Summary & liquidity
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Core KPIs from <code className="text-xs">Ovw_AR_Kpi</code> (plus
            derived current vs overdue).
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total AR outstanding</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatMoney(totalOutstandingValue)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Landmark className="text-muted-foreground h-4 w-4 shrink-0" />
                Current / within terms
              </CardTitle>
              <CardDescription className="text-xs leading-snug">
                Derived as total − overdue from KPI (not aged
                &ldquo;current&rdquo; bucket analysis).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatMoney(withinTermsAR)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Overdue AR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-destructive flex items-center gap-2 text-2xl font-semibold">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                {formatMoney(overdueValue)}
              </div>
              <div className="bg-muted h-2 rounded">
                <div
                  className="bg-destructive h-2 rounded"
                  style={{ width: `${overdueRatio}%` }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {overdueRatio.toFixed(1)}% of total AR
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Percent className="text-muted-foreground h-4 w-4 shrink-0" />
                Overdue % of AR
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overdueRatio.toFixed(1)}%
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">DSO (days)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-semibold">
              <CalendarDays className="text-muted-foreground h-5 w-5 shrink-0" />
              {dsoValue.toFixed(1)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Collection effectiveness (CEI)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div
                className={cn(
                  "text-2xl font-semibold",
                  ceiValue >= 80
                    ? "text-emerald-600"
                    : ceiValue >= 60
                      ? "text-amber-500"
                      : "text-destructive"
                )}
              >
                {ceiValue.toFixed(1)}%
              </div>
              <p className="text-muted-foreground text-xs">
                {ceiValue >= 80
                  ? "Healthy"
                  : ceiValue >= 60
                    ? "Monitor"
                    : "Action needed"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending approvals</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-2xl font-semibold">
              <FileText className="h-5 w-5 shrink-0" />
              {pendingApprovalsValue}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AR Turnover ratio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold text-cyan-700">
                {dsoValue > 0 ? (365 / dsoValue).toFixed(1) : "—"}x
              </div>
              <p className="text-muted-foreground text-xs">
                {dsoValue > 0 ? `365 ÷ ${dsoValue.toFixed(1)} DSO` : "DSO not available"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Operational activity
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Today transactions</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {todayRows.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Week transactions</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {weekRows.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top customers listed</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {safeTopCustomers.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Overdue customers listed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {safeOverdueCustomers.length}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Risk & concentration
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Aging Buckets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {safeAging.length > 0 ? (
                safeAging.map((item, idx) => (
                  <div
                    key={`${item.bucket ?? "bucket"}-${idx}`}
                    className="space-y-1"
                  >
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
                <p className="text-muted-foreground text-sm">
                  No aging bucket data found.
                </p>
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
                    <div
                      key={`${item.customerName ?? "customer"}-${idx}`}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.customerName ?? "Unknown"}</span>
                        <span>{formatMoney(amount)}</span>
                      </div>
                      <div className="bg-muted h-2 rounded">
                        <div
                          className="bg-primary h-2 rounded"
                          style={{ width: progressWidth(amount) }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-muted-foreground text-sm">
                  No top customer data found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Analysis
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="text-muted-foreground h-4 w-4 shrink-0" />
              AR aging composition
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Share of balances in the aging rows shown above (
              <code className="text-xs">Ovw_AR_Aging</code>). Segment colors are
              for readability only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agingGrandTotal > 0 && safeAging.length > 0 ? (
              <>
                <div className="border-border flex h-8 w-full overflow-hidden rounded-md border">
                  {safeAging.map((item, idx) => {
                    const amt = Math.max(0, asNumber(item.amount))
                    const pct =
                      agingGrandTotal > 0 ? (amt / agingGrandTotal) * 100 : 0
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
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {safeAging.map((item, idx) => (
                    <span
                      key={`lg-${item.bucket}-${idx}`}
                      className="inline-flex items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          "inline-block h-2 w-2 shrink-0 rounded-sm",
                          AGING_STACK_SEGMENT[idx % AGING_STACK_SEGMENT.length]
                        )}
                      />
                      {item.bucket}: {formatMoney(asNumber(item.amount))}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No aging amounts to chart. Uses the same normalized rows as
                &ldquo;Aging buckets&rdquo;.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Credit Limit Utilization</CardTitle>
              <CardDescription className="text-xs">
                Outstanding vs approved credit limit per customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {creditLimitRows.length > 0 ? (
                creditLimitRows.slice(0, 6).map((row, idx) => {
                  const barColor =
                    row.utilizationPct >= 90
                      ? "bg-destructive"
                      : row.utilizationPct >= 75
                        ? "bg-orange-500"
                        : row.utilizationPct >= 50
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                  return (
                    <div key={row.customerId ?? idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">
                          {row.customerName ?? "Unknown"}
                        </span>
                        <span className="text-muted-foreground ml-2 shrink-0">
                          {row.utilizationPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-muted h-2 rounded">
                        <div
                          className={cn("h-2 rounded", barColor)}
                          style={{ width: `${row.utilizationPct}%` }}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Collection Tasks</CardTitle>
              <CardDescription className="text-xs">
                Pending follow-up actions sorted by urgency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {collectionTaskRows.length > 0 ? (
                collectionTaskRows.slice(0, 6).map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 border-b py-1.5 last:border-0"
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
                            ? "text-amber-600"
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
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Disputed Invoices</CardTitle>
              <CardDescription className="text-xs">
                Invoices under dispute requiring resolution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {disputedRows.length > 0 ? (
                disputedRows.slice(0, 6).map((row, idx) => (
                  <div
                    key={row.documentNo ?? idx}
                    className="flex items-start justify-between gap-3 border-b py-1.5 last:border-0"
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
                    <span className="text-destructive shrink-0 text-sm font-semibold">
                      {formatMoney(row.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  No disputed invoices.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unapplied Receipts</CardTitle>
              <CardDescription className="text-xs">
                Cash received but not yet applied to invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {unappliedRows.length > 0 ? (
                unappliedRows.slice(0, 6).map((row, idx) => (
                  <div
                    key={row.documentNo ?? idx}
                    className="flex items-center justify-between gap-3 border-b py-1.5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {row.customerName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {row.documentNo || "—"} · {row.receiptDate}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-amber-600">
                      {formatMoney(row.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  No unapplied receipts.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Sales &amp; collections
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Sales vs Collections */}
          <Card>
            <CardHeader>
              <CardTitle>Sales vs Collections</CardTitle>
              <CardDescription className="text-xs">Monthly invoiced vs cash collected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {salesVsCollectionsRows.length > 0 ? (() => {
                const maxAmt = Math.max(...salesVsCollectionsRows.flatMap((r) => [r.salesAmount, r.collectionsAmount]), 1)
                const totalS = salesVsCollectionsRows.reduce((s, r) => s + r.salesAmount, 0)
                const totalC = salesVsCollectionsRows.reduce((s, r) => s + r.collectionsAmount, 0)
                const rate = totalS > 0 ? (totalC / totalS) * 100 : 0
                return (
                  <>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
                      <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-sky-500" />Sales</span>
                      <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-emerald-500" />Collections</span>
                      <span className="ml-auto font-semibold">Rate: {rate.toFixed(1)}%</span>
                    </div>
                    {salesVsCollectionsRows.slice(0, 6).map((row, idx) => {
                      const sPct = (row.salesAmount / maxAmt) * 100
                      const cPct = (row.collectionsAmount / maxAmt) * 100
                      const net = row.collectionsAmount - row.salesAmount
                      return (
                        <div key={row.period ?? idx} className="space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span>{row.period || "—"}</span>
                            <span className={cn("font-semibold", net >= 0 ? "text-emerald-600" : "text-destructive")}>
                              {net >= 0 ? "+" : ""}{formatMoney(Math.abs(net))}
                            </span>
                          </div>
                          <div className="bg-muted h-1.5 rounded"><div className="bg-sky-500 h-1.5 rounded" style={{ width: `${Math.max(sPct, 0.5)}%` }} /></div>
                          <div className="bg-muted h-1.5 rounded"><div className="bg-emerald-500 h-1.5 rounded" style={{ width: `${Math.max(cPct, 0.5)}%` }} /></div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatMoney(row.salesAmount)}</span>
                            <span>{formatMoney(row.collectionsAmount)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )
              })() : <p className="text-muted-foreground text-sm">No data available.</p>}
            </CardContent>
          </Card>

          {/* Collection Target vs Actual */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Target vs Actual</CardTitle>
              <CardDescription className="text-xs">Monthly performance against collection targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {collectionTargetRows.length > 0 ? (() => {
                const totalTarget = collectionTargetRows.reduce((s, r) => s + r.target, 0)
                const totalActual = collectionTargetRows.reduce((s, r) => s + r.actual, 0)
                const overallPct = totalTarget > 0 ? Math.min(150, (totalActual / totalTarget) * 100) : 0
                return (
                  <>
                    <div className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                      overallPct >= 100 ? "bg-emerald-50" : overallPct >= 75 ? "bg-amber-50" : "bg-red-50"
                    )}>
                      <span className="text-xs text-muted-foreground">Overall achievement</span>
                      <span className={cn("text-lg font-bold", overallPct >= 100 ? "text-emerald-600" : overallPct >= 75 ? "text-amber-600" : "text-destructive")}>
                        {overallPct.toFixed(1)}%
                      </span>
                    </div>
                    {collectionTargetRows.slice(0, 5).map((row, idx) => {
                      const barW = Math.min(100, row.achievementPct)
                      const barColor = row.achievementPct >= 100 ? "bg-emerald-500" : row.achievementPct >= 75 ? "bg-amber-400" : "bg-destructive"
                      return (
                        <div key={row.period ?? idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{row.period || "—"}</span>
                            <span className={cn("font-semibold", row.achievementPct >= 100 ? "text-emerald-600" : row.achievementPct >= 75 ? "text-amber-600" : "text-destructive")}>
                              {row.achievementPct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="bg-muted h-2 rounded">
                            <div className={cn("h-2 rounded", barColor)} style={{ width: `${Math.max(barW, 0.5)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Actual: {formatMoney(row.actual)}</span>
                            <span>Target: {formatMoney(row.target)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )
              })() : <p className="text-muted-foreground text-sm">No data available.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Cash Inflow Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Inflow Forecast</CardTitle>
            <CardDescription className="text-xs">Projected collections by upcoming period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cashInflowForecastRows.length > 0 ? (() => {
              const maxAmt = Math.max(...cashInflowForecastRows.map((r) => r.expectedAmount), 1)
              const total = cashInflowForecastRows.reduce((s, r) => s + r.expectedAmount, 0)
              const COLORS = ["bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500"]
              return (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cashInflowForecastRows.map((row, idx) => {
                    const barW = (row.expectedAmount / maxAmt) * 100
                    const share = total > 0 ? (row.expectedAmount / total) * 100 : 0
                    return (
                      <div key={row.period ?? idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{row.period || `Period ${idx + 1}`}</span>
                          {row.probability > 0 && <span className="text-muted-foreground">{row.probability.toFixed(0)}% conf.</span>}
                        </div>
                        <div className="bg-muted h-2 rounded">
                          <div className={cn("h-2 rounded", COLORS[idx % COLORS.length])} style={{ width: `${Math.max(barW, 0.5)}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatMoney(row.expectedAmount)}</span>
                          <span>{share.toFixed(1)}% of total</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })() : <p className="text-muted-foreground text-sm">No forecast data available.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Risk management
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Bad Debt Exposure */}
          <Card>
            <CardHeader>
              <CardTitle>Bad Debt Exposure</CardTitle>
              <CardDescription className="text-xs">Accounts at risk of write-off, grouped by risk level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {badDebtRows.length > 0 ? (() => {
                const total = badDebtRows.reduce((s, r) => s + r.amount, 0)
                const highCount = badDebtRows.filter((r) => r.riskCategory.toLowerCase() === "high").length
                const RISK: Record<string, string> = { high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", watch: "bg-blue-100 text-blue-700", low: "bg-slate-100 text-slate-600" }
                return (
                  <>
                    <div className="flex gap-4 text-xs mb-2">
                      <span className="text-muted-foreground">Total: <span className="font-bold text-destructive">{formatMoney(total)}</span></span>
                      {highCount > 0 && <span className="text-destructive font-semibold">{highCount} high-risk</span>}
                    </div>
                    {badDebtRows.slice(0, 7).map((row, idx) => {
                      const rk = row.riskCategory.toLowerCase()
                      const cls = RISK[rk] ?? RISK.watch
                      return (
                        <div key={row.documentNo ?? idx} className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{row.customerName}</p>
                            <p className="text-muted-foreground text-xs">{row.documentNo || "—"} · {row.daysPastDue}d past due</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold">{formatMoney(row.amount)}</p>
                            <span className={cn("text-xs font-semibold rounded-full px-1.5 py-0.5", cls)}>{row.riskCategory}</span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )
              })() : <p className="text-muted-foreground text-sm">No bad debt exposure on record.</p>}
            </CardContent>
          </Card>

          {/* On-Hold Customers */}
          <Card>
            <CardHeader>
              <CardTitle>On-Hold Customers</CardTitle>
              <CardDescription className="text-xs">Customers with credit hold — blocked from new orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {onHoldRows.length > 0 ? (() => {
                const totalOS = onHoldRows.reduce((s, r) => s + r.outstandingAmount, 0)
                const totalOrders = onHoldRows.reduce((s, r) => s + r.blockedOrders, 0)
                return (
                  <>
                    <div className="flex gap-4 text-xs mb-2">
                      <span className="text-muted-foreground">Blocked OS: <span className="font-bold text-orange-600">{formatMoney(totalOS)}</span></span>
                      {totalOrders > 0 && <span className="text-orange-600 font-semibold">{totalOrders} orders blocked</span>}
                    </div>
                    {onHoldRows.slice(0, 7).map((row, idx) => (
                      <div key={row.customerId ?? idx} className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{row.customerName}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {row.holdReason}{row.holdDate ? ` · since ${row.holdDate}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-orange-600">{formatMoney(row.outstandingAmount)}</p>
                          {row.blockedOrders > 0 && (
                            <p className="text-xs text-orange-500">{row.blockedOrders} order{row.blockedOrders !== 1 ? "s" : ""} blocked</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )
              })() : <p className="text-muted-foreground text-sm">No customers currently on hold.</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          DSO &amp; payment intelligence
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* DSO Trend */}
          <Card>
            <CardHeader>
              <CardTitle>DSO Trend</CardTitle>
              <CardDescription className="text-xs">Days sales outstanding — monthly movement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dsoTrendRows.length > 0 ? (() => {
                const maxDso = Math.max(...dsoTrendRows.map((r) => r.dso), 1)
                const latest = dsoTrendRows[dsoTrendRows.length - 1]
                const prev = dsoTrendRows[dsoTrendRows.length - 2]
                const trend = latest && prev ? latest.dso - prev.dso : null
                return (
                  <>
                    <div className="flex items-end gap-3">
                      <div>
                        <p className="text-3xl font-bold">{latest.dso.toFixed(1)}</p>
                        <p className="text-muted-foreground text-xs">days — {latest.period}</p>
                      </div>
                      {trend !== null && (
                        <span className={cn("text-sm font-semibold mb-1", trend <= 0 ? "text-emerald-600" : "text-destructive")}>
                          {trend <= 0 ? "▼" : "▲"} {Math.abs(trend).toFixed(1)}d
                        </span>
                      )}
                      {latest.targetDso > 0 && (
                        <div className="ml-auto text-right">
                          <p className="text-muted-foreground text-xs">Target</p>
                          <p className="text-sm font-bold">{latest.targetDso.toFixed(0)}d</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {dsoTrendRows.slice(-6).map((row, idx) => {
                        const barPct = (row.dso / maxDso) * 100
                        const targetPct = row.targetDso > 0 ? Math.min(100, (row.targetDso / maxDso) * 100) : 0
                        const color = row.targetDso <= 0
                          ? (row.dso <= 30 ? "bg-emerald-500" : row.dso <= 60 ? "bg-amber-400" : "bg-destructive")
                          : (row.dso <= row.targetDso ? "bg-emerald-500" : row.dso <= row.targetDso * 1.2 ? "bg-amber-400" : "bg-destructive")
                        return (
                          <div key={row.period || idx} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{row.period || `M${idx + 1}`}</span>
                              <span className="font-semibold">{row.dso.toFixed(1)}d</span>
                            </div>
                            <div className="bg-muted h-2 rounded overflow-hidden relative">
                              <div className={cn("h-full rounded", color)} style={{ width: `${Math.max(barPct, 0.5)}%` }} />
                              {targetPct > 0 && (
                                <div className="absolute top-0 bottom-0 w-0.5 bg-slate-600 opacity-60" style={{ left: `${targetPct}%` }} />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              })() : <p className="text-muted-foreground text-sm">No DSO trend data.</p>}
            </CardContent>
          </Card>

          {/* Invoices Due */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices Due</CardTitle>
              <CardDescription className="text-xs">Upcoming &amp; overdue invoices (next 30 days)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoicesDueRows.length > 0 ? (() => {
                const totalDue = invoicesDueRows.reduce((s, r) => s + r.amount, 0)
                const overdueCount = invoicesDueRows.filter((r) => r.daysUntilDue < 0).length
                return (
                  <>
                    <div className="flex gap-4 text-xs mb-2">
                      <span className="text-muted-foreground">Total: <span className="font-bold text-foreground">{formatMoney(totalDue)}</span></span>
                      {overdueCount > 0 && <span className="text-destructive font-semibold">{overdueCount} overdue</span>}
                    </div>
                    {invoicesDueRows.slice(0, 7).map((row, idx) => {
                      const isOverdue = row.daysUntilDue < 0
                      const isSoon = !isOverdue && row.daysUntilDue <= 7
                      const badgeCls = isOverdue
                        ? "bg-red-100 text-red-700"
                        : isSoon
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      const badgeLabel = isOverdue
                        ? `${Math.abs(row.daysUntilDue)}d late`
                        : `${row.daysUntilDue}d`
                      return (
                        <div key={row.documentNo ?? idx} className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{row.customerName}</p>
                            <p className="text-muted-foreground text-xs">{row.documentNo || "—"} · {row.dueDate || "—"}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold">{formatMoney(row.amount)}</p>
                            <span className={cn("text-xs font-semibold rounded-full px-1.5 py-0.5", badgeCls)}>{badgeLabel}</span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )
              })() : <p className="text-muted-foreground text-sm">No invoices due in the next 30 days.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Payment Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Behavior</CardTitle>
            <CardDescription className="text-xs">Avg days to pay vs credit terms by customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentBehaviorRows.length > 0 ? (() => {
              const maxDays = Math.max(...paymentBehaviorRows.map((r) => r.avgDaysToPay), 1)
              const avgDelinquency = paymentBehaviorRows.reduce((s, r) => s + r.delinquencyDays, 0) / paymentBehaviorRows.length
              return (
                <>
                  <div className="text-xs text-muted-foreground">
                    Portfolio avg delinquency:{" "}
                    <span className={cn("font-bold", avgDelinquency <= 0 ? "text-emerald-600" : avgDelinquency <= 15 ? "text-amber-600" : "text-destructive")}>
                      {avgDelinquency <= 0 ? "On time" : `+${avgDelinquency.toFixed(1)}d`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {paymentBehaviorRows.slice(0, 9).map((row, idx) => {
                      const avgPct = (row.avgDaysToPay / maxDays) * 100
                      const termsPct = Math.min(100, (row.creditTermsDays / maxDays) * 100)
                      const barColor = row.delinquencyDays <= 0 ? "bg-emerald-500" : row.delinquencyDays <= 15 ? "bg-amber-400" : "bg-destructive"
                      const labelColor = row.delinquencyDays <= 0 ? "text-emerald-600" : row.delinquencyDays <= 15 ? "text-amber-600" : "text-destructive"
                      return (
                        <div key={row.customerId ?? idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="truncate max-w-[55%] font-medium">{row.customerName}</span>
                            <span className={cn("font-semibold", labelColor)}>
                              {row.delinquencyDays <= 0 ? "On time" : `+${row.delinquencyDays}d`}
                            </span>
                          </div>
                          <div className="bg-muted h-2 rounded overflow-hidden relative">
                            <div className={cn("h-full rounded", barColor)} style={{ width: `${Math.max(avgPct, 0.5)}%` }} />
                            {termsPct > 0 && (
                              <div className="absolute top-0 bottom-0 w-0.5 bg-slate-600 opacity-60" style={{ left: `${termsPct}%` }} />
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs">{row.avgDaysToPay}d avg · {row.creditTermsDays}d terms</p>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })() : <p className="text-muted-foreground text-sm">No payment behavior data.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Overdue exposure
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Overdue Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeOverdueCustomers.length > 0 ? (
              safeOverdueCustomers.map((item, idx) => {
                const amount = asNumber(item.outstanding ?? item.amount)
                return (
                  <div
                    key={`${item.customerName ?? "od"}-${idx}`}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.customerName ?? "Unknown"}</span>
                      <span>{formatMoney(amount)}</span>
                    </div>
                    <div className="bg-muted h-2 rounded">
                      <div
                        className="bg-destructive h-2 rounded"
                        style={{ width: progressWidth(amount) }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-muted-foreground text-sm">
                No overdue customer data found.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Recent transactions
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Today Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewDataTable
              data={todayRows}
              columns={columns}
              emptyMessage={todayEmptyMessage}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Week Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewDataTable
              data={weekRows}
              columns={columns}
              emptyMessage={weekEmptyMessage}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
