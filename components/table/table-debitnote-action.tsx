import { Copy, Eye, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface DebitNoteTableActionsProps<T> {
  row: T & { debitNoteId?: number }
  onView?: (row: T) => void
  onEditAction?: (row: T) => void
  onDeleteAction?: (id: string) => void
  onCloneAction?: (row: T) => void
  onSelect?: (row: T, checked: boolean) => void
  idAccessor: keyof T
  hideView?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
  hideCheckbox?: boolean
  isSelected: boolean
  onCheckboxChange?: (checked: boolean) => void // ✅ Make optional
  disableOnDebitNoteExists?: boolean
}

export function DebitNoteTableActions<T>({
  row,
  onView,
  onEditAction,
  onDeleteAction,
  onCloneAction,
  onSelect,
  idAccessor,
  hideView,
  hideEdit,
  hideDelete,
  hideCheckbox = false,
  isSelected,
  onCheckboxChange,
  disableOnDebitNoteExists = true,
}: DebitNoteTableActionsProps<T>) {
  const hasValidDebitNoteId =
    disableOnDebitNoteExists && row.debitNoteId && row.debitNoteId > 0

  const handleCheckboxChange = (checked: boolean) => {
    if (onCheckboxChange) {
      onCheckboxChange(checked)
    } else if (onSelect) {
      onSelect(row, checked)
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      {!hideCheckbox && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => handleCheckboxChange(!!checked)}
          disabled={!!hasValidDebitNoteId}
          className={
            hasValidDebitNoteId
              ? "cursor-not-allowed opacity-50"
              : "border-primary border-2"
          }
          title={
            hasValidDebitNoteId
              ? "Cannot select - Debit Note exists"
              : "Select row"
          }
        />
      )}

      {/* Action buttons (unchanged) */}
      {!hideView && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => onView?.(row)}
        >
          <Eye className="h-3 w-3" />
        </Button>
      )}

      {!hideEdit && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 ${
            hasValidDebitNoteId
              ? "cursor-not-allowed text-gray-400 opacity-50"
              : ""
          }`}
          onClick={() => !hasValidDebitNoteId && onEditAction?.(row)}
          title={
            hasValidDebitNoteId ? "Cannot edit - Debit Note exists" : "Edit"
          }
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}

      {!hideDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 ${
            hasValidDebitNoteId
              ? "cursor-not-allowed text-gray-400 opacity-50"
              : "text-destructive hover:bg-destructive/10"
          }`}
          onClick={() =>
            !hasValidDebitNoteId && onDeleteAction?.(String(row[idAccessor]))
          }
          title={
            hasValidDebitNoteId ? "Cannot delete - Debit Note exists" : "Delete"
          }
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}

      {onCloneAction ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-[#2f6abb] hover:bg-[#e6edf9]"
          onClick={() => onCloneAction(row)}
          title="Clone"
        >
          <Copy className="h-3 w-3" />
        </Button>
      ) : null}
    </div>
  )
}
