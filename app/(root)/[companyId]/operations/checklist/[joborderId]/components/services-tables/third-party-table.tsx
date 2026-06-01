"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IJobOrderHd,
  IThirdParty,
  IThirdPartyFilter,
} from "@/interfaces/checklist"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import ThirdPartyHistoryDialog from "../services-history/third-party-history-dialog"

interface ThirdPartyTableProps {
  data: IThirdParty[]
  isLoading?: boolean
  onThirdPartySelect?: (thirdParty: IThirdParty | undefined) => void
  onDeleteThirdParty?: (thirdPartyId: string) => void
  onBulkDeleteThirdParty?: (selectedIds: string[]) => void
  onEditActionThirdParty?: (thirdParty: IThirdParty) => void
  onCreateActionThirdParty?: () => void
  onDebitNoteAction?: (thirdPartyId: string, debitNoteNo?: string) => void
  onPurchaseAction?: (thirdPartyId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: IThirdPartyFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: IThirdParty) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function ThirdPartyTable({
  data,
  isLoading = false,
  onThirdPartySelect,
  onDeleteThirdParty,
  onBulkDeleteThirdParty,
  onEditActionThirdParty,
  onCreateActionThirdParty,
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
}: ThirdPartyTableProps) {
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
    thirdPartyId: number
    thirdPartyIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    thirdPartyId: 0,
    thirdPartyIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: IThirdParty) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      thirdPartyId: item.thirdPartyId,
      thirdPartyIdDisplay: item.thirdPartyId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IThirdParty>[] = useMemo(
    () => [
      {
        accessorKey: "thirdPartyId",
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
        accessorKey: "supplyTypeName",
        header: "Supply Type",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("supplyTypeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
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
        accessorKey: "supplierName",
        header: "Supplier Name",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("supplierName") || "-"}</div>
        ),
        size: 200,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "name",
        header: "Name 1",
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
          return (
            <div className="truncate text-right">
              {value != null ? value : "-"}
            </div>
          )
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
        accessorKey: "remarks",
        header: "Remarks",
        size: 200,
        minSize: 150,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("description") || "-"}</div>
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
        accessorKey: "deliverDate",
        header: "Deliver Date",
        cell: ({ row }) => {
          return formatDateValue(row.getValue("deliverDate"))
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
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

  const handleItemSelect = (item: IThirdParty | null) => {
    if (onThirdPartySelect) {
      onThirdPartySelect(item || undefined)
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
        tableName={TableName.thirdParty}
        emptyMessage="No third party services found."
        accessorId="thirdPartyId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionThirdParty}
        onEditAction={onEditActionThirdParty}
        onDeleteAction={onDeleteThirdParty}
        onBulkDeleteAction={onBulkDeleteThirdParty}
        onDebitNoteAction={canDebitNote ? handleDebitNote : undefined}
        onPurchaseAction={canDebitNote ? onPurchaseAction : undefined}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.thirdParty}
        canView={canView}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
        canDebitNote={canDebitNote}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <ThirdPartyHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          thirdPartyId={historyDialog.thirdPartyId}
          thirdPartyIdDisplay={historyDialog.thirdPartyIdDisplay}
        />
      )}
    </>
  )
}
