import { useEffect, useState } from "react"
import { ICbBankTransfer, ICbBankTransferFilter } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

import { CbBankTransfer } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDates } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DialogDataTable } from "@/components/table/table-dialog"

export interface BankTransferTableProps {
  onBankTransferSelect: (
    selectedBankTransfer: ICbBankTransfer | undefined
  ) => void
  onFilterChange: (filters: ICbBankTransferFilter) => void
  initialFilters?: ICbBankTransferFilter
}

export default function BankTransferTable({
  onBankTransferSelect,
  onFilterChange,
  initialFilters,
}: BankTransferTableProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 9
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  //const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbanktransfer

  const form = useForm({
    defaultValues: {
      startDate:
        initialFilters?.startDate ||
        format(subMonths(new Date(), 1), "yyyy-MM-dd"),
      endDate: initialFilters?.endDate || format(new Date(), "yyyy-MM-dd"),
    },
  })

  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "")
  const [currentPage] = useState(1)
  const [pageSize] = useState(10)

  // Data fetching - only when table is opened
  const {
    data: bankTransfersResponse,
    isLoading: isLoadingBankTransfers,
    isRefetching: isRefetchingBankTransfers,
    refetch: refetchBankTransfers,
  } = useGetWithDates<ICbBankTransfer>(
    `${CbBankTransfer.get}`,
    TableName.cbBankTransfer,
    searchQuery,
    formatDateForApi(form.watch("startDate")) || "",
    formatDateForApi(form.watch("endDate")) || "",
    undefined, // options
    true // enabled: Fetch when table is opened
  )

  const data = bankTransfersResponse?.data || []
  const isLoading = isLoadingBankTransfers || isRefetchingBankTransfers

  const formatNumber = (value: number, decimals: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const columns: ColumnDef<ICbBankTransfer>[] = [
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
      accessorKey: "fromBankName",
      header: "From Bank Name",
    },
    {
      accessorKey: "fromCurrencyCode",
      header: "From Currency Code",
    },
    {
      accessorKey: "fromCurrencyName",
      header: "From Currency Name",
    },
    {
      accessorKey: "fromExhRate",
      header: "From Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.fromExhRate || 0, exhRateDec)}
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
          {formatNumber(row.original.fromBankChgAmt || 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromBankChgLocalAmt",
      header: "From Bank Charge Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.fromBankChgLocalAmt || 0, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromTotAmt",
      header: "From Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.fromTotAmt || 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "fromTotLocalAmt",
      header: "From Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.fromTotLocalAmt || 0, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toBankCode",
      header: "To Bank Code",
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
      accessorKey: "toCurrencyName",
      header: "To Currency Name",
    },
    {
      accessorKey: "toExhRate",
      header: "To Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.toExhRate || 0, exhRateDec)}
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
          {formatNumber(row.original.toBankChgAmt || 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toBankChgLocalAmt",
      header: "To Bank Charge Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.toBankChgLocalAmt || 0, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toTotAmt",
      header: "To Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.toTotAmt || 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "toTotLocalAmt",
      header: "To Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.toTotLocalAmt || 0, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankExhRate",
      header: "Bank Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.bankExhRate || 0, exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankTotAmt",
      header: "Bank Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.bankTotAmt || 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "bankTotLocalAmt",
      header: "Bank Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.bankTotLocalAmt || 0, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "exhGainLoss",
      header: "Exchange Gain/Loss",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.exhGainLoss || 0, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
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
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
  ]

  const handleSearchInvoice = () => {
    const newFilters: ICbBankTransferFilter = {
      startDate: form.getValues("startDate"),
      endDate: form.getValues("endDate"),
      search: searchQuery,
      sortBy: "invoiceNo",
      sortOrder: "asc",
      pageNumber: currentPage,
      pageSize: pageSize,
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

  // Update searchQuery when initialFilters.search changes
  useEffect(() => {
    if (
      initialFilters?.search !== undefined &&
      initialFilters.search !== searchQuery
    ) {
      setSearchQuery(initialFilters.search)
    }
  }, [initialFilters?.search, searchQuery])

  // Show loading spinner while data is loading
  if (isLoadingBankTransfers) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">
            Loading bank transfers...
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Please wait while we fetch the bank transfer list
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-auto">
      <FormProvider {...form}>
        <div className="mb-4 flex items-center gap-2">
          {/* From Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From Date:</span>
            <CustomDateNew
              form={form}
              name="startDate"
              isRequired={true}
              size="sm"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To Date:</span>
            <CustomDateNew
              form={form}
              name="endDate"
              isRequired={true}
              size="sm"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleSearchInvoice}>
            Search Bank Transfer
          </Button>
        </div>
      </FormProvider>
      <Separator className="mb-4" />

      <DialogDataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.cbBankTransfer}
        emptyMessage="No data found."
        onRefreshAction={() => refetchBankTransfers()}
        onFilterChange={handleDialogFilterChange}
        initialSearchValue={initialFilters?.search}
        onRowSelect={(row) => onBankTransferSelect(row || undefined)}
      />
    </div>
  )
}
