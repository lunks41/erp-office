"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useCallback, useMemo, useState } from "react"
import {
  IJobOrderHd,
  ITechnicianSurveyor,
  ITechnicianSurveyorFilter,
} from "@/interfaces/checklist"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import TechnicianSurveyorHistoryDialog from "../services-history/technician-surveyor-history-dialog"

interface TechnicianSurveyorTableProps {
  data: ITechnicianSurveyor[]
  isLoading?: boolean
  onTechnicianSurveyorSelect?: (
    technicianSurveyor: ITechnicianSurveyor | null
  ) => void
  onDeleteTechnicianSurveyor?: (technicianSurveyorId: string) => void
  onBulkDeleteTechnicianSurveyor?: (selectedIds: string[]) => void
  onEditActionTechnicianSurveyor?: (
    technicianSurveyor: ITechnicianSurveyor
  ) => void
  onCreateActionTechnicianSurveyor?: () => void
  onRefreshActionte?: (
    technicianSurveyorId: string,
    debitNoteNo?: string
  ) => void
  onDebitNoteAction?: (
    technicianSurveyorId: string,
    debitNoteNo?: string
  ) => void
  onPurchaseAction?: (technicianSurveyorId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ITechnicianSurveyorFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: ITechnicianSurveyor) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function TechnicianSurveyorTable({
  data,
  isLoading = false,
  onTechnicianSurveyorSelect,
  onDeleteTechnicianSurveyor,
  onBulkDeleteTechnicianSurveyor,
  onEditActionTechnicianSurveyor,
  onCreateActionTechnicianSurveyor,
  onRefreshActionte: _onRefreshActionte,
  onDebitNoteAction,
  onPurchaseAction,
  onRefreshAction,
  onFilterChange,
  moduleId,
  transactionId,
  onCombinedService,
  onCloneTask,
  onCloneRow,
  isConfirmed,
  jobData,
  // Permission props
  canView: _canView,
  canEdit: _canEdit,
  canDelete: _canDelete,
  canCreate: _canCreate,
  canDebitNote,
}: TechnicianSurveyorTableProps) {
  const { decimals } = useCompanyStore()
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
    technicianSurveyorId: number
    technicianSurveyorIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    technicianSurveyorId: 0,
    technicianSurveyorIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: ITechnicianSurveyor) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      technicianSurveyorId: item.technicianSurveyorId,
      technicianSurveyorIdDisplay: item.technicianSurveyorId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<ITechnicianSurveyor>[] = useMemo(
    () => [
      {
        accessorKey: "technicianSurveyorId",
        header: "No",
        size: 80,
        minSize: 50,
      },
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
        accessorKey: "isTransport",
        header: "Transport",
        cell: ({ row }) => {
          const isTransport = row.getValue("isTransport") as boolean
          return (
            <div className="text-center">
              <Badge
                variant={isTransport ? "default" : "outline"}
                className={isTransport ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isTransport ? "Yes" : "No"}
              </Badge>
            </div>
          )
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "isHotel",
        header: "Hotel",
        cell: ({ row }) => {
          const isHotel = row.getValue("isHotel") as boolean
          return (
            <div className="text-center">
              <Badge
                variant={isHotel ? "default" : "outline"}
                className={isHotel ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {isHotel ? "Yes" : "No"}
              </Badge>
            </div>
          )
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("name") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "chargeName",
        header: "Charge Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("chargeName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const value = row.getValue("quantity") as number | null | undefined
          return <div className="truncate text-right">{value != null ? value : "-"}</div>
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("uomName") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "natureOfAttendance",
        header: "Nature of Attendance",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("natureOfAttendance") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "companyInfo",
        header: "Company Info",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("companyInfo") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "passTypeName",
        header: "Pass Type",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("passTypeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "embarked",
        header: "Embarked",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("embarked"))
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "disembarked",
        header: "Disembarked",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("disembarked"))
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "portRequestNo",
        header: "Port Request No",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("portRequestNo") || "-"}
          </div>
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
          <div className="truncate">{row.getValue("createBy") || "-"}</div>
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
          <div className="truncate">{row.getValue("editBy") || "-"}</div>
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

  const handleItemSelect = (item: ITechnicianSurveyor | null) => {
    if (onTechnicianSurveyorSelect) {
      onTechnicianSurveyorSelect(item || null)
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
        tableName={TableName.techniciansSurveyors}
        emptyMessage="No technician surveyors found."
        accessorId="technicianSurveyorId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionTechnicianSurveyor}
        onEditAction={onEditActionTechnicianSurveyor}
        onDeleteAction={onDeleteTechnicianSurveyor}
        onBulkDeleteAction={onBulkDeleteTechnicianSurveyor}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.technicianSurveyor}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <TechnicianSurveyorHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          technicianSurveyorId={historyDialog.technicianSurveyorId}
          technicianSurveyorIdDisplay={
            historyDialog.technicianSurveyorIdDisplay
          }
        />
      )}
    </>
  )
}
