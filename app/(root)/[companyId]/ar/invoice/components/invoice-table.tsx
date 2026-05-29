import { useEffect, useMemo, useState } from "react"
import { IArInvoiceFilter, IArInvoiceHd } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { ColumnDef } from "@tanstack/react-table"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { X } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { ArInvoice } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { ARTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import { DialogDataTable } from "@/components/table/table-dialog"

import { useCompanyStore } from "@/stores/company-store"
export interface InvoiceTableProps {
  onInvoiceSelect: (selectedInvoice: IArInvoiceHd | undefined) => void
  onFilterChange: (filters: IArInvoiceFilter) => void
  initialFilters?: IArInvoiceFilter
  pageSize: number
  onCloseAction?: () => void
  visible?: IVisibleFields
  /** When true, list dialog is open – enables initial API fetch when dialog opens */
  isDialogOpen?: boolean
}

const DEFAULT_PAGE_SIZE = 15

export default function InvoiceTable({
  onInvoiceSelect,
  onFilterChange,
  initialFilters,
  pageSize: _pageSize,
  onCloseAction,
  visible,
  isDialogOpen = false,
}: InvoiceTableProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 9
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.invoice

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
  const [pageSize, setPageSize] = useState<number>(
    typeof _pageSize === "number" && _pageSize > 0
      ? _pageSize
      : DEFAULT_PAGE_SIZE
  )

  // State to track if search has been clicked (or dialog opened for initial load)
  const [hasSearched, setHasSearched] = useState(false)
  // When true, fetch all data without date filter (UI state)
  const [isAllTime, setIsAllTime] = useState(false)
  // Committed value for API – only updated when Search is clicked (prevents refetch on checkbox toggle)
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

    const sizeFromFilters =
      typeof initialFilters?.pageSize === "number" &&
      initialFilters.pageSize > 0
        ? initialFilters.pageSize
        : typeof _pageSize === "number" && _pageSize > 0
          ? _pageSize
          : DEFAULT_PAGE_SIZE
    setPageSize(sizeFromFilters)

    // Update searchQuery and form filterSearch when initialFilters change
    if (initialFilters?.search !== undefined) {
      setSearchQuery(initialFilters.search)
      form.setValue("filterSearch", initialFilters.search)
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

  // When list dialog opens, enable initial fetch (so API is called on open)
  useEffect(() => {
    if (isDialogOpen) setHasSearched(true)
  }, [isDialogOpen])

  // Data fetching when dialog is open: after Search click or on initial open (no refetch on checkbox toggle – use isAllTimeCommitted)
  const {
    data: invoicesResponse,
    isLoading: isLoadingInvoices,
    isRefetching: isRefetchingInvoices,
    refetch: _refetchInvoices,
  } = useGetWithDatesAndPagination<IArInvoiceHd>(
    `${ArInvoice.get}`,
    TableName.arInvoice,
    searchQuery,
    searchStartDate ?? "",
    searchEndDate ?? "",
    currentPage,
    pageSize,
    isAllTimeCommitted,
    undefined,
    hasSearched
  )

  const data = useMemo(
    () => invoicesResponse?.data || [],
    [invoicesResponse?.data]
  )
  const totalRecords = invoicesResponse?.totalRecords || data.length
  const isLoading = isLoadingInvoices || isRefetchingInvoices

  // Sum amounts for the current page (footer aggregates)
  const {
    totalTotAmt,
    totalGstAmt,
    totalTotAmtAftGst,
    totalTotLocalAmt,
    totalGstLocalAmt,
    totalTotLocalAmtAftGst,
  } = useMemo(() => {
    return data.reduce(
      (acc, row) => {
        const toNumber = (v: unknown) =>
          typeof v === "number" ? v : Number(v) || 0

        acc.totalTotAmt += toNumber(row.totAmt)
        acc.totalGstAmt += toNumber(row.gstAmt)
        acc.totalTotAmtAftGst += toNumber(row.totAmtAftGst)
        acc.totalTotLocalAmt += toNumber(row.totLocalAmt)
        acc.totalGstLocalAmt += toNumber(row.gstLocalAmt)
        acc.totalTotLocalAmtAftGst += toNumber(row.totLocalAmtAftGst)

        return acc
      },
      {
        totalTotAmt: 0,
        totalGstAmt: 0,
        totalTotAmtAftGst: 0,
        totalTotLocalAmt: 0,
        totalGstLocalAmt: 0,
        totalTotLocalAmtAftGst: 0,
      }
    )
  }, [data])

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

  const columns: ColumnDef<IArInvoiceHd>[] = [
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
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
      accessorKey: "jobOrderNo",
      header: "Job Order No",
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
    ...(visible?.m_TrnDate
      ? [
          {
            accessorKey: "trnDate",
            header: "Transaction Date",
            cell: ({ row }) => {
              const date = row.original.trnDate
                ? new Date(row.original.trnDate)
                : null
              return date ? format(date, dateFormat) : "-"
            },
          } as ColumnDef<IArInvoiceHd>,
        ]
      : []),
    ...(visible?.m_DeliveryDate
      ? [
          {
            accessorKey: "deliveryDate",
            header: "Delivery Date",
            cell: ({ row }) => {
              const date = row.original.deliveryDate
                ? new Date(row.original.deliveryDate)
                : null
              return date ? format(date, dateFormat) : "-"
            },
          } as ColumnDef<IArInvoiceHd>,
        ]
      : []),
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
    ...(visible?.m_CtyCurr
      ? [
          {
            accessorKey: "ctyExhRate",
            header: "Country Exchange Rate",
            cell: ({ row }) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("ctyExhRate"), exhRateDec)}
              </div>
            ),
          } as ColumnDef<IArInvoiceHd>,
        ]
      : []),
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
    ...(visible?.m_CtyCurr
      ? [
          {
            accessorKey: "totCtyAmt",
            header: "Total Country Amount",
            cell: ({ row }) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("totCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IArInvoiceHd>,
        ]
      : []),
    ...(visible?.m_CtyCurr
      ? [
          {
            accessorKey: "gstCtyAmt",
            header: "VAT Country Amount",
            cell: ({ row }) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IArInvoiceHd>,
        ]
      : []),
    ...(visible?.m_CtyCurr
      ? [
          {
            accessorKey: "totCtyAmtAftGst",
            header: "Total Country After VAT",
            cell: ({ row }) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("totCtyAmtAftGst"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<IArInvoiceHd>,
        ]
      : []),

    ...(visible?.m_Remarks
      ? [
          {
            accessorKey: "remarks",
            header: "Remarks",
            size: 200,
            minSize: 150,
            maxSize: 220,
            cell: ({ row }) => {
              const remarks = row.original.remarks ?? ""
              return (
                <div className="max-w-[200px] truncate" title={remarks}>
                  {remarks || "-"}
                </div>
              )
            },
          } as ColumnDef<IArInvoiceHd>,
        ]
      : []),
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
        return date ? format(date, datetimeFormat) : "-"
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
        return date ? format(date, datetimeFormat) : "-"
      },
    },
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
  ]

  const handleSearchInvoice = () => {
    const filterSearchValue = form.getValues("filterSearch") ?? ""
    setSearchQuery(filterSearchValue)

    const startDate = form.getValues("startDate")
    const endDate = form.getValues("endDate")

    // Commit current isAllTime so API uses it (avoids refetch when only toggling checkbox)
    setIsAllTimeCommitted(isAllTime)

    // Format dates to yyyy-MM-dd format for API (empty when isAllTime)
    const formattedStartDate = isAllTime
      ? ""
      : formatDateForApi(startDate) || ""
    const formattedEndDate = isAllTime ? "" : formatDateForApi(endDate) || ""

    // Store the search dates (formatted for API)
    setSearchStartDate(formattedStartDate)
    setSearchEndDate(formattedEndDate)
    setHasSearched(true) // Enable the query
    setCurrentPage(1) // Reset to first page when searching

    const newFilters: IArInvoiceFilter = {
      startDate: isAllTime ? "" : startDate,
      endDate: isAllTime ? "" : endDate,
      search: filterSearchValue,
      sortBy: "invoiceNo",
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
      const newFilters: IArInvoiceFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "invoiceNo",
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
      const newFilters: IArInvoiceFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "invoiceNo",
        sortOrder: "asc",
        pageNumber: 1,
        pageSize: nextSize,
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
      const newFilters: IArInvoiceFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchValue,
        sortBy: "invoiceNo",
        sortOrder: (filters.sortOrder as "asc" | "desc") || "asc",
        pageNumber: currentPage,
        pageSize,
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
    // Keep hasSearched true so the query stays enabled and refetches with default params
    setHasSearched(true)
    if (onFilterChange) {
      onFilterChange({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        search: "",
        sortBy: "invoiceNo",
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

            {/* Search box (filter text) */}
            <CustomInput
              form={form}
              name="filterSearch"
              placeholder="Search..."
              className="w-48"
            />

            {/* All data checkbox */}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={isAllTime}
                onCheckedChange={(checked) => setIsAllTime(checked === true)}
              />
              <span className="text-muted-foreground whitespace-nowrap">
                All data
              </span>
            </label>

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
        tableName={TableName.arInvoice}
        emptyMessage="No invoices found matching your criteria. Try adjusting the date range or search terms."
        onRowSelect={(row) => onInvoiceSelect(row || undefined)}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        serverSidePagination={true}
        showSearch={false}
        columnFooters={{
          totAmt: formatNumber(totalTotAmt, amtDec),
          gstAmt: formatNumber(totalGstAmt, amtDec),
          totAmtAftGst: formatNumber(totalTotAmtAftGst, amtDec),
          totLocalAmt: formatNumber(totalTotLocalAmt, locAmtDec),
          gstLocalAmt: formatNumber(totalGstLocalAmt, locAmtDec),
          totLocalAmtAftGst: formatNumber(totalTotLocalAmtAftGst, locAmtDec),
        }}
      />
    </div>
  )
}
