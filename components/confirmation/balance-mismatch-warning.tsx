"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BalanceMismatchWarningProps {
  // Whether the dialog is open
  open?: boolean
  // Called when the dialog open state changes
  onOpenChange?: (open: boolean) => void
  // Debit total amount
  debitTotal: number
  // Credit total amount
  creditTotal: number
  // Difference between debit and credit
  difference: number
  // Decimal places for formatting
  decimals?: number
}

export function BalanceMismatchWarning({
  open,
  onOpenChange,
  debitTotal,
  creditTotal,
  difference,
  decimals = 2,
}: BalanceMismatchWarningProps) {
  // Format number with proper decimals
  const formatAmount = (amount: number) => {
    return amount.toFixed(decimals)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-yellow-600 dark:text-yellow-500">
            ⚠️ Balance Mismatch Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Debit and Credit totals do not match. The transaction cannot be
              saved until the amounts are balanced.
            </p>

            <div className="rounded-md border border-gray-200 bg-yellow-50 p-4 dark:border-gray-800 dark:bg-yellow-900/20">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Debit Total (isDebit = true):
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatAmount(debitTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Credit Total (isDebit = false):
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatAmount(creditTotal)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 dark:border-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Difference:
                    </span>
                    <span className="font-bold text-red-700 dark:text-red-300">
                      {formatAmount(Math.abs(difference))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              Please adjust the amounts so that Debit Total equals Credit Total
              before saving.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => onOpenChange?.(false)}
            className="bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
