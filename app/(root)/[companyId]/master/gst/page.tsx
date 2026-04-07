"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IGst,
  IGstCategory,
  IGstCategoryFilter,
  IGstDt,
  IGstFilter,
} from "@/interfaces/gst"
import {
  GstCategorySchemaType,
  GstDtSchemaType,
  GstSchemaType,
} from "@/schemas/gst"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { Gst, GstCategory, GstDt } from "@/lib/api-routes"
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

import { GstForm } from "./components/gst-form"
import { GstTable } from "./components/gst-table"
import { GstCategoryForm } from "./components/gstcategory-form"
import { GstCategoryTable } from "./components/gstcategory-table"
import { GstDtForm } from "./components/gstdt-form"
import { GstDtTable } from "./components/gstdt-table"

export default function GstPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.gst
  const transactionIdCategory = MasterTransactionId.gstCategory
  const transactionIdDt = MasterTransactionId.gstDt

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  // Permissions
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreateCategory = hasPermission(
    moduleId,
    transactionIdCategory,
    "isCreate"
  )
  const canEditCategory = hasPermission(
    moduleId,
    transactionIdCategory,
    "isEdit"
  )
  const canDeleteCategory = hasPermission(
    moduleId,
    transactionIdCategory,
    "isDelete"
  )
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreateDt = hasPermission(moduleId, transactionIdDt, "isCreate")
  const canEditDt = hasPermission(moduleId, transactionIdDt, "isEdit")
  const canDeleteDt = hasPermission(moduleId, transactionIdDt, "isDelete")
  const canViewDt = hasPermission(moduleId, transactionIdDt, "isRead")
  const canViewCategory = hasPermission(
    moduleId,
    transactionIdCategory,
    "isRead"
  )

  // State for filters
  const [filters, setFilters] = useState<IGstFilter>({})
  const [dtFilters, setDtFilters] = useState<IGstFilter>({})
  const [categoryFilters, setCategoryFilters] = useState<IGstCategoryFilter>({})

  // Pagination state
  const { defaults } = useUserSettingDefaults()

    const [activeTab, setActiveTab] = useState("gsts")

  const [gstSearchInput, setGstSearchInput] = useState("")
  const [gstDtSearchInput, setGstDtSearchInput] = useState("")
  const [gstCategorySearchInput, setGstCategorySearchInput] = useState("")
// Separate pagination state for each tab
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [dtCurrentPage, setDtCurrentPage] = useState(1)
  const [dtPageSize, setDtPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
  const [categoryPageSize, setCategoryPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when user settings change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
      setDtPageSize(defaults.common.masterGridTotalRecords)
      setCategoryPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter change handlers
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IGstFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleDtFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setDtFilters(newFilters as IGstFilter)
      setDtCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleCategoryFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setCategoryFilters(newFilters as IGstCategoryFilter)
      setCategoryCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  // Page change handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleDtPageChange = useCallback((page: number) => {
    setDtCurrentPage(page)
  }, [])

  const handleCategoryPageChange = useCallback((page: number) => {
    setCategoryCurrentPage(page)
  }, [])

  // Page size change handlers
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleDtPageSizeChange = useCallback((size: number) => {
    setDtPageSize(size)
    setDtCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleCategoryPageSizeChange = useCallback((size: number) => {
    setCategoryPageSize(size)
    setCategoryCurrentPage(1) // Reset to first page when changing page size
  }, [])

  // Data fetching
  const {
    data: gstsResponse,
    refetch: refetchGst,
    isLoading: isLoadingGst,
  } = useGetWithPagination<IGst>(
    `${Gst.get}`,
    "gsts",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    data: gstsDtResponse,
    refetch: refetchGstDt,
    isLoading: isLoadingGstDt,
  } = useGetWithPagination<IGstDt>(
    `${GstDt.get}`,
    "gstsdt",
    dtFilters.search,
    dtCurrentPage,
    dtPageSize
  )

  const {
    data: gstsCategoryResponse,
    refetch: refetchGstCategory,
    isLoading: isLoadingGstCategory,
  } = useGetWithPagination<IGstCategory>(
    `${GstCategory.get}`,
    "gstcategory",
    categoryFilters.search,
    categoryCurrentPage,
    categoryPageSize
  )

  // Extract data from responses with fallback values
  const {
    result: gstsResult,
    data: gstsData,
    totalRecords: gstsTotalRecords,
  } = (gstsResponse as ApiResponse<IGst>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }
  const {
    result: gstsDtResult,
    data: gstsDtData,
    totalRecords: gstsDtTotalRecords,
  } = (gstsDtResponse as ApiResponse<IGstDt>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }
  const {
    result: gstsCategoryResult,
    data: gstsCategoryData,
    totalRecords: gstsCategoryTotalRecords,
  } = (gstsCategoryResponse as ApiResponse<IGstCategory>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Mutations
  const saveMutation = usePersist<GstSchemaType>(`${Gst.add}`)
  const updateMutation = usePersist<GstSchemaType>(`${Gst.add}`)
  const deleteMutation = useDelete(`${Gst.delete}`)

  const saveDtMutation = usePersist<GstDtSchemaType>(`${GstDt.add}`)
  const updateDtMutation = usePersist<GstDtSchemaType>(`${GstDt.add}`)
  const deleteDtMutation = useDelete(`${GstDt.delete}`)

  const saveCategoryMutation = usePersist<GstCategorySchemaType>(
    `${GstCategory.add}`
  )
  const updateCategoryMutation = usePersist<GstCategorySchemaType>(
    `${GstCategory.add}`
  )
  const deleteCategoryMutation = useDelete(`${GstCategory.delete}`)

  // State management
  const [selectedGst, setSelectedGst] = useState<IGst | undefined>()
  const [selectedGstDt, setSelectedGstDt] = useState<IGstDt | undefined>()
  const [selectedGstCategory, setSelectedGstCategory] = useState<
    IGstCategory | undefined
  >()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDtModalOpen, setIsDtModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null as string | null,
    name: null as string | null,
    type: "gst" as "gst" | "gstdt" | "gstcategory",
  })

  // Duplicate detection states
  const [showLoadDialogGst, setShowLoadDialogGst] = useState(false)
  const [existingGst, setExistingGst] = useState<IGst | null>(null)
  const [showLoadDialogCategory, setShowLoadDialogCategory] = useState(false)
  const [existingGstCategory, setExistingGstCategory] =
    useState<IGstCategory | null>(null)

  // Action handlers
  const handleCreateGst = () => {
    setModalMode("create")
    setSelectedGst(undefined)
    setIsModalOpen(true)
  }

  const handleEditGst = (gst: IGst) => {
    setModalMode("edit")
    setSelectedGst(gst)
    setIsModalOpen(true)
  }

  const handleViewGst = (gst: IGst | null) => {
    if (!gst) return
    setModalMode("view")
    setSelectedGst(gst)
    setIsModalOpen(true)
  }

  const handleCreateGstDt = () => {
    setModalMode("create")
    setSelectedGstDt(undefined)
    setIsDtModalOpen(true)
  }

  const handleEditGstDt = (gstDt: IGstDt) => {
    setModalMode("edit")
    setSelectedGstDt(gstDt)
    setIsDtModalOpen(true)
  }

  const handleViewGstDt = (gstDt: IGstDt | null) => {
    if (!gstDt) return
    setModalMode("view")
    setSelectedGstDt(gstDt)
    setIsDtModalOpen(true)
  }

  const handleCreateGstCategory = () => {
    setModalMode("create")
    setSelectedGstCategory(undefined)
    setIsCategoryModalOpen(true)
  }

  const handleEditGstCategory = (gstCategory: IGstCategory) => {
    setModalMode("edit")
    setSelectedGstCategory(gstCategory)
    setIsCategoryModalOpen(true)
  }

  const handleViewGstCategory = (gstCategory: IGstCategory | null) => {
    if (!gstCategory) return
    setModalMode("view")
    setSelectedGstCategory(gstCategory)
    setIsCategoryModalOpen(true)
  }

  // Helper function for API responses
  const handleApiResponse = (
    response: ApiResponse<IGst | IGstDt | IGstCategory>
  ) => {
    if (response.result === 1) {
      return true
    } else {
      return false
    }
  }

  // Specialized form handlers
  const handleGstSubmit = async (data: GstSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveMutation.mutateAsync(
          data
        )) as ApiResponse<IGst>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["gsts"] })
        }
      } else if (modalMode === "edit" && selectedGst) {
        const response = (await updateMutation.mutateAsync(
          data
        )) as ApiResponse<IGst>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["gsts"] })
        }
      }
    } catch (error) {
      console.error("Gst form submission error:", error)
    }
  }

  const handleGstDtSubmit = async (data: GstDtSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveDtMutation.mutateAsync(
          data
        )) as ApiResponse<IGstDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["gstsdt"] })
        }
      } else if (modalMode === "edit" && selectedGstDt) {
        const response = (await updateDtMutation.mutateAsync(
          data
        )) as ApiResponse<IGstDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["gstsdt"] })
        }
      }
    } catch (error) {
      console.error("Gst Details form submission error:", error)
    }
  }

  const handleGstCategorySubmit = async (data: GstCategorySchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveCategoryMutation.mutateAsync(
          data
        )) as ApiResponse<IGstCategory>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["gstcategory"] })
        }
      } else if (modalMode === "edit" && selectedGstCategory) {
        const response = (await updateCategoryMutation.mutateAsync(
          data
        )) as ApiResponse<IGstCategory>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["gstcategory"] })
        }
      }
    } catch (error) {
      console.error("Gst Category form submission error:", error)
    }
  }

  // State for save confirmations
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: GstSchemaType | GstDtSchemaType | GstCategorySchemaType | null
    type: "gst" | "gstdt" | "gstcategory"
  }>({
    isOpen: false,
    data: null,
    type: "gst",
  })

  // Main form submit handler - shows confirmation first
  const handleFormSubmit = (
    data: GstSchemaType | GstDtSchemaType | GstCategorySchemaType
  ) => {
    let type: "gst" | "gstdt" | "gstcategory" = "gst"
    if (isDtModalOpen) type = "gstdt"
    else if (isCategoryModalOpen) type = "gstcategory"

    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: type,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (
    data: GstSchemaType | GstDtSchemaType | GstCategorySchemaType
  ) => {
    try {
      if (saveConfirmation.type === "gstdt") {
        await handleGstDtSubmit(data as GstDtSchemaType)
        setIsDtModalOpen(false)
      } else if (saveConfirmation.type === "gstcategory") {
        await handleGstCategorySubmit(data as GstCategorySchemaType)
        setIsCategoryModalOpen(false)
      } else {
        await handleGstSubmit(data as GstSchemaType)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }
  // Delete handlers
  const handleDeleteGst = (gstId: string) => {
    const gstToDelete = gstsData.find((c) => c.gstId.toString() === gstId)
    if (!gstToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: gstId,
      name: gstToDelete.gstName,
      type: "gst",
    })
  }

  const handleDeleteGstDt = (gstId: string) => {
    const gstDtToDelete = gstsDtData.find((c) => c.gstId.toString() === gstId)
    if (!gstDtToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: gstId,
      name: gstDtToDelete.gstName,
      type: "gstdt",
    })
  }

  const handleDeleteGstCategory = (gstCategoryId: string) => {
    const gstCategoryToDelete = gstsCategoryData.find(
      (c) => c.gstCategoryId.toString() === gstCategoryId
    )
    if (!gstCategoryToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: gstCategoryId,
      name: gstCategoryToDelete.gstCategoryName,
      type: "gstcategory",
    })
  }

  // Individual deletion executors for each entity type
  const executeDeleteGst = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["gsts"] })
  }

  const executeDeleteGstDt = async (id: string) => {
    await deleteDtMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["gstsdt"] })
  }

  const executeDeleteGstCategory = async (id: string) => {
    await deleteCategoryMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["gstcategory"] })
  }

  // Mapping of deletion types to their executor functions
  const deletionExecutors = {
    gst: executeDeleteGst,
    gstdt: executeDeleteGstDt,
    gstcategory: executeDeleteGstCategory,
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
      type: deleteConfirmation.type,
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

      // Set the code and immediately fetch (no state dependency issues)
      try {
        if (isModalOpen) {
          const response = await getById(`${Gst.getByCode}/${trimmedCode}`)

          if (response.result === 1 && response.data) {
            const gstData = Array.isArray(response.data)
              ? response.data[0]
              : response.data

            if (gstData) {
              setExistingGst(gstData as IGst)
              setShowLoadDialogGst(true)
            }
          }
        } else if (isCategoryModalOpen) {
          const response = await getById(
            `${GstCategory.getByCode}/${trimmedCode}`
          )
          if (response.result === 1 && response.data) {
            const categoryData = Array.isArray(response.data)
              ? response.data[0]
              : response.data

            if (categoryData) {
              setExistingGstCategory(categoryData as IGstCategory)
              setShowLoadDialogCategory(true)
            }
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode, isModalOpen, isCategoryModalOpen]
  )

  // Load existing records
  const handleLoadExistingGst = () => {
    if (existingGst) {
      setModalMode("edit")
      setSelectedGst(existingGst)
      setShowLoadDialogGst(false)
      setExistingGst(null)
    }
  }

  const handleLoadExistingGstCategory = () => {
    if (existingGstCategory) {
      setModalMode("edit")
      setSelectedGstCategory(existingGstCategory)
      setShowLoadDialogCategory(false)
      setExistingGstCategory(null)
    }
  }
  useEffect(() => {
    setGstSearchInput(filters.search || "")
  }, [filters.search])
  useEffect(() => {
    setGstDtSearchInput(dtFilters.search || "")
  }, [dtFilters.search])
  useEffect(() => {
    setGstCategorySearchInput(categoryFilters.search || "")
  }, [categoryFilters.search])







  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            VAT | GST
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage VAT | GST information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "gsts" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search VAT | GST..."
                  value={gstSearchInput}
                  onChange={(evt) => setGstSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setGstSearchInput("")
                      handleFilterChange({
                        search: undefined,
                        sortOrder: filters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {gstSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setGstSearchInput("")
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
          {activeTab === "gstsdt" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search VAT | GST details..."
                  value={gstDtSearchInput}
                  onChange={(evt) => setGstDtSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleDtFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setGstDtSearchInput("")
                      handleDtFilterChange({
                        search: undefined,
                        sortOrder: dtFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {gstDtSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setGstDtSearchInput("")
                      handleDtFilterChange({
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
                onClick={handleDtFilterChangeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          )}
          {activeTab === "gstscategory" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search VAT | GST categories..."
                  value={gstCategorySearchInput}
                  onChange={(evt) => setGstCategorySearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleCategoryFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setGstCategorySearchInput("")
                      handleCategoryFilterChange({
                        search: undefined,
                        sortOrder: categoryFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {gstCategorySearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setGstCategorySearchInput("")
                      handleCategoryFilterChange({
                        search: undefined,
                        sortOrder: categoryFilters.sortOrder,
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
                onClick={handleCategoryFilterChangeSearchSubmit}
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
        defaultValue="gsts"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="gsts">VAT | GST</TabsTrigger>
          <TabsTrigger value="gstsdt">VAT | GST Details</TabsTrigger>
          <TabsTrigger value="gstscategory">VAT | GST Category</TabsTrigger>
        </TabsList>

        <TabsContent value="gsts" className="space-y-4">
          {isLoadingGst ? (
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
          ) : gstsResult === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <GstTable
                data={[]}
                isLoading={false}
                totalRecords={gstsTotalRecords}
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
          ) : gstsResult ? (
            <GstTable
              data={gstsData || []}
              isLoading={isLoadingGst}
              totalRecords={gstsTotalRecords}
              onSelect={canView ? handleViewGst : undefined}
              onDeleteAction={canDelete ? handleDeleteGst : undefined}
              onEditAction={canEdit ? handleEditGst : undefined}
              onCreateAction={canCreate ? handleCreateGst : undefined}
              onRefreshAction={refetchGst}
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
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {gstsResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gstsdt" className="space-y-4">
          {isLoadingGstDt ? (
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
          ) : gstsDtResult === -2 ||
            (!canViewDt && !canEditDt && !canDeleteDt && !canCreateDt) ? (
            <LockSkeleton locked={true}>
              <GstDtTable
                data={[]}
                isLoading={false}
                totalRecords={gstsDtTotalRecords}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={moduleId}
                transactionId={transactionIdDt}
                canEdit={false}
                canDelete={false}
                canView={false}
                canCreate={false}
              />
            </LockSkeleton>
          ) : gstsDtResult ? (
            <GstDtTable
              data={gstsDtData || []}
              isLoading={isLoadingGstDt}
              totalRecords={gstsDtTotalRecords}
              onSelect={canViewDt ? handleViewGstDt : undefined}
              onDeleteAction={canDeleteDt ? handleDeleteGstDt : undefined}
              onEditAction={canEditDt ? handleEditGstDt : undefined}
              onCreateAction={canCreateDt ? handleCreateGstDt : undefined}
              onRefreshAction={refetchGstDt}
              onFilterChange={handleDtFilterChange}
              onPageChange={handleDtPageChange}
              onPageSizeChange={handleDtPageSizeChange}
              currentPage={dtCurrentPage}
              pageSize={dtPageSize}
              serverSidePagination={true}
              moduleId={moduleId}
              transactionId={transactionIdDt}
              canEdit={canEditDt}
              canDelete={canDeleteDt}
              canView={canViewDt}
              canCreate={canCreateDt}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {gstsDtResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gstscategory" className="space-y-4">
          {isLoadingGstCategory ? (
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
          ) : gstsCategoryResult === -2 ||
            (!canViewCategory &&
              !canEditCategory &&
              !canDeleteCategory &&
              !canCreateCategory) ? (
            <LockSkeleton locked={true}>
              <GstCategoryTable
                data={[]}
                isLoading={false}
                totalRecords={gstsCategoryTotalRecords}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={moduleId}
                transactionId={transactionIdCategory}
                canEdit={false}
                canDelete={false}
                canView={canViewCategory}
                canCreate={canCreateCategory}
              />
            </LockSkeleton>
          ) : gstsCategoryResult ? (
            <GstCategoryTable
              data={gstsCategoryData || []}
              isLoading={isLoadingGstCategory}
              totalRecords={gstsCategoryTotalRecords}
              onSelect={canViewCategory ? handleViewGstCategory : undefined}
              onDeleteAction={
                canDeleteCategory ? handleDeleteGstCategory : undefined
              }
              onEditAction={canEditCategory ? handleEditGstCategory : undefined}
              onCreateAction={
                canCreateCategory ? handleCreateGstCategory : undefined
              }
              onRefreshAction={refetchGstCategory}
              onFilterChange={handleCategoryFilterChange}
              onPageChange={handleCategoryPageChange}
              onPageSizeChange={handleCategoryPageSizeChange}
              currentPage={categoryCurrentPage}
              pageSize={categoryPageSize}
              serverSidePagination={true}
              moduleId={moduleId}
              transactionId={transactionIdCategory}
              canEdit={canEditCategory}
              canDelete={canDeleteCategory}
              canView={canViewCategory}
              canCreate={canCreateCategory}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {gstsCategoryResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Gst Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create VAT | GST"}
              {modalMode === "edit" && "Update VAT | GST"}
              {modalMode === "view" && "View VAT | GST"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new VAT | GST to the system database."
                : modalMode === "edit"
                  ? "Update VAT | GST information in the system database."
                  : "View VAT | GST details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <GstForm
            initialData={modalMode !== "create" ? selectedGst : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Gst Details Form Dialog */}
      <Dialog open={isDtModalOpen} onOpenChange={setIsDtModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create VAT | GST Details"}
              {modalMode === "edit" && "Update VAT | GST Details"}
              {modalMode === "view" && "View VAT | GST Details"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add new VAT | GST details to the system database."
                : modalMode === "edit"
                  ? "Update VAT | GST details information."
                  : "View VAT | GST details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <GstDtForm
            initialData={modalMode !== "create" ? selectedGstDt : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsDtModalOpen(false)}
            isSubmitting={
              saveDtMutation.isPending || updateDtMutation.isPending
            }
            isReadOnly={modalMode === "view"}
          />
        </DialogContent>
      </Dialog>

      {/* Gst Category Form Dialog */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create VAT | GST Category"}
              {modalMode === "edit" && "Update VAT | GST Category"}
              {modalMode === "view" && "View VAT | GST Category"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new VAT | GST category to the system database."
                : modalMode === "edit"
                  ? "Update VAT | GST category information."
                  : "View VAT | GST category details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <GstCategoryForm
            initialData={
              modalMode !== "create" ? selectedGstCategory : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsCategoryModalOpen(false)}
            isSubmitting={
              saveCategoryMutation.isPending || updateCategoryMutation.isPending
            }
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Duplicate Record Dialogs */}
      <LoadConfirmation
        open={showLoadDialogGst}
        onOpenChange={setShowLoadDialogGst}
        onLoad={handleLoadExistingGst}
        onCancelAction={() => setExistingGst(null)}
        code={existingGst?.gstCode}
        name={existingGst?.gstName}
        typeLabel="VAT | GST"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <LoadConfirmation
        open={showLoadDialogCategory}
        onOpenChange={setShowLoadDialogCategory}
        onLoad={handleLoadExistingGstCategory}
        onCancelAction={() => setExistingGstCategory(null)}
        code={existingGstCategory?.gstCategoryCode}
        name={existingGstCategory?.gstCategoryName}
        typeLabel="VAT | GST Category"
        isLoading={
          saveCategoryMutation.isPending || updateCategoryMutation.isPending
        }
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
            type: "gst",
          })
        }
        isDeleting={
          deleteConfirmation.type === "gst"
            ? deleteMutation.isPending
            : deleteConfirmation.type === "gstdt"
              ? deleteDtMutation.isPending
              : deleteCategoryMutation.isPending
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
          saveConfirmation.type === "gst"
            ? (saveConfirmation.data as GstSchemaType)?.gstName || ""
            : saveConfirmation.type === "gstdt"
              ? (
                  saveConfirmation.data as GstDtSchemaType
                )?.gstPercentage?.toString() || ""
              : (saveConfirmation.data as GstCategorySchemaType)
                  ?.gstCategoryName || ""
        }
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "gst",
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "gst",
          })
        }
        isSaving={
          saveConfirmation.type === "gst"
            ? saveMutation.isPending || updateMutation.isPending
            : saveConfirmation.type === "gstdt"
              ? saveDtMutation.isPending || updateDtMutation.isPending
              : saveCategoryMutation.isPending ||
                updateCategoryMutation.isPending
        }
      />
    </div>
  )
}
