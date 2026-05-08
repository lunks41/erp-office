"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  ITax,
  ITaxCategory,
  ITaxCategoryFilter,
  ITaxDt,
  ITaxFilter,
} from "@/interfaces/tax"
import {
  TaxCategorySchemaType,
  TaxDtSchemaType,
  TaxSchemaType,
} from "@/schemas/tax"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { Tax, TaxCategory, TaxDt } from "@/lib/api-routes"
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

import { TaxForm } from "./components/tax-form"
import { TaxTable } from "./components/tax-table"
import { TaxCategoryForm } from "./components/taxcategory-form"
import { TaxCategoryTable } from "./components/taxcategory-table"
import { TaxDtForm } from "./components/taxdt-form"
import { TaxDtTable } from "./components/taxdt-table"

export default function TaxPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.tax
  const transactionIdCategory = MasterTransactionId.taxCategory
  const transactionIdDt = MasterTransactionId.taxDt

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
  const [filters, setFilters] = useState<ITaxFilter>({})
  const [dtFilters, setDtFilters] = useState<ITaxFilter>({})
  const [categoryFilters, setCategoryFilters] = useState<ITaxCategoryFilter>({})

    const [activeTab, setActiveTab] = useState("taxs")

  const [taxSearchInput, setTaxSearchInput] = useState("")
  const [taxDtSearchInput, setTaxDtSearchInput] = useState("")
  const [taxCategorySearchInput, setTaxCategorySearchInput] = useState("")
// Separate pagination state for each tab
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [dtCurrentPage, setDtCurrentPage] = useState(1)
  const [dtPageSize, setDtPageSize] = useState(50)
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
  const [categoryPageSize, setCategoryPageSize] = useState(50)

  // Get user setting defaults
  const { defaults } = useUserSettingDefaults()

  // Update page size when defaults change
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
      setFilters(newFilters as ITaxFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  // Pagination handlers for each tab
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleDtPageChange = useCallback((page: number) => {
    setDtCurrentPage(page)
  }, [])

  const handleCategoryPageChange = useCallback((page: number) => {
    setCategoryCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const handleDtPageSizeChange = useCallback((size: number) => {
    setDtPageSize(size)
    setDtCurrentPage(1)
  }, [])

  const handleCategoryPageSizeChange = useCallback((size: number) => {
    setCategoryPageSize(size)
    setCategoryCurrentPage(1)
  }, [])

  const handleDtFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setDtFilters(newFilters as ITaxFilter)
      setDtCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleCategoryFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setCategoryFilters(newFilters as ITaxCategoryFilter)
      setCategoryCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = taxSearchInput.trim() || undefined
    handleFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [taxSearchInput, handleFilterChange, filters.sortOrder])

  const handleDtFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = taxDtSearchInput.trim() || undefined
    handleDtFilterChange({
      search: normalizedSearch,
      sortOrder: dtFilters.sortOrder,
    })
  }, [taxDtSearchInput, handleDtFilterChange, dtFilters.sortOrder])

  const handleCategoryFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = taxCategorySearchInput.trim() || undefined
    handleCategoryFilterChange({
      search: normalizedSearch,
      sortOrder: categoryFilters.sortOrder,
    })
  }, [
    taxCategorySearchInput,
    handleCategoryFilterChange,
    categoryFilters.sortOrder,
  ])

  // Data fetching
  const {
    data: taxsResponse,
    refetch: refetchTax,
    isLoading: isLoadingTax,
  } = useGetWithPagination<ITax>(
    `${Tax.get}`,
    "taxs",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    data: taxsDtResponse,
    refetch: refetchTaxDt,
    isLoading: isLoadingTaxDt,
  } = useGetWithPagination<ITaxDt>(
    `${TaxDt.get}`,
    "taxsdt",
    dtFilters.search,
    dtCurrentPage,
    dtPageSize
  )

  const {
    data: taxsCategoryResponse,
    refetch: refetchTaxCategory,
    isLoading: isLoadingTaxCategory,
  } = useGetWithPagination<ITaxCategory>(
    `${TaxCategory.get}`,
    "taxcategory",
    categoryFilters.search,
    categoryCurrentPage,
    categoryPageSize
  )

  // Extract data from responses with fallback values
  const {
    result: taxsResult,
    data: taxsData,
    totalRecords,
  } = (taxsResponse as ApiResponse<ITax>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }
  const {
    result: taxsDtResult,
    data: taxsDtData,
    totalRecords: taxsDtTotalRecords,
  } = (taxsDtResponse as ApiResponse<ITaxDt>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }
  const {
    result: taxsCategoryResult,
    data: taxsCategoryData,
    totalRecords: taxsCategoryTotalRecords,
  } = (taxsCategoryResponse as ApiResponse<ITaxCategory>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Mutations
  const saveMutation = usePersist<TaxSchemaType>(`${Tax.add}`)
  const updateMutation = usePersist<TaxSchemaType>(`${Tax.add}`)
  const deleteMutation = useDelete(`${Tax.delete}`)

  const saveDtMutation = usePersist<TaxDtSchemaType>(`${TaxDt.add}`)
  const updateDtMutation = usePersist<TaxDtSchemaType>(`${TaxDt.add}`)
  const deleteDtMutation = useDelete(`${TaxDt.delete}`)

  const saveCategoryMutation = usePersist<TaxCategorySchemaType>(
    `${TaxCategory.add}`
  )
  const updateCategoryMutation = usePersist<TaxCategorySchemaType>(
    `${TaxCategory.add}`
  )
  const deleteCategoryMutation = useDelete(`${TaxCategory.delete}`)

  // State management
  const [selectedTax, setSelectedTax] = useState<ITax | undefined>()
  const [selectedTaxDt, setSelectedTaxDt] = useState<ITaxDt | undefined>()
  const [selectedTaxCategory, setSelectedTaxCategory] = useState<
    ITaxCategory | undefined
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
    type: "tax" as "tax" | "taxdt" | "taxcategory",
  })

  // Duplicate detection states
  const [showLoadDialogTax, setShowLoadDialogTax] = useState(false)
  const [existingTax, setExistingTax] = useState<ITax | null>(null)
  const [showLoadDialogCategory, setShowLoadDialogCategory] = useState(false)
  const [existingTaxCategory, setExistingTaxCategory] =
    useState<ITaxCategory | null>(null)

  // Refetch when filters change
  useEffect(() => {
    if (filters.search !== undefined) refetchTax()
  }, [filters.search, refetchTax])

  useEffect(() => {
    if (dtFilters.search !== undefined) refetchTaxDt()
  }, [dtFilters.search, refetchTaxDt])

  useEffect(() => {
    if (categoryFilters.search !== undefined) refetchTaxCategory()
  }, [categoryFilters.search, refetchTaxCategory])

  // Action handlers
  const handleCreateTax = () => {
    setModalMode("create")
    setSelectedTax(undefined)
    setIsModalOpen(true)
  }

  const handleEditTax = (tax: ITax) => {
    setModalMode("edit")
    setSelectedTax(tax)
    setIsModalOpen(true)
  }

  const handleViewTax = (tax: ITax | null) => {
    if (!tax) return
    setModalMode("view")
    setSelectedTax(tax)
    setIsModalOpen(true)
  }

  const handleCreateTaxDt = () => {
    setModalMode("create")
    setSelectedTaxDt(undefined)
    setIsDtModalOpen(true)
  }

  const handleEditTaxDt = (taxDt: ITaxDt) => {
    setModalMode("edit")
    setSelectedTaxDt(taxDt)
    setIsDtModalOpen(true)
  }

  const handleViewTaxDt = (taxDt: ITaxDt | null) => {
    if (!taxDt) return
    setModalMode("view")
    setSelectedTaxDt(taxDt)
    setIsDtModalOpen(true)
  }

  const handleCreateTaxCategory = () => {
    setModalMode("create")
    setSelectedTaxCategory(undefined)
    setIsCategoryModalOpen(true)
  }

  const handleEditTaxCategory = (taxCategory: ITaxCategory) => {
    setModalMode("edit")
    setSelectedTaxCategory(taxCategory)
    setIsCategoryModalOpen(true)
  }

  const handleViewTaxCategory = (taxCategory: ITaxCategory | null) => {
    if (!taxCategory) return
    setModalMode("view")
    setSelectedTaxCategory(taxCategory)
    setIsCategoryModalOpen(true)
  }

  // Helper function for API responses
  const handleApiResponse = (
    response: ApiResponse<ITax | ITaxDt | ITaxCategory>
  ) => {
    if (response.result === 1) {
      return true
    } else {
      return false
    }
  }

  // Specialized form handlers
  const handleTaxSubmit = async (data: TaxSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveMutation.mutateAsync(
          data
        )) as ApiResponse<ITax>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["taxs"] })
        }
      } else if (modalMode === "edit" && selectedTax) {
        const response = (await updateMutation.mutateAsync(
          data
        )) as ApiResponse<ITax>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["taxs"] })
        }
      }
    } catch (error) {
      console.error("Tax form submission error:", error)
    }
  }

  const handleTaxDtSubmit = async (data: TaxDtSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveDtMutation.mutateAsync(
          data
        )) as ApiResponse<ITaxDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["taxsdt"] })
        }
      } else if (modalMode === "edit" && selectedTaxDt) {
        const response = (await updateDtMutation.mutateAsync(
          data
        )) as ApiResponse<ITaxDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["taxsdt"] })
        }
      }
    } catch (error) {
      console.error("Tax Details form submission error:", error)
    }
  }

  const handleTaxCategorySubmit = async (data: TaxCategorySchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveCategoryMutation.mutateAsync(
          data
        )) as ApiResponse<ITaxCategory>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["taxcategory"] })
        }
      } else if (modalMode === "edit" && selectedTaxCategory) {
        const response = (await updateCategoryMutation.mutateAsync(
          data
        )) as ApiResponse<ITaxCategory>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["taxcategory"] })
        }
      }
    } catch (error) {
      console.error("Tax Category form submission error:", error)
    }
  }

  // State for save confirmations
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: TaxSchemaType | TaxDtSchemaType | TaxCategorySchemaType | null
    type: "tax" | "taxdt" | "taxcategory"
  }>({
    isOpen: false,
    data: null,
    type: "tax",
  })

  // Main form submit handler - shows confirmation first
  const handleFormSubmit = (
    data: TaxSchemaType | TaxDtSchemaType | TaxCategorySchemaType
  ) => {
    let type: "tax" | "taxdt" | "taxcategory" = "tax"
    if (isDtModalOpen) type = "taxdt"
    else if (isCategoryModalOpen) type = "taxcategory"

    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: type,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (
    data: TaxSchemaType | TaxDtSchemaType | TaxCategorySchemaType
  ) => {
    try {
      if (saveConfirmation.type === "taxdt") {
        await handleTaxDtSubmit(data as TaxDtSchemaType)
        setIsDtModalOpen(false)
      } else if (saveConfirmation.type === "taxcategory") {
        await handleTaxCategorySubmit(data as TaxCategorySchemaType)
        setIsCategoryModalOpen(false)
      } else {
        await handleTaxSubmit(data as TaxSchemaType)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // Delete handlers
  const handleDeleteTax = (taxId: string) => {
    const taxToDelete = taxsData.find((c) => c.taxId.toString() === taxId)
    if (!taxToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: taxId,
      name: taxToDelete.taxName,
      type: "tax",
    })
  }

  const handleDeleteTaxDt = (taxId: string) => {
    const taxDtToDelete = taxsDtData.find((c) => c.taxId.toString() === taxId)
    if (!taxDtToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: taxId,
      name: taxDtToDelete.taxName,
      type: "taxdt",
    })
  }

  const handleDeleteTaxCategory = (taxCategoryId: string) => {
    const taxCategoryToDelete = taxsCategoryData.find(
      (c) => c.taxCategoryId.toString() === taxCategoryId
    )
    if (!taxCategoryToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: taxCategoryId,
      name: taxCategoryToDelete.taxCategoryName,
      type: "taxcategory",
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteConfirmation.id) return

    let mutation
    switch (deleteConfirmation.type) {
      case "tax":
        mutation = deleteMutation
        break
      case "taxdt":
        mutation = deleteDtMutation
        break
      case "taxcategory":
        mutation = deleteCategoryMutation
        break
      default:
        return
    }

    mutation.mutateAsync(deleteConfirmation.id).then(() => {
      queryClient.invalidateQueries({ queryKey: [deleteConfirmation.type] })
    })

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
          const response = await getById(`${Tax.getByCode}/${trimmedCode}`)

          if (response.result === 1 && response.data) {
            const taxData = Array.isArray(response.data)
              ? response.data[0]
              : response.data

            if (taxData) {
              setExistingTax(taxData as ITax)
              setShowLoadDialogTax(true)
            }
          }
        } else if (isCategoryModalOpen) {
          const response = await getById(
            `${TaxCategory.getByCode}/${trimmedCode}`
          )
          if (response.result === 1 && response.data) {
            const categoryData = Array.isArray(response.data)
              ? response.data[0]
              : response.data

            if (categoryData) {
              setExistingTaxCategory(categoryData as ITaxCategory)
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
  const handleLoadExistingTax = () => {
    if (existingTax) {
      setModalMode("edit")
      setSelectedTax(existingTax)
      setShowLoadDialogTax(false)
      setExistingTax(null)
    }
  }

  const handleLoadExistingTaxCategory = () => {
    if (existingTaxCategory) {
      setModalMode("edit")
      setSelectedTaxCategory(existingTaxCategory)
      setShowLoadDialogCategory(false)
      setExistingTaxCategory(null)
    }
  }
  useEffect(() => {
    setTaxSearchInput(filters.search || "")
  }, [filters.search])
  useEffect(() => {
    setTaxDtSearchInput(dtFilters.search || "")
  }, [dtFilters.search])
  useEffect(() => {
    setTaxCategorySearchInput(categoryFilters.search || "")
  }, [categoryFilters.search])







  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Tax</h1>
          <p className="text-muted-foreground text-sm">
            Manage Tax information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "taxs" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search taxes..."
                  value={taxSearchInput}
                  onChange={(evt) => setTaxSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setTaxSearchInput("")
                      handleFilterChange({
                        search: undefined,
                        sortOrder: filters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {taxSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setTaxSearchInput("")
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
          {activeTab === "taxsdt" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search tax details..."
                  value={taxDtSearchInput}
                  onChange={(evt) => setTaxDtSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleDtFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setTaxDtSearchInput("")
                      handleDtFilterChange({
                        search: undefined,
                        sortOrder: dtFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {taxDtSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setTaxDtSearchInput("")
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
          {activeTab === "taxscategory" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search tax categories..."
                  value={taxCategorySearchInput}
                  onChange={(evt) => setTaxCategorySearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleCategoryFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setTaxCategorySearchInput("")
                      handleCategoryFilterChange({
                        search: undefined,
                        sortOrder: categoryFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {taxCategorySearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setTaxCategorySearchInput("")
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
        defaultValue="taxs"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="taxs">Tax</TabsTrigger>
          <TabsTrigger value="taxsdt">Tax Details</TabsTrigger>
          <TabsTrigger value="taxscategory">Tax Category</TabsTrigger>
        </TabsList>

        <TabsContent value="taxs" className="space-y-4">
          {isLoadingTax ? (
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
          ) : taxsResult === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <TaxTable
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
                canEdit={false}
                canDelete={false}
                canView={false}
                canCreate={false}
              />
            </LockSkeleton>
          ) : taxsResult ? (
            <TaxTable
              data={taxsData || []}
              isLoading={isLoadingTax}
              totalRecords={totalRecords}
              onSelect={canView ? handleViewTax : undefined}
              onDeleteAction={canDelete ? handleDeleteTax : undefined}
              onEditAction={canEdit ? handleEditTax : undefined}
              onCreateAction={canCreate ? handleCreateTax : undefined}
              onRefreshAction={refetchTax}
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
                {taxsResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="taxsdt" className="space-y-4">
          {isLoadingTaxDt ? (
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
          ) : taxsDtResult === -2 ||
            (!canViewDt && !canEditDt && !canDeleteDt && !canCreateDt) ? (
            <LockSkeleton locked={true}>
              <TaxDtTable
                data={[]}
                isLoading={false}
                totalRecords={taxsDtTotalRecords}
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
          ) : taxsDtResult ? (
            <TaxDtTable
              data={taxsDtData || []}
              isLoading={isLoadingTaxDt}
              totalRecords={taxsDtTotalRecords}
              onSelect={canViewDt ? handleViewTaxDt : undefined}
              onDeleteAction={canDeleteDt ? handleDeleteTaxDt : undefined}
              onEditAction={canEditDt ? handleEditTaxDt : undefined}
              onCreateAction={canCreateDt ? handleCreateTaxDt : undefined}
              onRefreshAction={refetchTaxDt}
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
                {taxsDtResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="taxscategory" className="space-y-4">
          {isLoadingTaxCategory ? (
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
          ) : taxsCategoryResult === -2 ||
            (!canViewCategory &&
              !canEditCategory &&
              !canDeleteCategory &&
              !canCreateCategory) ? (
            <LockSkeleton locked={true}>
              <TaxCategoryTable
                data={[]}
                isLoading={false}
                totalRecords={taxsCategoryTotalRecords}
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
                canView={false}
                canCreate={canCreateCategory}
              />
            </LockSkeleton>
          ) : taxsCategoryResult ? (
            <TaxCategoryTable
              data={taxsCategoryData || []}
              isLoading={isLoadingTaxCategory}
              totalRecords={taxsCategoryTotalRecords}
              onSelect={canViewCategory ? handleViewTaxCategory : undefined}
              onDeleteAction={
                canDeleteCategory ? handleDeleteTaxCategory : undefined
              }
              onEditAction={canEditCategory ? handleEditTaxCategory : undefined}
              onCreateAction={
                canCreateCategory ? handleCreateTaxCategory : undefined
              }
              onRefreshAction={refetchTaxCategory}
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
                {taxsCategoryResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tax Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Tax"}
              {modalMode === "edit" && "Update Tax"}
              {modalMode === "view" && "View Tax"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new tax to the system database."
                : modalMode === "edit"
                  ? "Update tax information in the system database."
                  : "View tax details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TaxForm
            initialData={modalMode !== "create" ? selectedTax : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Tax Details Form Dialog */}
      <Dialog open={isDtModalOpen} onOpenChange={setIsDtModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Tax Details"}
              {modalMode === "edit" && "Update Tax Details"}
              {modalMode === "view" && "View Tax Details"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add new Tax details to the system database."
                : modalMode === "edit"
                  ? "Update Tax details information."
                  : "View Tax details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TaxDtForm
            initialData={modalMode !== "create" ? selectedTaxDt : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsDtModalOpen(false)}
            isSubmitting={
              saveDtMutation.isPending || updateDtMutation.isPending
            }
            isReadOnly={modalMode === "view"}
          />
        </DialogContent>
      </Dialog>

      {/* Tax Category Form Dialog */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Tax Category"}
              {modalMode === "edit" && "Update Tax Category"}
              {modalMode === "view" && "View Tax Category"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new Tax category to the system database."
                : modalMode === "edit"
                  ? "Update Tax category information."
                  : "View Tax category details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TaxCategoryForm
            initialData={
              modalMode !== "create" ? selectedTaxCategory : undefined
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
        open={showLoadDialogTax}
        onOpenChange={setShowLoadDialogTax}
        onLoad={handleLoadExistingTax}
        onCancelAction={() => setExistingTax(null)}
        code={existingTax?.taxCode}
        name={existingTax?.taxName}
        typeLabel="Tax"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <LoadConfirmation
        open={showLoadDialogCategory}
        onOpenChange={setShowLoadDialogCategory}
        onLoad={handleLoadExistingTaxCategory}
        onCancelAction={() => setExistingTaxCategory(null)}
        code={existingTaxCategory?.taxCategoryCode}
        name={existingTaxCategory?.taxCategoryName}
        typeLabel="Tax Category"
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
            type: "tax",
          })
        }
        isDeleting={
          deleteConfirmation.type === "tax"
            ? deleteMutation.isPending
            : deleteConfirmation.type === "taxdt"
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
          saveConfirmation.type === "tax"
            ? (saveConfirmation.data as TaxSchemaType)?.taxName || ""
            : saveConfirmation.type === "taxdt"
              ? (
                  saveConfirmation.data as TaxDtSchemaType
                )?.taxPercentage?.toString() || ""
              : (saveConfirmation.data as TaxCategorySchemaType)
                  ?.taxCategoryName || ""
        }
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "tax",
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "tax",
          })
        }
        isSaving={
          saveConfirmation.type === "tax"
            ? saveMutation.isPending || updateMutation.isPending
            : saveConfirmation.type === "taxdt"
              ? saveDtMutation.isPending || updateDtMutation.isPending
              : saveCategoryMutation.isPending ||
                updateCategoryMutation.isPending
        }
      />
    </div>
  )
}
