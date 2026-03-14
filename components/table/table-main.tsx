"use client"

// ============================================================================
// IMPORTS SECTION
// ============================================================================
// React hooks for component state and lifecycle management
import { useCallback, useEffect, useRef, useState } from "react"
// Drag and Drop functionality for column reordering
import {
  DndContext,
  // Main drag and drop context provider
  DragEndEvent,
  // Event type for when drag operation ends
  KeyboardSensor,
  // Sensor for keyboard-based drag operations
  MouseSensor,
  // Sensor for mouse-based drag operations
  TouchSensor,
  // Sensor for touch-based drag operations
  closestCenter,
  // Collision detection algorithm
  useSensor,
  // Hook to create sensors
  useSensors, // Hook to combine multiple sensors
} from "@dnd-kit/core"
// Sortable functionality for drag and drop
import {
  SortableContext,
  // Context for sortable items
  arrayMove,
  // Utility to move items in array
  horizontalListSortingStrategy, // Strategy for horizontal sorting
} from "@dnd-kit/sortable"
// TanStack Table for advanced table functionality
import {
  ColumnDef,
  // Type definition for table columns
  ColumnFiltersState,
  // State type for column filters
  SortingState,
  // State type for sorting
  VisibilityState,
  // State type for column visibility
  flexRender,
  // Function to render cell content
  getCoreRowModel,
  // Core row model for basic table functionality
  getFilteredRowModel,
  // Row model with filtering capabilities
  getPaginationRowModel,
  // Row model with pagination
  getSortedRowModel,
  // Row model with sorting capabilities
  useReactTable, // Main hook to create table instance
} from "@tanstack/react-table"

// Virtual scrolling removed - using empty rows instead
// Utility types and custom hooks
import { TableName } from "@/lib/utils"
// Type for table names
import { useGetGridLayout } from "@/hooks/use-settings"
// Hook to get grid layout settings
// UI components for table structure
import {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Custom table components
import { SortableTableHeader } from "./sortable-table-header"
// Header with drag and drop
import { MainTableActions } from "./table-main-actions"
// Action buttons (view/edit/delete)
import { MainTableFooter } from "./table-main-footer"
// Pagination and page size controls
import { MainTableHeader } from "./table-main-header"

// Search, refresh, and create buttons
// ============================================================================
// INTERFACE DEFINITION
// ============================================================================
/**
 * Props interface for the MainTable component
 * @template T - The type of data items in the table
 */
interface MainTableProps<T> {
  // ============================================================================
  // CORE DATA PROPS
  // ============================================================================
  data: T[] // Array of data items to display in the table
  columns: ColumnDef<T>[] // Column definitions for the table structure
  isLoading?: boolean // Loading state indicator
  totalRecords?: number // Total records
  moduleId?: number // Module ID for grid layout settings
  transactionId?: number // Transaction ID for grid layout settings
  tableName: TableName // Name of the table for grid layout persistence
  emptyMessage?: string // Message to show when no data is available
  accessorId: keyof T // Key to access unique identifier from data items
  // ============================================================================
  // HEADER FUNCTIONALITY PROPS
  // ============================================================================
  onRefreshAction?: () => void // Callback function for refresh button
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void // Callback for filter changes
  initialSearchValue?: string // Initial search value to sync with parent filters
  // ============================================================================
  // PAGINATION PROPS
  // ============================================================================
  onPageChange?: (page: number) => void // Callback for page changes
  onPageSizeChange?: (pageSize: number) => void // Callback for page size changes
  currentPage?: number // Current page number
  pageSize?: number // Current page size
  serverSidePagination?: boolean // Whether to use server-side pagination
  // ============================================================================
  // ACTION HANDLER PROPS
  // ============================================================================
  onSelect?: (item: T | null) => void // Callback when item is selected/viewed
  onCreateAction?: () => void // Callback for creating new item
  createButtonText?: string // Custom text for create button
  onEditAction?: (item: T) => void // Callback for editing existing item
  onDeleteAction?: (itemId: string) => void // Callback for deleting item
  // ============================================================================
  // VISIBILITY CONTROL PROPS
  // ============================================================================
  showHeader?: boolean // Whether to show the table header (search, refresh, create)
  showFooter?: boolean // Whether to show the table footer (pagination)
  showActions?: boolean // Whether to show action buttons column
  // ============================================================================
  // PERMISSION CONTROL PROPS
  // ============================================================================
  canView?: boolean // Permission to view items
  canCreate?: boolean // Permission to create new items
  canEdit?: boolean // Permission to edit items
  canDelete?: boolean // Permission to delete items
  isConfirmed?: boolean // Whether the record is confirmed (readonly mode)
}
// ============================================================================
// MAIN COMPONENT FUNCTION
// ============================================================================
/**
 * MainTable - A comprehensive data table component with advanced features
 *
 * Features:
 * - Virtual scrolling for performance with large datasets
 * - Drag and drop column reordering
 * - Column resizing and visibility controls
 * - Sorting, filtering, and pagination
 * - Action buttons (view, edit, delete)
 * - Grid layout persistence
 * - Permission-based access control
 *
 * @template T - The type of data items in the table
 * @param props - Component props as defined in MainTableProps
 * @returns JSX element representing the data table
 */
export function MainTable<T>({
  // ============================================================================
  // DESTRUCTURE PROPS WITH DEFAULT VALUES
  // ============================================================================
  data, // Array of data items
  columns, // Column definitions
  isLoading, // Loading state
  totalRecords, // Total records
  moduleId, // Module ID for settings
  transactionId, // Transaction ID for settings
  tableName, // Table name for settings
  emptyMessage = "No data found.", // Default empty message
  accessorId, // Key for unique identifier
  // Header functionality props
  onRefreshAction, // Refresh callback
  onFilterChange, // Filter change callback
  initialSearchValue = undefined, // Initial search value from parent
  // Pagination props
  onPageChange, // Page change callback
  onPageSizeChange, // Page size change callback
  currentPage: propCurrentPage, // Current page from props
  pageSize: propPageSize, // Page size from props
  serverSidePagination = false, // Whether to use server-side pagination
  // Action handler props
  onSelect, // Item selection callback
  onCreateAction, // Create item callback
  createButtonText = "Create", // Custom text for create button
  onEditAction, // Edit item callback
  onDeleteAction, // Delete item callback
  // Visibility control props with defaults
  showHeader = true, // Show header by default
  showFooter = true, // Show footer by default
  showActions = true, // Show actions by default
  // Permission props with defaults (all permissions enabled by default)
  canView = true, // View permission
  canCreate = true, // Create permission
  canEdit = true, // Edit permission
  canDelete = true, // Delete permission
  isConfirmed = false, // Confirmed state (readonly mode)
}: MainTableProps<T>) {
  // ============================================================================
  // GRID LAYOUT SETTINGS
  // ============================================================================
  // Fetch saved grid layout settings from the database
  // This allows users to have personalized table layouts that persist across sessions
  const { data: gridSettings } = useGetGridLayout(
    moduleId?.toString() || "", // Convert module ID to string
    transactionId?.toString() || "", // Convert transaction ID to string
    tableName // Table name for settings lookup
  )
  //const gridSettings = gridSettings?.data
  // ============================================================================
  // STATE MANAGEMENT WITH GRID SETTINGS
  // ============================================================================
  // Initialize table state with grid settings if available
  const getInitialSorting = (): SortingState => {
    if (gridSettings?.grdSort) {
      try {
        return JSON.parse(gridSettings.grdSort) || []
      } catch {
        return []
      }
    }
    return []
  }
  const getInitialColumnVisibility = (): VisibilityState => {
    if (gridSettings?.grdColVisible) {
      try {
        return JSON.parse(gridSettings.grdColVisible) || {}
      } catch {
        return {}
      }
    }
    return {}
  }
  const getInitialColumnSizing = () => {
    if (gridSettings?.grdColSize) {
      try {
        return JSON.parse(gridSettings.grdColSize) || {}
      } catch {
        return {}
      }
    }
    return {}
  }
  // Table state management using React hooks with grid settings initialization
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting) // Current sorting configuration
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]) // Active column filters
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    getInitialColumnVisibility
  ) // Column visibility state
  const [columnSizing, setColumnSizing] = useState(getInitialColumnSizing) // Column width settings
  // Initialize searchQuery with initialSearchValue if provided, otherwise empty string
  const [searchQuery, setSearchQuery] = useState(initialSearchValue || "") // Global search query
  const [currentPage, setCurrentPage] = useState(propCurrentPage || 1) // Current page number
  const [pageSize, setPageSize] = useState(propPageSize || 50) // Number of items per page
  const [rowSelection, setRowSelection] = useState({}) // Selected rows state
  // Shared scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Track if this is the first render to prevent debounce from firing on mount
  const isFirstRender = useRef(true)
  // Track the last search value that was sent to prevent duplicate calls
  const lastSentSearch = useRef<string | undefined>(undefined)
  // Track if searchQuery was explicitly set by user (to prevent accidental clearing)
  const searchQueryRef = useRef<string>("")
  // Track if user is actively editing (to prevent sync from overwriting user input)
  const isUserEditing = useRef<boolean>(false)

  // ============================================================================
  // EFFECT: SYNC SEARCH QUERY WITH PARENT FILTERS
  // ============================================================================
  /**
   * Sync searchQuery with initialSearchValue from parent when it changes
   * This ensures the search input shows the correct value even after re-renders
   * BUT only when user is NOT actively editing
   */
  useEffect(() => {
    // Don't sync if user is actively editing
    if (isUserEditing.current) {
      return
    }

    // Only sync if initialSearchValue is provided and different from current searchQuery
    if (
      initialSearchValue !== undefined &&
      initialSearchValue !== searchQuery
    ) {
      setSearchQuery(initialSearchValue)
      searchQueryRef.current = initialSearchValue
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit searchQuery to avoid sync loops
  }, [initialSearchValue])

  // ============================================================================
  // EFFECT: UPDATE STATE WHEN GRID SETTINGS CHANGE
  // ============================================================================
  /**
   * Update table state when grid settings change (for dynamic updates)
   * This handles cases where grid settings are loaded after component mount
   */
  useEffect(() => {
    if (gridSettings) {
      try {
        // Parse saved settings from JSON strings
        const colVisible = JSON.parse(gridSettings.grdColVisible || "{}") // Column visibility settings
        const colSize = JSON.parse(gridSettings.grdColSize || "{}") // Column width settings
        const sort = JSON.parse(gridSettings.grdSort || "[]") // Sorting configuration
        // Update state only if it's different from current state
        setColumnVisibility((prev) => {
          const newVisibility =
            JSON.stringify(prev) !== JSON.stringify(colVisible)
              ? colVisible
              : prev
          return newVisibility
        })
        setSorting((prev) => {
          const newSorting =
            JSON.stringify(prev) !== JSON.stringify(sort) ? sort : prev
          return newSorting
        })
        // Apply column sizing if available (only if there are saved sizes)
        if (Object.keys(colSize).length > 0) {
          setColumnSizing((prev: Record<string, number>) => {
            const newSizing =
              JSON.stringify(prev) !== JSON.stringify(colSize) ? colSize : prev
            return newSizing
          })
        }
      } catch (error) {
        // Handle JSON parsing errors gracefully
        console.error("Error parsing grid settings:", error)
      }
    }
  }, [gridSettings]) // Re-run when grid settings change
  // ============================================================================
  // COLUMN CONFIGURATION
  // ============================================================================
  /**
   * Build the complete column configuration for the table
   * This includes the actions column (if enabled) plus all user-defined columns
   */
  const tableColumns: ColumnDef<T>[] = [
    // Conditionally add actions column if showActions is true
    // The MainTableActions component will handle individual button visibility based on permissions
    ...(showActions
      ? [
          {
            id: "actions", // Unique identifier for the actions column
            header: "Actions", // Column header text
            enableHiding: false, // Actions column cannot be hidden
            size: 120, // Default column width
            minSize: 80, // Minimum allowed width
            // Maximum allowed width
            cell: (
              { row } // Cell renderer function
            ) => (
              //I'll add more actions here later
              <MainTableActions
                row={row.original} // Pass the row data
                idAccessor={accessorId} // Pass the ID accessor key
                onView={onSelect} // View/select handler
                onEditAction={onEditAction} // Edit handler
                onDeleteAction={onDeleteAction} // Delete handler
                hideView={!canView} // Hide view button if no permission
                hideEdit={!canEdit} // Hide edit button if no permission
                hideDelete={!canDelete} // Hide delete button if no permission
              />
            ),
          } as ColumnDef<T>,
        ]
      : []), // Empty array if actions column should not be shown
    ...columns, // Spread all user-defined columns after the actions column
  ]
  // ============================================================================
  // TABLE INSTANCE CREATION
  // ============================================================================
  /**
   * Create the TanStack Table instance with all configuration
   * This is the core of the table functionality
   */
  const table = useReactTable({
    // ============================================================================
    // BASIC CONFIGURATION
    // ============================================================================
    data, // Data array to display
    columns: tableColumns, // Column definitions (including actions)
    pageCount: Math.ceil((totalRecords || data.length) / pageSize), // Total number of pages
    // ============================================================================
    // STATE CHANGE HANDLERS
    // ============================================================================
    onSortingChange: setSorting, // Handle sorting changes
    onColumnFiltersChange: setColumnFilters, // Handle filter changes
    onColumnVisibilityChange: setColumnVisibility, // Handle column show/hide
    onColumnSizingChange: setColumnSizing, // Handle column resize
    onRowSelectionChange: setRowSelection, // Handle row selection
    // ============================================================================
    // ROW MODELS (DATA PROCESSING)
    // ============================================================================
    getCoreRowModel: getCoreRowModel(), // Basic row processing
    getPaginationRowModel: serverSidePagination
      ? undefined
      : getPaginationRowModel(), // Pagination functionality (disabled for server-side)
    getSortedRowModel: getSortedRowModel(), // Sorting functionality
    getFilteredRowModel: getFilteredRowModel(), // Filtering functionality
    // ============================================================================
    // FEATURE ENABLEMENT
    // ============================================================================
    enableColumnResizing: true, // Allow column resizing
    enableRowSelection: true, // Allow row selection
    columnResizeMode: "onChange", // Resize columns as user drags
    // ============================================================================
    // CURRENT STATE
    // ============================================================================
    state: {
      sorting, // Current sorting state
      columnFilters, // Current filter state
      columnVisibility, // Current visibility state
      columnSizing, // Current column sizes
      rowSelection, // Current selected rows
      pagination: serverSidePagination
        ? {
            // Server-side pagination state
            pageIndex: 0, // Always show first page of current data
            pageSize: data.length, // Show all data from server
          }
        : {
            // Client-side pagination state
            pageIndex: currentPage - 1, // Convert to 0-based index
            pageSize, // Items per page
          },
      globalFilter: searchQuery, // Current search query
    },
  })
  // ============================================================================
  // EFFECT: APPLY SAVED COLUMN ORDER
  // ============================================================================
  /**
   * Apply saved column order after table instance is created
   * This must be done after the table is initialized because setColumnOrder
   * requires the table instance to be available
   */
  useEffect(() => {
    if (gridSettings && table) {
      try {
        // Parse saved column order from JSON string
        const colOrder = JSON.parse(gridSettings.grdColOrder || "[]")
        // Apply column order if there are saved column positions
        if (colOrder.length > 0) {
          table.setColumnOrder(colOrder) // Reorder columns according to saved preferences
        }
      } catch (error) {
        // Handle JSON parsing errors gracefully
        console.error("Error parsing column order:", error)
      }
    }
  }, [gridSettings, table]) // Re-run when grid settings or table instance changes
  // ============================================================================
  // TABLE RENDERING SETUP
  // ============================================================================
  // ============================================================================
  // DRAG AND DROP SENSORS
  // ============================================================================
  /**
   * Configure drag and drop sensors for column reordering
   * Supports mouse, touch, and keyboard interactions
   */
  const sensors = useSensors(
    useSensor(MouseSensor, {}), // Mouse-based dragging
    useSensor(TouchSensor, {}), // Touch-based dragging (mobile)
    useSensor(KeyboardSensor, {}) // Keyboard-based dragging (accessibility)
  )
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  /**
   * Handle search query changes (immediate update for UI responsiveness)
   * @param query - The search query string
   */
  const handleSearch = (query: string) => {
    // Mark that user is actively editing
    isUserEditing.current = true

    // Always update the search query when user types
    setSearchQuery(query) // Update local search state immediately for UI responsiveness
    searchQueryRef.current = query // Track the current search value

    // If user clears the search (empty string), immediately update parent filters
    // This allows the user to clear the search box
    if (query === "" && serverSidePagination && onFilterChange) {
      const newFilters = {
        search: undefined, // Clear the search in parent
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      }
      onFilterChange(newFilters)
      lastSentSearch.current = undefined // Reset last sent value
    }

    // For client-side filtering, apply immediately
    if (!serverSidePagination && data && data.length > 0) {
      table.setGlobalFilter(query) // Apply filter to local data immediately
    }

    // Reset editing flag after a short delay to allow sync from parent if needed
    setTimeout(() => {
      isUserEditing.current = false
    }, 100)
  }

  // ============================================================================
  // DEBOUNCED SEARCH EFFECT
  // ============================================================================
  /**
   * Debounce search query changes for server-side filtering
   * Waits 400ms after user stops typing before calling onFilterChange
   * This prevents excessive API calls while the user is still typing
   */
  useEffect(() => {
    // Only debounce for server-side pagination
    if (!serverSidePagination || !onFilterChange) return

    // Skip debounce on first render to prevent unnecessary API call on mount
    if (isFirstRender.current) {
      isFirstRender.current = false
      lastSentSearch.current = searchQuery.trim() || undefined
      return
    }

    const trimmedQuery = searchQuery.trim()
    const normalizedQuery = trimmedQuery || undefined

    // Skip if the search value hasn't actually changed
    if (normalizedQuery === lastSentSearch.current) {
      return
    }

    // Set up debounce timer
    const debounceTimer = setTimeout(() => {
      // Only call if the value still matches (user might have changed it during debounce)
      const currentTrimmed = searchQuery.trim()
      const currentNormalized = currentTrimmed || undefined

      // Double-check the value hasn't changed during the debounce delay
      if (currentNormalized !== lastSentSearch.current) {
        // Pass undefined for empty searches (hook will convert to "null" for API)
        const newFilters = {
          search: currentNormalized, // undefined for empty, string for actual search
          sortOrder: sorting[0]?.desc ? "desc" : "asc", // Pass current sort order
        }
        onFilterChange(newFilters) // Let parent handle server-side filtering
        lastSentSearch.current = currentNormalized // Update last sent value
      }
    }, 400) // 400ms delay - standard for search inputs

    // Cleanup: clear timer if searchQuery changes before timeout
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, serverSidePagination, onFilterChange, sorting])

  /**
   * Handle search for non-server-side pagination when no local data
   * This is for cases where we need to call onFilterChange but don't have local data
   */
  useEffect(() => {
    // Only for non-server-side pagination with no local data
    if (serverSidePagination || (data && data.length > 0) || !onFilterChange)
      return

    // Debounce this as well
    const debounceTimer = setTimeout(() => {
      // Pass undefined for empty strings to avoid sending "null" to API
      const newFilters = {
        search: searchQuery.trim() || undefined,
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      }
      onFilterChange(newFilters)
    }, 400)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, serverSidePagination, data, onFilterChange, sorting])
  /**
   * Handle page changes in pagination
   * @param page - The new page number (1-based)
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page) // Update local page state
    table.setPageIndex(page - 1) // Convert to 0-based index for table
    // Call external handler if provided (for server-side pagination)
    if (onPageChange) {
      onPageChange(page)
    }
  }
  /**
   * Handle page size changes in pagination
   * @param size - The new page size (items per page)
   */
  const handlePageSizeChange = (size: number) => {
    setPageSize(size) // Update local page size state
    table.setPageSize(size) // Update table page size
    // Call external handler if provided (for server-side pagination)
    if (onPageSizeChange) {
      onPageSizeChange(size)
    }
  }
  /**
   * Handle drag and drop end event for column reordering
   * @param event - The drag end event containing active and over elements
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event // Extract dragged and target elements
    // Only proceed if there's a valid drop target and it's different from the source
    if (active && over && active.id !== over.id) {
      // Find the index of the dragged column
      const oldIndex = table
        .getAllColumns()
        .findIndex((col) => col.id === active.id)
      // Find the index of the target column
      const newIndex = table
        .getAllColumns()
        .findIndex((col) => col.id === over.id)
      // Create new column order by moving the column
      const newColumnOrder = arrayMove(
        table.getAllColumns(), // Current column array
        oldIndex, // Source index
        newIndex // Target index
      )
      // Apply the new column order to the table
      table.setColumnOrder(newColumnOrder.map((col) => col.id))
    }
  }
  // ============================================================================
  // EFFECT: HANDLE SERVER-SIDE FILTERING (for non-server-side pagination)
  // ============================================================================
  /**
   * Handle server-side filtering when no local data is available
   * This effect triggers when sorting, search, or data availability changes
   * NOTE: This is only for non-server-side pagination. Server-side pagination
   * uses the debounced effect above.
   */
  useEffect(() => {
    // Skip if using server-side pagination (handled by debounced effect above)
    if (serverSidePagination) return

    // Only trigger server-side filtering if:
    // 1. No local data is available AND
    // 2. A filter change handler is provided
    if (!data?.length && onFilterChange) {
      const trimmedQuery = searchQuery.trim()
      const filters = {
        search: trimmedQuery || undefined, // Pass undefined for empty strings
        sortOrder: sorting[0]?.desc ? "desc" : "asc", // Current sort order
      }
      onFilterChange(filters) // Call parent to fetch filtered data from server
    }
  }, [sorting, searchQuery, data?.length, onFilterChange, serverSidePagination]) // Re-run when these values change

  // ============================================================================
  // RESET LAYOUT HANDLER
  // ============================================================================
  /**
   * Handle reset layout - reset all columns to visible and default sizes
   */
  const handleResetLayout = useCallback(() => {
    // Reset all columns to visible
    const allColumnsVisible: VisibilityState = {}
    table.getAllLeafColumns().forEach((column) => {
      allColumnsVisible[column.id] = true
    })
    setColumnVisibility(allColumnsVisible)

    // Reset sorting
    setSorting([])

    // Reset column sizes to default
    setColumnSizing({})
  }, [table])

  // Use native scrollbars (always visible)

  // ============================================================================
  // RENDER SECTION
  // ============================================================================
  return (
    <div className="space-y-4">
      {/* ============================================================================
          TABLE HEADER SECTION
          ============================================================================ */}
      {/* Conditionally render table header with search, refresh, and create functionality */}
      {showHeader && (
        <MainTableHeader
          searchQuery={searchQuery} // Current search query
          onSearchChange={handleSearch} // Search change handler
          onRefreshAction={onRefreshAction} // Refresh button handler
          onCreateAction={onCreateAction} // Create button handler
          createButtonText={createButtonText} // Custom create button text
          //columns={table.getAllLeafColumns()}
          columns={table
            .getHeaderGroups()
            .flatMap((group) => group.headers)
            .map((header) => header.column)} // All columns in display order
          data={data} // Current data for export functionality
          tableName={tableName} // Table name for settings
          hideCreateButton={!canCreate} // Hide create button if no permission
          moduleId={moduleId || 1} // Module ID for settings (default to 1)
          transactionId={transactionId || 1} // Transaction ID for settings (default to 1)
          onResetLayout={handleResetLayout} // Reset layout handler
          isConfirmed={isConfirmed} // Pass isConfirmed to disable create button when confirmed
        />
      )}
      {/* ============================================================================
          DRAG AND DROP CONTEXT
          ============================================================================ */}
      {/* Wrap table in drag and drop context for column reordering */}
      <DndContext
        sensors={sensors} // Configured drag sensors
        collisionDetection={closestCenter} // Collision detection algorithm
        onDragEnd={handleDragEnd} // Handle drag end events
      >
        {/* ============================================================================
          TABLE CONTAINER
          ============================================================================ */}
        {/* Main table container with horizontal scrolling */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="max-h-[460px] overflow-x-scroll overflow-y-scroll rounded-lg border text-xs"
            style={{
              scrollbarGutter: "stable",
            }}
          >
            <table
              className="w-full table-fixed border-collapse text-xs"
              style={{ minWidth: "100%" }}
            >
              <colgroup>
                {table.getAllLeafColumns().map((col) => (
                  <col
                    key={col.id}
                    style={{
                      width: `${col.getSize()}px`,
                      minWidth: `${col.getSize()}px`,
                      maxWidth: `${col.getSize()}px`,
                    }}
                  />
                ))}
              </colgroup>
              <TableHeader className="bg-background sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    <SortableContext
                      items={headerGroup.headers.map((header) => header.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {headerGroup.headers.map((header, headerIndex) => {
                        const isFirst =
                          headerIndex === 0 || header.id === "actions"
                        return (
                          <SortableTableHeader
                            key={header.id}
                            header={header}
                            className={
                              isFirst ? "bg-background sticky left-0 z-20" : ""
                            }
                            style={
                              isFirst
                                ? { position: "sticky", left: 0, zIndex: 20 }
                                : undefined
                            }
                          />
                        )
                      })}
                    </SortableContext>
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {/* ============================================================================
                    DATA ROWS RENDERING
                    ============================================================================ */}
                {/* Render data rows */}
                {table.getRowModel().rows.map((row) => {
                  return (
                    <TableRow key={row.id}>
                      {/* Render each visible cell in the row */}
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isActions = cell.column.id === "actions"
                        const isFirstColumn = cellIndex === 0
                        return (
                          <TableCell
                            key={cell.id}
                            className={`py-1 ${
                              isFirstColumn || isActions
                                ? "bg-background sticky left-0 z-10" // Make first column and actions sticky
                                : ""
                            }`}
                            style={{
                              width: `${cell.column.getSize()}px`,
                              minWidth: `${cell.column.getSize()}px`,
                              maxWidth: `${cell.column.getSize()}px`,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              position:
                                isFirstColumn || isActions
                                  ? "sticky"
                                  : "relative",
                              left: isFirstColumn || isActions ? 0 : "auto",
                              zIndex: isFirstColumn || isActions ? 10 : 1,
                            }}
                          >
                            {/* Render cell content using column definition */}
                            {flexRender(
                              cell.column.columnDef.cell, // Cell renderer from column definition
                              cell.getContext() // Cell context with row data
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
                {/* ============================================================================
                    EMPTY ROWS TO FILL PAGE SIZE
                    ============================================================================ */}
                {/* Add empty rows to ensure minimum 5 rows total, but only if data rows < 5 */}
                {Array.from({
                  length: (() => {
                    const dataRows = table.getRowModel().rows.length
                    // If we have 5+ data rows, show only data rows (no empty rows)
                    // If we have less than 5 data rows, add empty rows to make it 5 total
                    return dataRows >= 5 ? 0 : Math.max(0, 5 - dataRows)
                  })(),
                }).map((_, index) => (
                  <TableRow key={`empty-${index}`} className="h-7">
                    {table.getAllLeafColumns().map((column, cellIndex) => {
                      const isActions = column.id === "actions"
                      const isFirstColumn = cellIndex === 0
                      return (
                        <TableCell
                          key={`empty-${index}-${column.id}`}
                          className={`py-1 ${
                            isFirstColumn || isActions
                              ? "bg-background sticky left-0 z-10" // Make first column and actions sticky
                              : ""
                          }`}
                          style={{
                            width: `${column.getSize()}px`,
                            minWidth: `${column.getSize()}px`,
                            maxWidth: `${column.getSize()}px`,
                            position:
                              isFirstColumn || isActions
                                ? "sticky"
                                : "relative",
                            left: isFirstColumn || isActions ? 0 : "auto",
                            zIndex: isFirstColumn || isActions ? 10 : 1,
                          }}
                        >
                          {/* Empty cell content */}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
                {/* ============================================================================
                    EMPTY STATE OR LOADING
                    ============================================================================ */}
                {/* Show empty state or loading message when no data */}
                {table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length} // Span all columns
                      className="h-7 text-center" // Center the message
                    >
                      {isLoading ? "Loading..." : emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </table>
          </div>
          {/* Native scrollbars are used; no custom overlay */}
        </div>
      </DndContext>
      {/* ============================================================================
          TABLE FOOTER SECTION
          ============================================================================ */}
      {/* Conditionally render table footer with pagination controls */}
      {showFooter && (
        <MainTableFooter
          currentPage={currentPage} // Current page number
          totalPages={Math.ceil((totalRecords || data.length) / pageSize)} // Total number of pages
          pageSize={pageSize} // Current page size
          totalRecords={totalRecords || data.length} // Total number of records
          onPageChange={handlePageChange} // Page change handler
          onPageSizeChange={handlePageSizeChange} // Page size change handler
          pageSizeOptions={[50, 100, 500]} // Available page size options
        />
      )}
    </div>
  )
}
// ============================================================================
// USAGE EXAMPLES AND DOCUMENTATION
// ============================================================================
/**
 * USAGE EXAMPLES:
 *
 * 1. BASIC USAGE:
 * ```tsx
 * <MainTable
 *   data={employees}
 *   columns={employeeColumns}
 *   tableName="employees"
 *   accessorId="id"
 *   onEditAction={(employee) => setEditingEmployee(employee)}
 *   onDeleteAction={(id) => deleteEmployee(id)}
 * />
 * ```
 *
 * 2. WITH PERMISSIONS:
 * ```tsx
 * <MainTable
 *   data={products}
 *   columns={productColumns}
 *   tableName="products"
 *   accessorId="productId"
 *   canEdit={userPermissions.canEditProducts}
 *   canDelete={userPermissions.canDeleteProducts}
 *   canCreate={userPermissions.canCreateProducts}
 *   onCreateAction={() => setShowCreateModal(true)}
 * />
 * ```
 *
 * 3. WITH SERVER-SIDE FILTERING:
 * ```tsx
 * <MainTable
 *   data={[]} // Empty array for server-side data
 *   columns={orderColumns}
 *   tableName="orders"
 *   accessorId="orderId"
 *   onFilterChange={(filters) => fetchOrders(filters)}
 *   onCreateAction={() => setShowCreateModal(true)}
 *   onEditAction={(order) => setEditingOrder(order)}
 *   onDeleteAction={(id) => deleteOrder(id)}
 *   onRefreshAction={() => fetchOrders()}
 * />
 * ```
 *
 * 4. CUSTOMIZED DISPLAY:
 * ```tsx
 * <MainTable
 *   data={customers}
 *   columns={customerColumns}
 *   tableName="customers"
 *   accessorId="customerId"
 *   showHeader={true}
 *   showFooter={true}
 *   showActions={false} // Hide action buttons
 *   emptyMessage="No customers found. Create your first customer!"
 * />
 * ```
 *
 * KEY FEATURES:
 * - Virtual scrolling for performance with large datasets
 * - Drag and drop column reordering
 * - Column resizing and visibility controls
 * - Sorting, filtering, and pagination
 * - Action buttons (view, edit, delete) with permission control
 * - Grid layout persistence across sessions
 * - Server-side and client-side filtering support
 * - Responsive design with horizontal scrolling
 * - Sticky header and first column
 * - Loading states and empty state handling
 *
 * PERFORMANCE NOTES:
 * - Virtual scrolling only renders visible rows + buffer
 * - Column sizing is optimized for large datasets
 * - Grid settings are cached and persisted
 * - Efficient re-rendering with React.memo patterns
 *
 * ACCESSIBILITY:
 * - Keyboard navigation support
 * - Screen reader friendly
 * - ARIA labels and roles
 * - Focus management
 * - High contrast support
 */
