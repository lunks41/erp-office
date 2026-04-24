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

interface AccountBaseTablev1Props<T> {
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
  onCloneAction?: (item: T) => void
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
  /** When false, headers do not reorder rows (keeps drag order and seqNo aligned). */
  enableSorting?: boolean
  /** When true, the second column (after drag-actions) is frozen/sticky. */
  freezeSecondColumn?: boolean
}

export function AccountBaseTablev1<T>({
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
  onCloneAction,
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
  maxHeight = "460px",
  pageSizeOption = 50,
  enableSorting = true,
  freezeSecondColumn = false,
}: AccountBaseTablev1Props<T>) {
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
    ...(showActions &&
    (onSelect || onEditAction || onDeleteAction || onCloneAction)
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
            size: 160,
            minSize: 150,

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

                  {/* Action Buttons */}
                  <AccountTableActions
                    row={item as T & { debitNoteId?: number }}
                    onEditAction={onEditAction}
                    onDeleteAction={onDeleteAction}
                    onCloneAction={onCloneAction}
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
    enableSorting,
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

    if (!onDataReorder || !active || !over || active.id === over.id) {
      return
    }

    const idKey = accessorId as string
    const modelRows = table.getRowModel().rows

    const indexInModel = (id: string | number) =>
      modelRows.findIndex(
        (r) =>
          String((r.original as Record<string, unknown>)[idKey]) === String(id)
      )

    const oldModelIndex = indexInModel(active.id)
    const newModelIndex = indexInModel(over.id)

    if (oldModelIndex === -1 || newModelIndex === -1) {
      return
    }

    if (modelRows.length === data.length) {
      const visualOrder = modelRows.map((r) => r.original as T)
      onDataReorder(arrayMove(visualOrder, oldModelIndex, newModelIndex))
      return
    }

    const oldDataIndex = data.findIndex(
      (item) =>
        String((item as Record<string, unknown>)[idKey]) === String(active.id)
    )
    const newDataIndex = data.findIndex(
      (item) =>
        String((item as Record<string, unknown>)[idKey]) === String(over.id)
    )

    if (oldDataIndex !== -1 && newDataIndex !== -1) {
      onDataReorder(arrayMove(data, oldDataIndex, newDataIndex))
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

  const dragActionsWidth = table.getColumn("drag-actions")?.getSize() ?? 160

  const rowModel = table.getRowModel().rows
  const isTableEmpty = rowModel.length === 0
  const fillerRowCount = Math.max(
    0,
    pageSize - (isTableEmpty ? 1 : rowModel.length)
  )

  return (
    <div className="flex flex-col gap-1">
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
        className="overflow-auto rounded-lg border border-border/80 bg-background shadow-xs"
        style={{ maxHeight: maxHeight }}
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
                  {headerGroup.headers.map((header, headerIndex) => {
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
                    if (freezeSecondColumn && headerIndex === 1) {
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            width: header.getSize(),
                            minWidth: header.column.columnDef.minSize,
                            maxWidth: header.column.columnDef.maxSize,
                            position: "sticky",
                            left: dragActionsWidth,
                            zIndex: 40,
                          }}
                          className="bg-muted group hover:bg-muted/80 top-0 transition-colors border-r border-border/40"
                        >
                          {header.isPlaceholder ? null : (
                            <div className="flex items-center pl-3">
                              <span className="font-medium">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
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
                items={table
                  .getRowModel()
                  .rows.map((row) =>
                    String(
                      (row.original as Record<string, unknown>)[
                        accessorId as string
                      ]
                    )
                  )}
                strategy={verticalListSortingStrategy}
              >
                {rowModel.map((row) => (
                  <TableRow key={row.id} className="h-7">
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const isActions = cell.column.id === "drag-actions"
                      const isFirstColumn = cellIndex === 0
                      const isFrozenSecond = freezeSecondColumn && cellIndex === 1

                      return (
                        <TableCell
                          key={cell.id}
                          title={String(cell.getValue() ?? "")}
                          className={`py-1 ${
                            isFirstColumn || isActions || isFrozenSecond
                              ? "bg-background z-10"
                              : ""
                          }${isFrozenSecond ? " border-r border-border/40" : ""}`}
                          style={{
                            width: `${cell.column.getSize()}px`,
                            minWidth: `${cell.column.getSize()}px`,
                            maxWidth: `${cell.column.getSize()}px`,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            position:
                              isFirstColumn || isActions || isFrozenSecond
                                ? "sticky"
                                : "relative",
                            left: isFrozenSecond
                              ? dragActionsWidth
                              : isFirstColumn || isActions
                                ? 0
                                : "auto",
                            zIndex: isFirstColumn || isActions || isFrozenSecond ? 10 : 1,
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
                      const isFrozenSecond = freezeSecondColumn && cellIndex === 1

                      return (
                        <TableCell
                          key={`empty-${index}-${column.id}`}
                          className={`py-1 ${
                            isFirstColumn || isActions || isFrozenSecond
                              ? "bg-background z-10"
                              : ""
                          }${isFrozenSecond ? " border-r border-border/40" : ""}`}
                          style={{
                            width: `${column.getSize()}px`,
                            minWidth: `${column.getSize()}px`,
                            maxWidth: `${column.getSize()}px`,
                            position:
                              isFirstColumn || isActions || isFrozenSecond
                                ? "sticky"
                                : "relative",
                            left: isFrozenSecond
                              ? dragActionsWidth
                              : isFirstColumn || isActions
                                ? 0
                                : "auto",
                            zIndex: isFirstColumn || isActions || isFrozenSecond ? 10 : 1,
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
