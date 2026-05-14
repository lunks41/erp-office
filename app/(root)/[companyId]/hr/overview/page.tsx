"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarX,
  HandCoins,
  TrendingUp,
  UserCheck,
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
const isRecord = (v: unknown): v is AnyRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const asRecord = (v: unknown): AnyRecord => (isRecord(v) ? v : {})

const asArray = <T,>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[]
  if (isRecord(v)) {
    for (const candidate of [
      v.items,
      v.rows,
      v.results,
      v.list,
      v.data,
      v.Data,
    ]) {
      if (Array.isArray(candidate)) return candidate as T[]
    }
  }
  return []
}

const unwrapData = (payload: unknown): unknown => {
  if (!isRecord(payload)) return payload
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

const formatDate = (v: unknown): string => {
  const raw = asString(v)
  if (!raw) return "-"
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-GB")
}

const formatPeriodLabel = (v: unknown): string => {
  const raw = asString(v)
  if (!raw) return "—"
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type HrKpi = {
  totalActiveEmployees: number
  onLeaveToday: number
  pendingLeaveRequests: number
  currentPayrollTotal: number
  loanOutstanding: number
  attendanceRatePct: number
}

type HrDeptRow = { departmentName: string; employeeCount: number }
type HrDesignationRow = { designationName: string; employeeCount: number }
type HrLeaveRow = { leaveTypeName: string; pendingCount: number; approvedCount: number }
type HrPayrollRow = { period: string; payrollAmount: number; budgetAmount: number }
type HrPayrunRow = {
  payrunNo: string
  periodLabel: string
  employeeCount: number
  netPay: number
  status: string
  paymentDate: string
}
type HrLoanRow = { employeeName: string; loanBalance: number; loanType: string }
type HrAttendanceRow = { period: string; presentCount: number; absentCount: number; leaveCount: number }

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeKpi = (payload: unknown): HrKpi => {
  const d = firstRowOrRecord(payload)
  return {
    totalActiveEmployees: pickNumber(d, [
      "totalActiveEmployees",
      "activeEmployees",
      "employeeCount",
      "TotalActiveEmployees",
    ]),
    onLeaveToday: pickNumber(d, [
      "onLeaveToday",
      "onLeave",
      "OnLeaveToday",
      "leavesToday",
    ]),
    pendingLeaveRequests: pickNumber(d, [
      "pendingLeaveRequests",
      "pendingLeaves",
      "PendingLeaveRequests",
    ]),
    currentPayrollTotal: pickNumber(d, [
      "currentPayrollTotal",
      "payrollTotal",
      "CurrentPayrollTotal",
      "netPay",
    ]),
    loanOutstanding: pickNumber(d, [
      "loanOutstanding",
      "LoanOutstanding",
      "totalLoanBalance",
    ]),
    attendanceRatePct: pickNumber(d, [
      "attendanceRatePct",
      "attendanceRate",
      "AttendanceRatePct",
      "presentPct",
    ]),
  }
}

const normalizeDepartmentBreakdown = (payload: unknown): HrDeptRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    departmentName: pickString(
      e,
      ["departmentName", "department", "DepartmentName", "dept"],
      "Unknown"
    ),
    employeeCount: pickNumber(e, [
      "employeeCount",
      "count",
      "EmployeeCount",
      "total",
    ]),
  }))

const normalizeDesignationDistribution = (payload: unknown): HrDesignationRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    designationName: pickString(
      e,
      ["designationName", "designation", "DesignationName", "title"],
      "Unknown"
    ),
    employeeCount: pickNumber(e, [
      "employeeCount",
      "count",
      "EmployeeCount",
      "total",
    ]),
  }))

const normalizeLeaveSummary = (payload: unknown): HrLeaveRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    leaveTypeName: pickString(
      e,
      ["leaveTypeName", "leaveType", "LeaveTypeName", "type"],
      "Unknown"
    ),
    pendingCount: pickNumber(e, ["pendingCount", "pending", "PendingCount"]),
    approvedCount: pickNumber(e, [
      "approvedCount",
      "approved",
      "ApprovedCount",
    ]),
  }))

const normalizePayrollVsBudget = (payload: unknown): HrPayrollRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    period: formatPeriodLabel(
      pickString(e, ["YearMonth", "yearMonth", "PeriodMonth", "period"], "")
    ),
    payrollAmount: pickNumber(e, [
      "payrollAmount",
      "PayrollAmount",
      "netPay",
      "totalPay",
    ]),
    budgetAmount: pickNumber(e, [
      "budgetAmount",
      "BudgetAmount",
      "budget",
      "targetAmount",
    ]),
  }))

const normalizePayrunHistory = (payload: unknown): HrPayrunRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    payrunNo: pickString(e, ["payrunNo", "PayrunNo", "runNo", "referenceNo"], ""),
    periodLabel: formatPeriodLabel(
      pickString(e, ["periodMonth", "PeriodMonth", "yearMonth", "period"], "")
    ),
    employeeCount: pickNumber(e, [
      "employeeCount",
      "EmployeeCount",
      "noOfEmployees",
    ]),
    netPay: pickNumber(e, ["netPay", "NetPay", "totalNetPay", "totalAmount"]),
    status: pickString(e, ["status", "Status", "payrunStatus"], "Unknown"),
    paymentDate: formatDate(
      pickString(e, ["paymentDate", "PaymentDate", "paidOn"], "")
    ),
  }))

const normalizeLoanSummary = (payload: unknown): HrLoanRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    employeeName: pickString(
      e,
      ["employeeName", "EmployeeName", "employee", "name"],
      "Unknown"
    ),
    loanBalance: pickNumber(e, [
      "loanBalance",
      "LoanBalance",
      "outstanding",
      "balance",
    ]),
    loanType: pickString(e, ["loanType", "LoanType", "type"], ""),
  }))

const normalizeAttendanceSummary = (payload: unknown): HrAttendanceRow[] =>
  asArray<AnyRecord>(unwrapData(payload)).map((e) => ({
    period: formatPeriodLabel(
      pickString(e, ["YearMonth", "yearMonth", "PeriodMonth", "period"], "")
    ),
    presentCount: pickNumber(e, [
      "presentCount",
      "PresentCount",
      "present",
      "presentDays",
    ]),
    absentCount: pickNumber(e, [
      "absentCount",
      "AbsentCount",
      "absent",
      "absentDays",
    ]),
    leaveCount: pickNumber(e, [
      "leaveCount",
      "LeaveCount",
      "onLeave",
      "leaveDays",
    ]),
  }))

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HROverviewPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")

  const kpiQuery = useQuery({
    queryKey: ["hr-overview-kpi", companyId],
    queryFn: () => getData(OverviewDashboardRoutes.hr.kpi, { companyId }),
    enabled: !!companyId,
  })
  const deptQuery = useQuery({
    queryKey: ["hr-overview-dept", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.hr.departmentBreakdown, { companyId }),
    enabled: !!companyId,
  })
  const designationQuery = useQuery({
    queryKey: ["hr-overview-designation", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.hr.designationDistribution, { companyId }),
    enabled: !!companyId,
  })
  const leaveQuery = useQuery({
    queryKey: ["hr-overview-leave", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.hr.leaveSummary, { companyId }),
    enabled: !!companyId,
  })
  const payrollQuery = useQuery({
    queryKey: ["hr-overview-payroll", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.hr.payrollVsBudget, { companyId }),
    enabled: !!companyId,
  })
  const payrunQuery = useQuery({
    queryKey: ["hr-overview-payrun", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.hr.payrunHistory, { companyId }),
    enabled: !!companyId,
  })
  const loanQuery = useQuery({
    queryKey: ["hr-overview-loan", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.hr.loanSummary, { companyId }),
    enabled: !!companyId,
  })
  const attendanceQuery = useQuery({
    queryKey: ["hr-overview-attendance", companyId],
    queryFn: () =>
      getData(OverviewDashboardRoutes.hr.attendanceSummary, { companyId }),
    enabled: !!companyId,
  })

  const kpi = normalizeKpi(kpiQuery.data)
  const deptRows = normalizeDepartmentBreakdown(deptQuery.data)
  const designationRows = normalizeDesignationDistribution(designationQuery.data)
  const leaveRows = normalizeLeaveSummary(leaveQuery.data)
  const payrollRows = normalizePayrollVsBudget(payrollQuery.data)
  const payrunRows = normalizePayrunHistory(payrunQuery.data)
  const loanRows = normalizeLoanSummary(loanQuery.data)
  const attendanceRows = normalizeAttendanceSummary(attendanceQuery.data)

  const formatMoney = (v: number) =>
    `AED ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v)}`

  const deptChartBase = useMemo(
    () => Math.max(...deptRows.map((r) => r.employeeCount), 1),
    [deptRows]
  )

  const designationChartBase = useMemo(
    () => Math.max(...designationRows.map((r) => r.employeeCount), 1),
    [designationRows]
  )

  const loanChartBase = useMemo(
    () => Math.max(...loanRows.map((r) => r.loanBalance), 1),
    [loanRows]
  )

  const payrunColumns: ColumnDef<HrPayrunRow>[] = [
    {
      accessorKey: "payrunNo",
      header: "Payrun",
      cell: ({ row }) => row.original.payrunNo || "-",
    },
    { accessorKey: "periodLabel", header: "Period" },
    {
      accessorKey: "employeeCount",
      header: "Employees",
      cell: ({ row }) => formatOverviewCompactNumber(row.original.employeeCount),
    },
    {
      accessorKey: "netPay",
      header: "Net Pay",
      cell: ({ row }) => formatMoney(row.original.netPay),
    },
    {
      accessorKey: "paymentDate",
      header: "Paid On",
      cell: ({ row }) => row.original.paymentDate || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.status}</Badge>
      ),
    },
  ]

  const hasError =
    kpiQuery.isError ||
    deptQuery.isError ||
    designationQuery.isError ||
    leaveQuery.isError ||
    payrollQuery.isError ||
    payrunQuery.isError ||
    loanQuery.isError ||
    attendanceQuery.isError

  return (
    <OverviewPageShell
      module="hr"
      title="Human Resources Overview"
      description="Workforce health, payroll performance, leave activity, and employee loan snapshot at a glance."
    >
      {hasError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Some HR data failed to load</AlertTitle>
          <AlertDescription>
            The page is showing available data only. Please refresh or check API
            availability.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* ── KPI Metrics ── */}
      <OverviewMetricGrid>
        <OverviewMetricCard
          module="hr"
          title="Active employees"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              formatOverviewCompactNumber(kpi.totalActiveEmployees)
            )
          }
          subtitle="Total employees currently active in the organisation."
          meta={
            <OverviewStatChip module="hr">
              On leave {formatOverviewCompactNumber(kpi.onLeaveToday)}
            </OverviewStatChip>
          }
          icon={Users}
        />
        <OverviewMetricCard
          module="hr"
          title="On leave today"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatOverviewCompactNumber(kpi.onLeaveToday)
            )
          }
          subtitle="Employees on approved leave as of today."
          meta={
            <OverviewStatChip module="hr">
              Pending {formatOverviewCompactNumber(kpi.pendingLeaveRequests)}
            </OverviewStatChip>
          }
          icon={CalendarX}
          tone={kpi.onLeaveToday > 0 ? "warning" : "positive"}
        />
        <OverviewMetricCard
          module="hr"
          title="Pending leave requests"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              formatOverviewCompactNumber(kpi.pendingLeaveRequests)
            )
          }
          subtitle="Leave applications awaiting manager approval."
          meta={
            <OverviewStatChip module="hr">
              Types {formatOverviewCompactNumber(leaveRows.length)}
            </OverviewStatChip>
          }
          icon={CalendarCheck}
          tone={kpi.pendingLeaveRequests > 0 ? "warning" : "positive"}
        />
        <OverviewMetricCard
          module="hr"
          title="Current payroll"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatMoney(kpi.currentPayrollTotal)
            )
          }
          subtitle="Total net payroll for the latest processed payrun."
          meta={
            <OverviewStatChip module="hr">
              Payruns {formatOverviewCompactNumber(payrunRows.length)}
            </OverviewStatChip>
          }
          icon={Wallet}
        />
        <OverviewMetricCard
          module="hr"
          title="Loan outstanding"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatMoney(kpi.loanOutstanding)
            )
          }
          subtitle="Total active employee loan balances yet to be repaid."
          meta={
            <OverviewStatChip module="hr">
              Active loans {formatOverviewCompactNumber(loanRows.length)}
            </OverviewStatChip>
          }
          icon={HandCoins}
          tone={kpi.loanOutstanding > 0 ? "warning" : "positive"}
        />
        <OverviewMetricCard
          module="hr"
          title="Attendance rate"
          value={
            kpiQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              `${kpi.attendanceRatePct.toFixed(1)}%`
            )
          }
          subtitle="Present-day attendance as a percentage of active headcount."
          meta={
            <OverviewStatChip module="hr">
              Months {formatOverviewCompactNumber(attendanceRows.length)}
            </OverviewStatChip>
          }
          icon={UserCheck}
          tone={
            kpi.attendanceRatePct >= 90
              ? "positive"
              : kpi.attendanceRatePct >= 75
                ? "warning"
                : "danger"
          }
        />
      </OverviewMetricGrid>

      {/* ── Department & Designation ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="hr"
          title="Department breakdown"
          description="Number of active employees per department."
          icon={Briefcase}
        >
          <OverviewBarList
            module="hr"
            items={deptRows.map((row, idx) => ({
              key: `dept-${idx}`,
              label: row.departmentName,
              value: String(row.employeeCount),
              progress: (row.employeeCount / deptChartBase) * 100,
            }))}
            emptyMessage={
              deptQuery.isPending
                ? "Loading department data..."
                : "No department data found."
            }
          />
        </OverviewSectionCard>

        <OverviewSectionCard
          module="hr"
          title="Designation distribution"
          description="Employee headcount by job designation or role."
          icon={BookOpen}
        >
          <OverviewBarList
            module="hr"
            items={designationRows.map((row, idx) => ({
              key: `desig-${idx}`,
              label: row.designationName,
              value: String(row.employeeCount),
              progress: (row.employeeCount / designationChartBase) * 100,
            }))}
            emptyMessage={
              designationQuery.isPending
                ? "Loading designation data..."
                : "No designation data found."
            }
          />
        </OverviewSectionCard>
      </div>

      {/* ── Leave Summary ── */}
      <OverviewSectionCard
        module="hr"
        title="Leave summary"
        description="Pending and approved leave requests grouped by leave type."
        icon={CalendarCheck}
      >
        {leaveRows.length > 0 ? (
          <div className="space-y-3">
            {leaveRows.slice(0, 8).map((row, idx) => {
              const total = row.pendingCount + row.approvedCount
              const maxTotal = Math.max(
                ...leaveRows.map((r) => r.pendingCount + r.approvedCount),
                1
              )
              const pct = (total / maxTotal) * 100
              return (
                <div key={`leave-${idx}`} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{row.leaveTypeName}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {row.approvedCount} approved · {row.pendingCount} pending
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-[width]"
                      style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {leaveQuery.isPending
              ? "Loading leave summary..."
              : "No leave data found."}
          </p>
        )}
      </OverviewSectionCard>

      {/* ── Payroll vs Budget & Attendance ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <OverviewSectionCard
          module="hr"
          title="Payroll vs budget"
          description="Monthly payroll cost compared to the approved budget."
          icon={TrendingUp}
        >
          {payrollRows.length > 0 ? (
            (() => {
              const maxAmt = Math.max(
                ...payrollRows.flatMap((r) => [r.payrollAmount, r.budgetAmount]),
                1
              )
              const totalPayroll = payrollRows.reduce(
                (sum, r) => sum + r.payrollAmount,
                0
              )
              const totalBudget = payrollRows.reduce(
                (sum, r) => sum + r.budgetAmount,
                0
              )
              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    <OverviewStatChip module="hr">
                      Payroll {formatMoney(totalPayroll)}
                    </OverviewStatChip>
                    <OverviewStatChip module="hr">
                      Budget {formatMoney(totalBudget)}
                    </OverviewStatChip>
                  </div>
                  <div className="space-y-2">
                    {payrollRows.slice(0, 6).map((row, idx) => {
                      const payPct = (row.payrollAmount / maxAmt) * 100
                      const budgetPct = (row.budgetAmount / maxAmt) * 100
                      const variance = row.payrollAmount - row.budgetAmount
                      return (
                        <div key={row.period || idx} className="space-y-1">
                          <div className="flex justify-between gap-3 text-xs">
                            <span>{row.period}</span>
                            <span
                              className={
                                variance <= 0
                                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                  : "font-semibold text-destructive"
                              }
                            >
                              {variance > 0 ? "+" : ""}
                              {formatMoney(variance)}
                            </span>
                          </div>
                          <div className="bg-muted h-1.5 rounded-full">
                            <div
                              className="h-1.5 rounded-full bg-rose-500"
                              style={{ width: `${Math.max(payPct, 1)}%` }}
                            />
                          </div>
                          <div className="bg-muted h-1.5 rounded-full">
                            <div
                              className="h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
                              style={{ width: `${Math.max(budgetPct, 1)}%` }}
                            />
                          </div>
                          <div className="text-muted-foreground flex justify-between text-xs">
                            <span>Payroll {formatMoney(row.payrollAmount)}</span>
                            <span>Budget {formatMoney(row.budgetAmount)}</span>
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
              {payrollQuery.isPending
                ? "Loading payroll data..."
                : "No payroll vs budget data."}
            </p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          module="hr"
          title="Attendance summary"
          description="Monthly present, absent, and on-leave counts for active employees."
          icon={UserCheck}
        >
          {attendanceRows.length > 0 ? (
            (() => {
              const maxCount = Math.max(
                ...attendanceRows.flatMap((r) => [
                  r.presentCount,
                  r.absentCount,
                  r.leaveCount,
                ]),
                1
              )
              return (
                <div className="space-y-2">
                  {attendanceRows.slice(0, 6).map((row, idx) => {
                    const presentPct = (row.presentCount / maxCount) * 100
                    const absentPct = (row.absentCount / maxCount) * 100
                    const leavePct = (row.leaveCount / maxCount) * 100
                    return (
                      <div key={row.period || idx} className="space-y-1">
                        <div className="flex justify-between gap-3 text-xs">
                          <span>{row.period}</span>
                          <span className="text-muted-foreground shrink-0">
                            {row.presentCount}P · {row.absentCount}A ·{" "}
                            {row.leaveCount}L
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          <div
                            className="bg-emerald-500 h-2 rounded-l-full"
                            style={{ width: `${Math.max(presentPct, presentPct > 0 ? 2 : 0)}%` }}
                          />
                          <div
                            className="bg-destructive h-2"
                            style={{ width: `${Math.max(absentPct, absentPct > 0 ? 2 : 0)}%` }}
                          />
                          <div
                            className="bg-amber-500 h-2 rounded-r-full"
                            style={{ width: `${Math.max(leavePct, leavePct > 0 ? 2 : 0)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  <div className="text-muted-foreground mt-1 flex gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      Present
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="bg-destructive inline-block h-2 w-2 rounded-full" />
                      Absent
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                      On Leave
                    </span>
                  </div>
                </div>
              )
            })()
          ) : (
            <p className="text-muted-foreground text-sm">
              {attendanceQuery.isPending
                ? "Loading attendance data..."
                : "No attendance data found."}
            </p>
          )}
        </OverviewSectionCard>
      </div>

      {/* ── Loan Summary ── */}
      <OverviewSectionCard
        module="hr"
        title="Active employee loans"
        description="Outstanding loan balances per employee. Sorted by highest balance."
        icon={HandCoins}
      >
        <OverviewBarList
          module="hr"
          items={loanRows.slice(0, 10).map((row, idx) => ({
            key: `loan-${idx}`,
            label: row.employeeName,
            value: formatMoney(row.loanBalance),
            hint: row.loanType || undefined,
            progress: (row.loanBalance / loanChartBase) * 100,
            tone: row.loanBalance > 0 ? ("warning" as const) : undefined,
          }))}
          emptyMessage={
            loanQuery.isPending
              ? "Loading loan data..."
              : "No active employee loans found."
          }
        />
      </OverviewSectionCard>

      {/* ── Payrun History Table ── */}
      <OverviewSectionCard
        module="hr"
        title="Payrun history"
        description="Recent payroll run records with employee count, net pay, and status."
        icon={BarChart3}
        contentClassName="pt-0"
      >
        <OverviewDataTable
          data={payrunRows}
          columns={payrunColumns}
          emptyMessage={
            payrunQuery.isPending
              ? "Loading payrun history..."
              : "No payrun records found."
          }
        />
      </OverviewSectionCard>
    </OverviewPageShell>
  )
}
