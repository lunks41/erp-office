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
import { IconGripVertical } from "@tabler/icons-react"
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
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Checkbox } from "../ui/checkbox"
import { SortableTableHeader } from "./sortable-table-header"
import { AccountTableActions } from "./table-account-action"
import { AccountTableHeader } from "./table-account-header"

interface AccountBaseTableProps<T> {
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
  onSelect?: (item: T | null) => void
  onEditAction?: (item: T) => void
  onDeleteAction?: (itemId: string) => void
  onBulkDeleteAction?: (selectedIds: string[]) => void
  onBulkSelectionChange?: (selectedIds: string[]) => void
  onDataReorder?: (newData: T[]) => void
  isConfirmed?: boolean
  showHeader?: boolean
  showActions?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
  hideCheckbox?: boolean
  disableOnAccountExists?: boolean
  initialSelectedIds?: string[]
  maxHeight?: string
  pageSizeOption?: number
}

export function AccountBaseTable<T>({
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
  onSelect,
  onEditAction,
  onDeleteAction,
  onBulkDeleteAction,
  onBulkSelectionChange,
  onDataReorder,
  isConfirmed,
  showHeader = true,
  showActions = true,
  hideEdit = false,
  hideDelete = false,
  hideCheckbox = false,
  disableOnAccountExists = true,
  initialSelectedIds = [],
  maxHeight = "100%",
  pageSizeOption = 50,
}: AccountBaseTableProps<T>) {
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
    // If no saved settings, respect columns' hidden property (e.g. opening balance Id columns)
    const initialVisibility: VisibilityState = {}
    columns.forEach((col) => {
      const colMeta = col as {
        id?: string
        accessorKey?: string
        hidden?: boolean
      }
      const key = colMeta.id || colMeta.accessorKey
      if (key && colMeta.hidden === true) {
        initialVisibility[key] = false
      }
    })
    return initialVisibility
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

  const selectedRowsCount = Object.keys(rowSelection).length
  const hasSelectedRows = selectedRowsCount > 0

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
        <IconGripVertical className="text-muted-foreground size-3" />
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
    ...(showActions && (onSelect || onEditAction || onDeleteAction)
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
                          : ""
                      }
                    />
                  )}
                  <span className="font-medium">Actions</span>
                </div>
              )
            },
            enableHiding: false,
            size: 160,
            minSize: 150,

            cell: ({ row }: { row: Row<T> }) => {
              const item = row.original

              return (
                <div className="flex items-center gap-2">
                  {/* Drag Handle */}
                  <DragHandle
                    id={String(
                      (row.original as Record<string, unknown>)[
                        accessorId as string
                      ]
                    )}
                  />

                  {/* Action Buttons */}
                  <AccountTableActions
                    row={item as T & { debitNoteId?: number }}
                    onEditAction={onEditAction}
                    onDeleteAction={onDeleteAction}
                    onSelect={(_, checked) => {
                      row.toggleSelected(checked)
                    }}
                    idAccessor={accessorId}
                    hideEdit={hideEdit}
                    hideDelete={hideDelete}
                    hideCheckbox={hideCheckbox}
                    isSelected={row.getIsSelected()}
                    onCheckboxChange={row.getToggleSelectedHandler()}
                    disableOnAccountExists={disableOnAccountExists}
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

  const [pageSize] = useState(pageSizeOption)
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
        }
      }
    }
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (!onBulkDeleteAction) return

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

    onBulkDeleteAction(selectedIds)
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

  // Clear row selection when data becomes empty
  useEffect(() => {
    if (!data?.length) {
      setRowSelection({})
    }
  }, [data?.length])

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

  const rowModel = table.getRowModel().rows
  const isTableEmpty = rowModel.length === 0
  const fillerRowCount = Math.max(
    0,
    pageSize - (isTableEmpty ? 1 : rowModel.length)
  )

  return (
    <div className="space-y-4">
      {showHeader && (
        <AccountTableHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onRefreshAction={onRefreshAction}
          onBulkDeleteAction={handleBulkDelete}
          columns={table
            .getHeaderGroups()
            .flatMap((group) => group.headers)
            .map((header) => header.column)}
          tableName={tableName}
          moduleId={moduleId || 1}
          transactionId={transactionId || 1}
          hasSelectedRows={hasSelectedRows}
          selectedRowsCount={selectedRowsCount}
          isConfirmed={isConfirmed}
          data={data}
          onResetLayout={handleResetLayout}
        />
      )}

      <div
        className="relative overflow-x-auto overflow-y-auto rounded-lg border"
        style={{ maxHeight: maxHeight, scrollbarGutter: "stable" }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
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

              {/* Sticky Header */}
              <TableHeader className="bg-background sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => {
                      if (header.id === "drag-actions") {
                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            style={{
                              width: header.getSize(),
                              minWidth: header.column.columnDef.minSize,
                              maxWidth: header.column.columnDef.maxSize,
                              position: "sticky",
                              top: 0,
                              left: 0,
                              zIndex: 50,
                            }}
                            className="bg-muted group hover:bg-muted/80 relative transition-colors"
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
                      return (
                        <SortableTableHeader key={header.id} header={header} />
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>

              {/* Scrollable Body */}
              <TableBody>
                <SortableContext
                  items={data.map((item) =>
                    String(
                      (item as Record<string, unknown>)[accessorId as string]
                    )
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {rowModel.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isActions = cell.column.id === "drag-actions"
                        const isFirstColumn = cellIndex === 0

                        return (
                          <TableCell
                            key={cell.id}
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}

                  {/* Empty State */}
                  {isTableEmpty && (
                    <TableRow>
                      <TableCell
                        colSpan={tableColumns.length}
                        className="h-7 text-center"
                      >
                        {isLoading ? "Loading..." : emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Empty Rows */}
                  {Array.from({ length: fillerRowCount }).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-7">
                      {table.getAllLeafColumns().map((column, cellIndex) => {
                        const isActions = column.id === "drag-actions"
                        const isFirstColumn = cellIndex === 0

                        return (
                          <TableCell
                            key={`empty-${index}-${column.id}`}
                            className={`py-1 ${
                              isFirstColumn || isActions
                                ? "bg-background sticky left-0 z-10"
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
                          />
                        )
                      })}
                    </TableRow>
                  ))}
                </SortableContext>
              </TableBody>
            </table>
        </DndContext>
      </div>
    </div>
  )
}
