import { useEffect, useMemo, useState } from "react"
import { IApAdjustmentFilter, IApAdjustmentHd } from "@/interfaces"
import { ColumnDef } from "@tanstack/react-table"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { X } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { ApAdjustment } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { APTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import { DialogDataTable } from "@/components/table/table-dialog"

import { useCompanyStore } from "@/stores/company-store"
export interface AdjustmentTableProps {
  onAdjustmentSelect: (selectedAdjustment: IApAdjustmentHd | undefined) => void
  onFilterChange: (filters: IApAdjustmentFilter) => void
  initialFilters?: IApAdjustmentFilter
  pageSize: number
  onCloseAction?: () => void
  isDialogOpen?: boolean
}

export default function AdjustmentTable({
  onAdjustmentSelect,
  onFilterChange,
  initialFilters,
  pageSize: _pageSize,
  onCloseAction,
  isDialogOpen = false,
}: AdjustmentTableProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 9
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  //const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.adjustment

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
  const [pageSize, setPageSize] = useState(_pageSize)

  const [hasSearched, setHasSearched] = useState(false)
  const [isAllTime, setIsAllTime] = useState(false)
  const [isAllTimeCommitted, setIsAllTimeCommitted] = useState(false)
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
    // Preserve "" for isAllTime so we don't overwrite with defaults and trigger a second API call
    const start =
      initialFilters?.startDate === ""
        ? ""
        : initialFilters?.startDate || defaultStartDate
    const end =
      initialFilters?.endDate === ""
        ? ""
        : initialFilters?.endDate || defaultEndDate
    form.setValue("startDate", start)
    form.setValue("endDate", end)
    if (initialFilters?.search !== undefined) {
      setSearchQuery(initialFilters.search)
      form.setValue("filterSearch", initialFilters.search)
    }
    setSearchStartDate(
      initialFilters?.startDate === ""
        ? ""
        : initialFilters?.startDate
          ? formatDateForApi(initialFilters.startDate) || defaultStartDate
          : defaultStartDate
    )
    setSearchEndDate(
      initialFilters?.endDate === ""
        ? ""
        : initialFilters?.endDate
          ? formatDateForApi(initialFilters.endDate) || defaultEndDate
          : defaultEndDate
    )
  }, [initialFilters, form, defaultStartDate, defaultEndDate])

  useEffect(() => {
    if (isDialogOpen) setHasSearched(true)
  }, [isDialogOpen])

  const {
    data: adjustmentsResponse,
    isLoading: isLoadingAdjustments,
    isRefetching: isRefetchingAdjustments,
    refetch: _refetchAdjustments,
  } = useGetWithDatesAndPagination<IApAdjustmentHd>(
    `${ApAdjustment.get}`,
    TableName.arAdjustment,
    searchQuery,
    searchStartDate ?? "",
    searchEndDate ?? "",
    currentPage,
    pageSize,
    isAllTimeCommitted,
    undefined,
    hasSearched
  )

  const data = adjustmentsResponse?.data || []
  const totalRecords = adjustmentsResponse?.totalRecords || data.length
  const isLoading = isLoadingAdjustments || isRefetchingAdjustments

  const getPaymentStatus = (
    balAmt: number,
    payAmt: number,
    isCancel: boolean
  ) => {
    if (isCancel) {
      return "Cancelled"
    }
    // if (balAmt === 0 && payAmt > 0) {
    //   return "Fully Paid"
    // } else if (balAmt > 0 && payAmt > 0) {
    //   return "Partially Paid"
    // } else if (balAmt > 0 && payAmt === 0) {
    //   return "Not Paid"
    // }
    // else if (balAmt === 0 && payAmt === 0) {
    //   return "Cancelled"
    // }
    return ""
  }

  const columns: ColumnDef<IApAdjustmentHd>[] = [
    {
      accessorKey: "adjustmentNo",
      header: "Adjustment No",
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      size: 120,
      minSize: 100,
      cell: ({ row }) => {
        const balAmt = row.original.balAmt ?? 0
        const payAmt = row.original.payAmt ?? 0
        const isCancel = row.original.isCancel ?? false
        const status = getPaymentStatus(balAmt, payAmt, isCancel)

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
          <div className="flex justify-center overflow-hidden">
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
      accessorKey: "supplierCode",
      header: "Supplier Code",
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "supplierName",
      header: "Supplier Name",
    },
    {
      accessorKey: "currencyCode",
      header: "Currency Code",
      size: 80,
      minSize: 60,
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
      accessorKey: "gstAmt",
      header: "VAT Amount",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("gstAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "totAmtAftGst",
      header: "Total After VAT",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totAmtAftGst"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmt",
      header: "Total Local Amount",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "gstLocalAmt",
      header: "VAT Local Amount",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("gstLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmtAftGst",
      header: "Total Local After VAT",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totLocalAmtAftGst"), locAmtDec)}
        </div>
      ),
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
      accessorKey: "deliveryDate",
      header: "Delivery Date",
      cell: ({ row }) => {
        const date = row.original.deliveryDate
          ? new Date(row.original.deliveryDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const date = row.original.dueDate
          ? new Date(row.original.dueDate)
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
        <div className="truncate text-right">
          {formatNumber(row.getValue("exhRate"), exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "ctyExhRate",
      header: "Country Exchange Rate",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("ctyExhRate"), exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "creditTermCode",
      header: "Credit Term Code",
    },
    {
      accessorKey: "creditTermName",
      header: "Credit Term Name",
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

  const handleSearchAdjustment = () => {
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
    setHasSearched(true)
    setCurrentPage(1)

    const newFilters: IApAdjustmentFilter = {
      startDate: isAllTime ? "" : startDate,
      endDate: isAllTime ? "" : endDate,
      search: filterSearchValue,
      sortBy: "adjustmentNo",
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
      const newFilters: IApAdjustmentFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "adjustmentNo",
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
      const newFilters: IApAdjustmentFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "adjustmentNo",
        sortOrder: "asc",
        pageNumber: 1,
        pageSize: size,
      }
      onFilterChange(newFilters)
    }
  }

  const _handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    // Update local searchQuery state when search changes from dialog
    const searchValue = filters.search || ""
    setSearchQuery(searchValue)

    if (onFilterChange) {
      const newFilters: IApAdjustmentFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchValue,
        sortBy: "adjustmentNo",
        sortOrder: (filters.sortOrder as "asc" | "desc") || "asc",
        pageNumber: currentPage,
        pageSize: pageSize,
      }
      onFilterChange(newFilters)
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
    setHasSearched(true)
    if (onFilterChange) {
      onFilterChange({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        search: "",
        sortBy: "adjustmentNo",
        sortOrder: "asc",
        pageNumber: 1,
        pageSize,
      })
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
                  isFutureShow={true}
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
                  isFutureShow={true}
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
              onClick={handleSearchAdjustment}
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
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
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
        tableName={TableName.arAdjustment}
        emptyMessage="No adjustments found matching your criteria. Try adjusting the date range or search terms."
        onRowSelect={(row) => onAdjustmentSelect(row || undefined)}
        // Pagination props
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        serverSidePagination={true}
        showSearch={false}
      />
    </div>
  )
}
