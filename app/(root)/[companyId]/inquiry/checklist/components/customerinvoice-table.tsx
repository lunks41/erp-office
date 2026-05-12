"use client"

import { useMemo } from "react"
import { IArInvoiceHd } from "@/interfaces/ar-invoice"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { JobTable } from "@/components/table/table-job"
import { useCompanyLookup } from "@/hooks/use-lookup"

interface CustomerInvoiceTableProps {
  data: IArInvoiceHd[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  onRefreshAction?: () => void
}

export function CustomerInvoiceTable({
  data,
  isLoading = false,
  moduleId,
  transactionId,
  onRefreshAction,
}: CustomerInvoiceTableProps) {
  const { decimals } = useCompanyStore()
  const { data: companies = [] } = useCompanyLookup()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  // Create a map for quick company lookup
  const companyMap = useMemo(() => {
    const map = new Map<number, string>()
    companies.forEach((company) => {
      map.set(company.companyId, company.companyName)
    })
    return map
  }, [companies])

  // Helper function to format address
  const formatAddress = (
    address1?: string,
    address2?: string,
    address3?: string,
    address4?: string
  ): string => {
    const parts = [address1, address2, address3, address4].filter(
      (part) => part && part.trim() !== ""
    )
    return parts.join(", ") || "-"
  }

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IArInvoiceHd>[] = useMemo(
    () => [
      {
        accessorKey: "companyId",
        header: "Company",
        cell: ({ row }) => {
          const companyId = row.original.companyId
          const companyName = companyMap.get(companyId) || `Company ${companyId}`
          return (
            <div className="font-medium text-muted-foreground">{companyName}</div>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "invoiceNo",
        header: "Invoice No - Account Date",
        cell: ({ row }) => {
          const invoiceNo = row.original.invoiceNo || "-"
          const accountDate = row.original.accountDate
            ? new Date(row.original.accountDate)
            : null
          const formattedDate = accountDate && isValid(accountDate)
            ? format(accountDate, dateFormat)
            : "-"

          return (
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <span className="font-medium">{invoiceNo}</span>
              <span className="text-muted-foreground">-</span>
              <Badge variant="outline" className="text-xs">
                {formattedDate}
              </Badge>
            </div>
          )
        },
        size: 200,
        minSize: 180,
        maxSize: 250,
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row }) => {
          const address = formatAddress(
            row.original.address1,
            row.original.address2,
            row.original.address3,
            row.original.address4
          )
          return (
            <div className="max-w-[300px] truncate text-sm" title={address}>
              {address}
            </div>
          )
        },
        size: 300,
        minSize: 200,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        size: 180,
        minSize: 140,
      },
      {
        accessorKey: "currencyCode",
        header: "Curr.",
        size: 60,
        minSize: 50,
      },
      {
        accessorKey: "totAmtAftGst",
        header: "Total Amount",
        cell: ({ row }) => {
          const amount = row.original.totAmtAftGst || 0
          return <div className="truncate text-right">{amount.toFixed(2)}</div>
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "balAmt",
        header: "Balance",
        cell: ({ row }) => {
          const amount = row.original.balAmt || 0
          return <div className="truncate text-right">{amount.toFixed(2)}</div>
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "isPost",
        header: "Posted",
        cell: ({ row }) => (
          <Badge variant={row.getValue("isPost") ? "default" : "secondary"}>
            {row.getValue("isPost") ? "Yes" : "No"}
          </Badge>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
          const date = row.original.dueDate
            ? new Date(row.original.dueDate)
            : null
          return date && isValid(date) ? format(date, dateFormat) : "-"
        },
        size: 120,
        minSize: 100,
      },
    ],
    [dateFormat, companyMap]
  )

  return (
    <div>
      <JobTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.checklist}
        emptyMessage="No customer invoices found across all companies."
        onRefreshAction={onRefreshAction}
        hideCreateButton={true}
      />
    </div>
  )
}

