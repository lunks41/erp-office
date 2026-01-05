import { useCallback, useMemo, useState } from "react"
import { IJobOrderHd } from "@/interfaces/checklist"
import { IGridSetting } from "@/interfaces/setting"
import { Column } from "@tanstack/react-table"
import {
  Building2,
  ClipboardList,
  FileText,
  Forward,
  Layout,
  Plus,
  Receipt,
  RedoDot,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Upload,
  UploadCloudIcon,
  UploadIcon,
} from "lucide-react"

import { useDelete, usePersist } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  // Props for job order info display
  data?: TData[] // Table data to display charges summary
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
  data = [],
  onResetLayout,
  jobData,
  transactionIdForDocuments,
  canDebitNote = true,
}: TaskTableHeaderProps<TData>) {
  const [columnSearch, setColumnSearch] = useState("")
  const [activeButton, setActiveButton] = useState<"show" | "hide" | null>(null)
  const [debitNoteNo, setDebitNoteNo] = useState("")
  const [showDebitNoteInput, setShowDebitNoteInput] = useState(false)
  // State for debit note confirmation dialog
  const [showDebitNoteConfirmation, setShowDebitNoteConfirmation] =
    useState(false)
  // State for document upload dialog
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)

  // Extract and aggregate charges with quantities from data
  const chargesData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group data by chargeName and sum quantities
    const chargeMap = new Map<
      string,
      { chargeName: string; qty: number; count: number }
    >()

    data.forEach((item) => {
      const itemData = item as Record<string, unknown>
      const chargeName = (itemData.chargeName as string) || "N/A"
      const qty = Number(itemData.quantity || itemData.qty || 0)

      if (chargeMap.has(chargeName)) {
        const existing = chargeMap.get(chargeName)!
        existing.qty += qty
        existing.count += 1
      } else {
        chargeMap.set(chargeName, { chargeName, qty, count: 1 })
      }
    })

    return Array.from(chargeMap.values())
  }, [data])

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
  const handleShowAll = useCallback(() => {
    columns.forEach((column) => column.toggleVisibility(true))
    setActiveButton("show")
  }, [columns])
  const handleHideAll = useCallback(() => {
    columns.forEach((column) => column.toggleVisibility(false))
    setActiveButton("hide")
  }, [columns])
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
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            {onCloneTask && (
              <Button
                variant="outline"
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

            {canDebitNote && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
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
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }
                >
                  <Receipt className="h-4 w-4" />
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

          <div className="flex items-center gap-2">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className="flex h-8 items-center px-4"
                    variant="outline"
                  >
                    <ClipboardList className="mr-1 h-4 w-4" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-2xl">
                  <div className="space-y-3">
                    <h4 className="mb-3 font-semibold">{"Charges Summary"}</h4>

                    {chargesData.length > 0 ? (
                      <ul className="mb-4 list-disc space-y-1 pl-5">
                        {chargesData.map((charge) => (
                          <li key={charge.chargeName} className="font-semibold">
                            {charge.chargeName}: {charge.qty}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No charges available
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Search Input */}
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
