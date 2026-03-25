"use client"

import React, { useEffect, useMemo, useState } from "react"
import { IGLOpeningBalance } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { ModuleId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AccountBaseTable } from "@/components/table/table-account"

interface OpeningBalanceTableProps {
  data: IGLOpeningBalance[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (row: IGLOpeningBalance) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: IGLOpeningBalance[]) => void
  isCancelled?: boolean
}

export default function OpeningBalanceTable({
  data,
  onDeleteAction,
  onBulkDeleteAction,
  onEditAction,
  onRefreshAction,
  onFilterChange,
  onDataReorder,
  isCancelled = false,
}: OpeningBalanceTableProps) {
  const [mounted, setMounted] = useState(false)
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = (itemId: string) => {
    if (onDeleteAction) {
      onDeleteAction(Number(itemId))
    }
  }

  const handleBulkDelete = (selectedIds: string[]) => {
    if (onBulkDeleteAction) {
      onBulkDeleteAction(selectedIds.map((id) => Number(id)))
    }
  }

  const handleDataReorderInternal = (newData: IGLOpeningBalance[]) => {
    if (onDataReorder) {
      onDataReorder(newData)
    }
  }

  const columns: (ColumnDef<IGLOpeningBalance> & { hidden?: boolean })[] = [
    // Visible columns first
    {
      accessorKey: "documentNo",
      header: "Document No",
      size: 100,
    },
    {
      accessorKey: "accountDate",
      header: "Account Date",
      size: 100,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => {
        const raw = row.original.accountDate
        if (!raw) return "-"
        const date =
          typeof raw === "string"
            ? (parseDate(raw) ?? new Date(raw))
            : raw instanceof Date
              ? raw
              : new Date(raw)
        if (!date || isNaN(date.getTime())) return "-"
        return format(date, dateFormat)
      },
    },
    {
      accessorKey: "glCode",
      header: "GL Code",
      size: 120,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.glCode}</div>
      ),
    },
    {
      accessorKey: "glName",
      header: "GL Name",
      size: 200,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.glName}</div>
      ),
    },
    {
      accessorKey: "isDebit",
      header: "Dr/Cr",
      size: 70,
      cell: ({ row }) => (
        <Badge variant={row.original.isDebit ? "default" : "destructive"}>
          {row.original.isDebit ? "Debit" : "Credit"}
        </Badge>
      ),
    },
    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 120,
      cell: ({ row }: CellContext<IGLOpeningBalance, unknown>) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totAmt"), amtDec)}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 130,
      cell: ({ row }: CellContext<IGLOpeningBalance, unknown>) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totLocalAmt"), locAmtDec)}
        </div>
      ),
    },
    {
      accessorKey: "currencyCode",
      header: "Currency Code",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.currencyCode}</div>
      ),
    },
    {
      accessorKey: "departemntName",
      header: "Department Name",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.departemntName}</div>
      ),
    },
    {
      accessorKey: "employeeName",
      header: "Employee Name",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.employeeName || "-"}</div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product Name",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.productName || "-"}</div>
      ),
    },
    {
      accessorKey: "portName",
      header: "Port Name",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.portName || "-"}</div>
      ),
    },
    {
      accessorKey: "vesselName",
      header: "Vessel Name",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.vesselName || "-"}</div>
      ),
    },
    {
      accessorKey: "voyageNo",
      header: "Voyage No",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.voyageNo || "-"}</div>
      ),
    },
    {
      accessorKey: "bargeName",
      header: "Barge Name",
      size: 90,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.bargeName || "-"}</div>
      ),
    },
    // All hidden columns at the end
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.itemNo}</div>
      ),
    },
    {
      accessorKey: "glId",
      header: "GL Id",
      size: 80,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.glId}</div>
      ),
    },
    {
      accessorKey: "currencyId",
      header: "Currency Id",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.currencyId}</div>
      ),
    },
    {
      accessorKey: "currencyName",
      header: "Currency Name",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.currencyName}</div>
      ),
    },
    {
      accessorKey: "departemntCode",
      header: "Department Code",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.departemntCode}</div>
      ),
    },
    {
      accessorKey: "employeeCode",
      header: "Employee Code",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.employeeCode || "-"}</div>
      ),
    },
    {
      accessorKey: "productCode",
      header: "Product Code",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.productCode || "-"}</div>
      ),
    },
    {
      accessorKey: "portCode",
      header: "Port Code",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.portCode || "-"}</div>
      ),
    },
    {
      accessorKey: "vesselCode",
      header: "Vessel Code",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.vesselCode || "-"}</div>
      ),
    },
    {
      accessorKey: "bargeCode",
      header: "Barge Code",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.bargeCode || "-"}</div>
      ),
    },
    {
      accessorKey: "departmentId",
      header: "Department",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.departmentId || "-"}</div>
      ),
    },
    {
      accessorKey: "employeeId",
      header: "Employee",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.employeeId || "-"}</div>
      ),
    },
    {
      accessorKey: "productId",
      header: "Product",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.productId || "-"}</div>
      ),
    },
    {
      accessorKey: "portId",
      header: "Port",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.portId || "-"}</div>
      ),
    },
    {
      accessorKey: "vesselId",
      header: "Vessel",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.vesselId || "-"}</div>
      ),
    },
    {
      accessorKey: "bargeId",
      header: "Barge",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.bargeId || "-"}</div>
      ),
    },
    {
      accessorKey: "voyageId",
      header: "Voyage",
      size: 90,
      hidden: true,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.voyageId || "-"}</div>
      ),
    },
  ]

  if (!mounted) return null

  return (
    <div className="space-y-2">
      <AccountBaseTable<IGLOpeningBalance>
        data={data}
        columns={columns}
        isLoading={false}
        moduleId={ModuleId.gl}
        transactionId={0}
        tableName={TableName.openingBalance}
        emptyMessage="No opening balance lines found."
        accessorId="itemNo"
        onRefreshAction={onRefreshAction}
        onFilterChange={onFilterChange}
        onEditAction={onEditAction}
        onDeleteAction={
          isCancelled
            ? undefined
            : handleDelete /* disable delete when cancelled */
        }
        onBulkDeleteAction={isCancelled ? undefined : handleBulkDelete}
        onDataReorder={handleDataReorderInternal}
        isConfirmed={isCancelled}
        showHeader={true}
        showActions={!isCancelled}
        hideEdit={isCancelled}
        hideDelete={isCancelled}
      />
    </div>
  )
}
