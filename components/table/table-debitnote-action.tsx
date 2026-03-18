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
    <div className="flex items-center gap-2">
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
          className="h-6 w-6"
          onClick={() => onView?.(row)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {!hideEdit && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${
            hasValidDebitNoteId
              ? "cursor-not-allowed text-gray-400 opacity-50"
              : ""
          }`}
          onClick={() => !hasValidDebitNoteId && onEditAction?.(row)}
          title={
            hasValidDebitNoteId ? "Cannot edit - Debit Note exists" : "Edit"
          }
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {!hideDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${
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
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-[#2f6abb] hover:bg-[#e6edf9]"
        onClick={() => onCloneAction?.(row)}
        title="Clone"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
