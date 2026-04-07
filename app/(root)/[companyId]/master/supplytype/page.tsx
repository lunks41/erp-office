"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ISupplyType, ISupplyTypeFilter } from "@/interfaces/supplytype"
import { SupplyTypeSchemaType } from "@/schemas/supplytype"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { SupplyType } from "@/lib/api-routes"
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

import { SupplyTypeForm } from "./components/supplytype-form"
import { SupplyTypesTable } from "./components/supplytype-table"

export default function SupplyTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.supplyType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ISupplyTypeFilter>({})
  const [searchInput, setSearchInput] = useState("")

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
      setFilters(newFilters as ISupplyTypeFilter)
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
    data: supplyTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ISupplyType>(
    `${SupplyType.get}`,
    "supplyTypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: supplyTypesResult,
    data: supplyTypesData,
    totalRecords,
  } = (supplyTypesResponse as ApiResponse<ISupplyType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<SupplyTypeSchemaType>(`${SupplyType.add}`)
  const updateMutation = usePersist<SupplyTypeSchemaType>(`${SupplyType.add}`)
  const deleteMutation = useDelete(`${SupplyType.delete}`)

  const [selectedSupplyType, setSelectedSupplyType] =
    useState<ISupplyType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingSupplyType, setExistingSupplyType] =
    useState<ISupplyType | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    supplyTypeId: string | null
    supplyTypeName: string | null
  }>({
    isOpen: false,
    supplyTypeId: null,
    supplyTypeName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: SupplyTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateSupplyType = () => {
    setModalMode("create")
    setSelectedSupplyType(null)
    setIsModalOpen(true)
  }

  const handleEditSupplyType = (supplyType: ISupplyType) => {
    setModalMode("edit")
    setSelectedSupplyType(supplyType)
    setIsModalOpen(true)
  }

  const handleViewSupplyType = (supplyType: ISupplyType | null) => {
    if (!supplyType) return
    setModalMode("view")
    setSelectedSupplyType(supplyType)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: SupplyTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: SupplyTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["supplyTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedSupplyType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["supplyTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteSupplyType = (supplyTypeId: string) => {
    const supplyTypeToDelete = supplyTypesData?.find(
      (b) => b.supplyTypeId.toString() === supplyTypeId
    )
    if (!supplyTypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      supplyTypeId,
      supplyTypeName: supplyTypeToDelete.supplyTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.supplyTypeId) {
      deleteMutation.mutateAsync(deleteConfirmation.supplyTypeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["supplyTypes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        supplyTypeId: null,
        supplyTypeName: null,
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
        const response = await getById(`${SupplyType.getByCode}/${trimmedCode}`)
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const supplyTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (supplyTypeData) {
            // Ensure all required fields are present
            const validSupplyTypeData: ISupplyType = {
              supplyTypeId: supplyTypeData.supplyTypeId,
              supplyTypeCode: supplyTypeData.supplyTypeCode,
              supplyTypeName: supplyTypeData.supplyTypeName,
              companyId: supplyTypeData.companyId,
              remarks: supplyTypeData.remarks || "",
              isActive: supplyTypeData.isActive ?? true,
              createBy: supplyTypeData.createBy,
              editBy: supplyTypeData.editBy,
              createDate: supplyTypeData.createDate,
              editDate: supplyTypeData.editDate,
              createById: supplyTypeData.createById,
              editById: supplyTypeData.editById,
            }
            setExistingSupplyType(validSupplyTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing party type
  const handleLoadExistingSupplyType = () => {
    if (existingSupplyType) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedSupplyType(existingSupplyType)
      setShowLoadDialog(false)
      setExistingSupplyType(null)
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
            Supply Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage supply type information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search supply types..."
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

      {/* Party Types Table */}
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
      ) : supplyTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <SupplyTypesTable
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
        <SupplyTypesTable
          data={supplyTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewSupplyType : undefined}
          onDeleteAction={canDelete ? handleDeleteSupplyType : undefined}
          onEditAction={canEdit ? handleEditSupplyType : undefined}
          onCreateAction={canCreate ? handleCreateSupplyType : undefined}
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
              {modalMode === "create" && "Create Supply Type"}
              {modalMode === "edit" && "Update Supply Type"}
              {modalMode === "view" && "View Supply Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new supply type to the system database."
                : modalMode === "edit"
                  ? "Update supply type information in the system database."
                  : "View supply type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <SupplyTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedSupplyType
                : null
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Party Type Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingSupplyType}
        onCancelAction={() => setExistingSupplyType(null)}
        code={existingSupplyType?.supplyTypeCode}
        name={existingSupplyType?.supplyTypeName}
        typeLabel="Supply Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Party Type"
        description="This action cannot be undone. This will permanently delete the party type from our servers."
        itemName={deleteConfirmation.supplyTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            supplyTypeId: null,
            supplyTypeName: null,
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
          modalMode === "create" ? "Create Supply Type" : "Update Supply Type"
        }
        itemName={saveConfirmation.data?.supplyTypeName || ""}
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
