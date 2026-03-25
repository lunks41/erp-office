"use client"

import { useCallback, useMemo } from "react"
import { IFreshWater } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { BasicTable } from "@/components/table/table-basic"

interface FreshWaterTableProps {
  data: IFreshWater[]
  isLoading?: boolean
}

export function FreshWaterTable({
  data,
  isLoading = false,
}: FreshWaterTableProps) {
  const { decimals } = useAuthStore()
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
        if (!parsed || !isValid(parsed)) {
          return value
        }
        return format(parsed, dateFormat)
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
        if (!parsed || !isValid(parsed)) {
          return value
        }
        return format(parsed, datetimeFormat)
      }
      return "-"
    },
    [dateFormat, datetimeFormat]
  )

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IFreshWater>[] = useMemo(
    () => [
      {
        accessorKey: "jobOrderNo",
        header: "Job Order No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("jobOrderNo") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "vesselName",
        header: "Vessel Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("vesselName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "taskStatusName",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="default">
              {row.getValue("taskStatusName") || "-"}
            </Badge>
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          return (
            <div className="truncate">
              {formatDateValue(row.getValue("date"))}
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "bargeName",
        header: "Barge Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("bargeName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "chargeName",
        header: "Charge Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("chargeName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "operatorName",
        header: "Operator Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("operatorName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "supplyBarge",
        header: "Supply Barge",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("supplyBarge") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "distance",
        header: "Distance",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("distance") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const value = row.getValue("quantity") as number | null | undefined
          return <div className="truncate text-right">{value != null ? value : "-"}</div>
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "receiptNo",
        header: "Receipt No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("receiptNo") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("uomName") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "editVersion",
        header: "Version",
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <Badge variant="destructive">
                {row.getValue("editVersion") || "0"}
              </Badge>
            </div>
          )
        },
        size: 70,
        minSize: 60,
        maxSize: 80,
      },
      {
        accessorKey: "poNo",
        header: "PO No",
        size: 150,
        minSize: 120,
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
          return (
            <div className="truncate">
              {formatDateTimeValue(row.getValue("createDate"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
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
          return (
            <div className="truncate">
              {formatDateTimeValue(row.getValue("editDate"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
    ],
    [formatDateValue, formatDateTimeValue]
  )

  return (
    <BasicTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No fresh water found."
      tableName={TableName.freshWater}
    />
  )
}
