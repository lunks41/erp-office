"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, BookOpen, CircleAlert, CircleCheck, Scale } from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type AnyRecord = Record<string, unknown>

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null

const unwrapData = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload
  }

  if ("data" in payload) {
    const data = payload.data
    if (data !== undefined && data !== null) {
      return data
    }
  }

  return payload
}

const getFirstRecord = (...sources: unknown[]): AnyRecord => {
  for (const source of sources) {
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
    if (!current) {
      continue
    }

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
      ]
      queue.push(...candidates)
    }
  }

  return []
}

const asNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : Number(value || 0)

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback

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
type GlAccountType = { accountType: string; amount: number }
type GlJournal = {
  journalNo: string
  referenceNo: string
  trnDate: string
  amount: number
  status: string
}
type GlTrial = { accountCode: string; accountName: string; debit: number; credit: number }

const normalizeKpi = (payload: unknown): GlKpi => {
  const base = unwrapData(payload)
  const record = getFirstRecord(base, unwrapData(base))
  return {
    totalAssets: asNumber(record.totalAssets ?? record.assets),
    totalLiabilities: asNumber(record.totalLiabilities ?? record.liabilities),
    netEquity: asNumber(record.netEquity ?? record.equity),
    ytdPnl: asNumber(record.ytdPnl ?? record.ytdPnL ?? record.pnlYtd),
  }
}

const normalizeAccountTypes = (payload: unknown): GlAccountType[] => {
  const base = unwrapData(payload)
  const rows = asArray<AnyRecord>(base, unwrapData(base))
  return rows.map((item) => ({
    accountType: asString(item.accountType ?? item.type ?? item.name, "Account Type"),
    amount: asNumber(item.balance ?? item.amount ?? item.total),
  }))
}

const normalizeJournals = (payload: unknown): GlJournal[] => {
  const base = unwrapData(payload)
  const rows = asArray<AnyRecord>(base, unwrapData(base))
  return rows.map((item) => ({
    journalNo: asString(item.journalNo ?? item.journalNumber ?? item.number, "-"),
    referenceNo: asString(item.referenceNo ?? item.reference ?? item.docNo, "-"),
    trnDate: asString(item.trnDate ?? item.date ?? item.journalDate, "-"),
    amount: asNumber(item.amount ?? item.totalAmount ?? item.value),
    status: asString(item.status, "Open"),
  }))
}

const normalizeTrialBalance = (payload: unknown): GlTrial[] => {
  const base = unwrapData(payload)
  const rows = asArray<AnyRecord>(base, unwrapData(base))
  return rows.map((item) => ({
    accountCode: asString(item.accountCode ?? item.code, "-"),
    accountName: asString(item.accountName ?? item.name, "-"),
    debit: asNumber(item.debit ?? item.totalDebit),
    credit: asNumber(item.credit ?? item.totalCredit),
  }))
}

function SectionError({ title, message }: { title: string; message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export default function GLOverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["gl-overview-kpi", companyId],
    queryFn: () => getData("/gl/kpi", { companyId }),
    enabled: !!companyId,
  })
  const accountTypeBalancesQuery = useQuery({
    queryKey: ["gl-overview-account-type-balances", companyId],
    queryFn: () => getData("/gl/account-type-balances", { companyId }),
    enabled: !!companyId,
  })
  const recentJournalsQuery = useQuery({
    queryKey: ["gl-overview-recent-journals", companyId],
    queryFn: () => getData("/gl/journals/recent", { companyId }),
    enabled: !!companyId,
  })
  const trialBalanceQuery = useQuery({
    queryKey: ["gl-overview-trial-balance", companyId],
    queryFn: () => getData("/gl/trial-balance", { companyId }),
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

  const chartBase = useMemo(
    () => Math.max(...accountTypes.map((x) => x.amount), 1),
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
        cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
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

  return (
    <div className="@container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GL Overview</h1>
        <p className="text-muted-foreground">API: `/gl/*` via `/api/proxy`</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Assets</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <BookOpen className="h-5 w-5" />
            {kpiQuery.isLoading ? <Skeleton className="h-7 w-32" /> : formatMoney(kpi.totalAssets)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Liabilities</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <CircleAlert className="h-5 w-5" />
            {kpiQuery.isLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              formatMoney(kpi.totalLiabilities)
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Equity</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <CircleCheck className="h-5 w-5" />
            {kpiQuery.isLoading ? <Skeleton className="h-7 w-32" /> : formatMoney(kpi.netEquity)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">YTD P&amp;L</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <Scale className="h-5 w-5" />
            {kpiQuery.isLoading ? <Skeleton className="h-7 w-32" /> : formatMoney(kpi.ytdPnl)}
          </CardContent>
        </Card>
      </div>
      {kpiQuery.isError && (
        <SectionError title="KPI unavailable" message="Unable to load GL KPI data at the moment." />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Type Balances (Chart)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accountTypeBalancesQuery.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`account-type-skeleton-${idx}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          {!accountTypeBalancesQuery.isLoading &&
            accountTypes.map((item, idx) => (
              <div key={`${item.accountType}-${idx}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.accountType}</span>
                  <span>{formatMoney(item.amount)}</span>
                </div>
                <div className="bg-muted h-2 rounded">
                  <div className="bg-primary h-2 rounded" style={{ width: `${(item.amount / chartBase) * 100}%` }} />
                </div>
              </div>
            ))}
          {!accountTypeBalancesQuery.isLoading &&
            !accountTypeBalancesQuery.isError &&
            accountTypes.length === 0 && (
              <p className="text-muted-foreground text-sm">No account type balances found.</p>
            )}
          {accountTypeBalancesQuery.isError && (
            <SectionError
              title="Account type balances unavailable"
              message="Unable to load account type balance data."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Journals</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJournalsQuery.isError ? (
            <SectionError
              title="Recent journals unavailable"
              message="Unable to load recent journal entries."
            />
          ) : (
            <OverviewDataTable
              data={journals}
              columns={journalColumns}
              emptyMessage={recentJournalsQuery.isLoading ? "Loading recent journals..." : "No journals found"}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {trialBalanceQuery.isError ? (
            <SectionError
              title="Trial balance unavailable"
              message="Unable to load trial balance data."
            />
          ) : (
            <OverviewDataTable
              data={trialBalance}
              columns={trialColumns}
              emptyMessage={trialBalanceQuery.isLoading ? "Loading trial balance..." : "No trial balance data found"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
