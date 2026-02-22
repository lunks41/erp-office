"use client"

// ============================================================================
// IMPORTS SECTION
// ============================================================================

// Drag and Drop functionality
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
// TanStack Table types and utilities
import { Header, flexRender } from "@tanstack/react-table"
// Lucide React icons for sorting indicators
import {
  ArrowDownNarrowWide,
  ArrowUpDown,
  ArrowUpNarrowWide,
} from "lucide-react"

import { cn } from "@/lib/utils"
// Utility functions and UI components
import { Button } from "@/components/ui/button"
import { TableHead } from "@/components/ui/table"

// ============================================================================
// INTERFACE DEFINITION
// ============================================================================

interface SortableTableHeaderProps<TData> {
  header: Header<TData, unknown> // TanStack Table header object
  className?: string
  style?: React.CSSProperties
}

// ============================================================================
// MAIN COMPONENT FUNCTION
// ============================================================================

/**
 * SortableTableHeader - A highly interactive table header component with smooth animations
 *
 * Features:
 * - Smooth drag and drop with visual feedback
 * - Animated sorting indicators
 * - Hover effects and transitions
 * - Column management (resize)
 * - Accessibility support
 * - Performance optimized with CSS transforms
 *
 * @template TData - The type of data in the table
 * @param props - Component props
 * @returns JSX element representing the sortable table header
 */
export function SortableTableHeader<TData>({
  header,
  className,
  style,
}: SortableTableHeaderProps<TData>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.id,
  })

  const isSorted = header.column.getIsSorted()
  const canResize = header.column.getCanResize()
  const isResizing = header.column.getIsResizing()

  const handleSortToggle = header.column.getToggleSortingHandler()

  return (
    <TableHead
      ref={setNodeRef}
      colSpan={header.colSpan}
      style={{
        width: header.getSize(),
        minWidth: header.column.columnDef.minSize,
        maxWidth: header.column.columnDef.maxSize,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        ...style,
      }}
      className={cn(
        "bg-muted group hover:bg-muted/80 sticky top-0 z-30 transition-colors",
        isDragging && "z-10 cursor-grabbing",
        className
      )}
    >
      <div className="flex items-center justify-between pl-3">
        {header.isPlaceholder ? null : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-0.5">
              <div
                {...attributes}
                {...listeners}
                className="flex min-w-0 flex-1 cursor-grab items-center gap-0.5 overflow-hidden active:cursor-grabbing"
                aria-label="Drag to reorder column"
                title="Drag to reorder column"
              >
                <span
                  className="min-w-0 flex-1 font-medium break-words"
                  title={
                    typeof header.column.columnDef.header === "string"
                      ? header.column.columnDef.header
                      : String(header.column.id)
                  }
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-5 shrink-0"
                onClick={handleSortToggle}
                aria-label={`Sort column ${header.column.id}`}
              >
                {isSorted === "asc" && (
                  <ArrowUpNarrowWide className="h-3 w-3" />
                )}
                {isSorted === "desc" && (
                  <ArrowDownNarrowWide className="h-3 w-3" />
                )}
                {!isSorted && <ArrowUpDown className="h-3 w-3" />}
              </Button>
            </div>
          </>
        )}
        <div className="bg-border absolute top-1/2 right-0 h-4 w-px -translate-y-1/2"></div>
        {canResize && (
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={cn(
              "bg-border absolute top-1/2 right-0 h-4 w-px -translate-y-1/2 cursor-col-resize opacity-0 transition-opacity",
              isResizing
            )}
            style={{
              transform: isResizing ? "scaleX(1.5)" : "scaleX(1)",
            }}
            aria-label="Resize column"
          />
        )}
      </div>
    </TableHead>
  )
}
