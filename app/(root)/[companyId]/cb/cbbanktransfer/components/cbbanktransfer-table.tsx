import { useEffect, useMemo, useState } from "react"
import { ICbBankTransfer, ICbBankTransferFilter } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"

import { CbBankTransfer } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DialogDataTable } from "@/components/table/table-dialog"

export interface BankTransferTableProps {
  onBankTransferSelect: (
    selectedBankTransfer: ICbBankTransfer | undefined
  ) => void
  onFilterChange: (filters: ICbBankTransferFilter) => void
  initialFilters?: ICbBankTransferFilter
  pageSize: number
}

const DEFAULT_PAGE_SIZE = 15

export default function BankTransferTable({
  onBankTransferSelect,
  onFilterChange,
  initialFilters,
  pageSize: _pageSize,
}: BankTransferTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 9
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbanktransfer

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
    },
  })

  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(
    typeof _pageSize === "number" && _pageSize > 0
      ? _pageSize
      : DEFAULT_PAGE_SIZE
  )

  // State to track if search has been clicked
  const [hasSearched, setHasSearched] = useState(false)
  // Store the actual search dates - initialize from initialFilters if available
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

  // Update form values when initialFilters change (when dialog reopens)
  useEffect(() => {
    form.setValue("startDate", initialFilters?.startDate || defaultStartDate)
    form.setValue("endDate", initialFilters?.endDate || defaultEndDate)
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

    const sizeFromFilters =
      typeof initialFilters?.pageSize === "number" &&
      initialFilters.pageSize > 0
        ? initialFilters.pageSize
        : typeof _pageSize === "number" && _pageSize > 0
          ? _pageSize
          : DEFAULT_PAGE_SIZE
    setPageSize(sizeFromFilters)

    // Update searchQuery when initialFilters change
    if (initialFilters?.search !== undefined) {
      setSearchQuery(initialFilters.search)
    }
  }, [initialFilters, form, defaultStartDate, defaultEndDate, _pageSize])

  // Update searchQuery when initialFilters.search changes (separate effect to avoid conflicts)
  useEffect(() => {
    if (
      initialFilters?.search !== undefined &&
      initialFilters.search !== searchQuery
    ) {
      setSearchQuery(initialFilters.search)
    }
  }, [initialFilters?.search, searchQuery])

  // Data fetching - only after search button is clicked OR if dates are already set
  const {
    data: bankTransfersResponse,
    isLoading: isLoadingBankTransfers,
    isRefetching: isRefetchingBankTransfers,
    refetch: refetchBankTransfers,
  } = useGetWithDatesAndPagination<ICbBankTransfer>(
    `${CbBankTransfer.get}`,
    TableName.cbBankTransfer,
    searchQuery,
    searchStartDate,
    searchEndDate,
    currentPage,
    pageSize,
    undefined, // options
    hasSearched || Boolean(searchStartDate && searchEndDate) // enabled: If searched OR dates already set
  )

  const data = bankTransfersResponse?.data || []
  const totalRecords = bankTransfersResponse?.totalRecords || data.length
  const isLoading = isLoadingBankTransfers || isRefetchingBankTransfers

  const columns: ColumnDef<ICbBankTransfer>[] = [
    {
      accessorKey: "transferNo",
      header: "Transfer No",
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
      accessorKey: "fromBankName",
      header: "From Bank Name",
    },
    {
      accessorKey: "fromCurrencyCode",
      header: "From Currency Code",
    },
     {
      accessorKey: "fromTotAmt",
      header: "From Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromTotAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromTotLocalAmt",
      header: "From Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromTotLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toBankName",
      header: "To Bank Name",
    },
    {
      accessorKey: "toCurrencyCode",
      header: "To Currency Code",
    },
    {
      accessorKey: "chequeNo",
      header: "Cheque No",
    },
    {
      accessorKey: "chequeDate",
      header: "Cheque Date",
      cell: ({ row }) => {
        const date = row.original.chequeDate
          ? new Date(row.original.chequeDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "jobOrderNo",
      header: "Job Order No",
    },
    {
      accessorKey: "taskName",
      header: "Task Name",
    },
    {
      accessorKey: "serviceItemNoName",
      header: "Service Name",
    },
    {
      accessorKey: "fromBankCode",
      header: "From Bank Code",
    },
   
    {
      accessorKey: "fromCurrencyName",
      header: "From Currency Name",
    },
     {
      accessorKey: "remarks",
      header: "Remarks",
    },
    
    {
      accessorKey: "fromExhRate",
      header: "From Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromExhRate"), exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromBankChgGLCode",
      header: "From Bank Charge GL Code",
    },
    {
      accessorKey: "fromBankChgGLName",
      header: "From Bank Charge GL Name",
    },
    {
      accessorKey: "fromBankChgAmt",
      header: "From Bank Charge Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromBankChgAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromBankChgLocalAmt",
      header: "From Bank Charge Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromBankChgLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromTotAmt",
      header: "From Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromTotAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromTotLocalAmt",
      header: "From Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromTotLocalAmt"), locAmtDec)}
        </div>
      ),
    },
     {
      accessorKey: "toBankCode",
      header: "To Bank Code",
    },
   
    {
      accessorKey: "toCurrencyName",
      header: "To Currency Name",
    },
    {
      accessorKey: "toExhRate",
      header: "To Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("toExhRate"), exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "toBankChgGLCode",
      header: "To Bank Charge GL Code",
    },
    {
      accessorKey: "toBankChgGLName",
      header: "To Bank Charge GL Name",
    },
    {
      accessorKey: "toBankChgAmt",
      header: "To Bank Charge Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("toBankChgAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toBankChgLocalAmt",
      header: "To Bank Charge Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("toBankChgLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toTotAmt",
      header: "To Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("toTotAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toTotLocalAmt",
      header: "To Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("toTotLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankExhRate",
      header: "Bank Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("bankExhRate"), exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankTotAmt",
      header: "Bank Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("bankTotAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankTotLocalAmt",
      header: "Bank Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("bankTotLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "exhGainLoss",
      header: "Exchange Gain/Loss",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("exhGainLoss"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "referenceNo",
      header: "Reference No",
    },
    {
      accessorKey: "payeeTo",
      header: "Payee To",
    },
    {
      accessorKey: "createBy",
      header: "Created By",
    },
    {
      accessorKey: "createDate",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.original.createDate
          ? new Date(row.original.createDate)
          : null
        return date ? format(date, datetimeFormat) : "-"
      },
    },
    {
      accessorKey: "editBy",
      header: "Edited By",
    },
    {
      accessorKey: "editDate",
      header: "Edited Date",
      cell: ({ row }) => {
        const date = row.original.editDate
          ? new Date(row.original.editDate)
          : null
        return date ? format(date, datetimeFormat) : "-"
      },
    },
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
  ]

  const handleSearchInvoice = () => {
    const startDate = form.getValues("startDate")
    const endDate = form.getValues("endDate")

    // Format dates to yyyy-MM-dd format for API
    const formattedStartDate = formatDateForApi(startDate) || ""
    const formattedEndDate = formatDateForApi(endDate) || ""

    // Store the search dates (formatted for API)
    setSearchStartDate(formattedStartDate)
    setSearchEndDate(formattedEndDate)
    setHasSearched(true) // Enable the query
    setCurrentPage(1) // Reset to first page when searching

    const newFilters: ICbBankTransferFilter = {
      startDate: startDate,
      endDate: endDate,
      search: searchQuery,
      sortBy: "transferNo",
      sortOrder: "asc",
      pageNumber: 1, // Always start from page 1 when searching
      pageSize: pageSize,
    }
    onFilterChange(newFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // The query will automatically refetch due to query key change
    if (onFilterChange) {
      const newFilters: ICbBankTransferFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "transferNo",
        sortOrder: "asc",
        pageNumber: page,
        pageSize: pageSize,
      }
      onFilterChange(newFilters)
    }
  }

  const handlePageSizeChange = (size: number) => {
    const nextSize =
      typeof size === "number" && size > 0 ? size : DEFAULT_PAGE_SIZE
    setPageSize(nextSize)
    setCurrentPage(1) // Reset to first page when changing page size
    // The query will automatically refetch due to query key change
    if (onFilterChange) {
      const newFilters: ICbBankTransferFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "transferNo",
        sortOrder: "asc",
        pageNumber: 1,
        pageSize: nextSize,
      }
      onFilterChange(newFilters)
    }
  }

  const handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    // Update local searchQuery state when search changes from dialog
    const searchValue = filters.search || ""
    setSearchQuery(searchValue)

    if (onFilterChange) {
      const newFilters: ICbBankTransferFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchValue,
        sortBy: "transferNo",
        sortOrder: (filters.sortOrder as "asc" | "desc") || "asc",
        pageNumber: currentPage,
        pageSize: pageSize,
      }
      onFilterChange(newFilters)
    }
  }

  return (
    <div className="w-full overflow-auto">
      {/* Compact Filter Section */}
      <div className="bg-card mb-2 rounded-lg border p-3">
        <FormProvider {...form}>
          <div className="flex items-center gap-3">
            {/* Date Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-medium">
                  From:
                </span>
                <CustomDateNew
                  form={form}
                  name="startDate"
                  isRequired={true}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-medium">
                  To:
                </span>
                <CustomDateNew
                  form={form}
                  name="endDate"
                  isRequired={true}
                  size="sm"
                />
              </div>
            </div>

            {/* Search Button */}
            <Button
              variant="default"
              size="sm"
              onClick={handleSearchInvoice}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </FormProvider>
      </div>

      <DialogDataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.cbBankTransfer}
        emptyMessage="No bank transfers found matching your criteria. Try adjusting the date range or search terms."
        onRefreshAction={() => refetchBankTransfers()}
        onFilterChange={handleDialogFilterChange}
        initialSearchValue={initialFilters?.search}
        onRowSelect={(row) => onBankTransferSelect(row || undefined)}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        serverSidePagination={true}
      />

      <div className="mt-3 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-muted-foreground text-sm">
          Page {currentPage}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLoading || currentPage * pageSize >= totalRecords}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
