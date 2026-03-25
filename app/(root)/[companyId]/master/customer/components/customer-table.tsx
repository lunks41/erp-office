"use client"

import { ICustomer, ICustomerFilter } from "@/interfaces/customer"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { DialogDataTable } from "@/components/table/table-dialog"

interface CustomerTableProps {
  data: ICustomer[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (customer: ICustomer | null) => void
  onFilterChange?: (filters: ICustomerFilter) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  serverSidePagination?: boolean
  initialSearchValue?: string // Initial search value to sync with parent filters
  onRefreshAction?: () => void
  moduleId: number
  transactionId: number
}

export function CustomerTable({
  data,
  isLoading = false,
  totalRecords = 0,
  onSelect,
  onFilterChange,
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
  pageSize = 50,
  serverSidePagination = false,
  initialSearchValue,
  onRefreshAction,
  moduleId,
  transactionId,
}: CustomerTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<ICustomer>[] = [
    {
      accessorKey: "customerCode",
      header: "Code",
      size: 120,
      minSize: 50,

      enableColumnFilter: true,
    },
    {
      accessorKey: "customerName",
      header: "Name",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },

    {
      accessorKey: "customerRegNo",
      header: "Registration No",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "creditTermName",
      header: "Credit Term",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "bankName",
      header: "Bank",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "currencyName",
      header: "Currency",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "accSetupName",
      header: "Account Setup",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "supplierName",
      header: "Supplier",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "customerOtherName",
      header: "Other Name",
      size: 200,
      minSize: 50,
    },
    {
      accessorKey: "customerShortName",
      header: "Short Name",
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

  // Handle filter change for dialog table - convert generic filters to ICustomerFilter
  const handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    if (onFilterChange) {
      const newFilters: ICustomerFilter = {
        search: filters.search,
        sortOrder: filters.sortOrder as "asc" | "desc" | undefined,
      }
      onFilterChange(newFilters)
    }
  }

  // Original table implementation for backward compatibility
  return (
    <div className="w-full overflow-auto">
      <DialogDataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        totalRecords={totalRecords}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.customer}
        emptyMessage="No customers found."
        onRefreshAction={onRefreshAction}
        onFilterChange={handleDialogFilterChange}
        initialSearchValue={initialSearchValue}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        currentPage={currentPage}
        pageSize={pageSize}
        serverSidePagination={serverSidePagination}
        onRowSelect={onSelect}
      />
    </div>
  )
}
