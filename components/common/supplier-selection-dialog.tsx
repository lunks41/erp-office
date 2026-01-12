"use client"

import * as React from "react"
import { ISupplierLookup } from "@/interfaces/lookup"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CompanySupplierAutocomplete } from "@/components/autocomplete"

interface SupplierSelectionDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onSelectSupplierAction: (supplierName: string, supplierRegNo: string) => void
  companyId: number
}

interface SupplierFormValues extends Record<string, unknown> {
  supplierId: number
}

export default function SupplierSelectionDialog({
  open,
  onOpenChangeAction,
  onSelectSupplierAction,
  companyId,
}: SupplierSelectionDialogProps) {
  const [selectedSupplier, setSelectedSupplier] =
    React.useState<ISupplierLookup | null>(null)

  // Create form for autocomplete component
  const supplierForm = useForm<SupplierFormValues>({
    defaultValues: {
      supplierId: 0,
    },
  })

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedSupplier(null)
      supplierForm.reset({ supplierId: 0 })
    }
  }, [open, supplierForm])

  const handleConfirm = () => {
    if (selectedSupplier) {
      onSelectSupplierAction(
        selectedSupplier.supplierName || "",
        selectedSupplier.supplierRegNo || ""
      )
      onOpenChangeAction(false)
    }
  }

  const handleCancel = () => {
    onOpenChangeAction(false)
  }

  const isConfirmDisabled = !selectedSupplier

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Supplier</DialogTitle>
          <DialogDescription>
            Choose a supplier for this transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Supplier Selection */}
          <CompanySupplierAutocomplete
            form={supplierForm}
            name="supplierId"
            label="Select Supplier"
            isRequired={true}
            onChangeEvent={setSelectedSupplier}
            companyId={companyId}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
