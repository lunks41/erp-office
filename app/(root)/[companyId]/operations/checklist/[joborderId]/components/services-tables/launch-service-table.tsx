"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IJobOrderHd,
  ILaunchService,
  ILaunchServiceFilter,
} from "@/interfaces/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { OperationsTransactionId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskTable } from "@/components/table/table-task"

import LaunchServiceHistoryDialog from "../services-history/launch-service-history-dialog"

interface LaunchServiceTableProps {
  data: ILaunchService[]
  isLoading?: boolean
  onLaunchServiceSelect?: (launchService: ILaunchService | undefined) => void
  onDeleteLaunchService?: (launchServiceId: string) => void
  onBulkDeleteLaunchService?: (selectedIds: string[]) => void
  onEditActionLaunchService?: (launchService: ILaunchService) => void
  onCreateActionLaunchService?: () => void
  onDebitNoteAction?: (launchServiceId: string, debitNoteNo?: string) => void
  onPurchaseAction?: (launchServiceId: string) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ILaunchServiceFilter) => void
  moduleId?: number
  transactionId?: number
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: ILaunchService) => void
  isConfirmed?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function LaunchServiceTable({
  data,
  isLoading = false,
  onLaunchServiceSelect,
  onDeleteLaunchService,
  onBulkDeleteLaunchService,
  onEditActionLaunchService,
  onCreateActionLaunchService,
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
}: LaunchServiceTableProps) {
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
    launchServiceId: number
    launchServiceIdDisplay?: number
  }>({
    isOpen: false,
    jobOrderId: 0,
    launchServiceId: 0,
    launchServiceIdDisplay: 0,
  })

  // Handler to open history dialog
  const handleOpenHistory = useCallback((item: ILaunchService) => {
    setHistoryDialog({
      isOpen: true,
      jobOrderId: item.jobOrderId,
      launchServiceId: item.launchServiceId,
      launchServiceIdDisplay: item.launchServiceId,
    })
  }, [])

  // Memoize columns to prevent infinite re-renders
  const columns: ColumnDef<ILaunchService>[] = useMemo(
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
        accessorKey: "uomName",
        header: "UOM",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("uomName") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: "ameTally",
        header: "AME Tally",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("ameTally") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "boatopTally",
        header: "Boat Operator Tally",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("boatopTally") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "boatOperator",
        header: "Boat Operator",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("boatOperator") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "distance",
        header: "Distance from Jetty",
        cell: ({ row }) => {
          const value = row.getValue("distance") as number
          return <div className="text-wrap">{value ? `${value} NM` : "-"}</div>
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "deliveredWeight",
        header: "Cargo Delivered",
        cell: ({ row }) => {
          const value = row.getValue("deliveredWeight") as
            | number
            | null
            | undefined
          return (
            <div className="text-right">
              {value != null ? `${value} MT` : "-"}
            </div>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "landedWeight",
        header: "Cargo Landed",
        cell: ({ row }) => {
          const value = row.getValue("landedWeight") as
            | number
            | null
            | undefined
          return (
            <div className="text-right">
              {value != null ? `${value} MT` : "-"}
            </div>
          )
        },
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "loadingTime",
        header: "Loading Time",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("loadingTime"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "leftJetty",
        header: "Left Jetty",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("leftJetty"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "waitingTime",
        header: "Waiting Time",
        cell: ({ row }) => {
          const value = row.getValue("waitingTime") as number
          if (!value)
            return <div className="text-muted-foreground text-wrap">-</div>

          const valueStr = value.toString()
          if (valueStr.includes(".")) {
            const [hours, minutes] = valueStr.split(".")
            const paddedMinutes = minutes.padEnd(2, "0")
            return (
              <div className="flex items-center gap-1 text-wrap">
                <span className="font-mono text-sm font-medium">
                  {hours}:{paddedMinutes}
                </span>
                <span className="text-muted-foreground text-xs">hr</span>
              </div>
            )
          }

          return (
            <div className="flex items-center gap-1 text-wrap">
              <span className="font-mono text-sm font-medium">{valueStr}</span>
              <span className="text-muted-foreground text-xs">hr</span>
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "alongsideVessel",
        header: "Alongside Vessel",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("alongsideVessel"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "departedFromVessel",
        header: "Departed Vessel",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("departedFromVessel"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "timeDiff",
        header: "Time Difference",
        cell: ({ row }) => {
          const value = row.getValue("timeDiff") as number
          if (!value)
            return <div className="text-muted-foreground text-wrap">-</div>

          const valueStr = value.toString()
          if (valueStr.includes(".")) {
            const [hours, minutes] = valueStr.split(".")
            const paddedMinutes = minutes.padEnd(2, "0")
            return (
              <div className="flex items-center gap-1 text-wrap">
                <span className="font-mono text-sm font-medium">
                  {hours}:{paddedMinutes}
                </span>
                <span className="text-muted-foreground text-xs">hr</span>
              </div>
            )
          }

          return (
            <div className="flex items-center gap-1 text-wrap">
              <span className="font-mono text-sm font-medium">{valueStr}</span>
              <span className="text-muted-foreground text-xs">hr</span>
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "arrivedAtJetty",
        header: "Arrived at Jetty",
        cell: ({ row }) => {
          return (
            <div className="text-wrap">
              {formatDateTimeValue(row.getValue("arrivedAtJetty"))}
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 200,
      },
      {
        accessorKey: "bargeName",
        header: "Barge Name",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("bargeName") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: "invoiceNo",
        header: "Invoice No",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("invoiceNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "annexure",
        header: "Annexure",
        cell: ({ row }) => (
          <div className="text-wrap">{row.getValue("annexure") || "-"}</div>
        ),
        size: 150,
        minSize: 120,
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

  const handleItemSelect = (item: ILaunchService | null) => {
    if (onLaunchServiceSelect) {
      onLaunchServiceSelect(item || undefined)
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
        tableName={TableName.launchService}
        emptyMessage="No launch services found."
        accessorId="launchServiceId"
        onRefreshAction={onRefreshAction}
        onFilterChange={handleFilterChange}
        onSelect={handleItemSelect}
        onCreateAction={onCreateActionLaunchService}
        onEditAction={onEditActionLaunchService}
        onDeleteAction={onDeleteLaunchService}
        onBulkDeleteAction={onBulkDeleteLaunchService}
        onDebitNoteAction={handleDebitNote}
        onPurchaseAction={onPurchaseAction}
        onCombinedService={onCombinedService}
        onCloneTask={onCloneTask}
        onCloneRow={onCloneRow}
        isConfirmed={isConfirmed}
        showHeader={true}
        showActions={true}
        jobData={jobData}
        transactionIdForDocuments={OperationsTransactionId.launchService}
        canView={_canView}
        canEdit={_canEdit}
        canDelete={_canDelete}
        canCreate={_canCreate}
        canDebitNote={canDebitNote}
      />

      {/* History Dialog */}
      {historyDialog.isOpen && (
        <LaunchServiceHistoryDialog
          open={historyDialog.isOpen}
          onOpenChange={(isOpen) =>
            setHistoryDialog((prev) => ({ ...prev, isOpen }))
          }
          jobOrderId={historyDialog.jobOrderId}
          launchServiceId={historyDialog.launchServiceId}
          launchServiceIdDisplay={historyDialog.launchServiceIdDisplay}
        />
      )}
    </>
  )
}
