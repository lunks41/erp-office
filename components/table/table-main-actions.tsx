import { Copy, Eye, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface MainTableActionsProps<T> {
  row: T
  onView?: (row: T) => void
  onEditAction?: (row: T) => void
  onDeleteAction?: (id: string) => void
  onCloneAction?: (row: T) => void
  onSelectRow?: (row: T, checked: boolean) => void
  idAccessor: keyof T
  hideView?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
  hideClone?: boolean
  isSelected?: boolean
  isConfirmed?: boolean
}

export function MainTableActions<T>({
  row,
  onView,
  onEditAction,
  onDeleteAction,
  onCloneAction,
  onSelectRow,
  idAccessor,
  hideView,
  hideEdit,
  hideDelete,
  hideClone,
  isSelected = false,
  isConfirmed = false,
}: MainTableActionsProps<T>) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      {onSelectRow ? (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelectRow(row, checked === true)
          }
          disabled={isConfirmed}
          className="border-primary border-2"
          title="Select row"
        />
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        disabled={hideView}
        onClick={() => onView?.(row)}
      >
        <Eye className="h-3 w-3" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        disabled={hideEdit || isConfirmed}
        onClick={() => onEditAction?.(row)}
      >
        <Pencil className="h-3 w-3" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10 h-5 w-5"
        disabled={hideDelete || isConfirmed}
        onClick={() => onDeleteAction?.(String(row[idAccessor]))}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {!hideClone && onCloneAction ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-[#2f6abb] hover:bg-[#e6edf9]"
          disabled={isConfirmed}
          onClick={() => onCloneAction(row)}
          title="Clone"
        >
          <Copy className="h-3 w-3" />
        </Button>
      ) : null}
    </div>
  )
}
