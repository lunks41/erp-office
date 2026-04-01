"use client"

import { useState } from "react"
import { IApRefundDt, IApRefundHd } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { APTransactionId, ModuleId, TableName } from "@/lib/utils"
import {
  useGetAPRefundHistoryDetails,
  useGetAPRefundHistoryList,
} from "@/hooks/use-ap"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
} from "@/components/table/history-embedded-presets"

interface EditVersionDetailsProps {
  refundId: string
}

export default function EditVersionDetails({
  refundId,
}: EditVersionDetailsProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.ap
  const transactionId = APTransactionId.refund

  const [selectedRefund, setSelectedRefund] = useState<IApRefundHd | null>(null)

  const { data: refundHistoryData, refetch: refetchHistory } =
    useGetAPRefundHistoryList<IApRefundHd[]>(refundId)

  const { data: refundDetailsData, refetch: refetchDetails } =
    useGetAPRefundHistoryDetails<IApRefundHd>(
      selectedRefund?.refundId || "",
      selectedRefund?.editVersion?.toString() || ""
    )

  function isIApRefundHdArray(arr: unknown): arr is IApRefundHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 || (typeof arr[0] === "object" && "refundId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: IApRefundHd[] =
    refundHistoryData?.result === 1 &&
    isIApRefundHdArray(refundHistoryData?.data)
      ? refundHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: IApRefundHd | undefined =
    refundDetailsData?.result === 1 &&
    refundDetailsData?.data &&
    typeof refundDetailsData.data === "object" &&
    refundDetailsData.data !== null &&
    !Array.isArray(refundDetailsData.data)
      ? (refundDetailsData.data as IApRefundHd)
      : undefined

  // Check for API errors
  const hasHistoryError = refundHistoryData?.result === -1
  const hasDetailsError = refundDetailsData?.result === -1

  const columns: ColumnDef<IApRefundHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "refundNo",
      header: "Refund No",
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
      accessorKey: "supplierCode",
      header: "Supplier Code",
    },
    {
      accessorKey: "supplierName",
      header: "Supplier Name",
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
      header: "Refund Type Code",
    },
    {
      accessorKey: "paymentTypeName",
      header: "Refund Type Name",
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
      accessorKey: "payTotAmt",
      header: "Pay Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.payTotAmt
            ? formatNumber(row.original.payTotAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "payTotLocalAmt",
      header: "Pay Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.payTotLocalAmt
            ? formatNumber(row.original.payTotLocalAmt, locAmtDec)
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

  const detailsColumns: ColumnDef<IApRefundDt>[] = [
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
        refundHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        refundDetailsData?.message !== "Data does not exist"
      ) {
        await refetchDetails()
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Edit Version Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DialogDataTable
            data={tableData}
            columns={columns}
            isLoading={false}

            maxHeight={HISTORY_EMBEDDED_TABLE_MAX_HEIGHT}

            fillerTargetRows={HISTORY_EMBEDDED_FILLER_TARGET_ROWS}
            moduleId={moduleId}
            transactionId={transactionId}
            tableName={TableName.apRefundHistory}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={(refund) => setSelectedRefund(refund)}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedRefund}
        onOpenChange={() => setSelectedRefund(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
          </DialogHeader>

          {/* Error handling for details data */}
          {hasDetailsError && (
            <Alert
              variant={
                refundDetailsData?.message === "Data does not exist"
                  ? "default"
                  : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {refundDetailsData?.message === "Data does not exist"
                  ? "No refund details found for this version."
                  : `Failed to load refund details: ${refundDetailsData?.message || "Unknown error"}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Card>
              <CardHeader>
                <CardTitle>Refund Header</CardTitle>
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
                      ? "Error loading refund details"
                      : "No refund details available"}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Refund Details</CardTitle>
              </CardHeader>
              <CardContent>
                <BasicTable
                  data={dialogData?.data_details || []}
                  columns={detailsColumns}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  tableName={TableName.apRefundHistory}
                  emptyMessage="No refund details available"
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
