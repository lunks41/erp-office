"use client"

import { useMemo } from "react"
import { IGlTransactionDetails } from "@/interfaces/history"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { GLTransactionId, ModuleId, TableName } from "@/lib/utils"
import { useCompanyLookup } from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import { BasicTable } from "@/components/table/table-basic"

interface GlTransactionTableProps {
  data: IGlTransactionDetails[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  onRefreshAction?: () => void
}

// Extended interface to include companyId for cross-company search
interface IGlTransactionDetailsWithCompany extends IGlTransactionDetails {
  companyId?: number
}

export function GlTransactionTable({
  data,
  isLoading = false,
  moduleId = ModuleId.gl,
  transactionId = GLTransactionId.journalentry,
  onRefreshAction,
}: GlTransactionTableProps) {
  const { decimals } = useCompanyStore()
  const { data: companies = [] } = useCompanyLookup()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  // Create a map for quick company lookup
  const companyMap = useMemo(() => {
    const map = new Map<number, string>()
    companies.forEach((company) => {
      map.set(company.companyId, company.companyName)
    })
    return map
  }, [companies])

  // Define columns for GL transaction table with company column
  const columns: ColumnDef<IGlTransactionDetailsWithCompany>[] = useMemo(
    () => [
      {
        accessorKey: "companyId",
        header: "Company",
        size: 150,
        cell: ({
          row,
        }: {
          row: { original: IGlTransactionDetailsWithCompany }
        }) => {
          const companyId = row.original.companyId
          if (companyId) {
            const companyName =
              companyMap.get(companyId) || `Company ${companyId}`
            return (
              <div className="font-medium text-muted-foreground">{companyName}</div>
            )
          }
          return "-"
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
        cell: ({
          row,
        }: {
          row: { original: IGlTransactionDetailsWithCompany }
        }) => {
          const date = row.original.accountDate
            ? new Date(row.original.accountDate)
            : null
          return date ? format(date, dateFormat) : "-"
        },
      },
      {
        accessorKey: "glCode",
        header: "GL Code",
        size: 100,
      },
      {
        accessorKey: "glName",
        header: "GL Name",
        size: 180,
      },
      {
        accessorKey: "isDebit",
        header: "Type",
        size: 80,
        cell: ({
          row,
        }: {
          row: { original: IGlTransactionDetailsWithCompany }
        }) => (
          <Badge variant={row.original.isDebit ? "default" : "secondary"}>
            {row.original.isDebit ? "Debit" : "Credit"}
          </Badge>
        ),
      },
      {
        accessorKey: "totAmt",
        header: "Amount",
        size: 120,
        cell: ({
          row,
        }: {
          row: { original: IGlTransactionDetailsWithCompany }
        }) => {
          const amount = row.original.totAmt || 0
          return (
            <div className="truncate text-right">
              {amount.toLocaleString(undefined, {
                minimumFractionDigits: amtDec,
                maximumFractionDigits: amtDec,
              })}
            </div>
          )
        },
      },
      {
        accessorKey: "totLocalAmt",
        header: "Local Amount",
        size: 130,
        cell: ({
          row,
        }: {
          row: { original: IGlTransactionDetailsWithCompany }
        }) => {
          const amount = row.original.totLocalAmt || 0
          return (
            <div className="truncate text-right">
              {amount.toLocaleString(undefined, {
                minimumFractionDigits: locAmtDec,
                maximumFractionDigits: locAmtDec,
              })}
            </div>
          )
        },
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
        cell: ({
          row,
        }: {
          row: { original: IGlTransactionDetailsWithCompany }
        }) => {
          const rate = row.original.exhRate || 0
          return (
            <div className="truncate text-right">
              {rate.toLocaleString(undefined, {
                minimumFractionDigits: exhRateDec,
                maximumFractionDigits: exhRateDec,
              })}
            </div>
          )
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 150,
      },
      {
        accessorKey: "moduleFrom",
        header: "Module",
        size: 100,
      },
      {
        accessorKey: "createBy",
        header: "Created By",
        size: 120,
      },
      {
        accessorKey: "createDate",
        header: "Created Date",
        size: 120,
        cell: ({
          row,
        }: {
          row: { original: IGlTransactionDetailsWithCompany }
        }) => {
          const date = row.original.createDate
            ? new Date(row.original.createDate)
            : null
          return date ? format(date, dateFormat) : "-"
        },
      },
    ],
    [dateFormat, amtDec, locAmtDec, exhRateDec, companyMap]
  )

  return (
    <div className="w-full">
      <BasicTable
        data={data as IGlTransactionDetailsWithCompany[]}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.glPostDetails}
        emptyMessage="No GL transactions found across all companies."
        onRefreshAction={onRefreshAction}
        showHeader={true}
        showFooter={false}
      />
    </div>
  )
}
