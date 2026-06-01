import { useEffect, useMemo, useState } from "react"
import { ICbGenReceiptFilter, ICbGenReceiptHd } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { ColumnDef } from "@tanstack/react-table"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { X } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { CbGenReceipt } from "@/lib/api-routes"
import { clientDateFormat, formatDateForApi } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import { DialogDataTable } from "@/components/table/table-dialog"

import { useCompanyStore } from "@/stores/company-store"
export interface CbGenReceiptTableProps {
  onCbGenReceiptSelect: (
    selectedCbGenReceipt: ICbGenReceiptHd | undefined
  ) => void
  onFilterChange: (filters: ICbGenReceiptFilter) => void
  initialFilters?: ICbGenReceiptFilter
  pageSize: number
  onCloseAction?: () => void
  visible?: IVisibleFields
  isDialogOpen?: boolean
}

const DEFAULT_PAGE_SIZE = 15

export default function CbGenReceiptTable({
  onCbGenReceiptSelect,
  onFilterChange,
  initialFilters,
  pageSize: _pageSize,
  onCloseAction,
  visible,
  isDialogOpen = false,
}: CbGenReceiptTableProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 9
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  //const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbgenreceipt

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

  useEffect(() => {
    if (isDialogOpen) setHasSearched(true)
  }, [isDialogOpen])

  const {
    data: glJournalsResponse,
    isLoading: isLoadingCbGenReceipts,
    isRefetching: isRefetchingCbGenReceipts,
    refetch: _refetchCbGenReceipts,
  } = useGetWithDatesAndPagination<ICbGenReceiptHd>(
    `${CbGenReceipt.get}`,
    TableName.glJournal,
    searchQuery,
    searchStartDate ?? "",
    searchEndDate ?? "",
    currentPage,
    pageSize,
    isAllTimeCommitted,
    undefined,
    hasSearched
  )

  const data = glJournalsResponse?.data || []
  const totalRecords = glJournalsResponse?.totalRecords || data.length
  const isLoading = isLoadingCbGenReceipts || isRefetchingCbGenReceipts

  const getReceiptStatus = (isCancel: boolean) => {
    if (isCancel) {
      return "Cancelled"
    }
    return ""
  }

  const columns: ColumnDef<ICbGenReceiptHd>[] = [
    {
      accessorKey: "receiptNo",
      header: "CbGenReceipt No",
    },
    {
      accessorKey: "receiptStatus",
      header: "Receipt Status",
      size: 120,
      minSize: 100,
      cell: ({ row }) => {
        const isCancel = row.original.isCancel ?? false
        const status = getReceiptStatus(isCancel)

        const getStatusStyle = (status: string) => {
          switch (status) {
            case "Cancelled":
              return "bg-gray-100 text-gray-800"
            default:
              return "bg-gray-100 text-gray-800"
          }
        }

        const getStatusDot = (status: string) => {
          switch (status) {
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
    ...(visible?.m_PayeeTo
      ? [
          {
            accessorKey: "payeeTo",
            header: "Payee To",
            size: 150,
          } as ColumnDef<ICbGenReceiptHd>,
        ]
      : []),
    {
      accessorKey: "supplierRegNo",
      header: "Supplier Reg No (TRN No.)",
      size: 130,
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
          } as ColumnDef<ICbGenReceiptHd>,
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
          } as ColumnDef<ICbGenReceiptHd>,
        ]
      : []),
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
          } as ColumnDef<ICbGenReceiptHd>,
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
      accessorKey: "totLocalAmt",
      header: "Total Local Amount",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totLocalAmt"), locAmtDec)}
        </div>
      ),
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
          } as ColumnDef<ICbGenReceiptHd>,
        ]
      : []),
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
      accessorKey: "gstLocalAmt",
      header: "VAT Local Amount",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("gstLocalAmt"), locAmtDec)}
        </div>
      ),
    },
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
          } as ColumnDef<ICbGenReceiptHd>,
        ]
      : []),
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
      accessorKey: "totLocalAmtAftGst",
      header: "Total Local After VAT",
      cell: ({ row }) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totLocalAmtAftGst"), locAmtDec)}
        </div>
      ),
    },
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
          } as ColumnDef<ICbGenReceiptHd>,
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

  const handleSearchCbGenReceipt = () => {
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

    const newFilters: ICbGenReceiptFilter = {
      startDate: isAllTime ? "" : startDate,
      endDate: isAllTime ? "" : endDate,
      search: filterSearchValue,
      sortBy: "receiptNo",
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
      const newFilters: ICbGenReceiptFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "receiptNo",
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
      const newFilters: ICbGenReceiptFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchQuery,
        sortBy: "receiptNo",
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
      const newFilters: ICbGenReceiptFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchValue,
        sortBy: "receiptNo",
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
    setHasSearched(true)
    if (onFilterChange) {
      onFilterChange({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        search: "",
        sortBy: "receiptNo",
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
              onClick={handleSearchCbGenReceipt}
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
        tableName={TableName.glJournal}
        emptyMessage="No invoices found matching your criteria. Try adjusting the date range or search terms."
        onRowSelect={(row) => onCbGenReceiptSelect(row || undefined)}
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
