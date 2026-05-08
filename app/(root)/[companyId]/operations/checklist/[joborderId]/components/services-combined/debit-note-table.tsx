"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useMemo } from "react"
import { IDebitNoteDt } from "@/interfaces/checklist"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { formatNumber } from "@/lib/format-utils"
import { TableName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DebitNoteBaseTable } from "@/components/table/table-debitnote"

interface DebitNoteTableProps {
  data: IDebitNoteDt[]
  isLoading?: boolean
  onSelect?: (debitNote: IDebitNoteDt | null) => void
  onDeleteAction?: (debitNoteId: string) => void
  onBulkDeleteAction?: (selectedIds: string[]) => void
  onEditAction?: (debitNote: IDebitNoteDt) => void
  onCloneAction?: (debitNote: IDebitNoteDt) => void
  onCreateAction?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: IDebitNoteDt[]) => void
  moduleId?: number
  transactionId?: number
  isConfirmed?: boolean
}

export function DebitNoteTable({
  data,
  isLoading = false,
  onSelect,
  onDeleteAction,
  onBulkDeleteAction,
  onEditAction,
  onCloneAction,
  onCreateAction,
  onRefreshAction,
  onFilterChange,
  onDataReorder,
  moduleId,
  transactionId,
  isConfirmed,
}: DebitNoteTableProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2

  // Define columns for the debit note table
  const columns: ColumnDef<IDebitNoteDt>[] = useMemo(
    () => [
      {
        accessorKey: "itemNo",
        header: ({ column }) => (
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <span>Item No</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }: { row: { original: IDebitNoteDt } }) => (
          <div className="text-right font-medium">
            {row.original.itemNo || "-"}
          </div>
        ),
        size: 30,
      },
      {
        accessorKey: "refItemNo",
        header: "Ref Item No",
        cell: ({ row }: { row: { original: IDebitNoteDt } }) => (
          <div className="text-right font-medium">
            {row.original.refItemNo || "-"}
          </div>
        ),
        size: 30,
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 500,
      },
      {
        accessorKey: "qty",
        header: "Qty",
        size: 60,
        cell: ({ row }: { row: { original: IDebitNoteDt } }) => (
          <div className="truncate text-right">{row.original.qty}</div>
        ),
      },
      {
        accessorKey: "unitPrice",
        header: "Unit Price",
        size: 100,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.getValue("unitPrice"), amtDec)}
          </div>
        ),
      } as ColumnDef<IDebitNoteDt>,
      {
        accessorKey: "totAmt",
        header: "Amount",
        size: 100,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.getValue("totAmt"), amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "gstPercentage",
        header: "VAT %",
        size: 50,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.getValue("gstPercentage"), 2)}
          </div>
        ),
      },
      {
        accessorKey: "gstAmt",
        header: "VAT",
        size: 100,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.getValue("gstAmt"), amtDec)}
          </div>
        ),
      },
      {
        accessorKey: "totAmtAftGst",
        header: "Total",
        size: 100,
        cell: ({ row }) => (
          <div className="truncate text-right">
            {formatNumber(row.getValue("totAmtAftGst"), amtDec)}
          </div>
        ),
      },
    ],
    [amtDec] // Include amtDec in dependencies
  )

  return (
    <DebitNoteBaseTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.debitNote}
      emptyMessage="No debit note details found."
      accessorId="itemNo"
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      onSelect={onSelect}
      onCreateAction={onCreateAction}
      onEditAction={onEditAction}
      onDeleteAction={onDeleteAction}
      onCloneAction={onCloneAction}
      onBulkDeleteAction={onBulkDeleteAction}
      onDataReorder={onDataReorder}
      isConfirmed={isConfirmed}
      showHeader={true}
      showActions={true}
      hideView={false}
      hideEdit={isConfirmed}
      hideDelete={isConfirmed}
      hideCreate={true}
      hideCheckbox={isConfirmed}
      disableOnDebitNoteExists={false}
    />
  )
}

export default DebitNoteTable
