"use client"

import { ITariffDt } from "@/interfaces/tariff"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"

import { formatNumber } from "@/lib/format-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface TariffDetailsTableProps {
  data: ITariffDt[]
  isLoading?: boolean
  onDeleteAction?: (detail: ITariffDt) => void
  onEditAction?: (detail: ITariffDt) => void
  onRefreshAction?: () => void
  // Permission props
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
  onSelect?: (detail: ITariffDt | null) => void
  onCreateAction?: () => void
  createButtonText?: string // Custom text for create button
}

export function TariffDetailsTable({
  data,
  isLoading = false,
  onDeleteAction,
  onEditAction,
  onRefreshAction,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
  onSelect,
  onCreateAction,
  createButtonText = "Add Detail",
}: TariffDetailsTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2

  // Define columns for the table
  const columns: ColumnDef<ITariffDt>[] = [
    {
      accessorKey: "itemNo",
      header: "Item No",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">{row.getValue("itemNo")}</Badge>
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "displayRate",
      header: "Display Rate",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("displayRate"), amtDec)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "basicRate",
      header: "Basic Rate",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("basicRate"), amtDec)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "minUnit",
      header: "Min Unit",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("minUnit"), amtDec)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "maxUnit",
      header: "Max Unit",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("maxUnit"), amtDec)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "isAdditional",
      header: "Additional",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={row.getValue("isAdditional") ? "default" : "secondary"}>
            {row.getValue("isAdditional") ? "Yes" : "No"}
          </Badge>
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "additionalUnit",
      header: "Additional Unit",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("additionalUnit"), amtDec)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "additionalRate",
      header: "Additional Rate",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("additionalRate"), amtDec)}
        </div>
      ),
      size: 120,
    },
  ]

  // Handle delete with detail object
  const handleDelete = (itemNo: string) => {
    if (onDeleteAction) {
      const detail = data.find((d) => d.itemNo?.toString() === itemNo)
      if (detail) {
        onDeleteAction(detail)
      }
    }
  }

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      tableName={TableName.template}
      emptyMessage="No tariff details found."
      accessorId="itemNo"
      // Add handlers if provided
      onRefreshAction={onRefreshAction}
      //handler column props
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      createButtonText={createButtonText}
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
    />
  )
}
