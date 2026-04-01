"use client"

import { useState } from "react"
import { IGLContraDt, IGLContraHd } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { GLTransactionId, ModuleId, TableName } from "@/lib/utils"
import {
  useGetGLContraHistoryDetails,
  useGetGLContraHistoryList,
} from "@/hooks/use-gl"
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
  contraId: string
}

export default function EditVersionDetails({
  contraId,
}: EditVersionDetailsProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.arapcontra

  const [selectedContra, setSelectedContra] = useState<IGLContraHd | null>(null)

  const { data: contraHistoryData, refetch: refetchHistory } =
    useGetGLContraHistoryList<IGLContraHd[]>(contraId)

  const { data: contraDetailsData, refetch: refetchDetails } =
    useGetGLContraHistoryDetails<IGLContraHd>(
      selectedContra?.contraId || "",
      selectedContra?.editVersion?.toString() || ""
    )

  function isIGLContraHdArray(arr: unknown): arr is IGLContraHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 || (typeof arr[0] === "object" && "contraId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: IGLContraHd[] =
    contraHistoryData?.result === 1 &&
    isIGLContraHdArray(contraHistoryData?.data)
      ? contraHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: IGLContraHd | undefined =
    contraDetailsData?.result === 1 &&
    contraDetailsData?.data &&
    typeof contraDetailsData.data === "object" &&
    contraDetailsData.data !== null &&
    !Array.isArray(contraDetailsData.data)
      ? (contraDetailsData.data as IGLContraHd)
      : undefined

  // Check for API errors
  const hasHistoryError = contraHistoryData?.result === -1
  const hasDetailsError = contraDetailsData?.result === -1

  const columns: ColumnDef<IGLContraHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "contraNo",
      header: "Contra No",
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

  const detailsColumns: ColumnDef<IGLContraDt>[] = [
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
        contraHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        contraDetailsData?.message !== "Data does not exist"
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
            tableName={TableName.glContraHistory}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={(contra) => setSelectedContra(contra)}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedContra}
        onOpenChange={() => setSelectedContra(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>Contra Details</DialogTitle>
          </DialogHeader>

          {/* Error handling for details data */}
          {hasDetailsError && (
            <Alert
              variant={
                contraDetailsData?.message === "Data does not exist"
                  ? "default"
                  : "destructive"
              }
              className="mb-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {contraDetailsData?.message === "Data does not exist"
                  ? "No contra details found for this version."
                  : `Failed to load contra details: ${contraDetailsData?.message || "Unknown error"}`}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Card>
              <CardHeader>
                <CardTitle>Contra Header</CardTitle>
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
                      ? "Error loading contra details"
                      : "No contra details available"}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Contra Details</CardTitle>
              </CardHeader>
              <CardContent>
                <BasicTable
                  data={dialogData?.data_details || []}
                  columns={detailsColumns}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  tableName={TableName.glContraDetails}
                  emptyMessage="No contra details available"
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
