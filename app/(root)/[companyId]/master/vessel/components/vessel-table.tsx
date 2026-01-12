"use client"

import { IVessel } from "@/interfaces/vessel"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { MainTable } from "@/components/table/table-main"

interface VesselTableProps {
  data: IVessel[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (vessel: IVessel | null) => void
  onDeleteAction?: (vesselId: string) => void
  onEditAction?: (vessel: IVessel) => void
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

export function VesselTable({
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
}: VesselTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  console.log("data", data)

  const columns: ColumnDef<IVessel>[] = [
    {
      accessorKey: "vesselCode",
      header: "Code",
      size: 120,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "vesselName",
      header: "Name",
      size: 200,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "vesselType",
      header: "Type",
      cell: ({ row }) => <div>{row.getValue("vesselType") || "-"}</div>,
      size: 80,
      minSize: 50,
    },
    {
      accessorKey: "callSign",
      header: "Call Sign",
      cell: ({ row }) => <div>{row.getValue("callSign") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "imoCode",
      header: "IMO Code",
      cell: ({ row }) => <div>{row.getValue("imoCode") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "grt",
      header: "GRT",
      cell: ({ row }) => <div>{row.getValue("grt") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "nrt",
      header: "NRT",
      cell: ({ row }) => {
        const value = row.getValue("nrt") as number | null | undefined
        return <div>{value != null ? value.toFixed(2) : "-"}</div>
      },
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "loa",
      header: "LOA",
      cell: ({ row }) => {
        const value = row.getValue("loa") as number | null | undefined
        return <div>{value != null ? value.toFixed(2) : "-"}</div>
      },
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "dwt",
      header: "DWT",
      cell: ({ row }) => {
        const value = row.getValue("dwt") as number | null | undefined
        return <div>{value != null ? value.toFixed(2) : "-"}</div>
      },
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "licenseNo",
      header: "License No",
      cell: ({ row }) => <div>{row.getValue("licenseNo") || "-"}</div>,
      size: 150,
      minSize: 50,
    },
    {
      accessorKey: "flag",
      header: "Flag",
      cell: ({ row }) => <div>{row.getValue("flag") || "-"}</div>,
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
        <div className="flex justify-center">
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
      tableName={TableName.vessel}
      emptyMessage="No vessels found."
      accessorId="vesselId"
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
