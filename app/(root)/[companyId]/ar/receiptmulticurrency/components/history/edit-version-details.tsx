"use client"

import { useCompanyStore } from "@/stores/company-store"

import {
  useState } from "react"
import { IArReceiptDt,
  IArReceiptHd } from "@/interfaces"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { ARTransactionId,
  ModuleId,
  TableName } from "@/lib/utils"
import {
  useGetARReceiptHistoryDetails,
  useGetARReceiptHistoryList,
  } from "@/hooks/use-ar"
import { Alert,
  AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  } from "@/components/ui/dialog"
import { BasicTable } from "@/components/table/table-basic"
import { DialogDataTable } from "@/components/table/table-dialog"
import {
  HISTORY_EMBEDDED_FILLER_TARGET_ROWS,
  HISTORY_EMBEDDED_TABLE_MAX_HEIGHT,
  HISTORY_SECTION_CONTENT_CLASS,
  HISTORY_SECTION_HEADER_CLASS,
  HISTORY_SECTION_TITLE_CLASS,
} from "@/components/table/history-embedded-presets"

interface EditVersionDetailsProps {
  receiptId: string
}

export default function EditVersionDetails({
  receiptId,
}: EditVersionDetailsProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.receipt

  const [selectedReceipt, setSelectedReceipt] = useState<IArReceiptHd | null>(
    null
  )

  const { data: receiptHistoryData, refetch: refetchHistory } =
    useGetARReceiptHistoryList<IArReceiptHd[]>(receiptId)

  const { data: receiptDetailsData, refetch: refetchDetails } =
    useGetARReceiptHistoryDetails<IArReceiptHd>(
      selectedReceipt?.receiptId || "",
      selectedReceipt?.editVersion?.toString() || ""
    )

  function isIArReceiptHdArray(arr: unknown): arr is IArReceiptHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 ||
        (typeof arr[0] === "object" && "receiptId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: IArReceiptHd[] =
    receiptHistoryData?.result === 1 &&
    isIArReceiptHdArray(receiptHistoryData?.data)
      ? receiptHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: IArReceiptHd | undefined =
    receiptDetailsData?.result === 1 &&
    receiptDetailsData?.data &&
    typeof receiptDetailsData.data === "object" &&
    receiptDetailsData.data !== null &&
    !Array.isArray(receiptDetailsData.data)
      ? (receiptDetailsData.data as IArReceiptHd)
      : undefined

  // Check for API errors
  const hasHistoryError = receiptHistoryData?.result === -1
  const hasDetailsError = receiptDetailsData?.result === -1

  const columns: ColumnDef<IArReceiptHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "receiptNo",
      header: "Receipt No",
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
      accessorKey: "customerCode",
      header: "Customer Code",
    },
    {
      accessorKey: "customerName",
      header: "Customer Name",
    },
    {
      accessorKey: "currencyCode",
      header: "Currency Code",
    },
    {
      accessorKey: "currencyName",
      header: "Currency Name",
    },
    {
      accessorKey: "exhRate",
      header: "Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.exhRate
            ? formatNumber(row.original.exhRate, exhRateDec)
            : "-"}
        </div>
      ),
    },

    {
      accessorKey: "bankCode",
      header: "Bank Code",
    },
    {
      accessorKey: "bankName",
      header: "Bank Name",
    },
    {
      accessorKey: "paymentTypeCode",
      header: "Receipt Type Code",
    },
    {
      accessorKey: "paymentTypeName",
      header: "Receipt Type Name",
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
      header: "Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totLocalAmt
            ? formatNumber(row.original.totLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "recTotAmt",
      header: "Pay Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.recTotAmt
            ? formatNumber(row.original.recTotAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "recTotLocalAmt",
      header: "Pay Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.recTotLocalAmt
            ? formatNumber(row.original.recTotLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "unAllocTotAmt",
      header: "Unallocated Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.unAllocTotAmt
            ? formatNumber(row.original.unAllocTotAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "unAllocTotLocalAmt",
      header: "Unallocated Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.unAllocTotLocalAmt
            ? formatNumber(row.original.unAllocTotLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "exhGainLoss",
      header: "Exchange Gain/Loss",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.exhGainLoss
            ? formatNumber(row.original.exhGainLoss, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "bankChgAmt",
      header: "Bank Charges Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.bankChgAmt
            ? formatNumber(row.original.bankChgAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "bankChgLocalAmt",
      header: "Bank Charges Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.bankChgLocalAmt
            ? formatNumber(row.original.bankChgLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "isCustPayBankChg",
      header: "Is Cust Bank Chg",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isCustPayBankChg ? "Yes" : "No"}
        </div>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "createByCode",
      header: "Created By Code",
    },
    {
      accessorKey: "createBy",
      header: "Created By Name",
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
      accessorKey: "editByCode",
      header: "Edited By Code",
    },
    {
      accessorKey: "editBy",
      header: "Edited By Name",
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

  const detailsColumns: ColumnDef<IArReceiptDt>[] = [
    { accessorKey: "itemNo", header: "Item No" },
    { accessorKey: "documentNo", header: "Document No" },
    { accessorKey: "referenceNo", header: "Reference No" },
    {
      accessorKey: "docTotAmt",
      header: "Document Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.docTotAmt
            ? formatNumber(row.original.docTotAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "docTotLocalAmt",
      header: "Document Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.docTotLocalAmt
            ? formatNumber(row.original.docTotLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "allocAmt",
      header: "Allocated Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.allocAmt
            ? formatNumber(row.original.allocAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "allocLocalAmt",
      header: "Allocated Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.allocLocalAmt
            ? formatNumber(row.original.allocLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "docBalAmt",
      header: "Document Balance Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.docBalAmt
            ? formatNumber(row.original.docBalAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "docBalLocalAmt",
      header: "Document Balance Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.docBalLocalAmt
            ? formatNumber(row.original.docBalLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "exhGainLoss",
      header: "Exchange Gain/Loss",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.exhGainLoss
            ? formatNumber(row.original.exhGainLoss, locAmtDec)
            : "-"}
        </div>
      ),
    },
  ]

  const handleRefresh = async () => {
    try {
      // Only refetch if we don't have a "Data does not exist" error
      if (
        !hasHistoryError ||
        receiptHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        receiptDetailsData?.message !== "Data does not exist"
      ) {
        await refetchDetails()
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  return (
    <>
      <div>
        <div className={HISTORY_SECTION_HEADER_CLASS}>
          <p className={HISTORY_SECTION_TITLE_CLASS}>Edit Version Details</p>
        </div>
        <div className={HISTORY_SECTION_CONTENT_CLASS}>
          <DialogDataTable
            data={tableData}
            columns={columns}
            isLoading={false}

            maxHeight={HISTORY_EMBEDDED_TABLE_MAX_HEIGHT}

            fillerTargetRows={HISTORY_EMBEDDED_FILLER_TARGET_ROWS}
            moduleId={moduleId}
            transactionId={transactionId}
            tableName={TableName.arReceiptHistory}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={(receipt) => setSelectedReceipt(receipt)}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedReceipt}
        onOpenChange={() => setSelectedReceipt(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>

          {/* Error handling for details data */}
          {hasDetailsError && (
            <Alert
              variant={
                receiptDetailsData?.message === "Data does not exist"
                  ? "default"
                  : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {receiptDetailsData?.message === "Data does not exist"
                  ? "No receipt details found for this version."
                  : `Failed to load receipt details: ${receiptDetailsData?.message || "Unknown error"}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Header</CardTitle>
              </CardHeader>
              <CardContent>
                {dialogData ? (
                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(dialogData).map(([key, value]) =>
                      key !== "data_details" ? (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-muted-foreground text-sm">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4 text-center">
                    {hasDetailsError
                      ? "Error loading receipt details"
                      : "No receipt details available"}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Receipt Details</CardTitle>
              </CardHeader>
              <CardContent>
                <BasicTable
                  data={dialogData?.data_details || []}
                  columns={detailsColumns}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  tableName={TableName.arReceiptHistory}
                  emptyMessage="No receipt details available"
                  onRefreshAction={handleRefresh}
                  showHeader={true}
                  showFooter={false}
                  maxHeight="300px"
                />
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
