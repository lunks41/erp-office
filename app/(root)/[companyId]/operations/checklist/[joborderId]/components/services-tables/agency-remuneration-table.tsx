"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IAgencyRemuneration,
  IAgencyRemunerationFilter,
  IJobOrderHd,
} from "@/interfaces/checklist"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import AgencyRemunerationHistoryDialog from "../services-history/agency-remuneration-history-dialog"

interface AgencyRemunerationTableProps {
  data: IAgencyRemuneration[]
  isLoading?: boolean
  onAgencyRemunerationSelect?: (
    agencyRemuneration: IAgencyRemuneration | undefined
  ) => void
  onDeleteAgencyRemuneration?: (agencyRemunerationId: string) => void
  onBulkDeleteAgencyRemuneration?: (selectedIds: string[]) => void
  onEditActionAgencyRemuneration?: (
    agencyRemuneration: IAgencyRemuneration
  ) => void
  onCreateActionAgencyRemuneration?: () => void
  onRefreshActionte?: (
    agencyRemunerationId: string,
    debitNoteNo?: string
  ) => void
  onDebitNoteAction?: (
    agencyRemunerationId: string,
    debitNoteNo?: string
  ) => void
  onPurchaseAction?: (agencyRemunerationId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: IAgencyRemunerationFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: IAgencyRemuneration) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function AgencyRemunerationTable({
  data,
  isLoading = false,
  onAgencyRemunerationSelect,
  onDeleteAgencyRemuneration,
  onBulkDeleteAgencyRemuneration,
  onEditActionAgencyRemuneration,
  onCreateActionAgencyRemuneration,
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
  canView = true,
  canEdit = true,
  canDelete = true,
  canCreate = true,
  canDebitNote = true,
}: AgencyRemunerationTableProps) {
  const { decimals } = useCompanyStore()
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
    agencyRemunerationId: number
    agencyRemunerationIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    agencyRemunerationId: 0,
    agencyRemunerationIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: IAgencyRemuneration) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      agencyRemunerationId: item.agencyRemunerationId,
      agencyRemunerationIdDisplay: item.agencyRemunerationId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IAgencyRemuneration>[] = useMemo(
    () => [
      {
        accessorKey: "agencyRemunerationId",
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
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateTimeValue(row.getValue("date"))}
          </div>
        ),
        size: 140,
        minSize: 120,
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
          return (
            <div className="truncate">
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
          <div className="truncate">{row.getValue("editBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => {
          return (
            <div className="truncate">
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

  const handleItemSelect = (item: IAgencyRemuneration | null) => {
    if (onAgencyRemunerationSelect) {
      onAgencyRemunerationSelect(item || undefined)
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
        tableName={TableName.agencyRemuneration}
        emptyMessage="No agency remunerations found."
        accessorId="agencyRemunerationId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionAgencyRemuneration}
        onEditAction={onEditActionAgencyRemuneration}
        onDeleteAction={onDeleteAgencyRemuneration}
        onBulkDeleteAction={onBulkDeleteAgencyRemuneration}
        onDebitNoteAction={canDebitNote ? handleDebitNote : undefined}
        onPurchaseAction={canDebitNote ? onPurchaseAction : undefined}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.agencyRemuneration}
        canView={canView}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
        canDebitNote={canDebitNote}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <AgencyRemunerationHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          agencyRemunerationId={historyDialog.agencyRemunerationId}
          agencyRemunerationIdDisplay={
            historyDialog.agencyRemunerationIdDisplay
          }
        />
      )}
    </>
  )
}
