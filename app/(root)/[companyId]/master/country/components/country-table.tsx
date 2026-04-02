"use client"

import { ICountry } from "@/interfaces/country"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"

interface CountriesTableProps {
  data: ICountry[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (country: ICountry | null) => void
  onCreateAction?: () => void
  onEditAction?: (country: ICountry) => void
  onDeleteAction?: (countryId: string) => void
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
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export function CountriesTable({
  data,
  isLoading = false,
  totalRecords = 0,
  onSelect,
  onCreateAction,
  onEditAction,
  onDeleteAction,
  onRefreshAction,
  onFilterChange,
  onPageChange,
  onPageSizeChange,
  currentPage,
  pageSize,
  serverSidePagination,
  moduleId,
  transactionId,
  initialSearchValue,
  // Permission props
  canView = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: CountriesTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<ICountry>[] = [
    {
      accessorKey: "countryCode",
      header: "Code",
      size: 120,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "countryName",
      header: "Name",
      size: 200,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "phoneCode",
      header: "Phone Code",
      cell: ({ row }) => <div>{row.getValue("phoneCode") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",

      size: 250,
      minSize: 50,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex justify-center overflow-hidden">
          {row.getValue("isActive") ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
      size: 120,
      minSize: 50,
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
      tableName={TableName.country}
      emptyMessage="No countries found."
      accessorId="countryId"
      // Add handlers if provided
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      currentPage={currentPage}
      pageSize={pageSize}
      serverSidePagination={serverSidePagination}
      //handler column props
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={onDeleteAction}
      //show props
      showHeader={true}
      showFooter={true}
      showActions={true}
      hideSearch={true}
      // Permission props

      canView={canView}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  )
}
