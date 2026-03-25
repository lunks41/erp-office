"use client"

import { useEffect } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IEquipmentUsed } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { JobOrder_EquipmentUsed } from "@/lib/api-routes"
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

interface EquipmentUsedHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrderId: number
  equipmentUsedId: number
  equipmentUsedIdDisplay?: number
}

export function EquipmentUsedHistoryDialog({
  open,
  onOpenChange,
  jobOrderId,
  equipmentUsedId,
  equipmentUsedIdDisplay,
}: EquipmentUsedHistoryDialogProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch history data
  const {
    data: historyResponse,
    isLoading,
    refetch,
  } = useGet<IEquipmentUsed>(
    `${JobOrder_EquipmentUsed.getByIdHistory}/${jobOrderId}/${equipmentUsedId}`,
    "equipmentUsedHistory"
  )

  // Destructure with fallback values
  const { data: historyData } =
    (historyResponse as ApiResponse<IEquipmentUsed>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // Define columns for the history table
  const columns: ColumnDef<IEquipmentUsed>[] = [
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
      accessorKey: "referenceNo",
      header: "Reference No",
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.getValue("referenceNo") || "-"}
        </div>
      ),
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "mafi",
      header: "MAFI",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("mafi") || "-"}</div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "others",
      header: "Others",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.getValue("others") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "craneChargeName",
      header: "Crane Charge",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("craneChargeName") || "-"}
        </div>
      ),
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "forkliftChargeName",
      header: "Forklift Charge",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("forkliftChargeName") || "-"}
        </div>
      ),
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "stevedoreChargeName",
      header: "Stevedore Charge",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("stevedoreChargeName") || "-"}
        </div>
      ),
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "loadingRefNo",
      header: "Loading Ref No",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("loadingRefNo") || "-"}</div>
      ),
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "offloadingRefNo",
      header: "Offloading Ref No",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("offloadingRefNo") || "-"}
        </div>
      ),
      size: 140,
      minSize: 120,
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
          <DialogTitle>Equipment Used History</DialogTitle>
          <DialogDescription>
            View version history for Equipment Used ID:{" "}
            {equipmentUsedIdDisplay || equipmentUsedId}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <BasicTable<IEquipmentUsed>
            data={historyData || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No history found for this equipment used record."
            tableName={TableName.equipmentUsed}
            showHeader={false}
            showFooter={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EquipmentUsedHistoryDialog
