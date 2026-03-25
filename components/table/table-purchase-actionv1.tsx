import { Checkbox } from "@/components/ui/checkbox"

interface PurchaseTableActionsProps<T> {
  row: T & { purchaseId?: number }
  onSelect?: (row: T, checked: boolean) => void
  hideCheckbox?: boolean
  isSelected: boolean
  onCheckboxChange?: (checked: boolean) => void
  disableOnPurchaseExists?: boolean
}

export function PurchaseTableActions<T>({
  row,
  onSelect,
  hideCheckbox = false,
  isSelected,
  onCheckboxChange,
  disableOnPurchaseExists = true,
}: PurchaseTableActionsProps<T>) {
  const hasValidPurchaseId =
    disableOnPurchaseExists && row.purchaseId && row.purchaseId > 0

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
          disabled={!!hasValidPurchaseId}
          className={
            hasValidPurchaseId
              ? "cursor-not-allowed opacity-50"
              : "border-primary border-2"
          }
          title={
            hasValidPurchaseId
              ? "Cannot select - Purchase exists"
              : "Select row"
          }
        />
      )}
    </div>
  )
}
