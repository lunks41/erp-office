"use client"

import { useCompanyStore } from "@/stores/company-store"

import {
  useState } from "react"
import { ICbBankTransfer } from "@/interfaces"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"

import { CBTransactionId,
  ModuleId,
  TableName } from "@/lib/utils"
import {
  useGetCbBankHistoryDetails,
  useGetCbBankHistoryList,
  } from "@/hooks/use-cb"
import { Alert,
  AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  } from "@/components/ui/dialog"
import { DialogDataTable } from "@/components/table/table-dialog"
import {
  HISTORY_EMBEDDED_FILLER_TARGET_ROWS,
  HISTORY_EMBEDDED_TABLE_MAX_HEIGHT,
  HISTORY_SECTION_CONTENT_CLASS,
  HISTORY_SECTION_HEADER_CLASS,
  HISTORY_SECTION_TITLE_CLASS,
} from "@/components/table/history-embedded-presets"

interface EditVersionDetailsProps {
  invoiceId: string
}

export default function EditVersionDetails({
  invoiceId,
}: EditVersionDetailsProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbanktransfer

  const [selectedBankTransfer, setSelectedBankTransfer] =
    useState<ICbBankTransfer | null>(null)

  const { data: bankTransferHistoryData, refetch: refetchHistory } =
    useGetCbBankHistoryList<ICbBankTransfer[]>(invoiceId)

  const { data: bankTransferDetailsData, refetch: refetchDetails } =
    useGetCbBankHistoryDetails<ICbBankTransfer>(
      selectedBankTransfer?.transferId?.toString() || "",
      selectedBankTransfer?.editVersion?.toString() || ""
    )

  function isICbBankTransferArray(arr: unknown): arr is ICbBankTransfer[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 ||
        (typeof arr[0] === "object" && "transferId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: ICbBankTransfer[] =
    bankTransferHistoryData?.result === 1 &&
    isICbBankTransferArray(bankTransferHistoryData?.data)
      ? bankTransferHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: ICbBankTransfer | undefined =
    bankTransferDetailsData?.result === 1 &&
    bankTransferDetailsData?.data &&
    typeof bankTransferDetailsData.data === "object" &&
    bankTransferDetailsData.data !== null &&
    !Array.isArray(bankTransferDetailsData.data)
      ? (bankTransferDetailsData.data as ICbBankTransfer)
      : undefined

  // Check for API errors
  const hasHistoryError = bankTransferHistoryData?.result === -1
  const hasDetailsError = bankTransferDetailsData?.result === -1

  const columns: ColumnDef<ICbBankTransfer>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
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
          {row.original.fromExhRate
            ? row.original.fromExhRate.toFixed(exhRateDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "fromBankChgAmt",
      header: "From Bank Charge Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.fromBankChgAmt
            ? row.original.fromBankChgAmt.toFixed(amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "fromBankChgLocalAmt",
      header: "From Bank Charge Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.fromBankChgLocalAmt
            ? row.original.fromBankChgLocalAmt.toFixed(locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "fromTotAmt",
      header: "From Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.fromTotAmt
            ? row.original.fromTotAmt.toFixed(amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "fromTotLocalAmt",
      header: "From Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.fromTotLocalAmt
            ? row.original.fromTotLocalAmt.toFixed(locAmtDec)
            : "-"}
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
          {row.original.toExhRate
            ? row.original.toExhRate.toFixed(exhRateDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "toBankChgAmt",
      header: "To Bank Charge Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toBankChgAmt
            ? row.original.toBankChgAmt.toFixed(amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "toBankChgLocalAmt",
      header: "To Bank Charge Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toBankChgLocalAmt
            ? row.original.toBankChgLocalAmt.toFixed(locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "toTotAmt",
      header: "To Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toTotAmt ? row.original.toTotAmt.toFixed(amtDec) : "-"}
        </div>
      ),
    },
    {
      accessorKey: "toTotLocalAmt",
      header: "To Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.toTotLocalAmt
            ? row.original.toTotLocalAmt.toFixed(locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "bankExhRate",
      header: "Bank Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.bankExhRate
            ? row.original.bankExhRate.toFixed(exhRateDec)
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
            ? row.original.exhGainLoss.toFixed(amtDec)
            : "-"}
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
  ]

  const handleRefresh = async () => {
    try {
      // Only refetch if we don't have a "Data does not exist" error
      if (
        !hasHistoryError ||
        bankTransferHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        bankTransferDetailsData?.message !== "Data does not exist"
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
          {/* Error handling for history data */}
          {hasHistoryError && (
            <Alert
              variant={
                bankTransferHistoryData?.message === "Data does not exist"
                  ? "default"
                  : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {bankTransferHistoryData?.message === "Data does not exist"
                  ? "No bank transfer history found for this record."
                  : `Failed to load bank transfer history: ${bankTransferHistoryData?.message || "Unknown error"}`}
              </AlertDescription>
            </Alert>
          )}
          <DialogDataTable
            data={tableData}
            columns={columns}
            isLoading={false}

            maxHeight={HISTORY_EMBEDDED_TABLE_MAX_HEIGHT}

            fillerTargetRows={HISTORY_EMBEDDED_FILLER_TARGET_ROWS}
            moduleId={moduleId}
            transactionId={transactionId}
            tableName={TableName.notDefine}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={(bankTransfer) =>
              setSelectedBankTransfer(bankTransfer)
            }
          />
        </div>
      </div>

      <Dialog
        open={!!selectedBankTransfer}
        onOpenChange={() => setSelectedBankTransfer(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>Bank Transfer Details</DialogTitle>
          </DialogHeader>

          {/* Error handling for details data */}
          {hasDetailsError && (
            <Alert
              variant={
                bankTransferDetailsData?.message === "Data does not exist"
                  ? "default"
                  : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {bankTransferDetailsData?.message === "Data does not exist"
                  ? "No bank transfer details found for this version."
                  : `Failed to load bank transfer details: ${bankTransferDetailsData?.message || "Unknown error"}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Card>
              <CardHeader>
                <CardTitle>Bank Transfer Details</CardTitle>
              </CardHeader>
              <CardContent>
                {dialogData ? (
                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(dialogData).map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-sm">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4 text-center">
                    {hasDetailsError
                      ? "Error loading bank transfer details"
                      : "No bank transfer details available"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
