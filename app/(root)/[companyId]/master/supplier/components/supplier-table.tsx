"use client"

import { ISupplier, ISupplierFilter } from "@/interfaces/supplier"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DialogDataTable } from "@/components/table/table-dialog"

interface SupplierTableProps {
  data: ISupplier[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (supplier: ISupplier | null) => void
  onFilterChange?: (filters: ISupplierFilter) => void
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

export function SupplierTable({
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
}: SupplierTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const columns: ColumnDef<ISupplier>[] = [
    {
      accessorKey: "supplierCode",
      header: "Code",
      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "supplierName",
      header: "Name",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "supplierOtherName",
      header: "Other Name",
      size: 200,
      minSize: 50,
    },
    {
      accessorKey: "supplierShortName",
      header: "Short Name",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "supplierRegNo",
      header: "Supplier Reg No (TRN No.)",
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
      accessorKey: "bankName",
      header: "Bank",
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
      accessorKey: "accSetupName",
      header: "Account Setup",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "parentSupplierName",
      header: "Parent Supplier",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isCustomer",
      header: "Is Customer",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isCustomer") ? "default" : "secondary"}>
          {row.getValue("isCustomer") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isCustomer") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isVendor",
      header: "Is Vendor",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isVendor") ? "default" : "secondary"}>
          {row.getValue("isVendor") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isVendor") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isTrader",
      header: "Is Trader",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isTrader") ? "default" : "secondary"}>
          {row.getValue("isTrader") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isTrader") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isSupplier",
      header: "Is Supplier",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isSupplier") ? "default" : "secondary"}>
          {row.getValue("isSupplier") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isSupplier") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isDiffGstGl",
      header: "Diff VAT GL",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isDiffGstGl") ? "default" : "secondary"}>
          {row.getValue("isDiffGstGl") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isDiffGstGl") ? "Yes" : "No"}
        </Badge>
      ),
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
      const newFilters: ISupplierFilter = {
        search: filters.search,
        sortOrder: filters.sortOrder as "asc" | "desc" | undefined,
      }
      onFilterChange(newFilters)
    }
  }

  return (
    <div className="w-full overflow-auto">
      <DialogDataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        totalRecords={totalRecords}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.supplier}
        emptyMessage="No suppliers found."
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
