import { useCallback, useMemo, useState } from "react"
import { IJobOrderHd } from "@/interfaces/checklist"
import { IGridSetting } from "@/interfaces/setting"
import { Column } from "@tanstack/react-table"
import {
  Building2,
  Forward,
  Layout,
  Plus,
  Receipt,
  RedoDot,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  UploadIcon,
} from "lucide-react"

import { useDelete, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { DebitNoteConfirmation } from "@/components/confirmation/debitnote-confirmation"
import { ServicelistDocuments } from "@/app/(root)/[companyId]/operations/checklist/[joborderId]/components/services-combined/service-documents"

// Define types for clarity
type TaskTableHeaderProps<TData> = {
  onRefreshAction?: () => void
  onCreateAction?: () => void
  onCombinedService?: () => void
  onCloneTask?: () => void
  onBulkDeleteAction?: () => void
  onDebitNoteAction?: (debitNoteNo?: string, selectedIds?: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  columns: Column<TData, unknown>[]
  tableName?: string // Optional table name prop
  moduleId: number
  transactionId: number
  // New props for conditional button behavior
  hasSelectedRows?: boolean
  selectedRowsCount?: number
  hasValidDebitNoteIds?: boolean
  hasAnyDebitNoteId?: boolean
  isConfirmed?: boolean
  selectedRowIds?: string[]
  // Props for column visibility control
  hideColumnsOnDebitNote?: string[] // Array of column IDs to hide when debit note exists
  hasDebitNoteInSelection?: boolean // Whether any selected row has debit note
  onResetLayout?: () => void // Callback to reset layout in parent component
  // Props for document upload
  jobData?: IJobOrderHd | null // Job order data for document upload
  transactionIdForDocuments?: number // Transaction ID for document upload
  // Permission props
  canDebitNote?: boolean
}
export function TaskTableHeader<TData>({
  onRefreshAction,
  onCreateAction,
  onCombinedService,
  onCloneTask,
  onBulkDeleteAction,
  onDebitNoteAction,
  searchQuery,
  onSearchChange,
  columns,
  tableName = "Table",
  moduleId,
  transactionId,
  hasSelectedRows = false,
  selectedRowsCount = 0,
  hasValidDebitNoteIds = false,
  hasAnyDebitNoteId = false,
  isConfirmed = false,
  selectedRowIds = [],
  hideColumnsOnDebitNote = [],
  hasDebitNoteInSelection = false,
  onResetLayout,
  jobData,
  transactionIdForDocuments,
  canDebitNote = true,
}: TaskTableHeaderProps<TData>) {
  const [columnSearch, setColumnSearch] = useState("")
  const [debitNoteNo, setDebitNoteNo] = useState("")
  const [showDebitNoteInput, setShowDebitNoteInput] = useState(false)
  // State for debit note confirmation dialog
  const [showDebitNoteConfirmation, setShowDebitNoteConfirmation] =
    useState(false)
  // State for document upload dialog
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)

  // Filter columns based on search and debit note status - memoized to prevent re-renders
  const filteredColumns = useMemo(() => {
    return columns.filter((column) => {
      // First check if column should be hidden due to debit note
      if (
        hasDebitNoteInSelection &&
        hideColumnsOnDebitNote.includes(column.id)
      ) {
        return false
      }
      // Then filter by search
      const headerText =
        typeof column.columnDef.header === "string"
          ? column.columnDef.header
          : column.id
      return headerText.toLowerCase().includes(columnSearch.toLowerCase())
    })
  }, [columns, columnSearch, hasDebitNoteInSelection, hideColumnsOnDebitNote])
  const handleDebitNoteClick = useCallback(() => {
    // Check if any selected items have existing debit notes
    const hasExistingDebitNotes = hasValidDebitNoteIds
    if (hasExistingDebitNotes) {
      // If all selected items have existing debit notes, show a different message
      setShowDebitNoteConfirmation(true)
    } else {
      // If no items have existing debit notes, show the create confirmation
      setShowDebitNoteConfirmation(true)
    }
  }, [hasValidDebitNoteIds])
  const handleConfirmDebitNote = useCallback(() => {
    if (onDebitNoteAction) {
      onDebitNoteAction(debitNoteNo || "", selectedRowIds)
      setDebitNoteNo("") // Clear the input after use
    }
    setShowDebitNoteConfirmation(false)
  }, [onDebitNoteAction, debitNoteNo, selectedRowIds])
  const handleCancelDebitNote = useCallback(() => {
    setShowDebitNoteConfirmation(false)
  }, [])
  // Handle combined services click with validation
  const handleCombinedServiceClick = useCallback(() => {
    if (onCombinedService) {
      onCombinedService()
    }
  }, [onCombinedService])

  // Handle clone task click
  const handleCloneTaskClick = useCallback(() => {
    if (onCloneTask) {
      onCloneTask()
    }
  }, [onCloneTask])
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
  return (
    <>
      <div className="mb-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <Button
              onClick={onCreateAction}
              disabled={isConfirmed}
              title={
                isConfirmed ? "Cannot create when confirmed" : "Create new item"
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefreshAction}
              disabled={isConfirmed}
              title={
                isConfirmed ? "Cannot refresh when confirmed" : "Refresh data"
              }
              className={
                isConfirmed
                  ? "cursor-not-allowed opacity-50"
                  : "border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700"
              }
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {onBulkDeleteAction && hasSelectedRows && (
              <Button
                variant="destructive"
                onClick={onBulkDeleteAction}
                title={
                  hasAnyDebitNoteId
                    ? "Cannot delete - One or more selected items have a Debit Note"
                    : `Delete ${selectedRowsCount} selected item${selectedRowsCount !== 1 ? "s" : ""}`
                }
                disabled={isConfirmed || hasAnyDebitNoteId}
                className={
                  isConfirmed || hasAnyDebitNoteId
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedRowsCount})
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleCombinedServiceClick}
              title={
                hasSelectedRows
                  ? "Bulk & Task Forward Services"
                  : "Please select at least one item first"
              }
              //disabled={isConfirmed || !hasSelectedRows}
              disabled={!hasSelectedRows || hasValidDebitNoteIds}
              className={
                !hasSelectedRows || isConfirmed
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }
            >
              <Forward className="h-4 w-4" />
            </Button>

            {canDebitNote && (
              <div className="ml-4 flex items-center gap-2">
                <Button
                  variant="default"
                  onClick={handleDebitNoteClick}
                  title={
                    !hasSelectedRows
                      ? "Please select at least one item first"
                      : hasValidDebitNoteIds
                        ? "Selected items have valid Debit Note IDs - cannot create new debit note"
                        : "Debit Note"
                  }
                  disabled={
                    isConfirmed || !hasSelectedRows || hasValidDebitNoteIds
                  }
                  className={
                    !hasSelectedRows || hasValidDebitNoteIds || isConfirmed
                      ? "cursor-not-allowed bg-[#2f6abb] text-white opacity-50 hover:bg-[#255499]"
                      : "bg-[#2f6abb] text-white hover:bg-[#255499]"
                  }
                >
                  <Receipt className="h-4 w-4" /> Debit Note
                </Button>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="debit-note-checkbox"
                    checked={showDebitNoteInput}
                    onCheckedChange={(checked) =>
                      setShowDebitNoteInput(checked as boolean)
                    }
                    disabled={!hasSelectedRows || hasValidDebitNoteIds}
                  />
                  <label
                    htmlFor="debit-note-checkbox"
                    className={`text-sm leading-none font-medium ${
                      !hasSelectedRows || hasValidDebitNoteIds
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    IsDebitNoteNo.
                  </label>
                </div>
                {showDebitNoteInput && (
                  <Input
                    placeholder="Debit Note No"
                    value={debitNoteNo}
                    onChange={(e) => setDebitNoteNo(e.target.value)}
                    className="w-40"
                    disabled={!hasSelectedRows || hasValidDebitNoteIds}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            {onCloneTask && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleCloneTaskClick}
                title={
                  hasSelectedRows
                    ? "Clone Task to Different Company"
                    : "Please select at least one item first"
                }
                disabled={!hasSelectedRows || isConfirmed}
                className={
                  !hasSelectedRows || isConfirmed
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                <Building2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDocumentDialogOpen(true)}
              disabled={isConfirmed || !jobData}
              title={
                isConfirmed
                  ? "Cannot upload documents when confirmed"
                  : !jobData
                    ? "Job order data not available"
                    : "Upload Documents"
              }
            >
              <UploadIcon className="h-4 w-4" />
            </Button>

            {/* Search Input */}
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-7 max-w-[200px] px-2 py-0 text-xs leading-7 md:text-xs"
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
            {/* Layout Change - Moved to right side */}
            <Button
              variant="outline"
              title="Save Layout"
              onClick={handleSaveLayout}
            >
              <Layout className="h-4 w-4" />
            </Button>

            {/* Reset Default Layout Change */}
            <Button
              variant="outline"
              title="Reset Layout"
              onClick={handleResetDefaultLayout}
            >
              <RedoDot className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Debit Note Confirmation */}
      <DebitNoteConfirmation
        open={showDebitNoteConfirmation}
        onOpenChange={setShowDebitNoteConfirmation}
        itemName={`${selectedRowsCount} selected item${selectedRowsCount !== 1 ? "s" : ""}`}
        hasExistingDebitNote={hasValidDebitNoteIds}
        onConfirm={handleConfirmDebitNote}
        onCancelAction={handleCancelDebitNote}
        isCreating={false} // You can add loading state here if needed
      />
      {/* Document Upload Dialog */}
      <Dialog
        open={isDocumentDialogOpen}
        onOpenChange={setIsDocumentDialogOpen}
      >
        <DialogContent className="max-h-[90vh] w-[80vw] !max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload and manage documents for this service/task.
            </DialogDescription>
          </DialogHeader>
          {jobData && (
            <ServicelistDocuments
              jobData={jobData}
              isConfirmed={isConfirmed}
              transactionId={transactionIdForDocuments}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
