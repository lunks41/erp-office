"use client"

import { useCallback, useState } from "react"
import { IPayrollComponent } from "@/interfaces/payroll"
import { PayrollComponentFormData } from "@/schemas/payroll"

import { PayrollComponent } from "@/lib/api-routes"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { PayrollComponentForm } from "./components/payroll-component-form"
import { PayrollComponentTable } from "./components/payroll-component-table"
import { PayrollComponentView } from "./components/payroll-component-view"

export default function PayrollComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IPayrollComponent | null>(null)
  const [viewingItem, setViewingItem] = useState<IPayrollComponent | null>(null)

  const { data, isLoading, refetch } = useGet(
    PayrollComponent.get,
    "payrollcomponent"
  )
  const createMutation = usePersist(PayrollComponent.add)
  const updateMutation = usePersist(PayrollComponent.update)
  const deleteMutation = useDelete(PayrollComponent.delete)

  const openCreate = useCallback(() => {
    setEditingItem(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((item: IPayrollComponent) => {
    setEditingItem(item)
    setDialogOpen(true)
  }, [])

  const openView = useCallback((item: IPayrollComponent) => {
    setViewingItem(item)
    setViewDialogOpen(true)
  }, [])

  const confirmDelete = useCallback((item: IPayrollComponent) => {
    setEditingItem(item)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (editingItem) {
      deleteMutation.mutate(editingItem.componentId.toString())
      setDeleteConfirmOpen(false)
    }
  }, [deleteMutation, editingItem])

  const handleSave = useCallback(
    (values: PayrollComponentFormData) => {
      console.log("handleSave called with values:", values)
      console.log("editingItem:", editingItem)

      const mutation = editingItem ? updateMutation : createMutation
      console.log("Using mutation:", editingItem ? "update" : "create")

      mutation.mutate(values, {
        onSuccess: () => {
          console.log("Mutation successful")
          setDialogOpen(false)
          setEditingItem(null)
          refetch()
        },
        onError: (error) => {
          console.error("Mutation failed:", error)
        },
      })
    },
    [editingItem, createMutation, updateMutation, refetch]
  )

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Payroll Components Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage payroll components and settings
          </p>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={6} />
      ) : (
        <PayrollComponentTable
          data={data?.data as IPayrollComponent[]}
          onCreateAction={openCreate}
          onEditAction={openEdit}
          onDeleteAction={confirmDelete}
          onView={openView}
          onRefreshAction={refetch}
        />
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDialogOpen(false)
            setEditingItem(null)
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto sm:w-[80vw] lg:w-[60vw]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingItem ? "Edit Payroll Component" : "Add Payroll Component"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingItem
                ? "Update payroll component details"
                : "Create a new payroll component"}
            </DialogDescription>
          </DialogHeader>

          <PayrollComponentForm
            initialData={editingItem as PayrollComponentFormData}
            onSaveAction={handleSave}
          />

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                setEditingItem(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="payroll-component-form"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingItem
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <PayrollComponentView
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        component={viewingItem}
      />

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={(isOpen) => setDeleteConfirmOpen(isOpen)}
        title="Delete Payroll Component"
        description="This action cannot be undone. This will permanently delete the payroll component from our servers."
        itemName={editingItem?.componentName || ""}
        onConfirm={handleDelete}
        onCancelAction={() => setDeleteConfirmOpen(false)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
