"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { IJobOrderHd } from "@/interfaces/checklist"
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
import { arrayMove } from "@dnd-kit/sortable"
import {
  ColumnDef,
  ColumnFiltersState,
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
import { TaskTableActions } from "./table-task-action"
import { TaskTableHeader } from "./table-task-header"

interface TaskTableProps<T> {
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
  onCreateAction?: () => void
  onEditAction?: (item: T) => void
  onDeleteAction?: (itemId: string) => void
  onBulkDeleteAction?: (selectedIds: string[]) => void
  onDebitNoteAction?: (itemId: string, debitNoteNo?: string) => void
  onPurchaseAction?: (itemId: string) => void
  onCombinedService?: (selectedIds: string[]) => void
  onCloneTask?: (selectedIds: string[]) => void
  onCloneRow?: (row: T) => void
  isConfirmed?: boolean
  showHeader?: boolean
  showActions?: boolean
  jobData?: IJobOrderHd | null // Job order data for document upload
  transactionIdForDocuments?: number // Transaction ID for document upload
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
  tableContainerClassName?: string
}
export function TaskTable<T>({
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
  onCreateAction,
  onEditAction,
  onDeleteAction,
  onBulkDeleteAction,
  onDebitNoteAction,
  onPurchaseAction,
  onCombinedService,
  onCloneTask,
  onCloneRow,
  isConfirmed,
  showHeader = true,
  showActions = true,
  jobData,
  transactionIdForDocuments,
  canView = true,
  canEdit = true,
  canDelete = true,
  canCreate: _canCreate = true,
  canDebitNote = true,
  tableContainerClassName = "rounded-none border-0 bg-transparent shadow-none",
}: TaskTableProps<T>) {
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
  const [sorting, setSorting] = useState<SortingState>(getInitialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    getInitialColumnVisibility
  )
  const [columnSizing, setColumnSizing] = useState(getInitialColumnSizing)
  const [searchQuery, setSearchQuery] = useState("")
  const [rowSelection, setRowSelection] = useState({})
  const selectedRowsCount = Object.keys(rowSelection).length
  const hasSelectedRows = selectedRowsCount > 0
  const hasValidDebitNoteIds = useMemo(() => {
    if (!hasSelectedRows || !data) return false
    const selectedRowIds = Object.keys(rowSelection)
    const selectedRows = data.filter((_, index) =>
      selectedRowIds.includes(index.toString())
    )
    return selectedRows.every(
      (row) =>
        (row as T & { debitNoteId?: number }).debitNoteId &&
        (row as T & { debitNoteId?: number }).debitNoteId! > 0
    )
  }, [hasSelectedRows, data, rowSelection])

  // Check if ANY selected item has a debitNoteId (to prevent bulk delete)
  const hasAnyDebitNoteId = useMemo(() => {
    if (!hasSelectedRows || !data) return false
    const selectedRowIds = Object.keys(rowSelection)
    const selectedRows = data.filter((_, index) =>
      selectedRowIds.includes(index.toString())
    )
    return selectedRows.some(
      (row) =>
        (row as T & { debitNoteId?: number }).debitNoteId &&
        (row as T & { debitNoteId?: number }).debitNoteId! > 0
    )
  }, [hasSelectedRows, data, rowSelection])
  const selectedRowIds = useMemo(() => {
    if (!hasSelectedRows || !data) return []
    const selectedIndices = Object.keys(rowSelection)
    return selectedIndices.map((index) => {
      const item = data[parseInt(index)]
      if (!item) return index

      const valueFromAccessor = (item as Record<string, unknown>)[
        accessorId as string
      ]

      const fallbackId =
        (item as T & { id?: number; taskId?: number; portExpenseId?: number })
          .id ||
        (item as T & { id?: number; taskId?: number; portExpenseId?: number })
          .taskId ||
        (item as T & { id?: number; taskId?: number; portExpenseId?: number })
          .portExpenseId ||
        index

      const id = valueFromAccessor ?? fallbackId
      return id?.toString() ?? index
    })
  }, [hasSelectedRows, data, rowSelection, accessorId])
  const handleCombinedService = useCallback(() => {
    if (selectedRowIds.length === 0) {
      return
    }
    if (onCombinedService) {
      onCombinedService(selectedRowIds)
    }
  }, [selectedRowIds, onCombinedService])

  const handleCloneTask = useCallback(() => {
    if (selectedRowIds.length === 0) {
      return
    }
    if (onCloneTask) {
      onCloneTask(selectedRowIds)
    }
  }, [selectedRowIds, onCloneTask])

  const handleBulkDelete = useCallback(() => {
    if (selectedRowIds.length === 0) {
      return
    }
    if (onBulkDeleteAction) {
      onBulkDeleteAction(selectedRowIds)
    }
  }, [selectedRowIds, onBulkDeleteAction])

  const handleDebitNoteFromActions = useCallback(
    (id: string) => {
      if (onDebitNoteAction) {
        onDebitNoteAction(id, "")
      }
    },
    [onDebitNoteAction]
  )
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
            id: "actions",
            header: ({ table }) => {
              const isAllSelected = table.getIsAllRowsSelected()
              const hasSelectedRows =
                table.getSelectedRowModel().rows.length > 0
              const isIndeterminate = hasSelectedRows && !isAllSelected
              // Header checkbox should be checked if any rows are selected
              const headerChecked = hasSelectedRows
              return (
                <div className="flex min-w-0 items-center gap-0.5 overflow-hidden">
                  {/* ✅ Header "Select All" Checkbox */}
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
                  <span className="font-medium">Actions</span>
                </div>
              )
            },
            enableHiding: false,
            size: 220,
            minSize: 200,
            cell: ({ row }) => {
              const item = row.original
              const isSelected = row.getIsSelected()
              return (
                <TaskTableActions
                  row={
                    item as T & { debitNoteId?: number; debitNoteNo?: string }
                  }
                  idAccessor={accessorId}
                  onView={onSelect}
                  onEditAction={onEditAction}
                  onDeleteAction={onDeleteAction}
                  onCloneAction={(cloneRow) => {
                    if (onCloneRow) {
                      onCloneRow(cloneRow as T)
                      return
                    }
                    if (!onEditAction) return
                    const cloned = {
                      ...(cloneRow as Record<string, unknown>),
                      [accessorId as string]: 0,
                    } as T
                    onEditAction(cloned)
                  }}
                  onDebitNoteAction={handleDebitNoteFromActions}
                  onPurchaseAction={onPurchaseAction}
                  onSelect={(_, checked) => {
                    row.toggleSelected(checked)
                  }}
                  isSelected={isSelected}
                  isConfirmed={isConfirmed}
                  hideView={!canView}
                  hideEdit={!canEdit}
                  hideDelete={!canDelete}
                  hideDebitNote={!canDebitNote}
                  hidePurchase={!canDebitNote}
                />
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
  const [pageSize] = useState(20) // Fixed page size for empty rows
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
      const oldIndex = table
        .getAllColumns()
        .findIndex((col) => col.id === active.id)
      const newIndex = table
        .getAllColumns()
        .findIndex((col) => col.id === over.id)
      const newColumnOrder = arrayMove(
        table.getAllColumns(),
        oldIndex,
        newIndex
      )
      table.setColumnOrder(newColumnOrder.map((col) => col.id))
    }
  }
  useEffect(() => {
    if (!data?.length && onFilterChange) {
      const filters = {
        search: searchQuery,
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      }
      onFilterChange(filters)
    }
  }, [sorting, searchQuery, data?.length, onFilterChange])

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
    <div className="flex flex-col gap-1">
      {showHeader && (
        <TaskTableHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onRefreshAction={onRefreshAction}
          onCreateAction={onCreateAction}
          //columns={table.getAllLeafColumns()}
          columns={table
            .getHeaderGroups()
            .flatMap((group) => group.headers)
            .map((header) => header.column)}
          tableName={tableName}
          moduleId={moduleId || 1}
          transactionId={transactionId || 1}
          onCombinedService={handleCombinedService}
          onCloneTask={handleCloneTask}
          onBulkDeleteAction={handleBulkDelete}
          onDebitNoteAction={(debitNoteNo, selectedIds) => {
            if (selectedIds && selectedIds.length > 0 && onDebitNoteAction) {
              onDebitNoteAction(selectedIds.join(","), debitNoteNo || "")
            }
          }}
          hasSelectedRows={hasSelectedRows}
          selectedRowsCount={selectedRowsCount}
          hasValidDebitNoteIds={hasValidDebitNoteIds}
          hasAnyDebitNoteId={hasAnyDebitNoteId}
          isConfirmed={isConfirmed}
          selectedRowIds={selectedRowIds}
          hideColumnsOnDebitNote={["edit", "delete", "purchase"]} // Example: hide these columns when debit note exists
          hasDebitNoteInSelection={hasValidDebitNoteIds}
          data={data}
          onResetLayout={handleResetLayout}
          jobData={jobData}
          transactionIdForDocuments={transactionIdForDocuments}
          canDebitNote={canDebitNote}
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
          {/* Single container: overflow-auto gives both H+V scrollbars at the container edge */}
          <div
            className={`max-h-[460px] overflow-auto ${tableContainerClassName}`}
          >
            {/* Use <table> directly — <Table> wraps in overflow-x-auto div which breaks scrollbar positioning */}
            <table
              className="w-full table-fixed border-collapse caption-bottom text-sm"
              style={{ minWidth: "100%" }}
            >
              {/* Column group for consistent sizing */}
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
              {/* Sticky table header */}
              <TableHeader className="bg-background sticky top-0 z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => {
                      if (header.id === "actions") {
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
                      return (
                        <SortableTableHeader key={header.id} header={header} />
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {/* Render data rows */}
                {table.getRowModel().rows.map((row) => {
                  return (
                    <TableRow key={row.id} className="h-7">
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isActions = cell.column.id === "actions"
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
                {/* Empty rows to fill page size */}
                {Array.from({
                  length: Math.max(
                    0,
                    pageSize - table.getRowModel().rows.length
                  ),
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
                              ? "bg-background sticky left-0 z-10"
                              : ""
                          }`}
                          style={{
                            width: `${column.getSize()}px`,
                            minWidth: `${column.getSize()}px`,
                            maxWidth: `${column.getSize()}px`,
                            position:
                              isFirstColumn || isActions ? "sticky" : "relative",
                            left: isFirstColumn || isActions ? 0 : "auto",
                            zIndex: isFirstColumn || isActions ? 10 : 1,
                          }}
                        />
                      )
                    })}
                  </TableRow>
                ))}
                {/* Empty state */}
                {table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="h-7 text-center"
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
