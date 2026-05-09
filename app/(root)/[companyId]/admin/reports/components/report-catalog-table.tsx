"use client"

import { IReportCatalogGridRow } from "@/interfaces/admin"
import { useCompanyStore } from "@/stores/company-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface ReportCatalogTableProps {
  data: IReportCatalogGridRow[]
  isLoading?: boolean
  onSelect?: (row: IReportCatalogGridRow | null) => void
  onDeleteAction?: (catalogRowKey: string) => void
  onEditAction?: (row: IReportCatalogGridRow) => void
  onCreateAction?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string
  moduleId?: number
  transactionId?: number
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
}

export function ReportCatalogTable({
  data,
  isLoading = false,
  onSelect,
  onDeleteAction,
  onEditAction,
  onCreateAction,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  moduleId,
  transactionId,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
}: ReportCatalogTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<IReportCatalogGridRow>[] = [
    {
      accessorKey: "moduleName",
      header: "Module",
      size: 140,
      enableColumnFilter: true,
    },
    {
      accessorKey: "transactionName",
      header: "Transaction",
      size: 160,
    },
    {
      accessorKey: "reportName",
      header: "Report",
      size: 180,
      enableColumnFilter: true,
    },
    {
      accessorKey: "repCategoryName",
      header: "Category",
      size: 140,
    },
    {
      accessorKey: "reportFileName",
      header: "File",
      size: 140,
    },
    {
      accessorKey: "seqNo",
      header: "Seq",
      size: 64,
    },
    {
      accessorKey: "reportId",
      header: "Rep #",
      size: 72,
    },
    {
      accessorKey: "itemNo",
      header: "Item",
      size: 56,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isActive") ? "default" : "destructive"}>
          {row.getValue("isActive") ? (
            <IconCircleCheckFilled className="mr-1 size-3 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 size-3 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isActive") ? "Active" : "Inactive"}
        </Badge>
      ),
      size: 110,
    },
    {
      accessorKey: "createBy",
      header: "Create By",
      size: 110,
    },
    {
      accessorKey: "createDate",
      header: "Create Date",
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        let date: Date | null = null
        if (typeof raw === "string") date = new Date(raw)
        else if (raw instanceof Date) date = raw
        return date && isValid(date) ? format(date, datetimeFormat) : "—"
      },
      size: 170,
    },
  ]

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.admReports}
      emptyMessage="No reports configured."
      accessorId="catalogRowKey"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={onDeleteAction}
      showHeader={true}
      showFooter={true}
      showActions={true}
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
    />
  )
}
