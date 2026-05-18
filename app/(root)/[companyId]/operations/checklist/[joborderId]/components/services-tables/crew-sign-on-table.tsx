"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useCallback, useMemo, useState } from "react"
import {
  ICrewSignOn,
  ICrewSignOnFilter,
  IJobOrderHd,
} from "@/interfaces/checklist"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import CrewSignOnHistoryDialog from "../services-history/crew-sign-on-history-dialog"

interface CrewSignOnTableProps {
  data: ICrewSignOn[]
  isLoading?: boolean
  onCrewSignOnSelect?: (crewSignOn: ICrewSignOn | undefined) => void
  onDeleteCrewSignOn?: (crewSignOnId: string) => void
  onBulkDeleteCrewSignOn?: (selectedIds: string[]) => void
  onEditActionCrewSignOn?: (crewSignOn: ICrewSignOn) => void
  onCreateActionCrewSignOn?: () => void
  onDebitNoteAction?: (crewSignOnId: string, debitNoteNo?: string) => void
  onPurchaseAction?: (crewSignOnId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ICrewSignOnFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: ICrewSignOn) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function CrewSignOnTable({
  data,
  isLoading = false,
  onCrewSignOnSelect,
  onDeleteCrewSignOn,
  onBulkDeleteCrewSignOn,
  onEditActionCrewSignOn,
  onCreateActionCrewSignOn,
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
}: CrewSignOnTableProps) {
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
    crewSignOnId: number
    crewSignOnIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    crewSignOnId: 0,
    crewSignOnIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: ICrewSignOn) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      crewSignOnId: item.crewSignOnId,
      crewSignOnIdDisplay: item.crewSignOnId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<ICrewSignOn>[] = useMemo(
    () => [
      {
        accessorKey: "crewSignOnId",
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
        accessorKey: "crewName",
        header: "Crew Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("crewName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "nationalityName",
        header: "Nationality",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("nationalityName") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },

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
        accessorKey: "visaName",
        header: "Visa Type",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("visaName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "rankName",
        header: "Rank",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("rankName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },

      {
        accessorKey: "flightDetails",
        header: "Flight Details",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("flightDetails") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "hotelName",
        header: "Hotel Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("hotelName") || "-"}</div>
        ),
      },
      {
        accessorKey: "departureDetails",
        header: "Departure Details",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("departureDetails") || "-"}
          </div>
        ),
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
        accessorKey: "transportName",
        header: "Transport Name",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("transportName") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "clearing",
        header: "Clearing",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("clearing") || "-"}</div>
        ),
      },
      {
        accessorKey: "overStayRemark",
        header: "Over Stay Remark",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("overStayRemark") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "modificationRemark",
        header: "Modification Remark",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("modificationRemark") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "cidClearance",
        header: "CID Clearance",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("cidClearance") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
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

  const handleItemSelect = (item: ICrewSignOn | null) => {
    if (onCrewSignOnSelect) {
      onCrewSignOnSelect(item || undefined)
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
        tableName={TableName.crewSignOn}
        emptyMessage="No crew sign ons found."
        accessorId="crewSignOnId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionCrewSignOn}
        onEditAction={onEditActionCrewSignOn}
        onDeleteAction={onDeleteCrewSignOn}
        onBulkDeleteAction={onBulkDeleteCrewSignOn}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.crewSignOn}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <CrewSignOnHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          crewSignOnId={historyDialog.crewSignOnId}
          crewSignOnIdDisplay={historyDialog.crewSignOnIdDisplay}
        />
      )}
    </>
  )
}
