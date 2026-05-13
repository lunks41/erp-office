"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertCircle,
  BookOpen,
  CircleAlert,
  CircleCheck,
  Clock3,
  Landmark,
  Scale,
  TrendingUp,
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

  if ("Data" in payload) {
    const data = (payload as AnyRecord).Data as unknown
    if (data !== undefined && data !== null) {
      return data
    }
    return {}
  }

  return payload
}

const getFirstRecord = (...sources: unknown[]): AnyRecord => {
  for (const source of sources) {
    if (Array.isArray(source) && source.length > 0) {
      const row = source[0]
      if (isRecord(row)) {
        return row
      }
    }
    if (isRecord(source)) {
      return source
    }
  }
  return {}
}

const asArray = <T,>(...sources: unknown[]): T[] => {
  const queue = [...sources]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    if (Array.isArray(current)) {
      return current as T[]
    }

    if (isRecord(current)) {
      const candidates = [
        current.items,
        current.results,
        current.rows,
        current.list,
        current.entries,
        current.data,
        (current as AnyRecord).Data,
      ]
      queue.push(...candidates)
    }
  }

  return []
}

const formatMoney = (value: number) =>
  `AED ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`

type GlKpi = {
  totalAssets: number
  totalLiabilities: number
  netEquity: number
  ytdPnl: number
}

type GlAccountType = {
  accountType: string
  amount: number
}

type GlJournal = {
  journalNo: string
  referenceNo: string
  trnDate: string
  amount: number
  status: string
}

type GlTrial = {
  accountCode: string
  accountName: string
  debit: number
  credit: number
}

type GlAccountingPeriodStatus = {
  fiscalYear: number
  periodNo: number
  periodStatus: string
  daysOpenInPeriod: number
}

type GlSuspenseBalance = {
  accountCode: string
  accountName: string
  debit: number
  credit: number
}

type GlUnpostedJournalSummary = {
  unpostedBatchCount: number
  totalUnpostedAmount: number
}

type GlAccountTypeMovement = {
  accountType: string
  openingBalance: number
  closingBalance: number
  netMovement: number
}

const normalizeKpi = (payload: unknown): GlKpi => {
  const base = unwrapData(payload)
  const record = getFirstRecord(base, unwrapData(base))
  return {
    totalAssets: pickNumber(record, ["totalAssets", "assets"]),
    totalLiabilities: pickNumber(record, ["totalLiabilities", "liabilities"]),
    netEquity: pickNumber(record, ["netEquity", "equity"]),
    ytdPnl: pickNumber(record, ["ytdPnl", "ytdPnL", "pnlYtd"]),
  }
}

const normalizeAccountTypes = (payload: unknown): GlAccountType[] => {
  const base = unwrapData(payload)
  const rows = asArray<AnyRecord>(base, unwrapData(base))
  return rows.map((item) => ({
    accountType: pickString(
      item,
      ["accountType", "label", "type", "name"],
      "Account Type"
    ),
    amount: pickNumber(item, ["balance", "amount", "total"]),
  }))
}

const normalizeJournals = (payload: unknown): GlJournal[] => {
  const base = unwrapData(payload)
  const rows = asArray<AnyRecord>(base, unwrapData(base))
  return rows.map((item) => ({
    journalNo: pickString(
      item,
      ["journalNo", "documentNo", "journalNumber", "number"],
      "-"
    ),
    referenceNo: pickString(item, ["referenceNo", "reference", "docNo"], "-"),
    trnDate: pickString(
      item,
      ["trnDate", "date", "journalDate", "accountDate"],
      "-"
    ),
    amount: pickNumber(item, [
      "totAmt",
      "totLocalAmt",
      "amount",
      "totalAmount",
      "value",
    ]),
    status: pickString(item, ["status"], "Open"),
  }))
}

const normalizeTrialBalance = (payload: unknown): GlTrial[] => {
  const base = unwrapData(payload)
  const rows = asArray<AnyRecord>(base, unwrapData(base))
  return rows.map((item) => ({
    accountCode: pickString(item, ["accountCode", "code"], "-"),
    accountName: pickString(item, ["accountName", "name"], "-"),
    debit: pickNumber(item, ["debit", "totalDebit", "closingDebit"]),
    credit: pickNumber(item, ["credit", "totalCredit", "closingCredit"]),
  }))
}

const normalizePeriodStatus = (payload: unknown): GlAccountingPeriodStatus => {
  const row = getFirstRecord(unwrapData(payload), payload)
  return {
    fiscalYear: pickNumber(row, ["FiscalYear", "fiscalYear"]),
    periodNo: pickNumber(row, ["PeriodNo", "periodNo"]),
    periodStatus: pickString(row, ["PeriodStatus", "periodStatus"], "Unknown"),
    daysOpenInPeriod: pickNumber(row, ["DaysOpenInPeriod", "daysOpenInPeriod"]),
  }
}

const normalizeSuspenseBalances = (payload: unknown): GlSuspenseBalance[] => {
  const rows = asArray<AnyRecord>(unwrapData(payload), payload)
  return rows.map((item) => ({
    accountCode: pickString(item, ["AccountCode", "accountCode"], "-"),
    accountName: pickString(item, ["AccountName", "accountName"], "-"),
    debit: pickNumber(item, ["Debit", "debit"]),
    credit: pickNumber(item, ["Credit", "credit"]),
  }))
}

const normalizeUnpostedSummary = (
  payload: unknown
): GlUnpostedJournalSummary => {
  const row = getFirstRecord(unwrapData(payload), payload)
  return {
    unpostedBatchCount: pickNumber(row, [
      "UnpostedBatchCount",
      "unpostedBatchCount",
    ]),
    totalUnpostedAmount: pickNumber(row, [
      "TotalUnpostedAmount",
      "totalUnpostedAmount",
    ]),
  }
}

const normalizeAccountTypeMovement = (
  payload: unknown
): GlAccountTypeMovement[] => {
  const rows = asArray<AnyRecord>(unwrapData(payload), payload)
  return rows.map((item) => ({
    accountType: pickString(item, ["AccountType", "accountType"], "Account Type"),
    openingBalance: pickNumber(item, ["OpeningBalance", "openingBalance"]),
    closingBalance: pickNumber(item, ["ClosingBalance", "closingBalance"]),
    netMovement: pickNumber(item, ["NetMovement", "netMovement"]),
  }))
}

export default function GLOverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["gl-overview-kpi", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.gl.kpi, { companyId }),
    enabled: !!companyId,
  })
  const accountTypeBalancesQuery = useQuery({
    queryKey: ["gl-overview-account-type-balances", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.gl.accountTypeBalances, { companyId }),
    enabled: !!companyId,
  })
  const recentJournalsQuery = useQuery({
    queryKey: ["gl-overview-recent-journals", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.gl.recentJournals, { companyId }),
    enabled: !!companyId,
  })
  const trialBalanceQuery = useQuery({
    queryKey: ["gl-overview-trial-balance", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.gl.trialBalance, { companyId }),
    enabled: !!companyId,
  })
  const periodStatusQuery = useQuery({
    queryKey: ["gl-overview-period-status", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.gl.accountingPeriodStatus, { companyId }),
    enabled: !!companyId,
  })
  const suspenseBalancesQuery = useQuery({
    queryKey: ["gl-overview-suspense-balances", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.gl.suspenseBalances, { companyId }),
    enabled: !!companyId,
  })
  const unpostedSummaryQuery = useQuery({
    queryKey: ["gl-overview-unposted-summary", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.gl.unpostedJournalSummary, { companyId }),
    enabled: !!companyId,
  })
  const accountTypeMovementQuery = useQuery({
    queryKey: ["gl-overview-account-type-movement", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.gl.accountTypeMovement, { companyId }),
    enabled: !!companyId,
  })

  const kpi = useMemo(() => normalizeKpi(kpiQuery.data), [kpiQuery.data])
  const accountTypes = useMemo(
    () => normalizeAccountTypes(accountTypeBalancesQuery.data),
    [accountTypeBalancesQuery.data]
  )
  const journals = useMemo(
    () => normalizeJournals(recentJournalsQuery.data),
    [recentJournalsQuery.data]
  )
  const trialBalance = useMemo(
    () => normalizeTrialBalance(trialBalanceQuery.data),
    [trialBalanceQuery.data]
  )
  const periodStatus = useMemo(
    () => normalizePeriodStatus(periodStatusQuery.data),
    [periodStatusQuery.data]
  )
  const suspenseBalances = useMemo(
    () => normalizeSuspenseBalances(suspenseBalancesQuery.data),
    [suspenseBalancesQuery.data]
  )
  const unpostedSummary = useMemo(
    () => normalizeUnpostedSummary(unpostedSummaryQuery.data),
    [unpostedSummaryQuery.data]
  )
  const accountTypeMovement = useMemo(
    () => normalizeAccountTypeMovement(accountTypeMovementQuery.data),
    [accountTypeMovementQuery.data]
  )

  const chartBase = useMemo(
    () => Math.max(...accountTypes.map((item) => Math.abs(item.amount)), 1),
    [accountTypes]
  )

  const journalColumns = useMemo<ColumnDef<GlJournal>[]>(
    () => [
      { accessorKey: "journalNo", header: "Journal No" },
      { accessorKey: "referenceNo", header: "Reference" },
      { accessorKey: "trnDate", header: "Date" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatMoney(row.original.amount),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.status}</Badge>
        ),
      },
    ],
    []
  )

  const trialColumns = useMemo<ColumnDef<GlTrial>[]>(
    () => [
      { accessorKey: "accountCode", header: "Code" },
      { accessorKey: "accountName", header: "Account" },
      {
        accessorKey: "debit",
        header: "Debit",
        cell: ({ row }) => formatMoney(row.original.debit),
      },
      {
        accessorKey: "credit",
        header: "Credit",
        cell: ({ row }) => formatMoney(row.original.credit),
      },
    ],
    []
  )

  const hasError =
    kpiQuery.isError ||
    accountTypeBalancesQuery.isError ||
    recentJournalsQuery.isError ||
    trialBalanceQuery.isError ||
    periodStatusQuery.isError ||
    suspenseBalancesQuery.isError ||
    unpostedSummaryQuery.isError ||
    accountTypeMovementQuery.isError

  return (
    <OverviewPageShell
      module="gl"
      title="General Ledger Overview"
      description="A finance-reporting dashboard for balance composition, accounting controls, and journal completeness."
    >
      {hasError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some GL sections failed to load</AlertTitle>
          <AlertDescription>
            The page is rendering available data only while one or more GL
            endpoints are unavailable.
          </AlertDescription>
        </Alert>
      ) : null}

      <OverviewMetricGrid>
        <OverviewMetricCard
          module="gl"
          title="Total assets"
          value={
            kpiQuery.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatMoney(kpi.totalAssets)
            )
          }
          subtitle="Balance sheet asset position."
          meta={
            <OverviewStatChip module="gl">
              Liabilities {formatMoney(kpi.totalLiabilities)}
            </OverviewStatChip>
          }
          icon={BookOpen}
        />
        <OverviewMetricCard
          module="gl"
          title="Net equity"
          value={
            kpiQuery.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatMoney(kpi.netEquity)
            )
          }
          subtitle="Current equity reflected in the ledger snapshot."
          meta={
            <OverviewStatChip module="gl">
              YTD P&amp;L {formatMoney(kpi.ytdPnl)}
            </OverviewStatChip>
          }
          icon={CircleCheck}
          tone="positive"
        />
        <OverviewMetricCard
          module="gl"
          title="Recent journals"
          value={formatOverviewCompactNumber(journals.length)}
          subtitle="Journal rows returned by the recent-journals endpoint."
          meta={
            <OverviewStatChip module="gl">
              Trial rows {formatOverviewCompactNumber(trialBalance.length)}
            </OverviewStatChip>
          }
          icon={Clock3}
        />
        <OverviewMetricCard
          module="gl"
          title="Accounting period"
          value={
            periodStatus.periodNo > 0
              ? `P${periodStatus.periodNo} FY${periodStatus.fiscalYear}`
              : "—"
          }
          subtitle="Current accounting period status from the control endpoint."
          meta={
            <OverviewStatChip module="gl">
              {periodStatus.periodStatus || "Unknown"}
            </OverviewStatChip>
          }
          icon={Scale}
        />
        <OverviewMetricCard
          module="gl"
          title="Unposted batches"
          value={formatOverviewCompactNumber(unpostedSummary.unpostedBatchCount)}
          subtitle="Journal batches not fully posted yet."
          meta={
            <OverviewStatChip module="gl">
              Amount {formatMoney(unpostedSummary.totalUnpostedAmount)}
            </OverviewStatChip>
          }
          icon={CircleAlert}
          tone={
            unpostedSummary.unpostedBatchCount > 0 ? "warning" : "neutral"
          }
        />
        <OverviewMetricCard
          module="gl"
          title="Suspense accounts"
          value={formatOverviewCompactNumber(suspenseBalances.length)}
          subtitle="Suspense balances currently requiring review."
          meta={
            <OverviewStatChip module="gl">
              Movement rows {formatOverviewCompactNumber(accountTypeMovement.length)}
            </OverviewStatChip>
          }
          icon={Landmark}
        />
      </OverviewMetricGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="gl"
          title="Account type balances"
          description="Current balance composition across account types."
          icon={BookOpen}
        >
          <OverviewBarList
            module="gl"
            items={accountTypes.map((item, idx) => ({
              key: `${item.accountType}-${idx}`,
              label: item.accountType,
              value: formatMoney(item.amount),
              progress: (Math.abs(item.amount) / chartBase) * 100,
            }))}
            emptyMessage={
              accountTypeBalancesQuery.isLoading
                ? "Loading account type balances..."
                : "No account type balances found."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="gl"
          title="Account type movement"
          description="Opening, closing, and net movement by account type."
          icon={TrendingUp}
        >
          {accountTypeMovement.length > 0 ? (
            accountTypeMovement.map((row, idx) => (
              <div
                key={`${row.accountType}-${idx}`}
                className="space-y-1 border-b border-border/60 py-2 last:border-0"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{row.accountType}</span>
                  <span
                    className={
                      row.netMovement >= 0
                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                        : "font-semibold text-destructive"
                    }
                  >
                    {row.netMovement >= 0 ? "+" : "-"}
                    {formatMoney(Math.abs(row.netMovement))}
                  </span>
                </div>
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>Opening {formatMoney(row.openingBalance)}</span>
                  <span>Closing {formatMoney(row.closingBalance)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              {accountTypeMovementQuery.isLoading
                ? "Loading account type movement..."
                : "No account type movement data."}
            </p>
          )}
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <OverviewSectionCard
          module="gl"
          title="Accounting control panel"
          description="Current period status and unposted journal pressure."
          icon={Scale}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Period status
              </p>
              <p className="mt-2 text-xl font-semibold">
                {periodStatus.periodStatus || "Unknown"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {periodStatus.periodNo > 0
                  ? `Period ${periodStatus.periodNo} · FY${periodStatus.fiscalYear}`
                  : "No active period returned"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Days open
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatOverviewCompactNumber(periodStatus.daysOpenInPeriod)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Days the current period has remained open.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Unposted batches
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatOverviewCompactNumber(unpostedSummary.unpostedBatchCount)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Batch count returned by the control endpoint.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                Unposted amount
              </p>
              <p className="mt-2 text-xl font-semibold">
                {formatMoney(unpostedSummary.totalUnpostedAmount)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Aggregate local amount still awaiting posting.
              </p>
            </div>
          </div>
        </OverviewSectionCard>

        <OverviewSectionCard
          module="gl"
          title="Suspense balances"
          description="Accounts carrying debit or credit balances that should be resolved."
          icon={AlertCircle}
        >
          {suspenseBalances.length > 0 ? (
            suspenseBalances.map((row, idx) => {
              const net = row.debit - row.credit
              return (
                <div
                  key={`${row.accountCode}-${idx}`}
                  className="space-y-1 border-b border-border/60 py-2 last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {row.accountCode} · {row.accountName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Debit {formatMoney(row.debit)} · Credit {formatMoney(row.credit)}
                      </p>
                    </div>
                    <span
                      className={
                        net >= 0
                          ? "shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                          : "shrink-0 text-sm font-semibold text-destructive"
                      }
                    >
                      {net >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(net))}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-muted-foreground text-sm">
              {suspenseBalancesQuery.isLoading
                ? "Loading suspense balances..."
                : "No suspense balances found."}
            </p>
          )}
        </OverviewSectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="gl"
          title="Recent journals"
          description="Latest journals captured in the overview endpoint."
          icon={Clock3}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={journals}
            columns={journalColumns}
            emptyMessage={
              recentJournalsQuery.isLoading
                ? "Loading recent journals..."
                : "No recent journals found"
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="gl"
          title="Trial balance"
          description="Trial balance rows rendered directly from the overview API."
          icon={Landmark}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={trialBalance}
            columns={trialColumns}
            emptyMessage={
              trialBalanceQuery.isLoading
                ? "Loading trial balance..."
                : "No trial balance found"
            }
          />
        </OverviewSectionCard>
      </div>
    </OverviewPageShell>
  )
}
