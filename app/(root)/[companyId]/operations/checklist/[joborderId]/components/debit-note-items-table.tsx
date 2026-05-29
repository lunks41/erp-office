"use client"

import { useCallback, useMemo } from "react"
import { IDebitNoteItem } from "@/interfaces/checklist"
import { ColumnDef } from "@tanstack/react-table"
import { Printer } from "lucide-react"

import { TableName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DebitNoteBaseTable } from "@/components/table/table-debitnote"

interface DebitNoteItemsTableProps {
  data: IDebitNoteItem[]
  isLoading?: boolean
  onRefreshAction?: () => void
  onFilterChange?: () => void
  onSelect?: (item: IDebitNoteItem | null) => void
  onCreateAction?: () => void
  onEditAction?: (item: IDebitNoteItem) => void
  onDeleteAction?: (item: IDebitNoteItem) => void
  onBulkDeleteAction?: (items: IDebitNoteItem[]) => void
  onPrintAction?: (item: IDebitNoteItem) => void
  onDataReorder?: (newData: IDebitNoteItem[]) => void
  moduleId?: number
  transactionId?: number
  isConfirmed?: boolean
}

export function DebitNoteItemsTable({
  data,
  isLoading = false,
  onRefreshAction,
  onFilterChange,
  onSelect,
  onCreateAction,
  onEditAction,
  onDeleteAction,
  onBulkDeleteAction,
  onPrintAction,
  onDataReorder,
  moduleId,
  transactionId,
  isConfirmed = false,
}: DebitNoteItemsTableProps) {
  // Define columns for the debit note items table
  const columns: ColumnDef<IDebitNoteItem>[] = useMemo(
    () => [
      {
        accessorKey: "taskName",
        header: "Task Name",
        cell: ({ row }) => (
          <div className="max-w-xs truncate">
            {row.getValue("taskName") || "-"}
          </div>
        ),
        size: 150,
        minSize: 120,
      },
      {
        accessorKey: "debitNoteNo",
        header: "Debit Note No.",
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue("debitNoteNo") || "-"}
          </div>
        ),
        size: 160,
        minSize: 120,
      },
      {
        accessorKey: "itemNo",
        header: "Item No.",
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("itemNo") || "-"}</div>
        ),
        size: 80,
        minSize: 60,
      },
      {
        accessorKey: "updatedItemNo",
        header: "Updated Item No.",
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("updatedItemNo") || "-"}
          </div>
        ),
        size: 80,
        minSize: 60,
      },
      {
        accessorKey: "updatedDebitNoteNo",
        header: "Updated Debit Note No.",
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("updatedDebitNoteNo") || "-"}
          </div>
        ),
        size: 160,
        minSize: 120,
      },
      {
        accessorKey: "totAmt",
        header: "Total Amount",
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("totAmt") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "gstAmt",
        header: "VAT Amount",
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("gstAmt") || "-"}</div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        accessorKey: "totAmtAftGst",
        header: "Total Amount After VAT",
        cell: ({ row }) => (
          <div className="text-center">
            {row.getValue("totAmtAftGst") || "-"}
          </div>
        ),
        size: 100,
        minSize: 80,
      },
      {
        id: "print",
        header: "Print",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original
          const canPrint = item.debitNoteId > 0 && Boolean(item.debitNoteNo)
          return (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={!canPrint}
                onClick={(e) => {
                  e.stopPropagation()
                  onPrintAction?.(item)
                }}
                title={
                  canPrint
                    ? `Print ${item.debitNoteNo}`
                    : "Debit note not available"
                }
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          )
        },
        size: 72,
        minSize: 64,
      },
    ],
    [onPrintAction]
  )

  // Callback handlers for the table
  const handleRefresh = useCallback(() => {
    onRefreshAction?.()
  }, [onRefreshAction])

  const handleFilterChange = useCallback(() => {
    onFilterChange?.()
  }, [onFilterChange])

  const handleSelect = useCallback(
    (item: IDebitNoteItem | null) => {
      onSelect?.(item)
    },
    [onSelect]
  )

  const handleCreate = useCallback(() => {
    onCreateAction?.()
  }, [onCreateAction])

  const handleEdit = useCallback(
    (item: IDebitNoteItem) => {
      onEditAction?.(item)
    },
    [onEditAction]
  )

  const handleDelete = useCallback(
    (itemId: string) => {
      const item = data.find((d) => d.debitNoteId.toString() === itemId)
      if (item) {
        onDeleteAction?.(item)
      }
    },
    [onDeleteAction, data]
  )

  const handleBulkDelete = useCallback(
    (selectedIds: string[]) => {
      const items = data.filter((d) =>
        selectedIds.includes(d.debitNoteId.toString())
      )
      onBulkDeleteAction?.(items)
    },
    [onBulkDeleteAction, data]
  )

  const handleDataReorder = useCallback(
    (newData: IDebitNoteItem[]) => {
      // Update itemNo to reflect the new order (1, 2, 3, 4...)
      // Keep actualItemNo unchanged to preserve original order
      const reorderedData = newData.map((item, index) => {
        const newItemNo = index + 1001
        const newDebitNoteNo = item.debitNoteNo.replace(
          /\/\d+$/,
          `/${newItemNo}`
        )

        return {
          ...item,
          updatedItemNo: newItemNo, // Update itemNo to new sequential order
          updatedDebitNoteNo: newDebitNoteNo, // Update debit note number with new item number
          // actualItemNo remains unchanged
        }
      })

      onDataReorder?.(reorderedData)
    },
    [onDataReorder]
  )

  return (
    <DebitNoteBaseTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      moduleId={moduleId}
      transactionId={transactionId}
      tableName={TableName.debitNote}
      emptyMessage="No debit note data available"
      accessorId="debitNoteId"
      onRefreshAction={handleRefresh}
      onFilterChange={handleFilterChange}
      onSelect={handleSelect}
      onCreateAction={handleCreate}
      onEditAction={handleEdit}
      onDeleteAction={handleDelete}
      onBulkDeleteAction={handleBulkDelete}
      onDataReorder={handleDataReorder}
      isConfirmed={isConfirmed}
      showHeader={false}
      showActions={true}
      hideCheckbox={true}
      hideView={true}
      hideEdit={true}
      hideDelete={true}
      hideCreate={true}
      disableOnDebitNoteExists={false}
    />
  )
}
