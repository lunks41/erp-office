"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  Layers,
  Ship,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"

import { getData } from "@/lib/api-client"
import { formatDateForDisplay } from "@/lib/date-utils"
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
import { Skeleton } from "@/components/ui/skeleton"

type AnyRecord = Record<string, unknown>
const isRecord = (v: unknown): v is AnyRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const asRecord = (v: unknown): AnyRecord => (isRecord(v) ? v : {})
const asArray = <T,>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[]
  if (isRecord(v)) {
    for (const c of [v.items, v.rows, v.results, v.list, v.data, v.Data]) {
      if (Array.isArray(c)) return c as T[]
    }
  }
  return []
}
const isApiSuccess = (payload: unknown): boolean => {
  if (!isRecord(payload)) return payload != null
  if ("result" in payload || "Result" in payload) {
    return Number(payload.result ?? payload.Result) === 1
  }
  return true
}

const unwrapData = (payload: unknown): unknown => {
  if (!isRecord(payload)) return payload
  if (!isApiSuccess(payload)) return null
  if ("data" in payload && payload.data != null) return payload.data
  if ("Data" in payload && (payload as AnyRecord).Data != null)
    return (payload as AnyRecord).Data
  if ("payload" in payload && payload.payload != null) return payload.payload
  if ("response" in payload && (payload as AnyRecord).response != null)
    return (payload as AnyRecord).response
  return payload
}
const firstRowOrRecord = (payload: unknown): AnyRecord => {
  const inner = unwrapData(payload)
  if (Array.isArray(inner) && inner.length > 0 && isRecord(inner[0]))
    return inner[0] as AnyRecord
  return asRecord(inner)
}
const asString = (v: unknown): string =>
  typeof v === "string" ? v : String(v ?? "")
const formatOverviewDate = (v: unknown): string => {
  const raw = asString(v)
  if (!raw) return "-"
  return formatDateForDisplay(raw) || raw
}
const formatPeriodLabel = (v: unknown): string => {
  const raw = asString(v)
  if (!raw) return "—"
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChecklistKpi = {
  totalJobOrders: number
  openJobOrders: number
  completedToday: number
  pendingApproval: number
  createdThisWeek: number
  invoicedThisMonth: number
}
type StatusRow = { statusName: string; count: number }
type CustomerRow = { customerName: string; jobOrderCount: number }
type ServiceTypeRow = { serviceTypeName: string; usageCount: number }
type MonthlyTrendRow = { period: string; createdCount: number; closedCount: number }
type JobOrderRow = {
  jobOrderNo: string
  customerName: string
  vesselName: string
  status: string
  createdDate: string
}

type TallyKpi = {
  totalTallyServices: number
  openTallyServices: number
  completedToday: number
  pendingApproval: number
  createdThisWeek: number
  invoicedThisMonth: number
}
type TallyCustomerRow = { customerName: string; tallyCount: number }
type TallyRow = {
  tallyRef: string
  customerName: string
  vesselName: string
  status: string
  serviceDate: string
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeKpi = (payload: unknown): ChecklistKpi => {
  const d = firstRowOrRecord(payload)
  return {
    totalJobOrders: pickNumber(d, [
      "totalJobOrders", "TotalJobOrders", "total", "jobOrderCount",
    ]),
    openJobOrders: pickNumber(d, [
      "openJobOrders", "OpenJobOrders", "open", "activeJobOrders",
    ]),
    completedToday: pickNumber(d, [
      "completedToday", "CompletedToday", "closedToday",
    ]),
    pendingApproval: pickNumber(d, [
      "pendingApproval", "PendingApproval", "pending", "awaitingApproval",
    ]),
    createdThisWeek: pickNumber(d, [
      "createdThisWeek", "CreatedThisWeek", "weekCount", "thisWeek",
    ]),
    invoicedThisMonth: pickNumber(d, [
      "invoicedThisMonth", "InvoicedThisMonth", "monthInvoiced",
    ]),
  }
}

const normalizeStatusBreakdown = (payload: unknown): StatusRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    statusName: pickString(e, ["statusName", "StatusName", "status", "name"], "Unknown"),
    count: pickNumber(e, ["count", "Count", "jobOrderCount", "total"]),
  }))

const normalizeTopCustomers = (payload: unknown): CustomerRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    customerName: pickString(
      e, ["customerName", "CustomerName", "customer", "name"], "Unknown"
    ),
    jobOrderCount: pickNumber(e, ["jobOrderCount", "JobOrderCount", "count", "total"]),
  }))

const normalizeServiceTypeDistribution = (payload: unknown): ServiceTypeRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    serviceTypeName: pickString(
      e, ["serviceTypeName", "ServiceTypeName", "serviceType", "taskName", "name"], "Unknown"
    ),
    usageCount: pickNumber(e, ["usageCount", "UsageCount", "count", "total"]),
  }))

const normalizeMonthlyTrend = (payload: unknown): MonthlyTrendRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    period: formatPeriodLabel(
      pickString(e, ["YearMonth", "yearMonth", "PeriodMonth", "period"], "")
    ),
    createdCount: pickNumber(e, ["createdCount", "CreatedCount", "created", "opened"]),
    closedCount: pickNumber(e, ["closedCount", "ClosedCount", "closed", "completed"]),
  }))

const normalizeJobOrders = (payload: unknown): JobOrderRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    jobOrderNo: pickString(
      e, ["jobOrderNo", "JobOrderNo", "docNo", "referenceNo"], ""
    ),
    customerName: pickString(
      e, ["customerName", "CustomerName", "customer"], "Unknown"
    ),
    vesselName: pickString(
      e, ["vesselName", "VesselName", "vessel", "shipName"], "-"
    ),
    status: pickString(e, ["status", "Status", "jobStatus"], "Open"),
    createdDate: formatOverviewDate(
      pickString(e, ["createdDate", "CreatedDate", "createDate", "trnDate"], "")
    ),
  }))

const normalizeTallyKpi = (payload: unknown): TallyKpi => {
  const d = firstRowOrRecord(payload)
  return {
    totalTallyServices: pickNumber(d, [
      "totalTallyServices",
      "TotalTallyServices",
      "total",
    ]),
    openTallyServices: pickNumber(d, [
      "openTallyServices",
      "OpenTallyServices",
      "open",
    ]),
    completedToday: pickNumber(d, [
      "completedToday",
      "CompletedToday",
      "closedToday",
    ]),
    pendingApproval: pickNumber(d, [
      "pendingApproval",
      "PendingApproval",
      "pending",
    ]),
    createdThisWeek: pickNumber(d, [
      "createdThisWeek",
      "CreatedThisWeek",
      "thisWeek",
    ]),
    invoicedThisMonth: pickNumber(d, [
      "invoicedThisMonth",
      "InvoicedThisMonth",
      "monthInvoiced",
    ]),
  }
}

const normalizeTallyTopCustomers = (payload: unknown): TallyCustomerRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    customerName: pickString(
      e, ["customerName", "CustomerName", "customer", "name"], "Unknown"
    ),
    tallyCount: pickNumber(e, [
      "tallyCount",
      "TallyCount",
      "count",
      "jobOrderCount",
      "total",
    ]),
  }))

const normalizeTallyRows = (payload: unknown): TallyRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    tallyRef: pickString(
      e, ["tallyRef", "TallyRef", "tallyServiceId", "TallyServiceId"], ""
    ),
    customerName: pickString(
      e, ["customerName", "CustomerName", "customer"], "Unknown"
    ),
    vesselName: pickString(
      e, ["vesselName", "VesselName", "vessel", "shipName"], "-"
    ),
    status: pickString(e, ["status", "Status", "jobStatus"], "Open"),
    serviceDate: formatOverviewDate(
      pickString(e, ["serviceDate", "ServiceDate", "createdDate", "trnDate"], "")
    ),
  }))

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="border-border/60 flex flex-col gap-1 border-b pb-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Icon className="text-primary size-5" />
        {title}
      </h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChecklistOverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["ops-overview-kpi", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.operations.kpi, { companyId }),
    enabled: !!companyId,
  })
  const statusQuery = useQuery({
    queryKey: ["ops-overview-status", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.operations.statusBreakdown, { companyId }),
    enabled: !!companyId,
  })
  const customersQuery = useQuery({
    queryKey: ["ops-overview-customers", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.operations.topCustomers, { companyId }),
    enabled: !!companyId,
  })
  const serviceTypeQuery = useQuery({
    queryKey: ["ops-overview-service-type", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.operations.serviceTypeDistribution, { companyId }),
    enabled: !!companyId,
  })
  const trendQuery = useQuery({
    queryKey: ["ops-overview-trend", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.operations.monthlyTrend, { companyId }),
    enabled: !!companyId,
  })
  const recentQuery = useQuery({
    queryKey: ["ops-overview-recent", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.operations.recentJobOrders, { companyId }),
    enabled: !!companyId,
  })
  const todayQuery = useQuery({
    queryKey: ["ops-overview-today", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.operations.todayJobOrders, { companyId }),
    enabled: !!companyId,
  })

  const tallyKpiQuery = useQuery({
    queryKey: ["ops-overview-tally-kpi", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.operations.tallyKpi, { companyId }),
    enabled: !!companyId,
  })
  const tallyStatusQuery = useQuery({
    queryKey: ["ops-overview-tally-status", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.operations.tallyStatusBreakdown, {
        companyId,
      }),
    enabled: !!companyId,
  })
  const tallyCustomersQuery = useQuery({
    queryKey: ["ops-overview-tally-customers", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.operations.tallyTopCustomers, {
        companyId,
      }),
    enabled: !!companyId,
  })
  const tallyServiceTypeQuery = useQuery({
    queryKey: ["ops-overview-tally-service-type", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.operations.tallyServiceTypeDistribution, {
        companyId,
      }),
    enabled: !!companyId,
  })
  const tallyRecentQuery = useQuery({
    queryKey: ["ops-overview-tally-recent", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.operations.tallyRecent, { companyId }),
    enabled: !!companyId,
  })
  const tallyTodayQuery = useQuery({
    queryKey: ["ops-overview-tally-today", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.operations.tallyToday, { companyId }),
    enabled: !!companyId,
  })

  const kpi = normalizeKpi(kpiQuery.data)
  const statusRows = normalizeStatusBreakdown(statusQuery.data)
  const customerRows = normalizeTopCustomers(customersQuery.data)
  const serviceTypeRows = normalizeServiceTypeDistribution(serviceTypeQuery.data)
  const trendRows = normalizeMonthlyTrend(trendQuery.data)
  const recentRows = normalizeJobOrders(recentQuery.data)
  const todayRows = normalizeJobOrders(todayQuery.data)

  const tallyKpi = normalizeTallyKpi(tallyKpiQuery.data)
  const tallyStatusRows = normalizeStatusBreakdown(tallyStatusQuery.data)
  const tallyCustomerRows = normalizeTallyTopCustomers(tallyCustomersQuery.data)
  const tallyServiceTypeRows = normalizeServiceTypeDistribution(
    tallyServiceTypeQuery.data
  )
  const tallyRecentRows = normalizeTallyRows(tallyRecentQuery.data)
  const tallyTodayRows = normalizeTallyRows(tallyTodayQuery.data)

  const statusChartBase = useMemo(
    () => Math.max(...statusRows.map((r) => r.count), 1),
    [statusRows]
  )
  const customerChartBase = useMemo(
    () => Math.max(...customerRows.map((r) => r.jobOrderCount), 1),
    [customerRows]
  )
  const serviceTypeChartBase = useMemo(
    () => Math.max(...serviceTypeRows.map((r) => r.usageCount), 1),
    [serviceTypeRows]
  )
  const tallyStatusChartBase = useMemo(
    () => Math.max(...tallyStatusRows.map((r) => r.count), 1),
    [tallyStatusRows]
  )
  const tallyCustomerChartBase = useMemo(
    () => Math.max(...tallyCustomerRows.map((r) => r.tallyCount), 1),
    [tallyCustomerRows]
  )
  const tallyServiceTypeChartBase = useMemo(
    () => Math.max(...tallyServiceTypeRows.map((r) => r.usageCount), 1),
    [tallyServiceTypeRows]
  )

  const jobOrderColumns: ColumnDef<JobOrderRow>[] = [
    {
      accessorKey: "jobOrderNo",
      header: "Job Order",
      cell: ({ row }) => row.original.jobOrderNo || "-",
    },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "vesselName", header: "Vessel" },
    { accessorKey: "createdDate", header: "Date" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        const variant =
          s === "Completed" || s === "Closed"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : s === "Pending" || s === "Draft"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              : "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variant}`}
          >
            {s}
          </span>
        )
      },
    },
  ]

  const tallyColumns: ColumnDef<TallyRow>[] = [
    {
      accessorKey: "tallyRef",
      header: "Tally Ref",
      cell: ({ row }) => row.original.tallyRef || "-",
    },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "vesselName", header: "Vessel" },
    { accessorKey: "serviceDate", header: "Service Date" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        const variant =
          s === "Completed" || s === "Closed" || s === "Confirmed"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : s === "Pending" || s === "Draft"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              : "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variant}`}
          >
            {s}
          </span>
        )
      },
    },
  ]

  const hasError =
    kpiQuery.isError ||
    statusQuery.isError ||
    customersQuery.isError ||
    serviceTypeQuery.isError ||
    trendQuery.isError ||
    recentQuery.isError ||
    todayQuery.isError ||
    tallyKpiQuery.isError ||
    tallyStatusQuery.isError ||
    tallyCustomersQuery.isError ||
    tallyServiceTypeQuery.isError ||
    tallyRecentQuery.isError ||
    tallyTodayQuery.isError

  return (
    <OverviewPageShell
      module="operations"
      title="Operations Overview"
      description="Checklist job orders and Tally Services activity — status, customers, service lines, and recent work at a glance."
    >
      {hasError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some operations data failed to load</AlertTitle>
          <AlertDescription>
            The page is showing available data only. Deploy Operations overview
            stored procedures on the database, restart the API, and ensure your
            user has Checklist or Tally Services view rights.
          </AlertDescription>
        </Alert>
      ) : null}

      <SectionHeading
        icon={ClipboardList}
        title="Checklist"
        description="Job order headers — open work, completions, approvals, and invoicing."
      />

      {/* ── Checklist KPI Metrics ── */}
      <OverviewMetricGrid>
        <OverviewMetricCard
          module="operations"
          title="Total job orders"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              formatOverviewCompactNumber(kpi.totalJobOrders)
            )
          }
          subtitle="All job orders created for this company."
          meta={
            <OverviewStatChip module="operations">
              Open {formatOverviewCompactNumber(kpi.openJobOrders)}
            </OverviewStatChip>
          }
          icon={ClipboardList}
        />
        <OverviewMetricCard
          module="operations"
          title="Open job orders"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatOverviewCompactNumber(kpi.openJobOrders)
            )
          }
          subtitle="Active job orders currently in progress."
          meta={
            <OverviewStatChip module="operations">
              This week {formatOverviewCompactNumber(kpi.createdThisWeek)}
            </OverviewStatChip>
          }
          icon={FileText}
          tone={kpi.openJobOrders > 0 ? "warning" : "positive"}
        />
        <OverviewMetricCard
          module="operations"
          title="Completed today"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatOverviewCompactNumber(kpi.completedToday)
            )
          }
          subtitle="Job orders closed or completed as of today."
          meta={
            <OverviewStatChip module="operations">
              Invoiced {formatOverviewCompactNumber(kpi.invoicedThisMonth)}
            </OverviewStatChip>
          }
          icon={CheckCircle2}
          tone={kpi.completedToday > 0 ? "positive" : "neutral"}
        />
        <OverviewMetricCard
          module="operations"
          title="Pending approval"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatOverviewCompactNumber(kpi.pendingApproval)
            )
          }
          subtitle="Job orders awaiting supervisor or customer approval."
          meta={
            <OverviewStatChip module="operations">
              Statuses {formatOverviewCompactNumber(statusRows.length)}
            </OverviewStatChip>
          }
          icon={ClipboardCheck}
          tone={kpi.pendingApproval > 0 ? "warning" : "positive"}
        />
        <OverviewMetricCard
          module="operations"
          title="Created this week"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatOverviewCompactNumber(kpi.createdThisWeek)
            )
          }
          subtitle="New job orders raised in the current week."
          meta={
            <OverviewStatChip module="operations">
              Customers {formatOverviewCompactNumber(customerRows.length)}
            </OverviewStatChip>
          }
          icon={TrendingUp}
        />
        <OverviewMetricCard
          module="operations"
          title="Invoiced this month"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatOverviewCompactNumber(kpi.invoicedThisMonth)
            )
          }
          subtitle="Job orders that have had invoices generated this month."
          meta={
            <OverviewStatChip module="operations">
              Services {formatOverviewCompactNumber(serviceTypeRows.length)}
            </OverviewStatChip>
          }
          icon={Layers}
          tone="positive"
        />
      </OverviewMetricGrid>

      {/* ── Status & Customers ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="operations"
          title="Job order status breakdown"
          description="Count of job orders per current workflow status."
          icon={ClipboardCheck}
        >
          <OverviewBarList
            module="operations"
            items={statusRows.map((row, idx) => ({
              key: `status-${idx}`,
              label: row.statusName,
              value: String(row.count),
              progress: (row.count / statusChartBase) * 100,
              tone:
                row.statusName === "Completed" || row.statusName === "Closed"
                  ? ("positive" as const)
                  : row.statusName === "Pending" || row.statusName === "Draft"
                    ? ("warning" as const)
                    : undefined,
            }))}
            emptyMessage={
              statusQuery.isPending
                ? "Loading status breakdown..."
                : "No status data found."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="operations"
          title="Top customers"
          description="Customers with the highest number of job orders."
          icon={Users}
        >
          <OverviewBarList
            module="operations"
            items={customerRows.slice(0, 10).map((row, idx) => ({
              key: `customer-${idx}`,
              label: row.customerName,
              value: String(row.jobOrderCount),
              progress: (row.jobOrderCount / customerChartBase) * 100,
            }))}
            emptyMessage={
              customersQuery.isPending
                ? "Loading customer data..."
                : "No customer data found."
            }
          />
        </OverviewSectionCard>
      </div>

      {/* ── Service Type Distribution ── */}
      <OverviewSectionCard
        module="operations"
        title="Service type distribution"
        description="Frequency of each service type (port expenses, launch service, crew sign-on, etc.) across all job orders."
        icon={Layers}
      >
        <OverviewBarList
          module="operations"
          items={serviceTypeRows.map((row, idx) => ({
            key: `svc-${idx}`,
            label: row.serviceTypeName,
            value: String(row.usageCount),
            progress: (row.usageCount / serviceTypeChartBase) * 100,
          }))}
          emptyMessage={
            serviceTypeQuery.isPending
              ? "Loading service types..."
              : "No service type data found."
          }
        />
      </OverviewSectionCard>

      {/* ── Monthly Trend ── */}
      <OverviewSectionCard
        module="operations"
        title="Monthly trend: created vs closed"
        description="Month-on-month comparison of new job orders opened against job orders completed."
        icon={TrendingUp}
      >
        {trendRows.length > 0 ? (
          (() => {
            const maxCount = Math.max(
              ...trendRows.flatMap((r) => [r.createdCount, r.closedCount]),
              1
            )
            const totalCreated = trendRows.reduce((s, r) => s + r.createdCount, 0)
            const totalClosed = trendRows.reduce((s, r) => s + r.closedCount, 0)
            return (
              <>
                <div className="flex flex-wrap gap-2">
                  <OverviewStatChip module="operations">
                    Created {formatOverviewCompactNumber(totalCreated)}
                  </OverviewStatChip>
                  <OverviewStatChip module="operations">
                    Closed {formatOverviewCompactNumber(totalClosed)}
                  </OverviewStatChip>
                </div>
                <div className="space-y-2">
                  {trendRows.slice(0, 6).map((row, idx) => {
                    const createdPct = (row.createdCount / maxCount) * 100
                    const closedPct = (row.closedCount / maxCount) * 100
                    const balance = row.closedCount - row.createdCount
                    return (
                      <div key={row.period || idx} className="space-y-1">
                        <div className="flex justify-between gap-3 text-xs">
                          <span>{row.period}</span>
                          <span
                            className={
                              balance >= 0
                                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                : "font-semibold text-destructive"
                            }
                          >
                            {balance >= 0 ? "+" : ""}
                            {balance} closed
                          </span>
                        </div>
                        <div className="bg-muted h-1.5 rounded-full">
                          <div
                            className="h-1.5 rounded-full bg-teal-500"
                            style={{ width: `${Math.max(createdPct, 1)}%` }}
                          />
                        </div>
                        <div className="bg-muted h-1.5 rounded-full">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500"
                            style={{ width: `${Math.max(closedPct, 1)}%` }}
                          />
                        </div>
                        <div className="text-muted-foreground flex justify-between text-xs">
                          <span>Created {row.createdCount}</span>
                          <span>Closed {row.closedCount}</span>
                        </div>
                      </div>
                    )
                  })}
                  <div className="text-muted-foreground mt-1 flex gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
                      Created
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      Closed
                    </span>
                  </div>
                </div>
              </>
            )
          })()
        ) : (
          <p className="text-muted-foreground text-sm">
            {trendQuery.isPending
              ? "Loading monthly trend..."
              : "No trend data found."}
          </p>
        )}
      </OverviewSectionCard>

      {/* ── Job Order Tables ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="operations"
          title="Recent job orders"
          description="Latest job orders across all statuses."
          icon={BarChart3}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={recentRows}
            columns={jobOrderColumns}
            emptyMessage={
              recentQuery.isPending
                ? "Loading recent job orders..."
                : "No recent job orders found."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="operations"
          title="Today's job orders"
          description="Job orders created or updated today."
          icon={Clock3}
          contentClassName="pt-0"
        >
          <OverviewDataTable
            data={todayRows}
            columns={jobOrderColumns}
            emptyMessage={
              todayQuery.isPending
                ? "Loading today's job orders..."
                : "No job orders found for today."
            }
          />
        </OverviewSectionCard>
      </div>

      <div className="mt-6 space-y-4">
        <SectionHeading
          icon={Ship}
          title="Tally Services"
          description="Tally service records — freshwater and launch lines, status, and billing progress."
        />

        <OverviewMetricGrid>
          <OverviewMetricCard
            module="operations"
            title="Total tally services"
            value={
              tallyKpiQuery.isPending ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatOverviewCompactNumber(tallyKpi.totalTallyServices)
              )
            }
            subtitle="All tally service records for this company."
            meta={
              <OverviewStatChip module="operations">
                Open {formatOverviewCompactNumber(tallyKpi.openTallyServices)}
              </OverviewStatChip>
            }
            icon={Ship}
          />
          <OverviewMetricCard
            module="operations"
            title="Open tally services"
            value={
              tallyKpiQuery.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                formatOverviewCompactNumber(tallyKpi.openTallyServices)
              )
            }
            subtitle="Tally records not yet closed."
            meta={
              <OverviewStatChip module="operations">
                This week {formatOverviewCompactNumber(tallyKpi.createdThisWeek)}
              </OverviewStatChip>
            }
            icon={FileText}
            tone={tallyKpi.openTallyServices > 0 ? "warning" : "positive"}
          />
          <OverviewMetricCard
            module="operations"
            title="Completed today"
            value={
              tallyKpiQuery.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                formatOverviewCompactNumber(tallyKpi.completedToday)
              )
            }
            subtitle="Tally services closed as of today."
            meta={
              <OverviewStatChip module="operations">
                Invoiced {formatOverviewCompactNumber(tallyKpi.invoicedThisMonth)}
              </OverviewStatChip>
            }
            icon={CheckCircle2}
            tone={tallyKpi.completedToday > 0 ? "positive" : "neutral"}
          />
          <OverviewMetricCard
            module="operations"
            title="Pending approval"
            value={
              tallyKpiQuery.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                formatOverviewCompactNumber(tallyKpi.pendingApproval)
              )
            }
            subtitle="Posted tally services awaiting close."
            meta={
              <OverviewStatChip module="operations">
                Statuses {formatOverviewCompactNumber(tallyStatusRows.length)}
              </OverviewStatChip>
            }
            icon={ClipboardCheck}
            tone={tallyKpi.pendingApproval > 0 ? "warning" : "positive"}
          />
          <OverviewMetricCard
            module="operations"
            title="Created this week"
            value={
              tallyKpiQuery.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                formatOverviewCompactNumber(tallyKpi.createdThisWeek)
              )
            }
            subtitle="New tally services in the current week."
            meta={
              <OverviewStatChip module="operations">
                Customers {formatOverviewCompactNumber(tallyCustomerRows.length)}
              </OverviewStatChip>
            }
            icon={TrendingUp}
          />
          <OverviewMetricCard
            module="operations"
            title="Invoiced this month"
            value={
              tallyKpiQuery.isPending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                formatOverviewCompactNumber(tallyKpi.invoicedThisMonth)
              )
            }
            subtitle="Tally services with invoices generated this month."
            meta={
              <OverviewStatChip module="operations">
                Line types {formatOverviewCompactNumber(tallyServiceTypeRows.length)}
              </OverviewStatChip>
            }
            icon={Layers}
            tone="positive"
          />
        </OverviewMetricGrid>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <OverviewSectionCard
            module="operations"
            title="Tally status breakdown"
            description="Count of tally services per workflow status."
            icon={ClipboardCheck}
          >
            <OverviewBarList
              module="operations"
              items={tallyStatusRows.map((row, idx) => ({
                key: `tally-status-${idx}`,
                label: row.statusName,
                value: String(row.count),
                progress: (row.count / tallyStatusChartBase) * 100,
              }))}
              emptyMessage={
                tallyStatusQuery.isPending
                  ? "Loading tally status..."
                  : "No tally status data found."
              }
            />
          </OverviewSectionCard>

          <OverviewSectionCard
            module="operations"
            title="Top tally customers"
            description="Customers with the most tally service records."
            icon={Users}
          >
            <OverviewBarList
              module="operations"
              items={tallyCustomerRows.slice(0, 10).map((row, idx) => ({
                key: `tally-customer-${idx}`,
                label: row.customerName,
                value: String(row.tallyCount),
                progress: (row.tallyCount / tallyCustomerChartBase) * 100,
              }))}
              emptyMessage={
                tallyCustomersQuery.isPending
                  ? "Loading tally customers..."
                  : "No tally customer data found."
              }
            />
          </OverviewSectionCard>
        </div>

        <OverviewSectionCard
          module="operations"
          title="Tally line type distribution"
          description="Fresh water vs launch service usage across tally records."
          icon={Layers}
        >
          <OverviewBarList
            module="operations"
            items={tallyServiceTypeRows.map((row, idx) => ({
              key: `tally-svc-${idx}`,
              label: row.serviceTypeName,
              value: String(row.usageCount),
              progress: (row.usageCount / tallyServiceTypeChartBase) * 100,
            }))}
            emptyMessage={
              tallyServiceTypeQuery.isPending
                ? "Loading tally line types..."
                : "No tally line data found."
            }
          />
        </OverviewSectionCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <OverviewSectionCard
            module="operations"
            title="Recent tally services"
            description="Latest tally service records."
            icon={BarChart3}
            contentClassName="pt-0"
          >
            <OverviewDataTable
              data={tallyRecentRows}
              columns={tallyColumns}
              emptyMessage={
                tallyRecentQuery.isPending
                  ? "Loading recent tally services..."
                  : "No recent tally services found."
              }
            />
          </OverviewSectionCard>

          <OverviewSectionCard
            module="operations"
            title="Today's tally services"
            description="Tally services dated today."
            icon={Clock3}
            contentClassName="pt-0"
          >
            <OverviewDataTable
              data={tallyTodayRows}
              columns={tallyColumns}
              emptyMessage={
                tallyTodayQuery.isPending
                  ? "Loading today's tally services..."
                  : "No tally services found for today."
              }
            />
          </OverviewSectionCard>
        </div>
      </div>
    </OverviewPageShell>
  )
}
