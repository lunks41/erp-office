"use client"

// React imports removed as not needed
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "@/lib/utils"

// Virtual scrolling removed - using empty rows instead

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SettingTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  emptyMessage?: string
  maxHeight?: string
  pageSize?: number
  /**
   * Number of columns (from the left) to freeze using CSS `position: sticky`.
   * Defaults to 1 to preserve existing behavior.
   */
  stickyColumnCount?: number
  /** Extra classes applied to the outer scroll container (overrides inline height/maxHeight when provided). */
  className?: string
}

export function SettingTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data found.",
  maxHeight = "460px",
  pageSize = 15,
  stickyColumnCount = 1,
  className,
}: SettingTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const leafColumns = table.getAllLeafColumns()
  const stickyCount = Math.max(
    0,
    Math.min(stickyColumnCount, leafColumns.length)
  )

  // Pre-compute left offsets for each sticky column based on configured sizes.
  const leftOffsets: number[] = []
  let acc = 0
  for (let i = 0; i < stickyCount; i++) {
    leftOffsets[i] = acc
    acc += leafColumns[i]?.getSize?.() ?? 0
  }

  return (
    <div
      className={cn("overflow-auto rounded-lg border", className)}
      style={!className ? { height: maxHeight, maxHeight } : undefined}
    >
        <table className="w-full table-fixed border-collapse">
        {/* Column group for consistent sizing */}
        <colgroup>
          {table.getAllLeafColumns().map((col) => (
            <col key={col.id} style={{ width: `${col.getSize()}px` }} />
          ))}
        </colgroup>

        {/* Sticky table header */}
        <TableHeader className="bg-background sticky top-0 z-20">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/50">
              {headerGroup.headers.map((header, headerIndex) => {
                const isSticky = headerIndex < stickyCount && !header.isPlaceholder
                const isStickyBoundary = headerIndex === stickyCount - 1
                const left = leftOffsets[headerIndex] ?? 0

                return (
                <TableHead
                  key={header.id}
                  className={
                    isSticky
                      ? `bg-muted ${isStickyBoundary ? "border-r border-border/80 shadow-[2px_0_6px_-3px_rgba(0,0,0,0.22)]" : ""}`
                      : undefined
                  }
                  style={
                    isSticky
                      ? {
                          position: "sticky",
                          left: `${left}px`,
                          zIndex: 30 - headerIndex,
                        }
                      : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
              {/* Render data rows */}
              {table.getRowModel().rows.map((row) => {
                return (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const isSticky = cellIndex < stickyCount
                      const isStickyBoundary = cellIndex === stickyCount - 1
                      const column = leafColumns[cellIndex]

                      return (
                      <TableCell
                        key={cell.id}
                        className={`py-1 ${
                          isSticky
                            ? `bg-background ${isStickyBoundary ? "border-r border-border/80 shadow-[2px_0_6px_-3px_rgba(0,0,0,0.18)]" : ""}`
                            : ""
                        }`}
                        style={
                          isSticky
                            ? {
                                width: `${column.getSize()}px`,
                                minWidth: `${column.getSize()}px`,
                                maxWidth: `${column.getSize()}px`,
                                position: "sticky",
                                left: `${leftOffsets[cellIndex] ?? 0}px`,
                                zIndex: stickyCount - cellIndex + 1,
                              }
                            : undefined
                        }
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
                length: Math.max(0, pageSize - table.getRowModel().rows.length),
              }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-7">
                  {table.getAllLeafColumns().map((column, cellIndex) => {
                    const isSticky = cellIndex < stickyCount
                    const isStickyBoundary = cellIndex === stickyCount - 1

                    return (
                      <TableCell
                        key={`empty-${index}-${column.id}`}
                        className={`py-1 ${
                          isSticky
                            ? `bg-background ${isStickyBoundary ? "border-r border-border/80 shadow-[2px_0_6px_-3px_rgba(0,0,0,0.18)]" : ""}`
                            : ""
                        }`}
                        style={{
                          width: `${column.getSize()}px`,
                          minWidth: `${column.getSize()}px`,
                          maxWidth: `${column.getSize()}px`,
                          position: isSticky ? "sticky" : "relative",
                          left: isSticky ? `${leftOffsets[cellIndex] ?? 0}px` : "auto",
                          zIndex: isSticky ? stickyCount - cellIndex + 1 : 0,
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
                    colSpan={columns.length}
                    className="h-7 text-center"
                  >
                    {isLoading ? "Loading..." : emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
        </table>
      </div>
  )
}
