import { useCallback, useEffect, useState } from "react"
import { IApOutTransaction } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { APTransactionId, ModuleId, TableName } from "@/lib/utils"
import { AccountBaseTable } from "@/components/table/table-account"

// Extended column definition with hide property
type ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

// Use flexible data type that can work with form data
interface ApOutStandingTransactionsTableProps {
  data: IApOutTransaction[]
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  visible: IVisibleFields
  onSelect?: (transaction: IApOutTransaction | null) => void
  onBulkSelectionChange?: (selectedIds: string[]) => void
  initialSelectedIds?: string[]
}

export default function ApOutStandingTransactionsTable({
  data,
  onRefreshAction,
  onFilterChange,
  onSelect,
  onBulkSelectionChange,
  initialSelectedIds,
  visible: _visible,
}: ApOutStandingTransactionsTableProps) {
  const [mounted, setMounted] = useState(false)
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat

  const formatDate = useCallback(
    (value: string | Date | null | undefined) => {
      if (!value) return "-"
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? "-" : format(value, dateFormat)
      }
      const parsed = parseDate(value)
      if (!parsed) return value
      return format(parsed, dateFormat)
    },
    [dateFormat]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = useCallback(() => {
    if (onRefreshAction) {
      onRefreshAction()
    }
  }, [onRefreshAction])

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      if (onFilterChange) {
        onFilterChange(filters)
      }
    },
    [onFilterChange]
  )

  const handleSelect = useCallback(
    (transaction: IApOutTransaction | null) => {
      if (onSelect) {
        onSelect(transaction)
      }
    },
    [onSelect]
  )

  const handleBulkSelectionChange = useCallback(
    (selectedIds: string[]) => {
      if (onBulkSelectionChange) {
        onBulkSelectionChange(selectedIds)
      }
    },
    [onBulkSelectionChange]
  )

  // Define columns based on IApOutTransaction interface
  const columns: ExtendedColumnDef<IApOutTransaction>[] = [
    {
      accessorKey: "accountDate",
      header: "Account Date",
      size: 120,
      cell: ({ row }: { row: { original: IApOutTransaction } }) =>
        formatDate(row.original.accountDate),
    },
    {
      accessorKey: "suppNo",
      header: "Invoice No",
      size: 120,
    },
    {
      accessorKey: "trnType",
      header: "Trn Type",
      size: 120,
    },
    {
      accessorKey: "currencyCode",
      header: "Currency",
      size: 100,
    },
    {
      accessorKey: "totAmt",
      header: "Total Amt",
      size: 120,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">
          {formatNumber(row.original.totAmt, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmt",
      header: "Total Local Amt",
      size: 120,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">
          {formatNumber(row.original.totLocalAmt, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "balAmt",
      header: "Balance Amt",
      size: 120,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">
          {formatNumber(row.original.balAmt, amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "balLocalAmt",
      header: "Balance Local Amt",
      size: 140,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">
          {formatNumber(row.original.balLocalAmt, locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "documentNo",
      header: "Document No",
      size: 120,
    },
    {
      accessorKey: "referenceNo",
      header: "Reference No",
      size: 120,
    },
    {
      accessorKey: "exhRate",
      header: "Exchange Rate",
      size: 100,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">
          {formatNumber(row.original.exhRate, exhRateDec)}
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      size: 120,
      cell: ({ row }: { row: { original: IApOutTransaction } }) =>
        formatDate(row.original.dueDate),
    },
    {
      accessorKey: "moduleId",
      header: "Module ID",
      size: 100,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">{row.original.moduleId}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      size: 100,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">{row.original.transactionId}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "documentId",
      header: "Document ID",
      size: 100,
      cell: ({ row }: { row: { original: IApOutTransaction } }) => (
        <div className="text-right">{row.original.documentId}</div>
      ),
      hidden: true,
    },
  ]

  // Filter out columns with hidden: true
  const visibleColumns = columns.filter((column) => !column.hidden)

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full">
      <AccountBaseTable
        data={data}
        columns={visibleColumns as ColumnDef<IApOutTransaction>[]}
        moduleId={ModuleId.ap}
        transactionId={APTransactionId.payment}
        tableName={TableName.apOutTransaction}
        emptyMessage="No outstanding transactions found."
        accessorId="documentId"
        onRefreshAction={handleRefresh}
        onFilterChange={handleFilterChange}
        onSelect={handleSelect}
        onBulkSelectionChange={handleBulkSelectionChange}
        initialSelectedIds={initialSelectedIds}
        showHeader={false}
        showActions={true}
        hideEdit={true}
        hideDelete={true}
        hideCheckbox={false}
        disableOnAccountExists={false}
        maxHeight="calc(80vh - 250px)"
      />
    </div>
  )
}
