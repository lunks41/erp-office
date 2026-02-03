import { Download, Eye, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface DocumentTableActionsProps<T> {
  row: T & { debitNoteId?: number }
  onView?: (row: T) => void
  onDownload?: (row: T) => void
  onDeleteAction?: (row: T) => void
  onEditAction?: (row: T) => void
  onSelect?: (row: T, checked: boolean) => void
  idAccessor: keyof T
  hideView?: boolean
  hideDownload?: boolean
  hideDelete?: boolean
  hideEdit?: boolean
  hideCheckbox?: boolean
  isSelected: boolean
  onCheckboxChange?: (checked: boolean) => void // ✅ Make optional
  disableOnAccountExists?: boolean
}

export function DocumentTableActions<T>({
  row,
  onView,
  onDownload,
  onDeleteAction,
  onEditAction,
  onSelect,
  idAccessor: _idAccessor,
  hideView,
  hideDownload,
  hideDelete,
  hideEdit = false,
  hideCheckbox = false,
  isSelected,
  onCheckboxChange,
  disableOnAccountExists = true,
}: DocumentTableActionsProps<T>) {
  const hasValidAccountId =
    disableOnAccountExists && row.debitNoteId && row.debitNoteId > 0

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
          disabled={!!hasValidAccountId}
          className={
            hasValidAccountId
              ? "cursor-not-allowed opacity-50"
              : "border-primary border-2"
          }
          title={
            hasValidAccountId
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

      {!hideDownload && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${
            hasValidAccountId
              ? "cursor-not-allowed text-gray-400 opacity-50"
              : ""
          }`}
          onClick={() => !hasValidAccountId && onDownload?.(row)}
          title={
            hasValidAccountId
              ? "Cannot download - Debit Note exists"
              : "Download"
          }
        >
          <Download className="h-4 w-4" />
        </Button>
      )}

      {!hideEdit && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${
            hasValidAccountId
              ? "cursor-not-allowed text-gray-400 opacity-50"
              : ""
          }`}
          onClick={() => !hasValidAccountId && onEditAction?.(row)}
          title={hasValidAccountId ? "Cannot edit - Debit Note exists" : "Edit"}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {!hideDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${
            hasValidAccountId
              ? "cursor-not-allowed text-gray-400 opacity-50"
              : "text-destructive hover:bg-destructive/10"
          }`}
          onClick={() => !hasValidAccountId && onDeleteAction?.(row)}
          title={
            hasValidAccountId ? "Cannot delete - Debit Note exists" : "Delete"
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
