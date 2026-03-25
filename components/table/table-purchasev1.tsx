"use client"

import { useCallback, useEffect, useState } from "react"
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { TableName } from "@/lib/utils"
import { useGetGridLayout } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
// Virtual scrolling removed - using empty rows instead

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Checkbox } from "../ui/checkbox"
import { SortableTableHeader } from "./sortable-table-header"
import { PurchaseTableActions } from "./table-purchase-action"
import { PurchaseTableHeader } from "./table-purchase-header"

interface PurchaseBaseTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  tableName: TableName
  emptyMessage?: string
  accessorId: keyof T
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onBulkSelectionChange?: (selectedIds: string[]) => void
  onDataReorder?: (newData: T[]) => void
  isConfirmed?: boolean
  showHeader?: boolean
  showActions?: boolean
  hideCheckbox?: boolean
  disableOnPurchaseExists?: boolean
  initialSelectedIds?: string[]
}

export function PurchaseBaseTable<T>({
  data,
  columns,
  isLoading,
  moduleId,
  transactionId,
  tableName,
  emptyMessage = "No data found.",
  accessorId,
  onRefreshAction,
  onFilterChange,
  onBulkSelectionChange,
  onDataReorder,
  isConfirmed,
  showHeader = true,
  showActions = true,
  hideCheckbox = false,
  disableOnPurchaseExists = true,
  initialSelectedIds = [],
}: PurchaseBaseTableProps<T>) {
  // Always call the hook but pass valid IDs or defaults
  const { data: gridSettings } = useGetGridLayout(
    moduleId && moduleId > 0 ? moduleId.toString() : "0",
    transactionId && transactionId > 0 ? transactionId.toString() : "0",
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

  const [sorting, setSorting] = useState<SortingState>(getInitialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    getInitialColumnVisibility
  )
  const [columnSizing, setColumnSizing] = useState(getInitialColumnSizing)
  const [searchQuery, setSearchQuery] = useState("")

  // Initialize row selection based on initialSelectedIds
  const getInitialRowSelection = useCallback(() => {
    if (initialSelectedIds.length === 0) return {}

    const rowSelectionMap: Record<string, boolean> = {}
    data.forEach((item, index) => {
      const id = String((item as Record<string, unknown>)[accessorId as string])
      if (initialSelectedIds.includes(id)) {
        rowSelectionMap[index.toString()] = true
      }
    })
    return rowSelectionMap
  }, [initialSelectedIds, data, accessorId])

  const [rowSelection, setRowSelection] = useState(getInitialRowSelection)

  // Create a separate component for the drag handle
  function DragHandle({ id }: { id: string | number }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: String(id),
    })

    const style = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <Button
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        variant="ghost"
        size="icon"
        className="text-muted-foreground size-7 cursor-grab hover:bg-transparent active:cursor-grabbing"
      >
        <GripVertical className="text-muted-foreground size-3" />
        <span className="sr-only">Drag to reorder</span>
      </Button>
    )
  }

  useEffect(() => {
    if (gridSettingsData) {
      try {
        const colVisible = JSON.parse(gridSettingsData.grdColVisible || "{}")
        const colSize = JSON.parse(gridSettingsData.grdColSize || "{}")
        const sort = JSON.parse(gridSettingsData.grdSort || "[]")

        setColumnVisibility(colVisible)
        setSorting(sort)

        if (Object.keys(colSize).length > 0) {
          setColumnSizing(colSize)
        }
      } catch (error) {
        console.error("Error parsing grid settings:", error)
      }
    }
  }, [gridSettingsData])

  const tableColumns: ColumnDef<T>[] = [
    ...(showActions
      ? [
          {
            id: "drag-actions",
            header: ({ table }) => {
              const isAllSelected = table.getIsAllRowsSelected()
              const hasSelectedRows =
                table.getSelectedRowModel().rows.length > 0
              const isIndeterminate = hasSelectedRows && !isAllSelected

              // Header checkbox should be checked if any rows are selected
              const headerChecked = hasSelectedRows

              return (
                <div className="flex items-center gap-2 pl-5">
                  {/* ✅ Header "Select All" Checkbox */}
                  {!hideCheckbox && (
                    <Checkbox
                      checked={headerChecked}
                      onCheckedChange={(checked) => {
                        table.toggleAllPageRowsSelected(!!checked)
                      }}
                      className={
                        isIndeterminate
                          ? "data-[state=indeterminate]:bg-primary/50"
                          : "border-primary border-2"
                      }
                    />
                  )}
                  <span className="font-medium">Actions</span>
                </div>
              )
            },
            enableHiding: false,
            size: 140,
            minSize: 120,

            cell: ({ row }: { row: Row<T> }) => {
              const item = row.original

              return (
                <div className="flex min-w-0 items-center gap-0.5 overflow-hidden">
                  {/* Drag Handle */}
                  <DragHandle
                    id={String(
                      (row.original as Record<string, unknown>)[
                        accessorId as string
                      ]
                    )}
                  />

                  {/* Checkbox */}
                  <PurchaseTableActions
                    row={item as T & { purchaseId?: number }}
                    onSelect={(_, checked) => {
                      row.toggleSelected(checked)
                    }}
                    hideCheckbox={hideCheckbox}
                    isSelected={row.getIsSelected()}
                    onCheckboxChange={row.getToggleSelectedHandler()}
                    disableOnPurchaseExists={disableOnPurchaseExists}
                  />
                </div>
              )
            },
          } as ColumnDef<T>,
        ]
      : []),
    ...columns,
  ]

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    enableColumnResizing: true,
    enableRowSelection: true,
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      rowSelection,
      globalFilter: searchQuery,
    },
  })

  // Virtual scrolling removed - using empty rows instead
  const [pageSize] = useState(50) // Fixed page size for empty rows
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (data && data.length > 0) {
      table.setGlobalFilter(query)
    } else if (onFilterChange) {
      const newFilters = {
        search: query,
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      }
      onFilterChange(newFilters)
    }
  }
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      const oldIndex = data.findIndex(
        (item) =>
          String((item as Record<string, unknown>)[accessorId as string]) ===
          active.id
      )
      const newIndex = data.findIndex(
        (item) =>
          String((item as Record<string, unknown>)[accessorId as string]) ===
          over.id
      )

      if (oldIndex !== -1 && newIndex !== -1) {
        const newData = arrayMove(data, oldIndex, newIndex)

        // Call the callback to update the parent component's data
        if (onDataReorder) {
          onDataReorder(newData)
        } else {
          console.warn(
            "onDataReorder callback not provided. Row reordering will not persist."
          )
        }
      }
    }
  }

  // Handle bulk selection change
  useEffect(() => {
    if (onBulkSelectionChange) {
      const selectedRowIds = Object.keys(rowSelection)
      const selectedItems = data.filter((_, index) =>
        selectedRowIds.includes(index.toString())
      )

      // Extract IDs using the accessorId
      const selectedIds = selectedItems
        .map((item) => {
          const id = (item as Record<string, unknown>)[accessorId as string]
          return id ? String(id) : ""
        })
        .filter((id) => id !== "")

      onBulkSelectionChange(selectedIds)
    }
  }, [rowSelection, data, accessorId, onBulkSelectionChange])
  useEffect(() => {
    if (!data?.length && onFilterChange) {
      const filters = {
        search: searchQuery,
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      }
      onFilterChange(filters)
    }
  }, [sorting, searchQuery, data?.length, onFilterChange])

  // Reset row selection when initialSelectedIds or data changes
  useEffect(() => {
    const newRowSelection = getInitialRowSelection()
    setRowSelection(newRowSelection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedIds, data, accessorId])

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

    // Reset column sizes to default
    setColumnSizing({})
  }, [table])

  return (
    <div className="space-y-4">
      {showHeader && (
        <PurchaseTableHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onRefreshAction={onRefreshAction}
          columns={table
            .getHeaderGroups()
            .flatMap((group) => group.headers)
            .map((header) => header.column)}
          tableName={tableName}
          moduleId={moduleId || 1}
          transactionId={transactionId || 1}
          isConfirmed={isConfirmed}
          data={data}
          onResetLayout={handleResetLayout}
        />
      )}

        {/* ============================================================================
          DRAG AND DROP CONTEXT
          ============================================================================ */}

        {/* Wrap table in drag and drop context for column reordering */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* ============================================================================
            TABLE CONTAINER
            ============================================================================ */}

          {/* Main table container with horizontal scrolling */}
          <div className="max-h-[460px] overflow-auto rounded-lg border">
            {/* Column group for consistent sizing */}
            <colgroup>
              {table.getAllLeafColumns().map((col) => (
                <col
                  key={col.id}
                  style={{
                    width: `${col.getSize()}px`,
                    minWidth: `${col.getSize()}px`,
                    maxWidth: `${col.getSize()}px`,
                  }} // Set column width from table state
                />
              ))}
            </colgroup>

            {/* Sticky table header */}
            <TableHeader className="bg-background sticky top-0 z-20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {/* Render each header */}
                  {headerGroup.headers.map((header) => {
                    // Don't use SortableTableHeader for drag-actions column
                    if (header.id === "drag-actions") {
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            width: header.getSize(),
                            minWidth: header.column.columnDef.minSize,
                            maxWidth: header.column.columnDef.maxSize,
                          }}
                          className="bg-muted group hover:bg-muted/80 sticky left-0 z-40 transition-colors"
                        >
                          {header.isPlaceholder ? null : (
                            <div className="flex items-center justify-between pl-3">
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        </TableHead>
                      )
                    }

                    // Use SortableTableHeader for regular columns
                    return (
                      <SortableTableHeader key={header.id} header={header} />
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            {/* Body table with same column sizing as header */}
            <table
              className="w-full table-fixed border-collapse"
              style={{ minWidth: "100%" }}
            >
              <TableBody>
                  {/* ============================================================================
                    DATA ROWS RENDERING
                    ============================================================================ */}

                  {/* Sortable context for row dragging */}
                  <SortableContext
                    items={data.map((item) =>
                      String(
                        (item as Record<string, unknown>)[accessorId as string]
                      )
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {/* Render data rows */}
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <TableRow key={row.id} className="h-7">
                          {row.getVisibleCells().map((cell, cellIndex) => {
                            const isActions = cell.column.id === "drag-actions"
                            const isFirstColumn = cellIndex === 0

                            return (
                              <TableCell
                                key={cell.id}
                                title={String(cell.getValue() ?? "")}
                                className={`py-1 ${
                                  isFirstColumn || isActions
                                    ? "bg-background sticky left-0 z-10"
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
                                <div className="truncate">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </div>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                  </SortableContext>

                  {/* ============================================================================
                    EMPTY ROWS TO FILL PAGE SIZE
                    ============================================================================ */}

                  {/* Add empty rows to fill the remaining space based on page size */}
                  {Array.from({
                    length: Math.max(
                      0,
                      pageSize - table.getRowModel().rows.length
                    ),
                  }).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-7">
                      {table.getAllLeafColumns().map((column, cellIndex) => {
                        const isActions = column.id === "drag-actions"
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
        </DndContext>
    </div>
  )
}
