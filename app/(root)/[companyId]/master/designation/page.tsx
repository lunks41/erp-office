"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IDesignation, IDesignationFilter } from "@/interfaces/designation"
import { DesignationSchemaType } from "@/schemas/designation"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { Designation } from "@/lib/api-routes"
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

import { DesignationForm } from "./components/designation-form"
import { DesignationsTable } from "./components/designation-table"

export default function DesignationPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.designation

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IDesignationFilter>({})
  const [searchInput, setSearchInput] = useState("")
  const { defaults } = useUserSettingDefaults()
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
      setFilters(newFilters as IDesignationFilter)
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
    data: designationsResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IDesignation>(
    `${Designation.get}`,
    "designations",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: designationsResult,
    data: designationsData,
    totalRecords,
  } = (designationsResponse as ApiResponse<IDesignation>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  useEffect(() => {
    if (designationsData?.length > 0) {
      refetch()
    }
  }, [filters, designationsData?.length, refetch])

  const saveMutation = usePersist<DesignationSchemaType>(`${Designation.add}`)
  const updateMutation = usePersist<DesignationSchemaType>(`${Designation.add}`)
  const deleteMutation = useDelete(`${Designation.delete}`)

  const [selectedDesignation, setSelectedDesignation] =
    useState<IDesignation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingDesignation, setExistingDesignation] =
    useState<IDesignation | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    designationId: string | null
    designationName: string | null
  }>({
    isOpen: false,
    designationId: null,
    designationName: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateDesignation = () => {
    setModalMode("create")
    setSelectedDesignation(null)
    setIsModalOpen(true)
  }

  const handleEditDesignation = (designation: IDesignation) => {
    setModalMode("edit")
    setSelectedDesignation(designation)
    setIsModalOpen(true)
  }

  const handleViewDesignation = (designation: IDesignation | null) => {
    if (!designation) return
    setModalMode("view")
    setSelectedDesignation(designation)
    setIsModalOpen(true)
  }

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: DesignationSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: DesignationSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: DesignationSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["designations"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedDesignation) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["designations"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteDesignation = (designationId: string) => {
    const designationToDelete = designationsData?.find(
      (d) => d.designationId.toString() === designationId
    )
    if (!designationToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      designationId,
      designationName: designationToDelete.designationName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.designationId) {
      deleteMutation.mutateAsync(deleteConfirmation.designationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["designations"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        designationId: null,
        designationName: null,
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
        const response = await getById(
          `${Designation.getByCode}/${trimmedCode}`
        )
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const designationData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (designationData) {
            // Ensure all required fields are present
            const validDesignationData: IDesignation = {
              designationId: designationData.designationId,
              companyId: designationData.companyId,
              designationCode: designationData.designationCode,
              designationName: designationData.designationName,
              remarks: designationData.remarks || "",
              isActive: designationData.isActive ?? true,
              createBy: designationData.createBy,
              editBy: designationData.editBy,
              createDate: designationData.createDate,
              editDate: designationData.editDate,
            }
            setExistingDesignation(validDesignationData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing designation
  const handleLoadExistingDesignation = () => {
    if (existingDesignation) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedDesignation(existingDesignation)
      setShowLoadDialog(false)
      setExistingDesignation(null)
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
            Designations
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage designation information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search designations..."
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
      ) : designationsResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <DesignationsTable
            data={[]}
            onSelect={() => {}}
            onDeleteAction={() => {}}
            onEditAction={() => {}}
            onCreateAction={() => {}}
            onRefreshAction={() => {}}
            onFilterChange={() => {}}
            moduleId={moduleId}
            transactionId={transactionId}
            isLoading={false}
            canEdit={false}
            canDelete={false}
            canView={false}
            canCreate={false}
          />
        </LockSkeleton>
      ) : designationsResult ? (
        <DesignationsTable
          data={designationsData || []}
          onSelect={canView ? handleViewDesignation : undefined}
          onDeleteAction={canDelete ? handleDeleteDesignation : undefined}
          onEditAction={canEdit ? handleEditDesignation : undefined}
          onCreateAction={canCreate ? handleCreateDesignation : undefined}
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
          isLoading={isLoading}
          totalRecords={totalRecords}
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            {designationsResult === 0 ? "No data available" : "Loading..."}
          </p>
        </div>
      )}

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
              {modalMode === "create" && "Create Designation"}
              {modalMode === "edit" && "Update Designation"}
              {modalMode === "view" && "View Designation"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new designation to the system database."
                : modalMode === "edit"
                  ? "Update designation information in the system database."
                  : "View designation details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <DesignationForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedDesignation
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

      {/* Load Existing Designation Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingDesignation}
        onCancelAction={() => setExistingDesignation(null)}
        code={existingDesignation?.designationCode}
        name={existingDesignation?.designationName}
        typeLabel="Designation"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Designation"
        description="This action cannot be undone. This will permanently delete the designation from our servers."
        itemName={deleteConfirmation.designationName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            designationId: null,
            designationName: null,
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
          modalMode === "create" ? "Create Designation" : "Update Designation"
        }
        itemName={saveConfirmation.data?.designationName || ""}
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
