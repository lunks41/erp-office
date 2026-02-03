"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IJobOrderHd,
  IMedicalAssistance,
  IMedicalAssistanceFilter,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import MedicalAssistanceHistoryDialog from "../services-history/medical-assistance-history-dialog"

interface MedicalAssistanceTableProps {
  data: IMedicalAssistance[]
  isLoading?: boolean
  onMedicalAssistanceSelect?: (
    medicalAssistance: IMedicalAssistance | undefined
  ) => void
  onDeleteMedicalAssistance?: (medicalAssistanceId: string) => void
  onBulkDeleteMedicalAssistance?: (selectedIds: string[]) => void
  onEditActionMedicalAssistance?: (
    medicalAssistance: IMedicalAssistance
  ) => void
  onCreateActionMedicalAssistance?: () => void
  onRefreshActionte?: (
    medicalAssistanceId: string,
    debitNoteNo?: string
  ) => void
  onDebitNoteAction?: (
    medicalAssistanceId: string,
    debitNoteNo?: string
  ) => void
  onPurchaseAction?: (medicalAssistanceId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: IMedicalAssistanceFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function MedicalAssistanceTable({
  data,
  isLoading = false,
  onMedicalAssistanceSelect,
  onDeleteMedicalAssistance,
  onBulkDeleteMedicalAssistance,
  onEditActionMedicalAssistance,
  onCreateActionMedicalAssistance,
  onRefreshActionte: _onRefreshActionte,
  onDebitNoteAction,
  onPurchaseAction,
  onRefreshAction,
  onFilterChange,
  moduleId,
  transactionId,
  onCombinedService,
  onCloneTask,
  isConfirmed,
  jobData,
  // Permission props
  canView: _canView,
  canEdit: _canEdit,
  canDelete: _canDelete,
  canCreate: _canCreate,
  canDebitNote,
}: MedicalAssistanceTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const formatDateValue = useCallback(
    (value: unknown) => {
      if (!value) return "-"
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? "-" : format(value, dateFormat)
      }
      if (typeof value === "string") {
        const parsed = parseDate(value) || parse(value, dateFormat, new Date())
        if (!parsed || !isValid(parsed)) {
          return value
        }
        return format(parsed, dateFormat)
      }
      return "-"
    },
    [dateFormat]
  )

  const formatDateTimeValue = useCallback(
    (value: unknown) => {
      if (!value) return "-"
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? "-" : format(value, datetimeFormat)
      }
      if (typeof value === "string") {
        const parsed = parseDate(value) || parse(value, dateFormat, new Date())
        if (!parsed || !isValid(parsed)) {
          return value
        }
        return format(parsed, datetimeFormat)
      }
      return "-"
    },
    [dateFormat, datetimeFormat]
  )

  // State for history dialog
  const [historyDialog, setHistoryDialog] = useState<{
    isOpen: boolean
    jobOrderId: number
    medicalAssistanceId: number
    medicalAssistanceIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    medicalAssistanceId: 0,
    medicalAssistanceIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: IMedicalAssistance) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      medicalAssistanceId: item.medicalAssistanceId,
      medicalAssistanceIdDisplay: item.medicalAssistanceId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IMedicalAssistance>[] = useMemo(
    () => [
      ...(canDebitNote
        ? [
            {
              accessorKey: "debitNoteNo",
              header: "Debit Note No",
              size: 180,
              minSize: 130,
            },
          ]
        : []),
      {
        accessorKey: "taskStatusName",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="default">
              {row.getValue("taskStatusName") || "-"}
            </Badge>
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "crewName",
        header: "Crew Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("crewName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "chargeName",
        header: "Charge Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("chargeName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "nationalityName",
        header: "Nationality",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("nationalityName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "rankName",
        header: "Rank",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("rankName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "visaName",
        header: "Visa Type",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("visaName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("reason") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "flightDetails",
        header: "Flight Details",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("flightDetails") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "hotelName",
        header: "Hotel Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("hotelName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "departureDetails",
        header: "Departure Details",
        cell: ({ row }) => (
          <div className="text-wrap">
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
          <div className="text-wrap">
            {row.getValue("transportName") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "clearing",
        header: "Clearing",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("clearing") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "overStayRemark",
        header: "Over Stay Remark",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("overStayRemark") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "modificationRemark",
        header: "Modification Remark",
        cell: ({ row }) => (
          <div className="text-wrap">
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
          <div className="text-wrap">{row.getValue("cidClearance") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "admittedDate",
        header: "Admitted Date",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("admittedDate"))
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "dischargedDate",
        header: "Discharged Date",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("dischargedDate"))
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "clinicName",
        header: "Clinic Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("clinicName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "editVersion",
        header: "Version",
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="text-center">
              <Badge
                variant="destructive"
                className="cursor-pointer transition-colors hover:bg-red-700"
                onClick={() => handleOpenHistory(item)}
                title="Click to view history"
              >
                {row.getValue("editVersion") || "0"}
              </Badge>
            </div>
          )
        },
        size: 70,
        minSize: 60,
        maxSize: 80,
      },
      {
        accessorKey: "poNo",
        header: "PO No",
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "createBy",
        header: "Create By",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("createBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "createDate",
        header: "Create Date",
        cell: ({ row }) => {
          return formatDateTimeValue(row.getValue("createDate"))
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "editBy",
        header: "Edit By",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("editBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => {
          return formatDateTimeValue(row.getValue("editDate"))
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
    ],
    [formatDateValue, formatDateTimeValue, handleOpenHistory, canDebitNote]
  )

  // Wrapper functions to handle type differences
  const handleFilterChange = (filters: {
    search?: string
    sortOrder?: string
  }) => {
    if (onFilterChange) {
      onFilterChange({
        search: filters.search,
        sortOrder: filters.sortOrder as "asc" | "desc" | undefined,
      })
    }
  }

  const handleItemSelect = (item: IMedicalAssistance | null) => {
    if (onMedicalAssistanceSelect) {
      onMedicalAssistanceSelect(item || undefined)
    }
  }

  const handleDebitNote = (itemId: string, debitNoteNo?: string) => {
    if (onDebitNoteAction) {
      onDebitNoteAction(itemId, debitNoteNo || "")
    }
  }

  return (
    <>
      <TaskTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        moduleId={moduleId}
        transactionId={transactionId}
        tableName={TableName.medicalAssistance}
        emptyMessage="No medical assistance found."
        accessorId="medicalAssistanceId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionMedicalAssistance}
        onEditAction={onEditActionMedicalAssistance}
        onDeleteAction={onDeleteMedicalAssistance}
        onBulkDeleteAction={onBulkDeleteMedicalAssistance}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.medicalAssistance}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <MedicalAssistanceHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          medicalAssistanceId={historyDialog.medicalAssistanceId}
          medicalAssistanceIdDisplay={historyDialog.medicalAssistanceIdDisplay}
        />
      )}
    </>
  )
}
