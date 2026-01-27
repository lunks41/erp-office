"use client"

import {
  IJobOrderHd,
  ITechnicianSurveyor,
  ITechnicianSurveyorFilter,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"
import { useCallback, useMemo, useState } from "react"

import { BasicTable } from "@/components/table/table-basic"
import { Badge } from "@/components/ui/badge"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"

interface TechnicianSurveyorTableProps {
  data: ITechnicianSurveyor[]
  isLoading?: boolean
}

export function TechnicianSurveyorTable({
  data,
  isLoading = false,
}: TechnicianSurveyorTableProps) {
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
  const columns: ColumnDef<ITechnicianSurveyor>[] = useMemo(
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
        accessorKey: "isTransport",
        header: "Transport",
        cell: ({ row }) => {
          const isTransport = row.getValue("isTransport") as boolean
          return (
            <div className="text-center">
              <Badge
                variant={isTransport ? "default" : "outline"}
                className={isTransport ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isTransport ? "Yes" : "No"}
              </Badge>
            </div>
          )
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "isHotel",
        header: "Hotel",
        cell: ({ row }) => {
          const isHotel = row.getValue("isHotel") as boolean
          return (
            <div className="text-center">
              <Badge
                variant={isHotel ? "default" : "outline"}
                className={isHotel ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {isHotel ? "Yes" : "No"}
              </Badge>
            </div>
          )
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("name") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
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
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const value = row.getValue("quantity") as number | null | undefined
          return <div className="text-right">{value != null ? value : "-"}</div>
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("uomName") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "natureOfAttendance",
        header: "Nature of Attendance",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("natureOfAttendance") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "companyInfo",
        header: "Company Info",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("companyInfo") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "passTypeName",
        header: "Pass Type",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("passTypeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "embarked",
        header: "Embarked",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("embarked"))
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "disembarked",
        header: "Disembarked",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("disembarked"))
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "portRequestNo",
        header: "Port Request No",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("portRequestNo") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 200,
        minSize: 150,
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
      },
      {
        accessorKey: "createDate",
        header: "Create Date",
        cell: ({ row }) => {
          return formatDateTimeValue(row.getValue("createDate"))
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
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => {
          return formatDateTimeValue(row.getValue("editDate"))
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
      emptyMessage="No technician surveyors found."
      tableName={TableName.techniciansSurveyors}
    />
  )
}
