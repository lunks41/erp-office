"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ICargoType, ICargoTypeFilter } from "@/interfaces/cargotype"
import { CargoTypeSchemaType } from "@/schemas/cargotype"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { CargoType } from "@/lib/api-routes"
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

import { CargoTypeForm } from "./components/cargotype-form"
import { CargoTypesTable } from "./components/cargotype-table"

export default function CargoTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.cargoType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ICargoTypeFilter>({})
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
      setFilters(newFilters as ICargoTypeFilter)
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
    data: cargoTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ICargoType>(
    `${CargoType.get}`,
    "cargoTypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: cargoTypesResult,
    data: cargoTypesData,
    totalRecords,
  } = (cargoTypesResponse as ApiResponse<ICargoType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<CargoTypeSchemaType>(`${CargoType.add}`)
  const updateMutation = usePersist<CargoTypeSchemaType>(`${CargoType.add}`)
  const deleteMutation = useDelete(`${CargoType.delete}`)

  const [selectedCargoType, setSelectedCargoType] = useState<ICargoType | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingCargoType, setExistingCargoType] = useState<ICargoType | null>(
    null
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    cargoTypeId: string | null
    cargoTypeName: string | null
  }>({
    isOpen: false,
    cargoTypeId: null,
    cargoTypeName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: CargoTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateCargoType = () => {
    setModalMode("create")
    setSelectedCargoType(null)
    setIsModalOpen(true)
  }

  const handleEditCargoType = (cargoType: ICargoType) => {
    setModalMode("edit")
    setSelectedCargoType(cargoType)
    setIsModalOpen(true)
  }

  const handleViewCargoType = (cargoType: ICargoType | null) => {
    if (!cargoType) return
    setModalMode("view")
    setSelectedCargoType(cargoType)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: CargoTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: CargoTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["cargoTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedCargoType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["cargoTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteCargoType = (cargoTypeId: string) => {
    const cargoTypeToDelete = cargoTypesData?.find(
      (b) => b.cargoTypeId.toString() === cargoTypeId
    )
    if (!cargoTypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      cargoTypeId,
      cargoTypeName: cargoTypeToDelete.cargoTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.cargoTypeId) {
      deleteMutation.mutateAsync(deleteConfirmation.cargoTypeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["cargoTypes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        cargoTypeId: null,
        cargoTypeName: null,
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
        const response = await getById(`${CargoType.getByCode}/${trimmedCode}`)
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const cargoTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (cargoTypeData) {
            // Ensure all required fields are present
            const validCargoTypeData: ICargoType = {
              cargoTypeId: cargoTypeData.cargoTypeId,
              cargoTypeCode: cargoTypeData.cargoTypeCode,
              cargoTypeName: cargoTypeData.cargoTypeName,
              companyId: cargoTypeData.companyId,
              remarks: cargoTypeData.remarks || "",
              isActive: cargoTypeData.isActive ?? true,
              createBy: cargoTypeData.createBy,
              editBy: cargoTypeData.editBy,
              createDate: cargoTypeData.createDate,
              editDate: cargoTypeData.editDate,
              createById: cargoTypeData.createById,
              editById: cargoTypeData.editById,
            }
            setExistingCargoType(validCargoTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing cargo type
  const handleLoadExistingCargoType = () => {
    if (existingCargoType) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedCargoType(existingCargoType)
      setShowLoadDialog(false)
      setExistingCargoType(null)
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
            Cargo Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage cargo type information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search cargo types..."
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

      {/* Cargo Types Table */}
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
      ) : cargoTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <CargoTypesTable
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
        <CargoTypesTable
          data={cargoTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewCargoType : undefined}
          onDeleteAction={canDelete ? handleDeleteCargoType : undefined}
          onEditAction={canEdit ? handleEditCargoType : undefined}
          onCreateAction={canCreate ? handleCreateCargoType : undefined}
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
              {modalMode === "create" && "Create Cargo Type"}
              {modalMode === "edit" && "Update Cargo Type"}
              {modalMode === "view" && "View Cargo Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new cargo type to the system database."
                : modalMode === "edit"
                  ? "Update cargo type information in the system database."
                  : "View cargo type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <CargoTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedCargoType
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

      {/* Load Existing Cargo Type Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingCargoType}
        onCancelAction={() => setExistingCargoType(null)}
        code={existingCargoType?.cargoTypeCode}
        name={existingCargoType?.cargoTypeName}
        typeLabel="Cargo Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Cargo Type"
        description="This action cannot be undone. This will permanently delete the cargo type from our servers."
        itemName={deleteConfirmation.cargoTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            cargoTypeId: null,
            cargoTypeName: null,
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
          modalMode === "create" ? "Create Cargo Type" : "Update Cargo Type"
        }
        itemName={saveConfirmation.data?.cargoTypeName || ""}
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
