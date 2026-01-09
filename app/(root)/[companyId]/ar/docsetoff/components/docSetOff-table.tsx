import { useEffect, useMemo, useState } from "react"
import { IArDocSetOffFilter, IArDocSetOffHd } from "@/interfaces/ar-docsetoff"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { X } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"

import { ArDocSetOff } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { ARTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DialogDataTable } from "@/components/table/table-dialog"

export interface DocSetOffTableProps {
  onDocSetOffSelect: (selectedReceipt: IArDocSetOffHd | undefined) => void
  onFilterChange: (filters: IArDocSetOffFilter) => void
  initialFilters?: IArDocSetOffFilter
  pageSize: number
  onCloseAction?: () => void
}

export default function DocSetOffTable({
  onDocSetOffSelect,
  onFilterChange,
  initialFilters,
  pageSize: _pageSize,
  onCloseAction,
}: DocSetOffTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 9
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  //const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.docsetoff

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
  const [pageSize, setPageSize] = useState(_pageSize)

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

    // Update searchQuery when initialFilters change
    if (initialFilters?.search !== undefined) {
      setSearchQuery(initialFilters.search)
    }
  }, [initialFilters, form, defaultStartDate, defaultEndDate])

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
    data: receiptsResponse,
    isLoading: isLoadingReceipts,
    isRefetching: isRefetchingReceipts,
    refetch: refetchReceipts,
  } = useGetWithDatesAndPagination<IArDocSetOffHd>(
    `${ArDocSetOff.get}`,
    TableName.arReceipt,
    searchQuery,
    searchStartDate,
    searchEndDate,
    currentPage,
    pageSize,
    undefined, // options
    hasSearched || Boolean(searchStartDate && searchEndDate) // enabled: If searched OR dates already set
  )

  const data = receiptsResponse?.data || []
  const totalRecords = receiptsResponse?.totalRecords || data.length
  const isLoading = isLoadingReceipts || isRefetchingReceipts

  const getPaymentStatus = (
    balTotAmt: number,
    payAmt: number,
    isCancel: boolean
  ) => {
    if (isCancel) {
      return "Cancelled"
    }
    // if (balTotAmt === 0 && payAmt > 0) {
    //   return "Fully Paid"
    // } else if (balTotAmt > 0 && payAmt > 0) {
    //   return "Partially Paid"
    // } else if (balTotAmt > 0 && payAmt === 0) {
    //   return "Not Paid"
    // }
    // else if (balTotAmt === 0 && payAmt === 0) {
    //   return "Cancelled"
    // }
    return ""
  }

  const columns: ColumnDef<IArDocSetOffHd>[] = [
    {
      accessorKey: "setoffNo",
      header: "DocSetOff No",
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      size: 120,
      minSize: 100,
      cell: ({ row }) => {
        const balTotAmt = row.original.unAllocTotAmt ?? 0
        const payAmt = row.original.allocTotAmt ?? 0
        const isCancel = row.original.isCancel ?? false
        const status = getPaymentStatus(balTotAmt, payAmt, isCancel)

        const getStatusStyle = (status: string) => {
          switch (status) {
            // case "Fully Paid":
            //   return "bg-green-100 text-green-800"
            // case "Partially Paid":
            //   return "bg-orange-100 text-orange-800"
            // case "Not Paid":
            //   return "bg-red-100 text-red-800"
            case "Cancelled":
              return "bg-gray-100 text-gray-800"
            default:
              return "bg-gray-100 text-gray-800"
          }
        }

        const getStatusDot = (status: string) => {
          switch (status) {
            // case "Fully Paid":
            //   return "bg-green-400"
            // case "Partially Paid":
            //   return "bg-orange-400"
            // case "Not Paid":
            //   return "bg-red-400"
            case "Cancelled":
              return "bg-gray-400"
            default:
              return "bg-gray-400"
          }
        }

        return (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(status)}`}
            >
              <span
                className={`mr-1 h-2 w-2 rounded-full ${getStatusDot(status)}`}
              ></span>
              {status}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "referenceNo",
      header: "Reference No",
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
      accessorKey: "customerCode",
      header: "Customer Code",
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
    },
    {
      accessorKey: "currencyCode",
      header: "Currency Code",
      size: 80,
      minSize: 60,
    },
    {
      accessorKey: "trnDate",
      header: "Transaction Date",
      cell: ({ row }) => {
        const date = row.original.trnDate
          ? new Date(row.original.trnDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "currencyName",
      header: "Currency Name",
    },
    {
      accessorKey: "exhRate",
      header: "Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("exhRate"), exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankCode",
      header: "Bank Code",
    },
    {
      accessorKey: "bankName",
      header: "Bank Name",
    },
    {
      accessorKey: "paymentTypeCode",
      header: "DocSetOff Type Code",
    },
    {
      accessorKey: "paymentTypeName",
      header: "DocSetOff Type Name",
    },
    {
      accessorKey: "chequeNo",
      header: "Cheque No",
    },
    {
      accessorKey: "unAllocTotAmt",
      header: "Unallocated Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("unAllocTotAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "exhGainLoss",
      header: "Exchange Gain/Loss",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("exhGainLoss"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankChgAmt",
      header: "Bank Charges Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("bankChgAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankChgLocalAmt",
      header: "Bank Charges Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("bankChgLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "createByCode",
      header: "Created By Code",
    },
    {
      accessorKey: "createBy",
      header: "Created By Name",
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
      accessorKey: "editByCode",
      header: "Edited By Code",
    },
    {
      accessorKey: "editBy",
      header: "Edited By Name",
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
      header: "Edit Version",
    },
  ]

  const handleSearchReceipt = () => {
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

    const newFilters: IArDocSetOffFilter = {
      startDate: startDate,
      endDate: endDate,
      search: searchQuery,
      sortBy: "setoffNo",
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
      const newFilters: IArDocSetOffFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "setoffNo",
        sortOrder: "asc",
        pageNumber: page,
        pageSize: pageSize,
      }
      onFilterChange(newFilters)
    }
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
    // The query will automatically refetch due to query key change
    if (onFilterChange) {
      const newFilters: IArDocSetOffFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "setoffNo",
        sortOrder: "asc",
        pageNumber: 1,
        pageSize: size,
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
      const newFilters: IArDocSetOffFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchValue,
        sortBy: "setoffNo",
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
              onClick={handleSearchReceipt}
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

            {/* Close Button */}
            {onCloseAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCloseAction}
                className="ml-auto"
              >
                <X className="mr-1 h-4 w-4" />
                Close
              </Button>
            )}
          </div>
        </FormProvider>
      </div>

      <DialogDataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.arReceipt}
        emptyMessage="No receipts found matching your criteria. Try adjusting the date range or search terms."
        onRefreshAction={() => refetchReceipts()}
        onFilterChange={handleDialogFilterChange}
        initialSearchValue={initialFilters?.search}
        onRowSelect={(row) => onDocSetOffSelect(row || undefined)}
        // Pagination props
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        serverSidePagination={true}
      />
    </div>
  )
}
