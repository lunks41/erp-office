"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  IAccountSetup,
  IAccountSetupCategory,
  IAccountSetupCategoryFilter,
  IAccountSetupDt,
  IAccountSetupDtFilter,
  IAccountSetupFilter,
} from "@/interfaces/accountsetup"
import { ApiResponse } from "@/interfaces/auth"
import {
  AccountSetupCategorySchemaType,
  AccountSetupDtSchemaType,
  AccountSetupSchemaType,
} from "@/schemas/accountsetup"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import {
  AccountSetup,
  AccountSetupCategory,
  AccountSetupDt,
} from "@/lib/api-routes"
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

import { AccountSetupCategoryForm } from "./components/account-setup-category-form"
import { AccountSetupCategoryTable } from "./components/account-setup-category-table"
import { AccountSetupForm } from "./components/account-setup-form"
import { AccountSetupTable } from "./components/account-setup-table"
import { AccountSetupDtForm } from "./components/account-setupdt-form"
import { AccountSetupDtTable } from "./components/account-setupdt-table"

export default function AccountSetupPage() {
  const companyId = useParams().companyId as string

  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.accountSetup
  const transactionIdCategory = MasterTransactionId.accountSetupCategory
  const transactionIdDt = MasterTransactionId.accountSetupDt

  const { hasPermission } = usePermissionStore()

  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreateCategory = hasPermission(
    moduleId,
    transactionIdCategory,
    "isCreate"
  )
  const canViewCategory = hasPermission(
    moduleId,
    transactionIdCategory,
    "isRead"
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
  const canCreateDt = hasPermission(moduleId, transactionIdDt, "isCreate")
  const canViewDt = hasPermission(moduleId, transactionIdDt, "isRead")
  const canEditDt = hasPermission(moduleId, transactionIdDt, "isEdit")
  const canDeleteDt = hasPermission(moduleId, transactionIdDt, "isDelete")

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  const [filtersCategory, setFiltersCategory] =
    useState<IAccountSetupCategoryFilter>({})
  const [filtersSetup, setFiltersSetup] = useState<IAccountSetupFilter>({})
  const [filtersDt, setFiltersDt] = useState<IAccountSetupDtFilter>({})

    const [activeTab, setActiveTab] = useState("account-setup")

  const [setupSearchInput, setSetupSearchInput] = useState("")
  const [dtSearchInput, setDtSearchInput] = useState("")
  const [categorySearchInput, setCategorySearchInput] = useState("")
// Separate pagination state for each tab
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [setupCurrentPage, setSetupCurrentPage] = useState(1)
  const [setupPageSize, setSetupPageSize] = useState(
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
      setSetupPageSize(defaults.common.masterGridTotalRecords)
      setDtPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Account Setup Category data
  const {
    data: categoryResponse,
    refetch: refetchCategory,
    isLoading: isLoadingCategory,
  } = useGetWithPagination<IAccountSetupCategory>(
    `${AccountSetupCategory.get}`,
    "accountSetupCategories",
    filtersCategory.search,
    currentPage,
    pageSize
  )

  // Account Setup data
  const {
    data: setupResponse,
    refetch: refetchSetup,
    isLoading: isLoadingSetup,
  } = useGetWithPagination<IAccountSetup>(
    `${AccountSetup.get}`,
    "accountSetups",
    filtersSetup.search,
    setupCurrentPage,
    setupPageSize
  )

  // Account Setup Dt data
  const {
    data: dtResponse,
    refetch: refetchDt,
    isLoading: isLoadingDt,
  } = useGetWithPagination<IAccountSetupDt>(
    `${AccountSetupDt.get}`,
    "accountSetupDts",
    filtersDt.search,
    dtCurrentPage,
    dtPageSize
  )

  const {
    result: categoryResult,
    data: categoryData,
    totalRecords: categoryTotalRecords,
  } = (categoryResponse as ApiResponse<IAccountSetupCategory>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const {
    result: setupResult,
    data: setupData,
    totalRecords: setupTotalRecords,
  } = (setupResponse as ApiResponse<IAccountSetup>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const {
    result: dtResult,
    data: dtData,
    totalRecords: dtTotalRecords,
  } = (dtResponse as ApiResponse<IAccountSetupDt>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Account Setup Category mutations
  const saveMutationCategory = usePersist<AccountSetupCategorySchemaType>(
    `${AccountSetupCategory.add}`
  )
  const updateMutationCategory = usePersist<AccountSetupCategorySchemaType>(
    `${AccountSetupCategory.add}`
  )
  const deleteMutationCategory = useDelete(`${AccountSetupCategory.delete}`)

  // Account Setup mutations
  const saveMutationSetup = usePersist<AccountSetupSchemaType>(
    `${AccountSetup.add}`
  )
  const updateMutationSetup = usePersist<AccountSetupSchemaType>(
    `${AccountSetup.add}`
  )
  const deleteMutationSetup = useDelete(`${AccountSetup.delete}`)

  // Account Setup Dt mutations
  const saveMutationDt = usePersist<AccountSetupDtSchemaType>(
    `${AccountSetupDt.add}`
  )
  const updateMutationDt = usePersist<AccountSetupDtSchemaType>(
    `${AccountSetupDt.add}`
  )
  const deleteMutationDt = useDelete(`${AccountSetupDt.delete}`)

  // Account Setup Category state
  const [selectedCategory, setSelectedCategory] = useState<
    IAccountSetupCategory | undefined
  >(undefined)
  const [isModalCategoryOpen, setIsModalCategoryOpen] = useState(false)
  const [modalCategoryMode, setModalCategoryMode] = useState<
    "create" | "edit" | "view"
  >("create")

  // Account Setup state
  const [selectedSetup, setSelectedSetup] = useState<IAccountSetup | undefined>(
    undefined
  )
  const [isModalSetupOpen, setIsModalSetupOpen] = useState(false)
  const [modalSetupMode, setModalSetupMode] = useState<
    "create" | "edit" | "view"
  >("create")

  // Account Setup Dt state
  const [selectedDt, setSelectedDt] = useState<IAccountSetupDt | undefined>(
    undefined
  )
  const [isModalDtOpen, setIsModalDtOpen] = useState(false)
  const [modalDtMode, setModalDtMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    id: string | null
    name: string | null
    type: "setup" | "category" | "dt"
    // Additional IDs for AccountSetupDt (requires 3 IDs)
    accSetupId?: number
    currencyId?: number
    glId?: number
  }>({
    isOpen: false,
    id: null,
    name: null,
    type: "setup",
  })

  // State for save confirmations
  const [saveConfirmationCategory, setSaveConfirmationCategory] = useState<{
    isOpen: boolean
    data: AccountSetupCategorySchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const [saveConfirmationSetup, setSaveConfirmationSetup] = useState<{
    isOpen: boolean
    data: AccountSetupSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const [saveConfirmationDt, setSaveConfirmationDt] = useState<{
    isOpen: boolean
    data: AccountSetupDtSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // State for code availability check
  const [showLoadDialogCategory, setShowLoadDialogCategory] = useState(false)
  const [existingCategory, setExistingCategory] =
    useState<IAccountSetupCategory | null>(null)

  const [showLoadDialogSetup, setShowLoadDialogSetup] = useState(false)
  const [existingSetup, setExistingSetup] = useState<IAccountSetup | null>(null)

  // Filter change handlers
  const handleCategoryFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFiltersCategory(newFilters as IAccountSetupCategoryFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleSetupFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFiltersSetup(newFilters as IAccountSetupFilter)
      setSetupCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleDtFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFiltersDt(newFilters as IAccountSetupDtFilter)
      setDtCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  
  const handleSetupFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = setupSearchInput.trim() || undefined
    handleSetupFilterChange({
      search: normalizedSearch,
      sortOrder: filtersSetup.sortOrder,
    })
  }, [handleSetupFilterChange, filtersSetup.sortOrder, setupSearchInput])


  const handleDtFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = dtSearchInput.trim() || undefined
    handleDtFilterChange({
      search: normalizedSearch,
      sortOrder: filtersDt.sortOrder,
    })
  }, [handleDtFilterChange, filtersDt.sortOrder, dtSearchInput])


  const handleCategoryFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = categorySearchInput.trim() || undefined
    handleCategoryFilterChange({
      search: normalizedSearch,
      sortOrder: filtersCategory.sortOrder,
    })
  }, [handleCategoryFilterChange, filtersCategory.sortOrder, categorySearchInput])

// Page change handlers for each tab
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleSetupPageChange = useCallback((page: number) => {
    setSetupCurrentPage(page)
  }, [])

  const handleDtPageChange = useCallback((page: number) => {
    setDtCurrentPage(page)
  }, [])

  // Page size change handlers for each tab
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleSetupPageSizeChange = useCallback((size: number) => {
    setSetupPageSize(size)
    setSetupCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleDtPageSizeChange = useCallback((size: number) => {
    setDtPageSize(size)
    setDtCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleCategorySelect = (category: IAccountSetupCategory | null) => {
    if (!category) return
    setModalCategoryMode("view")
    setSelectedCategory(category)
    setIsModalCategoryOpen(true)
  }

  const handleCreateCategory = () => {
    setModalCategoryMode("create")
    setSelectedCategory(undefined)
    setIsModalCategoryOpen(true)
  }

  const handleEditCategory = (category: IAccountSetupCategory) => {
    setModalCategoryMode("edit")
    setSelectedCategory(category)
    setIsModalCategoryOpen(true)
  }

  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = categoryData?.find(
      (c) => c.accSetupCategoryId.toString() === id
    )
    if (!categoryToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: id,
      name: categoryToDelete.accSetupCategoryName,
      type: "category",
    })
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmitCategory = (data: AccountSetupCategorySchemaType) => {
    setSaveConfirmationCategory({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmitCategory = async (
    data: AccountSetupCategorySchemaType
  ) => {
    try {
      if (modalCategoryMode === "create") {
        const response = await saveMutationCategory.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({
            queryKey: ["accountSetupCategories"],
          })
        }
      } else if (modalCategoryMode === "edit" && selectedCategory) {
        const response = await updateMutationCategory.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({
            queryKey: ["accountSetupCategories"],
          })
        }
      }
      setIsModalCategoryOpen(false)
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleSetupSelect = (setup: IAccountSetup | null) => {
    if (!setup) return
    setModalSetupMode("view")
    setSelectedSetup(setup)
    setIsModalSetupOpen(true)
  }

  const handleCreateSetup = () => {
    setModalSetupMode("create")
    setSelectedSetup(undefined)
    setIsModalSetupOpen(true)
  }

  const handleEditSetup = (setup: IAccountSetup) => {
    setModalSetupMode("edit")
    setSelectedSetup(setup)
    setIsModalSetupOpen(true)
  }

  const handleDeleteSetup = (id: string) => {
    const setupToDelete = setupData?.find((c) => c.accSetupId.toString() === id)
    if (!setupToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: id,
      name: setupToDelete.accSetupName,
      type: "setup",
    })
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmitSetup = (data: AccountSetupSchemaType) => {
    setSaveConfirmationSetup({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmitSetup = async (
    data: AccountSetupSchemaType
  ) => {
    try {
      if (modalSetupMode === "create") {
        const response = await saveMutationSetup.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({
            queryKey: ["accountSetups"],
          })
        }
      } else if (modalSetupMode === "edit" && selectedSetup) {
        const response = await updateMutationSetup.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["accountSetups"] })
        }
      }
      setIsModalSetupOpen(false)
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDtSelect = (dt: IAccountSetupDt | null) => {
    if (!dt) return
    setModalDtMode("view")
    setSelectedDt(dt)
    setIsModalDtOpen(true)
  }

  const handleCreateDt = () => {
    setModalDtMode("create")
    setSelectedDt(undefined)
    setIsModalDtOpen(true)
  }

  const handleEditDt = (dt: IAccountSetupDt) => {
    setModalDtMode("edit")
    setSelectedDt(dt)
    setIsModalDtOpen(true)
  }

  const handleDeleteDt = (id: string) => {
    const dtToDelete = dtData?.find((c) => c.accSetupId.toString() === id)
    if (!dtToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: id,
      name: dtToDelete.accSetupName,
      type: "dt",
      // Store all 3 IDs needed for delete
      accSetupId: dtToDelete.accSetupId,
      currencyId: dtToDelete.currencyId,
      glId: dtToDelete.glId,
    })
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmitDt = (data: AccountSetupDtSchemaType) => {
    setSaveConfirmationDt({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmitDt = async (
    data: AccountSetupDtSchemaType
  ) => {
    try {
      if (modalDtMode === "create") {
        const response = await saveMutationDt.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["accountSetupDts"] })
        }
      } else if (modalDtMode === "edit" && selectedDt) {
        const response = await updateMutationDt.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["accountSetupDts"] })
        }
      }
      setIsModalDtOpen(false)
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleConfirmDelete = () => {
    if (!deleteConfirmation.id) return

    let deletePromise
    let queryKey

    switch (deleteConfirmation.type) {
      case "setup":
        deletePromise = deleteMutationSetup.mutateAsync(deleteConfirmation.id)
        queryKey = ["accountSetups"]
        break
      case "category":
        deletePromise = deleteMutationCategory.mutateAsync(
          deleteConfirmation.id
        )
        queryKey = ["accountSetupCategories"]
        break
      case "dt":
        // For AccountSetupDt, we need to pass all 3 IDs
        const { accSetupId, currencyId, glId } = deleteConfirmation
        if (!accSetupId || !currencyId || !glId) {
          console.error("Missing required IDs for AccountSetupDt deletion")
          return
        }
        // Pass composite key as: AccSetupId/CurrencyId/GLId
        const compositeId = `${accSetupId}/${currencyId}/${glId}`
        deletePromise = deleteMutationDt.mutateAsync(compositeId)
        queryKey = ["accountSetupDts"]
        break
      default:
        return
    }

    deletePromise.then(() => {
      queryClient.invalidateQueries({ queryKey })
    })

    setDeleteConfirmation({
      isOpen: false,
      id: null,
      name: null,
      type: "setup",
    })
  }

  // Handler for code availability check
  const handleCodeBlur = useCallback(
    async (code: string, type: "category" | "setup") => {
      if (
        modalCategoryMode === "edit" ||
        modalCategoryMode === "view" ||
        modalSetupMode === "edit" ||
        modalSetupMode === "view"
      )
        return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        if (type === "category" && isModalCategoryOpen) {
          const response = await getById(
            `${AccountSetupCategory.getByCode}/${trimmedCode}`
          )
          if (response?.result === 1 && response.data) {
            const categoryData = Array.isArray(response.data)
              ? response.data[0]
              : response.data

            if (categoryData) {
              const validCategoryData: IAccountSetupCategory = {
                accSetupCategoryId: categoryData.accSetupCategoryId,
                accSetupCategoryCode: categoryData.accSetupCategoryCode,
                accSetupCategoryName: categoryData.accSetupCategoryName,
                companyId: categoryData.companyId,
                createById: categoryData.createById || 0,
                editById: categoryData.editById || 0,
                remarks: categoryData.remarks || "",
                isActive: categoryData.isActive ?? true,
                createBy: categoryData.createBy,
                editBy: categoryData.editBy,
                createDate: categoryData.createDate,
                editDate: categoryData.editDate,
              }
              setExistingCategory(validCategoryData)
              setShowLoadDialogCategory(true)
            }
          }
        } else if (type === "setup" && isModalSetupOpen) {
          const response = await getById(
            `${AccountSetup.getByCode}/${trimmedCode}`
          )
          if (response?.result === 1 && response.data) {
            const setupData = Array.isArray(response.data)
              ? response.data[0]
              : response.data

            if (setupData) {
              const validSetupData: IAccountSetup = {
                accSetupId: setupData.accSetupId,
                accSetupCode: setupData.accSetupCode,
                accSetupName: setupData.accSetupName,
                accSetupCategoryId: setupData.accSetupCategoryId,
                accSetupCategoryCode: setupData.accSetupCategoryCode || "",
                accSetupCategoryName: setupData.accSetupCategoryName || "",
                companyId: setupData.companyId,
                createById: setupData.createById || 0,
                editById: setupData.editById || 0,
                remarks: setupData.remarks || "",
                isActive: setupData.isActive ?? true,
                createBy: setupData.createBy,
                editBy: setupData.editBy,
                createDate: setupData.createDate,
                editDate: setupData.editDate,
              }
              setExistingSetup(validSetupData)
              setShowLoadDialogSetup(true)
            }
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalCategoryMode, modalSetupMode, isModalCategoryOpen, isModalSetupOpen]
  )

  // Handler for loading existing category
  const handleLoadExistingCategory = () => {
    if (existingCategory) {
      setModalCategoryMode("edit")
      setSelectedCategory(existingCategory)
      setShowLoadDialogCategory(false)
      setExistingCategory(null)
    }
  }

  // Handler for loading existing setup
  const handleLoadExistingSetup = () => {
    if (existingSetup) {
      setModalSetupMode("edit")
      setSelectedSetup(existingSetup)
      setShowLoadDialogSetup(false)
      setExistingSetup(null)
    }
  }
  useEffect(() => {
    setSetupSearchInput(filtersSetup.search || "")
  }, [filtersSetup.search])
  useEffect(() => {
    setDtSearchInput(filtersDt.search || "")
  }, [filtersDt.search])
  useEffect(() => {
    setCategorySearchInput(filtersCategory.search || "")
  }, [filtersCategory.search])







  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Account Setup
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage account setup information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "account-setup" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search account setups..."
                  value={setupSearchInput}
                  onChange={(evt) => setSetupSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleSetupFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setSetupSearchInput("")
                      handleSetupFilterChange({
                        search: undefined,
                        sortOrder: filtersSetup.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {setupSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSetupSearchInput("")
                      handleSetupFilterChange({
                        search: undefined,
                        sortOrder: filtersSetup.sortOrder,
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
                onClick={handleSetupFilterChangeSearchSubmit}
                className="h-9 rounded-md px-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </>
          )}
          {activeTab === "account-setup-dt" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search account setup details..."
                  value={dtSearchInput}
                  onChange={(evt) => setDtSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleDtFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setDtSearchInput("")
                      handleDtFilterChange({
                        search: undefined,
                        sortOrder: filtersDt.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {dtSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setDtSearchInput("")
                      handleDtFilterChange({
                        search: undefined,
                        sortOrder: filtersDt.sortOrder,
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
          {activeTab === "account-setup-category" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search account setup categories..."
                  value={categorySearchInput}
                  onChange={(evt) => setCategorySearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleCategoryFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setCategorySearchInput("")
                      handleCategoryFilterChange({
                        search: undefined,
                        sortOrder: filtersCategory.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {categorySearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setCategorySearchInput("")
                      handleCategoryFilterChange({
                        search: undefined,
                        sortOrder: filtersCategory.sortOrder,
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
        defaultValue="account-setup"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="account-setup">Account Setup</TabsTrigger>
          <TabsTrigger value="account-setup-dt">
            Account Setup Detail
          </TabsTrigger>
          <TabsTrigger value="account-setup-category">
            Account Setup Category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account-setup" className="space-y-4">
          {isLoadingSetup ? (
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
          ) : setupResult === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <AccountSetupTable
                data={[]}
                isLoading={false}
                totalRecords={setupTotalRecords}
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
            <AccountSetupTable
              data={setupData || []}
              totalRecords={setupTotalRecords}
              onSelect={canView ? handleSetupSelect : undefined}
              onDeleteAction={canDelete ? handleDeleteSetup : undefined}
              onEditAction={canEdit ? handleEditSetup : undefined}
              onCreateAction={canCreate ? handleCreateSetup : undefined}
              onRefreshAction={refetchSetup}
              onFilterChange={handleSetupFilterChange}
              initialSearchValue={filtersSetup.search}
              onPageChange={handleSetupPageChange}
              onPageSizeChange={handleSetupPageSizeChange}
              currentPage={setupCurrentPage}
              pageSize={setupPageSize}
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
        </TabsContent>

        <TabsContent value="account-setup-dt" className="space-y-4">
          {isLoadingDt ? (
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
          ) : dtResult === -2 ||
            (!canViewDt && !canEditDt && !canDeleteDt && !canCreateDt) ? (
            <LockSkeleton locked={true}>
              <AccountSetupDtTable
                data={[]}
                isLoading={false}
                totalRecords={dtTotalRecords}
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
            <AccountSetupDtTable
              data={dtData || []}
              isLoading={false}
              totalRecords={dtTotalRecords}
              onSelect={canViewDt ? handleDtSelect : undefined}
              onDeleteAction={canDeleteDt ? handleDeleteDt : undefined}
              onEditAction={canEditDt ? handleEditDt : undefined}
              onCreateAction={canCreateDt ? handleCreateDt : undefined}
              onRefreshAction={refetchDt}
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
          )}
        </TabsContent>

        <TabsContent value="account-setup-category" className="space-y-4">
          {isLoadingCategory ? (
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
          ) : categoryResult === -2 ||
            (!canViewCategory &&
              !canEditCategory &&
              !canDeleteCategory &&
              !canCreateCategory) ? (
            <LockSkeleton locked={true}>
              <AccountSetupCategoryTable
                data={[]}
                isLoading={false}
                totalRecords={categoryTotalRecords}
                onSelect={() => {}}
                onDeleteAction={() => {}}
                onEditAction={() => {}}
                onCreateAction={() => {}}
                onRefreshAction={() => {}}
                onFilterChange={() => {}}
                moduleId={moduleId}
                transactionId={transactionIdCategory}
                canView={false}
                canCreate={false}
                canEdit={false}
                canDelete={false}
              />
            </LockSkeleton>
          ) : (
            <AccountSetupCategoryTable
              data={categoryData || []}
              isLoading={isLoadingCategory}
              totalRecords={categoryTotalRecords}
              onSelect={canViewCategory ? handleCategorySelect : undefined}
              onDeleteAction={
                canDeleteCategory ? handleDeleteCategory : undefined
              }
              onEditAction={canEditCategory ? handleEditCategory : undefined}
              onCreateAction={
                canCreateCategory ? handleCreateCategory : undefined
              }
              onRefreshAction={refetchCategory}
              onFilterChange={handleCategoryFilterChange}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              currentPage={currentPage}
              pageSize={pageSize}
              serverSidePagination={true}
              moduleId={moduleId}
              transactionId={transactionIdCategory}
              canEdit={canEditCategory}
              canDelete={canDeleteCategory}
              canView={canViewCategory}
              canCreate={canCreateCategory}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Account Setup Category Dialog */}
      <Dialog
        open={isModalCategoryOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalCategoryOpen(false)
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
              {modalCategoryMode === "create" &&
                "Create Account Setup Category"}
              {modalCategoryMode === "edit" && "Update Account Setup Category"}
              {modalCategoryMode === "view" && "View Account Setup Category"}
            </DialogTitle>
            <DialogDescription>
              {modalCategoryMode === "create"
                ? "Add a new account setup category to the system database."
                : modalCategoryMode === "edit"
                  ? "Update account setup category information in the system database."
                  : "View account setup category details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <AccountSetupCategoryForm
            initialData={
              modalCategoryMode === "edit" || modalCategoryMode === "view"
                ? selectedCategory
                : undefined
            }
            submitAction={handleFormSubmitCategory}
            onCancelAction={() => setIsModalCategoryOpen(false)}
            isSubmitting={
              saveMutationCategory.isPending || updateMutationCategory.isPending
            }
            isReadOnly={modalCategoryMode === "view"}
            onCodeBlur={(code) => handleCodeBlur(code, "category")}
          />
        </DialogContent>
      </Dialog>

      {/* Account Setup Dialog */}
      <Dialog
        open={isModalSetupOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalSetupOpen(false)
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
              {modalSetupMode === "create" && "Create Account Setup"}
              {modalSetupMode === "edit" && "Update Account Setup"}
              {modalSetupMode === "view" && "View Account Setup"}
            </DialogTitle>
            <DialogDescription>
              {modalSetupMode === "create"
                ? "Add a new account setup to the system database."
                : modalSetupMode === "edit"
                  ? "Update account setup information in the system database."
                  : "View account setup details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <AccountSetupForm
            initialData={
              modalSetupMode === "edit" || modalSetupMode === "view"
                ? selectedSetup
                : undefined
            }
            submitAction={handleFormSubmitSetup}
            onCancelAction={() => setIsModalSetupOpen(false)}
            isSubmitting={
              saveMutationSetup.isPending || updateMutationSetup.isPending
            }
            isReadOnly={modalSetupMode === "view"}
            onCodeBlur={(code) => handleCodeBlur(code, "setup")}
          />
        </DialogContent>
      </Dialog>

      {/* Account Setup Dt Dialog */}
      <Dialog
        open={isModalDtOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalDtOpen(false)
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
              {modalDtMode === "create" && "Create Account Setup Detail"}
              {modalDtMode === "edit" && "Update Account Setup Detail"}
              {modalDtMode === "view" && "View Account Setup Detail"}
            </DialogTitle>
            <DialogDescription>
              {modalDtMode === "create"
                ? "Add a new account setup detail to the system database."
                : modalDtMode === "edit"
                  ? "Update account setup detail information in the system database."
                  : "View account setup detail details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <AccountSetupDtForm
            initialData={
              modalDtMode === "edit" || modalDtMode === "view"
                ? selectedDt
                : undefined
            }
            submitAction={handleFormSubmitDt}
            onCancelAction={() => setIsModalDtOpen(false)}
            isSubmitting={
              saveMutationDt.isPending || updateMutationDt.isPending
            }
            isReadOnly={modalDtMode === "view"}
            companyId={companyId}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for existing Account Setup Category record */}
      <LoadConfirmation
        open={showLoadDialogCategory}
        onOpenChange={setShowLoadDialogCategory}
        onLoad={handleLoadExistingCategory}
        onCancelAction={() => setExistingCategory(null)}
        code={existingCategory?.accSetupCategoryCode}
        name={existingCategory?.accSetupCategoryName}
        typeLabel="Account Setup Category"
        isLoading={
          saveMutationCategory.isPending || updateMutationCategory.isPending
        }
      />

      {/* Dialog for existing Account Setup record */}
      <LoadConfirmation
        open={showLoadDialogSetup}
        onOpenChange={setShowLoadDialogSetup}
        onLoad={handleLoadExistingSetup}
        onCancelAction={() => setExistingSetup(null)}
        code={existingSetup?.accSetupCode}
        name={existingSetup?.accSetupName}
        typeLabel="Account Setup"
        isLoading={saveMutationSetup.isPending || updateMutationSetup.isPending}
      />

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
            type: "setup",
          })
        }
        isDeleting={
          deleteConfirmation.type === "setup"
            ? deleteMutationSetup.isPending
            : deleteConfirmation.type === "category"
              ? deleteMutationCategory.isPending
              : deleteMutationDt.isPending
        }
      />

      {/* Save Confirmation Dialogs */}
      <SaveConfirmation
        open={saveConfirmationCategory.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmationCategory((prev) => ({ ...prev, isOpen }))
        }
        title={
          modalCategoryMode === "create"
            ? "Create Account Setup Category"
            : "Update Account Setup Category"
        }
        itemName={saveConfirmationCategory.data?.accSetupCategoryName || ""}
        operationType={modalCategoryMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmationCategory.data) {
            handleConfirmedFormSubmitCategory(saveConfirmationCategory.data)
          }
          setSaveConfirmationCategory({
            isOpen: false,
            data: null,
          })
        }}
        onCancelAction={() =>
          setSaveConfirmationCategory({
            isOpen: false,
            data: null,
          })
        }
        isSaving={
          saveMutationCategory.isPending || updateMutationCategory.isPending
        }
      />

      <SaveConfirmation
        open={saveConfirmationSetup.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmationSetup((prev) => ({ ...prev, isOpen }))
        }
        title={
          modalSetupMode === "create"
            ? "Create Account Setup"
            : "Update Account Setup"
        }
        itemName={saveConfirmationSetup.data?.accSetupName || ""}
        operationType={modalSetupMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmationSetup.data) {
            handleConfirmedFormSubmitSetup(saveConfirmationSetup.data)
          }
          setSaveConfirmationSetup({
            isOpen: false,
            data: null,
          })
        }}
        onCancelAction={() =>
          setSaveConfirmationSetup({
            isOpen: false,
            data: null,
          })
        }
        isSaving={saveMutationSetup.isPending || updateMutationSetup.isPending}
      />

      <SaveConfirmation
        open={saveConfirmationDt.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmationDt((prev) => ({ ...prev, isOpen }))
        }
        title={
          modalDtMode === "create"
            ? "Create Account Setup Detail"
            : "Update Account Setup Detail"
        }
        itemName={saveConfirmationDt.data?.currencyId?.toString() || ""}
        operationType={modalDtMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmationDt.data) {
            handleConfirmedFormSubmitDt(saveConfirmationDt.data)
          }
          setSaveConfirmationDt({
            isOpen: false,
            data: null,
          })
        }}
        onCancelAction={() =>
          setSaveConfirmationDt({
            isOpen: false,
            data: null,
          })
        }
        isSaving={saveMutationDt.isPending || updateMutationDt.isPending}
      />
    </div>
  )
}
