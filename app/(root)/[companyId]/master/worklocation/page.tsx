"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { IWorkLocation, IWorkLocationFilter } from "@/interfaces"
import { ApiResponse } from "@/interfaces/auth"
import { WorkLocationSchemaType } from "@/schemas"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { WorkLocation } from "@/lib/api-routes"
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

import { WorkLocationForm } from "./components/worklocation-form"
import { WorkLocationTable } from "./components/worklocation-table"

export default function WorkLocationPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.workLocation

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
  const [filters, setFilters] = useState<IWorkLocationFilter>({})
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
      setFilters(newFilters as IWorkLocationFilter)
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
    data: workLocationsResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IWorkLocation>(
    `${WorkLocation.get}`,
    "workLocations",
    filters.search,
    currentPage,
    pageSize
  )

  // Destructure with fallback values
  const {
    result: workLocationsResult,
    data: workLocationsData,
    totalRecords,
  } = (workLocationsResponse as ApiResponse<IWorkLocation>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Handle result = -1 and result = -2 cases
  useEffect(() => {
    if (!workLocationsResponse) return

    if (workLocationsResponse.result === -1) {
      setFilters({})
    } else if (workLocationsResponse.result === -2 && !isLocked) {
      setIsLocked(true)
    } else if (workLocationsResponse.result !== -2) {
      setIsLocked(false)
    }
  }, [workLocationsResponse, isLocked])

  // Define mutations for CRUD operations
  const saveMutation = usePersist<WorkLocationSchemaType>(`${WorkLocation.add}`)
  const updateMutation = usePersist<WorkLocationSchemaType>(
    `${WorkLocation.add}`
  )
  const deleteMutation = useDelete(`${WorkLocation.delete}`)

  // State for modal and selected account group
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<
    IWorkLocation | undefined
  >(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingWorkLocation, setExistingWorkLocation] =
    useState<IWorkLocation | null>(null)

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    workLocationId: string | null
    workLocationName: string | null
  }>({
    isOpen: false,
    workLocationId: null,
    workLocationName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: WorkLocationSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler to Re-fetches data when called
  const handleRefresh = () => {
    refetch()
  }

  // Handler to open modal for creating a new account group
  const handleCreateWorkLocation = () => {
    setModalMode("create")
    setSelectedWorkLocation(undefined)
    setIsModalOpen(true)
  }

  // Handler to open modal for editing an account group
  const handleEditWorkLocation = (workLocation: IWorkLocation) => {
    setModalMode("edit")
    setSelectedWorkLocation(workLocation)
    setIsModalOpen(true)
  }

  // Handler to open modal for viewing an account group
  const handleViewWorkLocation = (workLocation: IWorkLocation | null) => {
    if (!workLocation) return
    setModalMode("view")
    setSelectedWorkLocation(workLocation)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: WorkLocationSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: WorkLocationSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the workLocations query
          queryClient.invalidateQueries({ queryKey: ["workLocations"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedWorkLocation) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          // Invalidate and refetch the workLocations query
          queryClient.invalidateQueries({ queryKey: ["workLocations"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  // Handler for deleting an account group
  const handleDeleteWorkLocation = (workLocationId: string) => {
    const workLocationToDelete = workLocationsData?.find(
      (ag) => ag.workLocationId.toString() === workLocationId
    )
    if (!workLocationToDelete) return

    // Open delete confirmation dialog with account group details
    setDeleteConfirmation({
      isOpen: true,
      workLocationId,
      workLocationName: workLocationToDelete.workLocationName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.workLocationId) {
      deleteMutation.mutateAsync(deleteConfirmation.workLocationId).then(() => {
        // Invalidate and refetch the workLocations query after successful deletion
        queryClient.invalidateQueries({ queryKey: ["workLocations"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        workLocationId: null,
        workLocationName: null,
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
          `${WorkLocation.getByCode}/${trimmedCode}`
        )

        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const workLocationData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (workLocationData) {
            // Ensure all required fields are present
            const validWorklocationData: IWorkLocation = {
              workLocationId: workLocationData.workLocationId,
              workLocationCode: workLocationData.workLocationCode,
              workLocationName: workLocationData.workLocationName,
              address1: workLocationData.address1,
              address2: workLocationData.address2,
              city: workLocationData.city,
              postalCode: workLocationData.postalCode,
              countryId: workLocationData.countryId,
              countryName: workLocationData.countryName,
              isActive: workLocationData.isActive ?? true,
              createBy: workLocationData.createBy,
              editBy: workLocationData.editBy,
              createDate: workLocationData.createDate,
              editDate: workLocationData.editDate,
            }

            setExistingWorkLocation(validWorklocationData)
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
  const handleLoadExistingWorkLocation = () => {
    if (existingWorkLocation) {
      setModalMode("edit")
      setSelectedWorkLocation(existingWorkLocation)
      setShowLoadDialog(false)
      setExistingWorkLocation(null)
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
            Work Locations
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage work location information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search work locations..."
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

      {/* Work Locations Table */}
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
      ) : workLocationsResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <WorkLocationTable
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
        <WorkLocationTable
          data={workLocationsData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewWorkLocation : undefined}
          onDeleteAction={canDelete ? handleDeleteWorkLocation : undefined}
          onEditAction={canEdit ? handleEditWorkLocation : undefined}
          onCreateAction={canCreate ? handleCreateWorkLocation : undefined}
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
              {modalMode === "create" && "Create WorkLocation"}
              {modalMode === "edit" && "Update WorkLocation"}
              {modalMode === "view" && "View WorkLocation"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new workLocation to the system database."
                : modalMode === "edit"
                  ? "Update work location information in the system database."
                  : "View workLocation details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <WorkLocationForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedWorkLocation
                : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={
              modalMode === "view" ||
              (modalMode === "create" && !canCreate) ||
              (modalMode === "edit" && !canEdit)
            }
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Account Group Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingWorkLocation}
        onCancelAction={() => setExistingWorkLocation(null)}
        code={existingWorkLocation?.workLocationCode}
        name={existingWorkLocation?.workLocationName}
        typeLabel="WorkLocation"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete WorkLocation"
        description="This action cannot be undone. This will permanently delete the workLocation from our servers."
        itemName={deleteConfirmation.workLocationName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            workLocationId: null,
            workLocationName: null,
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
          modalMode === "create" ? "Create WorkLocation" : "Update WorkLocation"
        }
        itemName={saveConfirmation.data?.workLocationName || ""}
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
