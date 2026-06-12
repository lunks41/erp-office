"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  ApiResponse,
  IBarge,
  IBargeFilter,
  IBargeGLMapping,
  IBargeGLMappingFilter,
} from "@/interfaces"
import { BargeGLMappingSchemaType, BargeSchemaType } from "@/schemas"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"
import { Search, X } from "lucide-react"

import { getById } from "@/lib/api-client"
import { Barge, BargeGLMapping } from "@/lib/api-routes"
import { MasterTransactionId, ModuleId } from "@/lib/utils"
import { useDelete, useGetWithPagination, usePersist } from "@/hooks/use-common"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { LoadConfirmation } from "@/components/confirmation/load-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { BargeForm } from "./components/barge-form"
import { BargeTable } from "./components/barge-table"
import { BargeGLMappingForm } from "./components/bargeglmapping-form"
import { BargeGLMappingTable } from "./components/bargeglmapping-table"

export default function BargePage() {
  const params = useParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.barge
  const transactionIdGLMapping = MasterTransactionId.bargeGLMapping

  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()

  // Permissions for Barge
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  // Permissions for BargeGLMapping
  const canViewGLMapping = hasPermission(
    moduleId,
    transactionIdGLMapping,
    "isRead"
  )
  const canEditGLMapping = hasPermission(
    moduleId,
    transactionIdGLMapping,
    "isEdit"
  )
  const canDeleteGLMapping = hasPermission(
    moduleId,
    transactionIdGLMapping,
    "isDelete"
  )
  const canCreateGLMapping = hasPermission(
    moduleId,
    transactionIdGLMapping,
    "isCreate"
  )

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  // State for filters
  const [filters, setFilters] = useState<IBargeFilter>({})
  const [glMappingFilters, setGLMappingFilters] =
    useState<IBargeGLMappingFilter>({})
  const [activeTab, setActiveTab] = useState("barge")
  const [bargeSearchInput, setBargeSearchInput] = useState("")
  const [glMappingSearchInput, setGLMappingSearchInput] = useState("")

  // Separate pagination state for each tab
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [glMappingCurrentPage, setGLMappingCurrentPage] = useState(1)
  const [glMappingPageSize, setGLMappingPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when user settings change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
      setGLMappingPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter change handlers
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IBargeFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleGLMappingFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setGLMappingFilters(newFilters as IBargeGLMappingFilter)
      setGLMappingCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleBargeSearchSubmit = useCallback(() => {
    const normalizedSearch = bargeSearchInput.trim() || undefined
    handleFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [bargeSearchInput, filters.sortOrder, handleFilterChange])

  const handleGLMappingSearchSubmit = useCallback(() => {
    const normalizedSearch = glMappingSearchInput.trim() || undefined
    handleGLMappingFilterChange({
      search: normalizedSearch,
      sortOrder: glMappingFilters.sortOrder,
    })
  }, [
    glMappingFilters.sortOrder,
    glMappingSearchInput,
    handleGLMappingFilterChange,
  ])

  // Page change handlers for each tab
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleGLMappingPageChange = useCallback((page: number) => {
    setGLMappingCurrentPage(page)
  }, [])

  // Page size change handlers for each tab
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleGLMappingPageSizeChange = useCallback((size: number) => {
    setGLMappingPageSize(size)
    setGLMappingCurrentPage(1) // Reset to first page when changing page size
  }, [])

  // Data fetching for Barge
  const {
    data: bargesResponse,
    refetch: refetchBarge,
    isLoading: isLoadingBarge,
  } = useGetWithPagination<IBarge>(
    `${Barge.get}`,
    "barges",
    filters.search,
    currentPage,
    pageSize
  )

  // Data fetching for BargeGLMapping
  const {
    data: bargeGLMappingResponse,
    refetch: refetchBargeGLMapping,
    isLoading: isLoadingBargeGLMapping,
  } = useGetWithPagination<IBargeGLMapping>(
    `${BargeGLMapping.get}`,
    "bargeglmappings",
    glMappingFilters.search,
    glMappingCurrentPage,
    glMappingPageSize
  )

  // Extract data from responses with fallback values
  const {
    result: bargesResult,
    data: bargesData,
    totalRecords: bargesTotalRecords,
  } = (bargesResponse as ApiResponse<IBarge>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const {
    result: bargeGLMappingResult,
    data: bargeGLMappingData,
    totalRecords: bargeGLMappingTotalRecords,
  } = (bargeGLMappingResponse as ApiResponse<IBargeGLMapping>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Mutations for Barge
  const saveMutation = usePersist<BargeSchemaType>(`${Barge.add}`)
  const updateMutation = usePersist<BargeSchemaType>(`${Barge.add}`)
  const deleteMutation = useDelete(`${Barge.delete}`)

  // Mutations for BargeGLMapping
  const saveGLMappingMutation = usePersist<BargeGLMappingSchemaType>(
    `${BargeGLMapping.add}`
  )
  const updateGLMappingMutation = usePersist<BargeGLMappingSchemaType>(
    `${BargeGLMapping.add}`
  )
  const deleteGLMappingMutation = useDelete(`${BargeGLMapping.delete}`)

  // State management for Barge
  const [selectedBarge, setSelectedBarge] = useState<IBarge | undefined>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingBarge, setExistingBarge] = useState<IBarge | null>(null)

  // State management for BargeGLMapping
  const [selectedBargeGLMapping, setSelectedBargeGLMapping] = useState<
    IBargeGLMapping | undefined
  >()
  const [isGLMappingModalOpen, setIsGLMappingModalOpen] = useState(false)
  const [glMappingModalMode, setGLMappingModalMode] = useState<
    "create" | "edit" | "view"
  >("create")

  // State for delete confirmations
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null as string | null,
    name: null as string | null,
    type: "barge" as "barge" | "bargeglmapping",
  })

  // State for save confirmations
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: BargeSchemaType | BargeGLMappingSchemaType | null
    type: "barge" | "bargeglmapping"
  }>({
    isOpen: false,
    data: null,
    type: "barge",
  })

  // Handler to open modal for creating a new account group
  const handleCreateBarge = () => {
    setModalMode("create")
    setSelectedBarge(undefined)
    setIsModalOpen(true)
  }

  // Handler to open modal for editing an account group
  const handleEditBarge = (barge: IBarge) => {
    setModalMode("edit")
    setSelectedBarge(barge)
    setIsModalOpen(true)
  }

  // Handler to open modal for viewing an account group
  const handleViewBarge = (barge: IBarge | null) => {
    if (!barge) return
    setModalMode("view")
    setSelectedBarge(barge)
    setIsModalOpen(true)
  }

  // Action handlers for BargeGLMapping
  const handleCreateBargeGLMapping = () => {
    setGLMappingModalMode("create")
    setSelectedBargeGLMapping(undefined)
    setIsGLMappingModalOpen(true)
  }

  const handleEditBargeGLMapping = (bargeGLMapping: IBargeGLMapping) => {
    setGLMappingModalMode("edit")
    setSelectedBargeGLMapping(bargeGLMapping)
    setIsGLMappingModalOpen(true)
  }

  const handleViewBargeGLMapping = (bargeGLMapping: IBargeGLMapping | null) => {
    if (!bargeGLMapping) return
    setGLMappingModalMode("view")
    setSelectedBargeGLMapping(bargeGLMapping)
    setIsGLMappingModalOpen(true)
  }

  // Helper function for API responses
  const handleApiResponse = (
    response: ApiResponse<IBarge | IBargeGLMapping>
  ) => {
    if (response.result === 1) {
      return true
    } else {
      return false
    }
  }

  // Form handlers for Barge
  const handleBargeSubmit = async (data: BargeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveMutation.mutateAsync(
          data
        )) as ApiResponse<IBarge>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["barges"] })
        }
      } else if (modalMode === "edit" && selectedBarge) {
        const response = (await updateMutation.mutateAsync(
          data
        )) as ApiResponse<IBarge>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["barges"] })
        }
      }
    } catch (error) {
      console.error("Barge form submission error:", error)
    }
  }

  // Form handlers for BargeGLMapping
  const handleBargeGLMappingSubmit = async (data: BargeGLMappingSchemaType) => {
    try {
      if (glMappingModalMode === "create") {
        const response = (await saveGLMappingMutation.mutateAsync(
          data
        )) as ApiResponse<IBargeGLMapping>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["bargeglmappings"] })
        }
      } else if (glMappingModalMode === "edit" && selectedBargeGLMapping) {
        const response = (await updateGLMappingMutation.mutateAsync(
          data
        )) as ApiResponse<IBargeGLMapping>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["bargeglmappings"] })
        }
      }
    } catch (error) {
      console.error("BargeGLMapping form submission error:", error)
    }
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (
    data: BargeSchemaType | BargeGLMappingSchemaType
  ) => {
    try {
      if (saveConfirmation.type === "bargeglmapping") {
        await handleBargeGLMappingSubmit(data as BargeGLMappingSchemaType)
        setIsGLMappingModalOpen(false)
      } else {
        await handleBargeSubmit(data as BargeSchemaType)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: BargeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: "barge",
    })
  }

  const handleGLMappingFormSubmit = (data: BargeGLMappingSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: "bargeglmapping",
    })
  }

  // Delete handlers
  const handleDeleteBarge = (bargeId: string) => {
    const bargeToDelete = bargesData?.find(
      (b) => b.bargeId.toString() === bargeId
    )
    if (!bargeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: bargeId,
      name: bargeToDelete.bargeName,
      type: "barge",
    })
  }

  const handleDeleteBargeGLMapping = (id: string) => {
    const bargeGLMappingToDelete = bargeGLMappingData?.find(
      (b) => b.bargeId.toString() === id
    )
    if (!bargeGLMappingToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: id,
      name: bargeGLMappingToDelete.bargeName,
      type: "bargeglmapping",
    })
  }

  // Individual deletion executors for each entity type
  const executeDeleteBarge = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["barges"] })
  }

  const executeDeleteBargeGLMapping = async (id: string) => {
    await deleteGLMappingMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["bargeglmappings"] })
  }

  // Mapping of deletion types to their executor functions
  const deletionExecutors = {
    barge: executeDeleteBarge,
    bargeglmapping: executeDeleteBargeGLMapping,
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
      type: "barge",
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
        const response = await getById(`${Barge.getByCode}/${trimmedCode}`)

        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const bargeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (bargeData) {
            // Ensure all required fields are present
            const validBargeData: IBarge = {
              bargeId: bargeData.bargeId,
              bargeName: bargeData.bargeName,
              bargeCode: bargeData.bargeCode,
              shortCode: bargeData.shortCode ?? "",
              callSign: bargeData.callSign,
              imoCode: bargeData.imoCode,
              grt: bargeData.grt,
              licenseNo: bargeData.licenseNo,
              bargeType: bargeData.bargeType,
              flag: bargeData.flag,
              remarks: bargeData.remarks || "",
              isActive: bargeData.isActive ?? true,
              isOwn: bargeData.isOwn ?? true,
              companyId: bargeData.companyId,
              createBy: bargeData.createBy,
              editBy: bargeData.editBy,
              createDate: bargeData.createDate,
              editDate: bargeData.editDate,
            }

            setExistingBarge(validBargeData)
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
  const handleLoadExistingBarge = () => {
    if (existingBarge) {
      setModalMode("edit")
      setSelectedBarge(existingBarge)
      setShowLoadDialog(false)
      setExistingBarge(null)
    }
  }

  useEffect(() => {
    setBargeSearchInput(filters.search || "")
  }, [filters.search])

  useEffect(() => {
    setGLMappingSearchInput(glMappingFilters.search || "")
  }, [glMappingFilters.search])

  useEffect(() => {
    setBargeSearchInput(filters.search || "")
  }, [filters.search])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Barges
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage barge information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "barge" ? (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search barges..."
                  value={bargeSearchInput}
                  onChange={(e) => setBargeSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBargeSearchSubmit()
                    }
                    if (e.key === "Escape") {
                      setBargeSearchInput("")
                      handleFilterChange({
                        search: undefined,
                        sortOrder: filters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {bargeSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setBargeSearchInput("")
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
                onClick={handleBargeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          ) : (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search barge GL mappings..."
                  value={glMappingSearchInput}
                  onChange={(e) => setGLMappingSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGLMappingSearchSubmit()
                    }
                    if (e.key === "Escape") {
                      setGLMappingSearchInput("")
                      handleGLMappingFilterChange({
                        search: undefined,
                        sortOrder: glMappingFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {glMappingSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setGLMappingSearchInput("")
                      handleGLMappingFilterChange({
                        search: undefined,
                        sortOrder: glMappingFilters.sortOrder,
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
                onClick={handleGLMappingSearchSubmit}
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
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="barge">Barge</TabsTrigger>
          <TabsTrigger value="bargeglmapping">Barge GL Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="barge" className="space-y-4">
          {isLoadingBarge ? (
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
          ) : bargesResult === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <BargeTable
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
            <BargeTable
              data={bargesData || []}
              isLoading={isLoadingBarge}
              totalRecords={bargesTotalRecords}
              onSelect={canView ? handleViewBarge : undefined}
              onDeleteAction={canDelete ? handleDeleteBarge : undefined}
              onEditAction={canEdit ? handleEditBarge : undefined}
              onCreateAction={canCreate ? handleCreateBarge : undefined}
              onRefreshAction={refetchBarge}
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
        </TabsContent>

        <TabsContent value="bargeglmapping" className="space-y-4">
          {isLoadingBargeGLMapping ? (
            <DataTableSkeleton
              columnCount={8}
              filterCount={2}
              cellWidths={[
                "10rem",
                "30rem",
                "10rem",
                "10rem",
                "10rem",
                "6rem",
                "6rem",
                "6rem",
              ]}
              shrinkZero
            />
          ) : bargeGLMappingResult === -2 ||
            (!canViewGLMapping &&
              !canEditGLMapping &&
              !canDeleteGLMapping &&
              !canCreateGLMapping) ? (
            <LockSkeleton locked={true}>
              <BargeGLMappingTable
                data={[]}
                isLoading={false}
                totalRecords={bargeGLMappingTotalRecords}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={moduleId}
                transactionId={transactionIdGLMapping}
                canEdit={false}
                canDelete={false}
                canView={false}
                canCreate={false}
              />
            </LockSkeleton>
          ) : (
            <BargeGLMappingTable
              data={bargeGLMappingData || []}
              totalRecords={bargeGLMappingTotalRecords}
              onSelect={canViewGLMapping ? handleViewBargeGLMapping : undefined}
              onDeleteAction={
                canDeleteGLMapping ? handleDeleteBargeGLMapping : undefined
              }
              onEditAction={
                canEditGLMapping ? handleEditBargeGLMapping : undefined
              }
              onCreateAction={
                canCreateGLMapping ? handleCreateBargeGLMapping : undefined
              }
              onRefreshAction={refetchBargeGLMapping}
              onFilterChange={handleGLMappingFilterChange}
              initialSearchValue={glMappingFilters.search}
              onPageChange={handleGLMappingPageChange}
              onPageSizeChange={handleGLMappingPageSizeChange}
              currentPage={glMappingCurrentPage}
              pageSize={glMappingPageSize}
              serverSidePagination={true}
              moduleId={moduleId}
              transactionId={transactionIdGLMapping}
              canEdit={canEditGLMapping}
              canDelete={canDeleteGLMapping}
              canView={canViewGLMapping}
              canCreate={canCreateGLMapping}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Barge Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Barge"}
              {modalMode === "edit" && "Update Barge"}
              {modalMode === "view" && "View Barge"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new barge to the system database."
                : modalMode === "edit"
                  ? "Update barge information in the system database."
                  : "View barge details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <BargeForm
            initialData={modalMode !== "create" ? selectedBarge : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* BargeGLMapping Form Dialog */}
      <Dialog
        open={isGLMappingModalOpen}
        onOpenChange={setIsGLMappingModalOpen}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {glMappingModalMode === "create" && "Create Barge GL Mapping"}
              {glMappingModalMode === "edit" && "Update Barge GL Mapping"}
              {glMappingModalMode === "view" && "View Barge GL Mapping"}
            </DialogTitle>
            <DialogDescription>
              {glMappingModalMode === "create"
                ? "Add a new barge GL mapping to the system database."
                : glMappingModalMode === "edit"
                  ? "Update barge GL mapping information."
                  : "View barge GL mapping details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <BargeGLMappingForm
            initialData={
              glMappingModalMode !== "create"
                ? selectedBargeGLMapping
                : undefined
            }
            submitAction={handleGLMappingFormSubmit}
            onCancelAction={() => setIsGLMappingModalOpen(false)}
            isSubmitting={
              saveGLMappingMutation.isPending ||
              updateGLMappingMutation.isPending
            }
            isReadOnly={glMappingModalMode === "view"}
            companyId={companyId}
          />
        </DialogContent>
      </Dialog>

      {/* Duplicate Record Dialogs */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingBarge}
        onCancelAction={() => setExistingBarge(null)}
        code={existingBarge?.bargeCode}
        name={existingBarge?.bargeName}
        typeLabel="Barge"
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
            type: "barge",
          })
        }
        isDeleting={
          deleteConfirmation.type === "barge"
            ? deleteMutation.isPending
            : deleteGLMappingMutation.isPending
        }
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={
          (
            saveConfirmation.type === "barge"
              ? modalMode === "create"
              : glMappingModalMode === "create"
          )
            ? `Create ${saveConfirmation.type.toUpperCase()}`
            : `Update ${saveConfirmation.type.toUpperCase()}`
        }
        itemName={
          saveConfirmation.type === "barge"
            ? (saveConfirmation.data as BargeSchemaType)?.bargeName || ""
            : (saveConfirmation.data as BargeGLMappingSchemaType)
              ? bargeGLMappingData?.find(
                  (b) =>
                    b.bargeId ===
                    (saveConfirmation.data as BargeGLMappingSchemaType).bargeId
                )?.bargeName || ""
              : ""
        }
        operationType={
          (
            saveConfirmation.type === "barge"
              ? modalMode === "create"
              : glMappingModalMode === "create"
          )
            ? "create"
            : "update"
        }
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "barge",
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "barge",
          })
        }
        isSaving={
          saveConfirmation.type === "barge"
            ? saveMutation.isPending || updateMutation.isPending
            : saveGLMappingMutation.isPending ||
              updateGLMappingMutation.isPending
        }
      />
    </div>
  )
}
