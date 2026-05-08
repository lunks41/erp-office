"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useState } from "react"
import { ICbBankReconHd } from "@/interfaces"
import { ColumnDef } from "@tanstack/react-table"
import { format, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"
import { Search } from "lucide-react"
import { CbBankRecon } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useGetWithDatesAndPagination } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DialogDataTable } from "@/components/table/table-dialog"

interface BankReconSelectionDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onSelectBankReconAction: (reconNo: string, reconId: string) => void
  bankId: number
  currencyId?: number
  companyId: number
}

export default function BankReconSelectionDialog({
  open,
  onOpenChangeAction,
  onSelectBankReconAction,
  bankId,
  currencyId,
  companyId: _companyId,
}: BankReconSelectionDialogProps) {
  const { decimals } = useCompanyStore()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbankrecon

  const form = useForm({
    defaultValues: {
      startDate: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, _setCurrentPage] = useState(1)
  const [pageSize] = useState(50)

  // Data fetching - only when dialog is opened and bankId is provided
  const {
    data: bankReconsResponse,
    isLoading: isLoadingBankRecons,
    isRefetching: isRefetchingBankRecons,
    refetch: refetchBankRecons,
  } = useGetWithDatesAndPagination<ICbBankReconHd>(
    `${CbBankRecon.get}`,
    TableName.cbBankRecon,
    searchQuery,
    formatDateForApi(form.watch("startDate")) || "",
    formatDateForApi(form.watch("endDate")) || "",
    currentPage,
    pageSize,
    false,
    undefined,
    open && !!bankId && bankId > 0
  )

  const data = bankReconsResponse?.data || []
  const isLoading = isLoadingBankRecons || isRefetchingBankRecons

  // Filter data by bankId and currencyId if provided
  const filteredData = data.filter((item) => {
    if (bankId && item.bankId !== bankId) return false
    if (currencyId && item.currencyId !== currencyId) return false
    return true
  })

  const formatNumber = (value: number, decimals: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const columns: ColumnDef<ICbBankReconHd>[] = [
    {
      accessorKey: "reconNo",
      header: "No",
      size: 150,
    },
    {
      accessorKey: "accountDate",
      header: "Account Date",
      size: 120,
      cell: ({ row }) => {
        const date = row.original.accountDate
          ? new Date(row.original.accountDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "bankId",
      header: "Bank Name",
      size: 150,
      cell: ({ row }) => {
        // You may need to fetch bank name from a lookup
        return row.original.bankId || "-"
      },
    },
    {
      accessorKey: "currencyId",
      header: "Currency",
      size: 100,
      cell: ({ row }) => {
        // You may need to fetch currency name from a lookup
        return row.original.currencyId || "-"
      },
    },
    {
      accessorKey: "totAmt",
      header: "Total Amount",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.totAmt || 0, 2)}
        </div>
      ),
    },
    {
      accessorKey: "opBalAmt",
      header: "Opening Balance",
      size: 140,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.opBalAmt || 0, 2)}
        </div>
      ),
    },
    {
      accessorKey: "clBalAmt",
      header: "Closing Balance",
      size: 140,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.clBalAmt || 0, 2)}
        </div>
      ),
    },
    {
      accessorKey: "debitTotAmt",
      header: "Debit Total",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.debitTotAmt ?? 0, 2)}
        </div>
      ),
    },
    {
      accessorKey: "creditTotAmt",
      header: "Credit Total",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.creditTotAmt ?? 0, 2)}
        </div>
      ),
    },
    {
      accessorKey: "allocTotAmt",
      header: "Allocated Total",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.allocTotAmt ?? 0, 2)}
        </div>
      ),
    },
    {
      accessorKey: "unAllocTotAmt",
      header: "Unallocated Total",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.original.unAllocTotAmt ?? 0, 2)}
        </div>
      ),
    },
    {
      accessorKey: "referenceNo",
      header: "Reference No",
      size: 120,
    },
  ]

  const handleSearch = () => {
    refetchBankRecons()
  }

  const handleDialogFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    const searchValue = filters.search || ""
    setSearchQuery(searchValue)
  }

  const handleRowSelect = (row: ICbBankReconHd | null) => {
    if (row) {
      onSelectBankReconAction(row.reconNo || "", row.reconId || "")
      onOpenChangeAction(false)
    }
  }

  // Reset search when dialog opens and refetch when bankId changes
  useEffect(() => {
    if (open && bankId && bankId > 0) {
      setSearchQuery("")
      refetchBankRecons()
    }
  }, [open, bankId, refetchBankRecons])

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="flex h-[90vh] w-[90vw] !max-w-none flex-col rounded-lg">
        <DialogHeader>
          <DialogTitle>Bank Reconciliation Details</DialogTitle>
          <DialogDescription>
            Select a bank reconciliation from the list below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
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

              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="mr-1 h-4 w-4" />
                Search
              </Button>
            </div>
          </FormProvider>
          <Separator className="mb-4" />

          <DialogDataTable
            data={filteredData}
            columns={columns}
            isLoading={isLoading}
            moduleId={moduleId}
            transactionId={transactionId}
            tableName={TableName.cbBankRecon}
            emptyMessage="No bank reconciliations found."
            onRefreshAction={() => refetchBankRecons()}
            onFilterChange={handleDialogFilterChange}
            initialSearchValue={searchQuery}
            onRowSelect={handleRowSelect}
            showSearch={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
