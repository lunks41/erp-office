"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  ApiResponse,
  ICharge,
  IChargeFilter,
  IChargeGLMapping,
  IChargeGLMappingFilter,
} from "@/interfaces"
import { ChargeGLMappingSchemaType, ChargeSchemaType } from "@/schemas"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"
import { Search, X } from "lucide-react"

import { getById } from "@/lib/api-client"
import { Charge, ChargeGLMapping } from "@/lib/api-routes"
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

import { ChargeForm } from "./components/charge-form"
import { ChargeTable } from "./components/charge-table"
import { ChargeGLMappingForm } from "./components/chargeglmapping-form"
import { ChargeGLMappingTable } from "./components/chargeglmapping-table"

export default function ChargePage() {
  const params = useParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.charge
  const transactionIdGLMapping = MasterTransactionId.chargeGLMapping

  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()

  // Permissions for Charge
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  // Permissions for ChargeGLMapping
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
  const [filters, setFilters] = useState<IChargeFilter>({})
  const [glMappingFilters, setGLMappingFilters] =
    useState<IChargeGLMappingFilter>({})
  const [activeTab, setActiveTab] = useState("charge")
  const [chargeSearchInput, setChargeSearchInput] = useState("")
  const [glMappingSearchInput, setGlMappingSearchInput] = useState("")

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
      setFilters(newFilters as IChargeFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleGLMappingFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setGLMappingFilters(newFilters as IChargeGLMappingFilter)
      setGLMappingCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = chargeSearchInput.trim() || undefined
    handleFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [chargeSearchInput, filters.sortOrder, handleFilterChange])

  const handleGLMappingFilterChangeSearchSubmit = useCallback(() => {
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

  // Data fetching for Charge
  const {
    data: chargesResponse,
    refetch: refetchCharge,
    isLoading: isLoadingCharge,
  } = useGetWithPagination<ICharge>(
    `${Charge.get}`,
    "charges",
    filters.search,
    currentPage,
    pageSize
  )

  // Data fetching for ChargeGLMapping
  const {
    data: chargeGLMappingResponse,
    refetch: refetchChargeGLMapping,
    isLoading: isLoadingChargeGLMapping,
  } = useGetWithPagination<IChargeGLMapping>(
    `${ChargeGLMapping.get}`,
    "chargeglmappings",
    glMappingFilters.search,
    glMappingCurrentPage,
    glMappingPageSize
  )

  // Extract data from responses with fallback values
  const {
    result: chargesResult,
    data: chargesData,
    totalRecords: chargesTotalRecords,
  } = (chargesResponse as ApiResponse<ICharge>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const {
    result: chargeGLMappingResult,
    data: chargeGLMappingData,
    totalRecords: chargeGLMappingTotalRecords,
  } = (chargeGLMappingResponse as ApiResponse<IChargeGLMapping>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Mutations for Charge
  const saveMutation = usePersist<ChargeSchemaType>(`${Charge.add}`)
  const updateMutation = usePersist<ChargeSchemaType>(`${Charge.add}`)
  const deleteMutation = useDelete(`${Charge.delete}`)

  // Mutations for ChargeGLMapping
  const saveGLMappingMutation = usePersist<ChargeGLMappingSchemaType>(
    `${ChargeGLMapping.add}`
  )
  const updateGLMappingMutation = usePersist<ChargeGLMappingSchemaType>(
    `${ChargeGLMapping.add}`
  )
  const deleteGLMappingMutation = useDelete(`${ChargeGLMapping.delete}`)

  // State management for Charge
  const [selectedCharge, setSelectedCharge] = useState<ICharge | undefined>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingCharge, setExistingCharge] = useState<ICharge | null>(null)

  // State management for ChargeGLMapping
  const [selectedChargeGLMapping, setSelectedChargeGLMapping] = useState<
    IChargeGLMapping | undefined
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
    type: "charge" as "charge" | "chargeglmapping",
  })

  // State for save confirmations
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: ChargeSchemaType | ChargeGLMappingSchemaType | null
    type: "charge" | "chargeglmapping"
  }>({
    isOpen: false,
    data: null,
    type: "charge",
  })

  // Refetch when filters change
  useEffect(() => {
    if (filters.search !== undefined) refetchCharge()
  }, [filters.search, refetchCharge])

  useEffect(() => {
    if (glMappingFilters.search !== undefined) refetchChargeGLMapping()
  }, [glMappingFilters.search, refetchChargeGLMapping])

  // Action handlers for Charge
  const handleCreateCharge = () => {
    setModalMode("create")
    setSelectedCharge(undefined)
    setIsModalOpen(true)
  }

  const handleEditCharge = (charge: ICharge) => {
    setModalMode("edit")
    setSelectedCharge(charge)
    setIsModalOpen(true)
  }

  const handleViewCharge = (charge: ICharge | null) => {
    if (!charge) return
    setModalMode("view")
    setSelectedCharge(charge)
    setIsModalOpen(true)
  }

  // Action handlers for ChargeGLMapping
  const handleCreateChargeGLMapping = () => {
    setGLMappingModalMode("create")
    setSelectedChargeGLMapping(undefined)
    setIsGLMappingModalOpen(true)
  }

  const handleEditChargeGLMapping = (chargeGLMapping: IChargeGLMapping) => {
    setGLMappingModalMode("edit")
    setSelectedChargeGLMapping(chargeGLMapping)
    setIsGLMappingModalOpen(true)
  }

  const handleViewChargeGLMapping = (
    chargeGLMapping: IChargeGLMapping | null
  ) => {
    if (!chargeGLMapping) return
    setGLMappingModalMode("view")
    setSelectedChargeGLMapping(chargeGLMapping)
    setIsGLMappingModalOpen(true)
  }

  // Helper function for API responses
  const handleApiResponse = (
    response: ApiResponse<ICharge | IChargeGLMapping>
  ) => {
    if (response.result === 1) {
      return true
    } else {
      return false
    }
  }

  // Form handlers for Charge
  const handleChargeSubmit = async (data: ChargeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveMutation.mutateAsync(
          data
        )) as ApiResponse<ICharge>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["charges"] })
        }
      } else if (modalMode === "edit" && selectedCharge) {
        const response = (await updateMutation.mutateAsync(
          data
        )) as ApiResponse<ICharge>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["charges"] })
        }
      }
    } catch (error) {
      console.error("Charge form submission error:", error)
    }
  }

  // Form handlers for ChargeGLMapping
  const handleChargeGLMappingSubmit = async (
    data: ChargeGLMappingSchemaType
  ) => {
    try {
      if (glMappingModalMode === "create") {
        const response = (await saveGLMappingMutation.mutateAsync(
          data
        )) as ApiResponse<IChargeGLMapping>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["chargeglmappings"] })
        }
      } else if (glMappingModalMode === "edit" && selectedChargeGLMapping) {
        const response = (await updateGLMappingMutation.mutateAsync(
          data
        )) as ApiResponse<IChargeGLMapping>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["chargeglmappings"] })
        }
      }
    } catch (error) {
      console.error("ChargeGLMapping form submission error:", error)
    }
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (
    data: ChargeSchemaType | ChargeGLMappingSchemaType
  ) => {
    try {
      if (saveConfirmation.type === "chargeglmapping") {
        await handleChargeGLMappingSubmit(data as ChargeGLMappingSchemaType)
        setIsGLMappingModalOpen(false)
      } else {
        await handleChargeSubmit(data as ChargeSchemaType)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: ChargeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: "charge",
    })
  }

  const handleGLMappingFormSubmit = (data: ChargeGLMappingSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: "chargeglmapping",
    })
  }

  // Delete handlers
  const handleDeleteCharge = (chargeId: string) => {
    const chargeToDelete = chargesData.find(
      (c) => c.chargeId.toString() === chargeId
    )
    if (!chargeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: chargeId,
      name: chargeToDelete.chargeName,
      type: "charge",
    })
  }

  const handleDeleteChargeGLMapping = (id: string) => {
    const chargeGLMappingToDelete = chargeGLMappingData.find(
      (c) => c.chargeId.toString() === id
    )
    if (!chargeGLMappingToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: id,
      name: chargeGLMappingToDelete.chargeName,
      type: "chargeglmapping",
    })
  }

  // Individual deletion executors for each entity type
  const executeDeleteCharge = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["charges"] })
  }

  const executeDeleteChargeGLMapping = async (id: string) => {
    await deleteGLMappingMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["chargeglmappings"] })
  }

  // Mapping of deletion types to their executor functions
  const deletionExecutors = {
    charge: executeDeleteCharge,
    chargeglmapping: executeDeleteChargeGLMapping,
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
      type: "charge",
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
        const response = await getById(`${Charge.getByCode}/${trimmedCode}`)

        if (response?.result === 1 && response.data) {
          const chargeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (chargeData) {
            const validChargeData: ICharge = {
              chargeId: chargeData.chargeId,
              chargeCode: chargeData.chargeCode,
              chargeName: chargeData.chargeName,
              uomId: chargeData.uomId,
              uomName: chargeData.uomName,
              chargeOrder: chargeData.chargeOrder,
              seqNo: chargeData.seqNo,
              isTransport: chargeData.isTransport,
              isMultiple: chargeData.isMultiple,
              isActive: chargeData.isActive,
              remarks: chargeData.remarks || "",
              createBy: chargeData.createBy,
              editBy: chargeData.editBy,
              createDate: chargeData.createDate,
              editDate: chargeData.editDate,
              createById: chargeData.createById,
              editById: chargeData.editById,
              companyId: chargeData.companyId,
            }

            setExistingCharge(validChargeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Load existing records
  const handleLoadExistingCharge = () => {
    if (existingCharge) {
      setModalMode("edit")
      setSelectedCharge(existingCharge)
      setShowLoadDialog(false)
      setExistingCharge(null)
    }
  }
  useEffect(() => {
    setChargeSearchInput(filters.search || "")
  }, [filters.search])
  useEffect(() => {
    setGlMappingSearchInput(glMappingFilters.search || "")
  }, [glMappingFilters.search])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Charge
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage charge information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "charge" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search charges..."
                  value={chargeSearchInput}
                  onChange={(evt) => setChargeSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setChargeSearchInput("")
                      handleFilterChange({
                        search: undefined,
                        sortOrder: filters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {chargeSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setChargeSearchInput("")
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
                onClick={handleFilterChangeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          )}
          {activeTab === "chargeglmapping" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search charge GL mappings..."
                  value={glMappingSearchInput}
                  onChange={(evt) => setGlMappingSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleGLMappingFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setGlMappingSearchInput("")
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
                      setGlMappingSearchInput("")
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
                onClick={handleGLMappingFilterChangeSearchSubmit}
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
        defaultValue="charge"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="charge">Charge</TabsTrigger>
          <TabsTrigger value="chargeglmapping">Charge GL Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="charge" className="space-y-4">
          {isLoadingCharge ? (
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
          ) : chargesResult === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <ChargeTable
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
            <ChargeTable
              data={chargesData || []}
              isLoading={isLoadingCharge}
              totalRecords={chargesTotalRecords}
              onSelect={canView ? handleViewCharge : undefined}
              onDeleteAction={canDelete ? handleDeleteCharge : undefined}
              onEditAction={canEdit ? handleEditCharge : undefined}
              onCreateAction={canCreate ? handleCreateCharge : undefined}
              onRefreshAction={refetchCharge}
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

        <TabsContent value="chargeglmapping" className="space-y-4">
          {isLoadingChargeGLMapping ? (
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
          ) : chargeGLMappingResult === -2 ||
            (!canViewGLMapping &&
              !canEditGLMapping &&
              !canDeleteGLMapping &&
              !canCreateGLMapping) ? (
            <LockSkeleton locked={true}>
              <ChargeGLMappingTable
                data={[]}
                isLoading={false}
                totalRecords={chargeGLMappingTotalRecords}
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
            <ChargeGLMappingTable
              data={chargeGLMappingData || []}
              totalRecords={chargeGLMappingTotalRecords}
              onSelect={
                canViewGLMapping ? handleViewChargeGLMapping : undefined
              }
              onDeleteAction={
                canDeleteGLMapping ? handleDeleteChargeGLMapping : undefined
              }
              onEditAction={
                canEditGLMapping ? handleEditChargeGLMapping : undefined
              }
              onCreateAction={
                canCreateGLMapping ? handleCreateChargeGLMapping : undefined
              }
              onRefreshAction={refetchChargeGLMapping}
              onFilterChange={handleGLMappingFilterChange}
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

      {/* Charge Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Charge"}
              {modalMode === "edit" && "Update Charge"}
              {modalMode === "view" && "View Charge"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new charge to the system database."
                : modalMode === "edit"
                  ? "Update charge information in the system database."
                  : "View charge details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ChargeForm
            initialData={modalMode !== "create" ? selectedCharge : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
            companyId={companyId}
          />
        </DialogContent>
      </Dialog>

      {/* ChargeGLMapping Form Dialog */}
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
              {glMappingModalMode === "create" && "Create Charge GL Mapping"}
              {glMappingModalMode === "edit" && "Update Charge GL Mapping"}
              {glMappingModalMode === "view" && "View Charge GL Mapping"}
            </DialogTitle>
            <DialogDescription>
              {glMappingModalMode === "create"
                ? "Add a new charge GL mapping to the system database."
                : glMappingModalMode === "edit"
                  ? "Update charge GL mapping information."
                  : "View charge GL mapping details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ChargeGLMappingForm
            initialData={
              glMappingModalMode !== "create"
                ? selectedChargeGLMapping
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
        onLoad={handleLoadExistingCharge}
        onCancelAction={() => setExistingCharge(null)}
        code={existingCharge?.chargeCode}
        name={existingCharge?.chargeName}
        typeLabel="Charge"
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
            type: "charge",
          })
        }
        isDeleting={
          deleteConfirmation.type === "charge"
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
            saveConfirmation.type === "charge"
              ? modalMode === "create"
              : glMappingModalMode === "create"
          )
            ? `Create ${saveConfirmation.type.toUpperCase()}`
            : `Update ${saveConfirmation.type.toUpperCase()}`
        }
        itemName={
          saveConfirmation.type === "charge"
            ? (saveConfirmation.data as ChargeSchemaType)?.chargeName || ""
            : (saveConfirmation.data as ChargeGLMappingSchemaType)
              ? chargeGLMappingData.find(
                  (c) =>
                    c.chargeId ===
                    (saveConfirmation.data as ChargeGLMappingSchemaType)
                      .chargeId
                )?.chargeName || ""
              : ""
        }
        operationType={
          (
            saveConfirmation.type === "charge"
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
            type: "charge",
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "charge",
          })
        }
        isSaving={
          saveConfirmation.type === "charge"
            ? saveMutation.isPending || updateMutation.isPending
            : saveGLMappingMutation.isPending ||
              updateGLMappingMutation.isPending
        }
      />
    </div>
  )
}
