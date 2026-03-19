"use client"

import { useState } from "react"
import { IEmployer } from "@/interfaces/employer"
import { EmployerSchemaType } from "@/schemas/employer"

import { Employer } from "@/lib/api-routes"
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

import { EmployerForm } from "./components/employer-form"
import { EmployerTable } from "./components/employer-table"

export default function EmployerPage() {
  // Permissions
  const canCreateEmployer = true
  const canEditEmployer = true
  const canDeleteEmployer = true

  // Form states
  const [employerFormOpen, setEmployerFormOpen] = useState(false)
  const [selectedEmployer, setSelectedEmployer] = useState<IEmployer | null>(
    null
  )

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    name: string
    type: string
    employerId?: number
  } | null>(null)

  // Data fetching
  const {
    data: employerData,
    isLoading: employerLoading,
    refetch: refetchEmployer,
  } = useGet<IEmployer>(Employer.get, "employer")

  // Mutations
  const { mutate: deleteItem, isPending: isDeleting } = useDelete(
    Employer.delete
  )
  const createMutation = usePersist(Employer.add)
  const updateMutation = usePersist(Employer.add)

  // Event handlers
  const handleCreateEmployer = () => {
    setSelectedEmployer(null)
    setEmployerFormOpen(true)
  }

  const handleEditEmployer = (employer: IEmployer) => {
    setSelectedEmployer(employer)
    setEmployerFormOpen(true)
  }

  const handleDeleteEmployer = (employer: IEmployer) => {
    setItemToDelete({
      id: employer.employerId.toString(),
      name: "Employer",
      type: "employer",
      employerId: employer.employerId, // Explicitly include employerId
    })
    setDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      // Use employerId explicitly in the delete request
      const deleteId = itemToDelete.employerId?.toString() || itemToDelete.id
      deleteItem(`${deleteId}`, {
        onSuccess: () => {
          refetchEmployer()
          setDeleteDialog(false)
          setItemToDelete(null)
        },
      })
    }
  }

  const handleSave = (values: EmployerSchemaType) => {
    const mutation = selectedEmployer ? updateMutation : createMutation
    mutation.mutate(values, {
      onSuccess: () => {
        setEmployerFormOpen(false)
        setSelectedEmployer(null)
        refetchEmployer()
      },
    })
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Employer Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage employer information and settings
          </p>
        </div>
      </div>

      {employerLoading ? (
        <DataTableSkeleton columnCount={4} />
      ) : (
        <EmployerTable
          data={employerData?.data || []}
          onEditAction={handleEditEmployer}
          onDeleteAction={handleDeleteEmployer}
          onCreateAction={handleCreateEmployer}
          onRefreshAction={refetchEmployer}
          canCreate={canCreateEmployer}
          canEdit={canEditEmployer}
          canDelete={canDeleteEmployer}
        />
      )}

      {/* Form Dialog */}
      <Dialog
        open={employerFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEmployerFormOpen(false)
            setSelectedEmployer(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-md overflow-y-auto sm:w-[80vw] lg:w-[40vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedEmployer ? "Edit Employer" : "Add New Employer"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedEmployer
                ? "Update employer information"
                : "Create a new employer"}
            </DialogDescription>
          </DialogHeader>

          <EmployerForm
            employer={selectedEmployer || undefined}
            onSaveAction={handleSave}
          />

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmployerFormOpen(false)
                setSelectedEmployer(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="employer-form"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : selectedEmployer
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
