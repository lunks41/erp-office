"use client"

import { useCallback, useMemo } from "react"
import { IConsignmentImport } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { BasicTable } from "@/components/table/table-basic"

interface ConsignmentImportTableProps {
  data: IConsignmentImport[]
  isLoading?: boolean
}

export function ConsignmentImportTable({
  data,
  isLoading = false,
}: ConsignmentImportTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const formatDateTime = useCallback(
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
  const columns: ColumnDef<IConsignmentImport>[] = useMemo(
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
        accessorKey: "vesselName",
        header: "Vessel Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("vesselName") || "-"}</div>
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
        accessorKey: "awbNo",
        header: "AWB No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("awbNo") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
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
        accessorKey: "carrierName",
        header: "Carrier",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("carrierName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "consignmentTypeName",
        header: "Consignment Type",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("consignmentTypeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ row }) => {
          const value = row.getValue("weight") as number | null | undefined
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
        accessorKey: "pickupLocation",
        header: "Pickup Location",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("pickupLocation") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "deliveryLocation",
        header: "Delivery Location",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("deliveryLocation") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "poNo",
        header: "PO No",
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "isCleared",
        header: "Is Cleared",
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.getValue("isCleared") ? (
              <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
            ) : (
              <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
            )}
          </div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "existPortCustom",
        header: "Exist Port Custom",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("existPortCustom") || "-"}
          </div>
        ),
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
        cell: ({ row }) => formatDateTime(row.getValue("createDate")),
        size: 160,
        minSize: 130,
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
        cell: ({ row }) => formatDateTime(row.getValue("editDate")),
        size: 160,
        minSize: 130,
      },
    ],
    [formatDateTime]
  )

  return (
    <BasicTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No consignment imports found."
      tableName={TableName.consignmentImport}
    />
  )
}
