import { useEffect, useState } from "react"
import { ICbBankTransferCtmFilter, ICbBankTransferCtmHd } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

import { CbBankTransferCtm } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDates } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { CustomDateNew } from "@/components/custom/custom-date-new"
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

  const form = useForm({
    defaultValues: {
      startDate:
        initialFilters?.startDate ||
        format(subMonths(new Date(), 1), "yyyy-MM-dd"),
      endDate: initialFilters?.endDate || format(new Date(), "yyyy-MM-dd"),
    },
  })

  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "")

  // Data fetching - only when table is opened
  const {
    data: bankTransferCtmsResponse,
    isLoading: isLoadingBankTransferCtms,
    isRefetching: isRefetchingBankTransferCtms,
    refetch: refetchBankTransferCtms,
  } = useGetWithDates<ICbBankTransferCtmHd>(
    `${CbBankTransferCtm.get}`,
    TableName.cbBankTransferCtm,
    searchQuery,
    formatDateForApi(form.watch("startDate")) || "",
    formatDateForApi(form.watch("endDate")) || "",
    undefined, // options
    true // enabled: Fetch when table is opened
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
    const startDate = form.getValues("startDate")
    const endDate = form.getValues("endDate")

    const newFilters: ICbBankTransferCtmFilter = {
      startDate: startDate,
      endDate: endDate,
      search: searchQuery,
      sortBy: "transferNo",
      sortOrder: "asc",
    }
    onFilterChange(newFilters)
  }

  const handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    // Update local searchQuery state when search changes from dialog
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

  // Update searchQuery when initialFilters.search changes
  useEffect(() => {
    if (
      initialFilters?.search !== undefined &&
      initialFilters.search !== searchQuery
    ) {
      setSearchQuery(initialFilters.search)
    }
  }, [initialFilters?.search, searchQuery])

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
              onClick={handleSearchBankTransferCtm}
              disabled={isLoading}
            >
              Search
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
        onRefreshAction={() => refetchBankTransferCtms()}
        onFilterChange={handleDialogFilterChange}
        initialSearchValue={initialFilters?.search}
        onRowSelect={(row) => onCbBankTransferCtmSelect(row || undefined)}
      />
    </div>
  )
}
