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
  const isActionsColumn = header.column.id === "actions"
  const canSort = header.column.getCanSort() && !isActionsColumn

  const align =
    (header.column.columnDef.meta as { align?: string } | undefined)?.align ??
    "left"
  const isRightAligned = align === "right"

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
      <div
        className={cn(
          "flex items-center justify-between",
          isRightAligned ? "pr-3" : "pl-3"
        )}
      >
        {header.isPlaceholder ? null : (
          <>
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-0.5",
                isRightAligned && "flex-row-reverse"
              )}
            >
              <div
                {...(!isActionsColumn ? attributes : {})}
                {...(!isActionsColumn ? listeners : {})}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden",
                  !isActionsColumn &&
                    "cursor-grab active:cursor-grabbing"
                )}
                aria-label={
                  !isActionsColumn ? "Drag to reorder column" : undefined
                }
                title={!isActionsColumn ? "Drag to reorder column" : undefined}
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 font-medium truncate",
                    isRightAligned && "text-right"
                  )}
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

              {canSort ? (
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
              ) : null}
            </div>
          </>
        )}
        {canResize ? (
          /* Wide hit area (16px) with narrow visual indicator */
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Resize column"
            className="absolute top-0 right-0 z-10 flex h-full w-4 cursor-col-resize select-none items-center justify-center"
          >
            <div
              className={cn(
                "h-4 rounded-full transition-all duration-150",
                isResizing
                  ? "bg-primary w-1 opacity-100"
                  : "bg-border w-px opacity-0 group-hover:opacity-100"
              )}
            />
          </div>
        ) : (
          <div className="bg-border absolute top-1/2 right-0 h-4 w-px -translate-y-1/2" />
        )}
      </div>
    </TableHead>
  )
}
