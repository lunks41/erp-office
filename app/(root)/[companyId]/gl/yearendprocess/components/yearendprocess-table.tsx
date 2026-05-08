"use client"

import { useCompanyStore } from "@/stores/company-store"

import React, { useMemo } from "react"
import { IGLOpeningBalance } from "@/interfaces"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { GLTransactionId, ModuleId, TableName } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { BasicTable } from "@/components/table/table-basic"

interface YearEndProcessTableProps {
  data: IGLOpeningBalance[]
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
}

export default function YearEndProcessTable({
  data,
  onRefreshAction,
  onFilterChange,
}: YearEndProcessTableProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const columns: (ColumnDef<IGLOpeningBalance> & { hidden?: boolean })[] = [
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
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }: { row: { original: IGLOpeningBalance } }) => (
        <div className="truncate text-right">{row.original.itemNo}</div>
      ),
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
      size: 250,
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

    {
      accessorKey: "glId",
      header: "GL Id",
      size: 80,
      hidden: true,
    },
    {
      accessorKey: "currencyId",
      header: "Currency Id",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "currencyName",
      header: "Currency Name",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "departemntCode",
      header: "Department Code",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "employeeCode",
      header: "Employee Code",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "productCode",
      header: "Product Code",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "portCode",
      header: "Port Code",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "vesselCode",
      header: "Vessel Code",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "bargeCode",
      header: "Barge Code",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "departmentId",
      header: "Department",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "employeeId",
      header: "Employee",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "productId",
      header: "Product",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "portId",
      header: "Port",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "vesselId",
      header: "Vessel",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "bargeId",
      header: "Barge",
      size: 90,
      hidden: true,
    },
    {
      accessorKey: "voyageId",
      header: "Voyage",
      size: 90,
      hidden: true,
    },
  ]

  // When footer is disabled, set page size to show all rows (disable pagination)
  const pageSize = data.length > 0 ? data.length : 10000

  return (
    <div className="space-y-2">
      <BasicTable<IGLOpeningBalance>
        data={data}
        columns={columns}
        isLoading={false}
        moduleId={ModuleId.gl}
        transactionId={GLTransactionId.yearendprocess as number}
        tableName={TableName.yearEndProcess}
        emptyMessage="No year end process lines found."
        onRefreshAction={onRefreshAction}
        onFilterChange={onFilterChange}
        showHeader={true}
        showFooter={false}
        pageSizeOption={pageSize}
      />
    </div>
  )
}
