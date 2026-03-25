"use client"

import { KeyboardEvent, useCallback, useMemo } from "react"
import { useParams } from "next/navigation"
import { IInvalidTransaction } from "@/interfaces/history"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import {
  APTransactionId,
  ARTransactionId,
  CBTransactionId,
  GLTransactionId,
  InquiryTransactionId,
  ModuleId,
  TableName,
} from "@/lib/utils"
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
  const params = useParams()
  const companyId = params.companyId as string
  const routeCompanyId = companyId?.trim() || null
  const { decimals } = useAuthStore()
  const { hasPermission } = usePermissionStore()
  const { data: companies = [] } = useCompanyLookup()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const locAmtDec = decimals[0]?.locAmtDec || 2

  // Create a map for quick company lookup
  const _companyMap = useMemo(() => {
    const map = new Map<number, string>()
    companies.forEach((company) => {
      map.set(company.companyId, company.companyName)
    })
    return map
  }, [companies])

  const canNavigateToTransaction = useCallback(
    (moduleIdValue: number, transactionIdValue: number) => {
      if (!Number.isFinite(moduleIdValue)) return false
      if (!Number.isFinite(transactionIdValue)) return false
      return hasPermission(moduleIdValue, transactionIdValue, "isRead")
    },
    [hasPermission]
  )

  const getTargetPath = useCallback(
    (
      companyIdValue: number | string | null | undefined,
      moduleIdValue: number,
      transactionIdValue: number
    ): string | null => {
      if (companyIdValue == null || companyIdValue === "") return null
      const companyId =
        typeof companyIdValue === "string"
          ? companyIdValue.trim()
          : String(companyIdValue)
      if (!companyId || companyId === "undefined" || companyId === "null")
        return null

      switch (moduleIdValue) {
        case ModuleId.ar:
          switch (transactionIdValue) {
            case ARTransactionId.invoice:
              return `/${companyId}/ar/invoice`
            case ARTransactionId.invoicectm:
              return `/${companyId}/ar/invoicectm`
            case ARTransactionId.debitNote:
              return `/${companyId}/ar/debitnote`
            case ARTransactionId.creditNote:
              return `/${companyId}/ar/creditnote`
            case ARTransactionId.adjustment:
              return `/${companyId}/ar/adjustment`
            case ARTransactionId.receipt:
              return `/${companyId}/ar/receipt`
            case ARTransactionId.refund:
              return `/${companyId}/ar/refund`
            case ARTransactionId.docsetoff:
              return `/${companyId}/ar/docsetoff`
            default:
              return null
          }
        case ModuleId.ap:
          switch (transactionIdValue) {
            case APTransactionId.invoice:
              return `/${companyId}/ap/invoice`
            case APTransactionId.debitNote:
              return `/${companyId}/ap/debitnote`
            case APTransactionId.creditNote:
              return `/${companyId}/ap/creditnote`
            case APTransactionId.adjustment:
              return `/${companyId}/ap/adjustment`
            case APTransactionId.payment:
              return `/${companyId}/ap/payment`
            case APTransactionId.refund:
              return `/${companyId}/ap/refund`
            case APTransactionId.docsetoff:
              return `/${companyId}/ap/docsetoff`
            default:
              return null
          }
        case ModuleId.cb:
          switch (transactionIdValue) {
            case CBTransactionId.cbgenreceipt:
              return `/${companyId}/cb/cbgenreceipt`
            case CBTransactionId.cbgenpayment:
              return `/${companyId}/cb/cbgenpayment`
            case CBTransactionId.cbpettycash:
              return `/${companyId}/cb/cbpettycash`
            case CBTransactionId.cbbanktransfer:
              return `/${companyId}/cb/cbbanktransfer`
            case CBTransactionId.cbbanktransferctm:
              return `/${companyId}/cb/cbbanktransferctm`
            case CBTransactionId.cbbankrecon:
              return `/${companyId}/cb/cbbankrecon`
            default:
              return null
          }
        case ModuleId.gl:
          switch (transactionIdValue) {
            case GLTransactionId.journalentry:
              return `/${companyId}/gl/journalentry`
            case GLTransactionId.arapcontra:
              return `/${companyId}/gl/arapcontra`
            default:
              return null
          }
        default:
          return null
      }
    },
    []
  )

  const getStorageKey = useCallback((targetPath: string | null) => {
    return targetPath ? `history-doc:${targetPath}` : null
  }, [])

  const handleDocumentNavigation = useCallback(
    (row: IInvalidTransaction) => {
      const rowCompanyId = row.companyId
      const companyIdValue =
        rowCompanyId != null && Number.isFinite(Number(rowCompanyId))
          ? rowCompanyId
          : routeCompanyId
      const moduleIdValue = Number(row.moduleId)
      const transactionIdValue = Number(row.transactionId)
      const documentId = row.documentId?.toString().trim()

      if (
        !companyIdValue ||
        !documentId ||
        !Number.isFinite(moduleIdValue) ||
        !Number.isFinite(transactionIdValue)
      ) {
        return
      }

      const targetPath = getTargetPath(
        companyIdValue,
        moduleIdValue,
        transactionIdValue
      )
      if (!targetPath) return

      if (typeof window !== "undefined") {
        const storageKey = getStorageKey(targetPath)
        if (storageKey) {
          window.localStorage.setItem(storageKey, documentId)
        }
        window.open(targetPath, "_blank", "noopener,noreferrer")
      }
    },
    [getStorageKey, getTargetPath, routeCompanyId]
  )

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
        cell: ({ row }: { row: { original: IInvalidTransaction } }) => {
          const docNo = row.original.documentNo?.toString().trim() || ""
          const rowCompanyId = row.original.companyId
          const moduleIdValue = Number(row.original.moduleId)
          const transactionIdValue = Number(row.original.transactionId)
          const hasRowCompany =
            rowCompanyId != null && Number.isFinite(Number(rowCompanyId))
          const hasValidCompany = hasRowCompany || !!routeCompanyId
          const canViewDocument =
            !!docNo &&
            hasValidCompany &&
            canNavigateToTransaction(moduleIdValue, transactionIdValue)

          const handleActivate = () => {
            if (canViewDocument) {
              handleDocumentNavigation(row.original)
            }
          }

          const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
            if (!canViewDocument) return
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              handleActivate()
            }
          }

          return canViewDocument ? (
            <button
              type="button"
              onClick={handleActivate}
              onKeyDown={handleKeyDown}
              className="text-primary cursor-pointer text-left truncate underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              {docNo}
            </button>
          ) : docNo ? (
            <div className="text-muted-foreground truncate">{docNo}</div>
          ) : (
            <div className="truncate">-</div>
          )
        },
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
    [
      dateFormat,
      locAmtDec,
      routeCompanyId,
      canNavigateToTransaction,
      handleDocumentNavigation,
    ]
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
