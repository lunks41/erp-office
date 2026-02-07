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
  SlidersHorizontal,
} from "lucide-react"

import { useDelete, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

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
type PurchaseTableHeaderProps<TData> = {
  onRefreshAction?: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  columns: Column<TData, unknown>[]
  tableName?: string // Optional table name prop
  moduleId: number
  transactionId: number
  isConfirmed?: boolean
  data?: TData[] // Add data prop for export functionality
  onResetLayout?: () => void // Callback to reset layout in parent component
}
export function PurchaseTableHeader<TData>({
  onRefreshAction,
  searchQuery,
  onSearchChange,
  columns,
  tableName = "Table",
  moduleId,
  transactionId,
  isConfirmed = false,
  data = [],
  onResetLayout,
}: PurchaseTableHeaderProps<TData>) {
  const [columnSearch, setColumnSearch] = useState("")
  const [activeButton, setActiveButton] = useState<"show" | "hide" | null>(null)
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
  const handleShowAll = useCallback(() => {
    columns.forEach((column) => column.toggleVisibility(true))
    setActiveButton("show")
  }, [columns])
  const handleHideAll = useCallback(() => {
    columns.forEach((column) => column.toggleVisibility(false))
    setActiveButton("hide")
  }, [columns])
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
                <div className="flex gap-2 p-2">
                  <Button
                    variant={activeButton === "show" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={handleShowAll}
                    title="Show all columns"
                  >
                    Show All
                  </Button>
                  <Button
                    variant={activeButton === "hide" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={handleHideAll}
                    title="Hide all columns"
                  >
                    Hide All
                  </Button>
                </div>
                <DropdownMenuItem className="my-1 h-px p-0" disabled />
                {filteredColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                    onSelect={(e) => {
                      e.preventDefault()
                    }}
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  )
}
