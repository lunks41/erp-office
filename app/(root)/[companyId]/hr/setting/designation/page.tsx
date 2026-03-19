"use client"

import { useState } from "react"
import { IDesignation } from "@/interfaces/designation"
import { DesignationSchemaType } from "@/schemas/designation"

import { Designation } from "@/lib/api-routes"
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

import { DesignationForm } from "./components/designation-form"
import { DesignationTable } from "./components/designation-table"
import { DesignationView } from "./components/designation-view"

export default function DesignationPage() {
  // Permissions
  const canCreateDesignation = true
  const canEditDesignation = true
  const canDeleteDesignation = true

  // Form states
  const [designationFormOpen, setDesignationFormOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedDesignation, setSelectedDesignation] =
    useState<IDesignation | null>(null)
  const [viewingDesignation, setViewingDesignation] =
    useState<IDesignation | null>(null)

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)

  // Data fetching
  const {
    data: designationData,
    isLoading: designationLoading,
    refetch: refetchDesignation,
  } = useGet<IDesignation>(Designation.get, "designation")

  // Mutations
  const { mutate: deleteItem, isPending: isDeleting } = useDelete("/api")
  const createMutation = usePersist(Designation.add)
  const updateMutation = usePersist(Designation.add)

  // Event handlers
  const handleCreateDesignation = () => {
    setSelectedDesignation(null)
    setDesignationFormOpen(true)
  }

  const handleEditDesignation = (designation: IDesignation) => {
    setSelectedDesignation(designation)
    setDesignationFormOpen(true)
  }

  const handleViewDesignation = (designation: IDesignation) => {
    setViewingDesignation(designation)
    setViewDialogOpen(true)
  }

  const handleDeleteDesignation = (designation: IDesignation) => {
    setItemToDelete({
      id: designation.designationId.toString(),
      name: "Designation",
      type: "designation",
    })
    setDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteItem(`${itemToDelete.type}/${itemToDelete.id}`, {
        onSuccess: () => {
          refetchDesignation()
          setDeleteDialog(false)
          setItemToDelete(null)
        },
      })
    }
  }

  const handleSave = (values: DesignationSchemaType) => {
    const mutation = selectedDesignation ? updateMutation : createMutation
    mutation.mutate(values, {
      onSuccess: () => {
        setDesignationFormOpen(false)
        setSelectedDesignation(null)
        refetchDesignation()
      },
    })
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Designation Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage designation information and settings
          </p>
        </div>
      </div>

      {designationLoading ? (
        <DataTableSkeleton columnCount={4} />
      ) : (
        <DesignationTable
          data={designationData?.data || []}
          onEditAction={handleEditDesignation}
          onDeleteAction={handleDeleteDesignation}
          onCreateAction={handleCreateDesignation}
          onView={handleViewDesignation}
          onRefreshAction={refetchDesignation}
          canCreate={canCreateDesignation}
          canEdit={canEditDesignation}
          canDelete={canDeleteDesignation}
        />
      )}

      {/* Form Dialog */}
      <Dialog
        open={designationFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDesignationFormOpen(false)
            setSelectedDesignation(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-md overflow-y-auto sm:w-[80vw] lg:w-[40vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedDesignation ? "Edit Designation" : "Add New Designation"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedDesignation
                ? "Update designation information"
                : "Create a new designation"}
            </DialogDescription>
          </DialogHeader>

          <DesignationForm
            designation={selectedDesignation || undefined}
            onSaveAction={handleSave}
          />

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDesignationFormOpen(false)
                setSelectedDesignation(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="designation-form"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : selectedDesignation
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <DesignationView
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        designation={viewingDesignation}
      />

      <DeleteConfirmation
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={`Delete ${itemToDelete?.name}`}
        description={`Are you sure you want to delete this ${itemToDelete?.name.toLowerCase()}? This action cannot be undone.`}
      />
    </div>
  )
}
