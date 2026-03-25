"use client"

import { useEffect } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ITechnicianSurveyor } from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"

import { JobOrder_TechnicianSurveyor } from "@/lib/api-routes"
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

interface TechnicianSurveyorHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrderId: number
  technicianSurveyorId: number
  technicianSurveyorIdDisplay?: number
}

export function TechnicianSurveyorHistoryDialog({
  open,
  onOpenChange,
  jobOrderId,
  technicianSurveyorId,
  technicianSurveyorIdDisplay,
}: TechnicianSurveyorHistoryDialogProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Fetch history data
  const {
    data: historyResponse,
    isLoading,
    refetch,
  } = useGet<ITechnicianSurveyor>(
    `${JobOrder_TechnicianSurveyor.getByIdHistory}/${jobOrderId}/${technicianSurveyorId}`,
    "technicianSurveyorHistory"
  )

  // Destructure with fallback values
  const { data: historyData } =
    (historyResponse as ApiResponse<ITechnicianSurveyor>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  // Define columns for the history table
  const columns: ColumnDef<ITechnicianSurveyor>[] = [
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
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-medium">
          {row.getValue("name") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "companyInfo",
      header: "Company",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("companyInfo") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "natureOfAttendance",
      header: "Nature of Attendance",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("natureOfAttendance") || "-"}
        </div>
      ),
      size: 150,
      minSize: 120,
    },
    {
      accessorKey: "passTypeName",
      header: "Pass Type",
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("passTypeName") || "-"}</div>
      ),
      size: 120,
      minSize: 100,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="text-right">{row.getValue("quantity") || "0"}</div>
      ),
      size: 100,
      minSize: 80,
    },
    {
      accessorKey: "embarked",
      header: "Embarked",
      cell: ({ row }) => {
        const dateValue = row.getValue("embarked")
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
      accessorKey: "disembarked",
      header: "Disembarked",
      cell: ({ row }) => {
        const dateValue = row.getValue("disembarked")
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
      accessorKey: "portRequestNo",
      header: "Port Request No",
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue("portRequestNo") || "-"}
        </div>
      ),
      size: 130,
      minSize: 110,
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
          <DialogTitle>Technician Surveyor History</DialogTitle>
          <DialogDescription>
            View version history for Technician Surveyor ID:{" "}
            {technicianSurveyorIdDisplay || technicianSurveyorId}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <BasicTable<ITechnicianSurveyor>
            data={historyData || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No history found for this technician surveyor record."
            tableName={TableName.techniciansSurveyors}
            showHeader={false}
            showFooter={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TechnicianSurveyorHistoryDialog
