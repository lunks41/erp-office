/**
 * InvoiceTable renders a pageable, filterable list of AP invoices.
 * The extensive comments walk through each block so that even readers without
 * a development background can understand how data flows from the API into the UI.
 */
"use client"

// React primitives used to manage component state, memoised values, side-effects, and mutable refs.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
// Domain interfaces describing the payloads used throughout the component.
import { IApInvoiceFilter, IApInvoiceHd } from "@/interfaces"
// Pulls the authenticated user’s formatting preferences (decimals, date formats, etc.).
import { useAuthStore } from "@/stores/auth-store"
// Utility helpers for working with dates (shifting months, formatting boundaries).
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
// Icons that represent refresh and download actions for better visual affordances.
import { ChevronLeft, ChevronRight, Download, RefreshCw, X } from "lucide-react"
// React Hook Form utilities that keep the date filters in sync with the UI.
import { FormProvider, useForm } from "react-hook-form"

// API route helper that points to the AP invoice endpoint.
import { ApInvoice } from "@/lib/api-routes"
// Provides a fallback date format if the user has no custom preference.
import { clientDateFormat } from "@/lib/date-utils"
// Consistent number formatter so monetary values respect locale/precision settings.
import { formatNumber } from "@/lib/format-utils"
// Supplies the table name expected by the backend (important for audit trails and caching).
import { TableName } from "@/lib/utils"
// Shared hook that knows how to call list endpoints with date filters and pagination support.
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
// Button and spinner components from the design system for consistent look & feel.
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
// Reusable date picker component that respects the project’s styling and validation rules.
import { CustomDateNew } from "@/components/custom/custom-date-new"

// Reusable table wrapper that handles the heavy lifting of layout, sorting, and selection.
import { Column, TableContainer } from "./Table"

/**
 * Props accepted by the InvoiceTable. Each callback gives the host screen a way
 * to react to user input (e.g., when someone selects an invoice or tweaks the filters).
 */
interface InvoiceTableProps {
  onInvoiceSelect: (selectedInvoice: IApInvoiceHd | undefined) => void
  onFilterChange: (filters: IApInvoiceFilter) => void
  initialFilters?: IApInvoiceFilter
  pageSize: number
  onClose?: () => void
}

/**
 * We extend the raw invoice data with pre-formatted strings so the table can display
 * ready-to-use values without repeating formatting logic in every cell renderer.
 */
type InvoiceRow = IApInvoiceHd & {
  trnDateDisplay: string
  dueDateDisplay: string
  totAmtDisplay: string
  totLocalAmtDisplay: string
  balAmtDisplay: string
  paymentStatusDisplay: string
  accountDateDisplay: string
  deliveryDateDisplay: string
  createDateDisplay: string
  editDateDisplay: string
  exhRateDisplay: string
  ctyExhRateDisplay: string
  gstAmtDisplay: string
  gstLocalAmtDisplay: string
  totAmtAftGstDisplay: string
  totLocalAmtAftGstDisplay: string
  status?: string
}

/**
 * Main component definition. Receives callbacks from the parent screen along with optional defaults.
 */
export default function InvoiceTable({
  onInvoiceSelect,
  onFilterChange,
  initialFilters,
  pageSize: _pageSize,
  onClose,
}: InvoiceTableProps) {
  // Read decimal and date formatting rules from the authenticated user’s profile.
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat

  // Pre-calculate helpful date boundaries (previous month start, current month end) once.
  const today = useMemo(() => new Date(), [])
  const defaultStartDate = useMemo(
    () => format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd"),
    [today]
  )
  const defaultEndDate = useMemo(
    () => format(lastDayOfMonth(today), "yyyy-MM-dd"),
    [today]
  )

  // Initialise the filter form so the date fields remain reactive and validation-aware.
  const form = useForm({
    defaultValues: {
      startDate: initialFilters?.startDate || defaultStartDate,
      endDate: initialFilters?.endDate || defaultEndDate,
    },
  })

  // Local state mirrors filter criteria and pagination selection.
  const [searchQuery, setSearchQuery] = useState(initialFilters?.search ?? "")
  const [currentPage, setCurrentPage] = useState(
    initialFilters?.pageNumber ?? 1
  )
  const [pageSize, setPageSize] = useState(_pageSize ?? 15)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchStartDate, setSearchStartDate] = useState<string | undefined>(
    initialFilters?.startDate?.toString() || defaultStartDate
  )
  const [searchEndDate, setSearchEndDate] = useState<string | undefined>(
    initialFilters?.endDate?.toString() || defaultEndDate
  )
  // Remember the last set of filters emitted to the parent so we do not spam duplicate events.
  const lastFiltersRef = useRef<IApInvoiceFilter | null>(null)
  // Rows currently displayed in the table.
  const [rows, setRows] = useState<InvoiceRow[]>([])
  // Tracks which rows are selected to support contextual actions.
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  // Lightweight checksum so we only reset rows when the underlying data truly changes.
  const rowsHashRef = useRef<string>("")

  // Supported page-size choices for the dropdown.
  const pageSizeOptions = useMemo(() => [10, 25, 50, 100], [])

  /**
   * When the parent provides new defaults (e.g., reopening the dialog), replace
   * our internal filter state so the form and results reflect the latest context.
   */
  useEffect(() => {
    form.setValue("startDate", initialFilters?.startDate || defaultStartDate)
    form.setValue("endDate", initialFilters?.endDate || defaultEndDate)
    setSearchStartDate(
      initialFilters?.startDate?.toString() || defaultStartDate
    )
    setSearchEndDate(initialFilters?.endDate?.toString() || defaultEndDate)
    setCurrentPage(initialFilters?.pageNumber ?? 1)
    setPageSize(initialFilters?.pageSize ?? _pageSize ?? 15)
    if (initialFilters?.search !== undefined) {
      setSearchQuery(initialFilters.search)
    }
  }, [initialFilters, form, defaultStartDate, defaultEndDate, _pageSize])

  /**
   * Wrap filter-change notifications so they only fire when something actually changed.
   * This prevents unnecessary re-fetches and keeps parent state in sync.
   */
  const emitFilterChange = useCallback(
    (filters: IApInvoiceFilter) => {
      if (!onFilterChange) return
      const prev = lastFiltersRef.current
      if (
        prev &&
        prev.startDate === filters.startDate &&
        prev.endDate === filters.endDate &&
        prev.search === filters.search &&
        prev.sortBy === filters.sortBy &&
        prev.sortOrder === filters.sortOrder &&
        prev.pageNumber === filters.pageNumber &&
        prev.pageSize === filters.pageSize
      ) {
        return
      }
      lastFiltersRef.current = filters
      onFilterChange(filters)
    },
    [onFilterChange]
  )

  /**
   * Anytime the search dates, text, or pagination changes, notify the parent component.
   * The parent typically stores this so the dialog remembers settings between openings.
   */
  useEffect(() => {
    if (!searchStartDate || !searchEndDate) return
    emitFilterChange({
      startDate: searchStartDate,
      endDate: searchEndDate,
      search: searchQuery,
      sortBy: "invoiceNo",
      sortOrder: "asc",
      pageNumber: currentPage,
      pageSize,
    })
  }, [
    searchStartDate,
    searchEndDate,
    searchQuery,
    currentPage,
    pageSize,
    emitFilterChange,
  ])

  /**
   * Fetch invoices from the backend using the shared hook. It automatically handles loading states,
   * caching, and refreshing when query parameters change.
   */
  const {
    data: invoicesResponse,
    isLoading: isLoadingInvoices,
    isRefetching: isRefetchingInvoices,
    refetch: refetchInvoices,
  } = useGetWithDatesAndPagination<IApInvoiceHd>(
    `${ApInvoice.get}`,
    TableName.arInvoice,
    searchQuery,
    searchStartDate,
    searchEndDate,
    currentPage,
    pageSize,
    undefined,
    hasSearched || Boolean(searchStartDate && searchEndDate)
  )

  // Normalise incoming data to an array (the API returns null when empty).
  const data = useMemo(
    () => invoicesResponse?.data || [],
    [invoicesResponse?.data]
  )
  // Total number of records reported by the backend (used for pagination math).
  const totalRecords = invoicesResponse?.totalRecords || data.length
  // Merge loading states so the UI can display a single indicator.
  const isLoading = isLoadingInvoices || isRefetchingInvoices

  /**
   * When “Search” is clicked, capture the form’s current date range and trigger a fresh fetch starting at page 1.
   */
  const handleSearchInvoice = () => {
    const startValue = form.getValues("startDate")
    const endValue = form.getValues("endDate")
    const start = startValue ? startValue.toString() : ""
    const end = endValue ? endValue.toString() : ""
    setSearchStartDate(start || undefined)
    setSearchEndDate(end || undefined)
    setHasSearched(true)
    setCurrentPage(1)
    emitFilterChange({
      startDate: start,
      endDate: end,
      search: searchQuery,
      sortBy: "invoiceNo",
      sortOrder: "asc",
      pageNumber: 1,
      pageSize,
    })
  }

  /**
   * Dialog-level quick filters (search text / sort order) call this handler.
   * We reset to the first page and remember the new search string.
   */
  const _handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    const search = filters.search || ""
    setSearchQuery(search)
    setHasSearched(true)
    setCurrentPage(1)
    emitFilterChange({
      startDate: searchStartDate || "",
      endDate: searchEndDate || "",
      search,
      sortBy: "invoiceNo",
      sortOrder: (filters.sortOrder as "asc" | "desc") || "asc",
      pageNumber: 1,
      pageSize,
    })
  }

  /**
   * Translate the invoice’s payment fields into a friendly status string displayed as a badge in the table.
   */
  const getPaymentStatus = useCallback(
    (balAmt?: number, payAmt?: number, isCancel?: boolean) => {
      if (isCancel) return "Cancelled"
      if ((balAmt ?? 0) === 0 && (payAmt ?? 0) > 0) return "Fully Paid"
      if ((balAmt ?? 0) > 0 && (payAmt ?? 0) > 0) return "Partially Paid"
      if ((balAmt ?? 0) > 0 && (payAmt ?? 0) === 0) return "Not Paid"
      return ""
    },
    []
  )

  /**
   * Convert raw invoices into display-ready rows. All date and numeric formatting happens here
   * so the table remains unaware of formatting details.
   */
  const mappedRows = useMemo(
    () =>
      data.map((invoice) => ({
        ...invoice,
        trnDateDisplay: invoice.trnDate
          ? format(new Date(invoice.trnDate), dateFormat)
          : "-",
        accountDateDisplay: invoice.accountDate
          ? format(new Date(invoice.accountDate), dateFormat)
          : "-",
        deliveryDateDisplay: invoice.deliveryDate
          ? format(new Date(invoice.deliveryDate), dateFormat)
          : "-",
        dueDateDisplay: invoice.dueDate
          ? format(new Date(invoice.dueDate), dateFormat)
          : "-",
        createDateDisplay: invoice.createDate
          ? format(new Date(invoice.createDate), dateFormat)
          : "-",
        editDateDisplay: invoice.editDate
          ? format(new Date(invoice.editDate), dateFormat)
          : "-",
        totAmtDisplay: formatNumber(invoice.totAmt ?? 0, amtDec),
        totLocalAmtDisplay: formatNumber(invoice.totLocalAmt ?? 0, locAmtDec),
        gstAmtDisplay: formatNumber(invoice.gstAmt ?? 0, amtDec),
        gstLocalAmtDisplay: formatNumber(invoice.gstLocalAmt ?? 0, locAmtDec),
        totAmtAftGstDisplay: formatNumber(invoice.totAmtAftGst ?? 0, amtDec),
        totLocalAmtAftGstDisplay: formatNumber(
          invoice.totLocalAmtAftGst ?? 0,
          locAmtDec
        ),
        balAmtDisplay: formatNumber(invoice.balAmt ?? 0, amtDec),
        exhRateDisplay: formatNumber(
          invoice.exhRate ?? 0,
          decimals[0]?.exhRateDec || 9
        ),
        ctyExhRateDisplay: formatNumber(
          invoice.ctyExhRate ?? 0,
          decimals[0]?.exhRateDec || 9
        ),
        paymentStatusDisplay: getPaymentStatus(
          invoice.balAmt,
          invoice.payAmt,
          invoice.isCancel ?? false
        ),
      })),
    [data, dateFormat, amtDec, locAmtDec, decimals, getPaymentStatus]
  )

  /**
   * When new rows arrive, update our table state and clear any previous selections (which may no longer exist).
   */
  useEffect(() => {
    const nextHash = JSON.stringify(
      mappedRows.map((row) => [
        row.invoiceId,
        row.editVersion,
        row.paymentStatusDisplay,
        row.trnDateDisplay,
        row.accountDateDisplay,
        row.deliveryDateDisplay,
        row.dueDateDisplay,
        row.totAmtDisplay,
        row.totLocalAmtDisplay,
        row.balAmtDisplay,
        row.exhRateDisplay,
        row.ctyExhRateDisplay,
        row.createDateDisplay,
        row.editDateDisplay,
      ])
    )
    if (rowsHashRef.current === nextHash) return
    rowsHashRef.current = nextHash
    setRows(mappedRows)
    setSelected((prev) => (Object.keys(prev).length ? {} : prev))
  }, [mappedRows])

  /**
   * Table behaviour configuration (pagination, selection, column manipulation) lives here.
   * This keeps the layout flexible while delegating UI chrome to TableContainer.
   */
  const settings = useMemo(
    () => ({
      pageSize,
      showPagination: true,
      enableRowSelection: true,
      enableSorting: true,
      enableColumnFilters: true,
      enableColumnResizing: true,
      enableColumnVisibility: true,
      enableRowReorder: false,
      enableColumnReorder: true,
      globalFilterPlaceholder: "Search invoices...",
    }),
    [pageSize]
  )

  /**
   * Column definitions include header labels, widths, and custom cell renderers (e.g., the status pill
   * and number formatting). TableContainer relies on this metadata to build the grid.
   */
  const columns = useMemo<Column<InvoiceRow>[]>(
    () => [
      {
        accessorKey: "invoiceNo",
        header: "Invoice No",
        sortable: true,
        size: 140,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "paymentStatusDisplay",
        header: "Pay Status",
        size: 160,
        minSize: 140,
        maxSize: 220,
        cell: ({ row }) => {
          const status = row.original.paymentStatusDisplay
          const badgeClass =
            status === "Fully Paid"
              ? "bg-green-100 text-green-800"
              : status === "Partially Paid"
                ? "bg-orange-100 text-orange-800"
                : status === "Not Paid"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
          const dotClass =
            status === "Fully Paid"
              ? "bg-green-400"
              : status === "Partially Paid"
                ? "bg-orange-400"
                : status === "Not Paid"
                  ? "bg-red-400"
                  : "bg-gray-400"
          return (
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
              >
                <span
                  className={`mr-1 h-2 w-2 rounded-full ${dotClass}`}
                ></span>
                {status || "Cancelled"}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "referenceNo",
        header: "Reference No",
        size: 160,
        minSize: 140,
        maxSize: 240,
      },
      {
        accessorKey: "trnDateDisplay",
        header: "Transaction Date",
        size: 160,
        minSize: 140,
        maxSize: 220,
      },
      {
        accessorKey: "accountDateDisplay",
        header: "Account Date",
        size: 160,
        minSize: 140,
        maxSize: 220,
      },
      {
        accessorKey: "deliveryDateDisplay",
        header: "Delivery Date",
        size: 160,
        minSize: 140,
        maxSize: 220,
      },
      {
        accessorKey: "dueDateDisplay",
        header: "Due Date",
        size: 160,
        minSize: 140,
        maxSize: 220,
      },
      {
        accessorKey: "supplierCode",
        header: "Supplier Code",
        size: 160,
        minSize: 140,
        maxSize: 220,
      },
      {
        accessorKey: "supplierName",
        header: "Supplier Name",
        size: 220,
        minSize: 160,
        maxSize: 320,
      },
      {
        accessorKey: "currencyCode",
        header: "Currency Code",
        size: 140,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "currencyName",
        header: "Currency Name",
        size: 200,
        minSize: 160,
        maxSize: 280,
      },
      {
        accessorKey: "exhRateDisplay",
        header: "Exchange Rate",
        align: "right",
        size: 160,
        minSize: 140,
        maxSize: 220,
      },
      {
        accessorKey: "ctyExhRateDisplay",
        header: "Country Exchange Rate",
        align: "right",
        size: 200,
        minSize: 160,
        maxSize: 260,
      },
      {
        accessorKey: "creditTermCode",
        header: "Credit Term Code",
        size: 180,
        minSize: 150,
        maxSize: 240,
      },
      {
        accessorKey: "creditTermName",
        header: "Credit Term Name",
        size: 220,
        minSize: 180,
        maxSize: 320,
      },
      {
        accessorKey: "bankCode",
        header: "Bank Code",
        size: 140,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "bankName",
        header: "Bank Name",
        size: 200,
        minSize: 160,
        maxSize: 280,
      },
      {
        accessorKey: "totAmtDisplay",
        header: "Total Amount",
        align: "right",
        size: 160,
        minSize: 140,
        maxSize: 220,
      },
      {
        accessorKey: "totLocalAmtDisplay",
        header: "Total Local Amount",
        align: "right",
        size: 200,
        minSize: 160,
        maxSize: 260,
      },
      {
        accessorKey: "gstAmtDisplay",
        header: "VAT Amount",
        align: "right",
        size: 140,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "gstLocalAmtDisplay",
        header: "VAT Local Amount",
        align: "right",
        size: 180,
        minSize: 150,
        maxSize: 240,
      },
      {
        accessorKey: "totAmtAftGstDisplay",
        header: "Total After GST",
        align: "right",
        size: 180,
        minSize: 150,
        maxSize: 240,
      },
      {
        accessorKey: "totLocalAmtAftGstDisplay",
        header: "Total Local After GST",
        align: "right",
        size: 220,
        minSize: 180,
        maxSize: 300,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 150,
        minSize: 120,
        maxSize: 180,
        cell: ({ row }) => (
          <div className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
            {row.original.remarks}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "createBy",
        header: "Created By",
        size: 220,
        minSize: 180,
        maxSize: 320,
      },
      {
        accessorKey: "createDateDisplay",
        header: "Created Date",
        size: 180,
        minSize: 150,
        maxSize: 240,
      },
      {
        accessorKey: "editBy",
        header: "Edited By",
        size: 220,
        minSize: 180,
        maxSize: 320,
      },
      {
        accessorKey: "editDateDisplay",
        header: "Edited Date",
        size: 180,
        minSize: 150,
        maxSize: 240,
      },
      {
        accessorKey: "editVersion",
        header: "Edit Version",
        size: 140,
        minSize: 120,
        maxSize: 200,
      },
    ],
    []
  )

  /**
   * Update the listing when the “rows per page” dropdown changes. We jump back to page 1
   * so users do not land on an out-of-range page index.
   */
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    emitFilterChange({
      startDate: searchStartDate || "",
      endDate: searchEndDate || "",
      search: searchQuery,
      sortBy: "invoiceNo",
      sortOrder: "asc",
      pageNumber: 1,
      pageSize: size,
    })
  }

  /**
   * Convenience wrapper connected directly to the <select> element.
   */
  const handlePageSizeSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const next = Number(event.target.value)
    if (!Number.isNaN(next)) {
      handlePageSizeChange(next)
    }
  }

  /**
   * Compute how many pages are available. Used to guard the Prev/Next buttons.
   */
  const totalPages = useMemo(
    () => (pageSize > 0 ? Math.max(1, Math.ceil(totalRecords / pageSize)) : 1),
    [totalRecords, pageSize]
  )

  const paginationRange = useMemo(() => {
    // Build a sliding window of page numbers (up to five at a time) so users can jump directly
    // to nearby pages without hammering the arrow buttons. The window recenters around the
    // active page when possible and gracefully clamps at the beginning/end of the dataset.
    const windowSize = 5
    const start = Math.max(1, currentPage - Math.floor(windowSize / 2))
    const end = Math.min(totalPages, start + windowSize - 1)
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
  }, [currentPage, totalPages])

  /**
   * Change to the requested page (bounded by 1 and totalPages) and notify the parent so data refetches.
   */
  const handlePageChange = (nextPage: number) => {
    // Stay inside the “1…totalPages” range so we never request an invalid page from the API.
    const target = Math.min(Math.max(1, nextPage), totalPages)
    if (target === currentPage) return
    setCurrentPage(target)
    emitFilterChange({
      startDate: searchStartDate || "",
      endDate: searchEndDate || "",
      search: searchQuery,
      sortBy: "invoiceNo",
      sortOrder: "asc",
      pageNumber: target,
      pageSize,
    })
  }

  /**
   * Produce a simple CSV file using the current set of rows. Helpful when users need to export
   * what they are seeing without building a bespoke report.
   */
  const handleDownloadCsv = () => {
    if (!rows.length) return
    const headers = [
      "Invoice No",
      "Payment Status",
      "Reference No",
      "Transaction Date",
      "Account Date",
      "Delivery Date",
      "Due Date",
      "Supplier Code",
      "Supplier Name",
      "Currency Code",
      "Currency Name",
      "Exchange Rate",
      "Country Exchange Rate",
      "Total Amount",
      "Total Local Amount",
      "GST Amount",
      "VAT Local Amount",
      "Total After GST",
      "Total Local After GST",
      "Remarks",
      "Status",
      "Created By",
      "Created Date",
      "Edited By",
      "Edited Date",
    ]
    const csvBody = rows
      .map((row) =>
        [
          row.invoiceNo ?? "",
          row.paymentStatusDisplay ?? "",
          row.referenceNo ?? "",
          row.trnDateDisplay ?? "",
          row.accountDateDisplay ?? "",
          row.deliveryDateDisplay ?? "",
          row.dueDateDisplay ?? "",
          row.supplierCode ?? "",
          row.supplierName ?? "",
          row.currencyCode ?? "",
          row.currencyName ?? "",
          row.exhRateDisplay ?? "",
          row.ctyExhRateDisplay ?? "",
          row.totAmtDisplay ?? "",
          row.totLocalAmtDisplay ?? "",
          row.gstAmtDisplay ?? "",
          row.gstLocalAmtDisplay ?? "",
          row.totAmtAftGstDisplay ?? "",
          row.totLocalAmtAftGstDisplay ?? "",
          row.remarks ?? "",
          row.status ?? "",
          row.createBy ?? "",
          row.createDateDisplay ?? "",
          row.editBy ?? "",
          row.editDateDisplay ?? "",
        ].join(",")
      )
      .join("\n")
    const blob = new Blob([[headers.join(","), csvBody].join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ap-invoices-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Render the component: filters at the top, controls for pagination/export, the table itself,
   * and a footer explaining the current page context.
   */
  return (
    <div className="w-full overflow-auto">
      <div className="bg-card mb-2 rounded-lg border p-3">
        <FormProvider {...form}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-medium">
                  From:
                </span>
                <CustomDateNew
                  form={form}
                  name="startDate"
                  isRequired
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
                  isRequired
                  size="sm"
                />
              </div>
            </div>
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
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="ml-auto"
              >
                <X className="mr-1 h-4 w-4" />
                Close
              </Button>
            )}
          </div>
        </FormProvider>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <label className="text-muted-foreground text-sm">
          Rows per page:
          <select
            className="ml-2 rounded border px-2 py-1 text-sm"
            value={pageSize}
            onChange={handlePageSizeSelectChange}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetchInvoices()}
          disabled={isLoading}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCsv}
          disabled={!rows.length}
        >
          <Download className="mr-1 h-4 w-4" />
          Download CSV
        </Button>
      </div>
      {isLoading && (
        <div className="text-muted-foreground mb-3 text-sm">
          Loading invoices...
        </div>
      )}
      <TableContainer<InvoiceRow>
        columns={columns}
        data={rows}
        settings={settings}
        onRowReorder={(newData) => setRows(newData as InvoiceRow[])}
        onRowSelectionChange={(sel) => {
          setSelected(sel)
          const selectedKey = Object.keys(sel).find((key) => sel[key])
          let selectedInvoice: InvoiceRow | undefined
          if (selectedKey) {
            const index = Number(selectedKey.replace(/\D+/g, ""))
            selectedInvoice = Number.isNaN(index) ? undefined : rows[index]
          }
          onInvoiceSelect?.(selectedInvoice)
        }}
        onDataUpdate={(updated) => setRows(updated as InvoiceRow[])}
        onResetLayout={() => {
          void refetchInvoices()
        }}
      />
      <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>
          Page {currentPage} of {totalPages} • Total records: {totalRecords}
        </span>
        <div className="flex items-center gap-2">
          {/* Chevron buttons provide quick previous/next navigation while respecting loading states */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
          </Button>
          {/* Render the sliding page window; the active page uses a filled style while others stay outlined */}
          {paginationRange.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
          >
            <ChevronRight className="mr-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
