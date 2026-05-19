"use client"

import { useCallback, useEffect, useState } from "react"
import { useCompanyStore } from "@/stores/company-store"

import { IBank, IBankFilter } from "@/interfaces/bank"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DialogDataTable } from "@/components/table/table-dialog"
import { MasterTableSearchBar } from "@/components/table/master-table-search-bar"

interface BankTableProps {
  data: IBank[]
  isLoading?: boolean
  totalRecords?: number
  onSelect?: (bank: IBank | null) => void
  onFilterChange?: (filters: IBankFilter) => void
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

export function BankTable({
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
}: BankTableProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const [searchInput, setSearchInput] = useState(initialSearchValue ?? "")

  useEffect(() => {
    setSearchInput(initialSearchValue ?? "")
  }, [initialSearchValue])

  const handleSearchClick = useCallback(() => {
    onFilterChange?.({
      search: searchInput.trim() || undefined,
    })
  }, [onFilterChange, searchInput])

  const handleClearSearch = useCallback(() => {
    setSearchInput("")
    onFilterChange?.({ search: "" })
  }, [onFilterChange])

  const columns: ColumnDef<IBank>[] = [
    {
      accessorKey: "bankCode",
      header: "Code",
      size: 120,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "bankName",
      header: "Name",
      size: 200,
      minSize: 50,
      enableColumnFilter: true,
    },
    {
      accessorKey: "accountNo",
      header: "Account No",
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "swiftCode",
      header: "Swift Code",
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
      accessorKey: "isOwnBank",
      header: "Is Own Bank",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isOwnBank") ? "default" : "secondary"}>
          {row.getValue("isOwnBank") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isOwnBank") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "isPettyCashBank",
      header: "Is Petty Cash",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isPettyCashBank") ? "default" : "secondary"}
        >
          {row.getValue("isPettyCashBank") ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconSquareRoundedXFilled className="mr-1 fill-red-500 dark:fill-red-400" />
          )}
          {row.getValue("isPettyCashBank") ? "Yes" : "No"}
        </Badge>
      ),
      size: 120,
      minSize: 50,
    },
    {
      accessorKey: "remarks1",
      header: "Remarks 1",
      size: 200,
      minSize: 50,
    },
    {
      accessorKey: "remarks2",
      header: "Remarks 2",
      size: 200,
      minSize: 50,
    },
    {
      accessorKey: "remarks3",
      header: "Remarks 3",
      size: 200,
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
      const newFilters: IBankFilter = {
        search: filters.search ?? initialSearchValue,
        sortOrder: filters.sortOrder as "asc" | "desc" | undefined,
      }
      onFilterChange(newFilters)
    }
  }

  return (
    <div className="w-full overflow-auto">
      {serverSidePagination && (
        <MasterTableSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearchClick}
          onClear={handleClearSearch}
          isLoading={isLoading}
        />
      )}
      <DialogDataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        totalRecords={totalRecords}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.bank}
        emptyMessage="No banks found."
        onRefreshAction={onRefreshAction}
        onFilterChange={handleDialogFilterChange}
        initialSearchValue={initialSearchValue}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        currentPage={currentPage}
        pageSize={pageSize}
        serverSidePagination={serverSidePagination}
        externalSearch={serverSidePagination}
        onRowSelect={onSelect}
      />
    </div>
  )
}
