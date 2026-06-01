"use client"

import { useCallback, useMemo, useState } from "react"
import { getDisplayDetailLines } from "@/helpers/equipment-used-details"
import {
  IEquipmentUsed,
  IEquipmentUsedFilter,
  IJobOrderHd,
} from "@/interfaces/checklist"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import EquipmentUsedHistoryDialog from "../services-history/equipment-used-history-dialog"
import {
  EquipmentUsedInlineNumberCell,
  EquipmentUsedInlineTextCell,
  EquipmentUsedInlineTypeCell,
} from "./equipment-used-inline-detail-cells"

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
  jobData?: IJobOrderHd | null
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
  canView: _canView,
  canEdit: _canEdit,
  canDelete: _canDelete,
  canCreate: _canCreate,
  canDebitNote,
}: EquipmentUsedTableProps) {
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

  const handleOpenHistory = useCallback((item: IEquipmentUsed) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      equipmentUsedId: item.equipmentUsedId,
      equipmentUsedIdDisplay: item.equipmentUsedId,
    })
  }, [])

  const columns: ColumnDef<IEquipmentUsed>[] = useMemo(
    () => [
      {
        accessorKey: "equipmentUsedId",
        header: "No",
        size: 80,
        minSize: 50,
      },
      ...(canDebitNote
        ? [
            {
              accessorKey: "debitNoteNo",
              header: "Debit Note No",
              size: 200,
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
        accessorKey: "chargeName",
        header: "Charge Name",
        cell: ({ row }) => (
          <div className="truncate font-medium">
            {row.getValue("chargeName") || "-"}
          </div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        id: "lineType",
        header: "Type",
        cell: ({ row }) => (
          <EquipmentUsedInlineTypeCell
            lines={getDisplayDetailLines(row.original)}
          />
        ),
        size: 100,
        minSize: 90,
      },
      {
        id: "lineDate",
        header: "Date",
        cell: ({ row }) => (
          <EquipmentUsedInlineTextCell
            lines={getDisplayDetailLines(row.original)}
            format={(line) => formatDateValue(line.date)}
          />
        ),
        size: 110,
        minSize: 95,
      },
      {
        id: "lineReferenceNo",
        header: "Ref No",
        cell: ({ row }) => (
          <EquipmentUsedInlineTextCell
            lines={getDisplayDetailLines(row.original)}
            format={(line) => line.referenceNo?.trim() || "-"}
          />
        ),
        size: 100,
        minSize: 85,
      },
      {
        id: "lineTallySheetNo",
        header: "Tally No",
        cell: ({ row }) => (
          <EquipmentUsedInlineTextCell
            lines={getDisplayDetailLines(row.original)}
            format={(line) => line.tallySheetNo?.trim() || "-"}
          />
        ),
        size: 100,
        minSize: 85,
      },
      {
        id: "lineCrane",
        header: "Crane",
        cell: ({ row }) => (
          <EquipmentUsedInlineNumberCell
            lines={getDisplayDetailLines(row.original)}
            getValue={(line) => line.crane}
          />
        ),
        size: 70,
        minSize: 60,
      },
      {
        id: "lineForklift",
        header: "Forklift",
        cell: ({ row }) => (
          <EquipmentUsedInlineNumberCell
            lines={getDisplayDetailLines(row.original)}
            getValue={(line) => line.forklift}
          />
        ),
        size: 75,
        minSize: 65,
      },
      {
        id: "lineStevedore",
        header: "Stevedore",
        cell: ({ row }) => (
          <EquipmentUsedInlineNumberCell
            lines={getDisplayDetailLines(row.original)}
            getValue={(line) => line.stevedore}
          />
        ),
        size: 80,
        minSize: 70,
      },
      {
        id: "lineMafi",
        header: "MAFI",
        cell: ({ row }) => (
          <EquipmentUsedInlineTextCell
            lines={getDisplayDetailLines(row.original)}
            format={(line) => (line.mafi ?? "").trim() || "-"}
          />
        ),
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: "others",
        header: "Others",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("others") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "providerName",
        header: "Provider Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("providerName") || "-"}</div>
        ),
        size: 170,
        minSize: 130,
      },
      {
        id: "lineGear",
        header: "Gear",
        cell: ({ row }) => (
          <EquipmentUsedInlineNumberCell
            lines={getDisplayDetailLines(row.original)}
            getValue={(line) => line.gear}
          />
        ),
        size: 90,
        minSize: 80,
      },
      {
        accessorKey: "bargeName",
        header: "Barge Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("bargeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "ameTally",
        header: "AME Tally",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("ameTally") || "-"}</div>
        ),
        size: 130,
        minSize: 100,
      },
      {
        id: "lineRemarks",
        header: "Remarks",
        cell: ({ row }) => (
          <EquipmentUsedInlineTextCell
            lines={getDisplayDetailLines(row.original)}
            format={(line) => (line.remarks ?? "").trim() || "-"}
          />
        ),
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("notes") || "-"}</div>
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
          <div className="truncate">{row.getValue("createBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
        maxSize: 150,
      },
      {
        accessorKey: "createDate",
        header: "Create Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateTimeValue(row.getValue("createDate"))}
          </div>
        ),
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
        maxSize: 150,
      },
      {
        accessorKey: "editDate",
        header: "Edit Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateTimeValue(row.getValue("editDate"))}
          </div>
        ),
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
    ],
    [formatDateValue, formatDateTimeValue, handleOpenHistory, canDebitNote]
  )

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
