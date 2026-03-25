"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IFreshWater,
  IFreshWaterFilter,
  IJobOrderHd,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import FreshWaterHistoryDialog from "../services-history/fresh-water-history-dialog"

interface FreshWaterTableProps {
  data: IFreshWater[]
  isLoading?: boolean
  onFreshWaterSelect?: (freshWater: IFreshWater | undefined) => void
  onDeleteFreshWater?: (freshWaterId: string) => void
  onBulkDeleteFreshWater?: (selectedIds: string[]) => void
  onEditActionFreshWater?: (freshWater: IFreshWater) => void
  onCreateActionFreshWater?: () => void
  onDebitNoteAction?: (freshWaterId: string, debitNoteNo?: string) => void
  onPurchaseAction?: (freshWaterId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: IFreshWaterFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: IFreshWater) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function FreshWaterTable({
  data,
  isLoading = false,
  onFreshWaterSelect,
  onDeleteFreshWater,
  onBulkDeleteFreshWater,
  onEditActionFreshWater,
  onCreateActionFreshWater,
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
}: FreshWaterTableProps) {
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
    freshWaterId: number
    freshWaterIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    freshWaterId: 0,
    freshWaterIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: IFreshWater) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      freshWaterId: item.freshWaterId,
      freshWaterIdDisplay: item.freshWaterId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IFreshWater>[] = useMemo(
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
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          return (
            <div className="truncate">
              {formatDateValue(row.getValue("date"))}
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "bargeName",
        header: "Barge Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("bargeName") || "-"}</div>
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
        accessorKey: "operatorName",
        header: "Operator Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("operatorName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "supplyBarge",
        header: "Supply Barge",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("supplyBarge") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "distance",
        header: "Distance",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("distance") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
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
        accessorKey: "receiptNo",
        header: "Receipt No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("receiptNo") || "-"}</div>
        ),
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
    [
      formatDateValue,
      formatDateTimeValue,
      handleOpenHistory,
      canDebitNote,
    ]
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

  const handleItemSelect = (item: IFreshWater | null) => {
    if (onFreshWaterSelect) {
      onFreshWaterSelect(item || undefined)
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
        tableName={TableName.freshWater}
        emptyMessage="No fresh water found."
        accessorId="freshWaterId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionFreshWater}
        onEditAction={onEditActionFreshWater}
        onDeleteAction={onDeleteFreshWater}
        onBulkDeleteAction={onBulkDeleteFreshWater}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.freshWater}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <FreshWaterHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          freshWaterId={historyDialog.freshWaterId}
          freshWaterIdDisplay={historyDialog.freshWaterIdDisplay}
        />
      )}
    </>
  )
}
