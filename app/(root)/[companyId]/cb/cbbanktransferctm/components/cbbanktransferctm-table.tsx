import { useEffect, useMemo, useState } from "react"
import { ICbBankTransferCtmFilter, ICbBankTransferCtmHd } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, lastDayOfMonth, startOfMonth, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

import { CbBankTransferCtm } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDates } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import { DialogDataTable } from "@/components/table/table-dialog"

export interface CbBankTransferCtmTableProps {
  onCbBankTransferCtmSelect: (
    selectedBankTransferCtm: ICbBankTransferCtmHd | undefined
  ) => void
  onFilterChange: (filters: ICbBankTransferCtmFilter) => void
  initialFilters?: ICbBankTransferCtmFilter
  pageSize?: number
  onCloseAction?: () => void
  visible?: IVisibleFields
}

export default function CbBankTransferCtmTable({
  onCbBankTransferCtmSelect,
  onFilterChange,
  initialFilters,
  pageSize: _pageSize,
  onCloseAction,
  visible: _visible,
}: CbBankTransferCtmTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbanktransferctm

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
  const [hasSearched, setHasSearched] = useState(false)
  const [isAllTime, setIsAllTime] = useState(false)
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

  // Data fetching - only when Search is clicked
  const {
    data: bankTransferCtmsResponse,
    isLoading: isLoadingBankTransferCtms,
    isRefetching: isRefetchingBankTransferCtms,
    refetch: _refetchBankTransferCtms,
  } = useGetWithDates<ICbBankTransferCtmHd>(
    `${CbBankTransferCtm.get}`,
    TableName.cbBankTransferCtm,
    searchQuery,
    searchStartDate ?? "",
    searchEndDate ?? "",
    undefined,
    hasSearched || Boolean(searchStartDate && searchEndDate)
  )

  const data = bankTransferCtmsResponse?.data || []
  const isLoading = isLoadingBankTransferCtms || isRefetchingBankTransferCtms

  const formatNumber = (value: number, decimals: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const columns: ColumnDef<ICbBankTransferCtmHd>[] = [
    {
      accessorKey: "transferNo",
      header: "Transfer No",
    },
    {
      accessorKey: "referenceNo",
      header: "Reference No",
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
      accessorKey: "paymentTypeName",
      header: "Payment Type",
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
      accessorKey: "fromBankCode",
      header: "From Bank Code",
    },
    {
      accessorKey: "fromBankName",
      header: "From Bank Name",
    },
    {
      accessorKey: "fromCurrencyCode",
      header: "From Currency",
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
      accessorKey: "fromBankChgAmt",
      header: "From Bank Charge",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("fromBankChgAmt"), amtDec)}
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
      accessorKey: "payeeTo",
      header: "Payee To",
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
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      accessorKey: "editVersion",
      header: "Version",
    },
    {
      accessorKey: "isCancel",
      header: "Cancelled",
      cell: ({ row }) => (
        <div className="text-center">{row.original.isCancel ? "✓" : ""}</div>
      ),
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
        return date ? format(date, dateFormat) : "-"
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
        return date ? format(date, dateFormat) : "-"
      },
    },
  ]

  const handleSearchBankTransferCtm = () => {
    const filterSearchValue = form.getValues("filterSearch") ?? ""
    setSearchQuery(filterSearchValue)

    const startDate = form.getValues("startDate")
    const endDate = form.getValues("endDate")
    const formattedStartDate = isAllTime ? "" : (formatDateForApi(startDate) || "")
    const formattedEndDate = isAllTime ? "" : (formatDateForApi(endDate) || "")

    setSearchStartDate(formattedStartDate)
    setSearchEndDate(formattedEndDate)
    setHasSearched(true)

    const newFilters: ICbBankTransferCtmFilter = {
      startDate: isAllTime ? "" : startDate,
      endDate: isAllTime ? "" : endDate,
      search: filterSearchValue,
      sortBy: "transferNo",
      sortOrder: "asc",
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
      const newFilters: ICbBankTransferCtmFilter = {
        startDate: form.getValues("startDate"),
        endDate: form.getValues("endDate"),
        search: searchValue,
        sortBy: "transferNo",
        sortOrder: (filters.sortOrder as "asc" | "desc") || "asc",
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
    setSearchStartDate(defaultStartDate)
    setSearchEndDate(defaultEndDate)
    setHasSearched(false)
    if (onFilterChange) {
      onFilterChange({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        search: "",
        sortBy: "transferNo",
        sortOrder: "asc",
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
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
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
              onClick={handleSearchBankTransferCtm}
              disabled={isLoading}
            >
              Search
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
        tableName={TableName.cbBankTransferCtm}
        emptyMessage="No Bank Transfer CTMs found matching your criteria. Try adjusting the date range or search terms."
        onRowSelect={(row) => onCbBankTransferCtmSelect(row || undefined)}
      />
    </div>
  )
}
