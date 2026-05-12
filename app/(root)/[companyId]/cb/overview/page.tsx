"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Landmark, Wallet } from "lucide-react"

import { getData } from "@/lib/api-client"
import { OverviewDashboardRoutes } from "@/lib/overview-dashboard-routes"
import { pickNumber, pickString } from "@/lib/overview-row-pickers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { OverviewDataTable } from "@/components/accounting/overview-data-table"

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

const ARRAY_KEYS = [
  "data",
  "Data",
  "items",
  "rows",
  "results",
  "list",
  "records",
] as const
/** Never use SqlResponse numeric `result` as a row object. */
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
  // Prefer SqlResponse `data` / `Data` only (same as overview-sql-response unwrap).
  if ("data" in payload) {
    const d = payload.data
    if (Array.isArray(d) && d.length > 0) {
      const row = d[0]
      if (isRecord(row)) return row
    }
    if (isRecord(d)) return d
    return {}
  }
  if ("Data" in payload) {
    const d = (payload as AnyRecord).Data
    if (Array.isArray(d) && d.length > 0) {
      const row = d[0]
      if (isRecord(row)) return row
    }
    if (isRecord(d)) return d
    return {}
  }
  for (const key of OBJECT_KEYS) {
    const value = payload[key]
    if (Array.isArray(value) && value.length > 0) {
      const row = value[0]
      if (isRecord(row)) {
        return row
      }
    }
    if (isRecord(value)) {
      return value
    }
  }
  return {}
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
        `Flow ${index + 1}`,
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
        "Unknown",
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
        "-",
      ),
      bankName: pickString(
        row,
        ["entityName", "bankName", "bank", "accountName", "EntityName"],
        "Unknown",
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
        "",
      ),
    }
  })

const formatMoney = (value: number): string =>
  `AED ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`

const formatDate = (value: string): string => {
  const text = asString(value, "-")
  if (text === "-") {
    return text
  }
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toLocaleDateString("en-GB")
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

  const chartBase = useMemo(
    () =>
      Math.max(
        ...banks.map((x) => Math.abs(asNumber(x.balance))),
        ...cashFlow.map((x) => Math.abs(asNumber(x.amount))),
        1
      ),
    [banks, cashFlow]
  )

  const hasBlockingError =
    kpiQuery.isError ||
    bankAccountsQuery.isError ||
    cashFlowQuery.isError ||
    recentTxnQuery.isError ||
    weekTxnQuery.isError

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

  const isLoadingAny =
    kpiQuery.isLoading ||
    bankAccountsQuery.isLoading ||
    cashFlowQuery.isLoading ||
    recentTxnQuery.isLoading ||
    weekTxnQuery.isLoading

  return (
    <div className="@container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CB Overview</h1>
      </div>

      {hasBlockingError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load complete overview</AlertTitle>
          <AlertDescription>
            One or more CB endpoints failed. Partial data is still rendered when
            available.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Cash</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {kpiQuery.isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              formatMoney(kpi.totalCash)
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Bank</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {kpiQuery.isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              formatMoney(kpi.totalBank)
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Receipts</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <Wallet className="h-5 w-5" />
            {kpiQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              kpi.pendingReceipts
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            <Landmark className="h-5 w-5" />
            {kpiQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              kpi.pendingPayments
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankAccountsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="h-4 w-8/12" />
              </div>
            ) : (
              banks.map((item, idx) => (
                <div key={`${item.bankName}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.bankName}</span>
                    <span>{formatMoney(asNumber(item.balance))}</span>
                  </div>
                  <div className="bg-muted h-2 rounded">
                    <div
                      className="bg-primary h-2 rounded"
                      style={{
                        width: `${(Math.abs(asNumber(item.balance)) / chartBase) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
            {!bankAccountsQuery.isLoading && banks.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No bank account rows were returned.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cashFlowQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-9/12" />
                <Skeleton className="h-4 w-7/12" />
              </div>
            ) : (
              cashFlow.map((item, idx) => (
                <div
                  key={`${item.label}-${item.type}-${idx}`}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span>{formatMoney(asNumber(item.amount))}</span>
                  </div>
                  <div className="bg-muted h-2 rounded">
                    <div
                      className="bg-primary h-2 rounded"
                      style={{
                        width: `${(Math.abs(asNumber(item.amount)) / chartBase) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
            {!cashFlowQuery.isLoading && cashFlow.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No cash-flow rows were returned.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAny ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <OverviewDataTable
              data={recentRows}
              columns={columns}
              emptyMessage="No recent transactions found"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Week Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAny ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <OverviewDataTable
              data={weekRows}
              columns={columns}
              emptyMessage="No week transactions found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
