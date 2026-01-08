"use client"

// ============================================================================
// IMPORTS SECTION
// ============================================================================

// Drag and Drop functionality
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
// Icons from Tabler Icons
import {
  IconArrowLeft,
  IconArrowRight,
  IconDotsVertical,
  IconEye,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from "@tabler/icons-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
 * - Column management (pin, hide, resize)
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
  const canSort = header.column.getCanSort()
  const canHide = header.column.getCanHide()
  const canResize = header.column.getCanResize()
  const isResizing = header.column.getIsResizing()

  const handleSortToggle = header.column.getToggleSortingHandler()
  const handlePinLeft = () => header.column.pin("left")
  const handlePinRight = () => header.column.pin("right")
  const handleToggleVisibility = () => header.column.toggleVisibility()
  const handleClearSort = () => header.column.clearSorting()
  const handleSortAscending = () => header.column.toggleSorting(false)
  const handleSortDescending = () => header.column.toggleSorting(true)

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
        "bg-muted group hover:bg-muted/80 relative transition-colors sticky top-0 z-30",
        isDragging && "z-10 cursor-grabbing",
        className
      )}
    >
      <div className="flex items-center justify-between pl-3">
        {header.isPlaceholder ? null : (
          <>
            <div className="flex items-center">
              <div
                {...attributes}
                {...listeners}
                className="flex cursor-grab items-center active:cursor-grabbing"
                aria-label="Drag to reorder column"
              >
                <span className="font-medium">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-7"
                onClick={handleSortToggle}
                aria-label={`Sort column ${header.column.id}`}
              >
                {isSorted === "asc" && (
                  <ArrowUpNarrowWide className="h-4 w-4" />
                )}
                {isSorted === "desc" && (
                  <ArrowDownNarrowWide className="h-4 w-4" />
                )}
                {!isSorted && <ArrowUpDown className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground h-4 w-4"
                    aria-label="Column options"
                  >
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canHide && (
                    <DropdownMenuItem onClick={handleToggleVisibility}>
                      <IconEye className="mr-2 h-4 w-4" />
                      Hide column
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={handlePinLeft}>
                    <IconArrowLeft className="mr-2 h-4 w-4" />
                    Pin to left
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handlePinRight}>
                    <IconArrowRight className="mr-2 h-4 w-4" />
                    Pin to right
                  </DropdownMenuItem>

                  {canSort && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleClearSort}>
                        <IconX className="mr-2 h-4 w-4" />
                        Clear sort
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSortAscending}>
                        <IconSortAscending className="mr-2 h-4 w-4" />
                        Sort ascending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSortDescending}>
                        <IconSortDescending className="mr-2 h-4 w-4" />
                        Sort descending
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
