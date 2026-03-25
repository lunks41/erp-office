"use client"

import { useEffect } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ICrewSignOff } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { JobOrder_CrewSignOff } from "@/lib/api-routes"
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

interface CrewSignOffHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrderId: number
  crewSignOffId: number
  crewSignOffIdDisplay?: number
}

export function CrewSignOffHistoryDialog({
  open,
  onOpenChange,
  jobOrderId,
  crewSignOffId,
  crewSignOffIdDisplay,
}: CrewSignOffHistoryDialogProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch history data
  const {
    data: historyResponse,
    isLoading,
    refetch,
  } = useGet<ICrewSignOff>(
    `${JobOrder_CrewSignOff.getByIdHistory}/${jobOrderId}/${crewSignOffId}`,
    "crewSignOffHistory"
  )

  // Destructure with fallback values
  const { data: historyData } =
    (historyResponse as ApiResponse<ICrewSignOff>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // Define columns for the history table
  const columns: ColumnDef<ICrewSignOff>[] = [
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
      accessorKey: "crewName",
      header: "Crew Name",
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-medium">
          {row.getValue("crewName") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "nationalityName",
      header: "Nationality",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("nationalityName") || "-"}
        </div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "rankName",
      header: "Rank",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("rankName") || "-"}</div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "flightDetails",
      header: "Flight Details",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("flightDetails") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "hotelName",
      header: "Hotel Name",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("hotelName") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "departureDetails",
      header: "Departure Details",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("departureDetails") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "transportName",
      header: "Transport",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("transportName") || "-"}
        </div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "clearing",
      header: "Clearing",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("clearing") || "-"}</div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "cidClearance",
      header: "CID Clearance",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("cidClearance") || "-"}</div>
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
      accessorKey: "overStayRemark",
      header: "Over Stay Remark",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("overStayRemark") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "modificationRemark",
      header: "Modification Remark",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("modificationRemark") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
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
          <DialogTitle>Crew Sign Off History</DialogTitle>
          <DialogDescription>
            View version history for Crew Sign Off ID:{" "}
            {crewSignOffIdDisplay || crewSignOffId}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <BasicTable<ICrewSignOff>
            data={historyData || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No history found for this crew sign off record."
            tableName={TableName.crewSignOff}
            showHeader={false}
            showFooter={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CrewSignOffHistoryDialog
