"use client"

import { useEffect, useState } from "react"
import { IGLJournalHd } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { GLTransactionId, ModuleId, TableName } from "@/lib/utils"
import {
  useGetGLJournalHistoryDetails,
  useGetGLJournalHistoryList,
} from "@/hooks/use-gl"
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
  journalId: string
}

export default function EditVersionDetails({
  journalId,
}: EditVersionDetailsProps) {
  const { decimals } = useAuthStore()
  const { hasPermission } = usePermissionStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.journalentry

  const [selectedGLJournal, setSelectedGLJournal] =
    useState<IGLJournalHd | null>(null)
  const canViewGLJournalHistory = hasPermission(
    moduleId,
    transactionId,
    "isRead"
  )

  useEffect(() => {
    if (!canViewGLJournalHistory) {
      setSelectedGLJournal(null)
    }
  }, [canViewGLJournalHistory])

  const { data: invoiceHistoryData, refetch: refetchHistory } =
    //useGetARGLJournalHistoryList<IGLJournalHd[]>("14120250100024")
    useGetGLJournalHistoryList<IGLJournalHd[]>(journalId)

  const { data: invoiceDetailsData, refetch: refetchDetails } =
    useGetGLJournalHistoryDetails<IGLJournalHd>(
      selectedGLJournal?.journalId || "",
      selectedGLJournal?.editVersion?.toString() || ""
    )

  function isIGLJournalHdArray(arr: unknown): arr is IGLJournalHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 ||
        (typeof arr[0] === "object" && "journalId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: IGLJournalHd[] =
    invoiceHistoryData?.result === 1 &&
    isIGLJournalHdArray(invoiceHistoryData?.data)
      ? invoiceHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: IGLJournalHd | undefined =
    invoiceDetailsData?.result === 1 &&
    invoiceDetailsData?.data &&
    typeof invoiceDetailsData.data === "object" &&
    invoiceDetailsData.data !== null &&
    !Array.isArray(invoiceDetailsData.data)
      ? (invoiceDetailsData.data as IGLJournalHd)
      : undefined

  // Check for API errors
  const hasHistoryError = invoiceHistoryData?.result === -1
  const hasDetailsError = invoiceDetailsData?.result === -1

  const columns: ColumnDef<IGLJournalHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "journalNo",
      header: "GLJournal No",
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
        invoiceHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        invoiceDetailsData?.message !== "Data does not exist"
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
            tableName={TableName.glJournalHistory}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={
              canViewGLJournalHistory
                ? (invoice) => setSelectedGLJournal(invoice)
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedGLJournal}
        onOpenChange={() => setSelectedGLJournal(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>
              GLJournal Details :{" "}
              <Badge variant="secondary">
                {dialogData?.journalNo} : v {selectedGLJournal?.editVersion}
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
                ? "Error loading invoice details"
                : "No invoice details available"}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
