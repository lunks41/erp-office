"use client"

import { useCompanyStore } from "@/stores/company-store"

import {
  useState } from "react"
import { IArDocSetOffDt,
  IArDocSetOffHd } from "@/interfaces/ar-docsetoff"
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
  setoffId: string
}

export default function EditVersionDetails({
  setoffId,
}: EditVersionDetailsProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.docsetoff

  const [selectedReceipt, setSelectedReceipt] = useState<IArDocSetOffHd | null>(
    null
  )

  const { data: receiptHistoryData, refetch: refetchHistory } =
    useGetARReceiptHistoryList<IArDocSetOffHd[]>(setoffId)

  const { data: receiptDetailsData, refetch: refetchDetails } =
    useGetARReceiptHistoryDetails<IArDocSetOffHd>(
      selectedReceipt?.setoffId || "",
      selectedReceipt?.editVersion?.toString() || ""
    )

  function isIArDocSetOffHdArray(arr: unknown): arr is IArDocSetOffHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 || (typeof arr[0] === "object" && "setoffId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: IArDocSetOffHd[] =
    receiptHistoryData?.result === 1 &&
    isIArDocSetOffHdArray(receiptHistoryData?.data)
      ? receiptHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: IArDocSetOffHd | undefined =
    receiptDetailsData?.result === 1 &&
    receiptDetailsData?.data &&
    typeof receiptDetailsData.data === "object" &&
    receiptDetailsData.data !== null &&
    !Array.isArray(receiptDetailsData.data)
      ? (receiptDetailsData.data as IArDocSetOffHd)
      : undefined

  // Check for API errors
  const hasHistoryError = receiptHistoryData?.result === -1
  const hasDetailsError = receiptDetailsData?.result === -1

  const columns: ColumnDef<IArDocSetOffHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "setoffNo",
      header: "DocSetOff No",
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
      accessorKey: "allocTotAmt",
      header: "Allocated Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.allocTotAmt
            ? formatNumber(row.original.allocTotAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "balTotAmt",
      header: "Balanced Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.balTotAmt
            ? formatNumber(row.original.balTotAmt, amtDec)
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

  const detailsColumns: ColumnDef<IArDocSetOffDt>[] = [
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
            onRowSelect={(docSetOff) => setSelectedReceipt(docSetOff)}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedReceipt}
        onOpenChange={() => setSelectedReceipt(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>DocSetOff Details</DialogTitle>
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
                  ? "No docSetOff details found for this version."
                  : `Failed to load docSetOff details: ${receiptDetailsData?.message || "Unknown error"}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Card>
              <CardHeader>
                <CardTitle>DocSetOff Header</CardTitle>
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
                      ? "Error loading docSetOff details"
                      : "No docSetOff details available"}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>DocSetOff Details</CardTitle>
              </CardHeader>
              <CardContent>
                <BasicTable
                  data={dialogData?.data_details || []}
                  columns={detailsColumns}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  tableName={TableName.arReceiptHistory}
                  emptyMessage="No docSetOff details available"
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
