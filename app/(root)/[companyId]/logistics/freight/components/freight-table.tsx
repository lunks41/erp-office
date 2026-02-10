"use client"

import { useCallback, useMemo } from "react"
import { IFreight } from "@/interfaces/freight"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"

interface FreightTableProps {
  data: IFreight[]
  isLoading?: boolean
  onFreightSelect?: (freight: IFreight | null) => void
  onEditActionFreight?: (freight: IFreight) => void
  onCreateActionFreight?: () => void
  onRefreshAction?: () => void
  moduleId?: number
  transactionId?: number
}

export function FreightTable({
  data,
  isLoading = false,
  onFreightSelect,
  onEditActionFreight,
  onCreateActionFreight,
  onRefreshAction,
  moduleId,
  transactionId,
}: FreightTableProps) {
  const { decimals } = useAuthStore()
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
  const columns: ColumnDef<IFreight>[] = useMemo(
    () => [
      {
        accessorKey: "referenceNo",
        header: "Reference No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("referenceNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
        enableColumnFilter: true,
      },
      {
        accessorKey: "vesselName",
        header: "Vessel",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("vesselName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "awbNo",
        header: "AWB No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("awbNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
        enableColumnFilter: true,
      },
      {
        accessorKey: "declarationNo",
        header: "Declaration No",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("declarationNo") || "-"}
          </div>
        ),
        size: 130,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "billEntryNo",
        header: "Bill Entry No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("billEntryNo") || "-"}</div>
        ),
        size: 130,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "receiveDate",
        header: "Cleared Date",
        cell: ({ row }) => (
          <div className="text-wrap">
            {formatDateValue(row.getValue("receiveDate"))}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "arrivalDate",
        header: "Arrival Date",
        cell: ({ row }) => (
          <div className="text-wrap">
            {formatDateValue(row.getValue("arrivalDate"))}
          </div>
        ),
        size: 120,
        minSize: 100,
      },

      {
        accessorKey: "noOfPcs",
        header: "No of Pcs",
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("noOfPcs") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("weight") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "clearedBy",
        header: "Cleared By",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("clearedBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
        enableColumnFilter: true,
      },
      {
        accessorKey: "amountDeposited",
        header: "Amount Deposited",
        cell: ({ row }) => (
          <div className="text-right">
            {row.getValue("amountDeposited") || "-"}
          </div>
        ),
        size: 130,
        minSize: 120,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <div className="max-w-xs truncate text-wrap">
            {row.getValue("remarks") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
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
        accessorKey: "refundInstrumentNo",
        header: "Refund Instrument No",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("refundInstrumentNo") || "-"}
          </div>
        ),
        size: 130,
        minSize: 120,
      },
      {
        accessorKey: "chargeName",
        header: "Charge",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("chargeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
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
      },
      {
        accessorKey: "debitNoteNo",
        header: "Debit Note No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("debitNoteNo") || "-"}</div>
        ),
        size: 130,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "taskStatusName",
        header: "Task Status",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("taskStatusName") || "-"}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-xs truncate text-wrap">
            {row.getValue("description") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
      },

      {
        accessorKey: "deliverDate",
        header: "Delivery Date",
        cell: ({ row }) => (
          <div className="text-wrap">
            {formatDateValue(row.getValue("deliverDate"))}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "serviceModeName",
        header: "Service Mode",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("serviceModeName") || "-"}
          </div>
        ),
        size: 130,
        minSize: 120,
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
        minSize: 130,
      },

      {
        accessorKey: "chargeName",
        header: "Charge",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("chargeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "deliverDate",
        header: "Delivery Date",
        cell: ({ row }) => (
          <div className="text-wrap">
            {formatDateValue(row.getValue("deliverDate"))}
          </div>
        ),
        size: 120,
        minSize: 100,
      },

      {
        accessorKey: "landingTypeName",
        header: "Landing Type",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("landingTypeName") || "-"}
          </div>
        ),
        size: 130,
        minSize: 120,
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
        enableColumnFilter: true,
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
        enableColumnFilter: true,
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
        accessorKey: "jobOrderNo",
        header: "Job Order",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("jobOrderNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
        enableColumnFilter: true,
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
        enableColumnFilter: true,
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
            <div className="text-wrap">
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
          <div className="text-wrap">{row.getValue("editBy") || "-"}</div>
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
            <div className="text-wrap">
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
    <MainTable<IFreight>
      data={data}
      columns={columns}
      isLoading={isLoading}
      tableName={TableName.checklist}
      accessorId="consignmentImportId"
      onSelect={onFreightSelect}
      onEditAction={onEditActionFreight}
      onCreateAction={onCreateActionFreight}
      onRefreshAction={onRefreshAction}
      onFilterChange={undefined}
      moduleId={moduleId}
      transactionId={transactionId}
      emptyMessage="No freight records found."
      showHeader={true}
      showFooter={true}
      showActions={true}
      canEdit={true}
      canDelete={false}
      canView={true}
      canCreate={false}
    />
  )
}
