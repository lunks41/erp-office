import React from "react"

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MainTableFooterProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalRecords: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  extraRightContent?: React.ReactNode
}

export function MainTableFooter({
  currentPage,
  totalPages,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [50, 100, 500],
  extraRightContent,
}: MainTableFooterProps) {
  return (
    <div className="sticky bottom-0 z-20 mt-1 bg-background pt-2">
      {/* Top line: records + optional total amount (or other summary) */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex-1 text-sm">
          <span>
            {totalRecords} record{totalRecords !== 1 ? "s" : ""} | Page{" "}
            {currentPage} of {totalPages || 1}
          </span>
        </div>
        {extraRightContent && (
          <div className="text-right text-sm font-semibold">
            {extraRightContent}
          </div>
        )}
      </div>

      {/* Second line: rows-per-page + pager controls */}
      <div className="mt-1 flex items-center justify-between">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <span className="text-muted-foreground text-sm">
              Rows per page:
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                onPageSizeChange(Number(value))
                onPageChange(1) // Reset to first page when changing page size
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pagination controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First Page"
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous Page"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Next Page"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last Page"
            className="h-8 w-8"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
