"use client"

import { IBarge } from "@/interfaces/barge"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface BargeTableProps {
  data: IBarge[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (barge: IBarge | null) => void
  onDeleteAction?: (bargeId: string) => void
  onEditAction?: (barge: IBarge) => void
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

export function BargeTable({
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
  moduleId,
  transactionId,
  // Permission props
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
}: BargeTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<IBarge>[] = [
    {
      accessorKey: "bargeCode",
      header: "Code",

      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "bargeName",
      header: "Name",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "callSign",
      header: "Call Sign",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "imoCode",
      header: "IMO Code",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "grt",
      header: "GRT",

      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "licenseNo",
      header: "License No",

      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "bargeType",
      header: "Type",

      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "flag",
      header: "Flag",

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
      accessorKey: "isOwn",
      header: "Own Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isOwn") ? "default" : "destructive"}>
          {row.getValue("isOwn") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isOwn") ? "Active" : "Inactive"}
        </Badge>
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
      tableName={TableName.barge}
      emptyMessage="No barges found."
      accessorId="bargeId"
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
      // Permission props
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
    />
  )
}
