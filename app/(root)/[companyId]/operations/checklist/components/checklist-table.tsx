"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { IJobOrderHd } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { OperationsStatus } from "@/lib/operations-utils"
import { formatDateForDisplay, parseDate } from "@/lib/date-utils"
import {
  getChecklistJobDisplayStatus,
  isChecklistPostedJob,
} from "@/helpers/project"
import { CHECKLIST_LIST_TABLE_MAX_HEIGHT } from "@/lib/checklist-table-layout"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { JobTable } from "@/components/table/table-job"
import { TableCellLink } from "@/components/ui/table-cell-link"

const TASK_PILL_DEFS: Array<{ label: string; key: keyof IJobOrderHd }> = [
  { label: "Port Expenses", key: "portExpensesCount" },
  { label: "Launch Service", key: "launchServiceCount" },
  { label: "Equipment Used", key: "equipmentUsedCount" },
  { label: "Crew SignOn", key: "crewSignOnCount" },
  { label: "Crew SignOff", key: "crewSignOffCount" },
  { label: "Crew Miscellaneous", key: "crewMiscellaneousCount" },
  { label: "Medical Assistance", key: "medicalAssistanceCount" },
  { label: "Consignment Import", key: "consignmentImportCount" },
  { label: "Consignment Export", key: "consignmentExportCount" },
  { label: "Third Party", key: "thirdPartyCount" },
  { label: "Fresh Water", key: "freshWaterCount" },
  { label: "Technician Surveyor", key: "technicianSurveyorCount" },
  { label: "Landing Items", key: "landingItemsCount" },
  { label: "Other Service", key: "otherServiceCount" },
  { label: "Agency Remuneration", key: "agencyRemunerationCount" },
]

function TaskCountHoverCell({ row }: { row: IJobOrderHd }) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const total = row.totalTaskCount ?? 0

  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setOpen(false), 120)
  }

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => {
            cancelClose()
            setOpen(true)
          }}
          onMouseLeave={scheduleClose}
          onFocus={() => setOpen(true)}
          onBlur={scheduleClose}
          className="focus-visible:ring-ring inline-flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`Show task breakdown (${total})`}
        >
          <Badge
            variant={total > 0 ? "default" : "secondary"}
            className={`px-2 py-0.5 text-xs font-semibold ${
              total > 0
                ? "bg-primary/10 text-primary hover:bg-primary/15"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {total}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        className="w-80 p-3"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Task Breakdown</span>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs">
            Total {total}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {TASK_PILL_DEFS.map((def) => {
            const count = (row[def.key] as number | undefined) ?? 0
            const hasData = count > 0
            return (
              <div
                key={def.key as string}
                className={`flex items-center justify-between rounded-md border px-2 py-1 text-xs ${
                  hasData
                    ? "border-primary/30 bg-primary/5"
                    : "border-transparent bg-muted/40 text-muted-foreground"
                }`}
              >
                <span className="truncate" title={def.label}>
                  {def.label}
                </span>
                <Badge
                  variant={hasData ? "default" : "secondary"}
                  className={`ml-2 h-5 min-w-[1.5rem] justify-center px-1.5 text-[10px] font-semibold ${
                    hasData
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </Badge>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ChecklistTableProps {
  data: IJobOrderHd[]
  isLoading?: boolean
  selectedStatus?: string
  moduleId?: number
  transactionId?: number
  onCreateAction?: () => void
  onRefreshAction?: () => void
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
}

export function ChecklistTable({
  data,
  isLoading = false,
  selectedStatus = "All",
  moduleId,
  transactionId,
  onCreateAction,
  onRefreshAction,
  canView: _canView = true,
  canEdit: _canEdit = true,
  canDelete: _canDelete = true,
  canCreate = true,
}: ChecklistTableProps) {
  const params = useParams()
  const companyId = params.companyId as string
  const { decimals } = useCompanyStore()
  const dateFormat = decimals[0]?.dateFormat || "dd-MMM-yyyy"
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Filter data based on selected status
  const filteredData = useMemo(() => {
    if (selectedStatus === "All") {
      return data
    }

    return data.filter((job: IJobOrderHd) => {
      switch (selectedStatus) {
        case "Pending":
          return (
            job.jobStatusName === OperationsStatus.Pending.toString() &&
            job.isActive === true
          )
        case "Completed":
          return (
            job.jobStatusName === OperationsStatus.Completed.toString() &&
            job.isActive === true
          )
        case "Cancelled":
          return (
            job.jobStatusName === OperationsStatus.Cancelled.toString() &&
            job.isActive === true
          )
        case "Cancel With Service":
          return (
            job.jobStatusName ===
              OperationsStatus.CancelWithService.toString() &&
            job.isActive === true
          )
        case "Confirmed":
          return (
            job.jobStatusName === OperationsStatus.Confirmed.toString() &&
            job.isActive === true &&
            !isChecklistPostedJob(job)
          )
        case "Posted":
          return job.isActive === true && isChecklistPostedJob(job)
        case "InActive":
          return job.isActive === false
        default:
          return true
      }
    })
  }, [data, selectedStatus])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IJobOrderHd>[] = useMemo(
    () => [
      {
        accessorKey: "jobOrderNo",
        header: "Job No",
        cell: ({ row }) => {
          const jobNo = row.getValue("jobOrderNo") as string
          const jobOrderId = row.original.jobOrderId
          return (
            <TableCellLink
              onClick={() => {
                console.log("🚀 STEP 1: Job Order Click Initiated")
                console.log("📋 Job Order Details:", {
                  jobOrderNo: jobNo,
                  jobOrderId: jobOrderId,
                  companyId: companyId,
                })

                console.log("🔍 STEP 2: Building URL for new tab")
                const url = `/${companyId}/operations/checklist/${jobOrderId}`
                console.log("🌐 Final URL:", url)

                console.log("🔄 STEP 3: Opening new tab with window.open()")
                console.log("📝 Tab parameters:", {
                  url: url,
                  target: "_blank",
                  method: "window.open",
                })

                // Check current company ID before opening new tab
                const currentCompanyId =
                  useAuthStore.getState().currentCompany?.companyId
                const sessionStorageCompanyId =
                  sessionStorage.getItem("tab_company_id")
                console.log("🔍 Company ID state before new tab:", {
                  zustandStore: currentCompanyId,
                  sessionStorage: sessionStorageCompanyId,
                  urlCompanyId: companyId,
                })

                const newTab = window.open(url, "_blank")

                console.log("✅ STEP 4: New tab opened successfully")
                console.log("📊 Tab reference:", newTab)
                console.log(
                  "⚠️ POTENTIAL ISSUE: New tab might use old company ID until page loads"
                )
                console.log(
                  "💡 The new tab will get correct company ID after CompanyProvider runs"
                )
                console.log(
                  "🎯 Navigation completed - user can now work in new tab"
                )
              }}
            >
              {jobNo}
            </TableCellLink>
          )
        },
        size: 160,
        minSize: 120,
        maxSize: 180,
      },
      {
        accessorKey: "jobOrderDate",
        header: "Date",
        cell: ({ row }) => {
          const raw = row.original.jobOrderDate
          if (!raw) return "-"
          const parsed =
            typeof raw === "string" ? parseDate(raw) : new Date(raw)
          if (parsed && isValid(parsed)) {
            return formatDateForDisplay(parsed, dateFormat)
          }
          return formatDateForDisplay(raw)
        },
        size: 100,
        minSize: 70,
      },
      {
        accessorKey: "vesselName",
        header: "Vessel",
        size: 130,
        minSize: 90,
      },
      {
        accessorKey: "portName",
        header: "Port",
        size: 120,
        minSize: 80,
      },

      {
        accessorKey: "customerName",
        header: "Customer",
        size: 180,
        minSize: 100,
      },

      {
        accessorKey: "currencyCode",
        header: "Curr.",
        size: 50,
        minSize: 50,
      },
      {
        accessorKey: "jobStatusName",
        header: "Status",
        cell: ({ row }) => {
          const status = getChecklistJobDisplayStatus(row.original)
          const statusColors: Record<string, string> = {
            Pending: "bg-yellow-100 text-yellow-800",
            Completed: "bg-blue-100 text-primary",
            Cancelled: "bg-red-100 text-red-800",
            "Cancel with Service": "bg-orange-100 text-orange-800",
            Confirmed: "bg-green-100 text-green-800",
            Posted: "bg-purple-100 text-purple-800",
            Delivered: "bg-green-100 text-green-800",
            Approved: "bg-blue-100 text-primary",
          }
          return (
            <Badge
              className={`px-1.5 py-0.5 text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}
            >
              {status}
            </Badge>
          )
        },
        size: 90,
        minSize: 70,
      },
      {
        id: "totalTaskCount",
        accessorKey: "totalTaskCount",
        header: "Tasks",
        cell: ({ row }) => <TaskCountHoverCell row={row.original} />,
        size: 70,
        minSize: 60,
        maxSize: 80,
      },
      {
        accessorKey: "etaDate",
        header: "ETA",
        cell: ({ row }) => {
          const date = row.original.etaDate
            ? new Date(row.original.etaDate)
            : null
          return date && isValid(date) ? format(date, datetimeFormat) : "-"
        },
        size: 160,
        minSize: 120,
      },
      {
        accessorKey: "etdDate",
        header: "ETD",
        cell: ({ row }) => {
          const date = row.original.etdDate
            ? new Date(row.original.etdDate)
            : null
          return date && isValid(date) ? format(date, datetimeFormat) : "-"
        },
        size: 160,
        minSize: 120,
      },
      {
        accessorKey: "etbDate",
        header: "ETB",
        cell: ({ row }) => {
          const date = row.original.etbDate
            ? new Date(row.original.etbDate)
            : null
          return date && isValid(date) ? format(date, datetimeFormat) : "-"
        },
        size: 160,
        minSize: 120,
      },
      {
        accessorKey: "vesselDistance",
        header: "Dist. In.",
        cell: ({ row }) => {
          const distance = row.getValue("vesselDistance") as
            | number
            | null
            | undefined
          if (distance === null || distance === undefined || distance === 0) {
            return "-"
          }
          return (
            <span>
              {distance} <span className="text-xs">N Miles</span>
            </span>
          )
        },
        size: 70,
        minSize: 50,
      },

      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 100,
        minSize: 50,
      },
      {
        accessorKey: "lastPortName",
        header: "Last Port",
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "nextPortName",
        header: "Next Port",
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "isPost",
        header: "Post",
        cell: ({ row }) => (
          <div className="flex justify-center overflow-hidden">
            {row.getValue("isPost") ? (
              <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
            ) : (
              <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
            )}
          </div>
        ),
        size: 80,
        minSize: 50,
      },
      {
        accessorKey: "billName",
        header: "Address",
        cell: ({ row }) => {
          const billName = row.original.billName
          const address1 = row.original.address1
          const address2 = row.original.address2
          const address3 = row.original.address3
          const address4 = row.original.address4
          const pinCode = row.original.pinCode
          const phoneNo = row.original.phoneNo

          if (!billName && !address1) return "-"

          const addressParts = [
            billName,
            address1,
            address2,
            address3,
            address4,
            pinCode,
          ].filter(Boolean)

          const displayText =
            addressParts.length > 0 ? addressParts.join(", ") : "-"

          return (
            <div className="max-w-[200px] truncate" title={displayText}>
              {displayText}
              {phoneNo && (
                <div className="text-muted-foreground mt-1 text-xs">
                  📞 {phoneNo}
                </div>
              )}
            </div>
          )
        },
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "contactName",
        header: "Contact",
        cell: ({ row }) => {
          const contactName = row.original.contactName
          const mobileNo = row.original.mobileNo
          const emailAdd = row.original.emailAdd

          if (!contactName && !mobileNo && !emailAdd) return "-"

          return (
            <div className="max-w-[180px]">
              {contactName && (
                <div className="truncate font-medium" title={contactName}>
                  {contactName}
                </div>
              )}
              {mobileNo && (
                <div
                  className="text-muted-foreground truncate text-xs"
                  title={mobileNo}
                >
                  📱 {mobileNo}
                </div>
              )}
              {emailAdd && (
                <div
                  className="text-muted-foreground truncate text-xs"
                  title={emailAdd}
                >
                  ✉️ {emailAdd}
                </div>
              )}
            </div>
          )
        },
        size: 180,
        minSize: 150,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex justify-center overflow-hidden">
            {row.getValue("isActive") ? (
              <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
            ) : (
              <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
            )}
          </div>
        ),
        size: 90,
        minSize: 70,
      },
      {
        accessorKey: "editVersion",
        header: "Version",
        cell: ({ row }) => {
          const version = row.getValue("editVersion")
          const variant: "default" | "secondary" | "destructive" | "outline" =
            "secondary"
          return (
            <Badge
              variant={variant}
              className="px-2 py-1 text-xs font-semibold"
            >
              {version ? String(version) : "0"}
            </Badge>
          )
        },
        size: 70,
        minSize: 50,
        maxSize: 80,
      },
      {
        accessorKey: "createBy",
        header: "Create By",
        size: 100,
        minSize: 50,
      },
      {
        accessorKey: "createDate",
        header: "Create Date",
        cell: ({ row }) => {
          const raw = row.getValue("createDate")
          let date: Date | null = null
          if (typeof raw === "string") date = new Date(raw)
          else if (raw instanceof Date) date = raw
          return date && isValid(date) ? format(date, datetimeFormat) : "-"
        },
        size: 140,
        minSize: 120,
      },
      {
        accessorKey: "editBy",
        header: "Edit By",
        size: 100,
        minSize: 50,
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => {
          const raw = row.getValue("editDate")
          let date: Date | null = null
          if (typeof raw === "string") date = new Date(raw)
          else if (raw instanceof Date) date = raw
          return date && isValid(date) ? format(date, datetimeFormat) : "-"
        },
        size: 140,
        minSize: 120,
      },
    ],
    [dateFormat, datetimeFormat, companyId]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col text-xs">
      <JobTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.checklist}
        tableHeight={CHECKLIST_LIST_TABLE_MAX_HEIGHT}
        tableContainerClassName="rounded-none border-0 bg-transparent shadow-none"
        emptyMessage="No job orders found."
        onRefreshAction={onRefreshAction}
        onCreateAction={canCreate ? onCreateAction : undefined}
        hideCreateButton={!canCreate}
      />
    </div>
  )
}
