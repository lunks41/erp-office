"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  ICurrency,
  ICurrencyDt,
  ICurrencyFilter,
  ICurrencyLocalDt,
} from "@/interfaces/currency"
import {
  CurrencyDtSchemaType,
  CurrencyLocalDtSchemaType,
  CurrencySchemaType,
} from "@/schemas/currency"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { Currency } from "@/lib/api-routes"
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

import { CurrencyForm } from "./components/currency-form"
import { CurrenciesTable } from "./components/currency-table"
import { CurrencyDtForm } from "./components/currencydt-form"
import { CurrencyDtsTable } from "./components/currencydt-table"
import { CurrencyLocalDtForm } from "./components/currencylocaldt-form"
import { CurrencyLocalDtsTable } from "./components/currencylocaldt-table"

const MODULE_ID = ModuleId.master
const TRANSACTION_ID = MasterTransactionId.currency
const TRANSACTION_ID_DT = MasterTransactionId.currencyDt
const TRANSACTION_ID_LOCAL_DT = MasterTransactionId.currencyLocalDt

export default function CurrencyPage() {
  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  // Permissions
  const canCreate = hasPermission(MODULE_ID, TRANSACTION_ID, "isCreate")
  const canEdit = hasPermission(MODULE_ID, TRANSACTION_ID, "isEdit")
  const canDelete = hasPermission(MODULE_ID, TRANSACTION_ID, "isDelete")
  const canView = hasPermission(MODULE_ID, TRANSACTION_ID, "isRead")
  const canCreateDt = hasPermission(MODULE_ID, TRANSACTION_ID_DT, "isCreate")
  const canEditDt = hasPermission(MODULE_ID, TRANSACTION_ID_DT, "isEdit")
  const canDeleteDt = hasPermission(MODULE_ID, TRANSACTION_ID_DT, "isDelete")
  const canViewDt = hasPermission(MODULE_ID, TRANSACTION_ID_DT, "isRead")
  const canCreateLocalDt = hasPermission(
    MODULE_ID,
    TRANSACTION_ID_LOCAL_DT,
    "isCreate"
  )
  const canEditLocalDt = hasPermission(
    MODULE_ID,
    TRANSACTION_ID_LOCAL_DT,
    "isEdit"
  )
  const canDeleteLocalDt = hasPermission(
    MODULE_ID,
    TRANSACTION_ID_LOCAL_DT,
    "isDelete"
  )
  const canViewLocalDt = hasPermission(
    MODULE_ID,
    TRANSACTION_ID_LOCAL_DT,
    "isRead"
  )

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  // State for filters
  const [filters, setFilters] = useState<ICurrencyFilter>({})
  const [dtFilters, setDtFilters] = useState<ICurrencyFilter>({})
  const [localDtFilters, setLocalDtFilters] = useState<ICurrencyFilter>({})
  const [activeTab, setActiveTab] = useState("currency")
  const [currencySearchInput, setCurrencySearchInput] = useState("")
  const [currencyDtSearchInput, setCurrencyDtSearchInput] = useState("")
  const [currencyLocalDtSearchInput, setCurrencyLocalDtSearchInput] =
    useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [dtCurrentPage, setDtCurrentPage] = useState(1)
  const [dtPageSize, setDtPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [localCurrentPage, setLocalCurrentPage] = useState(1)
  const [localPageSize, setLocalPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when user settings change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
      setDtPageSize(defaults.common.masterGridTotalRecords)
      setLocalPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Data fetching
  const {
    data: currenciesResponse,
    refetch: refetchCurrency,
    isLoading: isLoadingCurrency,
  } = useGetWithPagination<ICurrency>(
    `${Currency.get}`,
    "currencies",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    data: currencyDtResponse,
    refetch: refetchCurrencyDt,
    isLoading: isLoadingCurrencyDt,
  } = useGetWithPagination<ICurrencyDt>(
    `${Currency.getDt}`,
    "currencyDt",
    dtFilters.search,
    dtCurrentPage,
    dtPageSize
  )

  const {
    data: currencyLocalDtResponse,
    refetch: refetchCurrencyLocalDt,
    isLoading: isLoadingCurrencyLocalDt,
  } = useGetWithPagination<ICurrencyLocalDt>(
    `${Currency.getLocalDt}`,
    "currencyLocalDt",
    localDtFilters.search,
    localCurrentPage,
    localPageSize
  )

  // Extract data from responses with fallback values
  const {
    result: currenciesResult,
    data: currenciesData,
    totalRecords: currenciesTotalRecords,
  } = (currenciesResponse as ApiResponse<ICurrency>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }
  const {
    result: currencyDtResult,
    data: currencyDtData,
    totalRecords: currencyDtTotalRecords,
  } = (currencyDtResponse as ApiResponse<ICurrencyDt>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }
  const {
    result: currencyLocalDtResult,
    data: currencyLocalDtData,
    totalRecords: currencyLocalDtTotalRecords,
  } = (currencyLocalDtResponse as ApiResponse<ICurrencyLocalDt>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Mutations
  const saveMutation = usePersist<CurrencySchemaType>(`${Currency.add}`)
  const updateMutation = usePersist<CurrencySchemaType>(`${Currency.add}`)
  const deleteMutation = useDelete(`${Currency.delete}`)

  const saveDtMutation = usePersist<CurrencyDtSchemaType>(`${Currency.addDt}`)
  const updateDtMutation = usePersist<CurrencyDtSchemaType>(`${Currency.addDt}`)
  const deleteDtMutation = useDelete(`${Currency.deleteDt}`)

  const saveLocalDtMutation = usePersist<CurrencyLocalDtSchemaType>(
    `${Currency.addLocalDt}`
  )
  const updateLocalDtMutation = usePersist<CurrencyLocalDtSchemaType>(
    `${Currency.addLocalDt}`
  )
  const deleteLocalDtMutation = useDelete(`${Currency.deleteLocalDt}`)

  // State management
  const [selectedCurrency, setSelectedCurrency] = useState<
    ICurrency | undefined
  >()
  const [selectedCurrencyDt, setSelectedCurrencyDt] = useState<
    ICurrencyDt | undefined
  >()
  const [selectedCurrencyLocalDt, setSelectedCurrencyLocalDt] = useState<
    ICurrencyLocalDt | undefined
  >()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDtModalOpen, setIsDtModalOpen] = useState(false)
  const [isLocalDtModalOpen, setIsLocalDtModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null as string | null,
    name: null as string | null,
    type: "currency" as "currency" | "currencydt" | "currencylocaldt",
  })

  // Duplicate detection states
  const [showLoadDialogCurrency, setShowLoadDialogCurrency] = useState(false)
  const [existingCurrency, setExistingCurrency] = useState<ICurrency | null>(
    null
  )

  // Refetch when filters change
  useEffect(() => {
    if (filters.search !== undefined) refetchCurrency()
  }, [filters.search, refetchCurrency])

  useEffect(() => {
    if (dtFilters.search !== undefined) refetchCurrencyDt()
  }, [dtFilters.search, refetchCurrencyDt])

  useEffect(() => {
    if (localDtFilters.search !== undefined) refetchCurrencyLocalDt()
  }, [localDtFilters.search, refetchCurrencyLocalDt])

  // Action handlers
  const handleCreateCurrency = () => {
    setModalMode("create")
    setSelectedCurrency(undefined)
    setIsModalOpen(true)
  }

  const handleEditCurrency = (currency: ICurrency) => {
    setModalMode("edit")
    setSelectedCurrency(currency)
    setIsModalOpen(true)
  }

  const handleViewCurrency = (currency: ICurrency | null) => {
    if (!currency) return
    setModalMode("view")
    setSelectedCurrency(currency)
    setIsModalOpen(true)
  }

  const handleCreateCurrencyDt = () => {
    setModalMode("create")
    setSelectedCurrencyDt(undefined)
    setIsDtModalOpen(true)
  }

  const handleEditCurrencyDt = (currencyDt: ICurrencyDt) => {
    setModalMode("edit")
    setSelectedCurrencyDt(currencyDt)
    setIsDtModalOpen(true)
  }

  const handleViewCurrencyDt = (currencyDt: ICurrencyDt | null) => {
    if (!currencyDt) return
    setModalMode("view")
    setSelectedCurrencyDt(currencyDt)
    setIsDtModalOpen(true)
  }

  const handleCreateCurrencyLocalDt = () => {
    setModalMode("create")
    setSelectedCurrencyLocalDt(undefined)
    setIsLocalDtModalOpen(true)
  }

  const handleEditCurrencyLocalDt = (currencyLocalDt: ICurrencyLocalDt) => {
    setModalMode("edit")
    setSelectedCurrencyLocalDt(currencyLocalDt)
    setIsLocalDtModalOpen(true)
  }

  const handleViewCurrencyLocalDt = (
    currencyLocalDt: ICurrencyLocalDt | null
  ) => {
    if (!currencyLocalDt) return
    setModalMode("view")
    setSelectedCurrencyLocalDt(currencyLocalDt)
    setIsLocalDtModalOpen(true)
  }

  // Filter handlers
  const handleCurrencyFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as ICurrencyFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleCurrencyDtFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setDtFilters(newFilters as ICurrencyFilter)
      setDtCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleCurrencyLocalDtFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setLocalDtFilters(newFilters as ICurrencyFilter)
      setLocalCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleCurrencyFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = currencySearchInput.trim() || undefined
    handleCurrencyFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [currencySearchInput, filters.sortOrder, handleCurrencyFilterChange])

  const handleCurrencyDtFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = currencyDtSearchInput.trim() || undefined
    handleCurrencyDtFilterChange({
      search: normalizedSearch,
      sortOrder: dtFilters.sortOrder,
    })
  }, [currencyDtSearchInput, dtFilters.sortOrder, handleCurrencyDtFilterChange])

  const handleCurrencyLocalDtFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = currencyLocalDtSearchInput.trim() || undefined
    handleCurrencyLocalDtFilterChange({
      search: normalizedSearch,
      sortOrder: localDtFilters.sortOrder,
    })
  }, [
    currencyLocalDtSearchInput,
    handleCurrencyLocalDtFilterChange,
    localDtFilters.sortOrder,
  ])

  // Page change handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleDtPageChange = useCallback((page: number) => {
    setDtCurrentPage(page)
  }, [])

  const handleLocalPageChange = useCallback((page: number) => {
    setLocalCurrentPage(page)
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

  const handleLocalPageSizeChange = useCallback((size: number) => {
    setLocalPageSize(size)
    setLocalCurrentPage(1) // Reset to first page when changing page size
  }, [])

  // Helper function for API responses
  const handleApiResponse = useCallback(
    (response: ApiResponse<ICurrency | ICurrencyDt | ICurrencyLocalDt>) => {
      if (response.result === 1) {
        return true
      } else {
        return false
      }
    },
    []
  )

  // State for save confirmations
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data:
      | CurrencySchemaType
      | CurrencyDtSchemaType
      | CurrencyLocalDtSchemaType
      | null
    type: "currency" | "currencydt" | "currencylocaldt"
  }>({
    isOpen: false,
    data: null,
    type: "currency",
  })

  // Form submission handlers
  const handleCurrencySubmit = async (data: CurrencySchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveMutation.mutateAsync(
          data
        )) as ApiResponse<ICurrency>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["currencies"] })
        }
      } else if (modalMode === "edit" && selectedCurrency) {
        const response = (await updateMutation.mutateAsync(
          data
        )) as ApiResponse<ICurrency>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["currencies"] })
        }
      }
    } catch (error) {
      console.error("Currency form submission error:", error)
    }
  }

  const handleCurrencyDtSubmit = async (data: CurrencyDtSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveDtMutation.mutateAsync(
          data
        )) as ApiResponse<ICurrencyDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["currencyDt"] })
        }
      } else if (modalMode === "edit" && selectedCurrencyDt) {
        const response = (await updateDtMutation.mutateAsync(
          data
        )) as ApiResponse<ICurrencyDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["currencyDt"] })
        }
      }
    } catch (error) {
      console.error("Currency details form submission error:", error)
    }
  }

  const handleCurrencyLocalDtSubmit = async (
    data: CurrencyLocalDtSchemaType
  ) => {
    try {
      if (modalMode === "create") {
        const response = (await saveLocalDtMutation.mutateAsync(
          data
        )) as ApiResponse<ICurrencyLocalDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["currencyLocalDt"] })
        }
      } else if (modalMode === "edit" && selectedCurrencyLocalDt) {
        const response = (await updateLocalDtMutation.mutateAsync(
          data
        )) as ApiResponse<ICurrencyLocalDt>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["currencyLocalDt"] })
        }
      }
    } catch (error) {
      console.error("Local currency details form submission error:", error)
    }
  }

  // Main form submit handler - shows confirmation first
  const handleFormSubmit = (
    data: CurrencySchemaType | CurrencyDtSchemaType | CurrencyLocalDtSchemaType
  ) => {
    let type: "currency" | "currencydt" | "currencylocaldt" = "currency"
    if (isDtModalOpen) type = "currencydt"
    else if (isLocalDtModalOpen) type = "currencylocaldt"

    setSaveConfirmation({
      isOpen: true,
      data: data,
      type: type,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (
    data: CurrencySchemaType | CurrencyDtSchemaType | CurrencyLocalDtSchemaType
  ) => {
    try {
      if (saveConfirmation.type === "currencydt") {
        await handleCurrencyDtSubmit(data as CurrencyDtSchemaType)
        setIsDtModalOpen(false)
      } else if (saveConfirmation.type === "currencylocaldt") {
        await handleCurrencyLocalDtSubmit(data as CurrencyLocalDtSchemaType)
        setIsLocalDtModalOpen(false)
      } else {
        await handleCurrencySubmit(data as CurrencySchemaType)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // Delete handlers
  const handleDeleteCurrency = (currencyId: string) => {
    const currencyToDelete = currenciesData?.find(
      (c) => c.currencyId.toString() === currencyId
    )
    if (!currencyToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: currencyId,
      name: currencyToDelete.currencyName,
      type: "currency",
    })
  }

  const handleDeleteCurrencyDt = (currencyId: string) => {
    const currencyDtToDelete = currencyDtData?.find(
      (c) => c.currencyId.toString() === currencyId
    )
    if (!currencyDtToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: currencyId,
      name: currencyDtToDelete.currencyName,
      type: "currencydt",
    })
  }

  const handleDeleteCurrencyLocalDt = (currencyId: string) => {
    const currencyLocalDtToDelete = currencyLocalDtData?.find(
      (c) => c.currencyId.toString() === currencyId
    )
    if (!currencyLocalDtToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: currencyId,
      name: currencyLocalDtToDelete.currencyName,
      type: "currencylocaldt",
    })
  }

  // Individual deletion executors for each entity type
  const executeDeleteCurrency = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["currencies"] })
  }

  const executeDeleteCurrencyDt = async (id: string) => {
    await deleteDtMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["currencyDt"] })
  }

  const executeDeleteCurrencyLocalDt = async (id: string) => {
    await deleteLocalDtMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["currencyLocalDt"] })
  }

  // Mapping of deletion types to their executor functions
  const deletionExecutors = {
    currency: executeDeleteCurrency,
    currencydt: executeDeleteCurrencyDt,
    currencylocaldt: executeDeleteCurrencyLocalDt,
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
      type: "currency",
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
        if (isModalOpen) {
          const response = await getById(`${Currency.getByCode}/${trimmedCode}`)

          if (response.result === 1 && response.data) {
            const currencyData = Array.isArray(response.data)
              ? response.data[0]
              : response.data

            if (currencyData) {
              setExistingCurrency(currencyData as ICurrency)
              setShowLoadDialogCurrency(true)
            }
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode, isModalOpen]
  )

  // Load existing records
  const handleLoadExistingCurrency = () => {
    if (existingCurrency) {
      setModalMode("edit")
      setSelectedCurrency(existingCurrency)
      setShowLoadDialogCurrency(false)
      setExistingCurrency(null)
    }
  }
  useEffect(() => {
    setCurrencySearchInput(filters.search || "")
  }, [filters.search])
  useEffect(() => {
    setCurrencyDtSearchInput(dtFilters.search || "")
  }, [dtFilters.search])
  useEffect(() => {
    setCurrencyLocalDtSearchInput(localDtFilters.search || "")
  }, [localDtFilters.search])







  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Currency
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage currency information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "currency" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search currencies..."
                  value={currencySearchInput}
                  onChange={(evt) => setCurrencySearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleCurrencyFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setCurrencySearchInput("")
                      handleCurrencyFilterChange({
                        search: undefined,
                        sortOrder: filters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {currencySearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setCurrencySearchInput("")
                      handleCurrencyFilterChange({
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
                onClick={handleCurrencyFilterChangeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          )}
          {activeTab === "currencydt" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search currency details..."
                  value={currencyDtSearchInput}
                  onChange={(evt) => setCurrencyDtSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleCurrencyDtFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setCurrencyDtSearchInput("")
                      handleCurrencyDtFilterChange({
                        search: undefined,
                        sortOrder: dtFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {currencyDtSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setCurrencyDtSearchInput("")
                      handleCurrencyDtFilterChange({
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
                onClick={handleCurrencyDtFilterChangeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          )}
          {activeTab === "currencylocaldt" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search local currency details..."
                  value={currencyLocalDtSearchInput}
                  onChange={(evt) => setCurrencyLocalDtSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleCurrencyLocalDtFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setCurrencyLocalDtSearchInput("")
                      handleCurrencyLocalDtFilterChange({
                        search: undefined,
                        sortOrder: localDtFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {currencyLocalDtSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setCurrencyLocalDtSearchInput("")
                      handleCurrencyLocalDtFilterChange({
                        search: undefined,
                        sortOrder: localDtFilters.sortOrder,
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
                onClick={handleCurrencyLocalDtFilterChangeSearchSubmit}
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
        defaultValue="currency"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="currencydt">Currency Details</TabsTrigger>
          <TabsTrigger value="currencylocaldt">
            Local Currency Details
          </TabsTrigger>
        </TabsList>

        {/* Currency Tab */}
        <TabsContent value="currency" className="space-y-4">
          {isLoadingCurrency ? (
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
          ) : currenciesResult === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <CurrenciesTable
                data={[]}
                isLoading={false}
                totalRecords={currenciesTotalRecords}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={MODULE_ID}
                transactionId={TRANSACTION_ID}
                canEdit={false}
                canDelete={false}
                canView={false}
                canCreate={false}
              />
            </LockSkeleton>
          ) : currenciesResult ? (
            <CurrenciesTable
              data={currenciesData || []}
              isLoading={isLoadingCurrency}
              totalRecords={currenciesTotalRecords}
              onSelect={canView ? handleViewCurrency : undefined}
              onDeleteAction={canDelete ? handleDeleteCurrency : undefined}
              onEditAction={canEdit ? handleEditCurrency : undefined}
              onCreateAction={canCreate ? handleCreateCurrency : undefined}
              onRefreshAction={refetchCurrency}
              onFilterChange={handleCurrencyFilterChange}
              initialSearchValue={filters.search}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              currentPage={currentPage}
              pageSize={pageSize}
              serverSidePagination={true}
              moduleId={MODULE_ID}
              transactionId={TRANSACTION_ID}
              canEdit={canEdit}
              canDelete={canDelete}
              canView={canView}
              canCreate={canCreate}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {currenciesResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Currency Details Tab */}
        <TabsContent value="currencydt" className="space-y-4">
          {isLoadingCurrencyDt ? (
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
          ) : currencyDtResult === -2 ||
            (!canViewDt && !canEditDt && !canDeleteDt && !canCreateDt) ? (
            <LockSkeleton locked={true}>
              <CurrencyDtsTable
                data={[]}
                isLoading={false}
                totalRecords={currencyDtTotalRecords}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={MODULE_ID}
                transactionId={TRANSACTION_ID_DT}
                canEdit={false}
                canDelete={false}
                canView={false}
                canCreate={false}
              />
            </LockSkeleton>
          ) : currencyDtResult ? (
            <CurrencyDtsTable
              data={currencyDtData || []}
              isLoading={isLoadingCurrencyDt}
              totalRecords={currencyDtTotalRecords}
              onSelect={canViewDt ? handleViewCurrencyDt : undefined}
              onDeleteAction={canDeleteDt ? handleDeleteCurrencyDt : undefined}
              onEditAction={canEditDt ? handleEditCurrencyDt : undefined}
              onCreateAction={canCreateDt ? handleCreateCurrencyDt : undefined}
              onRefreshAction={refetchCurrencyDt}
              onFilterChange={handleCurrencyDtFilterChange}
              onPageChange={handleDtPageChange}
              onPageSizeChange={handleDtPageSizeChange}
              currentPage={dtCurrentPage}
              pageSize={dtPageSize}
              serverSidePagination={true}
              moduleId={MODULE_ID}
              transactionId={TRANSACTION_ID_DT}
              canEdit={canEditDt}
              canDelete={canDeleteDt}
              canView={canViewDt}
              canCreate={canCreateDt}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {currencyDtResult === 0 ? "No data available" : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Local Currency Details Tab */}
        <TabsContent value="currencylocaldt" className="space-y-4">
          {isLoadingCurrencyLocalDt ? (
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
          ) : currencyLocalDtResult === -2 ||
            (!canViewLocalDt &&
              !canEditLocalDt &&
              !canDeleteLocalDt &&
              !canCreateLocalDt) ? (
            <LockSkeleton locked={true}>
              <CurrencyLocalDtsTable
                data={[]}
                isLoading={false}
                totalRecords={currencyLocalDtTotalRecords}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={MODULE_ID}
                transactionId={TRANSACTION_ID_LOCAL_DT}
                canEdit={false}
                canDelete={canDeleteLocalDt}
                canView={canViewLocalDt}
                canCreate={canCreateLocalDt}
              />
            </LockSkeleton>
          ) : currencyLocalDtResult ? (
            <CurrencyLocalDtsTable
              data={currencyLocalDtData || []}
              isLoading={isLoadingCurrencyLocalDt}
              totalRecords={currencyLocalDtTotalRecords}
              onSelect={canViewLocalDt ? handleViewCurrencyLocalDt : undefined}
              onDeleteAction={
                canDeleteLocalDt ? handleDeleteCurrencyLocalDt : undefined
              }
              onEditAction={
                canEditLocalDt ? handleEditCurrencyLocalDt : undefined
              }
              onCreateAction={
                canCreateLocalDt ? handleCreateCurrencyLocalDt : undefined
              }
              onRefreshAction={refetchCurrencyLocalDt}
              onFilterChange={handleCurrencyLocalDtFilterChange}
              onPageChange={handleLocalPageChange}
              onPageSizeChange={handleLocalPageSizeChange}
              currentPage={localCurrentPage}
              pageSize={localPageSize}
              serverSidePagination={true}
              moduleId={MODULE_ID}
              transactionId={TRANSACTION_ID_LOCAL_DT}
              canEdit={canEditLocalDt}
              canDelete={canDeleteLocalDt}
              canView={canViewLocalDt}
              canCreate={canCreateLocalDt}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {currencyLocalDtResult === 0
                  ? "No data available"
                  : "Loading..."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Currency Form Modal */}
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
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Currency"}
              {modalMode === "edit" && "Update Currency"}
              {modalMode === "view" && "View Currency"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new currency to the system database."
                : modalMode === "edit"
                  ? "Update currency information in the system database."
                  : "View currency details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <CurrencyForm
            initialData={modalMode !== "create" ? selectedCurrency : undefined}
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Currency Details Form Modal */}
      <Dialog
        open={isDtModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDtModalOpen(false)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Currency Details"}
              {modalMode === "edit" && "Update Currency Details"}
              {modalMode === "view" && "View Currency Details"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add new currency details to the system database."
                : modalMode === "edit"
                  ? "Update currency details information."
                  : "View currency details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <CurrencyDtForm
            initialData={
              modalMode !== "create" ? selectedCurrencyDt : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsDtModalOpen(false)}
            isSubmitting={
              saveDtMutation.isPending || updateDtMutation.isPending
            }
            isReadOnly={modalMode === "view"}
          />
        </DialogContent>
      </Dialog>

      {/* Local Currency Details Form Modal */}
      <Dialog
        open={isLocalDtModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsLocalDtModalOpen(false)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Local Currency Details"}
              {modalMode === "edit" && "Update Local Currency Details"}
              {modalMode === "view" && "View Local Currency Details"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add new local currency details to the system database."
                : modalMode === "edit"
                  ? "Update local currency details information."
                  : "View local currency details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <CurrencyLocalDtForm
            initialData={
              modalMode !== "create" ? selectedCurrencyLocalDt : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsLocalDtModalOpen(false)}
            isSubmitting={
              saveLocalDtMutation.isPending || updateLocalDtMutation.isPending
            }
            isReadOnly={modalMode === "view"}
          />
        </DialogContent>
      </Dialog>

      {/* Duplicate Record Dialog */}
      <LoadConfirmation
        open={showLoadDialogCurrency}
        onOpenChange={setShowLoadDialogCurrency}
        onLoad={handleLoadExistingCurrency}
        onCancelAction={() => setExistingCurrency(null)}
        code={existingCurrency?.currencyCode}
        name={existingCurrency?.currencyName}
        typeLabel="Currency"
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
            type: "currency",
          })
        }
        isDeleting={
          deleteConfirmation.type === "currency"
            ? deleteMutation.isPending
            : deleteConfirmation.type === "currencydt"
              ? deleteDtMutation.isPending
              : deleteLocalDtMutation.isPending
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
          saveConfirmation.type === "currency"
            ? (saveConfirmation.data as CurrencySchemaType)?.currencyName || ""
            : saveConfirmation.type === "currencydt"
              ? (
                  saveConfirmation.data as CurrencyDtSchemaType
                )?.currencyId?.toString() || ""
              : (
                  saveConfirmation.data as CurrencyLocalDtSchemaType
                )?.currencyId?.toString() || ""
        }
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "currency",
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "currency",
          })
        }
        isSaving={
          saveConfirmation.type === "currency"
            ? saveMutation.isPending || updateMutation.isPending
            : saveConfirmation.type === "currencydt"
              ? saveDtMutation.isPending || updateDtMutation.isPending
              : saveLocalDtMutation.isPending || updateLocalDtMutation.isPending
        }
      />
    </div>
  )
}
