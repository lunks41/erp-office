"use client"

import { useCallback, useMemo } from "react"
import { ITallyService } from "@/interfaces"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface TallyServiceTableProps {
  data: ITallyService[]
  isLoading?: boolean
  totalRecords?: number
  onDeleteAction?: (item: ITallyService) => void
  onEditAction?: (item: ITallyService) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  serverSidePagination?: boolean
  moduleId?: number
  transactionId?: number
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
  onSelect?: (item: ITallyService | null) => void
  onCreateAction?: () => void
}

function formatDuration(value?: number | null): string {
  if (!value) return "-"
  const [hours = "00", minutes = "00"] = value.toString().split(".")
  return `${hours.padStart(2, "0")}:${minutes.padEnd(2, "0").slice(0, 2)}`
}

export function TallyServiceTable({
  data,
  isLoading = false,
  totalRecords,
  onDeleteAction,
  onEditAction,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  onPageChange,
  onPageSizeChange,
  currentPage,
  pageSize,
  serverSidePagination = false,
  moduleId,
  transactionId,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
  onSelect,
  onCreateAction,
}: TallyServiceTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const formatDateValue = useCallback(
    (value: unknown) => {
      if (!value) return "-"
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? "-" : format(value, dateFormat)
      }
      if (typeof value === "string") {
        const parsed = parseDate(value) || parse(value, dateFormat, new Date())
        return parsed && isValid(parsed) ? format(parsed, dateFormat) : value
      }
      return "-"
    },
    [dateFormat]
  )

  const formatDateTimeValue = useCallback(
    (value: unknown) => {
      if (!value) return "-"
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? "-" : format(value, datetimeFormat)
      }
      if (typeof value === "string") {
        const parsed = parseDate(value) || parse(value, dateFormat, new Date())
        return parsed && isValid(parsed)
          ? format(parsed, datetimeFormat)
          : value
      }
      return "-"
    },
    [dateFormat, datetimeFormat]
  )

  const columns: ColumnDef<ITallyService>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Service Date",
        cell: ({ row }) => formatDateValue(row.getValue("date")),
        size: 120,
      },
      {
        accessorKey: "accountDate",
        header: "Account Date",
        cell: ({ row }) => formatDateValue(row.getValue("accountDate")),
        size: 120,
      },
      {
        accessorKey: "taskStatusName",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.getValue("taskStatusName") || "-"}
          </Badge>
        ),
        size: 130,
      },
      {
        accessorKey: "chargeName",
        header: "Charge",
        size: 200,
      },
      {
        accessorKey: "bargeName",
        header: "Barge",
        size: 160,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        size: 100,
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        size: 100,
      },
      {
        accessorKey: "receiptNo",
        header: "Receipt No",
        size: 130,
      },
      {
        accessorKey: "operatorName",
        header: "Operator Name",
        size: 160,
      },
      {
        accessorKey: "supplyBarge",
        header: "Supply Barge",
        size: 160,
      },
      {
        accessorKey: "ameTally",
        header: "AME Tally",
        size: 130,
      },
      {
        accessorKey: "boatopTally",
        header: "Boat Operator Tally",
        size: 160,
      },
      {
        accessorKey: "boatOperator",
        header: "Boat Operator",
        size: 160,
      },
      {
        accessorKey: "distance",
        header: "Distance",
        cell: ({ row }) => row.getValue("distance") || "-",
        size: 110,
      },
      {
        accessorKey: "loadingTime",
        header: "Loading Time",
        cell: ({ row }) => formatDateTimeValue(row.getValue("loadingTime")),
        size: 180,
      },
      {
        accessorKey: "leftJetty",
        header: "Left Jetty",
        cell: ({ row }) => formatDateTimeValue(row.getValue("leftJetty")),
        size: 180,
      },
      {
        accessorKey: "waitingTime",
        header: "Waiting Time",
        cell: ({ row }) =>
          formatDuration(row.getValue("waitingTime") as number),
        size: 120,
      },
      {
        accessorKey: "alongsideVessel",
        header: "Alongside Vessel",
        cell: ({ row }) => formatDateTimeValue(row.getValue("alongsideVessel")),
        size: 180,
      },
      {
        accessorKey: "departedFromVessel",
        header: "Departed Vessel",
        cell: ({ row }) =>
          formatDateTimeValue(row.getValue("departedFromVessel")),
        size: 180,
      },
      {
        accessorKey: "timeDiff",
        header: "Time Difference",
        cell: ({ row }) => formatDuration(row.getValue("timeDiff") as number),
        size: 130,
      },
      {
        accessorKey: "arrivedAtJetty",
        header: "Arrived at Jetty",
        cell: ({ row }) => formatDateTimeValue(row.getValue("arrivedAtJetty")),
        size: 180,
      },
      {
        accessorKey: "deliveredWeight",
        header: "Delivered Weight",
        size: 140,
      },
      {
        accessorKey: "landedWeight",
        header: "Landed Weight",
        size: 140,
      },
      {
        accessorKey: "annexure",
        header: "Annexure",
        size: 140,
      },
      {
        accessorKey: "invoiceId",
        header: "Invoice Id",
        cell: ({ row }) => row.getValue("invoiceId") || "-",
        size: 120,
      },
      {
        accessorKey: "invoiceNo",
        header: "Invoice No",
        size: 130,
      },
      {
        accessorKey: "isPost",
        header: "Posted",
        cell: ({ row }) => (
          <Badge variant={row.getValue("isPost") ? "default" : "secondary"}>
            {row.getValue("isPost") ? "Yes" : "No"}
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: "poNo",
        header: "PO No",
        size: 130,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 220,
      },
      {
        accessorKey: "createBy",
        header: "Created By",
        size: 120,
      },
      {
        accessorKey: "createDate",
        header: "Created Date",
        cell: ({ row }) => formatDateTimeValue(row.getValue("createDate")),
        size: 180,
      },
      {
        accessorKey: "editBy",
        header: "Edited By",
        size: 120,
      },
      {
        accessorKey: "editDate",
        header: "Edited Date",
        cell: ({ row }) => formatDateTimeValue(row.getValue("editDate")),
        size: 180,
      },
    ],
    [formatDateTimeValue, formatDateValue]
  )

  const handleDelete = (tallyServiceId: string) => {
    const item = data.find(
      (row) => row.tallyServiceId.toString() === tallyServiceId
    )
    if (item) {
      onDeleteAction?.(item)
    }
  }

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      totalRecords={totalRecords}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.tallyService}
      emptyMessage="No tally services found."
      accessorId="tallyServiceId"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      currentPage={currentPage}
      pageSize={pageSize}
      serverSidePagination={serverSidePagination}
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={handleDelete}
      createButtonText="Add Tally Service"
      showHeader={true}
      showFooter={true}
      showActions={true}
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
    />
  )
}
