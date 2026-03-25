"use client"

import { useEffect } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IConsignmentImport } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { JobOrder_ConsignmentImport } from "@/lib/api-routes"
import { TableName } from "@/lib/utils"
import { useGet } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BasicTable } from "@/components/table/table-basic"

interface ConsignmentImportHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrderId: number
  consignmentImportId: number
  consignmentImportIdDisplay?: number
}

export function ConsignmentImportHistoryDialog({
  open,
  onOpenChange,
  jobOrderId,
  consignmentImportId,
  consignmentImportIdDisplay,
}: ConsignmentImportHistoryDialogProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch history data
  const {
    data: historyResponse,
    isLoading,
    refetch,
  } = useGet<IConsignmentImport>(
    `${JobOrder_ConsignmentImport.getByIdHistory}/${jobOrderId}/${consignmentImportId}`,
    "consignmentImportHistory"
  )

  // Destructure with fallback values
  const { data: historyData } =
    (historyResponse as ApiResponse<IConsignmentImport>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // Define columns for the history table
  const columns: ColumnDef<IConsignmentImport>[] = [
    {
      accessorKey: "editVersion",
      header: "Version",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="destructive">
            {row.getValue("editVersion") || "0"}
          </Badge>
        </div>
      ),
      size: 70,
      minSize: 60,
      maxSize: 80,
    },
    {
      accessorKey: "awbNo",
      header: "AWB No",
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.getValue("awbNo") || "-"}
        </div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "carrierName",
      header: "Carrier",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("carrierName") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "consignmentTypeName",
      header: "Consignment Type",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("consignmentTypeName") || "-"}
        </div>
      ),
      size: 140,
      minSize: 120,
    },
    {
      accessorKey: "landingTypeName",
      header: "Landing Type",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("landingTypeName") || "-"}
        </div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "noOfPcs",
      header: "No of Pcs",
      cell: ({ row }) => (
        <div className="text-right">{row.getValue("noOfPcs") || "0"}</div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "weight",
      header: "Weight",
      cell: ({ row }) => (
        <div className="text-right">
          {typeof row.getValue("weight") === "number"
            ? (row.getValue("weight") as number).toFixed(2)
            : "0.00"}
        </div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "uomName",
      header: "UOM",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("uomName") || "-"}</div>
      ),
      size: 80,
      minSize: 60,
    },
    {
      accessorKey: "pickupLocation",
      header: "Pickup Location",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("pickupLocation") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "deliveryLocation",
      header: "Delivery Location",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("deliveryLocation") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "clearedBy",
      header: "Cleared By",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("clearedBy") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "billEntryNo",
      header: "Bill Entry No",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("billEntryNo") || "-"}</div>
      ),
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "declarationNo",
      header: "Declaration No",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("declarationNo") || "-"}
        </div>
      ),
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "receiveDate",
      header: "Receive Date",
      cell: ({ row }) => {
        const dateValue = row.getValue("receiveDate")
        if (!dateValue) return <div>-</div>

        const date = new Date(dateValue as string)
        return (
          <div className="text-center">
            {isValid(date) ? format(date, "dd/MM/yyyy") : "-"}
          </div>
        )
      },
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "deliverDate",
      header: "Deliver Date",
      cell: ({ row }) => {
        const dateValue = row.getValue("deliverDate")
        if (!dateValue) return <div>-</div>

        const date = new Date(dateValue as string)
        return (
          <div className="text-center">
            {isValid(date) ? format(date, "dd/MM/yyyy") : "-"}
          </div>
        )
      },
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "arrivalDate",
      header: "Arrival Date",
      cell: ({ row }) => {
        const dateValue = row.getValue("arrivalDate")
        if (!dateValue) return <div>-</div>

        const date = new Date(dateValue as string)
        return (
          <div className="text-center">
            {isValid(date) ? format(date, "dd/MM/yyyy") : "-"}
          </div>
        )
      },
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "amountDeposited",
      header: "Amount Deposited",
      cell: ({ row }) => (
        <div className="text-right">
          {typeof row.getValue("amountDeposited") === "number"
            ? (row.getValue("amountDeposited") as number).toFixed(2)
            : "0.00"}
        </div>
      ),
      size: 140,
      minSize: 120,
    },
    {
      accessorKey: "refundInstrumentNo",
      header: "Refund Instrument No",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("refundInstrumentNo") || "-"}
        </div>
      ),
      size: 150,
      minSize: 130,
    },
    {
      accessorKey: "taskStatusName",
      header: "Status",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">
            {row.getValue("taskStatusName") || "-"}
          </Badge>
        </div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "debitNoteNo",
      header: "Debit Note",
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("remarks") || "-"}
        </div>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "poNo",
      header: "PO No",
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "createBy",
      header: "Create By",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("createBy") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "createDate",
      header: "Create Date",
      cell: ({ row }) => {
        const raw = row.getValue("createDate")
        let date: Date | null = null
        if (typeof raw === "string") {
          date = new Date(raw)
        } else if (raw instanceof Date) {
          date = raw
        }
        return (
          <div className="truncate">
            {date && isValid(date) ? format(date, datetimeFormat) : "-"}
          </div>
        )
      },
      size: 180,
      minSize: 150,
      maxSize: 200,
    },
    {
      accessorKey: "editBy",
      header: "Edit By",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("editBy") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "editDate",
      header: "Edit Date",
      cell: ({ row }) => {
        const raw = row.getValue("editDate")
        let date: Date | null = null
        if (typeof raw === "string") {
          date = new Date(raw)
        } else if (raw instanceof Date) {
          date = raw
        }
        return (
          <div className="truncate">
            {date && isValid(date) ? format(date, datetimeFormat) : "-"}
          </div>
        )
      },
      size: 180,
      minSize: 150,
      maxSize: 200,
    },
  ]

  // Refetch data when dialog opens
  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] w-[60vw] !max-w-none overflow-y-auto"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Consignment Import History</DialogTitle>
          <DialogDescription>
            View version history for Consignment Import ID:{" "}
            {consignmentImportIdDisplay || consignmentImportId}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <BasicTable<IConsignmentImport>
            data={historyData || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No history found for this consignment import record."
            tableName={TableName.consignmentImport}
            showHeader={false}
            showFooter={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConsignmentImportHistoryDialog
