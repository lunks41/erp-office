"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IJobOrderHd,
  ILandingItems,
  ILandingItemsFilter,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import LandingItemsHistoryDialog from "../services-history/landing-items-history-dialog"

interface LandingItemsTableProps {
  data: ILandingItems[]
  isLoading?: boolean
  onLandingItemsSelect?: (landingItems: ILandingItems | undefined) => void
  onDeleteLandingItems?: (landingItemsId: string) => void
  onBulkDeleteLandingItems?: (selectedIds: string[]) => void
  onEditActionLandingItems?: (landingItems: ILandingItems) => void
  onCreateActionLandingItems?: () => void
  onDebitNoteAction?: (landingItemsId: string, debitNoteNo?: string) => void
  onPurchaseAction?: (landingItemsId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ILandingItemsFilter) => void
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

export function LandingItemsTable({
  data,
  isLoading = false,
  onLandingItemsSelect,
  onDeleteLandingItems,
  onBulkDeleteLandingItems,
  onEditActionLandingItems,
  onCreateActionLandingItems,
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
  canView,
  canEdit,
  canDelete,
  canCreate,
  canDebitNote,
}: LandingItemsTableProps) {
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
    landingItemId: number
    landingItemIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    landingItemId: 0,
    landingItemIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: ILandingItems) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      landingItemId: item.landingItemId,
      landingItemIdDisplay: item.landingItemId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<ILandingItems>[] = useMemo(
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
          return formatDateValue(row.getValue("date"))
        },
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
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("name") || "-"}</div>
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
        accessorKey: "weight",
        header: "Weight",
        cell: ({ row }) => {
          const value = row.getValue("weight") as number | null | undefined
          return <div className="text-right">{value != null ? value : "-"}</div>
        },
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "landingPurposeName",
        header: "Landing Purpose",
        cell: ({ row }) => (
          <div className="text-wrap">
            {row.getValue("landingPurposeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "locationName",
        header: "Location",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("locationName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("uomName") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "returnDate",
        header: "Return Date",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("returnDate"))
        },
        size: 120,
        minSize: 100,
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

  const handleItemSelect = (item: ILandingItems | null) => {
    if (onLandingItemsSelect) {
      onLandingItemsSelect(item || undefined)
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
        tableName={TableName.landingItems}
        emptyMessage="No landing items found."
        accessorId="landingItemId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionLandingItems}
        onEditAction={onEditActionLandingItems}
        onDeleteAction={onDeleteLandingItems}
        onBulkDeleteAction={onBulkDeleteLandingItems}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.landingItems}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <LandingItemsHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          landingItemId={historyDialog.landingItemId}
          landingItemIdDisplay={historyDialog.landingItemIdDisplay}
        />
      )}
    </>
  )
}
