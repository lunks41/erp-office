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
    <div className="flex items-center gap-2">
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
        className="h-6 w-6"
        disabled={hideView}
        onClick={() => onView?.(row)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={hideEdit || isConfirmed}
        onClick={() => onEditAction?.(row)}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:bg-destructive/10 h-6 w-6"
        disabled={hideDelete || isConfirmed}
        onClick={() => onDeleteAction?.(String(row[idAccessor]))}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {!hideClone && onCloneAction ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-[#2f6abb] hover:bg-[#e6edf9]"
          disabled={isConfirmed}
          onClick={() => onCloneAction(row)}
          title="Clone"
        >
          <Copy className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
