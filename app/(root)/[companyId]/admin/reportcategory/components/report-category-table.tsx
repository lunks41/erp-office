"use client"

import { IReportCategory } from "@/interfaces/admin"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface ReportCategoryTableProps {
  data: IReportCategory[]
  isLoading?: boolean
  onSelect?: (row: IReportCategory | null) => void
  onDeleteAction?: (repCategoryId: string) => void
  onEditAction?: (row: IReportCategory) => void
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

export function ReportCategoryTable({
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
}: ReportCategoryTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<IReportCategory>[] = [
    {
      accessorKey: "repCategoryCode",
      header: "Code",
      size: 120,
      enableColumnFilter: true,
    },
    {
      accessorKey: "repCategoryName",
      header: "Name",
      size: 200,
      enableColumnFilter: true,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      size: 220,
    },
    {
      accessorKey: "createBy",
      header: "Create By",
      size: 120,
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
    {
      accessorKey: "editBy",
      header: "Edit By",
      size: 120,
    },
    {
      accessorKey: "editDate",
      header: "Edit Date",
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        let date: Date | null = null
        if (typeof raw === "string") date = new Date(raw)
        else if (raw instanceof Date) date = raw
        return date && isValid(date) ? format(date, datetimeFormat) : "—"
      },
      size: 170,
    },
    {
      accessorKey: "repCategoryId",
      header: "ID",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.repCategoryId}</Badge>
      ),
      size: 72,
    },
  ]

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.admReportCategory}
      emptyMessage="No report categories found."
      accessorId="repCategoryId"
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
