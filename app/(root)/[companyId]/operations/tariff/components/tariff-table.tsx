"use client"

import { ITariff, ITariffFilter } from "@/interfaces/tariff"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { formatNumber } from "@/lib/format-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface TariffTableProps {
  data: ITariff[]
  isLoading?: boolean
  onDeleteAction?: (tariff: ITariff) => void
  onEditAction?: (tariff: ITariff) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ITariffFilter) => void
  initialSearchValue?: string // Initial search value to sync with parent filters
  moduleId?: number
  transactionId?: number
  // Permission props
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
  onSelect?: (tariff: ITariff | null) => void
  onCreateAction?: () => void
  clearRowSelectionSignal?: number
  onBulkDeleteRows?: (tariffs: ITariff[]) => void
  onBulkCloneRows?: (tariffs: ITariff[]) => void
}

export function TariffTable({
  data,
  isLoading = false,
  onDeleteAction,
  onEditAction,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  moduleId,
  transactionId,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
  onSelect,
  onCreateAction,
  clearRowSelectionSignal,
  onBulkDeleteRows,
  onBulkCloneRows,
}: TariffTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  // Define columns for the table
  const columns: ColumnDef<ITariff>[] = [
    {
      accessorKey: "taskName",
      header: "Task",
      cell: ({ row }) => <div>{row.getValue("taskName")}</div>,
      size: 100,
    },
    {
      accessorKey: "portName",
      header: "Port",
      cell: ({ row }) => <div>{row.getValue("portName")}</div>,
      size: 80,
    },

    {
      accessorKey: "chargeName",
      header: "Charge",
      size: 250,
    },
    {
      accessorKey: "visaName",
      header: "Visa Type",
      cell: ({ row }) => {
        return row.getValue("visaName") || ""
      },
      size: 120,
    },
    {
      accessorKey: "uomName",
      header: "UOM",
      size: 80,
    },
    {
      accessorKey: "fromLocationName",
      header: "From Location",
      size: 120,
    },
    {
      accessorKey: "toLocationName",
      header: "To Location",
      size: 120,
    },
    {
      accessorKey: "displayRate",
      header: "Display Rate",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("displayRate"), amtDec)}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "basicRate",
      header: "Basic Rate",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("basicRate"), amtDec)}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "minUnit",
      header: "Min Unit",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("minUnit"), amtDec)}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "maxUnit",
      header: "Max Unit",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("maxUnit"), amtDec)}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "isAdditional",
      header: "Is Additional",
      cell: ({ row }) => (
        <div className="flex justify-center overflow-hidden">
          {row.getValue("isAdditional") ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "additionalUnit",
      header: "Additional Unit",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("additionalUnit"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "additionalRate",
      header: "Additional Rate",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("additionalRate"), amtDec)}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "isPrepayment",
      header: "Is Prepayment",
      cell: ({ row }) => (
        <div className="flex justify-center overflow-hidden">
          {row.getValue("isPrepayment") ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "prepaymentPercentage",
      header: "Prepayment %",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("prepaymentPercentage"), 2)}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ row }) => (
        <div className="flex justify-center overflow-hidden">
          {row.getValue("isDefault") ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <div className="flex justify-center overflow-hidden">
          {row.getValue("isActive") ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: "createBy",
      header: "Created By Name",
    },
    {
      accessorKey: "createDate",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.original.createDate
          ? new Date(row.original.createDate)
          : null
        return date ? format(date, datetimeFormat) : "-"
      },
    },

    {
      accessorKey: "editBy",
      header: "Edited By Name",
    },
    {
      accessorKey: "editDate",
      header: "Edited Date",
      cell: ({ row }) => {
        const date = row.original.editDate
          ? new Date(row.original.editDate)
          : null
        return date ? format(date, datetimeFormat) : "-"
      },
    },
    {
      accessorKey: "editVersion",
      header: "Edit Version",
      cell: ({ row }) => {
        const version = row.getValue("editVersion") as number | null | undefined
        return version ? (
          <Badge variant="destructive" className="font-semibold">
            {version}
          </Badge>
        ) : (
          <Badge variant="outline" className="font-semibold">
            0
          </Badge>
        )
      },
    },
  ]

  // Handle delete with tariff object
  const handleDelete = (tariffId: string) => {
    if (onDeleteAction) {
      const tariff = data.find((t) => t.tariffId?.toString() === tariffId)
      if (tariff) {
        onDeleteAction(tariff)
      }
    }
  }

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.tariff}
      emptyMessage="No tariffs found."
      accessorId="tariffId"
      // Add handlers if provided
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      //handler column props
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={handleDelete}
      //show props
      showHeader={true}
      showFooter={true}
      showActions={true}
      // Permission props
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
      clearRowSelectionSignal={clearRowSelectionSignal}
      onBulkDeleteRows={onBulkDeleteRows}
      onBulkCloneRows={onBulkCloneRows}
    />
  )
}
