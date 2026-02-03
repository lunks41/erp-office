"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ICrewMiscellaneous,
  ICrewMiscellaneousFilter,
  IJobOrderHd,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import CrewMiscellaneousHistoryDialog from "../services-history/crew-miscellaneous-history-dialog"

interface CrewMiscellaneousTableProps {
  data: ICrewMiscellaneous[]
  isLoading?: boolean
  onCrewMiscellaneousSelect?: (
    crewMiscellaneous: ICrewMiscellaneous | undefined
  ) => void
  onDeleteCrewMiscellaneous?: (crewMiscellaneousId: string) => void
  onBulkDeleteCrewMiscellaneous?: (selectedIds: string[]) => void
  onEditActionCrewMiscellaneous?: (
    crewMiscellaneous: ICrewMiscellaneous
  ) => void
  onCreateActionCrewMiscellaneous?: () => void
  onRefreshActionte?: (
    crewMiscellaneousId: string,
    debitNoteNo?: string
  ) => void
  onDebitNoteAction?: (
    crewMiscellaneousId: string,
    debitNoteNo?: string
  ) => void
  onPurchaseAction?: (crewMiscellaneousId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ICrewMiscellaneousFilter) => void
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

export function CrewMiscellaneousTable({
  data,
  isLoading = false,
  onCrewMiscellaneousSelect,
  onDeleteCrewMiscellaneous,
  onBulkDeleteCrewMiscellaneous,
  onEditActionCrewMiscellaneous,
  onCreateActionCrewMiscellaneous,
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
}: CrewMiscellaneousTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
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
    crewMiscellaneousId: number
    crewMiscellaneousIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    crewMiscellaneousId: 0,
    crewMiscellaneousIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: ICrewMiscellaneous) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      crewMiscellaneousId: item.crewMiscellaneousId,
      crewMiscellaneousIdDisplay: item.crewMiscellaneousId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<ICrewMiscellaneous>[] = useMemo(
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
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => {
          const value = row.getValue("quantity") as number | null | undefined
          return <div className="text-right">{value != null ? value : "-"}</div>
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("description") || "-"}</div>
        ),
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
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("createDate"))}
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
          <div className="text-wrap">{row.getValue("editBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("editDate"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
    ],
    [formatDateTimeValue, handleOpenHistory, canDebitNote]
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

  const handleItemSelect = (item: ICrewMiscellaneous | null) => {
    if (onCrewMiscellaneousSelect) {
      onCrewMiscellaneousSelect(item || undefined)
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
        tableName={TableName.crewMiscellaneous}
        emptyMessage="No crew miscellaneous found."
        accessorId="crewMiscellaneousId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionCrewMiscellaneous}
        onEditAction={onEditActionCrewMiscellaneous}
        onDeleteAction={onDeleteCrewMiscellaneous}
        onBulkDeleteAction={onBulkDeleteCrewMiscellaneous}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.crewMiscellaneous}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <CrewMiscellaneousHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          crewMiscellaneousId={historyDialog.crewMiscellaneousId}
          crewMiscellaneousIdDisplay={historyDialog.crewMiscellaneousIdDisplay}
        />
      )}
    </>
  )
}
