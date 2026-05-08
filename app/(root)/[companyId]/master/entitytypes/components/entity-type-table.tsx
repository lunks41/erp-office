"use client"

import { useCompanyStore } from "@/stores/company-store"

import { IEntityType } from "@/interfaces/entitytype"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"
import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"

interface EntityTypesTableProps {
  data: IEntityType[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (entityType: IEntityType | null) => void
  onDeleteAction?: (entityTypeId: string) => void
  onEditAction?: (entityType: IEntityType) => void
  onCreateAction?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  serverSidePagination?: boolean
  initialSearchValue?: string // Initial search value to sync with parent filters
  moduleId?: number
  transactionId?: number
  // Permission props
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
}

export function EntityTypesTable({
  data,
  isLoading = false,
  totalRecords = 0,
  onSelect,
  onDeleteAction,
  onEditAction,
  onCreateAction,
  onRefreshAction,
  onFilterChange,
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
  pageSize = 50,
  serverSidePagination = false,
  initialSearchValue,
  moduleId = 1,
  transactionId = 1,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
}: EntityTypesTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<IEntityType>[] = [
    {
      accessorKey: "entityTypeCode",
      header: "Code",
      size: 120,
      minSize: 100,
      maxSize: 150,
    },
    {
      accessorKey: "entityTypeName",
      header: "Name",
      size: 250,
      minSize: 200,
      maxSize: 300,
    },

    {
      accessorKey: "createBy",
      header: "Create By",

      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "createDate",
      header: "Create Date",
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        let date: Date | null = null
        if (typeof raw === "string") date = new Date(raw)
        else if (raw instanceof Date) date = raw
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
      size: 180,
      minSize: 150,
    },
    {
      accessorKey: "editBy",
      header: "Edit By",

      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "editDate",
      header: "Edit Date",
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        let date: Date | null = null
        if (typeof raw === "string") date = new Date(raw)
        else if (raw instanceof Date) date = raw
        return date && isValid(date) ? format(date, datetimeFormat) : "-"
      },
      size: 180,
      minSize: 150,
    },
  ]

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      totalRecords={totalRecords}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.entityTypes}
      accessorId="entityTypeId"
      onSelect={onSelect}
      onEditAction={onEditAction}
      onDeleteAction={onDeleteAction}
      onCreateAction={onCreateAction}
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      currentPage={currentPage}
      pageSize={pageSize}
      serverSidePagination={serverSidePagination}
      hideSearch={true}
      canView={canView}
      canEdit={canEdit}
      canDelete={canDelete}
      canCreate={canCreate}
      emptyMessage="No entity types found. Create your first entity type!"
    />
  )
}
