"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useCallback, useMemo } from "react"
import { ISerTransportationHd } from "@/interfaces/checklist"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface TransportationLogTableProps {
  data: ISerTransportationHd[]
  isLoading?: boolean
  onTransportationLogSelect?: (
    transportationLog: ISerTransportationHd | null
  ) => void
  onDeleteTransportationLog?: (itemNo: string) => void
  onEditActionTransportationLog?: (
    transportationLog: ISerTransportationHd
  ) => void
  onCreateActionTransportationLog?: () => void
  onRefreshAction?: () => void
  moduleId?: number
  transactionId?: number
  isConfirmed?: boolean
}

export function TransportationLogTable({
  data,
  isLoading = false,
  onTransportationLogSelect,
  onDeleteTransportationLog,
  onEditActionTransportationLog,
  onCreateActionTransportationLog,
  onRefreshAction,
  moduleId,
  transactionId,
  isConfirmed,
}: TransportationLogTableProps) {
  const { decimals } = useCompanyStore()
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )
  const datetimeFormat = useMemo(
    () => decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss",
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
        if (!parsed || !isValid(parsed)) {
          return value
        }
        return format(parsed, dateFormat)
      }
      return "-"
    },
    [dateFormat]
  )

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<ISerTransportationHd>[] = useMemo(
    () => [
      {
        accessorKey: "serviceItemNo",
        header: "Services",
        cell: ({ row }) => {
          const record = row.original as ISerTransportationHd & {
            serviceItemNo?: string
            serviceItemNoName?: string
          }
          const serviceItemNo =
            record.serviceItemNo ??
            (record.data_details && record.data_details.length > 0
              ? record.data_details.map((detail) => detail.serviceItemNo).join(",")
              : "")
          const serviceItemNoName = record.serviceItemNoName ?? ""

          const serviceItemNoNames = serviceItemNoName
            ? serviceItemNoName.split(",").map((name) => name.trim())
            : []

          if (
            (!serviceItemNo || serviceItemNo.trim() === "") &&
            serviceItemNoNames.length === 0
          ) {
            return <span className="text-muted-foreground text-[10px]">-</span>
          }

          // Split comma-separated strings
          const serviceItemNos = serviceItemNo
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item)

          if (serviceItemNos.length === 0 && serviceItemNoNames.length === 0) {
            return <span className="text-muted-foreground text-[10px]">-</span>
          }
          const rowsCount = Math.max(serviceItemNos.length, serviceItemNoNames.length)

          return (
            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: rowsCount }).map((_, index) => {
                const itemNo = serviceItemNos[index] || ""
                // Use name if available and matches index, otherwise use ID
                const displayText =
                  serviceItemNoNames[index] && serviceItemNoNames[index] !== ""
                    ? serviceItemNoNames[index]
                    : itemNo

                return (
                  <Badge
                    key={`${itemNo}-${index}`}
                    variant="default"
                    className="border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[10px] leading-tight text-blue-800 hover:bg-blue-200"
                  >
                    {displayText}
                  </Badge>
                )
              })}
            </div>
          )
        },
        size: 300,
        minSize: 100,
        enableColumnFilter: true,
      },
      {
        accessorKey: "transportDate",
        header: "Transport Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateValue(row.getValue("transportDate"))}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "taskName",
        header: "Task",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("taskName") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },

      {
        accessorKey: "chargeName",
        header: "Charge",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("chargeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "refNo",
        header: "Slip No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("refNo") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
        enableColumnFilter: true,
      },

      {
        accessorKey: "fromLocation",
        header: "From Location",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("fromLocation") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "toLocation",
        header: "To Location",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("toLocation") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "passengerCount",
        header: "Passengers",
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("passengerCount") || 0}
          </div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "transportModeName",
        header: "Transport Mode",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("transportModeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "cargoTypeName",
        header: "Cargo Type",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("cargoTypeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },

      {
        accessorKey: "vehicleNo",
        header: "Vehicle No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("vehicleNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "driverName",
        header: "Driver Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("driverName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },

      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <div className="max-w-xs truncate">
            {row.getValue("remarks") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
      },

      {
        accessorKey: "vendor",
        header: "Vendor",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("vendor") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "createBy",
        header: "Create By",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("createBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "createDate",
        header: "Create Date",
        cell: ({ row }) => {
          const raw = row.getValue("createDate")
          let date: Date | null = null
          if (typeof raw === "string") date = new Date(raw)
          else if (raw instanceof Date) date = raw
          return (
            <div className="truncate">
              {date && isValid(date) ? format(date, datetimeFormat) : "-"}
            </div>
          )
        },
        size: 180,
        minSize: 150,
      },
      {
        accessorKey: "editBy",
        header: "Edit By",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("editBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => {
          const raw = row.getValue("editDate")
          let date: Date | null = null
          if (typeof raw === "string") date = new Date(raw)
          else if (raw instanceof Date) date = raw
          return (
            <div className="truncate">
              {date && isValid(date) ? format(date, datetimeFormat) : "-"}
            </div>
          )
        },
        size: 180,
        minSize: 150,
      },
    ],
    [formatDateValue, datetimeFormat]
  )

  return (
    <MainTable<ISerTransportationHd>
      data={data}
      columns={columns}
      isLoading={isLoading}
      tableName={TableName.checklist}
      accessorId="itemNo"
      onSelect={onTransportationLogSelect}
      onEditAction={onEditActionTransportationLog}
      onDeleteAction={onDeleteTransportationLog}
      onCreateAction={onCreateActionTransportationLog}
      onRefreshAction={onRefreshAction}
      onFilterChange={undefined}
      moduleId={moduleId}
      transactionId={transactionId}
      emptyMessage="No transportation logs found."
      showHeader={true}
      showFooter={true}
      showActions={true}
      canEdit={!isConfirmed}
      canDelete={!isConfirmed}
      canView={true}
      canCreate={!isConfirmed}
      isConfirmed={isConfirmed}
    />
  )
}
