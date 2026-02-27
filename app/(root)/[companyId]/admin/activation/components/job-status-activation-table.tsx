"use client"

import { IJobOrderStatus } from "@/interfaces/admin"
import { ColumnDef } from "@tanstack/react-table"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MainTable } from "@/components/table/table-main"
import { TableName } from "@/lib/utils"

interface JobStatusActivationTableProps {
  data: IJobOrderStatus[]
  isLoading?: boolean
  onEdit?: (job: IJobOrderStatus) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string
}

export function JobStatusActivationTable({
  data,
  isLoading = false,
  onEdit,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
}: JobStatusActivationTableProps) {
  const columns: ColumnDef<IJobOrderStatus>[] = [
    {
      id: "action",
      header: "Action",
      enableHiding: false,
      size: 100,
      minSize: 80,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onEdit?.(row.original)}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      ),
    },
    {
      accessorKey: "jobOrderNo",
      header: "Document NO",
      size: 140,
      minSize: 80,
      maxSize: 200,
    },
    {
      accessorKey: "jobOrderId",
      header: "RefNO",
      size: 100,
      minSize: 60,
      cell: ({ row }) => String(row.getValue("jobOrderId") ?? ""),
    },
    {
      accessorKey: "vesselName",
      header: "Vessel",
      size: 160,
      minSize: 80,
      cell: ({ row }) => {
        const name = row.original.vesselName
        return name?.trim() ? name : "-"
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      size: 160,
      minSize: 80,
      cell: ({ row }) => {
        const name = row.original.customerName
        return name?.trim() ? name : "-"
      },
    },
    {
      accessorKey: "jobStatusName",
      header: "Job Status",
      size: 140,
      minSize: 80,
      cell: ({ row }) => {
        const name = row.original.jobStatusName
        return name?.trim() ? name : "-"
      },
    },
  ]

  return (
    <MainTable<IJobOrderStatus>
      data={data}
      columns={columns}
      isLoading={isLoading}
      tableName={TableName.jobStatus}
      emptyMessage="No job orders found."
      accessorId="jobOrderId"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      showHeader={true}
      showFooter={true}
      showActions={false}
    />
  )
}
