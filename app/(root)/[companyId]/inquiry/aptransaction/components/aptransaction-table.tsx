"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { IApOutTransaction } from "@/interfaces/outtransaction"
import { IVisibleFields } from "@/interfaces/setting"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { APTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useCompanyLookup } from "@/hooks/use-lookup"
import { AccountBaseTable } from "@/components/table/table-account"

// Extended column definition with hide property
type ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

interface ApTransactionTableProps {
  data: IApOutTransaction[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  visible: IVisibleFields
}

export function ApTransactionTable({
  data,
  isLoading: _isLoading = false,
  moduleId = ModuleId.ap,
  transactionId = APTransactionId.payment,
  onRefreshAction,
  onFilterChange,
  visible: _visible,
}: ApTransactionTableProps) {
  const [mounted, setMounted] = useState(false)
  const { decimals } = useCompanyStore()
  const { data: companies = [] } = useCompanyLookup()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat

  // Create a map for quick company lookup
  const companyMap = useMemo(() => {
    const map = new Map<number, string>()
    companies.forEach((company) => {
      map.set(company.companyId, company.companyName)
    })
    return map
  }, [companies])

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

  // Define columns based on IApOutTransaction interface with company column
  const columns: ExtendedColumnDef<IApOutTransaction>[] = useMemo(
    () => [
      {
        accessorKey: "companyId",
        header: "Company",
        size: 150,
        cell: ({ row }) => {
          const companyId = row.original.companyId
          const companyName =
            companyMap.get(companyId) || `Company ${companyId}`
          return <div className="font-medium text-blue-600">{companyName}</div>
        },
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
        accessorKey: "accountDate",
        header: "Account Date",
        size: 120,
        cell: ({ row }) => formatDate(row.original.accountDate),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        size: 120,
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: "supplierName",
        header: "Supplier Name",
        size: 150,
      },
      {
        accessorKey: "supplierCode",
        header: "Supplier Code",
        size: 100,
        hidden: true,
      },
      {
        accessorKey: "currencyCode",
        header: "Currency",
        size: 80,
      },
      {
        accessorKey: "exhRate",
        header: "Exchange Rate",
        size: 120,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.original.exhRate, exhRateDec)}
          </div>
        ),
      },
      {
        accessorKey: "totAmt",
        header: "Total Amount",
        size: 120,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.original.totAmt, amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "totLocalAmt",
        header: "Total Local Amt",
        size: 130,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.original.totLocalAmt, locAmtDec)}
          </div>
        ),
      },
      {
        accessorKey: "balAmt",
        header: "Balance Amount",
        size: 120,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.original.balAmt, amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "balLocalAmt",
        header: "Balance Local Amt",
        size: 140,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.original.balLocalAmt, locAmtDec)}
          </div>
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 150,
      },
      {
        accessorKey: "createBy",
        header: "Created By",
        size: 120,
      },
      {
        accessorKey: "createDate",
        header: "Create Date",
        size: 120,
      },
      {
        accessorKey: "transactionId",
        header: "Transaction ID",
        size: 100,
        cell: ({ row }) => (
          <div className="truncate text-right">{row.original.transactionId}</div>
        ),
        hidden: true,
      },
      {
        accessorKey: "documentId",
        header: "Document ID",
        size: 100,
        cell: ({ row }) => (
          <div className="truncate text-right">{row.original.documentId}</div>
        ),
        hidden: true,
      },
    ],
    [formatDate, amtDec, locAmtDec, exhRateDec, companyMap]
  )

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
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.apOutTransaction}
        emptyMessage="No AP transactions found across all companies."
        accessorId="documentId"
        onRefreshAction={handleRefresh}
        onFilterChange={handleFilterChange}
        showHeader={false}
        showActions={true}
        hideEdit={true}
        hideDelete={true}
        hideCheckbox={true}
        disableOnAccountExists={false}
      />
    </div>
  )
}
