"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IConsignmentExport,
  IConsignmentExportFilter,
  IJobOrderHd,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import ConsignmentExportHistoryDialog from "../services-history/consignment-export-history-dialog"

interface ConsignmentExportTableProps {
  data: IConsignmentExport[]
  isLoading?: boolean
  onConsignmentExportSelect?: (
    consignmentExport: IConsignmentExport | undefined
  ) => void
  onDeleteConsignmentExport?: (consignmentExportId: string) => void
  onBulkDeleteConsignmentExport?: (selectedIds: string[]) => void
  onEditActionConsignmentExport?: (
    consignmentExport: IConsignmentExport
  ) => void
  onCreateActionConsignmentExport?: () => void
  onRefreshActionte?: (
    consignmentExportId: string,
    debitNoteNo?: string
  ) => void
  onDebitNoteAction?: (
    consignmentExportId: string,
    debitNoteNo?: string
  ) => void
  onPurchaseAction?: (consignmentExportId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: IConsignmentExportFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: IConsignmentExport) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function ConsignmentExportTable({
  data,
  isLoading = false,
  onConsignmentExportSelect,
  onDeleteConsignmentExport,
  onBulkDeleteConsignmentExport,
  onEditActionConsignmentExport,
  onCreateActionConsignmentExport,
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
}: ConsignmentExportTableProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const formatDateTime = useCallback(
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
    consignmentExportId: number
    consignmentExportIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    consignmentExportId: 0,
    consignmentExportIdDisplay: 0,
  })

  // Handler to open history dialog
  const _handleOpenHistory = useCallback((item: IConsignmentExport) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      consignmentExportId: item.consignmentExportId,
      consignmentExportIdDisplay: item.consignmentExportId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<IConsignmentExport>[] = useMemo(
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
        accessorKey: "awbNo",
        header: "AWB No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("awbNo") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
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
        accessorKey: "carrierName",
        header: "Carrier",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("carrierName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "consignmentTypeName",
        header: "Consignment Type",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("consignmentTypeName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
      },
      {
        accessorKey: "weight",
        header: "Weight",
        cell: ({ row }) => {
          const value = row.getValue("weight") as number | null | undefined
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
        accessorKey: "pickupLocation",
        header: "Pickup Location",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("pickupLocation") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "deliveryLocation",
        header: "Delivery Location",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("deliveryLocation") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "referenceNo",
        header: "Reference No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("referenceNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "receiveDate",
        header: "Receive Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateTime(row.getValue("receiveDate"))}
          </div>
        ),
        size: 130,
        minSize: 110,
      },
      {
        accessorKey: "deliverDate",
        header: "Deliver Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateTime(row.getValue("deliverDate"))}
          </div>
        ),
        size: 130,
        minSize: 110,
      },
      {
        accessorKey: "arrivalDate",
        header: "Arrival Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateTime(row.getValue("arrivalDate"))}
          </div>
        ),
        size: 130,
        minSize: 110,
      },
      {
        accessorKey: "clearedBy",
        header: "Cleared By",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("clearedBy") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "billEntryNo",
        header: "Bill Entry No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("billEntryNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "declarationNo",
        header: "Declaration No",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("declarationNo") || "-"}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "amountDeposited",
        header: "Amount Deposited",
        cell: ({ row }) => {
          const v = row.getValue("amountDeposited") as number | null | undefined
          return <div className="truncate text-right">{v != null ? v : "-"}</div>
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "refundInstrumentNo",
        header: "Refund Instrument No",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("refundInstrumentNo") || "-"}
          </div>
        ),
        size: 140,
        minSize: 120,
      },
      {
        accessorKey: "noOfPcs",
        header: "No Of Pcs",
        cell: ({ row }) => {
          const v = row.getValue("noOfPcs") as number | null | undefined
          return <div className="truncate text-right">{v != null ? v : "-"}</div>
        },
        size: 90,
        minSize: 80,
      },
      {
        accessorKey: "serviceModeName",
        header: "Service Mode",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("serviceModeName") || "-"}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "landingTypeName",
        header: "Landing Type",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("landingTypeName") || "-"}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("remarks") || "-"}</div>
        ),
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
                onClick={() => _handleOpenHistory(item)}
                title="Click to view history"
              >
                {row.getValue("editVersion") ?? "0"}
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
        accessorKey: "isCleared",
        header: "Is Cleared",
        cell: ({ row }) => (
          <div className="flex justify-center overflow-hidden">
            {row.getValue("isCleared") ? (
              <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
            ) : (
              <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
            )}
          </div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "existPortCustom",
        header: "Exist Port Custom",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("existPortCustom") || "-"}
          </div>
        ),
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
        cell: ({ row }) => formatDateTime(row.getValue("createDate")),
        size: 160,
        minSize: 130,
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
        cell: ({ row }) => formatDateTime(row.getValue("editDate")),
        size: 160,
        minSize: 130,
      },
    ],
    [formatDateTime, _handleOpenHistory, canDebitNote]
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

  const handleItemSelect = (item: IConsignmentExport | null) => {
    if (onConsignmentExportSelect) {
      onConsignmentExportSelect(item || undefined)
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
        tableName={TableName.consignmentExport}
        emptyMessage="No consignment exports found."
        accessorId="consignmentExportId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionConsignmentExport}
        onEditAction={onEditActionConsignmentExport}
        onDeleteAction={onDeleteConsignmentExport}
        onBulkDeleteAction={onBulkDeleteConsignmentExport}
        onDebitNoteAction={canDebitNote ? handleDebitNote : undefined}
        onPurchaseAction={canDebitNote ? onPurchaseAction : undefined}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.consignmentExport}
        canView={canView}
        canEdit={canEdit}
        canDelete={canDelete}
        canCreate={canCreate}
        canDebitNote={canDebitNote}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <ConsignmentExportHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          consignmentExportId={historyDialog.consignmentExportId}
          consignmentExportIdDisplay={historyDialog.consignmentExportIdDisplay}
        />
      )}
    </>
  )
}
