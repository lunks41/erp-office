"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { dateSortingFn } from "@/lib/date-utils"
import { TableName } from "@/lib/utils"
import { useGetGridLayout } from "@/hooks/use-settings"
// Virtual scrolling removed - using empty rows instead

import {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SortableTableHeader } from "./sortable-table-header"
import { DialogDataTableHeader } from "./table-dialog-header"
import { MainTableFooter } from "./table-main-footer"

interface DialogDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  tableName: TableName
  emptyMessage?: string
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string // Initial search value to sync with parent filters
  onRowSelect?: (row: T | null) => void
  // Paging props
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  currentPage?: number
  pageSize?: number
  totalRecords?: number
  serverSidePagination?: boolean
  showSearch?: boolean // When false, hide the header search box (default true)
  footerRightContent?: ReactNode // Optional extra content on the right side of footer
  columnFooters?: Record<string, ReactNode> // Per-column footer content (aligned with accessorKey)
}

export function DialogDataTable<T>({
  data,
  columns,
  isLoading,
  moduleId,
  transactionId,
  tableName,
  emptyMessage = "No data found.",
  onRefreshAction,
  onFilterChange,
  initialSearchValue,
  onRowSelect,
  // Pagination props
  onPageChange, // Page change callback
  onPageSizeChange, // Page size change callback
  currentPage: propCurrentPage, // Current page from props
  pageSize: propPageSize, // Page size from props
  totalRecords,
  serverSidePagination = false, // Whether to use server-side pagination
  showSearch = true,
  footerRightContent,
  columnFooters,
}: DialogDataTableProps<T>) {
  const { data: gridSettings } = useGetGridLayout(
    moduleId?.toString() || "",
    transactionId?.toString() || "",
    tableName
  )

  const gridSettingsData = gridSettings?.data

  const getInitialSorting = (): SortingState => {
    if (gridSettingsData?.grdSort) {
      try {
        return JSON.parse(gridSettingsData.grdSort) || []
      } catch {
        return []
      }
    }
    return []
  }

  const getInitialColumnVisibility = (): VisibilityState => {
    if (gridSettingsData?.grdColVisible) {
      try {
        return JSON.parse(gridSettingsData.grdColVisible) || {}
      } catch {
        return {}
      }
    }
    return {}
  }

  const getInitialColumnSizing = () => {
    if (gridSettingsData?.grdColSize) {
      try {
        return JSON.parse(gridSettingsData.grdColSize) || {}
      } catch {
        return {}
      }
    }
    return {}
  }

  const getInitialColumnOrder = (): string[] => {
    if (gridSettingsData?.grdColOrder) {
      try {
        const parsed = JSON.parse(gridSettingsData.grdColOrder)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  const [sorting, setSorting] = useState<SortingState>(getInitialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    getInitialColumnVisibility
  )
  const [columnSizing, setColumnSizing] = useState(getInitialColumnSizing)
  const [columnOrder, setColumnOrder] = useState<string[]>(getInitialColumnOrder)
  const [searchQuery, setSearchQuery] = useState(initialSearchValue || "")
  const [currentPage, setCurrentPage] = useState(propCurrentPage || 1)
  const [pageSize, setPageSize] = useState(propPageSize || 50)
  const [rowSelection, setRowSelection] = useState({})
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

  useEffect(() => {
    if (gridSettingsData) {
      try {
        const colVisible = JSON.parse(gridSettingsData.grdColVisible || "{}")
        const colSize = JSON.parse(gridSettingsData.grdColSize || "{}")
        const sort = JSON.parse(gridSettingsData.grdSort || "[]")
        const colOrder = JSON.parse(gridSettingsData.grdColOrder || "[]")

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

        if (Object.keys(colSize).length > 0) {
          setColumnSizing((prev: Record<string, number>) => {
            const newSizing =
              JSON.stringify(prev) !== JSON.stringify(colSize) ? colSize : prev
            return newSizing
          })
        }

        if (Array.isArray(colOrder) && colOrder.length > 0) {
          setColumnOrder((prev) =>
            JSON.stringify(prev) !== JSON.stringify(colOrder) ? colOrder : prev
          )
        }
      } catch (error) {
        console.error("Error parsing grid settings:", error)
      }
    }
  }, [gridSettingsData])

  // Sync searchQuery with initialSearchValue from parent when it changes
  useEffect(() => {
    // Don't sync if user is actively editing
    if (isUserEditing.current) {
      return
    }

    // Only sync if initialSearchValue is provided and different from tracked searchQuery
    if (
      initialSearchValue !== undefined &&
      initialSearchValue !== searchQueryRef.current
    ) {
      setSearchQuery(initialSearchValue)
      searchQueryRef.current = initialSearchValue
    }
  }, [initialSearchValue]) // Only depend on initialSearchValue to avoid loops

  // Auto-apply date sorting to date columns (accessorKey ends with "Date")
  const tableColumns: ColumnDef<T>[] = columns.map((col) => {
    const accessorKey =
      (col as ColumnDef<T> & { accessorKey?: string }).accessorKey
    const isDateColumn =
      typeof accessorKey === "string" &&
      accessorKey.endsWith("Date") &&
      !col.sortingFn
    return isDateColumn ? { ...col, sortingFn: dateSortingFn } : col
  })

  // Determine if we're using server-side pagination
  const isServerSidePagination = serverSidePagination

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount: Math.ceil((totalRecords || data.length) / pageSize), // Total number of pages
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    // Disable client-side pagination when using server-side pagination
    getPaginationRowModel: serverSidePagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    enableRowSelection: true,
    columnResizeMode: "onChange",

    state: {
      sorting, // Current sorting state
      columnFilters, // Current filter state
      columnVisibility, // Current visibility state
      columnOrder, // Column order for drag-and-drop reordering
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

  // Sync internal state with props when they change
  useEffect(() => {
    if (propCurrentPage !== undefined && propCurrentPage !== currentPage) {
      setCurrentPage(propCurrentPage)
    }
  }, [propCurrentPage, currentPage])

  useEffect(() => {
    if (propPageSize !== undefined && propPageSize !== pageSize) {
      setPageSize(propPageSize)
    }
  }, [propPageSize, pageSize])

  // Virtual scrolling removed - using empty rows instead

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {})
  )

  const clampColumnSize = useCallback((columnId: string, size: number) => {
    if (columnId === "remarks") {
      return Math.min(Math.max(size, 150), 220)
    }
    return size
  }, [])

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

    // Always filter the current table data (client-side) — search box only filters loaded rows
    if (data && data.length > 0) {
      table.setGlobalFilter(query)
    }

    // Reset editing flag after a short delay to allow sync from parent if needed
    setTimeout(() => {
      isUserEditing.current = false
    }, 100)
  }

  /**
   * Debounced search effect for server-side pagination
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Only update table pagination for client-side pagination
    if (!isServerSidePagination) {
      table.setPageIndex(page - 1)
    }
    if (onPageChange) {
      onPageChange(page)
    }
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    // Only update table pagination for client-side pagination
    if (!isServerSidePagination) {
      table.setPageSize(size)
    }
    if (onPageSizeChange) {
      onPageSizeChange(size)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      const currentOrder =
        columnOrder.length > 0
          ? columnOrder
          : table.getAllColumns().map((col) => col.id)
      const oldIndex = currentOrder.indexOf(active.id as string)
      const newIndex = currentOrder.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumnOrder = arrayMove(
          [...currentOrder],
          oldIndex,
          newIndex
        ) as string[]
        setColumnOrder(newColumnOrder)
      }
    }
  }

  // Handle row click
  const handleRowClick = (row: T) => {
    if (onRowSelect) {
      onRowSelect(row)
    }
  }

  useEffect(() => {
    if (!data?.length && !isLoading && onFilterChange) {
      const filters = {
        search: searchQuery,
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      }
      onFilterChange(filters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, searchQuery, data?.length, isLoading])

  // Handle reset layout - reset all columns to visible and default sizes
  const handleResetLayout = useCallback(() => {
    // Reset all columns to visible
    const allColumnsVisible: VisibilityState = {}
    table.getAllLeafColumns().forEach((column) => {
      allColumnsVisible[column.id] = true
    })
    setColumnVisibility(allColumnsVisible)

    // Reset sorting
    setSorting([])

    // Reset column order to default
    setColumnOrder([])

    // Reset column sizes to default
    setColumnSizing({})
  }, [table])

  // No custom scrollbar; use native scrollbars (always visible)

  return (
    <>
      <DialogDataTableHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onRefreshAction={onRefreshAction}
        columns={table.getAllLeafColumns()}
        data={data}
        tableName={tableName}
        moduleId={moduleId || 1}
        transactionId={transactionId || 1}
        onResetLayout={handleResetLayout}
        showSearch={showSearch}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="max-h-[480px] overflow-x-scroll overflow-y-scroll rounded-lg border text-xs"
            style={{
              scrollbarGutter: "stable",
            }}
          >
            <table
              className="w-full table-fixed border-collapse text-xs"
              style={{ minWidth: "100%" }}
            >
              <colgroup>
                {table.getAllLeafColumns().map((col) => {
                  const size = clampColumnSize(col.id, col.getSize())
                  return (
                    <col
                      key={col.id}
                      style={{
                        width: `${size}px`,
                        minWidth: `${size}px`,
                        maxWidth: `${size}px`,
                      }}
                    />
                  )
                })}
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
                            style={{
                              ...(isFirst
                                ? { position: "sticky", left: 0, zIndex: 20 }
                                : undefined),
                              width: `${clampColumnSize(header.column.id, header.column.getSize())}px`,
                              minWidth: `${clampColumnSize(header.column.id, header.column.getSize())}px`,
                              maxWidth: `${clampColumnSize(header.column.id, header.column.getSize())}px`,
                            }}
                          />
                        )
                      })}
                    </SortableContext>
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {/* Render data rows */}
                {table.getRowModel().rows.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => handleRowClick(row.original)}
                      className={`py-1 ${onRowSelect ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isActions = cell.column.id === "actions"
                        const isFirstColumn = cellIndex === 0

                        const columnSize = clampColumnSize(
                          cell.column.id,
                          cell.column.getSize()
                        )

                        return (
                          <TableCell
                            key={cell.id}
                            className={`px-2 py-1 ${
                              isFirstColumn || isActions
                                ? "bg-background sticky left-0 z-10"
                                : ""
                            }`}
                            style={{
                              width: `${columnSize}px`,
                              minWidth: `${columnSize}px`,
                              maxWidth: `${columnSize}px`,
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}

                {/* Add empty rows to ensure minimum 5 rows total, but only if data rows < 5 */}
                {Array.from({
                  length: (() => {
                    const dataRows = table.getRowModel().rows.length
                    return dataRows >= 18 ? 0 : Math.max(0, 18 - dataRows)
                  })(),
                }).map((_, index) => (
                  <TableRow key={`empty-${index}`} className="h-7">
                    {table.getAllLeafColumns().map((column, cellIndex) => {
                      const isActions = column.id === "actions"
                      const isFirstColumn = cellIndex === 0

                      const columnSize = clampColumnSize(
                        column.id,
                        column.getSize()
                      )

                      return (
                        <TableCell
                          key={`empty-${index}-${column.id}`}
                          className={`px-2 py-1 ${
                            isFirstColumn || isActions
                              ? "bg-background sticky left-0 z-10"
                              : ""
                          }`}
                          style={{
                            width: `${columnSize}px`,
                            minWidth: `${columnSize}px`,
                            maxWidth: `${columnSize}px`,
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

                {/* Footer aggregate row per column (e.g. totals) */}
                {table.getRowModel().rows.length > 0 &&
                  columnFooters &&
                  Object.keys(columnFooters).length > 0 && (
                    <TableRow className="h-7 bg-muted/40">
                      {table.getAllLeafColumns().map((column, cellIndex) => {
                        const isActions = column.id === "actions"
                        const isFirstColumn = cellIndex === 0
                        const accessorKey = (column.columnDef as { accessorKey?: string })
                          .accessorKey

                        const columnSize = clampColumnSize(
                          column.id,
                          column.getSize()
                        )

                        return (
                          <TableCell
                            key={`footer-${column.id}`}
                            className={`px-2 py-1 font-semibold ${
                              isFirstColumn || isActions
                                ? "bg-background sticky left-0 z-10"
                                : "text-right"
                            }`}
                            style={{
                              width: `${columnSize}px`,
                              minWidth: `${columnSize}px`,
                              maxWidth: `${columnSize}px`,
                              position:
                                isFirstColumn || isActions
                                  ? "sticky"
                                  : "relative",
                              left: isFirstColumn || isActions ? 0 : "auto",
                              zIndex: isFirstColumn || isActions ? 10 : 1,
                            }}
                          >
                            {accessorKey && columnFooters[accessorKey]
                              ? columnFooters[accessorKey]
                              : isFirstColumn
                                ? "Total"
                                : null}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )}

                {/* Show empty state or loading message when no data */}
                {table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="h-7 py-2 text-center"
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

      <MainTableFooter
        currentPage={currentPage} // Current page number
        totalPages={Math.ceil((totalRecords || data.length) / pageSize)} // Total number of pages
        pageSize={pageSize} // Current page size
        totalRecords={totalRecords || data.length} // Total number of records
        onPageChange={handlePageChange} // Page change handler
        onPageSizeChange={handlePageSizeChange} // Page size change handler
        pageSizeOptions={[50, 100, 500]} // Available page size options
        extraRightContent={footerRightContent}
      />
    </>
  )
}
