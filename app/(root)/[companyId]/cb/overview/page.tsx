"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  Clock3,
  Landmark,
  TrendingUp,
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
type CbKpi = {
  totalCash: number
  totalBank: number
  pendingReceipts: number
  pendingPayments: number
}
type CbBank = { bankName: string; balance: number }
type CbFlow = { label: string; amount: number; type: string }
type CbTxn = {
  type: string
  documentNo: string
  bankName: string
  amount: number
  status: string
  trnDate: string
}
type CbLiquidityForecastRow = {
  period: string
  netLiquidityChange: number
}
type CbReconciliationStatusRow = {
  bankAccountId?: string
  bankName: string
  unreconciledCount: number
  unreconciledAmount: number
}
type CbCashConcentrationRow = {
  bankName: string
  balanceAmount: number
  pctOfTotalCash: number
}
type CbTreasuryTasksSummary = {
  dueTodayCount: number
  overdueTaskCount: number
}

const ARRAY_KEYS = [
  "data",
  "Data",
  "items",
  "rows",
  "results",
  "list",
  "records",
] as const
const OBJECT_KEYS = ["data", "Data", "item", "record", "payload"] as const

const isRecord = (value: unknown): value is AnyRecord =>
  !!value && typeof value === "object" && !Array.isArray(value)

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback

const readArrayFromUnknown = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[]
  }
  if (!isRecord(payload)) {
    return []
  }

  for (const key of ARRAY_KEYS) {
    const value = payload[key]
    if (Array.isArray(value)) {
      return value as T[]
    }
    if (isRecord(value)) {
      for (const nestedKey of ARRAY_KEYS) {
        const nested = value[nestedKey]
        if (Array.isArray(nested)) {
          return nested as T[]
        }
      }
    }
  }

  return []
}

const readObjectFromUnknown = (payload: unknown): AnyRecord => {
  if (!isRecord(payload)) {
    return {}
  }

  if ("data" in payload) {
    const data = payload.data
    if (Array.isArray(data) && data.length > 0) {
      const row = data[0]
      if (isRecord(row)) return row
    }
    if (isRecord(data)) return data
    return {}
  }

  if ("Data" in payload) {
    const data = (payload as AnyRecord).Data
    if (Array.isArray(data) && data.length > 0) {
      const row = data[0]
      if (isRecord(row)) return row
    }
    if (isRecord(data)) return data
    return {}
  }

  for (const key of OBJECT_KEYS) {
    const value = payload[key]
    if (Array.isArray(value) && value.length > 0) {
      const row = value[0]
      if (isRecord(row)) return row
    }
    if (isRecord(value)) return value
  }

  return {}
}

const formatMoney = (value: number): string =>
  `AED ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`

const formatDate = (value: string): string => {
  const text = asString(value, "-")
  if (text === "-") return text
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toLocaleDateString("en-GB")
}

const formatPeriodLabel = (value: string): string => {
  const text = asString(value, "")
  if (!text) return "—"
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const toKpi = (payload: unknown): CbKpi => {
  const source = readObjectFromUnknown(payload)
  return {
    totalCash: pickNumber(source, [
      "totalCash",
      "cashTotal",
      "cash_balance",
      "cash",
    ]),
    totalBank: pickNumber(source, [
      "totalBank",
      "bankTotal",
      "bank_balance",
      "bank",
    ]),
    pendingReceipts: pickNumber(source, [
      "pendingReceipts",
      "receiptsPending",
      "pendingReceipt",
    ]),
    pendingPayments: pickNumber(source, [
      "pendingPayments",
      "paymentsPending",
      "pendingPayment",
    ]),
  }
}

const toBanks = (payload: unknown): CbBank[] =>
  readArrayFromUnknown<unknown>(payload).map((entry, index) => {
    const row = isRecord(entry) ? entry : {}
    return {
      bankName: pickString(
        row,
        ["bankName", "name", "accountName", "bank"],
        `Unknown bank ${index + 1}`
      ),
      balance: pickNumber(row, [
        "balance",
        "amount",
        "availableBalance",
        "currentBalance",
      ]),
    }
  })

const toCashFlow = (payload: unknown): CbFlow[] =>
  readArrayFromUnknown<unknown>(payload).map((entry, index) => {
    const row = isRecord(entry) ? entry : {}
    const receipts = pickNumber(row, ["receipts", "Receipts"])
    const payments = pickNumber(row, ["payments", "Payments"])
    const net = pickNumber(row, ["netAmount", "net", "Net", "amount", "value"])
    return {
      label: pickString(
        row,
        ["label", "name", "title", "flowDate", "date"],
        `Flow ${index + 1}`
      ),
      amount: net !== 0 ? net : receipts - payments,
      type: pickString(row, ["type", "category", "direction"], "flow"),
    }
  })

const toTransactions = (payload: unknown): CbTxn[] =>
  readArrayFromUnknown<unknown>(payload).map((entry) => {
    const row = isRecord(entry) ? entry : {}
    return {
      type: pickString(
        row,
        ["transactionType", "txnType", "type", "TransactionType"],
        "Unknown"
      ),
      documentNo: pickString(
        row,
        [
          "documentNo",
          "documentNoOrRef",
          "docNo",
          "referenceNo",
          "DocumentNo",
        ],
        "-"
      ),
      bankName: pickString(
        row,
        ["entityName", "bankName", "bank", "accountName", "EntityName"],
        "Unknown"
      ),
      amount: pickNumber(row, [
        "totLocalAmt",
        "TotLocalAmt",
        "totAmt",
        "TotAmt",
        "amount",
        "debit",
        "credit",
        "value",
      ]),
      status: pickString(row, ["status", "state"], "Open"),
      trnDate: pickString(
        row,
        [
          "trnDate",
          "TrnDate",
          "accountDate",
          "AccountDate",
          "date",
          "transactionDate",
          "createdAt",
        ],
        ""
      ),
    }
  })

const toLiquidityForecast = (payload: unknown): CbLiquidityForecastRow[] =>
  readArrayFromUnknown<unknown>(payload).map((entry) => {
    const row = isRecord(entry) ? entry : {}
    return {
      period: formatPeriodLabel(
        pickString(row, ["ForecastDate", "forecastDate", "date"], "")
      ),
      netLiquidityChange: pickNumber(row, [
        "NetLiquidityChange",
        "netLiquidityChange",
        "amount",
      ]),
    }
  })

const toReconciliationStatus = (
  payload: unknown
): CbReconciliationStatusRow[] =>
  readArrayFromUnknown<unknown>(payload).map((entry, index) => {
    const row = isRecord(entry) ? entry : {}
    return {
      bankAccountId: pickString(row, ["BankAccountId", "bankAccountId"], `${index}`),
      bankName: pickString(row, ["BankName", "bankName"], "Unknown"),
      unreconciledCount: pickNumber(row, [
        "UnreconciledCount",
        "unreconciledCount",
      ]),
      unreconciledAmount: pickNumber(row, [
        "UnreconciledAmount",
        "unreconciledAmount",
      ]),
    }
  })

const toCashConcentration = (payload: unknown): CbCashConcentrationRow[] =>
  readArrayFromUnknown<unknown>(payload).map((entry) => {
    const row = isRecord(entry) ? entry : {}
    const rawPct = pickNumber(row, ["PctOfTotalCash", "pctOfTotalCash"])
    const pctOfTotalCash = rawPct > 0 && rawPct <= 1 ? rawPct * 100 : rawPct
    return {
      bankName: pickString(row, ["BankName", "bankName"], "Unknown"),
      balanceAmount: pickNumber(row, ["BalanceAmount", "balanceAmount", "amount"]),
      pctOfTotalCash,
    }
  })

const toTreasuryTaskSummary = (payload: unknown): CbTreasuryTasksSummary => {
  const row = readObjectFromUnknown(payload)
  return {
    dueTodayCount: pickNumber(row, ["DueTodayCount", "dueTodayCount"]),
    overdueTaskCount: pickNumber(row, ["OverdueTaskCount", "overdueTaskCount"]),
  }
}

export default function CBOverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["cb-overview-kpi", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.cb.kpi, { companyId }),
    enabled: Boolean(companyId),
  })
  const bankAccountsQuery = useQuery({
    queryKey: ["cb-overview-bank-accounts", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.cb.bankAccounts, { companyId }),
    enabled: Boolean(companyId),
  })
  const cashFlowQuery = useQuery({
    queryKey: ["cb-overview-cash-flow", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.cb.cashFlow, { companyId }),
    enabled: Boolean(companyId),
  })
  const recentTxnQuery = useQuery({
    queryKey: ["cb-overview-recent", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.cb.recentTransactions, { companyId }),
    enabled: Boolean(companyId),
  })
  const weekTxnQuery = useQuery({
    queryKey: ["cb-overview-week", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.cb.weekTransactions, { companyId }),
    enabled: Boolean(companyId),
  })
  const liquidityForecastQuery = useQuery({
    queryKey: ["cb-overview-liquidity-forecast", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.cb.liquidityForecast, {
        companyId,
        horizonDays: "90",
      }),
    enabled: Boolean(companyId),
  })
  const reconciliationStatusQuery = useQuery({
    queryKey: ["cb-overview-reconciliation-status", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.cb.reconciliationStatus, { companyId }),
    enabled: Boolean(companyId),
  })
  const cashConcentrationQuery = useQuery({
    queryKey: ["cb-overview-cash-concentration", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.cb.cashConcentrationByBank, {
        companyId,
      }),
    enabled: Boolean(companyId),
  })
  const treasuryTasksQuery = useQuery({
    queryKey: ["cb-overview-open-treasury-tasks", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.cb.openTreasuryTasks, { companyId }),
    enabled: Boolean(companyId),
  })

  const kpi = useMemo(() => toKpi(kpiQuery.data), [kpiQuery.data])
  const banks = useMemo(
    () => toBanks(bankAccountsQuery.data),
    [bankAccountsQuery.data]
  )
  const cashFlow = useMemo(
    () => toCashFlow(cashFlowQuery.data),
    [cashFlowQuery.data]
  )
  const recentRows = useMemo(
    () => toTransactions(recentTxnQuery.data),
    [recentTxnQuery.data]
  )
  const weekRows = useMemo(
    () => toTransactions(weekTxnQuery.data),
    [weekTxnQuery.data]
  )
  const liquidityForecastRows = useMemo(
    () => toLiquidityForecast(liquidityForecastQuery.data),
    [liquidityForecastQuery.data]
  )
  const reconciliationRows = useMemo(
    () => toReconciliationStatus(reconciliationStatusQuery.data),
    [reconciliationStatusQuery.data]
  )
  const concentrationRows = useMemo(
    () => toCashConcentration(cashConcentrationQuery.data),
    [cashConcentrationQuery.data]
  )
  const treasuryTasks = useMemo(
    () => toTreasuryTaskSummary(treasuryTasksQuery.data),
    [treasuryTasksQuery.data]
  )

  const chartBase = useMemo(
    () =>
      Math.max(
        ...banks.map((row) => Math.abs(asNumber(row.balance))),
        ...cashFlow.map((row) => Math.abs(asNumber(row.amount))),
        1
      ),
    [banks, cashFlow]
  )

  const columns: ColumnDef<CbTxn>[] = [
    { accessorKey: "type", header: "Type" },
    { accessorKey: "documentNo", header: "Document No" },
    { accessorKey: "bankName", header: "Bank" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatMoney(asNumber(row.original.amount)),
    },
    {
      accessorKey: "trnDate",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.trnDate),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.status || "Open"}</Badge>
      ),
    },
  ]

  const hasBlockingError =
    kpiQuery.isError ||
    bankAccountsQuery.isError ||
    cashFlowQuery.isError ||
    recentTxnQuery.isError ||
    weekTxnQuery.isError ||
    liquidityForecastQuery.isError ||
    reconciliationStatusQuery.isError ||
    cashConcentrationQuery.isError ||
    treasuryTasksQuery.isError

  return (
    <OverviewPageShell
      module="cb"
      title="Cash Book Overview"
      description="A treasury dashboard for bank balances, liquidity movement, reconciliation pressure, and short-term cash readiness."
    >
      {hasBlockingError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to load the full CB overview</AlertTitle>
          <AlertDescription>
            One or more CB endpoints failed. Partial data is still rendered when
            available.
          </AlertDescription>
        </Alert>
      ) : null}

      <OverviewMetricGrid>
        <OverviewMetricCard
          module="cb"
          title="Total cash"
          value={kpiQuery.isLoading ? <Skeleton className="h-8 w-32" /> : formatMoney(kpi.totalCash)}
          subtitle="Cash on hand across the company."
          meta={<OverviewStatChip module="cb">Total bank {formatMoney(kpi.totalBank)}</OverviewStatChip>}
          icon={Wallet}
        />
        <OverviewMetricCard
          module="cb"
          title="Pending receipts"
          value={kpiQuery.isLoading ? <Skeleton className="h-8 w-16" /> : formatOverviewCompactNumber(kpi.pendingReceipts)}
          subtitle="Treasury items waiting to be received."
          meta={<OverviewStatChip module="cb">Pending payments {formatOverviewCompactNumber(kpi.pendingPayments)}</OverviewStatChip>}
          icon={TrendingUp}
        />
        <OverviewMetricCard
          module="cb"
          title="Recent transactions"
          value={formatOverviewCompactNumber(recentRows.length)}
          subtitle="Latest treasury and bank transactions."
          meta={<OverviewStatChip module="cb">Week volume {formatOverviewCompactNumber(weekRows.length)}</OverviewStatChip>}
          icon={Clock3}
        />
        <OverviewMetricCard
          module="cb"
          title="Liquidity forecast rows"
          value={formatOverviewCompactNumber(liquidityForecastRows.length)}
          subtitle="Forward-looking liquidity periods returned by the API."
          meta={<OverviewStatChip module="cb">Banks tracked {formatOverviewCompactNumber(banks.length)}</OverviewStatChip>}
          icon={Landmark}
        />
        <OverviewMetricCard
          module="cb"
          title="Due today"
          value={formatOverviewCompactNumber(treasuryTasks.dueTodayCount)}
          subtitle="Treasury tasks expected to be handled today."
          meta={<OverviewStatChip module="cb">Overdue tasks {formatOverviewCompactNumber(treasuryTasks.overdueTaskCount)}</OverviewStatChip>}
          icon={Clock3}
        />
        <OverviewMetricCard
          module="cb"
          title="Bank concentration"
          value={
            concentrationRows.length > 0
              ? `${concentrationRows[0]?.pctOfTotalCash.toFixed(1)}%`
              : "—"
          }
          subtitle="Largest bank share of total cash."
          meta={<OverviewStatChip module="cb">Reconciliation rows {formatOverviewCompactNumber(reconciliationRows.length)}</OverviewStatChip>}
          icon={Wallet}
        />
      </OverviewMetricGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="cb"
          title="Bank accounts"
          description="Current balance by bank account."
          icon={Landmark}
        >
          <OverviewBarList
            module="cb"
            items={banks.map((item, idx) => ({
              key: `${item.bankName}-${idx}`,
              label: item.bankName,
              value: formatMoney(item.balance),
              progress: (Math.abs(item.balance) / chartBase) * 100,
            }))}
            emptyMessage={
              bankAccountsQuery.isLoading
                ? "Loading bank accounts..."
                : "No bank account rows were returned."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="cb"
          title="Cash flow"
          description="Net movement by treasury flow group."
          icon={TrendingUp}
        >
          <OverviewBarList
            module="cb"
            items={cashFlow.map((item, idx) => ({
              key: `${item.label}-${idx}`,
              label: item.label,
              value: formatMoney(item.amount),
              progress: (Math.abs(item.amount) / chartBase) * 100,
              tone: item.amount >= 0 ? "positive" : "danger",
            }))}
            emptyMessage={
              cashFlowQuery.isLoading
                ? "Loading cash-flow rows..."
                : "No cash-flow rows were returned."
            }
          />
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="cb"
          title="Cash concentration by bank"
          description="How total cash is distributed across banks."
          icon={Wallet}
        >
          <OverviewBarList
            module="cb"
            items={concentrationRows.map((row, idx) => ({
              key: `${row.bankName}-${idx}`,
              label: row.bankName,
              value: `${row.pctOfTotalCash.toFixed(1)}%`,
              hint: formatMoney(row.balanceAmount),
              progress: row.pctOfTotalCash,
            }))}
            emptyMessage={
              cashConcentrationQuery.isLoading
                ? "Loading bank concentration..."
                : "No cash concentration data."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="cb"
          title="Reconciliation status"
          description="Banks with unreconciled items and value still outstanding."
          icon={AlertTriangle}
        >
          {reconciliationRows.length > 0 ? (
            reconciliationRows.map((row, idx) => (
              <div
                key={row.bankAccountId || idx}
                className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.bankName}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatOverviewCompactNumber(row.unreconciledCount)} unreconciled item(s)
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {formatMoney(row.unreconciledAmount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              {reconciliationStatusQuery.isLoading
                ? "Loading reconciliation status..."
                : "No reconciliation status data."}
            </p>
          )}
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="cb"
          title="Liquidity forecast"
          description="Expected liquidity change over the configured horizon."
          icon={TrendingUp}
        >
          <OverviewBarList
            module="cb"
            items={liquidityForecastRows.map((row, idx) => {
              const forecastBase = Math.max(
                ...liquidityForecastRows.map((entry) => Math.abs(entry.netLiquidityChange)),
                1
              )
              return {
                key: `${row.period}-${idx}`,
                label: row.period,
                value: formatMoney(row.netLiquidityChange),
                progress: (Math.abs(row.netLiquidityChange) / forecastBase) * 100,
                tone: row.netLiquidityChange >= 0 ? "positive" : "danger",
              }
            })}
            emptyMessage={
              liquidityForecastQuery.isLoading
                ? "Loading liquidity forecast..."
                : "No liquidity forecast data."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="cb"
          title="Open treasury tasks"
          description="Headline workload for the treasury team."
          icon={Clock3}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Due today
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatOverviewCompactNumber(treasuryTasks.dueTodayCount)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Treasury actions that should be completed today.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Overdue
              </p>
              <p className="mt-2 text-2xl font-semibold text-destructive">
                {formatOverviewCompactNumber(treasuryTasks.overdueTaskCount)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Tasks that are past expected completion.
              </p>
            </div>
          </div>
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="cb"
          title="Recent transactions"
          description="Latest treasury transactions posted to the cash book."
          icon={Wallet}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={recentRows}
            columns={columns}
            emptyMessage={
              recentTxnQuery.isLoading
                ? "Loading recent transactions..."
                : "No recent transactions found"
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="cb"
          title="Week transactions"
          description="Weekly treasury transaction activity."
          icon={Clock3}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={weekRows}
            columns={columns}
            emptyMessage={
              weekTxnQuery.isLoading
                ? "Loading week transactions..."
                : "No week transactions found"
            }
          />
        </OverviewSectionCard>
      </div>
    </OverviewPageShell>
  )
}
