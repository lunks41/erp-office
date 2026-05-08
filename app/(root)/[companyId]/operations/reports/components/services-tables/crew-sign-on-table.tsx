"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useCallback, useMemo } from "react"
import { ICrewSignOn } from "@/interfaces/checklist"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { BasicTable } from "@/components/table/table-basic"

interface CrewSignOnTableProps {
  data: ICrewSignOn[]
  isLoading?: boolean
}

export function CrewSignOnTable({
  data,
  isLoading = false,
}: CrewSignOnTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
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
  const columns: ColumnDef<ICrewSignOn>[] = useMemo(
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
        accessorKey: "crewName",
        header: "Crew Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("crewName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "nationalityName",
        header: "Nationality",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("nationalityName") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
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
        accessorKey: "visaName",
        header: "Visa Type",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("visaName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "rankName",
        header: "Rank",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("rankName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },

      {
        accessorKey: "flightDetails",
        header: "Flight Details",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("flightDetails") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "hotelName",
        header: "Hotel Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("hotelName") || "-"}</div>
        ),
      },
      {
        accessorKey: "departureDetails",
        header: "Departure Details",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("departureDetails") || "-"}
          </div>
        ),
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
        accessorKey: "transportName",
        header: "Transport Name",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("transportName") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "clearing",
        header: "Clearing",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("clearing") || "-"}</div>
        ),
      },
      {
        accessorKey: "overStayRemark",
        header: "Over Stay Remark",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("overStayRemark") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "modificationRemark",
        header: "Modification Remark",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("modificationRemark") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "cidClearance",
        header: "CID Clearance",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("cidClearance") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
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
    [formatDateTimeValue]
  )

  return (
    <BasicTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No crew sign ons found."
      tableName={TableName.crewSignOn}
    />
  )
}
