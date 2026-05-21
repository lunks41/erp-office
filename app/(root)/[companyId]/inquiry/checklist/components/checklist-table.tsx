"use client"

import { useMemo } from "react"
import { IJobOrderHd } from "@/interfaces/checklist"
import { useCompanyStore } from "@/stores/company-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { useCompanyLookup } from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import { JobTable } from "@/components/table/table-job"
import { TableCellLink } from "@/components/ui/table-cell-link"

interface InquiryTableProps {
  data: IJobOrderHd[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  onRefreshAction?: () => void
}

export function InquiryTable({
  data,
  isLoading = false,
  moduleId,
  transactionId,
  onRefreshAction,
}: InquiryTableProps) {
  const { decimals } = useCompanyStore()
  const { data: companies = [] } = useCompanyLookup()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Create a map for quick company lookup
  const companyMap = useMemo(() => {
    const map = new Map<number, string>()
    companies.forEach((company) => {
      map.set(company.companyId, company.companyName)
    })
    return map
  }, [companies])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IJobOrderHd>[] = useMemo(
    () => [
      {
        accessorKey: "jobOrderNo",
        header: "Job No",
        cell: ({ row }) => {
          const jobNo = row.getValue("jobOrderNo") as string
          const jobOrderId = row.original.jobOrderId
          const companyId = row.original.companyId
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
                  useCompanyStore.getState().currentCompany?.companyId
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
        size: 200,
        minSize: 120,
        maxSize: 180,
      },
      {
        accessorKey: "companyId",
        header: "Company",
        cell: ({ row }) => {
          const companyId = row.original.companyId
          const companyName =
            companyMap.get(companyId) || `Company ${companyId}`
          return (
            <Badge
              variant="outline"
              className="border-border bg-card px-2 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
            >
              {companyName}
            </Badge>
          )
        },
        size: 350,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "jobOrderDate",
        header: "Date",
        cell: ({ row }) => {
          const date = row.original.jobOrderDate
            ? new Date(row.original.jobOrderDate)
            : null
          return date ? format(date, dateFormat) : "-"
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        size: 180,
        minSize: 140,
      },
      {
        accessorKey: "currencyCode",
        header: "Curr.",
        size: 50,
        minSize: 50,
      },
      {
        accessorKey: "portName",
        header: "Port",
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "vesselName",
        header: "Vessel",
        size: 140,
        minSize: 100,
      },
      {
        accessorKey: "jobStatusName",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("jobStatusName") as string
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
        size: 120,
        minSize: 80,
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
      },
      {
        accessorKey: "vesselDistance",
        header: "Dist. In.",
        size: 80,
        minSize: 60,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 150,
        minSize: 50,
      },
      {
        accessorKey: "lastPortName",
        header: "Last Port",
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "nextPortName",
        header: "Next Port",
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => (
          <Badge variant={row.getValue("isActive") ? "default" : "destructive"}>
            {row.getValue("isActive") ? (
              <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
            ) : (
              <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
            )}
            {row.getValue("isActive") ? "Yes" : "No"}
          </Badge>
        ),
        size: 100,
        minSize: 70,
      },
    ],
    [dateFormat, datetimeFormat, companyMap]
  )

  return (
    <div>
      <JobTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.checklist}
        emptyMessage="No job orders found across all companies."
        onRefreshAction={onRefreshAction}
        hideCreateButton={true}
      />
    </div>
  )
}
