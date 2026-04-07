"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IEntityType, IEntityTypeFilter } from "@/interfaces/entitytype"
import { EntityTypeSchemaType } from "@/schemas/entitytype"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { EntityType } from "@/lib/api-routes"
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

import { EntityTypeForm } from "./components/entity-type-form"
import { EntityTypesTable } from "./components/entity-type-table"

export default function EntityTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.entityType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  // Fetch entity types from the API using useGet
  const [filters, setFilters] = useState<IEntityTypeFilter>({})
  const [searchInput, setSearchInput] = useState("")
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
      setFilters(newFilters as IEntityTypeFilter)
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
    data: entityTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IEntityType>(
    `${EntityType.get}`,
    "entityTypes",
    filters.search,
    currentPage,
    pageSize
  )

  // Destructure with fallback values
  const {
    result: entityTypesResult,
    data: entityTypesData,
    totalRecords,
  } = (entityTypesResponse as ApiResponse<IEntityType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Define mutations for CRUD operations
  const saveMutation = usePersist<EntityTypeSchemaType>(`${EntityType.add}`)
  const updateMutation = usePersist<EntityTypeSchemaType>(`${EntityType.add}`)
  const deleteMutation = useDelete(`${EntityType.delete}`)

  // State for modal and selected entity type
  const [selectedEntityType, setSelectedEntityType] =
    useState<IEntityType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingEntityType, setExistingEntityType] =
    useState<IEntityType | null>(null)

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    entityTypeId: string | null
    entityTypeName: string | null
  }>({
    isOpen: false,
    entityTypeId: null,
    entityTypeName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: EntityTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler to Re-fetches data when called
  const handleRefresh = () => {
    refetch()
  }

  // Handler to open modal for creating a new entity type
  const handleCreateEntityType = () => {
    setModalMode("create")
    setSelectedEntityType(null)
    setIsModalOpen(true)
  }

  // Handler to open modal for editing an entity type
  const handleEditEntityType = (entityType: IEntityType) => {
    setModalMode("edit")
    setSelectedEntityType(entityType)
    setIsModalOpen(true)
  }

  // Handler to open modal for viewing an entity type
  const handleViewEntityType = (entityType: IEntityType | null) => {
    if (!entityType) return
    setModalMode("view")
    setSelectedEntityType(entityType)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: EntityTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: EntityTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["entityTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedEntityType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["entityTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  // Handler for deleting an entity type
  const handleDeleteEntityType = (entityTypeId: string) => {
    const entityTypeToDelete = entityTypesData?.find(
      (at) => at.entityTypeId.toString() === entityTypeId
    )
    if (!entityTypeToDelete) return

    // Open delete confirmation dialog with entity type details
    setDeleteConfirmation({
      isOpen: true,
      entityTypeId,
      entityTypeName: entityTypeToDelete.entityTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.entityTypeId) {
      deleteMutation.mutateAsync(deleteConfirmation.entityTypeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["entityTypes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        entityTypeId: null,
        entityTypeName: null,
      })
    }
  }

  // Handler for code availability check
  const handleCodeBlur = useCallback(
    async (code: string) => {
      // Skip if:
      // 1. In edit mode
      // 2. In read-only mode
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${EntityType.getByCode}/${trimmedCode}`)
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const entityTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (entityTypeData) {
            // Ensure all required fields are present
            const validEntityTypeData: IEntityType = {
              entityTypeId: entityTypeData.entityTypeId,
              entityTypeCode: entityTypeData.entityTypeCode,
              entityTypeName: entityTypeData.entityTypeName,
              companyId: entityTypeData.companyId,
              createBy: entityTypeData.createBy,
              editBy: entityTypeData.editBy,
              createDate: entityTypeData.createDate,
              editDate: entityTypeData.editDate,
            }
            setExistingEntityType(validEntityTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing entity type
  const handleLoadExistingEntityType = () => {
    if (existingEntityType) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedEntityType(existingEntityType)
      setShowLoadDialog(false)
      setExistingEntityType(null)
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
            Entity Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage entity type information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search entity types..."
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

      {/* Entity Types Table */}
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
      ) : entityTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <EntityTypesTable
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
            canEdit={false}
            canDelete={false}
            canView={false}
            canCreate={false}
          />
        </LockSkeleton>
      ) : (
        <EntityTypesTable
          data={entityTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewEntityType : undefined}
          onDeleteAction={canDelete ? handleDeleteEntityType : undefined}
          onEditAction={canEdit ? handleEditEntityType : undefined}
          onCreateAction={canCreate ? handleCreateEntityType : undefined}
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
              {modalMode === "create" && "Create Entity Type"}
              {modalMode === "edit" && "Update Entity Type"}
              {modalMode === "view" && "View Entity Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new entity type to the system database."
                : modalMode === "edit"
                  ? "Update entity type information in the system database."
                  : "View entity type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <EntityTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedEntityType || undefined
                : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Entity Type Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingEntityType}
        onCancelAction={() => setExistingEntityType(null)}
        code={existingEntityType?.entityTypeCode}
        name={existingEntityType?.entityTypeName}
        typeLabel="Entity Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Entity Type"
        description="This action cannot be undone. This will permanently delete the entity type from our servers."
        itemName={deleteConfirmation.entityTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            entityTypeId: null,
            entityTypeName: null,
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
          modalMode === "create" ? "Create Entity Type" : "Update Entity Type"
        }
        itemName={saveConfirmation.data?.entityTypeName || ""}
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
