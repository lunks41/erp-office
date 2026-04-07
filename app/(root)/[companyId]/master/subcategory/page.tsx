"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse, ISubCategory, ISubCategoryFilter } from "@/interfaces"
import { SubCategorySchemaType } from "@/schemas"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { SubCategory } from "@/lib/api-routes"
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

import { SubCategoryForm } from "./components/subcategory-form"
import { SubCategoryTable } from "./components/subcategory-table"

export default function SubCategoryPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.subCategory

  // Move queryClient to top for proper usage order
  const queryClient = useQueryClient()

  const { hasPermission } = usePermissionStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  // Fetch subCategory  from the API using useGet
  const [filters, setFilters] = useState<ISubCategoryFilter>({})
  const [searchInput, setSearchInput] = useState("")
  const [isLocked, setIsLocked] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Get user setting defaults
  const { defaults } = useUserSettingDefaults()

  // Update page size when defaults change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter handler wrapper
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as ISubCategoryFilter)
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

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const {
    data: subCategorysResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ISubCategory>(
    `${SubCategory.get}`,
    "subCategorys",
    filters.search,
    currentPage,
    pageSize
  )

  // Destructure with fallback values
  const {
    result: subCategorysResult,
    data: subCategorysData,
    totalRecords,
  } = (subCategorysResponse as ApiResponse<ISubCategory>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Handle result = -1 and result = -2 cases
  useEffect(() => {
    if (!subCategorysResponse) return

    if (subCategorysResponse.result === -1) {
      setFilters({})
    } else if (subCategorysResponse.result === -2 && !isLocked) {
      setIsLocked(true)
    } else if (subCategorysResponse.result !== -2) {
      setIsLocked(false)
    }
  }, [subCategorysResponse, isLocked])

  // Define mutations for CRUD operations
  const saveMutation = usePersist<SubCategorySchemaType>(`${SubCategory.add}`)
  const updateMutation = usePersist<SubCategorySchemaType>(`${SubCategory.add}`)
  const deleteMutation = useDelete(`${SubCategory.delete}`)

  // State for modal and selected subCategory group
  const [selectedSubCategory, setSelectedSubCategory] = useState<
    ISubCategory | undefined
  >(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingSubCategory, setExistingSubCategory] =
    useState<ISubCategory | null>(null)

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    subCategoryId: string | null
    subCategoryName: string | null
  }>({
    isOpen: false,
    subCategoryId: null,
    subCategoryName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: SubCategorySchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler to Re-fetches data when called
  const handleRefresh = () => {
    refetch()
  }

  // Handler to open modal for creating a new subCategory group
  const handleCreateSubCategory = () => {
    setModalMode("create")
    setSelectedSubCategory(undefined)
    setIsModalOpen(true)
  }

  // Handler to open modal for editing an subCategory group
  const handleEditSubCategory = (subCategory: ISubCategory) => {
    setModalMode("edit")
    setSelectedSubCategory(subCategory)
    setIsModalOpen(true)
  }

  // Handler to open modal for viewing an subCategory group
  const handleViewSubCategory = (subCategory: ISubCategory | null) => {
    if (!subCategory) return
    setModalMode("view")
    setSelectedSubCategory(subCategory)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: SubCategorySchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: SubCategorySchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the subCategorys query
          queryClient.invalidateQueries({ queryKey: ["subCategorys"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedSubCategory) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the subCategorys query
          queryClient.invalidateQueries({ queryKey: ["subCategorys"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  // Handler for deleting an subCategory group
  const handleDeleteSubCategory = (subCategoryId: string) => {
    const subCategoryToDelete = subCategorysData?.find(
      (ag) => ag.subCategoryId.toString() === subCategoryId
    )
    if (!subCategoryToDelete) return

    // Open delete confirmation dialog with subCategory group details
    setDeleteConfirmation({
      isOpen: true,
      subCategoryId,
      subCategoryName: subCategoryToDelete.subCategoryName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.subCategoryId) {
      deleteMutation.mutateAsync(deleteConfirmation.subCategoryId).then(() => {
        // Invalidate and refetch the subCategorys query after successful deletion
        queryClient.invalidateQueries({ queryKey: ["subCategorys"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        subCategoryId: null,
        subCategoryName: null,
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
          `${SubCategory.getByCode}/${trimmedCode}`
        )

        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const subCategoryData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (subCategoryData) {
            // Ensure all required fields are present
            const validSubCategoryData: ISubCategory = {
              subCategoryId: subCategoryData.subCategoryId,
              companyId: subCategoryData.companyId,
              subCategoryCode: subCategoryData.subCategoryCode,
              subCategoryName: subCategoryData.subCategoryName,
              remarks: subCategoryData.remarks || "",
              isActive: subCategoryData.isActive ?? true,
              createBy: subCategoryData.createBy,
              editBy: subCategoryData.editBy,
              createDate: subCategoryData.createDate,
              editDate: subCategoryData.editDate,
              createById: subCategoryData.createById,
              editById: subCategoryData.editById,
            }

            setExistingSubCategory(validSubCategoryData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing subCategory group
  const handleLoadExistingSubCategory = () => {
    if (existingSubCategory) {
      setModalMode("edit")
      setSelectedSubCategory(existingSubCategory)
      setShowLoadDialog(false)
      setExistingSubCategory(null)
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
            SubCategory Groups
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage subCategory group information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search subcategory groups..."
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

      {/* SubCategory Groups Table */}
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
      ) : subCategorysResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <SubCategoryTable
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
        <SubCategoryTable
          data={subCategorysData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewSubCategory : undefined}
          onDeleteAction={canDelete ? handleDeleteSubCategory : undefined}
          onEditAction={canEdit ? handleEditSubCategory : undefined}
          onCreateAction={canCreate ? handleCreateSubCategory : undefined}
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
              {modalMode === "create" && "Create SubCategory Group"}
              {modalMode === "edit" && "Update SubCategory Group"}
              {modalMode === "view" && "View SubCategory Group"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new subCategory group to the system database."
                : modalMode === "edit"
                  ? "Update subCategory group information in the system database."
                  : "View subCategory group details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <SubCategoryForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedSubCategory
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

      {/* Load Existing SubCategory Group Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingSubCategory}
        onCancelAction={() => setExistingSubCategory(null)}
        code={existingSubCategory?.subCategoryCode}
        name={existingSubCategory?.subCategoryName}
        typeLabel="SubCategory Group"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete SubCategory Type"
        description="This action cannot be undone. This will permanently delete the subCategory type from our servers."
        itemName={deleteConfirmation.subCategoryName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            subCategoryId: null,
            subCategoryName: null,
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
            ? "Create SubCategory Group"
            : "Update SubCategory Group"
        }
        itemName={saveConfirmation.data?.subCategoryName || ""}
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
