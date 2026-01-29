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
// Virtual scrolling removed - using empty rows instead

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { SortableTableHeader } from "./sortable-table-header"
import { BasicTableHeader } from "./table-basic-header"
import { MainTableFooter } from "./table-main-footer"

interface BasicTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  moduleId?: number
  transactionId?: number
  tableName: TableName
  emptyMessage?: string
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  initialSearchValue?: string
  showHeader?: boolean
  showFooter?: boolean
  maxHeight?: string
  pageSizeOption?: number
}

export function BasicTable<T>({
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
  showHeader = true,
  showFooter = true,
  maxHeight = "460px",
  pageSizeOption = 50,
}: BasicTableProps<T>) {
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
    // First, check for saved grid settings
    if (gridSettingsData?.grdColVisible) {
      try {
        return JSON.parse(gridSettingsData.grdColVisible) || {}
      } catch {
        return {}
      }
    }
    // If no saved settings, check columns for hidden property
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
  const [searchQuery, setSearchQuery] = useState(initialSearchValue || "")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(pageSizeOption)
  const [rowSelection, setRowSelection] = useState({})

  // Reference removed as not needed without virtual scrolling

  useEffect(() => {
    if (gridSettingsData) {
      try {
        const hasColVisible =
          typeof gridSettingsData.grdColVisible === "string" &&
          gridSettingsData.grdColVisible.trim().length > 0

        const colVisible = hasColVisible
          ? JSON.parse(gridSettingsData.grdColVisible as string)
          : undefined

        const colSize =
          typeof gridSettingsData.grdColSize === "string" &&
          gridSettingsData.grdColSize.trim().length > 0
            ? JSON.parse(gridSettingsData.grdColSize as string)
            : {}

        const sort =
          typeof gridSettingsData.grdSort === "string" &&
          gridSettingsData.grdSort.trim().length > 0
            ? JSON.parse(gridSettingsData.grdSort as string)
            : []

        // Only override visibility if we actually have saved visibility settings.
        // This preserves the default "hidden" columns when no layout is saved yet.
        if (colVisible) {
          setColumnVisibility((prev) => {
            const newVisibility =
              JSON.stringify(prev) !== JSON.stringify(colVisible)
                ? colVisible
                : prev
            return newVisibility
          })
        }

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
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    enableRowSelection: true,
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
      globalFilter: searchQuery,
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

  // Virtual scrolling removed - using empty rows instead

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    table.setPageIndex(page - 1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    table.setPageSize(size)
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
    <>
      {showHeader && (
        <BasicTableHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onRefreshAction={onRefreshAction}
          //columns={table.getAllLeafColumns()}
          columns={table
            .getHeaderGroups()
            .flatMap((group) => group.headers)
            .map((header) => header.column)}
          data={data}
          tableName={tableName}
          moduleId={moduleId || 1}
          transactionId={transactionId || 1}
          onResetLayout={handleResetLayout}
        />
      )}
      <Table>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto rounded-lg border">
            <Table
              className="w-full table-fixed border-collapse"
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
                      {headerGroup.headers.map((header) => (
                        <SortableTableHeader key={header.id} header={header} />
                      ))}
                    </SortableContext>
                  </TableRow>
                ))}
              </TableHeader>
            </Table>

            <div className="overflow-y-auto" style={{ maxHeight: maxHeight }}>
              <Table
                className="w-full table-fixed border-collapse"
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

                <TableBody>
                  {/* Render data rows */}
                  {table.getRowModel().rows.map((row) => {
                    return (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell, cellIndex) => {
                          const isActions = cell.column.id === "actions"
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
                    )
                  })}

                  {/* Add empty rows to fill the remaining space based on page size */}
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

                  {/* Show empty state or loading message when no data */}
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
              </Table>
            </div>
          </div>
        </DndContext>
      </Table>

      {showFooter && (
        <MainTableFooter
          currentPage={currentPage}
          totalPages={Math.ceil(data.length / pageSize)}
          pageSize={pageSize}
          totalRecords={data.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[10, 50, 100, 500]}
        />
      )}
    </>
  )
}
