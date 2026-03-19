"use client"

import { useCallback, useState } from "react"
import { IPayrollComponentGLMapping } from "@/interfaces/payroll"
import { PayrollComponentGLMappingFormData } from "@/schemas/payroll"

import { PayrollComponentGLMapping } from "@/lib/api-routes"
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

import { PayrollAccountIntegrationForm } from "./components/payroll-account-integration-form"
import { PayrollAccountIntegrationTable } from "./components/payroll-account-integration-table"
import { PayrollAccountIntegrationView } from "./components/payroll-account-integration-view"

export default function AccountIntegrationPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingItem, setEditingItem] =
    useState<IPayrollComponentGLMapping | null>(null)
  const [viewingItem, setViewingItem] =
    useState<IPayrollComponentGLMapping | null>(null)

  const { data, isLoading, refetch } = useGet(
    PayrollComponentGLMapping.get,
    "payrollcomponentglmapping"
  )
  const createMutation = usePersist(PayrollComponentGLMapping.add)
  const updateMutation = usePersist(PayrollComponentGLMapping.add)
  const deleteMutation = useDelete(PayrollComponentGLMapping.delete)

  const openCreate = useCallback(() => {
    setEditingItem(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((item: IPayrollComponentGLMapping) => {
    setEditingItem(item)
    setDialogOpen(true)
  }, [])

  const openView = useCallback((item: IPayrollComponentGLMapping) => {
    setViewingItem(item)
    setViewDialogOpen(true)
  }, [])

  const confirmDelete = useCallback((item: IPayrollComponentGLMapping) => {
    setEditingItem(item)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (editingItem) {
      deleteMutation.mutate(editingItem.mappingId.toString())
      setDeleteConfirmOpen(false)
    }
  }, [deleteMutation, editingItem])

  const handleSave = useCallback(
    (values: PayrollComponentGLMappingFormData) => {
      const mutation = editingItem ? updateMutation : createMutation
      mutation.mutate(values, {
        onSuccess: () => {
          setDialogOpen(false)
          setEditingItem(null)
          refetch()
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
            Account Integration Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage payroll account integration settings
          </p>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={7} />
      ) : (
        <PayrollAccountIntegrationTable
          mappings={data?.data as IPayrollComponentGLMapping[]}
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
              {editingItem
                ? "Edit Account Integration"
                : "Add Account Integration"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingItem
                ? "Update account integration details"
                : "Create a new account integration mapping"}
            </DialogDescription>
          </DialogHeader>

          <PayrollAccountIntegrationForm
            initialData={editingItem as PayrollComponentGLMappingFormData}
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
              form="payroll-account-integration-form"
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
      <PayrollAccountIntegrationView
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        mapping={viewingItem}
      />

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={(isOpen) => setDeleteConfirmOpen(isOpen)}
        title="Delete Account Integration"
        description="This action cannot be undone. This will permanently delete the account integration mapping from our servers."
        itemName={editingItem?.componentName || ""}
        onConfirm={handleDelete}
        onCancelAction={() => setDeleteConfirmOpen(false)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
