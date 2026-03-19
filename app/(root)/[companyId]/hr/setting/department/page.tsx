"use client"

import { useState } from "react"
import { IDepartment } from "@/interfaces/department"
import { DepartmentSchemaType } from "@/schemas/department"

import { Department } from "@/lib/api-routes"
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

import { DepartmentForm } from "./components/department-form"
import { DepartmentTable } from "./components/department-table"
import { DepartmentView } from "./components/department-view"

export default function DepartmentPage() {
  // Permissions
  const canCreateDepartment = true
  const canEditDepartment = true
  const canDeleteDepartment = true

  // Form states
  const [departmentFormOpen, setDepartmentFormOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] =
    useState<IDepartment | null>(null)
  const [viewingDepartment, setViewingDepartment] =
    useState<IDepartment | null>(null)

  const [deleteDialog, setDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)

  // Data fetching
  const {
    data: departmentData,
    isLoading: departmentLoading,
    refetch: refetchDepartment,
  } = useGet<IDepartment>(Department.get, "department")

  // Mutations
  const { mutate: deleteItem, isPending: isDeleting } = useDelete("/api")
  const createMutation = usePersist(Department.add)
  const updateMutation = usePersist(Department.add)

  // Event handlers
  const handleCreateDepartment = () => {
    setSelectedDepartment(null)
    setDepartmentFormOpen(true)
  }

  const handleEditDepartment = (department: IDepartment) => {
    setSelectedDepartment(department)
    setDepartmentFormOpen(true)
  }

  const handleViewDepartment = (department: IDepartment) => {
    setViewingDepartment(department)
    setViewDialogOpen(true)
  }

  const handleDeleteDepartment = (department: IDepartment) => {
    setItemToDelete({
      id: department.departmentId.toString(),
      name: "Department",
      type: "department",
    })
    setDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteItem(`${itemToDelete.type}/${itemToDelete.id}`, {
        onSuccess: () => {
          refetchDepartment()
          setDeleteDialog(false)
          setItemToDelete(null)
        },
      })
    }
  }

  const handleSave = (values: DepartmentSchemaType) => {
    const mutation = selectedDepartment ? updateMutation : createMutation
    mutation.mutate(values, {
      onSuccess: () => {
        setDepartmentFormOpen(false)
        setSelectedDepartment(null)
        refetchDepartment()
      },
    })
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Department Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage department information and settings
          </p>
        </div>
      </div>

      {departmentLoading ? (
        <DataTableSkeleton columnCount={4} />
      ) : (
        <DepartmentTable
          data={departmentData?.data || []}
          onEditAction={handleEditDepartment}
          onDeleteAction={handleDeleteDepartment}
          onCreateAction={handleCreateDepartment}
          onView={handleViewDepartment}
          onRefreshAction={refetchDepartment}
          canCreate={canCreateDepartment}
          canEdit={canEditDepartment}
          canDelete={canDeleteDepartment}
        />
      )}

      {/* Form Dialog */}
      <Dialog
        open={departmentFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDepartmentFormOpen(false)
            setSelectedDepartment(null)
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-md overflow-y-auto sm:w-[80vw] lg:w-[40vw]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedDepartment ? "Edit Department" : "Add New Department"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedDepartment
                ? "Update department information"
                : "Create a new department"}
            </DialogDescription>
          </DialogHeader>

          <DepartmentForm
            department={selectedDepartment || undefined}
            onSaveAction={handleSave}
          />

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDepartmentFormOpen(false)
                setSelectedDepartment(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="department-form"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : selectedDepartment
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <DepartmentView
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        department={viewingDepartment}
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
