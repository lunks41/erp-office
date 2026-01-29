"use client"

import { useMemo } from "react"
import { IInvalidTransaction } from "@/interfaces/history"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { InquiryTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useCompanyLookup } from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import { BasicTable } from "@/components/table/table-basic"

interface InvalidTransactionTableProps {
  data: IInvalidTransaction[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  onRefreshAction?: () => void
}

export function InvalidTransactionTable({
  data,
  isLoading = false,
  moduleId = ModuleId.inquiry,
  transactionId = InquiryTransactionId.invalidtransaction,
  onRefreshAction,
}: InvalidTransactionTableProps) {
  const { decimals } = useAuthStore()
  const { data: companies = [] } = useCompanyLookup()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const locAmtDec = decimals[0]?.locAmtDec || 2

  // Create a map for quick company lookup
  const companyMap = useMemo(() => {
    const map = new Map<number, string>()
    companies.forEach((company) => {
      map.set(company.companyId, company.companyName)
    })
    return map
  }, [companies])

  // Define columns for Invalid transaction table based on IInvalidTransaction interface
  const columns: ColumnDef<IInvalidTransaction>[] = useMemo(
    () => [
      {
        accessorKey: "companyId",
        header: "Company",
        size: 150,
        minSize: 120,
        maxSize: 200,
        hidden: true,
      },
      {
        accessorKey: "issues",
        header: "Issues",
        size: 140,
        minSize: 100,
        maxSize: 180,
        cell: ({ row }: { row: { original: IInvalidTransaction } }) => (
          <Badge variant="destructive">{row.original.issues}</Badge>
        ),
      },
      {
        accessorKey: "trnType",
        header: "TrnType",
        size: 130,
        minSize: 100,
        maxSize: 160,
        cell: ({ row }: { row: { original: IInvalidTransaction } }) => (
          <Badge variant="default">{row.original.trnType}</Badge>
        ),
      },
      {
        accessorKey: "glId",
        header: "GLId",
        size: 100,
        minSize: 80,
        maxSize: 120,
        hidden: true,
      },
      {
        accessorKey: "moduleId",
        header: "ModuleId",
        size: 100,
        minSize: 80,
        maxSize: 120,
        hidden: true,
      },
      {
        accessorKey: "transactionId",
        header: "TransactionId",
        size: 130,
        minSize: 100,
        maxSize: 160,
        hidden: true,
      },
      {
        accessorKey: "documentId",
        header: "DocumentId",
        size: 150,
        minSize: 120,
        maxSize: 180,
        hidden: true,
      },
      {
        accessorKey: "documentNo",
        header: "DocumentNo",
        size: 160,
        minSize: 130,
        maxSize: 200,
        cell: ({ row }: { row: { original: IInvalidTransaction } }) => (
          <div className="text-wrap">{row.original.documentNo || "-"}</div>
        ),
      },
      {
        accessorKey: "accountDate",
        header: "AccountDate",
        size: 130,
        minSize: 110,
        maxSize: 150,
        cell: ({ row }: { row: { original: IInvalidTransaction } }) => {
          const date = row.original.accountDate
            ? new Date(row.original.accountDate)
            : null
          return date ? format(date, dateFormat) : "-"
        },
      },
      {
        accessorKey: "totLocalAmt",
        header: "TotLocalAmt",
        size: 140,
        minSize: 120,
        maxSize: 180,
        cell: ({ row }: { row: { original: IInvalidTransaction } }) => {
          const amount = row.original.totLocalAmt || 0
          return (
            <div className="text-right font-medium">
              {amount.toLocaleString(undefined, {
                minimumFractionDigits: locAmtDec,
                maximumFractionDigits: locAmtDec,
              })}
            </div>
          )
        },
        meta: {
          align: "right",
        },
      },
      {
        accessorKey: "seqOrd",
        header: "SeqOrd",
        size: 100,
        minSize: 80,
        maxSize: 120,
        cell: ({ row }: { row: { original: IInvalidTransaction } }) => (
          <div className="text-center">{row.original.seqOrd || "-"}</div>
        ),
        meta: {
          align: "center",
        },
      },
    ],
    [dateFormat, locAmtDec]
  )

  return (
    <div className="w-full">
      <BasicTable
        data={data as IInvalidTransaction[]}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.glPostDetails}
        emptyMessage="No Invalid transactions found across all companies."
        onRefreshAction={onRefreshAction}
        showHeader={true}
        showFooter={false}
      />
    </div>
  )
}
