"use client"

import { useCallback, useMemo } from "react"
import { IPurchaseData } from "@/interfaces"
import { ColumnDef } from "@tanstack/react-table"
import { Paperclip } from "lucide-react"

import { TableName } from "@/lib/utils"
import { PurchaseBaseTable } from "@/components/table/table-purchase"

interface PurchaseTableProps {
  data: IPurchaseData[]
  isLoading?: boolean
  onSelect?: (debitNote: IPurchaseData | null) => void
  onDocumentNoClick?: (row: IPurchaseData) => void
  onPreviewClick?: (row: IPurchaseData) => void
  onDataReorder?: (newData: IPurchaseData[]) => void
  onBulkSelectionChange?: (selectedIds: string[]) => void
  isConfirmed?: boolean
  initialSelectedIds?: string[]
  selectedIds?: string[]
}

// Table component (existing)
export function PurchaseTable({
  data,
  isLoading = false,
  onSelect: _onSelect,
  onDocumentNoClick,
  onPreviewClick,
  onDataReorder,
  onBulkSelectionChange,
  isConfirmed,
  initialSelectedIds = [],
  selectedIds: _selectedIds = [],
}: PurchaseTableProps) {
  // Add uniqueId field combining documentId and itemNo for proper identification
  const dataWithUniqueId = useMemo(() => {
    const countByDocumentId = new Map<string, number>()
    for (const item of data) {
      const key = String(item.documentId || "").trim()
      if (!key) continue
      countByDocumentId.set(key, (countByDocumentId.get(key) ?? 0) + 1)
    }

    return data.map((item) => {
      const uniqueId = `${item.documentId}_${item.itemNo}`
      const documentKey = String(item.documentId || "").trim()
      const previewPinCount = documentKey
        ? (countByDocumentId.get(documentKey) ?? 1)
        : 1

      return {
        ...item,
        uniqueId,
        previewPinCount,
      }
    })
  }, [data])
  // Define columns for the purchase table
  const columns: ColumnDef<
    IPurchaseData & { uniqueId: string; previewPinCount: number }
  >[] = useMemo(
    () => [
      {
        accessorKey: "uniqueId",
        header: "ID",
        cell: ({ row }) => {
          const uniqueId = row.getValue("uniqueId") as string
          return <span className="font-mono text-xs">{uniqueId}</span>
        },
        size: 100,
        minSize: 80,
        hidden: true,
      },
      {
        accessorKey: "isAllocated",
        header: "Status",
        cell: ({ row }) => {
          const isAllocated = row.getValue("isAllocated") as boolean

          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                isAllocated
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {isAllocated ? "Allocated" : "Unallocated"}
            </span>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "suppInvoiceNo",
        header: "Supplier Invoice No",
        size: 180,
        minSize: 150,
        enableColumnFilter: true,
      },
      {
        accessorKey: "documentNo",
        header: "Document No",
        size: 150,
        minSize: 120,
        enableColumnFilter: true,
        cell: ({ row }) => {
          const rowData = row.original

          return (
            <button
              type="button"
              className="text-left font-medium text-muted-foreground hover:underline"
              onClick={() => onDocumentNoClick?.(rowData)}
            >
              {rowData.documentNo}
            </button>
          )
        },
      },

      {
        accessorKey: "accountDate",
        header: "Account Date",
        cell: ({ row }) => {
          const date = row.getValue("accountDate") as Date | string
          return date ? new Date(date).toLocaleDateString() : "-"
        },
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
        accessorKey: "totAmt",
        header: "Amount",
        meta: { align: "right" },
        cell: ({ row }) => {
          const value = row.getValue("totAmt") as number
          return (
            <div className="text-right font-mono">
              {value?.toFixed(2) || "0.00"}
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "gstAmt",
        header: "VAT Amount",
        meta: { align: "right" },
        cell: ({ row }) => {
          const value = row.getValue("gstAmt") as number
          return (
            <div className="text-right font-mono">
              {value?.toFixed(2) || "0.00"}
            </div>
          )
        },
        size: 120,
        minSize: 100,
      },
      {
        accessorKey: "totAmtAftGst",
        header: "Total Amount",
        meta: { align: "right" },
        cell: ({ row }) => {
          const value = row.getValue("totAmtAftGst") as number
          return (
            <div className="text-right font-mono">
              {value?.toFixed(2) || "0.00"}
            </div>
          )
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
        id: "previewPins",
        header: "Preview",
        size: 90,
        minSize: 80,
        cell: ({ row }) => {
          const rowData = row.original
          const pinCount = Math.max(1, Number(rowData.previewPinCount || 1))
          const visiblePins = Math.min(pinCount, 3)

          return (
            <button
              type="button"
              className="flex items-center gap-0.5 text-green-600 hover:opacity-80"
              onClick={() => onPreviewClick?.(rowData)}
              title={`Open preview (${pinCount} linked item${pinCount > 1 ? "s" : ""})`}
            >
              {Array.from({ length: visiblePins }).map((_, idx) => (
                <Paperclip
                  key={`${rowData.uniqueId}-pin-${idx}`}
                  className="h-3.5 w-3.5"
                />
              ))}
              {pinCount > 3 && (
                <span className="text-[10px]">+{pinCount - 3}</span>
              )}
            </button>
          )
        },
      },
      {
        accessorKey: "itemNo",
        header: "Item No",
        meta: { align: "right" },
        size: 80,
        minSize: 60,
        cell: ({ row }) => {
          const itemNo = row.getValue("itemNo")
          return <div className="text-right font-mono">{String(itemNo)}</div>
        },
      },
      {
        accessorKey: "seqNo",
        header: "Seq No",
        size: 100,
        minSize: 80,
        hidden: true,
        cell: ({ row }) => {
          const seqNo = row.getValue("seqNo")
          return <span className="font-mono">{String(seqNo)}</span>
        },
      },
      {
        accessorKey: "jobOrderId",
        header: "Job Order ID",
        size: 100,
        minSize: 80,
        hidden: true,
        cell: ({ row }) => {
          const jobOrderId = row.getValue("jobOrderId")
          return <span className="font-mono">{String(jobOrderId)}</span>
        },
      },
      {
        accessorKey: "taskId",
        header: "Task ID",
        size: 100,
        minSize: 80,
        hidden: true,
        cell: ({ row }) => {
          const taskId = row.getValue("taskId")
          return <span className="font-mono">{String(taskId)}</span>
        },
      },
      {
        accessorKey: "serviceItemNo",
        header: "Service Item No",
        size: 100,
        minSize: 80,
        hidden: true,
        cell: ({ row }) => {
          const serviceItemNo = row.getValue("serviceItemNo")
          return <span className="font-mono">{String(serviceItemNo)}</span>
        },
      },
    ],
    [onDocumentNoClick, onPreviewClick]
  )

  // Stable callback functions to prevent infinite re-renders
  const handleRefresh = useCallback(() => {
    // No-op for purchase table
  }, [])

  const handleFilterChange = useCallback(() => {
    // No-op for purchase table - this prevents the useEffect from triggering
  }, [])

  const handleDataReorder = useCallback(() => {
    // No-op for purchase table
  }, [])

  // Prevent onBulkSelectionChange from being called unnecessarily
  const handleBulkSelectionChange = useCallback(
    (selectedIds: string[]) => {
      // Always call the parent's handler if it exists
      onBulkSelectionChange?.(selectedIds)
    },
    [onBulkSelectionChange]
  )

  // Filter out columns with hidden: true
  const visibleColumns = useMemo(
    () => columns.filter((col) => !(col as { hidden?: boolean }).hidden),
    [columns]
  )

  return (
    <PurchaseBaseTable
      data={dataWithUniqueId}
      columns={visibleColumns}
      isLoading={isLoading}
      moduleId={0}
      transactionId={0}
      tableName={TableName.debitNote}
      emptyMessage="No purchase details found."
      accessorId="uniqueId"
      onRefreshAction={handleRefresh}
      onFilterChange={handleFilterChange}
      onBulkSelectionChange={handleBulkSelectionChange}
      onDataReorder={onDataReorder || handleDataReorder}
      isConfirmed={isConfirmed}
      showHeader={false}
      showActions={false}
      hideCheckbox={false}
      disableOnPurchaseExists={false}
      initialSelectedIds={initialSelectedIds}
    />
  )
}
