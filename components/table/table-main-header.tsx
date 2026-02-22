import { useState } from "react"
import { IGridSetting } from "@/interfaces/setting"
import { Column } from "@tanstack/react-table"
// Import jsPDF properly
import jsPDF from "jspdf"

// Import autoTable plugin
import "jspdf-autotable"
import {
  FileSpreadsheet,
  FileText,
  Layout,
  Plus,
  RedoDot,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"
import * as XLSX from "xlsx"

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
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"

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
type MainTableHeaderProps<TData> = {
  onRefreshAction?: () => void
  onCreateAction?: () => void
  onFilterToggle?: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  columns: Column<TData, unknown>[]
  isFilterOpen?: boolean
  data?: TData[] // Add data prop
  tableName?: string // Optional table name prop
  hideCreateButton?: boolean // Add hideCreateButton prop
  createButtonText?: string // Custom text for create button
  moduleId: number
  transactionId: number
  onResetLayout?: () => void // Callback to reset layout in parent component
  isConfirmed?: boolean // Whether the record is confirmed (readonly mode)
}
export function MainTableHeader<TData>({
  onRefreshAction,
  onCreateAction,
  searchQuery,
  onSearchChange,
  columns,
  data = [], // Default to empty array
  tableName = "Table",
  hideCreateButton = false, // Default to false
  createButtonText = "Create", // Default button text
  moduleId,
  transactionId,
  onResetLayout,
  isConfirmed = false, // Default to false
}: MainTableHeaderProps<TData>) {
  const [columnSearch, setColumnSearch] = useState("")
  const [isSaveLayoutOpen, setIsSaveLayoutOpen] = useState(false)
  // Filter columns based on search
  const filteredColumns = columns.filter((column) => {
    const headerText =
      typeof column.columnDef.header === "string"
        ? column.columnDef.header
        : column.id
    return headerText.toLowerCase().includes(columnSearch.toLowerCase())
  })
  // Add the save mutation for grid settings
  const saveGridSettings = usePersist<IGridSetting>("/setting/saveUserGrid")
  const resetDefaultLayout = useDelete<IGridSetting>("/setting/deleteUserGrid")
  // Handle save layout confirmation
  const handleSaveLayoutConfirm = async () => {
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
  }

  const handleResetDefaultLayout = async () => {
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
  }
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
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onCreateAction && !hideCreateButton && (
          <Button
            type="button"
            disabled={isConfirmed}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCreateAction()
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {createButtonText}
          </Button>
        )}
        {onRefreshAction && (
          <Button variant="outline" size="icon" onClick={onRefreshAction}>
            <RefreshCw className="h-4 w-4" />
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
          onClick={() => setIsSaveLayoutOpen(true)}
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
            <Button variant="outline" size="icon">
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
      {/* Save Layout Confirmation Dialog */}
      <SaveConfirmation
        title="Save Layout"
        itemName={`${tableName} layout`}
        open={isSaveLayoutOpen}
        onOpenChange={setIsSaveLayoutOpen}
        onConfirm={handleSaveLayoutConfirm}
        isSaving={saveGridSettings.isPending}
        operationType="save"
      />
    </div>
  )
}
