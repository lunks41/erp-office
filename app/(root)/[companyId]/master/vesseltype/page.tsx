"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IVesselType, IVesselTypeFilter } from "@/interfaces/vesseltype"
import { VesselTypeSchemaType } from "@/schemas/vesseltype"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { VesselType } from "@/lib/api-routes"
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

import { VesselTypeForm } from "./components/vesseltype-form"
import { VesselTypesTable } from "./components/vesseltype-table"

export default function VesselTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.vesselType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IVesselTypeFilter>({})
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
      setFilters(newFilters as IVesselTypeFilter)
      setCurrentPage(1)
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
    data: vesselTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IVesselType>(
    `${VesselType.get}`,
    "vesselTypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: vesselTypesResult,
    data: vesselTypesData,
    totalRecords,
  } = (vesselTypesResponse as ApiResponse<IVesselType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<VesselTypeSchemaType>(`${VesselType.add}`)
  const updateMutation = usePersist<VesselTypeSchemaType>(`${VesselType.add}`)
  const deleteMutation = useDelete(`${VesselType.delete}`)

  const [selectedVesselType, setSelectedVesselType] = useState<IVesselType | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingVesselType, setExistingVesselType] =
    useState<IVesselType | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    vesselTypeId: string | null
    vesselTypeName: string | null
  }>({
    isOpen: false,
    vesselTypeId: null,
    vesselTypeName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: VesselTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateVesselType = () => {
    setModalMode("create")
    setSelectedVesselType(null)
    setIsModalOpen(true)
  }

  const handleEditVesselType = (vesselType: IVesselType) => {
    setModalMode("edit")
    setSelectedVesselType(vesselType)
    setIsModalOpen(true)
  }

  const handleViewVesselType = (vesselType: IVesselType | null) => {
    if (!vesselType) return
    setModalMode("view")
    setSelectedVesselType(vesselType)
    setIsModalOpen(true)
  }

  // Handler for form submission - shows confirmation first
  const handleFormSubmit = (data: VesselTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: VesselTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["vesselTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedVesselType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["vesselTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteVesselType = (vesselTypeId: string) => {
    const vesselTypeToDelete = vesselTypesData?.find(
      (b) => b.vesselTypeId.toString() === vesselTypeId
    )
    if (!vesselTypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      vesselTypeId,
      vesselTypeName: vesselTypeToDelete.vesselTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.vesselTypeId) {
      deleteMutation
        .mutateAsync(deleteConfirmation.vesselTypeId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["vesselTypes"] })
        })
      setDeleteConfirmation({
        isOpen: false,
        vesselTypeId: null,
        vesselTypeName: null,
      })
    }
  }

  // Handler for code availability check
  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(
          `${VesselType.getByCode}/${trimmedCode}`
        )
        if (response?.result === 1 && response.data) {
          const vesselTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (vesselTypeData) {
            const validVesselTypeData: IVesselType = {
              vesselTypeId: vesselTypeData.vesselTypeId,
              vesselTypeCode: vesselTypeData.vesselTypeCode,
              vesselTypeName: vesselTypeData.vesselTypeName,
              companyId: vesselTypeData.companyId,
              remarks: vesselTypeData.remarks || "",
              isActive: vesselTypeData.isActive ?? true,
              createBy: vesselTypeData.createBy,
              editBy: vesselTypeData.editBy,
              createDate: vesselTypeData.createDate,
              editDate: vesselTypeData.editDate,
              createById: vesselTypeData.createById,
              editById: vesselTypeData.editById,
            }
            setExistingVesselType(validVesselTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing vessel type
  const handleLoadExistingVesselType = () => {
    if (existingVesselType) {
      setModalMode("edit")
      setSelectedVesselType(existingVesselType)
      setShowLoadDialog(false)
      setExistingVesselType(null)
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
            Vessel Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage vessel type information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search vessel types..."
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

      {/* Vessel Types Table */}
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
      ) : vesselTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <VesselTypesTable
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
        <VesselTypesTable
          data={vesselTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewVesselType : undefined}
          onDeleteAction={canDelete ? handleDeleteVesselType : undefined}
          onEditAction={canEdit ? handleEditVesselType : undefined}
          onCreateAction={canCreate ? handleCreateVesselType : undefined}
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
              {modalMode === "create" && "Create Vessel Type"}
              {modalMode === "edit" && "Update Vessel Type"}
              {modalMode === "view" && "View Vessel Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new vessel type to the system database."
                : modalMode === "edit"
                  ? "Update vessel type information in the system database."
                  : "View vessel type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <VesselTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedVesselType
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

      {/* Load Existing Vessel Type Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingVesselType}
        onCancelAction={() => setExistingVesselType(null)}
        code={existingVesselType?.vesselTypeCode}
        name={existingVesselType?.vesselTypeName}
        typeLabel="Vessel Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Vessel Type"
        description="This action cannot be undone. This will permanently delete the vessel type from our servers."
        itemName={deleteConfirmation.vesselTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            vesselTypeId: null,
            vesselTypeName: null,
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
          modalMode === "create" ? "Create Vessel Type" : "Update Vessel Type"
        }
        itemName={saveConfirmation.data?.vesselTypeName || ""}
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

