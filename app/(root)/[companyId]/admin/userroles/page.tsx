"use client"

import { useCallback, useState } from "react"
import { IUserRole, IUserRoleFilter } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { UserRoleSchemaType } from "@/schemas/admin"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { UserRole } from "@/lib/api-routes"
import { AdminTransactionId, ModuleId } from "@/lib/utils"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { LoadConfirmation } from "@/components/confirmation/load-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { UserRoleForm } from "../components/user-role-form"
import { UserRoleTable } from "../components/user-role-table"

export default function AdminUserRolesPage() {
  const moduleId = ModuleId.admin
  const transactionIdRole = AdminTransactionId.userRoles

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  const canEdit = hasPermission(moduleId, transactionIdRole, "isEdit")
  const canDelete = hasPermission(moduleId, transactionIdRole, "isDelete")
  const canView = hasPermission(moduleId, transactionIdRole, "isRead")
  const canCreate = hasPermission(moduleId, transactionIdRole, "isCreate")

  const [roleFilters, setRoleFilters] = useState<IUserRoleFilter>({})

  const {
    data: userRolesResponse,
    refetch: refetchUserRoles,
    isLoading: isLoadingUserRoles,
  } = useGet<IUserRole>(`${UserRole.get}`, "userroles", roleFilters.search)

  const { data: userRolesData } =
    (userRolesResponse as ApiResponse<IUserRole>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const saveRoleMutation = usePersist(`${UserRole.add}`)
  const updateRoleMutation = usePersist(`${UserRole.add}`)
  const deleteRoleMutation = useDelete(`${UserRole.delete}`)

  const [selectedUserRole, setSelectedUserRole] = useState<
    IUserRole | undefined
  >(undefined)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    userRoleId: string | null
    roleName: string | null
  }>({
    isOpen: false,
    userRoleId: null,
    roleName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: UserRoleSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Duplicate detection states
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingUserRole, setExistingUserRole] = useState<IUserRole | null>(
    null
  )

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      setRoleFilters(filters as IUserRoleFilter)
    },
    []
  )

  const handleCreateUserRole = () => {
    setModalMode("create")
    setSelectedUserRole(undefined)
    setIsRoleModalOpen(true)
  }

  const handleEditUserRole = (role: IUserRole) => {
    setModalMode("edit")
    setSelectedUserRole(role)
    setIsRoleModalOpen(true)
  }

  const handleViewUserRole = (role: IUserRole | null) => {
    if (!role) return
    setModalMode("view")
    setSelectedUserRole(role)
    setIsRoleModalOpen(true)
  }

  const handleDeleteUserRole = (userRoleId: string) => {
    const roleToDelete = userRolesData?.find(
      (r) => r.userRoleId.toString() === userRoleId
    )
    if (!roleToDelete) return

    // Open delete confirmation dialog with role details
    setDeleteConfirmation({
      isOpen: true,
      userRoleId: userRoleId,
      roleName: roleToDelete.userRoleName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.userRoleId) {
      deleteRoleMutation.mutateAsync(deleteConfirmation.userRoleId).then(() => {
        // Invalidate and refetch the userroles query after successful deletion
        queryClient.invalidateQueries({ queryKey: ["userroles"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        userRoleId: null,
        roleName: null,
      })
    }
  }

  const handleUserRoleFormSubmit = async (data: UserRoleSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveRoleMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the userroles query
          queryClient.invalidateQueries({ queryKey: ["userroles"] })
        }
      } else if (modalMode === "edit" && selectedUserRole) {
        const response = await updateRoleMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the userroles query
          queryClient.invalidateQueries({ queryKey: ["userroles"] })
        }
      }
      setIsRoleModalOpen(false)
    } catch (error) {
      console.error("Error in user role form submission:", error)
    }
  }

  const handleSaveConfirmation = (data: UserRoleSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data,
    })
  }

  const handleConfirmedFormSubmit = async (data: UserRoleSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveRoleMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the userroles query
          queryClient.invalidateQueries({ queryKey: ["userroles"] })
        }
      } else if (modalMode === "edit" && selectedUserRole) {
        const response = await updateRoleMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the userroles query
          queryClient.invalidateQueries({ queryKey: ["userroles"] })
        }
      }
      setIsRoleModalOpen(false)
    } catch (error) {
      console.error("Error in user role form submission:", error)
    }
  }

  // Handler for code availability check (memoized to prevent unnecessary re-renders)
  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) {
        return
      }

      try {
        const response = await getById(`${UserRole.getbycode}/${trimmedCode}`)

        if (response?.result === 1 && response.data) {
          const userRoleData = Array.isArray(response.data)
            ? response.data[0]
            : response.data
          if (userRoleData) {
            // Ensure all required fields are present
            const validUserRoleData: IUserRole = {
              userRoleId: userRoleData.userRoleId,
              userRoleCode: userRoleData.userRoleCode,
              userRoleName: userRoleData.userRoleName,
              remarks: userRoleData.remarks,
              isActive: userRoleData.isActive,
              createBy: userRoleData.createBy,
              editBy: userRoleData.editBy,
              createDate: userRoleData.createDate,
              editDate: userRoleData.editDate,
            }
            setExistingUserRole(validUserRoleData as IUserRole)
            setShowLoadDialog(true)
          }
        } else {
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Load existing record
  const handleLoadExisting = () => {
    if (existingUserRole) {
      setModalMode("edit")
      setSelectedUserRole(existingUserRole)
      setShowLoadDialog(false)
      setExistingUserRole(null)
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            User Roles
          </h1>
          <p className="text-muted-foreground text-sm">Manage user roles</p>
        </div>
      </div>

      {isLoadingUserRoles ? (
        <DataTableSkeleton
          columnCount={8}
          filterCount={2}
          cellWidths={[
            "10rem",
            "30rem",
            "10rem",
            "10rem",
            "10rem",
            "10rem",
            "6rem",
            "6rem",
          ]}
          shrinkZero
        />
      ) : (userRolesResponse as ApiResponse<IUserRole>)?.result === -2 ? (
        <LockSkeleton locked={true}>
          <UserRoleTable
            data={[]}
            isLoading={false}
            onSelect={canView ? handleViewUserRole : undefined}
            onDeleteAction={canDelete ? handleDeleteUserRole : undefined}
            onEditAction={canEdit ? handleEditUserRole : undefined}
            onCreateAction={canCreate ? handleCreateUserRole : undefined}
            onRefreshAction={refetchUserRoles}
            onFilterChange={handleFilterChange}
            initialSearchValue={roleFilters.search}
            moduleId={moduleId}
            transactionId={transactionIdRole}
            canEdit={canEdit}
            canDelete={canDelete}
            canView={canView}
            canCreate={canCreate}
          />
        </LockSkeleton>
      ) : (
        <UserRoleTable
          data={roleFilters.search ? [] : userRolesData || []}
          isLoading={isLoadingUserRoles}
          onSelect={canView ? handleViewUserRole : undefined}
          onDeleteAction={canDelete ? handleDeleteUserRole : undefined}
          onEditAction={canEdit ? handleEditUserRole : undefined}
          onCreateAction={canCreate ? handleCreateUserRole : undefined}
          onRefreshAction={refetchUserRoles}
          onFilterChange={handleFilterChange}
          initialSearchValue={roleFilters.search}
          moduleId={moduleId}
          transactionId={transactionIdRole}
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      )}

      <Dialog
        open={isRoleModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRoleModalOpen(false)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create User Role"}
              {modalMode === "edit" && "Update User Role"}
              {modalMode === "view" && "View User Role"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new user role to the system database."
                : modalMode === "edit"
                  ? "Update user role information in the system database."
                  : "View user role details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <UserRoleForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedUserRole
                : undefined
            }
            submitAction={handleUserRoleFormSubmit}
            onCancelAction={() => setIsRoleModalOpen(false)}
            isSubmitting={
              saveRoleMutation.isPending || updateRoleMutation.isPending
            }
            isReadOnly={modalMode === "view"}
            onSaveConfirmation={handleSaveConfirmation}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Duplicate Record Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExisting}
        onCancelAction={() => setExistingUserRole(null)}
        code={existingUserRole?.userRoleCode}
        name={existingUserRole?.userRoleName}
        typeLabel="User Role"
        isLoading={saveRoleMutation.isPending || updateRoleMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Account Type"
        description="This action cannot be undone. This will permanently delete the account type from our servers."
        itemName={deleteConfirmation.roleName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            userRoleId: null,
            roleName: null,
          })
        }
        isDeleting={deleteRoleMutation.isPending}
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={
          modalMode === "create"
            ? "Create Account Group"
            : "Update Account Group"
        }
        itemName={saveConfirmation.data?.userRoleName || ""}
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
          })
        }
        isSaving={saveRoleMutation.isPending || updateRoleMutation.isPending}
      />
    </div>
  )
}
