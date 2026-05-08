"use client"

import { useCompanyStore } from "@/stores/company-store"

import {
  useEffect,
  useState } from "react"
import { ICbBankTransferCtmHd } from "@/interfaces"
import { usePermissionStore } from "@/stores/permission-store"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { CBTransactionId,
  ModuleId,
  TableName } from "@/lib/utils"
import {
  useGetCbBankTransferCtmHistoryDetails,
  useGetCbBankTransferCtmHistoryList,
  } from "@/hooks/use-cb"
import { Badge } from "@/components/ui/badge"
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

import { EditVersionDetailsForm } from "./edit-version-details-form"

// Extended column definition with hide property
type _ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

interface EditVersionDetailsProps {
  transferId: string
}

export default function EditVersionDetails({
  transferId,
}: EditVersionDetailsProps) {
  const { decimals } = useCompanyStore()
  const { hasPermission } = usePermissionStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat
  const exhRateDec = decimals[0]?.exhRateDec || 2

  const moduleId = ModuleId.cb
  const transactionId = CBTransactionId.cbbanktransferctm

  const [selectedCbBankTransferCtm, setSelectedCbBankTransferCtm] =
    useState<ICbBankTransferCtmHd | null>(null)
  const canViewCbBankTransferCtmHistory = hasPermission(
    moduleId,
    transactionId,
    "isRead"
  )

  useEffect(() => {
    if (!canViewCbBankTransferCtmHistory) {
      setSelectedCbBankTransferCtm(null)
    }
  }, [canViewCbBankTransferCtmHistory])

  const { data: cbBankTransferCtmHistoryData, refetch: refetchHistory } =
    //useGetARCbBankTransferCtmHistoryList<ICbBankTransferCtmHd[]>("14120250100024")
    useGetCbBankTransferCtmHistoryList<ICbBankTransferCtmHd[]>(transferId)

  const { data: cbBankTransferCtmDetailsData, refetch: refetchDetails } =
    useGetCbBankTransferCtmHistoryDetails<ICbBankTransferCtmHd>(
      selectedCbBankTransferCtm?.transferId || "",
      selectedCbBankTransferCtm?.editVersion?.toString() || ""
    )

  function isICbBankTransferCtmHdArray(
    arr: unknown
  ): arr is ICbBankTransferCtmHd[] {
    return (
      Array.isArray(arr) &&
      (arr.length === 0 ||
        (typeof arr[0] === "object" && "transferId" in arr[0]))
    )
  }

  // Check if history data is successful and has valid data
  const tableData: ICbBankTransferCtmHd[] =
    cbBankTransferCtmHistoryData?.result === 1 &&
    isICbBankTransferCtmHdArray(cbBankTransferCtmHistoryData?.data)
      ? cbBankTransferCtmHistoryData.data
      : []

  // Check if details data is successful and has valid data
  const dialogData: ICbBankTransferCtmHd | undefined =
    cbBankTransferCtmDetailsData?.result === 1 &&
    cbBankTransferCtmDetailsData?.data &&
    typeof cbBankTransferCtmDetailsData.data === "object" &&
    cbBankTransferCtmDetailsData.data !== null &&
    !Array.isArray(cbBankTransferCtmDetailsData.data)
      ? (cbBankTransferCtmDetailsData.data as ICbBankTransferCtmHd)
      : undefined

  // Check for API errors
  const hasHistoryError = cbBankTransferCtmHistoryData?.result === -1
  const hasDetailsError = cbBankTransferCtmDetailsData?.result === -1

  const columns: ColumnDef<ICbBankTransferCtmHd>[] = [
    {
      accessorKey: "editVersion",
      header: "Edit Version",
    },
    {
      accessorKey: "transferNo",
      header: "CbBankTransferCtm No",
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
            ? formatNumber(row.original.fromExhRate, exhRateDec)
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
            ? formatNumber(row.original.fromTotAmt, amtDec)
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
            ? formatNumber(row.original.fromTotLocalAmt, locAmtDec)
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
        cbBankTransferCtmHistoryData?.message !== "Data does not exist"
      ) {
        await refetchHistory()
      }
      if (
        !hasDetailsError ||
        cbBankTransferCtmDetailsData?.message !== "Data does not exist"
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
            tableName={TableName.cbBankTransferCtmHistory}
            emptyMessage={
              hasHistoryError ? "Error loading data" : "No results."
            }
            onRefreshAction={handleRefresh}
            onRowSelect={
              canViewCbBankTransferCtmHistory
                ? (cbbanktransferctm) =>
                    setSelectedCbBankTransferCtm(cbbanktransferctm)
                : undefined
            }
          />
        </div>
      </div>

      <Dialog
        open={!!selectedCbBankTransferCtm}
        onOpenChange={() => setSelectedCbBankTransferCtm(null)}
      >
        <DialogContent className="@container h-[80vh] w-[90vw] !max-w-none overflow-y-auto rounded-lg p-4">
          <DialogHeader>
            <DialogTitle>
              CbBankTransferCtm Details :{" "}
              <Badge variant="secondary">
                {dialogData?.transferNo} : v{" "}
                {selectedCbBankTransferCtm?.editVersion}
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
                totalAmount: dialogData?.fromTotAmt,
                localTotalAmount: dialogData?.fromTotLocalAmt,
              }}
            />
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              {hasDetailsError
                ? "Error loading cbbanktransferctm details"
                : "No cbbanktransferctm details available"}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
