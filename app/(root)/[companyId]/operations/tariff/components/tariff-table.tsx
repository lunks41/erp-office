"use client"

import { useMemo } from "react"
import { ITariff, ITariffFilter } from "@/interfaces/tariff"
import { useCompanyStore } from "@/stores/company-store"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MainTable } from "@/components/table/table-main"

import {
  TariffInlineBooleanCell,
  TariffInlineNumberCell,
  TariffInlineTextCell,
} from "./tariff-inline-detail-cells"
import {
  groupTariffRows,
  ITariffTableRow,
  tariffTableRowToTariff,
} from "./tariff-table-utils"

interface TariffTableProps {
  data: ITariff[]
  isLoading?: boolean
  onDeleteAction?: (tariff: ITariff) => void
  onEditAction?: (tariff: ITariff) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: ITariffFilter) => void
  initialSearchValue?: string
  moduleId?: number
  transactionId?: number
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
  canCreate?: boolean
  onSelect?: (tariff: ITariff | null) => void
  onCreateAction?: () => void
  clearRowSelectionSignal?: number
  onBulkDeleteRows?: (tariffs: ITariff[]) => void
  onBulkCloneRows?: (tariffs: ITariff[]) => void
}

export function TariffTable({
  data,
  isLoading = false,
  onDeleteAction,
  onEditAction,
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  moduleId,
  transactionId,
  canEdit = true,
  canDelete = true,
  canView = true,
  canCreate = true,
  onSelect,
  onCreateAction,
  clearRowSelectionSignal,
  onBulkDeleteRows,
  onBulkCloneRows,
}: TariffTableProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const groupedData = useMemo(() => groupTariffRows(data), [data])

  const columns: ColumnDef<ITariffTableRow>[] = useMemo(
    () => [
      {
        accessorKey: "taskName",
        header: "Task",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("taskName") || "-"}</div>
        ),
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: "portName",
        header: "Port",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("portName") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "chargeName",
        header: "Charge Name",
        cell: ({ row }) => (
          <div className="truncate font-medium">
            {row.getValue("chargeName") || "-"}
          </div>
        ),
        size: 220,
        minSize: 160,
      },
      {
        accessorKey: "visaName",
        header: "Visa Type",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("visaName") || "-"}</div>
        ),
        size: 140,
        minSize: 110,
      },
      {
        accessorKey: "uomName",
        header: "UOM",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("uomName") || "-"}</div>
        ),
        size: 90,
        minSize: 70,
      },
      {
        accessorKey: "fromLocationName",
        header: "From Location",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("fromLocationName") || "-"}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "toLocationName",
        header: "To Location",
        cell: ({ row }) => (
          <div className="truncate">
            {row.getValue("toLocationName") || "-"}
          </div>
        ),
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "isViceVersa",
        header: "Vice Versa",
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.getValue("isViceVersa") ? (
              <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
            ) : (
              <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
            )}
          </div>
        ),
        size: 90,
        minSize: 80,
      },
      {
        id: "lineDisplayRate",
        header: "Display Rate",
        cell: ({ row }) => (
          <TariffInlineNumberCell
            lines={row.original.detailLines}
            getValue={(line) => line.displayRate}
            decimals={amtDec}
          />
        ),
        size: 95,
        minSize: 85,
      },
      {
        id: "lineBasicRate",
        header: "Basic Rate",
        cell: ({ row }) => (
          <TariffInlineNumberCell
            lines={row.original.detailLines}
            getValue={(line) => line.basicRate}
            decimals={amtDec}
          />
        ),
        size: 95,
        minSize: 85,
      },
      {
        id: "lineMinUnit",
        header: "Min Unit",
        cell: ({ row }) => (
          <TariffInlineNumberCell
            lines={row.original.detailLines}
            getValue={(line) => line.minUnit}
            decimals={amtDec}
          />
        ),
        size: 85,
        minSize: 75,
      },
      {
        id: "lineMaxUnit",
        header: "Max Unit",
        cell: ({ row }) => (
          <TariffInlineNumberCell
            lines={row.original.detailLines}
            getValue={(line) => line.maxUnit}
            decimals={amtDec}
          />
        ),
        size: 85,
        minSize: 75,
      },
      {
        id: "lineIsAdditional",
        header: "Add.?",
        cell: ({ row }) => (
          <TariffInlineBooleanCell
            lines={row.original.detailLines}
            getValue={(line) => line.isAdditional}
          />
        ),
        size: 70,
        minSize: 60,
      },
      {
        id: "lineAdditionalUnit",
        header: "Add. Unit",
        cell: ({ row }) => (
          <TariffInlineNumberCell
            lines={row.original.detailLines}
            getValue={(line) => line.additionalUnit}
            decimals={amtDec}
          />
        ),
        size: 85,
        minSize: 75,
      },
      {
        id: "lineAdditionalRate",
        header: "Add. Rate",
        cell: ({ row }) => (
          <TariffInlineNumberCell
            lines={row.original.detailLines}
            getValue={(line) => line.additionalRate}
            decimals={amtDec}
          />
        ),
        size: 90,
        minSize: 80,
      },
      {
        id: "lineDescription",
        header: "Line Description",
        cell: ({ row }) => (
          <TariffInlineTextCell
            lines={row.original.detailLines}
            format={(line) => line.lineDescription?.trim() || "-"}
          />
        ),
        size: 160,
        minSize: 120,
      },
      {
        accessorKey: "isPrepayment",
        header: "Prepay?",
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.getValue("isPrepayment") ? (
              <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
            ) : (
              <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
            )}
          </div>
        ),
        size: 80,
        minSize: 70,
      },
      {
        accessorKey: "prepaymentPercentage",
        header: "Prepayment %",
        cell: ({ row }) => (
          <div className="truncate text-right tabular-nums">
            {row.original.prepaymentPercentage ?? 0}
          </div>
        ),
        size: 90,
        minSize: 80,
      },
      {
        accessorKey: "createBy",
        header: "Created By",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("createBy") || "-"}</div>
        ),
        size: 120,
      },
      {
        accessorKey: "createDate",
        header: "Created Date",
        cell: ({ row }) => {
          const date = row.original.createDate
            ? new Date(row.original.createDate)
            : null
          return (
            <div className="truncate">
              {date ? format(date, datetimeFormat) : "-"}
            </div>
          )
        },
        size: 160,
      },
      {
        accessorKey: "editBy",
        header: "Edited By",
        cell: ({ row }) => (
          <div className="truncate">{row.getValue("editBy") || "-"}</div>
        ),
        size: 120,
      },
      {
        accessorKey: "editDate",
        header: "Edited Date",
        cell: ({ row }) => {
          const date = row.original.editDate
            ? new Date(row.original.editDate)
            : null
          return (
            <div className="truncate">
              {date ? format(date, datetimeFormat) : "-"}
            </div>
          )
        },
        size: 160,
      },
      {
        accessorKey: "editVersion",
        header: "Version",
        cell: ({ row }) => {
          const version = row.getValue("editVersion") as
            | number
            | null
            | undefined
          return (
            <Badge
              variant={version ? "destructive" : "outline"}
              className="font-semibold"
            >
              {version ?? 0}
            </Badge>
          )
        },
        size: 75,
        minSize: 65,
      },
    ],
    [amtDec, datetimeFormat]
  )

  const handleDelete = (tariffId: string) => {
    if (!onDeleteAction) return
    const row = groupedData.find((t) => t.tariffId?.toString() === tariffId)
    if (row) onDeleteAction(tariffTableRowToTariff(row))
  }

  return (
    <MainTable
      data={groupedData}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.tariff}
      emptyMessage="No tariffs found."
      accessorId="tariffId"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      initialSearchValue={initialSearchValue}
      pageSize={100}
      onSelect={
        onSelect
          ? (row) => onSelect(row ? tariffTableRowToTariff(row) : null)
          : undefined
      }
      onCreateAction={onCreateAction}
      onEditAction={
        onEditAction
          ? (row) => onEditAction(tariffTableRowToTariff(row))
          : undefined
      }
      onDeleteAction={handleDelete}
      showHeader={true}
      showFooter={true}
      showActions={true}
      showRowSelection={Boolean(onBulkDeleteRows || onBulkCloneRows)}
      canEdit={canEdit}
      canDelete={canDelete}
      canView={canView}
      canCreate={canCreate}
      clearRowSelectionSignal={clearRowSelectionSignal}
      onBulkDeleteRows={
        onBulkDeleteRows
          ? (rows) => onBulkDeleteRows(rows.map(tariffTableRowToTariff))
          : undefined
      }
      onBulkCloneRows={
        onBulkCloneRows
          ? (rows) => onBulkCloneRows(rows.map(tariffTableRowToTariff))
          : undefined
      }
    />
  )
}
