"use client"

import { IGeoLocation } from "@/interfaces/geolocation"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"

interface GeoLocationsTableProps {
  data: IGeoLocation[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (geolocation: IGeoLocation | null) => void
  onDeleteAction?: (geolocationId: string) => void
  onEditAction?: (geolocation: IGeoLocation) => void
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

export function GeoLocationsTable({
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
}: GeoLocationsTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<IGeoLocation>[] = [
    {
      accessorKey: "geoLocationCode",
      header: "Code",
      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "geoLocationName",
      header: "Name",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "portName",
      header: "Port",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "latitude",
      header: "Latitude",
      size: 120,
      minSize: 50,
      cell: ({ row }) => {
        const value = row.getValue("latitude") as string | null
        return <span>{value || "-"}</span>
      },
    },
    {
      accessorKey: "longitude",
      header: "Longitude",
      size: 120,
      minSize: 50,
      cell: ({ row }) => {
        const value = row.getValue("longitude") as string | null
        return <span>{value || "-"}</span>
      },
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      size: 250,
      minSize: 50,
      cell: ({ row }) => {
        const value = row.getValue("remarks") as string | null
        return <span>{value || "-"}</span>
      },
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
      cell: ({ row }) => {
        const value = row.getValue("editBy") as string | null
        return <span>{value || "-"}</span>
      },
    },
    {
      accessorKey: "editDate",
      header: "Edit Date",
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        if (!raw) return "-"
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
      tableName={TableName.geoLocation}
      emptyMessage="No geo locations found."
      accessorId="geoLocationId"
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
