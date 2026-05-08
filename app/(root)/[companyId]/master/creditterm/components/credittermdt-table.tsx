"use client"

import { useCompanyStore } from "@/stores/company-store"

import { ICreditTermDt } from "@/interfaces/creditterm"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

interface CreditTermDtsTableProps {
  data: ICreditTermDt[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (creditTermDt: ICreditTermDt | null) => void
  onDeleteAction?: (creditTermId: string) => void
  onEditAction?: (creditTermDt: ICreditTermDt) => void
  onCreateAction?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  serverSidePagination?: boolean
  moduleId?: number
  transactionId?: number
  // Permission props
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export function CreditTermDtsTable({
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
  moduleId,
  transactionId,
  // Permission props
  canView = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: CreditTermDtsTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<ICreditTermDt>[] = [
    {
      accessorKey: "creditTermName",
      header: "Name",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "creditTermCode",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("creditTermCode")}</div>
      ),
      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "fromDay",
      header: "From Day",
      cell: ({ row }) => <div>{row.getValue("fromDay") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "toDay",
      header: "To Day",
      cell: ({ row }) => <div>{row.getValue("toDay") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "dueDay",
      header: "Due Day",
      cell: ({ row }) => <div>{row.getValue("dueDay") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "noMonth",
      header: "Number of Months",
      cell: ({ row }) => <div>{row.getValue("noMonth") || "-"}</div>,
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isEndOfMonth",
      header: "End of Month",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isEndOfMonth") ? "default" : "destructive"}
        >
          {row.getValue("isEndOfMonth") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isEndOfMonth") ? "Yes" : "No"}
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
        if (typeof raw === "string") {
          date = new Date(raw)
        } else if (raw instanceof Date) {
          date = raw
        }
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
        if (typeof raw === "string") {
          date = new Date(raw)
        } else if (raw instanceof Date) {
          date = raw
        }
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
      tableName={TableName.creditTermDt}
      emptyMessage="No credit term details found."
      accessorId="creditTermId"
      // Add handlers if provided
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
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
