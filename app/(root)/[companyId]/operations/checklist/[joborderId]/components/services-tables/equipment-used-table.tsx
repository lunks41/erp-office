"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IEquipmentUsed,
  IEquipmentUsedFilter,
  IJobOrderHd,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import EquipmentUsedHistoryDialog from "../services-history/equipment-used-history-dialog"

interface EquipmentUsedTableProps {
  data: IEquipmentUsed[]
  isLoading?: boolean
  onEquipmentUsedSelect?: (EquipmentUsed: IEquipmentUsed | undefined) => void
  onDeleteEquipmentUsed?: (equipmentUsedId: string) => void
  onBulkDeleteEquipmentUsed?: (selectedIds: string[]) => void
  onEditActionEquipmentUsed?: (EquipmentUsed: IEquipmentUsed) => void
  onCreateActionEquipmentUsed?: () => void
  onDebitNoteAction?: (equipmentUsedId: string, debitNoteNo?: string) => void
  onPurchaseAction?: (equipmentUsedId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: IEquipmentUsedFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: IEquipmentUsed) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function EquipmentUsedTable({
  data,
  isLoading = false,
  onEquipmentUsedSelect,
  onDeleteEquipmentUsed,
  onBulkDeleteEquipmentUsed,
  onEditActionEquipmentUsed,
  onCreateActionEquipmentUsed,
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
}: EquipmentUsedTableProps) {
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
    equipmentUsedId: number
    equipmentUsedIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    equipmentUsedId: 0,
    equipmentUsedIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: IEquipmentUsed) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      equipmentUsedId: item.equipmentUsedId,
      equipmentUsedIdDisplay: item.equipmentUsedId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IEquipmentUsed>[] = useMemo(
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
        cell: ({ row }) => {
          const status = row.getValue("taskStatusName") as string
          return (
            <div className="text-center">
              <Badge
                variant={status === "Active" ? "default" : "secondary"}
                className="font-medium"
              >
                {status || "-"}
              </Badge>
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "date",
        header: "Service Date",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateValue(row.getValue("date"))}
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
          <div className="text-wrap">{row.getValue("referenceNo") || "-"}</div>
        ),
        size: 130,
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
        accessorKey: "mafi",
        header: "MAFI",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("mafi") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: "others",
        header: "Others",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("others") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "craneChargeName",
        header: "Crane Charge",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("craneChargeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "forkliftChargeName",
        header: "Forklift Charge",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("forkliftChargeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "stevedoreChargeName",
        header: "Stevedore Charge",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("stevedoreChargeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "loadingRefNo",
        header: "Loading Ref No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("loadingRefNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "craneloading",
        header: "Crane Load",
        cell: ({ row }) => {
          const v = row.getValue("craneloading") as number | null | undefined
          return <div className="text-right">{v != null ? v : "-"}</div>
        },
        size: 90,
        minSize: 80,
      },
      {
        accessorKey: "forkliftloading",
        header: "Forklift Load",
        cell: ({ row }) => {
          const v = row.getValue("forkliftloading") as number | null | undefined
          return <div className="text-right">{v != null ? v : "-"}</div>
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "stevedoreloading",
        header: "Stevedore Load",
        cell: ({ row }) => {
          const v = row.getValue("stevedoreloading") as
            | number
            | null
            | undefined
          return <div className="text-right">{v != null ? v : "-"}</div>
        },
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: "offloadingRefNo",
        header: "Offload Ref No",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("offloadingRefNo") || "-"}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "craneOffloading",
        header: "Crane Offload",
        cell: ({ row }) => {
          const v = row.getValue("craneOffloading") as number | null | undefined
          return <div className="text-right">{v != null ? v : "-"}</div>
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "forkliftOffloading",
        header: "Forklift Offload",
        cell: ({ row }) => {
          const v = row.getValue("forkliftOffloading") as
            | number
            | null
            | undefined
          return <div className="text-right">{v != null ? v : "-"}</div>
        },
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: "stevedoreOffloading",
        header: "Stevedore Offload",
        cell: ({ row }) => {
          const v = row.getValue("stevedoreOffloading") as
            | number
            | null
            | undefined
          return <div className="text-right">{v != null ? v : "-"}</div>
        },
        size: 120,
        minSize: 90,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("notes") || "-"}</div>
        ),
        size: 180,
        minSize: 150,
      },
      {
        accessorKey: "editVersion",
        header: "Version",
        cell: ({ row }) => {
          const item = row.original
          const version = row.getValue("editVersion") as number
          return (
            <div className="text-center">
              <Badge
                variant="destructive"
                className="cursor-pointer font-mono text-xs transition-all duration-200 hover:scale-105 hover:bg-red-700"
                onClick={() => handleOpenHistory(item)}
                title="Click to view history"
              >
                v{version || "0"}
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
        maxSize: 150,
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
        maxSize: 150,
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

  const handleItemSelect = (item: IEquipmentUsed | null) => {
    if (onEquipmentUsedSelect) {
      onEquipmentUsedSelect(item || undefined)
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
        tableName={TableName.equipmentUsed}
        emptyMessage="No equipment used found."
        accessorId="equipmentUsedId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionEquipmentUsed}
        onEditAction={onEditActionEquipmentUsed}
        onDeleteAction={onDeleteEquipmentUsed}
        onBulkDeleteAction={onBulkDeleteEquipmentUsed}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.equipmentUsed}
        canView={_canView}
        canEdit={_canEdit}
        canDelete={_canDelete}
        canCreate={_canCreate}
        canDebitNote={canDebitNote}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <EquipmentUsedHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          equipmentUsedId={historyDialog.equipmentUsedId}
          equipmentUsedIdDisplay={historyDialog.equipmentUsedIdDisplay}
        />
      )}
    </>
  )
}
