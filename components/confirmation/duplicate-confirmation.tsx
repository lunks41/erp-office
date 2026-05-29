"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DuplicateConfirmationProps {
  // Whether the dialog is open
  open?: boolean
  // Called when the dialog open state changes
  onOpenChange?: (open: boolean) => void
  // Called when the user confirms to keep the duplicate data in form
  onConfirm: () => void
  // Called when the user cancels (resets the form)
  onCancelAction?: () => void
  // The duplicate field values to display
  duplicateInfo?: {
    invoiceDate?: string
    invoiceNo?: string
    supplierName?: string
    glCode?: string
    glName?: string
    totAmt?: number
    totLocalAmt?: number
    gstAmt?: number
    gstPercentage?: number
    remarks?: string
    [key: string]: string | number | undefined // Allow additional fields
  }
}

export function DuplicateConfirmation({
  open,
  onOpenChange,
  onConfirm,
  onCancelAction,
  duplicateInfo,
}: DuplicateConfirmationProps) {
  // Handle the confirm action
  const handleConfirm = () => {
    onConfirm()
    onOpenChange?.(false)
  }

  // Handle the cancel action
  const handleCancel = () => {
    onCancelAction?.()
    onOpenChange?.(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            ⚠️ Duplicate Record Found
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>A record with the same details already exists in the table:</p>
            {duplicateInfo && (
              <div className="border-destructive/30 bg-destructive/5 max-h-96 overflow-y-auto rounded-md border p-4 text-sm">
                <div className="space-y-3">
                  {/* Primary Identification Fields */}
                  <div className="border-destructive/20 space-y-2 rounded-md border bg-white p-3 dark:bg-gray-900">
                    <h4 className="text-destructive text-xs font-bold uppercase">
                      Identification Fields
                    </h4>
                    {duplicateInfo.invoiceDate && (
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Invoice Date:
                        </span>
                        <span className="text-right">
                          {duplicateInfo.invoiceDate}
                        </span>
                      </div>
                    )}
                    {duplicateInfo.invoiceNo && (
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Invoice No:
                        </span>
                        <span className="text-right">
                          {duplicateInfo.invoiceNo}
                        </span>
                      </div>
                    )}
                    {duplicateInfo.supplierName && (
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Supplier Name:
                        </span>
                        <span className="text-right">
                          {duplicateInfo.supplierName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Account Information */}
                  {(duplicateInfo.glCode || duplicateInfo.glName) && (
                    <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20">
                      <h4 className="text-xs font-bold text-blue-700 uppercase dark:text-blue-300">
                        Account Information
                      </h4>
                      {duplicateInfo.glCode && (
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            GL Code:
                          </span>
                          <span className="text-right">
                            {duplicateInfo.glCode}
                          </span>
                        </div>
                      )}
                      {duplicateInfo.glName && (
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            GL Name:
                          </span>
                          <span className="text-right">
                            {duplicateInfo.glName}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Amount Information */}
                  {(duplicateInfo.totAmt !== undefined ||
                    duplicateInfo.totLocalAmt !== undefined ||
                    duplicateInfo.gstAmt !== undefined) && (
                    <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3 dark:bg-green-950/20">
                      <h4 className="text-xs font-bold text-green-700 uppercase dark:text-green-300">
                        Amount Information
                      </h4>
                      {duplicateInfo.totAmt !== undefined && (
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Total Amount:
                          </span>
                          <span className="text-right font-mono">
                            {typeof duplicateInfo.totAmt === "number"
                              ? duplicateInfo.totAmt.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : duplicateInfo.totAmt}
                          </span>
                        </div>
                      )}
                      {duplicateInfo.totLocalAmt !== undefined && (
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Total Local Amount:
                          </span>
                          <span className="text-right font-mono">
                            {typeof duplicateInfo.totLocalAmt === "number"
                              ? duplicateInfo.totLocalAmt.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : duplicateInfo.totLocalAmt}
                          </span>
                        </div>
                      )}
                      {duplicateInfo.gstPercentage !== undefined && (
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            VAT %:
                          </span>
                          <span className="text-right font-mono">
                            {duplicateInfo.gstPercentage}%
                          </span>
                        </div>
                      )}
                      {duplicateInfo.gstAmt !== undefined && (
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            VAT Amount:
                          </span>
                          <span className="text-right font-mono">
                            {typeof duplicateInfo.gstAmt === "number"
                              ? duplicateInfo.gstAmt.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : duplicateInfo.gstAmt}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remarks */}
                  {duplicateInfo.remarks && (
                    <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:bg-gray-800">
                      <h4 className="text-xs font-bold text-gray-700 uppercase dark:text-gray-300">
                        Remarks
                      </h4>
                      <p className="text-sm">{duplicateInfo.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="font-medium">
              Do you want to keep this data in the form to modify it?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            No, Reset Form
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Yes, Keep Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
