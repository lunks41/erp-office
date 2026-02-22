import { useCallback, useMemo, useState } from "react"
import { IGridSetting } from "@/interfaces/setting"
import { Column } from "@tanstack/react-table"
// Import jsPDF properly
import jsPDF from "jspdf"
import {
  FileSpreadsheet,
  FileText,
  Layout,
  RedoDot,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"

import { useDelete, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

// Import autoTable plugin
import "jspdf-autotable"
import * as XLSX from "xlsx"

// Extend jsPDF to include autoTable with a more specific type
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      head?: string[][]
      body: unknown[][]
      theme?: string
      margin?: { top?: number; right?: number; bottom?: number; left?: number }
      startY?: number
      styles?: Record<string, unknown>
      headStyles?: Record<string, unknown>
      bodyStyles?: Record<string, unknown>
      alternateRowStyles?: Record<string, unknown>
      columnStyles?: Record<string, unknown>
    }) => jsPDF
  }
}
// Define types for clarity
type DocumentOperationsTableHeaderProps<TData> = {
  onRefreshAction?: () => void
  onCreateAction?: () => void
  onBulkDeleteAction?: () => void
  onSaveOrder?: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  columns: Column<TData, unknown>[]
  tableName?: string // Optional table name prop
  moduleId: number
  transactionId: number
  // New props for conditional button behavior
  hasSelectedRows?: boolean
  selectedRowsCount?: number
  isConfirmed?: boolean
  data?: TData[] // Add data prop for export functionality
  hideCreate?: boolean
  onResetLayout?: () => void // Callback to reset layout in parent component
}
export function DocumentOperationsTableHeader<TData>({
  onRefreshAction,
  onBulkDeleteAction,
  onSaveOrder,
  searchQuery,
  onSearchChange,
  columns,
  tableName = "Table",
  moduleId,
  transactionId,
  hasSelectedRows = false,
  selectedRowsCount = 0,
  isConfirmed = false,
  data = [],
  onResetLayout,
}: DocumentOperationsTableHeaderProps<TData>) {
  const [columnSearch, setColumnSearch] = useState("")
  // Filter columns based on search - memoized to prevent re-renders
  const filteredColumns = useMemo(() => {
    return columns.filter((column) => {
      const headerText =
        typeof column.columnDef.header === "string"
          ? column.columnDef.header
          : column.id
      return headerText.toLowerCase().includes(columnSearch.toLowerCase())
    })
  }, [columns, columnSearch])
  // Add the save mutation for grid settings
  const saveGridSettings = usePersist<IGridSetting>("/setting/saveUserGrid")
  const resetDefaultLayout = useDelete<IGridSetting>("/setting/deleteUserGrid")
  const handleSaveLayout = useCallback(async () => {
    try {
      const grdName = tableName
      // Get column visibility and order
      const columnVisibility = Object.fromEntries(
        columns.map((col) => [col.id, col.getIsVisible()])
      )
      const columnSize = Object.fromEntries(
        columns.map((col) => [col.id, col.getSize()])
      )
      const columnOrder = columns.map((col) => col.id)
      const sorting: { id: string; desc: boolean }[] = [] // Add sorting if needed
      const gridSettings: IGridSetting = {
        moduleId,
        transactionId,
        grdName,
        grdKey: grdName,
        grdColVisible: JSON.stringify(columnVisibility),
        grdColOrder: JSON.stringify(columnOrder),
        grdColSize: JSON.stringify(columnSize),
        grdSort: JSON.stringify(sorting),
        grdString: "",
      }
      await saveGridSettings.mutateAsync(gridSettings)
    } catch (error) {
      console.error("Error saving layout:", error)
    }
  }, [moduleId, transactionId, tableName, columns, saveGridSettings])

  const handleResetDefaultLayout = useCallback(async () => {
    try {
      // Call delete mutation to remove user grid settings
      const response = await resetDefaultLayout.mutateAsync(
        `${moduleId}/${transactionId}/${tableName}`
      )

      // Only reset table if response result is 1 (success)
      if (response?.result === 1) {
        // Reset all columns to default visibility
        columns.forEach((column) => {
          column.toggleVisibility(true) // Show all columns by default
        })

        // Notify parent component to reset layout state
        if (onResetLayout) {
          onResetLayout()
        }
      }
    } catch (error) {
      console.error("Error resetting default layout:", error)
    }
  }, [
    columns,
    resetDefaultLayout,
    tableName,
    moduleId,
    transactionId,
    onResetLayout,
  ])
  const handleExportExcel = (data: TData[]) => {
    if (!data || data.length === 0) {
      return
    }
    try {
      // Create filtered data without ID fields
      const filteredData = data.map((item) => {
        const cleanedItem: Record<string, unknown> = {}
        const itemRecord = item as Record<string, unknown>
        // Copy all properties except those containing "id" (case-insensitive)
        Object.keys(itemRecord).forEach((key) => {
          if (!key.toLowerCase().includes("id")) {
            cleanedItem[key] = itemRecord[key]
          }
        })
        return cleanedItem
      })
      const worksheet = XLSX.utils.json_to_sheet(filteredData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
      XLSX.writeFile(workbook, `${tableName}.xlsx`)
    } catch (error) {
      console.error("Error exporting Excel:", error)
    }
  }
  const handleExportPdf = (data: TData[]) => {
    if (!data || data.length === 0) {
      return
    }
    try {
      const doc = new jsPDF()
      // Filter out ID columns
      const filteredData = data.map((item) => {
        const cleanedItem: Record<string, unknown> = {}
        const itemRecord = item as Record<string, unknown>
        // Copy all properties except those containing "id" (case-insensitive)
        Object.keys(itemRecord).forEach((key) => {
          if (!key.toLowerCase().includes("id")) {
            cleanedItem[key] = itemRecord[key]
          }
        })
        return cleanedItem
      })
      // Extract non-ID headers
      const headers =
        filteredData.length > 0 ? Object.keys(filteredData[0]) : []
      if (headers.length === 0) {
        return
      }
      // Create the table body and convert all values to strings
      const body = filteredData.map((row) =>
        headers.map((header) => {
          const value = (row as Record<string, unknown>)[header]
          return value !== null && value !== undefined ? String(value) : ""
        })
      )
      // Use autoTable as a method on the jsPDF instance
      doc.autoTable({
        head: [headers],
        body: body,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 20, right: 10, bottom: 20, left: 10 },
      })
      doc.save(`${tableName}.pdf`)
    } catch (error) {
      console.error("Error exporting PDF:", error)
    }
  }
  return (
    <>
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Bulk Delete Button - only show when items are selected */}
            {hasSelectedRows && selectedRowsCount > 0 && (
              <Button
                variant="destructive"
                onClick={onBulkDeleteAction}
                disabled={isConfirmed}
                title={
                  isConfirmed
                    ? "Cannot delete when confirmed"
                    : `Delete ${selectedRowsCount} selected item${selectedRowsCount !== 1 ? "s" : ""}`
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedRowsCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={onRefreshAction}
              disabled={isConfirmed}
              title={
                isConfirmed ? "Cannot refresh when confirmed" : "Refresh data"
              }
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {/* Save Order Button - only show when order has changed */}
            {onSaveOrder && (
              <Button
                variant="default"
                size="sm"
                onClick={onSaveOrder}
                disabled={isConfirmed}
                title={
                  isConfirmed
                    ? "Cannot save when confirmed"
                    : "Save document order"
                }
              >
                <Save className="mr-2 h-4 w-4" />
                Save Order
              </Button>
            )}
            {/* Excel Export Button */}
            <Button
              variant="outline"
              title="Export to Excel"
              onClick={() => handleExportExcel(data)}
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Excel
            </Button>
            {/* PDF Export Button */}
            <Button
              variant="outline"
              title="Export to PDF"
              onClick={() => handleExportPdf(data)}
            >
              <FileText className="h-4 w-4 text-red-600" />
              Pdf
            </Button>
            {/* Layout Change */}
            <Button
              variant="outline"
              title="Save Layout"
              onClick={handleSaveLayout}
            >
              <Layout className="h-4 w-4" />
              Save Layout
            </Button>

            {/* Reset Default Layout Change */}
            <Button
              variant="outline"
              title="Reset Layout"
              onClick={handleResetDefaultLayout}
            >
              <RedoDot className="h-4 w-4" />
              Reset Layout
            </Button>
          </div>
          {/* Search Input */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="max-w-[300px]"
            />
            {/* Column Visibility Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  title="Column visibility settings"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="p-2">
                  <Input
                    placeholder="Search columns..."
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {filteredColumns.map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    onSelect={(e) => {
                      e.preventDefault()
                      column.toggleVisibility(!column.getIsVisible())
                    }}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(value === true)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  )
}
