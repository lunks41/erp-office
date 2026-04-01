// components/table/Table.tsx
"use client"

import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
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
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  CellContext,
  ColumnDef,
  ColumnFiltersState,
  ColumnSizingState,
  Header,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

/* -------------------------------------------------------------------------- */
/*  Types – Fully Type-Safe                                                   */
/* -------------------------------------------------------------------------- */
interface TableMeta<_T extends object> {
  updateData: (rowIndex: number, columnId: string, value: unknown) => void
}

export interface Column<T extends object> {
  accessorKey: string
  header: string
  cell?: (info: CellContext<T, unknown>) => ReactNode // Use TanStack's type
  sortable?: boolean
  size?: number
  minSize?: number
  maxSize?: number
  enableHiding?: boolean
  align?: "left" | "center" | "right"
  editable?: boolean
}

export interface Action<T extends object> {
  label: string
  icon?: ReactNode
  onClick: (row: T) => void
  isVisible?: (row: T) => boolean
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "ghost"
    | "secondary"
    | "link"
}

export interface TableSettings {
  pageSize?: number
  showPagination?: boolean
  enableRowSelection?: boolean
  enableSorting?: boolean
  enableColumnFilters?: boolean
  enableColumnResizing?: boolean
  enableColumnVisibility?: boolean
  enableRowReorder?: boolean
  enableColumnReorder?: boolean
  globalFilterPlaceholder?: string
}

interface TableContainerProps<T extends object> {
  columns: Column<T>[]
  data: T[]
  actions?: Action<T>[]
  settings?: TableSettings
  className?: string
  style?: React.CSSProperties
  onRowReorder?: (newData: T[]) => void
  onRowSelectionChange?: (selectedRows: RowSelectionState) => void
  onResetLayout?: () => void
  initialVisibility?: VisibilityState
  initialColumnSizing?: ColumnSizingState
  onDataUpdate?: (updatedData: T[]) => void
  onColumnSizingChange?: (sizing: ColumnSizingState) => void
  onGlobalSearch?: (value: string) => void
}

/* -------------------------------------------------------------------------- */
/*  Editable Cell Component                                                   */
/* -------------------------------------------------------------------------- */
function EditableCell<T extends object>({
  getValue,
  row: { index },
  column: { id },
  table,
}: CellContext<T, unknown>) {
  const meta = table.options.meta as TableMeta<T>
  const rawValue = getValue()
  const isNumericColumn = [
    "age",
    "salary",
    "experience",
    "bonus",
    "vacationDays",
    "zip",
  ].includes(id)
  const value = isNumericColumn
    ? String(rawValue ?? "")
    : String(rawValue ?? "")

  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (newValue: string) => {
    const parsedValue =
      isNumericColumn && !isNaN(Number(newValue)) ? Number(newValue) : newValue
    meta.updateData(index, id, parsedValue)
  }

  const handleBlur = () => {
    setIsEditing(false)
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="focus:ring-ring h-6 w-full border-0 bg-transparent p-0 text-sm focus:ring-1"
        data-no-dnd="true"
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="h-full w-full cursor-text truncate"
      title={String(value)}
    >
      {value || <span className="text-muted-foreground">...</span>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sortable Row Component                                                    */
/* -------------------------------------------------------------------------- */
function SortableRow<T extends object>({
  row,
  columnOrder,
}: {
  row: Row<T>
  columnOrder: string[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !row.getCanSelect() })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border-border hover:bg-muted/50 border-b transition-colors"
    >
      <SortableContext
        items={columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        {row.getVisibleCells().map((cell) => (
          <DragAlongCell key={cell.id} cell={cell.getContext()} />
        ))}
      </SortableContext>
    </tr>
  )
}

/* -------------------------------------------------------------------------- */
/*  Draggable Header Component (for Column Reorder + Resize)                  */
/* -------------------------------------------------------------------------- */
function DraggableHeader<T extends object>({
  header,
}: {
  header: Header<T, unknown>
}) {
  const isActions = header.column.id === "actions"
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: header.column.id,
      disabled: isActions,
    })

  const commonStyle: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    position: "relative" as const,
    transition: "transform 0.2s ease-in-out",
    zIndex: isDragging ? 1 : 0,
  }

  const headerStyle: CSSProperties = {
    ...commonStyle,
    width: header.getSize(),
  }

  return (
    <th
      colSpan={header.colSpan}
      style={{
        width: header.getSize(),
        position: isActions ? "sticky" : "relative",
        left: isActions ? 0 : undefined,
        zIndex: isActions ? 20 : undefined,
        background: isActions ? "RGBA(12, 11, 9,1)" : undefined, // bg-muted/30 fallback
        backgroundColor: "rgba(15,15,15,0.95)",
        whiteSpace: isActions ? "nowrap" : undefined,
      }}
      className={`px-1 py-0.5 text-center text-xs font-semibold bg-muted/30${isActions ? "sticky-action-header" : ""}`}
    >
      {!isActions ? (
        <div
          ref={setNodeRef}
          style={headerStyle}
          {...attributes}
          className="flex h-full items-center justify-center gap-2 pr-1"
        >
          <div
            className="flex-1 truncate"
            onClick={
              header.column.getCanSort()
                ? header.column.getToggleSortingHandler()
                : undefined
            }
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </div>
          <button
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab text-xs active:cursor-grabbing"
            aria-label="Drag column"
          >
            ≡
          </button>
        </div>
      ) : (
        <div style={{ minHeight: "32px" }} />
      )}
      {header.column.getCanResize() && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            header.getResizeHandler()(e)
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            e.preventDefault()
            header.getResizeHandler()(e)
          }}
          className="absolute right-0"
          style={{
            top: "25%",
            height: "50%",
            width: "4px",
            background: "var(--border)",
            cursor: "col-resize",
            zIndex: 15,
            borderLeft: "1px solid var(--border)",
            borderRadius: "2px",
            pointerEvents: "auto",
          }}
          data-no-dnd="true"
        />
      )}
    </th>
  )
}

/* -------------------------------------------------------------------------- */
/*  Drag-Along Cell (for Column Reorder - cells follow header during drag)    */
/* -------------------------------------------------------------------------- */
function DragAlongCell<T extends object>({
  cell,
}: {
  cell: CellContext<T, unknown>
}) {
  const { setNodeRef, transform, isDragging } = useSortable({
    id: cell.column.id,
  })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transition: "transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  const align =
    (
      cell.column.columnDef.meta as
        | { align?: "left" | "center" | "right" }
        | undefined
    )?.align ?? "left"
  const isActions = cell.column.id === "actions"

  return (
    <td
      ref={setNodeRef}
      style={{
        textAlign: align,
        ...style,
        position: isActions ? "sticky" : undefined,
        left: isActions ? 0 : undefined,
        zIndex: isActions ? 20 : undefined,
        background: isActions ? "rgba(0,0,0,1)" : undefined,
        whiteSpace: isActions ? "nowrap" : undefined,
      }}
      className={`px-1 py-0.5 align-middle text-xs whitespace-nowrap overflow-hidden${isActions ? "sticky-action-cell" : ""}`}
    >
      <div className="truncate">
        {flexRender(cell.column.columnDef.cell, cell)}
      </div>
    </td>
  )
}

/* -------------------------------------------------------------------------- */
/*  TableContainer – Main Component                                           */
/* -------------------------------------------------------------------------- */
export function TableContainer<T extends object>({
  columns,
  data,
  actions = [],
  settings = {
    pageSize: 15,
    showPagination: true,
    enableRowSelection: false,
    enableSorting: true,
    enableColumnFilters: true,
    enableColumnResizing: true,
    enableColumnVisibility: true,
    enableRowReorder: true,
    enableColumnReorder: false,
    globalFilterPlaceholder: "Search...",
  },
  className,
  style,
  onRowReorder,
  onRowSelectionChange,
  onResetLayout,
  initialVisibility = {},
  initialColumnSizing = {},
  onDataUpdate,
  onColumnSizingChange,
  onGlobalSearch,
}: TableContainerProps<T>): React.JSX.Element {
  const resolvedPageSize = settings.pageSize ?? 10
  const visibleRows = 7 // max rows shown at once before scrolling
  const rowHeight = 48 // height of each row in pixels
  /* -------------------------- State -------------------------------------- */
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(initialVisibility)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: resolvedPageSize,
  })
  const [columnSizing, setColumnSizing] =
    useState<ColumnSizingState>(initialColumnSizing)
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "actions",
    ...columns.map((c) => c.accessorKey as string),
  ])

  /* -------------------------- DndKit Sensors ----------------------------- */
  // Call useSensors directly in component body, not inside useMemo
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 15,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  /* -------------------------- Actions Column --------------------------- */
  // Actions column definition (icon-only, drag handle for row reorder)
  const actionsColumn: ColumnDef<T> = useMemo(
    () => ({
      id: "actions",
      header: () => (
        <div
          className="bg-muted/30 sticky left-0 z-20 whitespace-nowrap"
          style={{ minHeight: "32px" }}
        >
          {/* Blank header for actions column */}
        </div>
      ),
      size: 56,
      enableHiding: false,
      enableResizing: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          {settings.enableRowReorder && (
            <span
              className="text-muted-foreground hover:text-foreground cursor-move"
              title="Drag to reorder"
              data-dnd-kit-sortable-handle="true"
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          {actions.map((act, i) =>
            !act.isVisible || act.isVisible(row.original) ? (
              <Button
                key={i}
                variant={act.variant ?? "link"}
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  act.onClick(row.original)
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center"
                tabIndex={0}
                aria-label={
                  typeof act.label === "string" ? act.label : undefined
                }
                data-no-dnd="true"
              >
                {act.icon}
              </Button>
            ) : null
          )}
        </div>
      ),
      meta: { align: "center" },
    }),
    [actions, settings.enableRowReorder]
  )

  /* -------------------------- Map Columns to TanStack ------------------- */
  const tanstackColumns: ColumnDef<T>[] = useMemo(
    () => [
      actionsColumn,
      ...columns.map((col) => ({
        accessorKey: col.accessorKey,
        header: col.header,
        cell: col.editable
          ? EditableCell
          : (info: CellContext<T, unknown>) => {
              const value = String(info.getValue() ?? "")
              // Updated: Use truncate div for fixed overflow handling without affecting height or width
              return (
                <div className="truncate" title={value}>
                  {value || <span className="text-muted-foreground">...</span>}
                </div>
              )
            },
        enableSorting: col.sortable ?? true,
        size: col.size ?? 120, // Fixed default size
        minSize: col.minSize ?? 80, // Fixed min width
        maxSize: col.maxSize ?? 300, // Fixed max width - enforced by TanStack
        enableHiding: col.enableHiding ?? true,
        meta: { align: col.align },
      })),
    ],
    [columns, actionsColumn]
  )

  /* -------------------------- TanStack Table --------------------------- */
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
      columnOrder,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newSel =
        typeof updater === "function" ? updater(rowSelection) : updater
      setRowSelection(newSel)
      onRowSelectionChange?.(newSel)
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: (updater) => {
      const newSizing =
        typeof updater === "function" ? updater(columnSizing) : updater
      setColumnSizing(newSizing)
      onColumnSizingChange?.(newSizing)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: settings.enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: settings.enableColumnFilters
      ? getFilteredRowModel()
      : undefined,
    getPaginationRowModel: settings.showPagination
      ? getPaginationRowModel()
      : undefined,
    enableRowSelection: settings.enableRowSelection,
    enableMultiRowSelection: true,
    columnResizeMode: settings.enableColumnResizing ? "onChange" : undefined,
    meta: {
      updateData: (rowIndex: number, columnId: string, value: unknown) => {
        const newData = data.map((row, idx) =>
          idx === rowIndex ? { ...row, [columnId]: value } : row
        )
        onDataUpdate?.(newData)
      },
    },
  })

  useEffect(() => {
    setPagination((prev) =>
      prev.pageSize === resolvedPageSize
        ? prev
        : { ...prev, pageSize: resolvedPageSize }
    )
  }, [resolvedPageSize])

  /* -------------------------- Row Reorder ------------------------------- */
  const handleRowDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIdx = table
        .getRowModel()
        .rows.findIndex((r) => r.id === active.id)
      const newIdx = table.getRowModel().rows.findIndex((r) => r.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return

      const newData = arrayMove(data, oldIdx, newIdx)
      onRowReorder?.(newData)
    },
    [data, table, onRowReorder]
  )

  /* -------------------------- Column Reorder --------------------------- */
  const handleColumnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = columnOrder.indexOf(active.id as string)
      const newIndex = columnOrder.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex))
    },
    [columnOrder]
  )

  /* -------------------------- Reset Layout ----------------------------- */
  const handleResetLayout = useCallback(() => {
    setColumnVisibility({})
    setSorting([])
    setColumnFilters([])
    setColumnOrder(["actions", ...columns.map((c) => c.accessorKey)])
    setColumnSizing({})
    onResetLayout?.()
  }, [columns, onResetLayout])

  /* -------------------------- Global Search Handler ---------------------- */
  const handleGlobalSearchChange = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      setGlobalFilter(trimmed)
      onGlobalSearch?.(trimmed)
    },
    [onGlobalSearch]
  )

  /* -------------------------- Render ------------------------------------ */
  const tableBodyHeight = visibleRows * rowHeight
  const visibleLeafColumns = table.getVisibleLeafColumns()
  const fillerRowCount = Math.max(
    0,
    visibleRows - table.getRowModel().rows.length
  )
  const renderFillerRows = (keyPrefix: string) =>
    Array.from({ length: fillerRowCount }, (_, fillerIndex) => (
      <tr
        key={`${keyPrefix}-filler-${fillerIndex}`}
        className="border-border border-b"
      >
        {visibleLeafColumns.map((column) => {
          const align =
            (
              column.columnDef.meta as
                | { align?: "left" | "center" | "right" }
                | undefined
            )?.align ?? "left"
          const isActions = column.id === "actions"
          return (
            <td
              key={`${keyPrefix}-${column.id}-${fillerIndex}`}
              style={{
                textAlign: align,
                width: column.getSize(),
                position: isActions ? "sticky" : undefined,
                left: isActions ? 0 : undefined,
                zIndex: isActions ? 10 : undefined,
                background: isActions ? "rgba(0,0,0,1)" : undefined,
              }}
              className="px-1 py-2 text-xs text-transparent"
            >
              &nbsp;
            </td>
          )
        })}
      </tr>
    ))

  return (
    <div
      className={`bg-card text-card-foreground rounded-md shadow-sm ${className ?? ""}`}
      style={style}
      suppressHydrationWarning={true} // Suppress hydration warnings for dynamic DndKit elements
    >
      {/* Header Controls */}
      <div className="border-border flex items-center justify-between border-b p-4">
        {settings.enableColumnFilters && (
          <Input
            placeholder={settings.globalFilterPlaceholder}
            value={globalFilter}
            onChange={(e) => handleGlobalSearchChange(e.target.value)}
            className="h-7 max-w-[200px] px-2 py-0 text-xs leading-7 md:text-xs"
          />
        )}
        {settings.enableColumnVisibility && (
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((c) => c.getCanHide())
                  .map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onSelect={(e) => e.preventDefault()}
                      onClick={() => c.toggleVisibility(!c.getIsVisible())}
                    >
                      <Checkbox
                        checked={c.getIsVisible()}
                        className="mr-2 h-4 w-4"
                      />
                      <div className="truncate">{c.id}</div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleResetLayout}>
              Reset Layout
            </Button>
          </div>
        )}
      </div>

      {settings.enableRowReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleRowDragEnd}
        >
          <SortableContext
            items={table.getRowModel().rows.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {settings.enableColumnReorder ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToHorizontalAxis]}
                onDragEnd={handleColumnDragEnd}
              >
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  <div
                    className="overflow-auto"
                    style={{ maxHeight: `${tableBodyHeight}px` }}
                  >
                    <table className="min-w-full table-auto">
                      <thead className="sticky top-0 z-10">
                        {table.getHeaderGroups().map((hg) => (
                          <tr key={hg.id} className="bg-muted/30">
                            {hg.headers.map((header) => (
                              <DraggableHeader
                                key={header.id}
                                header={header}
                              />
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="divide-border divide-y">
                        {table.getRowModel().rows.map((row) => (
                          <SortableRow
                            key={row.id}
                            row={row}
                            columnOrder={columnOrder}
                          />
                        ))}
                        {renderFillerRows("row-col-reorder")}
                      </tbody>
                    </table>
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div
                className="overflow-auto"
                style={{ maxHeight: `${tableBodyHeight}px` }}
              >
                <table className="min-w-full table-auto">
                  <thead className="sticky top-0 z-10">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="bg-muted/30">
                        {hg.headers.map((header) => {
                          const isActions = header.column.id === "actions"
                          return (
                            <th
                              key={header.id}
                              colSpan={header.colSpan}
                              onClick={
                                header.column.getCanSort()
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                              style={{
                                width: header.getSize(),
                                position: "relative",
                                cursor: header.column.getCanSort()
                                  ? "pointer"
                                  : "default",
                                backgroundColor: "rgba(15,15,15,0.95)",
                              }}
                              className={`bg-muted/30 truncate px-1 py-0.5 text-center text-xs font-semibold ${isActions ? "sticky left-0 z-20 whitespace-nowrap" : ""}`}
                            >
                              <div className="relative flex items-center justify-center gap-2">
                                <div className="truncate">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                                {settings.enableColumnResizing &&
                                  header.column.getCanResize() && (
                                    <div
                                      onMouseDown={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        header.getResizeHandler()(e)
                                      }}
                                      onTouchStart={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        header.getResizeHandler()(e)
                                      }}
                                      className="absolute right-0"
                                      style={{
                                        top: "25%",
                                        height: "50%",
                                        width: "4px",
                                        background: "var(--border)",
                                        cursor: "col-resize",
                                        zIndex: 30,
                                        borderLeft: "1px solid var(--border)",
                                        borderRadius: "2px",
                                        pointerEvents: "auto",
                                      }}
                                      data-no-dnd="true"
                                    />
                                  )}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-border divide-y">
                    {table.getRowModel().rows.map((row) => (
                      <SortableRow
                        key={row.id}
                        row={row}
                        columnOrder={columnOrder}
                      />
                    ))}
                    {renderFillerRows("row-reorder")}
                  </tbody>
                </table>
              </div>
            )}
          </SortableContext>
        </DndContext>
      ) : settings.enableColumnReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleColumnDragEnd}
        >
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="overflow-auto"
              style={{ maxHeight: `${tableBodyHeight}px` }}
            >
              <table className="min-w-full table-auto">
                <thead className="sticky top-0 z-10">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="bg-muted/30">
                      {hg.headers.map((header) => (
                        <DraggableHeader key={header.id} header={header} />
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-border divide-y">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-border hover:bg-muted/50 border-b transition-colors"
                    >
                      <SortableContext
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <DragAlongCell
                            key={cell.id}
                            cell={cell.getContext()}
                          />
                        ))}
                      </SortableContext>
                    </tr>
                  ))}
                  {renderFillerRows("col-reorder")}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div
          className="overflow-auto"
          style={{ maxHeight: `${tableBodyHeight}px` }}
        >
          <table className="min-w-full table-auto">
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-muted/30">
                  {hg.headers.map((header) => {
                    const isActions = header.column.id === "actions"
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        onClick={
                          header.column.getCanSort()
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        style={{
                          width: header.getSize(),
                          position: "relative",
                          cursor: header.column.getCanSort()
                            ? "pointer"
                            : "default",
                          backgroundColor: "rgba(15,15,15,0.95)",
                        }}
                        className={`bg-muted/30 truncate px-1 py-0.5 text-center text-xs font-semibold ${isActions ? "sticky left-0 z-20 whitespace-nowrap" : ""}`}
                      >
                        <div className="relative flex items-center justify-center gap-2">
                          <div className="truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                          {settings.enableColumnResizing &&
                            header.column.getCanResize() && (
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  header.getResizeHandler()(e)
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  header.getResizeHandler()(e)
                                }}
                                className="absolute right-0"
                                style={{
                                  top: "25%",
                                  height: "50%",
                                  width: "4px",
                                  background: "var(--border)",
                                  cursor: "col-resize",
                                  zIndex: 30,
                                  borderLeft: "1px solid var(--border)",
                                  borderRadius: "2px",
                                  pointerEvents: "auto",
                                }}
                                data-no-dnd="true"
                              />
                            )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-border divide-y">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-border hover:bg-muted/50 border-b transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (
                        cell.column.columnDef.meta as
                          | { align?: "left" | "center" | "right" }
                          | undefined
                      )?.align ?? "left"
                    const isActions = cell.column.id === "actions"
                    return (
                      <td
                        key={cell.id}
                        style={{ textAlign: align }}
                        className={`overflow-hidden px-1 py-0.5 align-middle text-xs whitespace-nowrap ${isActions ? "sticky left-0 z-20 whitespace-nowrap" : ""}`}
                      >
                        <div className="truncate">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
              {renderFillerRows("basic")}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
