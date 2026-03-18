"use client"

// React imports removed as not needed
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

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
}

export function SettingTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data found.",
  maxHeight = "460px",
  pageSize = 15,
}: SettingTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="max-h-[460px] overflow-auto rounded-lg border">
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
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
              {/* Render data rows */}
              {table.getRowModel().rows.map((row) => {
                return (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <TableCell
                        key={cell.id}
                        className={`py-1 ${
                          cellIndex === 0
                            ? "bg-background sticky left-0 z-10"
                            : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}

              {/* Add empty rows to fill the remaining space based on page size */}
              {Array.from({
                length: Math.max(0, pageSize - table.getRowModel().rows.length),
              }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-7">
                  {table.getAllLeafColumns().map((column, cellIndex) => {
                    const isFirstColumn = cellIndex === 0

                    return (
                      <TableCell
                        key={`empty-${index}-${column.id}`}
                        className={`py-1 ${
                          isFirstColumn
                            ? "bg-background sticky left-0 z-10"
                            : ""
                        }`}
                        style={{
                          width: `${column.getSize()}px`,
                          minWidth: `${column.getSize()}px`,
                          maxWidth: `${column.getSize()}px`,
                          position: isFirstColumn ? "sticky" : "relative",
                          left: isFirstColumn ? 0 : "auto",
                          zIndex: isFirstColumn ? 10 : 1,
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
