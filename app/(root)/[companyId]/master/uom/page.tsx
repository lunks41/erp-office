"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IUom, IUomDt, IUomFilter } from "@/interfaces/uom"
import { UomDtSchemaType, UomSchemaType } from "@/schemas/uom"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getData } from "@/lib/api-client"
import { Uom, UomDt } from "@/lib/api-routes"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { LoadConfirmation } from "@/components/confirmation/load-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { UomForm } from "./components/uom-form"
import { UomTable } from "./components/uom-table"
import { UomDtForm } from "./components/uomdt-form"
import { UomDtTable } from "./components/uomdt-table"

export default function UomPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.uom
  const transactionIdDt = MasterTransactionId.uomDt

  const { hasPermission } = usePermissionStore()

  // Permissions
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreateDt = hasPermission(moduleId, transactionIdDt, "isCreate")
  const canViewDt = hasPermission(moduleId, transactionIdDt, "isRead")
  const canEditDt = hasPermission(moduleId, transactionIdDt, "isEdit")
  const canDeleteDt = hasPermission(moduleId, transactionIdDt, "isDelete")

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  // State for filters
  const [filters, setFilters] = useState<IUomFilter>({})
  const [dtFilters, setDtFilters] = useState<IUomFilter>({})

    const [activeTab, setActiveTab] = useState("uom")

  const [uomSearchInput, setUomSearchInput] = useState("")
  const [uomDtSearchInput, setUomDtSearchInput] = useState("")
// Separate pagination state for each tab
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [dtCurrentPage, setDtCurrentPage] = useState(1)
  const [dtPageSize, setDtPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when user settings change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
      setDtPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  
  const handleUomFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = uomSearchInput.trim() || undefined
    handleUomFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [handleUomFilterChange, filters.sortOrder, uomSearchInput])


  const handleUomDtFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = uomDtSearchInput.trim() || undefined
    handleUomDtFilterChange({
      search: normalizedSearch,
      sortOrder: dtFilters.sortOrder,
    })
  }, [handleUomDtFilterChange, dtFilters.sortOrder, uomDtSearchInput])

// Page change handlers for each tab
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleDtPageChange = useCallback((page: number) => {
    setDtCurrentPage(page)
  }, [])

  // Page size change handlers for each tab
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleDtPageSizeChange = useCallback((size: number) => {
    setDtPageSize(size)
    setDtCurrentPage(1) // Reset to first page when changing page size
  }, [])

  // Data fetching
  const {
    data: uomsResponse,
    refetch: refetchUom,
    isLoading: isLoadingUom,
  } = useGetWithPagination<IUom>(
    `${Uom.get}`,
    "uoms",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    data: uomDtResponse,
    refetch: refetchUomDt,
    isLoading: isLoadingUomDt,
  } = useGetWithPagination<IUomDt>(
    `${UomDt.get}`,
    "uomsdt",
    dtFilters.search,
    dtCurrentPage,
    dtPageSize
  )

  // Extract data from responses
  const uomsData = (uomsResponse as ApiResponse<IUom>)?.data || []
  const uomDtData = (uomDtResponse as ApiResponse<IUomDt>)?.data || []
  const totalRecords = (uomsResponse as ApiResponse<IUom>)?.totalRecords || 0
  const totalRecordsDt =
    (uomDtResponse as ApiResponse<IUomDt>)?.totalRecords || 0
  // Mutations
  const saveMutation = usePersist<UomSchemaType>(`${Uom.add}`)
  const updateMutation = usePersist<UomSchemaType>(`${Uom.add}`)
  const deleteMutation = useDelete(`${Uom.delete}`)

  const saveDtMutation = usePersist<UomDtSchemaType>(`${UomDt.add}`)
  const updateDtMutation = usePersist<UomDtSchemaType>(`${UomDt.add}`)
  const deleteDtMutation = useDelete(`${UomDt.delete}`)

  // State management
  const [selectedUom, setSelectedUom] = useState<IUom | undefined>()
  const [selectedUomDt, setSelectedUomDt] = useState<IUomDt | undefined>()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDtModalOpen, setIsDtModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null as string | null,
    name: null as string | null,
    type: "uom" as "uom" | "uomdt",
  })

  // Duplicate detection states
  const [showLoadDialogUom, setShowLoadDialogUom] = useState(false)
  const [existingUom, setExistingUom] = useState<IUom | null>(null)

  // Refetch when filters change
  useEffect(() => {
    if (filters.search !== undefined) refetchUom()
  }, [filters.search, refetchUom])

  useEffect(() => {
    if (dtFilters.search !== undefined) refetchUomDt()
  }, [dtFilters.search, refetchUomDt])

  // Action handlers
  const handleCreateUom = () => {
    setModalMode("create")
    setSelectedUom(undefined)
    setIsModalOpen(true)
  }

  const handleEditUom = (uom: IUom) => {
    setModalMode("edit")
    setSelectedUom(uom)
    setIsModalOpen(true)
  }

  const handleViewUom = (uom: IUom | null) => {
    if (!uom) return
    setModalMode("view")
    setSelectedUom(uom)
    setIsModalOpen(true)
  }

  const handleCreateUomDt = () => {
    setModalMode("create")
    setSelectedUomDt(undefined)
    setIsDtModalOpen(true)
  }

  const handleEditUomDt = (uomDt: IUomDt) => {
    setModalMode("edit")
    setSelectedUomDt(uomDt)
    setIsDtModalOpen(true)
  }

  const handleViewUomDt = (uomDt: IUomDt | null) => {
    if (!uomDt) return
    setModalMode("view")
    setSelectedUomDt(uomDt)
    setIsDtModalOpen(true)
  }

  // Filter handlers
  const handleUomFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IUomFilter)
    },
    []
  )

  const handleUomDtFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setDtFilters(newFilters as IUomFilter)
      setDtCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  // Helper function for API responses
  const handleApiResponse = (response: ApiResponse<IUom | IUomDt>) => {
    if (response.result === 1) {
      return true
    } else {
      return false
    }
  }

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: UomSchemaType | UomDtSchemaType | null
    type: "uom" | "uomdt"
  }>({
    isOpen: false,
    data: null,
    type: "uom",
  })

  // Specialized form handlers
  const handleUomSubmit = async (data: UomSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveMutation.mutateAsync(
          data
        )) as ApiResponse<IUom>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["uoms"] })
        }
      } else if (modalMode === "edit" && selectedUom) {
        const response = (await updateMutation.mutateAsync(
          data
        )) as ApiResponse<IUom>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["uoms"] })
        }
      }
    } catch (error) {
      console.error("UOM form submission error:", error)
    }
  }

  const handleUomDtSubmit = async (data: UomDtSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveDtMutation.mutateAsync(
          data
        )) as ApiResponse<IUomDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["uomsdt"] })
        }
      } else if (modalMode === "edit" && selectedUomDt) {
        const response = (await updateDtMutation.mutateAsync(
          data
        )) as ApiResponse<IUomDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["uomsdt"] })
        }
      }
    } catch (error) {
      console.error("UOM Details form submission error:", error)
    }
  }

  // Main form submit handler - shows confirmation first
  const handleFormSubmit = (data: UomSchemaType | UomDtSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: isDtModalOpen ? "uomdt" : "uom",
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (
    data: UomSchemaType | UomDtSchemaType
  ) => {
    try {
      if (saveConfirmation.type === "uomdt") {
        await handleUomDtSubmit(data as UomDtSchemaType)
        setIsDtModalOpen(false)
      } else {
        await handleUomSubmit(data as UomSchemaType)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // Delete handlers
  const handleDeleteUom = (uomId: string) => {
    const uomToDelete = uomsData.find((c) => c.uomId.toString() === uomId)
    if (!uomToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: uomId,
      name: uomToDelete.uomName,
      type: "uom",
    })
  }

  const handleDeleteUomDt = (uomId: string) => {
    const uomDtToDelete = uomDtData.find((c) => c.uomId.toString() === uomId)
    if (!uomDtToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: uomId,
      name: uomDtToDelete.uomName,
      type: "uomdt",
    })
  }

  // Individual deletion executors for each entity type
  const executeDeleteUom = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["uoms"] })
  }

  const executeDeleteUomDt = async (id: string) => {
    await deleteDtMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["uomsdt"] })
  }

  // Mapping of deletion types to their executor functions
  const deletionExecutors = {
    uom: executeDeleteUom,
    uomdt: executeDeleteUomDt,
  } as const

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.id || !deleteConfirmation.type) return

    const executor = deletionExecutors[deleteConfirmation.type]
    if (!executor) return

    await executor(deleteConfirmation.id)

    setDeleteConfirmation({
      isOpen: false,
      id: null,
      name: null,
      type: "uom",
    })
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
        const response = (await getData(
          `${Uom.getByCode}/${trimmedCode}`
        )) as ApiResponse<IUom>

        if (response.result === 1 && response.data) {
          const uomData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (uomData) {
            setExistingUom(uomData as IUom)
            setShowLoadDialogUom(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Load existing records
  const handleLoadExistingUom = () => {
    if (existingUom) {
      setModalMode("edit")
      setSelectedUom(existingUom)
      setShowLoadDialogUom(false)
      setExistingUom(null)
    }
  }
  useEffect(() => {
    setUomSearchInput(filters.search || "")
  }, [filters.search])
  useEffect(() => {
    setUomDtSearchInput(dtFilters.search || "")
  }, [dtFilters.search])





  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">UOM</h1>
          <p className="text-muted-foreground text-sm">
            Manage UOM information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "uom" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search UOM..."
                  value={uomSearchInput}
                  onChange={(evt) => setUomSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleUomFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setUomSearchInput("")
                      handleUomFilterChange({
                        search: undefined,
                        sortOrder: filters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {uomSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setUomSearchInput("")
                      handleUomFilterChange({
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
                onClick={handleUomFilterChangeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          )}
          {activeTab === "uomdt" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search UOM details..."
                  value={uomDtSearchInput}
                  onChange={(evt) => setUomDtSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleUomDtFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setUomDtSearchInput("")
                      handleUomDtFilterChange({
                        search: undefined,
                        sortOrder: dtFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {uomDtSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setUomDtSearchInput("")
                      handleUomDtFilterChange({
                        search: undefined,
                        sortOrder: dtFilters.sortOrder,
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
                onClick={handleUomDtFilterChangeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="uom"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="uom">UOM</TabsTrigger>
          <TabsTrigger value="uomdt">UOM Details</TabsTrigger>
        </TabsList>

        <TabsContent value="uom" className="space-y-4">
          {isLoadingUom ? (
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
          ) : (uomsResponse as ApiResponse<IUom>)?.result === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <UomTable
                data={[]}
                isLoading={false}
                totalRecords={totalRecords}
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
            <UomTable
              data={uomsData}
              isLoading={isLoadingUom}
              totalRecords={totalRecords}
              onSelect={canView ? handleViewUom : undefined}
              onDeleteAction={canDelete ? handleDeleteUom : undefined}
              onEditAction={canEdit ? handleEditUom : undefined}
              onCreateAction={canCreate ? handleCreateUom : undefined}
              onRefreshAction={refetchUom}
              onFilterChange={handleUomFilterChange}
              initialSearchValue={filters.search}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              currentPage={currentPage}
              pageSize={pageSize}
              serverSidePagination={true}
              moduleId={moduleId}
              transactionId={transactionId}
            />
          )}
        </TabsContent>

        <TabsContent value="uomdt" className="space-y-4">
          {isLoadingUomDt ? (
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
          ) : (uomDtResponse as ApiResponse<IUomDt>)?.result === -2 ||
            (!canViewDt && !canEditDt && !canDeleteDt && !canCreateDt) ? (
            <LockSkeleton locked={true}>
              <UomDtTable
                data={[]}
                totalRecords={totalRecordsDt}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={moduleId}
                transactionId={transactionIdDt}
                canView={false}
                canCreate={false}
                canEdit={false}
                canDelete={false}
              />
            </LockSkeleton>
          ) : (
            <UomDtTable
              data={uomDtData}
              totalRecords={totalRecordsDt}
              onSelect={canViewDt ? handleViewUomDt : undefined}
              onDeleteAction={canDeleteDt ? handleDeleteUomDt : undefined}
              onEditAction={canEditDt ? handleEditUomDt : undefined}
              onCreateAction={canCreateDt ? handleCreateUomDt : undefined}
              onRefreshAction={refetchUomDt}
              onFilterChange={handleUomDtFilterChange}
              onPageChange={handleDtPageChange}
              onPageSizeChange={handleDtPageSizeChange}
              currentPage={dtCurrentPage}
              pageSize={dtPageSize}
              serverSidePagination={true}
              moduleId={moduleId}
              transactionId={transactionIdDt}
              canView={canViewDt}
              canCreate={canCreateDt}
              canEdit={canEditDt}
              canDelete={canDeleteDt}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* UOM Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create UOM"}
              {modalMode === "edit" && "Update UOM"}
              {modalMode === "view" && "View UOM"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new UOM to the system database."
                : modalMode === "edit"
                  ? "Update UOM information in the system database."
                  : "View UOM details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <UomForm
            initialData={modalMode !== "create" ? selectedUom : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* UOM Details Form Dialog */}
      <Dialog open={isDtModalOpen} onOpenChange={setIsDtModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create UOM Details"}
              {modalMode === "edit" && "Update UOM Details"}
              {modalMode === "view" && "View UOM Details"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add new UOM details to the system database."
                : modalMode === "edit"
                  ? "Update UOM details information."
                  : "View UOM details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <UomDtForm
            initialData={modalMode !== "create" ? selectedUomDt : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsDtModalOpen(false)}
            isSubmitting={
              saveDtMutation.isPending || updateDtMutation.isPending
            }
            isReadOnly={modalMode === "view"}
          />
        </DialogContent>
      </Dialog>

      {/* Duplicate Record Dialog */}
      <LoadConfirmation
        open={showLoadDialogUom}
        onOpenChange={setShowLoadDialogUom}
        onLoad={handleLoadExistingUom}
        onCancelAction={() => setExistingUom(null)}
        code={existingUom?.uomCode}
        name={existingUom?.uomName}
        typeLabel="UOM"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={`Delete ${deleteConfirmation.type.toUpperCase()}`}
        description={`This action cannot be undone. This will permanently delete the ${deleteConfirmation.type} from our servers.`}
        itemName={deleteConfirmation.name || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            id: null,
            name: null,
            type: "uom",
          })
        }
        isDeleting={
          deleteConfirmation.type === "uom"
            ? deleteMutation.isPending
            : deleteDtMutation.isPending
        }
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={
          modalMode === "create"
            ? `Create ${saveConfirmation.type.toUpperCase()}`
            : `Update ${saveConfirmation.type.toUpperCase()}`
        }
        itemName={
          saveConfirmation.type === "uom"
            ? (saveConfirmation.data as UomSchemaType)?.uomName || ""
            : (saveConfirmation.data as UomDtSchemaType)?.uomId?.toString() ||
              ""
        }
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "uom",
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "uom",
          })
        }
        isSaving={
          saveConfirmation.type === "uom"
            ? saveMutation.isPending || updateMutation.isPending
            : saveDtMutation.isPending || updateDtMutation.isPending
        }
      />
    </div>
  )
}
