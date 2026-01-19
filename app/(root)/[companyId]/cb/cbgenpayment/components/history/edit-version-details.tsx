"use client"

import { useEffect, useState } from "react"
import { ICbGenPaymentHd } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { CBTransactionId, ModuleId, TableName } from "@/lib/utils"
import {
  useGetCbGenPaymentHistoryDetails,
  useGetCbGenPaymentHistoryList,
} from "@/hooks/use-cb"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogDataTable } from "@/components/table/table-dialog"

import { EditVersionDetailsForm } from "./edit-version-details-form"

// Extended column definition with hide property
type _ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

interface EditVersionDetailsProps {
  paymentId: string
}

export default function EditVersionDetails({
  paymentId,
}: EditVersionDetailsProps) {
  const { decimals } = useAuthStore()
  const { hasPermission } = usePermissionStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbgenpayment

  const [selectedCbGenPayment, setSelectedCbGenPayment] =
    useState<ICbGenPaymentHd | null>(null)
  const canViewCbGenPaymentHistory = hasPermission(
    moduleId,
    transactionId,
    "isRead"
  )

  useEffect(() => {
    if (!canViewCbGenPaymentHistory) {
      setSelectedCbGenPayment(null)
    }
  }, [canViewCbGenPaymentHistory])

  const { data: cbGenPaymentHistoryData, refetch: refetchHistory } =
    //useGetARCbGenPaymentHistoryList<ICbGenPaymentHd[]>("14120250100024")
    useGetCbGenPaymentHistoryList<ICbGenPaymentHd[]>(paymentId)

  const { data: cbGenPaymentDetailsData, refetch: refetchDetails } =
    useGetCbGenPaymentHistoryDetails<ICbGenPaymentHd>(
      selectedCbGenPayment?.paymentId || "",
      selectedCbGenPayment?.editVersion?.toString() || ""
    )

  function isICbGenPaymentHdArray(arr: unknown): arr is ICbGenPaymentHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 ||
        (typeof arr[0] === "object" && "paymentId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: ICbGenPaymentHd[] =
    cbGenPaymentHistoryData?.result === 1 &&
    isICbGenPaymentHdArray(cbGenPaymentHistoryData?.data)
      ? cbGenPaymentHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: ICbGenPaymentHd | undefined =
    cbGenPaymentDetailsData?.result === 1 &&
    cbGenPaymentDetailsData?.data &&
    typeof cbGenPaymentDetailsData.data === "object" &&
    cbGenPaymentDetailsData.data !== null &&
    !Array.isArray(cbGenPaymentDetailsData.data)
      ? (cbGenPaymentDetailsData.data as ICbGenPaymentHd)
      : undefined

  // Check for API errors
  const hasHistoryError = cbGenPaymentHistoryData?.result === -1
  const hasDetailsError = cbGenPaymentDetailsData?.result === -1

  const columns: ColumnDef<ICbGenPaymentHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "paymentNo",
      header: "CbGenPayment No",
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
      header: "GST Local Amount",
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
        cbGenPaymentHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        cbGenPaymentDetailsData?.message !== "Data does not exist"
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
            moduleId={moduleId}
            transactionId={transactionId}
            tableName={TableName.cbGenPaymentHistory}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={
              canViewCbGenPaymentHistory
                ? (cbGenPayment) => setSelectedCbGenPayment(cbGenPayment)
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedCbGenPayment}
        onOpenChange={() => setSelectedCbGenPayment(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>
              CbGenPayment Details :{" "}
              <Badge variant="secondary">
                {dialogData?.paymentNo} : v {selectedCbGenPayment?.editVersion}
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
              }}
            />
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              {hasDetailsError
                ? "Error loading cbGenPayment details"
                : "No cbGenPayment details available"}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
