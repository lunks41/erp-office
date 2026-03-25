"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IJobOrderHd,
  IPortExpenses,
  IPortExpensesFilter,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import PortExpensesHistoryDialog from "../services-history/port-expenses-history-dialog"

interface PortExpensesTableProps {
  data: IPortExpenses[]
  isLoading?: boolean
  onPortExpensesSelect?: (portExpenses: IPortExpenses | undefined) => void
  onDeletePortExpenses?: (portExpensesId: string) => void
  onBulkDeletePortExpenses?: (selectedIds: string[]) => void
  onEditActionPortExpenses?: (portExpenses: IPortExpenses) => void
  onCreateActionPortExpenses?: () => void
  onDebitNoteAction?: (portExpenseId: string, debitNoteNo: string) => void
  onPurchaseAction?: (portExpenseId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: IPortExpensesFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (portExpense: IPortExpenses) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function PortExpensesTable({
  data,
  isLoading = false,
  onPortExpensesSelect,
  onDeletePortExpenses,
  onBulkDeletePortExpenses,
  onEditActionPortExpenses,
  onCreateActionPortExpenses,
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
}: PortExpensesTableProps) {
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
    portExpenseId: number
    portExpenseIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    portExpenseId: 0,
    portExpenseIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: IPortExpenses) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      portExpenseId: item.portExpenseId,
      portExpenseIdDisplay: item.portExpenseId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IPortExpenses>[] = useMemo(
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
        accessorKey: "supplierName",
        header: "Supplier Name",
        size: 200,
        minSize: 150,

        enableColumnFilter: true,
      },
      {
        accessorKey: "chargeName",
        header: "Charge Name",
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
        maxSize: 120,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: "deliverDate",
        header: "Deliver Date",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("deliverDate"))
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

  const handleItemSelect = (item: IPortExpenses | null) => {
    if (onPortExpensesSelect) {
      onPortExpensesSelect(item || undefined)
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
        tableName={TableName.portExpense}
        emptyMessage="No port expenses found."
        accessorId="portExpenseId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionPortExpenses}
        onEditAction={onEditActionPortExpenses}
        onDeleteAction={onDeletePortExpenses}
        onBulkDeleteAction={onBulkDeletePortExpenses}
        onDebitNoteAction={canDebitNote ? handleDebitNote : undefined}
        onPurchaseAction={canDebitNote ? onPurchaseAction : undefined}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.portExpenses}
        canView={canView}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
        canDebitNote={canDebitNote}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <PortExpensesHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          portExpenseId={historyDialog.portExpenseId}
          portExpenseIdDisplay={historyDialog.portExpenseIdDisplay}
        />
      )}
    </>
  )
}
