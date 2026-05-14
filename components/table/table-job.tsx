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

import { TableName } from "@/lib/utils"
import { useGetGridLayout } from "@/hooks/use-settings"
import {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SortableTableHeader } from "./sortable-table-header"
import { JobTableHeader } from "./table-job-header"
import { MainTableFooter } from "./table-main-footer"

interface JobTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  tableName: TableName
  emptyMessage?: string
  onRefreshAction?: () => void
  onCreateAction?: () => void
  hideCreateButton?: boolean
  tableHeightClassName?: string
  tableContainerClassName?: string
}

export function JobTable<T>({
  data,
  columns,
  isLoading,
  moduleId,
  transactionId,
  tableName,
  emptyMessage = "No data found.",
  onRefreshAction,
  onCreateAction,
  tableHeightClassName = "",
  tableContainerClassName,
}: JobTableProps<T>) {
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [rowSelection, setRowSelection] = useState({})
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (gridSettingsData) {
      try {
        const colVisible = JSON.parse(gridSettingsData.grdColVisible || "{}")
        const colSize = JSON.parse(gridSettingsData.grdColSize || "{}")
        const sort = JSON.parse(gridSettingsData.grdSort || "[]")

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
      } catch (error) {
        console.error("Error parsing grid settings:", error)
      }
    }
  }, [gridSettingsData])

  const tableColumns: ColumnDef<T>[] = [...columns]

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount: Math.ceil(data.length / pageSize),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    enableRowSelection: true,
    enableGlobalFilter: true,
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      rowSelection,
      globalFilter: searchQuery,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
  })

  useEffect(() => {
    if (gridSettingsData && table) {
      try {
        const colOrder = JSON.parse(gridSettingsData.grdColOrder || "[]")
        if (colOrder.length > 0) {
          table.setColumnOrder(colOrder)
        }
      } catch (error) {
        console.error("Error parsing column order:", error)
      }
    }
  }, [gridSettingsData, table])

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    table.setPageIndex(page - 1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    table.setPageSize(size)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Apply global search across all columns
    table.setGlobalFilter(query)
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
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      {/* Table Header with Search, Export, and Column Management */}
      <JobTableHeader
        onRefreshAction={onRefreshAction}
        onCreateAction={onCreateAction}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        columns={table.getAllColumns()}
        data={data}
        tableName={tableName}
        moduleId={moduleId || 0}
        transactionId={transactionId || 0}
        onResetLayout={handleResetLayout}
      />

      <div className="min-h-0 flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div
              className={`${tableHeightClassName} min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-border/80 bg-background shadow-xs ${tableContainerClassName ?? ""}`}
            >
            {/* Fixed Header */}
            <table
              className="min-w-full border-collapse"
              style={{ width: table.getTotalSize() }}
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

                <TableHeader className="bg-background">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-muted/50">
                      <SortableContext
                        items={headerGroup.headers.map((header) => header.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header, headerIndex) => {
                          const isFirstColumn = headerIndex === 0
                          const isActions = header.id === "actions"
                          const isJobNo = header.id === "jobOrderNo"

                          return (
                            <SortableTableHeader
                              key={header.id}
                              header={header}
                              className={
                                isFirstColumn || isActions || isJobNo
                                  ? "bg-background sticky left-0 z-40"
                                  : ""
                              }
                              style={
                                isFirstColumn || isActions || isJobNo
                                  ? {
                                      position: "sticky",
                                      left: 0,
                                      zIndex: 40,
                                    }
                                  : {}
                              }
                            />
                          )
                        })}
                      </SortableContext>
                    </TableRow>
                  ))}
                </TableHeader>

                {/* Scrollable Body */}
                <TableBody>
                  {table.getRowModel().rows.map((row) => {
                    return (
                      <TableRow key={row.id} className="h-7">
                        {row.getVisibleCells().map((cell, cellIndex) => {
                          const isActions = cell.column.id === "actions"
                          const isFirstColumn = cellIndex === 0
                          const isJobNo = cell.column.id === "jobOrderNo"

                          return (
                            <TableCell
                              key={cell.id}
                              title={String(cell.getValue() ?? "")}
                              className={`py-1 ${
                                isFirstColumn || isActions || isJobNo
                                  ? "bg-background sticky left-0 z-20"
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
                                  isFirstColumn || isActions || isJobNo
                                    ? "sticky"
                                    : "relative",
                                left:
                                  isFirstColumn || isActions || isJobNo
                                    ? 0
                                    : "auto",
                                zIndex:
                                  isFirstColumn || isActions || isJobNo
                                    ? 20
                                    : 1,
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
                        const isJobNo = column.id === "jobOrderNo"

                        return (
                          <TableCell
                            key={`empty-${index}-${column.id}`}
                            className={`py-1 ${
                              isFirstColumn || isActions || isJobNo
                                ? "bg-background sticky left-0 z-20"
                                : ""
                            }`}
                            style={{
                              width: `${column.getSize()}px`,
                              minWidth: `${column.getSize()}px`,
                              maxWidth: `${column.getSize()}px`,
                              position:
                                isFirstColumn || isActions || isJobNo
                                  ? "sticky"
                                  : "relative",
                              left:
                                isFirstColumn || isActions || isJobNo
                                  ? 0
                                  : "auto",
                              zIndex:
                                isFirstColumn || isActions || isJobNo ? 20 : 1,
                            }}
                          />
                        )
                      })}
                    </TableRow>
                  ))}

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
          </div>
        </DndContext>
      </div>
      <div className="mt-1.5 shrink-0">
        <MainTableFooter
          currentPage={currentPage}
          totalPages={Math.ceil(data.length / pageSize)}
          pageSize={pageSize}
          totalRecords={data.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[50, 100, 500]}
        />
      </div>
    </div>
  )
}
