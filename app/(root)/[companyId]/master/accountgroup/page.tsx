"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { IAccountGroup, IAccountGroupFilter } from "@/interfaces/accountgroup"
import { ApiResponse } from "@/interfaces/auth"
import { AccountGroupSchemaType } from "@/schemas/accountgroup"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { AccountGroup } from "@/lib/api-routes"
import { MasterTransactionId, ModuleId } from "@/lib/utils"
import { useDelete, useGetWithPagination, usePersist } from "@/hooks/use-common"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { LoadConfirmation } from "@/components/confirmation/load-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { AccountGroupForm } from "./components/account-group-form"
import { AccountGroupTable } from "./components/account-group-table"

export default function AccountGroupPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.accountGroup

  // Move queryClient to top for proper usage order
  const queryClient = useQueryClient()

  const { hasPermission } = usePermissionStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  // Fetch account groups from the API using useGet
  const [filters, setFilters] = useState<IAccountGroupFilter>({})
  const [searchInput, setSearchInput] = useState("")
  const [isLocked, setIsLocked] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when user settings change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter handler wrapper
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IAccountGroupFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleSearchSubmit = useCallback(() => {
    const normalizedSearch = searchInput.trim() || undefined
    handleFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [filters.sortOrder, handleFilterChange, searchInput])

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Page size change handler
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const {
    data: accountGroupsResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IAccountGroup>(
    `${AccountGroup.get}`,
    "accountGroups",
    filters.search,
    currentPage,
    pageSize
  )

  // Destructure with fallback values
  const {
    result: accountGroupsResult,
    data: accountGroupsData,
    totalRecords,
  } = (accountGroupsResponse as ApiResponse<IAccountGroup>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Handle result = -1 and result = -2 cases
  useEffect(() => {
    if (!accountGroupsResponse) return

    if (accountGroupsResponse.result === -1) {
      setFilters({})
    } else if (accountGroupsResponse.result === -2 && !isLocked) {
      setIsLocked(true)
    } else if (accountGroupsResponse.result !== -2) {
      setIsLocked(false)
    }
  }, [accountGroupsResponse, isLocked])

  // Define mutations for CRUD operations
  const saveMutation = usePersist<AccountGroupSchemaType>(`${AccountGroup.add}`)
  const updateMutation = usePersist<AccountGroupSchemaType>(
    `${AccountGroup.add}`
  )
  const deleteMutation = useDelete(`${AccountGroup.delete}`)

  // State for modal and selected account group
  const [selectedAccountGroup, setSelectedAccountGroup] = useState<
    IAccountGroup | undefined
  >(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingAccountGroup, setExistingAccountGroup] =
    useState<IAccountGroup | null>(null)

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    accountGroupId: string | null
    accountGroupName: string | null
  }>({
    isOpen: false,
    accountGroupId: null,
    accountGroupName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: AccountGroupSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler to Re-fetches data when called
  const handleRefresh = () => {
    refetch()
  }

  // Handler to open modal for creating a new account group
  const handleCreateAccountGroup = () => {
    setModalMode("create")
    setSelectedAccountGroup(undefined)
    setIsModalOpen(true)
  }

  // Handler to open modal for editing an account group
  const handleEditAccountGroup = (accountGroup: IAccountGroup) => {
    setModalMode("edit")
    setSelectedAccountGroup(accountGroup)
    setIsModalOpen(true)
  }

  // Handler to open modal for viewing an account group
  const handleViewAccountGroup = (accountGroup: IAccountGroup | null) => {
    if (!accountGroup) return
    setModalMode("view")
    setSelectedAccountGroup(accountGroup)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: AccountGroupSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: AccountGroupSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the accountGroups query
          queryClient.invalidateQueries({ queryKey: ["accountGroups"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedAccountGroup) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the accountGroups query
          queryClient.invalidateQueries({ queryKey: ["accountGroups"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  // Handler for deleting an account group
  const handleDeleteAccountGroup = (accountGroupId: string) => {
    const accountGroupToDelete = accountGroupsData?.find(
      (ag) => ag.accGroupId.toString() === accountGroupId
    )
    if (!accountGroupToDelete) return

    // Open delete confirmation dialog with account group details
    setDeleteConfirmation({
      isOpen: true,
      accountGroupId,
      accountGroupName: accountGroupToDelete.accGroupName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.accountGroupId) {
      deleteMutation.mutateAsync(deleteConfirmation.accountGroupId).then(() => {
        // Invalidate and refetch the accountGroups query after successful deletion
        queryClient.invalidateQueries({ queryKey: ["accountGroups"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        accountGroupId: null,
        accountGroupName: null,
      })
    }
  }

  // Handler for code availability check (memoized to prevent unnecessary re-renders)
  const handleCodeBlur = useCallback(
    async (code: string) => {
      // Skip if:
      // 1. In edit mode
      // 2. In read-only mode
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) {
        return
      }

      try {
        const response = await getById(
          `${AccountGroup.getByCode}/${trimmedCode}`
        )

        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const accountGroupData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (accountGroupData) {
            // Ensure all required fields are present
            const validAccountGroupData: IAccountGroup = {
              accGroupId: accountGroupData.accGroupId,
              accGroupCode: accountGroupData.accGroupCode,
              accGroupName: accountGroupData.accGroupName,
              seqNo: accountGroupData.seqNo,
              remarks: accountGroupData.remarks || "",
              isActive: accountGroupData.isActive ?? true,
              companyId: accountGroupData.companyId,
              createBy: accountGroupData.createBy,
              editBy: accountGroupData.editBy,
              createDate: accountGroupData.createDate,
              editDate: accountGroupData.editDate,
            }

            setExistingAccountGroup(validAccountGroupData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing account group
  const handleLoadExistingAccountGroup = () => {
    if (existingAccountGroup) {
      setModalMode("edit")
      setSelectedAccountGroup(existingAccountGroup)
      setShowLoadDialog(false)
      setExistingAccountGroup(null)
    }
  }

  useEffect(() => {
    setSearchInput(filters.search || "")
  }, [filters.search])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Account Groups
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage account group information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search account groups..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit()
                }
                if (e.key === "Escape") {
                  setSearchInput("")
                  handleFilterChange({
                    search: undefined,
                    sortOrder: filters.sortOrder,
                  })
                }
              }}
              className="h-7 rounded-md pr-8"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("")
                  handleFilterChange({
                    search: undefined,
                    sortOrder: filters.sortOrder,
                  })
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSearchSubmit}
            className="h-9 rounded-md px-4"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Account Groups Table */}
      {isLoading ? (
        <DataTableSkeleton
          columnCount={7}
          filterCount={2}
          cellWidths={[
            "10rem",
            "30rem",
            "10rem",
            "10rem",
            "6rem",
            "6rem",
            "6rem",
          ]}
          shrinkZero
        />
      ) : accountGroupsResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <AccountGroupTable
            data={[]}
            isLoading={false}
            onSelect={() => {}}
            onDeleteAction={() => {}}
            onEditAction={() => {}}
            onCreateAction={() => {}}
            onRefreshAction={() => {}}
            onFilterChange={() => {}}
            moduleId={moduleId}
            transactionId={transactionId}
            canView={false}
            canCreate={false}
            canEdit={false}
            canDelete={false}
          />
        </LockSkeleton>
      ) : (
        <AccountGroupTable
          data={accountGroupsData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewAccountGroup : undefined}
          onDeleteAction={canDelete ? handleDeleteAccountGroup : undefined}
          onEditAction={canEdit ? handleEditAccountGroup : undefined}
          onCreateAction={canCreate ? handleCreateAccountGroup : undefined}
          onRefreshAction={handleRefresh}
          onFilterChange={handleFilterChange}
          initialSearchValue={filters.search}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          currentPage={currentPage}
          pageSize={pageSize}
          serverSidePagination={true}
          moduleId={moduleId}
          transactionId={transactionId}
          // Pass permissions to table
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      )}

      {/* Modal for Create, Edit, and View */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false)
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
              {modalMode === "create" && "Create Account Group"}
              {modalMode === "edit" && "Update Account Group"}
              {modalMode === "view" && "View Account Group"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new account group to the system database."
                : modalMode === "edit"
                  ? "Update account group information in the system database."
                  : "View account group details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <AccountGroupForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedAccountGroup
                : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view" || !canEdit}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Account Group Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingAccountGroup}
        onCancelAction={() => setExistingAccountGroup(null)}
        code={existingAccountGroup?.accGroupCode}
        name={existingAccountGroup?.accGroupName}
        typeLabel="Account Group"
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
        itemName={deleteConfirmation.accountGroupName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            accountGroupId: null,
            accountGroupName: null,
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
        itemName={saveConfirmation.data?.accGroupName || ""}
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
