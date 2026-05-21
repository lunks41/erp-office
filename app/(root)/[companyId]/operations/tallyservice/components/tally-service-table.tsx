"use client"

import { useCallback, useMemo } from "react"
import { ITallyService } from "@/interfaces"
import { getDisplayTallyServiceLines } from "@/helpers/tally-service-details"
import { openTallyServiceTab } from "./tally-service-utils"
import { useCompanyStore } from "@/stores/company-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TableCellLink } from "@/components/ui/table-cell-link"
import { MainTable } from "@/components/table/table-main"

import {
  TallyServiceInlineNumberCell,
  TallyServiceInlineTextCell,
  TallyServiceInlineTypeCell,
} from "./tally-service-inline-detail-cells"

interface TallyServiceTableProps {
  companyId: string
  data: ITallyService[]
  isLoading?: boolean
  totalRecords?: number
  onOpenRecord?: (item: ITallyService) => void
  onDeleteAction?: (item: ITallyService) => void
  onEditAction?: (item: ITallyService) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  serverSidePagination?: boolean
  moduleId?: number
  transactionId?: number
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
  onCreateAction?: () => void
}

function formatDuration(value?: number | null): string {
  if (!value) return "-"
  const [hours = "00", minutes = "00"] = value.toString().split(".")
  return `${hours.padStart(2, "0")}:${minutes.padEnd(2, "0").slice(0, 2)}`
}

export function TallyServiceTable({
  companyId,
  data,
  isLoading = false,
  totalRecords,
  onOpenRecord,
  onDeleteAction,
  onEditAction,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  onPageChange,
  onPageSizeChange,
  currentPage,
  pageSize,
  serverSidePagination = false,
  moduleId,
  transactionId,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
  onCreateAction,
}: TallyServiceTableProps) {
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
        return parsed && isValid(parsed) ? format(parsed, dateFormat) : value
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
        return parsed && isValid(parsed)
          ? format(parsed, datetimeFormat)
          : value
      }
      return "-"
    },
    [dateFormat, datetimeFormat]
  )

  const openRecord = useCallback(
    (item: ITallyService) => {
      if (onOpenRecord) {
        onOpenRecord(item)
        return
      }
      openTallyServiceTab(companyId, item.tallyServiceId)
    },
    [companyId, onOpenRecord]
  )

  const columns: ColumnDef<ITallyService>[] = useMemo(
    () => [
      {
        accessorKey: "tallyServiceId",
        header: "Tally #",
        cell: ({ row }) => {
          const id = row.original.tallyServiceId
          return (
            <TableCellLink type="button" onClick={() => openRecord(row.original)}>
              #{id}
            </TableCellLink>
          )
        },
        size: 90,
        minSize: 70,
      },
      {
        accessorKey: "date",
        header: "Service Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateValue(row.getValue("date"))}
          </div>
        ),
        size: 110,
        minSize: 95,
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("customerName") || "-"}
          </div>
        ),
        size: 160,
        minSize: 130,
      },
      {
        accessorKey: "vesselName",
        header: "Vessel",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("vesselName") || "-"}</div>
        ),
        size: 140,
        minSize: 110,
      },
      {
        accessorKey: "portName",
        header: "Port",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("portName") || "-"}</div>
        ),
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: "jobStatusName",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">
            <Badge variant="secondary">
              {row.getValue("jobStatusName") || "-"}
            </Badge>
          </div>
        ),
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: "chargeName",
        header: "Charge Name",
        cell: ({ row }) => (
          <div className="truncate font-medium">
            {row.getValue("chargeName") || "-"}
          </div>
        ),
        size: 170,
        minSize: 130,
      },
      {
        accessorKey: "bargeName",
        header: "Barge",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("bargeName") || "-"}</div>
        ),
        size: 130,
        minSize: 100,
      },
      {
        id: "lineType",
        header: "Type",
        cell: ({ row }) => (
          <TallyServiceInlineTypeCell
            lines={getDisplayTallyServiceLines(row.original)}
          />
        ),
        size: 100,
        minSize: 90,
      },
      {
        id: "lineTallyNo",
        header: "Tally No",
        cell: ({ row }) => (
          <TallyServiceInlineTextCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) => (entry.line.tallyNo ?? "").trim() || "-"}
          />
        ),
        size: 110,
        minSize: 90,
      },
      {
        id: "lineDistance",
        header: "Distance",
        cell: ({ row }) => (
          <TallyServiceInlineNumberCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) => entry.line.distance ?? 0}
          />
        ),
        size: 80,
        minSize: 70,
      },
      {
        id: "lineCharge",
        header: "Line Charge",
        cell: ({ row }) => (
          <TallyServiceInlineTextCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) => {
              const line = entry.line as {
                chargeName?: string | null
                ChargeName?: string | null
              }
              return (
                line.chargeName?.trim() ||
                line.ChargeName?.trim() ||
                "-"
              )
            }}
          />
        ),
        size: 150,
        minSize: 120,
      },
      {
        id: "lineUom",
        header: "UOM",
        cell: ({ row }) => (
          <TallyServiceInlineTextCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) => {
              if (entry.kind !== "freshwater") return "-"
              const line = entry.line as {
                uomName?: string | null
                UomName?: string | null
              }
              return line.uomName?.trim() || line.UomName?.trim() || "-"
            }}
          />
        ),
        size: 80,
        minSize: 65,
      },
      {
        id: "lineQuantity",
        header: "Qty",
        cell: ({ row }) => (
          <TallyServiceInlineNumberCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) =>
              entry.kind === "freshwater" ? entry.line.quantity ?? 0 : "-"
            }
          />
        ),
        size: 70,
        minSize: 55,
      },
      {
        id: "lineDelivered",
        header: "Delivered",
        cell: ({ row }) => (
          <TallyServiceInlineNumberCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) =>
              entry.kind === "launch"
                ? entry.line.deliveredWeight ?? 0
                : "-"
            }
          />
        ),
        size: 85,
        minSize: 70,
      },
      {
        id: "lineLanded",
        header: "Landed",
        cell: ({ row }) => (
          <TallyServiceInlineNumberCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) =>
              entry.kind === "launch" ? entry.line.landedWeight ?? 0 : "-"
            }
          />
        ),
        size: 80,
        minSize: 65,
      },
      {
        id: "lineWaiting",
        header: "Waiting",
        cell: ({ row }) => (
          <TallyServiceInlineTextCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) =>
              entry.kind === "launch"
                ? formatDuration(entry.line.waitingTime)
                : "-"
            }
          />
        ),
        size: 80,
        minSize: 65,
      },
      {
        id: "lineTimeDiff",
        header: "Time diff",
        cell: ({ row }) => (
          <TallyServiceInlineTextCell
            lines={getDisplayTallyServiceLines(row.original)}
            format={(entry) =>
              entry.kind === "launch"
                ? formatDuration(entry.line.timeDiff)
                : "-"
            }
          />
        ),
        size: 85,
        minSize: 70,
      },
      {
        accessorKey: "invoiceNo",
        header: "Invoice No",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("invoiceNo") || "-"}</div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "isPost",
        header: "Posted",
        cell: ({ row }) => (
          <Badge variant={row.getValue("isPost") ? "default" : "secondary"}>
            {row.getValue("isPost") ? "Yes" : "No"}
          </Badge>
        ),
        size: 80,
        minSize: 65,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("remarks") || "-"}</div>
        ),
        size: 180,
        minSize: 120,
      },
      {
        accessorKey: "createBy",
        header: "Created By",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("createBy") || "-"}</div>
        ),
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: "createDate",
        header: "Created Date",
        cell: ({ row }) => (
          <div className="truncate">
            {formatDateTimeValue(row.getValue("createDate"))}
          </div>
        ),
        size: 160,
        minSize: 130,
      },
    ],
    [formatDateTimeValue, formatDateValue, openRecord]
  )

  const handleDelete = (tallyServiceId: string) => {
    const item = data.find(
      (row) => row.tallyServiceId.toString() === tallyServiceId
    )
    if (item) {
      onDeleteAction?.(item)
    }
  }

  return (
    <MainTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      totalRecords={totalRecords}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.tallyService}
      emptyMessage="No tally services found."
      accessorId="tallyServiceId"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      currentPage={currentPage}
      pageSize={pageSize}
      serverSidePagination={serverSidePagination}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={handleDelete}
      createButtonText="Add Tally Service"
      showHeader={true}
      showFooter={true}
      showActions={true}
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
    />
  )
}
