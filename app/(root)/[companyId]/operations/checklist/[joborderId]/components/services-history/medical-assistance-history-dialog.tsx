"use client"

import { useEffect } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IMedicalAssistance } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { JobOrder_MedicalAssistance } from "@/lib/api-routes"
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

interface MedicalAssistanceHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrderId: number
  medicalAssistanceId: number
  medicalAssistanceIdDisplay?: number
}

export function MedicalAssistanceHistoryDialog({
  open,
  onOpenChange,
  jobOrderId,
  medicalAssistanceId,
  medicalAssistanceIdDisplay,
}: MedicalAssistanceHistoryDialogProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch history data
  const {
    data: historyResponse,
    isLoading,
    refetch,
  } = useGet<IMedicalAssistance>(
    `${JobOrder_MedicalAssistance.getByIdHistory}/${jobOrderId}/${medicalAssistanceId}`,
    "medicalAssistanceHistory"
  )

  // Destructure with fallback values
  const { data: historyData } =
    (historyResponse as ApiResponse<IMedicalAssistance>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // Define columns for the history table
  const columns: ColumnDef<IMedicalAssistance>[] = [
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
      accessorKey: "visaName",
      header: "Visa Type",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("visaName") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.getValue("reason") || "-"}</div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "admittedDate",
      header: "Admitted Date",
      cell: ({ row }) => {
        const dateValue = row.getValue("admittedDate")
        if (!dateValue) return <div>-</div>

        const date = new Date(dateValue as string)
        return (
          <div className="text-center">
            {isValid(date) ? format(date, "dd/MM/yyyy") : "-"}
          </div>
        )
      },
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "dischargedDate",
      header: "Discharged Date",
      cell: ({ row }) => {
        const dateValue = row.getValue("dischargedDate")
        if (!dateValue) return <div>-</div>

        const date = new Date(dateValue as string)
        return (
          <div className="text-center">
            {isValid(date) ? format(date, "dd/MM/yyyy") : "-"}
          </div>
        )
      },
      size: 130,
      minSize: 110,
    },
    {
      accessorKey: "flightDetails",
      header: "Flight Details",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("flightDetails") || "-"}</div>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "hotelName",
      header: "Hotel Name",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("hotelName") || "-"}</div>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "departureDetails",
      header: "Departure Details",
      cell: ({ row }) => (
        <div className="truncate">
          {row.getValue("departureDetails") || "-"}
        </div>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "transportName",
      header: "Transport Name",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("transportName") || "-"}</div>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "clearing",
      header: "Clearing",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("clearing") || "-"}</div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "overStayRemark",
      header: "Over Stay Remark",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("overStayRemark") || "-"}</div>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "modificationRemark",
      header: "Modification Remark",
      cell: ({ row }) => (
        <div className="truncate">
          {row.getValue("modificationRemark") || "-"}
        </div>
      ),
      size: 200,
      minSize: 150,
    },
    {
      accessorKey: "cidClearance",
      header: "CID Clearance",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("cidClearance") || "-"}</div>
      ),
      size: 150,
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
          <DialogTitle>Medical Assistance History</DialogTitle>
          <DialogDescription>
            View version history for Medical Assistance ID:{" "}
            {medicalAssistanceIdDisplay || medicalAssistanceId}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <BasicTable<IMedicalAssistance>
            data={historyData || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No history found for this medical assistance record."
            tableName={TableName.medicalAssistance}
            showHeader={false}
            showFooter={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default MedicalAssistanceHistoryDialog
