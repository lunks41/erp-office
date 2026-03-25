import { useEffect, useMemo, useState } from "react"
import { ICbBankReconFilter, ICbBankReconHd } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

import { CbBankRecon } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import { DialogDataTable } from "@/components/table/table-dialog"

export interface BankReconTableProps {
  onBankReconSelect: (selectedBankRecon: ICbBankReconHd | undefined) => void
  onFilterChange: (filters: ICbBankReconFilter) => void
  initialFilters?: ICbBankReconFilter
  isDialogOpen?: boolean
}

export default function BankReconTable({
  onBankReconSelect,
  onFilterChange,
  initialFilters,
  isDialogOpen = false,
}: BankReconTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbankrecon

  const today = useMemo(() => new Date(), [])
  const defaultStartDate = useMemo(
    () => format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
    [today]
  )
  const defaultEndDate = useMemo(
    () => format(lastDayOfMonth(today), "yyyy-MM-dd"),
    [today]
  )

  const form = useForm({
    defaultValues: {
      startDate: initialFilters?.startDate || defaultStartDate,
      endDate: initialFilters?.endDate || defaultEndDate,
      filterSearch: initialFilters?.search ?? "",
    },
  })

  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [hasSearched, setHasSearched] = useState(false)
  const [isAllTime, setIsAllTime] = useState(false)
  const [isAllTimeCommitted, setIsAllTimeCommitted] = useState(false)
  const [searchStartDate, setSearchStartDate] = useState<string | undefined>(
    initialFilters?.startDate
      ? formatDateForApi(initialFilters.startDate) || defaultStartDate
      : defaultStartDate
  )
  const [searchEndDate, setSearchEndDate] = useState<string | undefined>(
    initialFilters?.endDate
      ? formatDateForApi(initialFilters.endDate) || defaultEndDate
      : defaultEndDate
  )

  useEffect(() => {
    form.setValue("startDate", initialFilters?.startDate || defaultStartDate)
    form.setValue("endDate", initialFilters?.endDate || defaultEndDate)
    if (initialFilters?.search !== undefined) {
      setSearchQuery(initialFilters.search)
      form.setValue("filterSearch", initialFilters.search)
    }
    setSearchStartDate(
      initialFilters?.startDate
        ? formatDateForApi(initialFilters.startDate) || defaultStartDate
        : defaultStartDate
    )
    setSearchEndDate(
      initialFilters?.endDate
        ? formatDateForApi(initialFilters.endDate) || defaultEndDate
        : defaultEndDate
    )
  }, [initialFilters, form, defaultStartDate, defaultEndDate])

  useEffect(() => {
    if (isDialogOpen) setHasSearched(true)
  }, [isDialogOpen])

  const {
    data: bankReconsResponse,
    isLoading: isLoadingBankRecons,
    isRefetching: isRefetchingBankRecons,
    refetch: _refetchBankRecons,
  } = useGetWithDatesAndPagination<ICbBankReconHd>(
    `${CbBankRecon.get}`,
    TableName.cbBankRecon,
    searchQuery,
    isAllTimeCommitted ? "" : (searchStartDate ?? ""),
    isAllTimeCommitted ? "" : (searchEndDate ?? ""),
    currentPage,
    pageSize,
    isAllTimeCommitted,
    undefined,
    hasSearched
  )

  const data = bankReconsResponse?.data || []
  const totalRecords = bankReconsResponse?.totalRecords ?? data.length
  const isLoading = isLoadingBankRecons || isRefetchingBankRecons

  const formatNumber = (value: number, decimals: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const columns: ColumnDef<ICbBankReconHd>[] = [
    {
      accessorKey: "reconNo",
      header: "Reconciliation No",
    },
    {
      accessorKey: "accountDate",
      header: "Account Date",
      cell: ({ row }) => {
        const date = row.original.accountDate
          ? new Date(row.original.accountDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "bankName",
      header: "Bank Name",
      cell: ({ row }) => {
        return row.original.bankName || "-"
      },
    },
    {
      accessorKey: "prevReconNo",
      header: "Previous Reconciliation No",
    },
    {
      accessorKey: "totAmt",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "opBalAmt",
      header: "Opening Balance",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("opBalAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "clBalAmt",
      header: "Closing Balance",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("clBalAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "debitTotAmt",
      header: "Debit Total",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.original.debitTotAmt ?? 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "creditTotAmt",
      header: "Credit Total",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.original.creditTotAmt ?? 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "allocTotAmt",
      header: "Allocated Total",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.original.allocTotAmt ?? 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "unAllocTotAmt",
      header: "Unallocated Total",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.original.unAllocTotAmt ?? 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromDate",
      header: "From Date",
      cell: ({ row }) => {
        const date = row.original.fromDate
          ? new Date(row.original.fromDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "toDate",
      header: "To Date",
      cell: ({ row }) => {
        const date = row.original.toDate ? new Date(row.original.toDate) : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      accessorKey: "createById",
      header: "Created By",
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.createById}</div>
      ),
    },
    {
      accessorKey: "createDate",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.original.createDate
          ? new Date(row.original.createDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "editById",
      header: "Edited By",
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.editById || "-"}</div>
      ),
    },
    {
      accessorKey: "editDate",
      header: "Edited Date",
      cell: ({ row }) => {
        const date = row.original.editDate
          ? new Date(row.original.editDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "editVersion",
      header: "Version",
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.editVersion}</div>
      ),
    },
    {
      accessorKey: "isCancel",
      header: "Cancelled",
      cell: ({ row }) => (
        <div className="text-center">{row.original.isCancel ? "✓" : ""}</div>
      ),
    },
  ]

  const handleSearchBankRecon = () => {
    const filterSearchValue = form.getValues("filterSearch") ?? ""
    setSearchQuery(filterSearchValue)
    setIsAllTimeCommitted(isAllTime)

    const startDate = form.getValues("startDate")
    const endDate = form.getValues("endDate")
    const formattedStartDate = isAllTime
      ? ""
      : formatDateForApi(startDate) || ""
    const formattedEndDate = isAllTime ? "" : formatDateForApi(endDate) || ""

    setSearchStartDate(formattedStartDate)
    setSearchEndDate(formattedEndDate)
    setCurrentPage(1)
    setHasSearched(true)

    const newFilters: ICbBankReconFilter = {
      startDate: isAllTime ? "" : startDate,
      endDate: isAllTime ? "" : endDate,
      search: filterSearchValue,
      sortBy: "reconNo",
      sortOrder: "asc",
      pageNumber: 1,
      pageSize: pageSize,
    }
    onFilterChange(newFilters)
  }

  const _handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    const searchValue = filters.search || ""
    setSearchQuery(searchValue)
    if (onFilterChange) {
      const newFilters: ICbBankReconFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchValue,
        sortBy: "reconNo",
        sortOrder: (filters.sortOrder as "asc" | "desc") || "asc",
        pageNumber: currentPage,
        pageSize: pageSize,
      }
      onFilterChange(newFilters)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (onFilterChange) {
      onFilterChange({
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "reconNo",
        sortOrder: "asc",
        pageNumber: page,
        pageSize,
      })
    }
  }

  const handlePageSizeChange = (size: number) => {
    const nextSize = typeof size === "number" && size > 0 ? size : 10
    setPageSize(nextSize)
    setCurrentPage(1)
    if (onFilterChange) {
      onFilterChange({
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "reconNo",
        sortOrder: "asc",
        pageNumber: 1,
        pageSize: nextSize,
      })
    }
  }

  const handleClear = () => {
    form.setValue("startDate", defaultStartDate)
    form.setValue("endDate", defaultEndDate)
    form.setValue("filterSearch", "")
    setSearchQuery("")
    setIsAllTime(false)
    setIsAllTimeCommitted(false)
    setSearchStartDate(defaultStartDate)
    setSearchEndDate(defaultEndDate)
    setCurrentPage(1)
    setHasSearched(true)
    if (onFilterChange) {
      onFilterChange({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        search: "",
        sortBy: "reconNo",
        sortOrder: "asc",
        pageNumber: 1,
        pageSize,
      })
    }
  }

  return (
    <div className="w-full overflow-auto">
      <div className="bg-card mb-2 rounded-lg border p-3">
        <FormProvider {...form}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <span className="text-muted-foreground text-sm font-medium">
                  From:
                </span>
                <CustomDateNew
                  form={form}
                  name="startDate"
                  isRequired={!isAllTime}
                  size="sm"
                  isDisabled={isAllTime}
                />
              </div>
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <span className="text-muted-foreground text-sm font-medium">
                  To:
                </span>
                <CustomDateNew
                  form={form}
                  name="endDate"
                  isRequired={!isAllTime}
                  size="sm"
                  isDisabled={isAllTime}
                />
              </div>
            </div>

            <CustomInput
              form={form}
              name="filterSearch"
              placeholder="Search..."
              className="w-48"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={isAllTime}
                onCheckedChange={(checked) => setIsAllTime(checked === true)}
              />
              <span className="text-muted-foreground whitespace-nowrap">
                All data
              </span>
            </label>

            <Button
              variant="default"
              size="sm"
              onClick={handleSearchBankRecon}
              disabled={isLoading}
            >
              Search
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </FormProvider>
      </div>
      <Separator className="mb-4" />

      <DialogDataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.cbBankRecon}
        emptyMessage="No data found."
        onRowSelect={(row) => onBankReconSelect(row || undefined)}
        showSearch={false}
        serverSidePagination={true}
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
