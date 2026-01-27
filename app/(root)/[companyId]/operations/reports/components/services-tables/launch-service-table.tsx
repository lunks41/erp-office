"use client"

import {
  ILaunchService
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"
import { useCallback, useMemo } from "react"

import { BasicTable } from "@/components/table/table-basic"
import { Badge } from "@/components/ui/badge"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"

interface LaunchServiceTableProps {
  data: ILaunchService[]
  isLoading?: boolean
 
}

export function LaunchServiceTable({
  data,
  isLoading = false,
}: LaunchServiceTableProps) {
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
  const columns: ColumnDef<ILaunchService>[] = useMemo(
    () => [
      {
        accessorKey: "jobOrderNo",
        header: "Job Order No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("jobOrderNo") || "-"}</div>
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
            <div className="text-wrap">
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
          <div className="text-wrap">{row.getValue("chargeName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("uomName") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: "ameTally",
        header: "AME Tally",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("ameTally") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "boatopTally",
        header: "Boat Operator Tally",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("boatopTally") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "boatOperator",
        header: "Boat Operator",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("boatOperator") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "distance",
        header: "Distance from Jetty",
        cell: ({ row }) => {
          const value = row.getValue("distance") as number
          return <div className="text-wrap">{value ? `${value} NM` : "-"}</div>
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "deliveredWeight",
        header: "Cargo Delivered",
        cell: ({ row }) => {
          const value = row.getValue("deliveredWeight") as
            | number
            | null
            | undefined
          return (
            <div className="text-right">
              {value != null ? `${value} MT` : "-"}
            </div>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "landedWeight",
        header: "Cargo Landed",
        cell: ({ row }) => {
          const value = row.getValue("landedWeight") as
            | number
            | null
            | undefined
          return (
            <div className="text-right">
              {value != null ? `${value} MT` : "-"}
            </div>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "loadingTime",
        header: "Loading Time",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("loadingTime"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "leftJetty",
        header: "Left Jetty",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("leftJetty"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "waitingTime",
        header: "Waiting Time",
        cell: ({ row }) => {
          const value = row.getValue("waitingTime") as number
          if (!value)
            return <div className="text-muted-foreground text-wrap">-</div>

          const valueStr = value.toString()
          if (valueStr.includes(".")) {
            const [hours, minutes] = valueStr.split(".")
            const paddedMinutes = minutes.padEnd(2, "0")
            return (
              <div className="flex items-center gap-1 text-wrap">
                <span className="font-mono text-sm font-medium">
                  {hours}:{paddedMinutes}
                </span>
                <span className="text-muted-foreground text-xs">hr</span>
              </div>
            )
          }

          return (
            <div className="flex items-center gap-1 text-wrap">
              <span className="font-mono text-sm font-medium">{valueStr}</span>
              <span className="text-muted-foreground text-xs">hr</span>
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "alongsideVessel",
        header: "Alongside Vessel",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("alongsideVessel"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "departedFromVessel",
        header: "Departed Vessel",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("departedFromVessel"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "timeDiff",
        header: "Time Difference",
        cell: ({ row }) => {
          const value = row.getValue("timeDiff") as number
          if (!value)
            return <div className="text-muted-foreground text-wrap">-</div>

          const valueStr = value.toString()
          if (valueStr.includes(".")) {
            const [hours, minutes] = valueStr.split(".")
            const paddedMinutes = minutes.padEnd(2, "0")
            return (
              <div className="flex items-center gap-1 text-wrap">
                <span className="font-mono text-sm font-medium">
                  {hours}:{paddedMinutes}
                </span>
                <span className="text-muted-foreground text-xs">hr</span>
              </div>
            )
          }

          return (
            <div className="flex items-center gap-1 text-wrap">
              <span className="font-mono text-sm font-medium">{valueStr}</span>
              <span className="text-muted-foreground text-xs">hr</span>
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "arrivedAtJetty",
        header: "Arrived at Jetty",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("arrivedAtJetty"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "bargeName",
        header: "Barge Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("bargeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "invoiceNo",
        header: "Invoice No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("invoiceNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
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
              <Badge
                variant="destructive"
                className="font-mono text-xs"
              >
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
          <div className="text-wrap">{row.getValue("createBy") || "-"}</div>
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
            <div className="text-wrap">
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
          <div className="text-wrap">{row.getValue("editBy") || "-"}</div>
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
            <div className="text-wrap">
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
      emptyMessage="No launch services found."
      tableName={TableName.launchService}
    />
  )
}
