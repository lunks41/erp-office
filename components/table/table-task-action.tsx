import { Eye, Pencil, Receipt, ShoppingCart, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface TaskTableActionsProps<T> {
  row: T & { debitNoteId?: number; debitNoteNo?: string }
  onView?: (row: T) => void
  onEditAction?: (row: T) => void
  onDeleteAction?: (id: string) => void
  onDebitNoteAction?: (id: string) => void
  onPurchaseAction?: (id: string) => void
  onSelect?: (row: T, checked: boolean) => void
  idAccessor: keyof T
  hideView?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
  hideDebitNote?: boolean
  hidePurchase?: boolean
  isSelected?: boolean
  isConfirmed?: boolean
}
export function TaskTableActions<T>({
  row,
  onView,
  onEditAction,
  onDeleteAction,
  onDebitNoteAction,
  onPurchaseAction,
  onSelect,
  idAccessor,
  hideView,
  hideEdit,
  hideDelete,
  hideDebitNote,
  hidePurchase,
  isSelected = true,
  isConfirmed = false,
}: TaskTableActionsProps<T>) {
  const handleCheckboxChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(row, checked)
    }
  }
  const hasValidDebitNoteId = row.debitNoteId && row.debitNoteId > 0
  const hasDebitNoteNo = row.debitNoteNo && row.debitNoteNo.trim() !== ""
  const hasDebitNote = hasValidDebitNoteId || hasDebitNoteNo
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={isSelected}
        onCheckedChange={handleCheckboxChange}
        disabled={Boolean(hasDebitNote) || isConfirmed}
        className={hasDebitNote ? "cursor-not-allowed opacity-50" : ""}
        title={
          hasDebitNote
            ? "Cannot select - Debit Note exists"
            : "Select row"
        }
      />
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
        className={`h-6 w-6 ${
          hasDebitNote
            ? "cursor-not-allowed text-gray-400 opacity-50"
            : ""
        }`}
        onClick={() => !hasDebitNote && onEditAction?.(row)}
        disabled={hideEdit || Boolean(hasDebitNote) || isConfirmed}
        title={hasDebitNote ? "Cannot edit - Debit Note exists" : "Edit"}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 ${
          hasDebitNote
            ? "cursor-not-allowed text-gray-400 opacity-50"
            : "text-destructive hover:bg-destructive/10"
        }`}
        onClick={() =>
          !hasDebitNote && onDeleteAction?.(String(row[idAccessor]))
        }
        disabled={hideDelete || Boolean(hasDebitNote) || isConfirmed}
        title={
          hasDebitNote ? "Cannot delete - Debit Note exists" : "Delete"
        }
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 ${
          hasDebitNote
            ? "cursor-not-allowed text-gray-400 opacity-50"
            : "text-purple-600 hover:bg-purple-100"
        }`}
        disabled={hidePurchase || Boolean(hasDebitNote) || isConfirmed}
        onClick={() => !hasDebitNote && onPurchaseAction?.(String(row[idAccessor]))}
        title={
          hasDebitNote
            ? "Cannot purchase - Debit Note exists"
            : "Purchase"
        }
      >
        <ShoppingCart className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 ${
          hasDebitNote
            ? "text-orange-600 hover:bg-orange-100"
            : "cursor-not-allowed text-gray-400 opacity-50"
        }`}
        onClick={() =>
          hasDebitNote && onDebitNoteAction?.(String(row[idAccessor]))
        }
        disabled={hideDebitNote || !hasDebitNote}
        title={
          hasDebitNote
            ? "View Debit Note"
            : "No Debit Note available"
        }
      >
        <Receipt className="h-4 w-4" />
      </Button>
    </div>
  )
}
