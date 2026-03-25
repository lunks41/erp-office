"use client"

import { useCallback, useMemo } from "react"
import { IEquipmentUsed } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { BasicTable } from "@/components/table/table-basic"

interface EquipmentUsedTableProps {
  data: IEquipmentUsed[]
  isLoading?: boolean
}

export function EquipmentUsedTable({
  data,
  isLoading = false,
}: EquipmentUsedTableProps) {
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
  const columns: ColumnDef<IEquipmentUsed>[] = useMemo(
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
        cell: ({ row }) => {
          const status = row.getValue("taskStatusName") as string
          return (
            <div className="text-center">
              <Badge
                variant={status === "Active" ? "default" : "secondary"}
                className="font-medium"
              >
                {status || "-"}
              </Badge>
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "date",
        header: "Service Date",
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
        accessorKey: "referenceNo",
        header: "Reference No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("referenceNo") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "mafi",
        header: "MAFI",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("mafi") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: "others",
        header: "Others",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("others") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "craneChargeName",
        header: "Crane Charge",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("craneChargeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "forkliftChargeName",
        header: "Forklift Charge",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("forkliftChargeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "stevedoreChargeName",
        header: "Stevedore Charge",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("stevedoreChargeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
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
          const version = row.getValue("editVersion") as number
          return (
            <div className="text-center">
              <Badge variant="destructive" className="font-mono text-xs">
                v{version || "0"}
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
        maxSize: 150,
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
        maxSize: 150,
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
      emptyMessage="No equipment used found."
      tableName={TableName.equipmentUsed}
    />
  )
}
