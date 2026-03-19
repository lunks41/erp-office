"use client"

import { useCallback, useState } from "react"
import { IUser, IUserFilter } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { UserSchemaType } from "@/schemas/admin"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { User } from "@/lib/api-routes"
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

import { UserForm } from "../components/user-form"
import { UserTable } from "../components/user-table"

export default function AdminUsersPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.user

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [filters, setFilters] = useState<IUserFilter>({})

  const {
    data: usersResponse,
    refetch: refetchUsers,
    isLoading: isLoadingUsers,
  } = useGet<IUser>(`${User.get}`, "users", filters.search)

  const { data: usersData } = (usersResponse as ApiResponse<IUser>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  const saveMutation = usePersist(`${User.add}`)
  const updateMutation = usePersist(`${User.add}`)
  const deleteMutation = useDelete(`${User.delete}`)

  const [selectedUser, setSelectedUser] = useState<IUser | undefined>(undefined)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    userId: string | null
    userName: string | null
  }>({
    isOpen: false,
    userId: null,
    userName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: UserSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Duplicate detection states
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingUser, setExistingUser] = useState<IUser | null>(null)

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      setFilters(filters as IUserFilter)
    },
    []
  )

  const handleCreateUser = () => {
    setModalMode("create")
    setSelectedUser(undefined)
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: IUser) => {
    setModalMode("edit")
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleViewUser = (user: IUser | null) => {
    if (!user) return
    setModalMode("view")
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleDeleteUser = (userId: string) => {
    const userToDelete = usersData?.find((u) => u.userId.toString() === userId)
    if (!userToDelete) return

    // Open delete confirmation dialog with user details
    setDeleteConfirmation({
      isOpen: true,
      userId,
      userName: userToDelete.userName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.userId) {
      deleteMutation.mutateAsync(deleteConfirmation.userId).then(() => {
        // Invalidate and refetch the users query after successful deletion
        queryClient.invalidateQueries({ queryKey: ["users"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        userId: null,
        userName: null,
      })
    }
  }

  const handleUserFormSubmit = async (data: UserSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the users query
          queryClient.invalidateQueries({ queryKey: ["users"] })
        }
      } else if (modalMode === "edit" && selectedUser) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the users query
          queryClient.invalidateQueries({ queryKey: ["users"] })
        }
      }
      setIsUserModalOpen(false)
    } catch (error) {
      console.error("Error in user form submission:", error)
    }
  }

  const handleSaveConfirmation = (data: UserSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data,
    })
  }

  const handleConfirmedFormSubmit = async (data: UserSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the users query
          queryClient.invalidateQueries({ queryKey: ["users"] })
        }
      } else if (modalMode === "edit" && selectedUser) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the users query
          queryClient.invalidateQueries({ queryKey: ["users"] })
        }
      }
      setIsUserModalOpen(false)
    } catch (error) {
      console.error("Error in user form submission:", error)
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
        const response = await getById(`${User.getbycode}/${trimmedCode}`)

        if (response?.result === 1 && response.data) {
          const userData = Array.isArray(response.data)
            ? response.data[0]
            : response.data
          if (userData) {
            // Ensure all required fields are present
            const validUserData: IUser = {
              userId: userData.userId,
              userCode: userData.userCode,
              userName: userData.userName,
              userEmail: userData.userEmail,
              userRoleId: userData.userRoleId,
              userGroupId: userData.userGroupId,
              employeeId: userData.employeeId,
              remarks: userData.remarks,
              isActive: userData.isActive,
              isLocked: userData.isLocked,
              createBy: userData.createBy,
              editBy: userData.editBy,
              createDate: userData.createDate,
              editDate: userData.editDate,
            }
            setExistingUser(validUserData as IUser)
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
    if (existingUser) {
      setModalMode("edit")
      setSelectedUser(existingUser)
      setShowLoadDialog(false)
      setExistingUser(null)
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Users
          </h1>
          <p className="text-muted-foreground text-sm">Manage users</p>
        </div>
      </div>

      {isLoadingUsers ? (
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
      ) : (usersResponse as ApiResponse<IUser>)?.result === -2 ? (
        <LockSkeleton locked={true}>
          <UserTable
            data={[]}
            isLoading={false}
            onSelect={canView ? handleViewUser : undefined}
            onDeleteAction={canDelete ? handleDeleteUser : undefined}
            onEditAction={canEdit ? handleEditUser : undefined}
            onCreateAction={canCreate ? handleCreateUser : undefined}
            onRefreshAction={refetchUsers}
            onFilterChange={handleFilterChange}
            moduleId={moduleId}
            transactionId={transactionId}
            canEdit={canEdit}
            canDelete={canDelete}
            canView={canView}
            canCreate={canCreate}
          />
        </LockSkeleton>
      ) : (
        <UserTable
          data={filters.search ? [] : usersData || []}
          isLoading={isLoadingUsers}
          onSelect={canView ? handleViewUser : undefined}
          onDeleteAction={canDelete ? handleDeleteUser : undefined}
          onEditAction={canEdit ? handleEditUser : undefined}
          onCreateAction={canCreate ? handleCreateUser : undefined}
          onRefreshAction={refetchUsers}
          onFilterChange={handleFilterChange}
          moduleId={moduleId}
          transactionId={transactionId}
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      )}

      <Dialog
        open={isUserModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsUserModalOpen(false)
          }
        }}
      >
        <DialogContent
          className="overflow-visible sm:max-w-2xl" // Added overflow-visible
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create User"}
              {modalMode === "edit" && "Update User"}
              {modalMode === "view" && "View User"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new user to the system database."
                : modalMode === "edit"
                  ? "Update user information in the system database."
                  : "View user details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <UserForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedUser
                : undefined
            }
            submitAction={handleUserFormSubmit}
            onCancelAction={() => setIsUserModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
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
        onCancelAction={() => setExistingUser(null)}
        code={existingUser?.userCode}
        name={existingUser?.userName}
        typeLabel="User"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Account Type"
        description="This action cannot be undone. This will permanently delete the account type from our servers."
        itemName={deleteConfirmation.userName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            userId: null,
            userName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
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
        itemName={saveConfirmation.data?.userName || ""}
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
        isSaving={saveMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
