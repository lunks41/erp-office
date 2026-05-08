"use client"

import { useCompanyStore } from "@/stores/company-store"

import {
  useState } from "react"
import { ICbBankReconDt,
  ICbBankReconHd } from "@/interfaces"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"

import { CBTransactionId,
  ModuleId,
  TableName } from "@/lib/utils"
import {
  useGetCbBankReconHistoryDetails,
  useGetCbBankReconHistoryList,
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
  const transactionId = CBTransactionId.cbbankrecon

  const [selectedBankRecon, setSelectedBankRecon] =
    useState<ICbBankReconHd | null>(null)

  const { data: reconHistoryData, refetch: refetchHistory } =
    useGetCbBankReconHistoryList<ICbBankReconHd[]>(invoiceId)

  const { data: reconDetailsData, refetch: refetchDetails } =
    useGetCbBankReconHistoryDetails<ICbBankReconHd>(
      selectedBankRecon?.reconId || "",
      selectedBankRecon?.editVersion?.toString() || ""
    )

  function isICbBankReconHdArray(arr: unknown): arr is ICbBankReconHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 || (typeof arr[0] === "object" && "reconId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: ICbBankReconHd[] =
    reconHistoryData?.result === 1 &&
    isICbBankReconHdArray(reconHistoryData?.data)
      ? reconHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: ICbBankReconHd | undefined =
    reconDetailsData?.result === 1 &&
    reconDetailsData?.data &&
    typeof reconDetailsData.data === "object" &&
    reconDetailsData.data !== null &&
    !Array.isArray(reconDetailsData.data)
      ? (reconDetailsData.data as ICbBankReconHd)
      : undefined

  // Check for API errors
  const hasHistoryError = reconHistoryData?.result === -1
  const hasDetailsError = reconDetailsData?.result === -1

  const columns: ColumnDef<ICbBankReconHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
      cell: ({ row }) => (
        <div className="text-right">{row.original.editVersion}</div>
      ),
    },
    {
      accessorKey: "reconNo",
      header: "Reconciliation No",
    },
    {
      accessorKey: "prevReconId",
      header: "Previous Reconciliation ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.prevReconId || "-"}</div>
      ),
    },
    {
      accessorKey: "prevReconNo",
      header: "Previous Reconciliation No",
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
      accessorKey: "bankId",
      header: "Bank ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.bankId}</div>
      ),
    },
    {
      accessorKey: "currencyId",
      header: "Currency ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.currencyId}</div>
      ),
    },
    {
      accessorKey: "fromDate",
      header: "From Date",
      cell: ({ row }) => {
        const date = row.original.fromDate
          ? new Date(row.original.fromDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "toDate",
      header: "To Date",
      cell: ({ row }) => {
        const date = row.original.toDate ? new Date(row.original.toDate) : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      accessorKey: "totAmt",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totAmt ? row.original.totAmt.toFixed(amtDec) : "-"}
        </div>
      ),
    },
    {
      accessorKey: "opBalAmt",
      header: "Opening Balance",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.opBalAmt ? row.original.opBalAmt.toFixed(amtDec) : "-"}
        </div>
      ),
    },
    {
      accessorKey: "clBalAmt",
      header: "Closing Balance",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.clBalAmt ? row.original.clBalAmt.toFixed(amtDec) : "-"}
        </div>
      ),
    },
    {
      accessorKey: "debitTotAmt",
      header: "Debit Total",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.debitTotAmt != null
            ? row.original.debitTotAmt.toFixed(amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "creditTotAmt",
      header: "Credit Total",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.creditTotAmt != null
            ? row.original.creditTotAmt.toFixed(amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "allocTotAmt",
      header: "Allocated Total",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.allocTotAmt != null
            ? row.original.allocTotAmt.toFixed(amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "unAllocTotAmt",
      header: "Unallocated Total",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.unAllocTotAmt != null
            ? row.original.unAllocTotAmt.toFixed(amtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "createById",
      header: "Created By ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.createById}</div>
      ),
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
      accessorKey: "editById",
      header: "Edited By ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.editById || "-"}</div>
      ),
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
    {
      accessorKey: "isCancel",
      header: "Cancelled",
      cell: ({ row }) => (
        <div className="text-center">{row.original.isCancel ? "✓" : ""}</div>
      ),
    },
    {
      accessorKey: "cancelById",
      header: "Cancelled By ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.cancelById || "-"}</div>
      ),
    },
    {
      accessorKey: "cancelDate",
      header: "Cancelled Date",
      cell: ({ row }) => {
        const date = row.original.cancelDate
          ? new Date(row.original.cancelDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "cancelRemarks",
      header: "Cancel Remarks",
    },
    {
      accessorKey: "isPost",
      header: "Posted",
      cell: ({ row }) => (
        <div className="text-center">{row.original.isPost ? "✓" : ""}</div>
      ),
    },
    {
      accessorKey: "postById",
      header: "Posted By ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.postById || "-"}</div>
      ),
    },
    {
      accessorKey: "postDate",
      header: "Posted Date",
      cell: ({ row }) => {
        const date = row.original.postDate
          ? new Date(row.original.postDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
    {
      accessorKey: "appStatusId",
      header: "Approval Status ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.appStatusId || "-"}</div>
      ),
    },
    {
      accessorKey: "appById",
      header: "Approved By ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.appById || "-"}</div>
      ),
    },
    {
      accessorKey: "appDate",
      header: "Approved Date",
      cell: ({ row }) => {
        const date = row.original.appDate
          ? new Date(row.original.appDate)
          : null
        return date ? format(date, dateFormat) : "-"
      },
    },
  ]

  const detailsColumns: ColumnDef<ICbBankReconDt>[] = [
    {
      accessorKey: "itemNo",
      header: "Item No",
      cell: ({ row }) => (
        <div className="text-right">{row.original.itemNo}</div>
      ),
    },
    {
      accessorKey: "isSel",
      header: "Selected",
      cell: ({ row }) => (
        <div className="text-center">{row.original.isSel ? "✓" : ""}</div>
      ),
    },
    {
      accessorKey: "moduleId",
      header: "Module ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.moduleId}</div>
      ),
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.transactionId}</div>
      ),
    },
    {
      accessorKey: "documentId",
      header: "Document ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.documentId}</div>
      ),
    },
    {
      accessorKey: "documentNo",
      header: "Document No",
    },
    {
      accessorKey: "docReferenceNo",
      header: "Doc Reference No",
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
      accessorKey: "paymentTypeId",
      header: "Payment Type ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.paymentTypeId}</div>
      ),
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
      accessorKey: "customerId",
      header: "Customer ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.customerId}</div>
      ),
    },
    {
      accessorKey: "supplierId",
      header: "Supplier ID",
      cell: ({ row }) => (
        <div className="text-right">{row.original.supplierId}</div>
      ),
    },
    {
      accessorKey: "glId",
      header: "GL ID",
      cell: ({ row }) => <div className="text-right">{row.original.glId}</div>,
    },
    {
      accessorKey: "isDebit",
      header: "Is Debit",
      cell: ({ row }) => (
        <div className="text-center">{row.original.isDebit ? "✓" : ""}</div>
      ),
    },
    {
      accessorKey: "exhRate",
      header: "Exchange Rate",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.exhRate
            ? row.original.exhRate.toFixed(exhRateDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "totAmt",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totAmt ? row.original.totAmt.toFixed(amtDec) : "-"}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmt",
      header: "Total Local Amount",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.totLocalAmt
            ? row.original.totLocalAmt.toFixed(locAmtDec)
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "paymentFromTo",
      header: "Payment From/To",
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      accessorKey: "editVersion",
      header: "Edit Version",
      cell: ({ row }) => (
        <div className="text-right">{row.original.editVersion}</div>
      ),
    },
  ]

  const handleRefresh = async () => {
    try {
      // Only refetch if we don't have a "Data does not exist" error
      if (
        !hasHistoryError ||
        reconHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        reconDetailsData?.message !== "Data does not exist"
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
                reconHistoryData?.message === "Data does not exist"
                  ? "default"
                  : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {reconHistoryData?.message === "Data does not exist"
                  ? "No reconciliation history found for this reconciliation."
                  : `Failed to load Bank Reconciliation history: ${reconHistoryData?.message || "Unknown error"}`}
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
            onRowSelect={(recon) => setSelectedBankRecon(recon)}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedBankRecon}
        onOpenChange={() => setSelectedBankRecon(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>BankRecon Details</DialogTitle>
          </DialogHeader>

          {/* Error handling for details data */}
          {hasDetailsError && (
            <Alert
              variant={
                reconDetailsData?.message === "Data does not exist"
                  ? "default"
                  : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {reconDetailsData?.message === "Data does not exist"
                  ? "No Bank Reconciliation details found for this version."
                  : `Failed to load Bank Reconciliation details: ${reconDetailsData?.message || "Unknown error"}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Card>
              <CardHeader>
                <CardTitle>BankRecon Header</CardTitle>
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
                      ? "Error loading Bank Reconciliation details"
                      : "No Bank Reconciliation details available"}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>BankRecon Details</CardTitle>
              </CardHeader>
              <CardContent>
                <BasicTable
                  data={dialogData?.data_details || []}
                  columns={detailsColumns}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  tableName={TableName.cbBankReconHistory}
                  emptyMessage="No Bank Reconciliation details available"
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
