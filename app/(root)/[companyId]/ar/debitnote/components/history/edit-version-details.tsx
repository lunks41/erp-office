"use client"

import { useEffect, useState } from "react"
import { IArDebitNoteHd } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { ARTransactionId, ModuleId, TableName } from "@/lib/utils"
import {
  useGetARDebitNoteHistoryDetails,
  useGetARDebitNoteHistoryList,
} from "@/hooks/use-ar"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/table/history-embedded-presets"

import { EditVersionDetailsForm } from "./edit-version-details-form"

// Extended column definition with hide property
type _ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

interface EditVersionDetailsProps {
  debitNoteId: string
}

export default function EditVersionDetails({
  debitNoteId,
}: EditVersionDetailsProps) {
  const { decimals } = useAuthStore()
  const { hasPermission } = usePermissionStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.debitNote

  const [selectedDebitNote, setSelectedDebitNote] =
    useState<IArDebitNoteHd | null>(null)
  const canViewDebitNoteHistory = hasPermission(
    moduleId,
    transactionId,
    "isRead"
  )

  useEffect(() => {
    if (!canViewDebitNoteHistory) {
      setSelectedDebitNote(null)
    }
  }, [canViewDebitNoteHistory])

  const { data: debitNoteHistoryData, refetch: refetchHistory } =
    //useGetARDebitNoteHistoryList<IArDebitNoteHd[]>("14120250100024")
    useGetARDebitNoteHistoryList<IArDebitNoteHd[]>(debitNoteId)

  const { data: debitNoteDetailsData, refetch: refetchDetails } =
    useGetARDebitNoteHistoryDetails<IArDebitNoteHd>(
      selectedDebitNote?.debitNoteId || "",
      selectedDebitNote?.editVersion?.toString() || ""
    )

  function isIArDebitNoteHdArray(arr: unknown): arr is IArDebitNoteHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 ||
        (typeof arr[0] === "object" && "debitNoteId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: IArDebitNoteHd[] =
    debitNoteHistoryData?.result === 1 &&
    isIArDebitNoteHdArray(debitNoteHistoryData?.data)
      ? debitNoteHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: IArDebitNoteHd | undefined =
    debitNoteDetailsData?.result === 1 &&
    debitNoteDetailsData?.data &&
    typeof debitNoteDetailsData.data === "object" &&
    debitNoteDetailsData.data !== null &&
    !Array.isArray(debitNoteDetailsData.data)
      ? (debitNoteDetailsData.data as IArDebitNoteHd)
      : undefined

  // Check for API errors
  const hasHistoryError = debitNoteHistoryData?.result === -1
  const hasDetailsError = debitNoteDetailsData?.result === -1

  const columns: ColumnDef<IArDebitNoteHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "debitNoteNo",
      header: "DebitNote No",
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
      accessorKey: "deliveryDate",
      header: "Delivery Date",
      cell: ({ row }) => {
        const date = row.original.deliveryDate
          ? new Date(row.original.deliveryDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const date = row.original.dueDate
          ? new Date(row.original.dueDate)
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
      accessorKey: "ctyExhRate",
      header: "Country Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.ctyExhRate
            ? formatNumber(row.original.ctyExhRate, exhRateDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "creditTermCode",
      header: "Credit Term Code",
    },
    {
      accessorKey: "creditTermName",
      header: "Credit Term Name",
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
      accessorKey: "gstAmt",
      header: "VAT Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.gstAmt
            ? formatNumber(row.original.gstAmt, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "gstLocalAmt",
      header: "VAT Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.gstLocalAmt
            ? formatNumber(row.original.gstLocalAmt, locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "totAmtAftGst",
      header: "Total After VAT",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totAmtAftGst
            ? formatNumber(row.original.totAmtAftGst, amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmtAftGst",
      header: "Total Local After VAT",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totLocalAmtAftGst
            ? formatNumber(row.original.totLocalAmtAftGst, locAmtDec)
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

  const handleRefresh = async () => {
    try {
      // Only refetch if we don't have a "Data does not exist" error
      if (
        !hasHistoryError ||
        debitNoteHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        debitNoteDetailsData?.message !== "Data does not exist"
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
            tableName={TableName.arDebitNoteHistory}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={
              canViewDebitNoteHistory
                ? (debitNote) => setSelectedDebitNote(debitNote)
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedDebitNote}
        onOpenChange={() => setSelectedDebitNote(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>
              DebitNote Details :{" "}
              <Badge variant="secondary">
                {dialogData?.debitNoteNo} : v {selectedDebitNote?.editVersion}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {dialogData ? (
            <EditVersionDetailsForm
              headerData={dialogData as unknown as Record<string, unknown>}
              detailsData={
                (dialogData?.data_details || []) as unknown as Record<
                  string,
                  unknown
                >[]
              }
              summaryData={{
                transactionAmount: dialogData?.totAmt,
                localAmount: dialogData?.totLocalAmt,
                gstAmount: dialogData?.gstAmt,
                localGstAmount: dialogData?.gstLocalAmt,
                totalAmount: dialogData?.totAmtAftGst,
                localTotalAmount: dialogData?.totLocalAmtAftGst,
                paymentAmount: dialogData?.payAmt,
                localPaymentAmount: dialogData?.payLocalAmt,
                balanceAmount: dialogData?.balAmt,
                localBalanceAmount: dialogData?.balLocalAmt,
              }}
            />
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              {hasDetailsError
                ? "Error loading debitNote details"
                : "No debitNote details available"}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
