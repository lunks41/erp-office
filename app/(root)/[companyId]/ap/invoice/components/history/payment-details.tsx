import {
  KeyboardEvent,
  useCallback,
  useMemo } from "react"
import { useParams } from "next/navigation"
import { ApiResponse } from "@/interfaces/auth"
import { IPaymentHistoryDetails } from "@/interfaces/history"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { APTransactionId,
  ModuleId,
  TableName } from "@/lib/utils"
import { useGetPaymentDetails } from "@/hooks/use-histoy"
import { BasicTable } from "@/components/table/table-basic"
import {
  HISTORY_EMBEDDED_PAGE_SIZE,
  HISTORY_EMBEDDED_TABLE_MAX_HEIGHT,
  HISTORY_SECTION_CONTENT_CLASS,
  HISTORY_SECTION_HEADER_CLASS,
  HISTORY_SECTION_TITLE_CLASS,
} from "@/components/table/history-embedded-presets"


import { useCompanyStore } from "@/stores/company-store"
interface PaymentDetailsProps {
  invoiceId: string
}

export default function PaymentDetails({ invoiceId }: PaymentDetailsProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const params = useParams()
  const companyId = params.companyId as string
  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.invoice

  const { data: paymentDetails, refetch: refetchPayment } =
    useGetPaymentDetails<IPaymentHistoryDetails>(
      Number(moduleId),
      Number(transactionId),
      invoiceId
    )

  const { data: paymentDetailsData } =
    (paymentDetails as ApiResponse<IPaymentHistoryDetails>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const getTargetPath = useCallback(
    (transactionIdValue: number): string | null => {
      if (!companyId) return null

      switch (transactionIdValue) {
        case APTransactionId.payment:
          return `/${companyId}/ap/payment`
        case APTransactionId.refund:
          return `/${companyId}/ap/refund`
        case APTransactionId.docsetoff:
          return `/${companyId}/ap/docsetoff`

        case APTransactionId.invoice:
          return `/${companyId}/ap/invoice`
        case APTransactionId.debitNote:
          return `/${companyId}/ap/debitnote`
        case APTransactionId.creditNote:
          return `/${companyId}/ap/creditnote`
        case APTransactionId.adjustment:
          return `/${companyId}/ap/adjustment`
        default:
          return null
      }
    },
    [companyId]
  )

  const getStorageKey = useCallback((targetPath: string | null) => {
    return targetPath ? `history-doc:${targetPath}` : null
  }, [])

  const handleDocumentNavigation = useCallback(
    (detail: IPaymentHistoryDetails) => {
      const transactionIdValue = Number(detail.transactionId)
      const documentId = detail.documentId?.toString().trim()

      if (!documentId || !Number.isFinite(transactionIdValue)) {
        return
      }

      const targetPath = getTargetPath(transactionIdValue)
      if (!targetPath) return

      if (typeof window !== "undefined") {
        const storageKey = getStorageKey(targetPath)
        if (storageKey) {
          window.localStorage.setItem(storageKey, documentId)
        }
        window.open(targetPath, "_blank", "noopener,noreferrer")
      }
    },
    [getStorageKey, getTargetPath]
  )

  const columns: ColumnDef<IPaymentHistoryDetails>[] = useMemo(
    () => [
      {
        accessorKey: "documentNo",
        header: "Document No",
        cell: ({ row }) => {
          const docNo = row.original.documentNo
          const isClickable = !!docNo
          const handleActivate = () => {
            if (isClickable) {
              handleDocumentNavigation(row.original)
            }
          }

          const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
            if (!isClickable) return

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              handleActivate()
            }
          }

          return isClickable ? (
            <button
              type="button"
              onDoubleClick={handleActivate}
              onKeyDown={handleKeyDown}
              className="text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              {docNo}
            </button>
          ) : (
            "-"
          )
        },
      },
      {
        accessorKey: "referenceNo",
        header: "Reference No",
      },
      {
        accessorKey: "accountDate",
        header: "Account Date",
        cell: ({ row }) => {
          const date = row.original.accountDate
            ? new Date(row.original.accountDate.toString())
            : null
          return date ? format(date, dateFormat) : "-"
        },
      },
      {
        accessorKey: "totAmt",
        header: "Total Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.totAmt
              ? formatNumber(row.original.totAmt, amtDec)
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "totLocalAmt",
        header: "Local Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.totLocalAmt
              ? formatNumber(row.original.totLocalAmt, locAmtDec)
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "allAmt",
        header: "Allocated Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.allAmt
              ? formatNumber(row.original.allAmt, amtDec)
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "allLocalAmt",
        header: "Allocated Local Amount",
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.allLocalAmt
              ? formatNumber(row.original.allLocalAmt, locAmtDec)
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "exGainLoss",
        header: "Exchange Gain/Loss",
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.exGainLoss
              ? formatNumber(Number(row.original.exGainLoss), amtDec)
              : "-"}
          </div>
        ),
      },
    ],
    [amtDec, dateFormat, handleDocumentNavigation, locAmtDec]
  )

  const handleRefresh = async () => {
    try {
      await refetchPayment()
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  return (
    <div>
      <div className={HISTORY_SECTION_HEADER_CLASS}>
        <p className={HISTORY_SECTION_TITLE_CLASS}>Payment Details</p>
      </div>
      <div className={HISTORY_SECTION_CONTENT_CLASS}>
        <BasicTable
          data={paymentDetailsData || []}
          columns={columns}
          isLoading={false}
          moduleId={moduleId}
          transactionId={transactionId}
          tableName={TableName.paymentDetails}
          onRefreshAction={handleRefresh}
          showHeader={true}
          showFooter={false}
          emptyMessage="No results."
          maxHeight={HISTORY_EMBEDDED_TABLE_MAX_HEIGHT}
          pageSizeOption={HISTORY_EMBEDDED_PAGE_SIZE}
        />
      </div>
    </div>
  )
}
