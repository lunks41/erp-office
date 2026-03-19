"use client"

import { useCallback, useState } from "react"
import { IWorkLocation } from "@/interfaces/worklocation"
import { WorkLocationFormData } from "@/schemas/worklocation"

import { WorkLocation } from "@/lib/api-routes"
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

import { WorkLocationForm } from "./components/work-location-form"
import { WorkLocationTable } from "./components/work-location-table"
import { WorkLocationView } from "./components/work-location-view"

export default function WorkLocationPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IWorkLocation | null>(null)
  const [viewingItem, setViewingItem] = useState<IWorkLocation | null>(null)

  const { data, isLoading, refetch } = useGet(WorkLocation.get, "worklocation")
  const createMutation = usePersist(WorkLocation.add)
  const updateMutation = usePersist(WorkLocation.add)
  const deleteMutation = useDelete(WorkLocation.delete)

  const openCreate = useCallback(() => {
    setEditingItem(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((item: IWorkLocation) => {
    setEditingItem(item)
    setDialogOpen(true)
  }, [])

  const openView = useCallback((item: IWorkLocation) => {
    setViewingItem(item)
    setViewDialogOpen(true)
  }, [])

  const confirmDelete = useCallback((item: IWorkLocation) => {
    setEditingItem(item)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (editingItem) {
      deleteMutation.mutate(editingItem.workLocationId.toString())
      setDeleteConfirmOpen(false)
    }
  }, [deleteMutation, editingItem])

  const handleSave = useCallback(
    (values: WorkLocationFormData) => {
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
            Work Location Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage work location information and settings
          </p>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={10} />
      ) : (
        <WorkLocationTable
          data={data?.data as IWorkLocation[]}
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
              {editingItem ? "Edit Work Location" : "Add Work Location"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingItem
                ? "Update work location details"
                : "Create a new work location"}
            </DialogDescription>
          </DialogHeader>

          <WorkLocationForm
            initialData={editingItem as WorkLocationFormData}
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
              form="work-location-form"
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
      <WorkLocationView
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        workLocation={viewingItem}
      />

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={(isOpen) => setDeleteConfirmOpen(isOpen)}
        title="Delete Work Location"
        description="This action cannot be undone. This will permanently delete the work location from our servers."
        itemName={editingItem?.workLocationName || ""}
        onConfirm={handleDelete}
        onCancelAction={() => setDeleteConfirmOpen(false)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
