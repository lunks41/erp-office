"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IFreshWater } from "@/interfaces/checklist"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"
import { JobOrder_FreshWater } from "@/lib/api-routes"
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

interface FreshWaterHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrderId: number
  freshWaterId: number
  freshWaterIdDisplay?: number
}

export function FreshWaterHistoryDialog({
  open,
  onOpenChange,
  jobOrderId,
  freshWaterId,
  freshWaterIdDisplay,
}: FreshWaterHistoryDialogProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch history data
  const {
    data: historyResponse,
    isLoading,
    refetch,
  } = useGet<IFreshWater>(
    `${JobOrder_FreshWater.getByIdHistory}/${jobOrderId}/${freshWaterId}`,
    "freshWaterHistory"
  )

  // Destructure with fallback values
  const { data: historyData } =
    (historyResponse as ApiResponse<IFreshWater>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // Define columns for the history table
  const columns: ColumnDef<IFreshWater>[] = [
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
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const dateValue = row.getValue("date")
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
      accessorKey: "bargeName",
      header: "Barge",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("bargeName") || "-"}
        </div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "operatorName",
      header: "Operator",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("operatorName") || "-"}
        </div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "supplyBarge",
      header: "Supply Barge",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("supplyBarge") || "-"}
        </div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="text-right">
          {typeof row.getValue("quantity") === "number"
            ? (row.getValue("quantity") as number).toFixed(2)
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
      accessorKey: "distance",
      header: "Distance",
      cell: ({ row }) => (
        <div className="text-right">
          {typeof row.getValue("distance") === "number"
            ? (row.getValue("distance") as number).toFixed(2)
            : "0.00"}
        </div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "receiptNo",
      header: "Receipt No",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("receiptNo") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
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
          <DialogTitle>Fresh Water History</DialogTitle>
          <DialogDescription>
            View version history for Fresh Water ID:{" "}
            {freshWaterIdDisplay || freshWaterId}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <BasicTable<IFreshWater>
            data={historyData || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No history found for this fresh water record."
            tableName={TableName.freshWater}
            showHeader={false}
            showFooter={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FreshWaterHistoryDialog
