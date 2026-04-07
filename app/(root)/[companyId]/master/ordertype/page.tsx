"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IOrderType,
  IOrderTypeCategory,
  IOrderTypeCategoryFilter,
  IOrderTypeFilter,
} from "@/interfaces/ordertype"
import {
  OrderTypeCategorySchemaType,
  OrderTypeSchemaType,
} from "@/schemas/ordertype"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { OrderType, OrderTypeCategory } from "@/lib/api-routes"
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

import { OrderTypeForm } from "./components/ordertype-form"
import { OrderTypeTable } from "./components/ordertype-table"
import { OrderTypeCategoryForm } from "./components/ordertypecategory-form"
import { OrderTypeCategoryTable } from "./components/ordertypecategory-table"

export default function OrderTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.orderType
  const transactionIdCategory = MasterTransactionId.orderTypeCategory

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  // Permissions
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
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

  // Get user settings for default page size
  const { defaults } = useUserSettingDefaults()

  // State for filters
  const [filters, setFilters] = useState<IOrderTypeFilter>({})
  const [categoryFilters, setCategoryFilters] =
    useState<IOrderTypeCategoryFilter>({})

    const [activeTab, setActiveTab] = useState("ordertype")

  const [orderTypeSearchInput, setOrderTypeSearchInput] = useState("")
  const [orderTypeCategorySearchInput, setOrderTypeCategorySearchInput] = useState("")
// Separate pagination state for each tab
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
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
      setCategoryPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter change handlers
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IOrderTypeFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  const handleCategoryFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setCategoryFilters(newFilters as IOrderTypeCategoryFilter)
      setCategoryCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  
  const handleFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = orderTypeSearchInput.trim() || undefined
    handleFilterChange({
      search: normalizedSearch,
      sortOrder: filters.sortOrder,
    })
  }, [handleFilterChange, filters.sortOrder, orderTypeSearchInput])


  const handleCategoryFilterChangeSearchSubmit = useCallback(() => {
    const normalizedSearch = orderTypeCategorySearchInput.trim() || undefined
    handleCategoryFilterChange({
      search: normalizedSearch,
      sortOrder: categoryFilters.sortOrder,
    })
  }, [handleCategoryFilterChange, categoryFilters.sortOrder, orderTypeCategorySearchInput])

// Page change handlers for each tab
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleCategoryPageChange = useCallback((page: number) => {
    setCategoryCurrentPage(page)
  }, [])

  // Page size change handlers for each tab
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleCategoryPageSizeChange = useCallback((size: number) => {
    setCategoryPageSize(size)
    setCategoryCurrentPage(1) // Reset to first page when changing page size
  }, [])

  // Data fetching
  const {
    data: ordertypesResponse,
    refetch: refetchOrderType,
    isLoading: isLoadingOrderType,
  } = useGetWithPagination<IOrderType>(
    `${OrderType.get}`,
    "ordertypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    data: ordertypesCategoryResponse,
    refetch: refetchOrderTypeCategory,
    isLoading: isLoadingOrderTypeCategory,
  } = useGetWithPagination<IOrderTypeCategory>(
    `${OrderTypeCategory.get}`,
    "ordertypecategory",
    categoryFilters.search,
    categoryCurrentPage,
    categoryPageSize
  )

  // Extract data from responses with fallback values
  const {
    result: ordertypesResult,
    data: ordertypesData,
    totalRecords: ordertypesTotalRecords,
  } = (ordertypesResponse as ApiResponse<IOrderType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }
  const {
    result: ordertypesCategoryResult,
    data: ordertypesCategoryData,
    totalRecords: ordertypesCategoryTotalRecords,
  } = (ordertypesCategoryResponse as ApiResponse<IOrderTypeCategory>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  // Mutations
  const saveMutation = usePersist<OrderTypeSchemaType>(`${OrderType.add}`)
  const updateMutation = usePersist<OrderTypeSchemaType>(`${OrderType.add}`)
  const deleteMutation = useDelete(`${OrderType.delete}`)

  const saveCategoryMutation = usePersist<OrderTypeCategorySchemaType>(
    `${OrderTypeCategory.add}`
  )
  const updateCategoryMutation = usePersist<OrderTypeCategorySchemaType>(
    `${OrderTypeCategory.add}`
  )
  const deleteCategoryMutation = useDelete(`${OrderTypeCategory.delete}`)

  // State management
  const [selectedOrderType, setSelectedOrderType] = useState<
    IOrderType | undefined
  >()
  const [selectedOrderTypeCategory, setSelectedOrderTypeCategory] = useState<
    IOrderTypeCategory | undefined
  >()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null as string | null,
    name: null as string | null,
    type: "ordertype" as "ordertype" | "ordertypecategory",
  })

  // Duplicate detection states
  const [showLoadDialogOrderType, setShowLoadDialogOrderType] = useState(false)
  const [existingOrderType, setExistingOrderType] = useState<IOrderType | null>(
    null
  )

  const [showLoadDialogCategory, setShowLoadDialogCategory] = useState(false)
  const [existingOrderTypeCategory, setExistingOrderTypeCategory] =
    useState<IOrderTypeCategory | null>(null)

  // Refetch when filters change
  useEffect(() => {
    if (filters.search !== undefined) refetchOrderType()
  }, [filters.search, refetchOrderType])

  useEffect(() => {
    if (categoryFilters.search !== undefined) refetchOrderTypeCategory()
  }, [categoryFilters.search, refetchOrderTypeCategory])

  // Action handlers
  const handleCreateOrderType = () => {
    setModalMode("create")
    setSelectedOrderType(undefined)
    setIsModalOpen(true)
  }

  const handleEditOrderType = (ordertype: IOrderType) => {
    setModalMode("edit")
    setSelectedOrderType(ordertype)
    setIsModalOpen(true)
  }

  const handleViewOrderType = (ordertype: IOrderType | null) => {
    if (!ordertype) return
    setModalMode("view")
    setSelectedOrderType(ordertype)
    setIsModalOpen(true)
  }

  const handleCreateOrderTypeCategory = () => {
    setModalMode("create")
    setSelectedOrderTypeCategory(undefined)
    setIsCategoryModalOpen(true)
  }

  const handleEditOrderTypeCategory = (
    ordertypeCategory: IOrderTypeCategory
  ) => {
    setModalMode("edit")
    setSelectedOrderTypeCategory(ordertypeCategory)
    setIsCategoryModalOpen(true)
  }

  const handleViewOrderTypeCategory = (
    ordertypeCategory: IOrderTypeCategory | null
  ) => {
    if (!ordertypeCategory) return
    setModalMode("view")
    setSelectedOrderTypeCategory(ordertypeCategory)
    setIsCategoryModalOpen(true)
  }

  // Helper function for API responses
  const handleApiResponse = (
    response: ApiResponse<IOrderType | IOrderTypeCategory>
  ) => {
    if (response.result === 1) {
      return true
    } else {
      return false
    }
  }

  // Specialized form handlers
  const handleOrderTypeSubmit = async (data: OrderTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = (await saveMutation.mutateAsync(
          data
        )) as ApiResponse<IOrderType>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["ordertypes"] })
        }
      } else if (modalMode === "edit" && selectedOrderType) {
        const response = (await updateMutation.mutateAsync(
          data
        )) as ApiResponse<IOrderType>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["ordertypes"] })
        }
      }
    } catch (error) {
      console.error("OrderType form submission error:", error)
    }
  }

  const handleOrderTypeCategorySubmit = async (
    data: OrderTypeCategorySchemaType
  ) => {
    try {
      if (modalMode === "create") {
        const response = (await saveCategoryMutation.mutateAsync(
          data
        )) as ApiResponse<IOrderTypeCategory>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["ordertypecategory"] })
        }
      } else if (modalMode === "edit" && selectedOrderTypeCategory) {
        const response = (await updateCategoryMutation.mutateAsync(
          data
        )) as ApiResponse<IOrderTypeCategory>
        if (handleApiResponse(response)) {
          queryClient.invalidateQueries({ queryKey: ["ordertypecategory"] })
        }
      }
    } catch (error) {
      console.error("OrderType Category form submission error:", error)
    }
  }

  // State for save confirmations
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: OrderTypeSchemaType | OrderTypeCategorySchemaType | null
    type: "ordertype" | "ordertypecategory"
  }>({
    isOpen: false,
    data: null,
    type: "ordertype",
  })

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (
    data: OrderTypeSchemaType | OrderTypeCategorySchemaType
  ) => {
    try {
      if (saveConfirmation.type === "ordertypecategory") {
        await handleOrderTypeCategorySubmit(data as OrderTypeCategorySchemaType)
        setIsCategoryModalOpen(false)
      } else {
        await handleOrderTypeSubmit(data as OrderTypeSchemaType)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // Delete handlers
  const handleDeleteOrderType = (orderTypeId: string) => {
    const ordertypeToDelete = ordertypesData.find(
      (c) => c.orderTypeId.toString() === orderTypeId
    )
    if (!ordertypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: orderTypeId,
      name: ordertypeToDelete.orderTypeName,
      type: "ordertype",
    })
  }

  const handleDeleteOrderTypeCategory = (orderTypeCategoryId: string) => {
    const ordertypeCategoryToDelete = ordertypesCategoryData.find(
      (c) => c.orderTypeCategoryId.toString() === orderTypeCategoryId
    )
    if (!ordertypeCategoryToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      id: orderTypeCategoryId,
      name: ordertypeCategoryToDelete.orderTypeCategoryName,
      type: "ordertypecategory",
    })
  }

  // Individual deletion executors for each entity type
  const executeDeleteOrderType = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["ordertypes"] })
  }

  const executeDeleteOrderTypeCategory = async (id: string) => {
    await deleteCategoryMutation.mutateAsync(id)
    queryClient.invalidateQueries({ queryKey: ["ordertypecategory"] })
  }

  // Mapping of deletion types to their executor functions
  const deletionExecutors = {
    ordertype: executeDeleteOrderType,
    ordertypecategory: executeDeleteOrderTypeCategory,
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
      type: "ordertype",
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
        const response = await getById(`${OrderType.getByCode}/${trimmedCode}`)

        if (response.result === 1 && response.data) {
          const ordertypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (ordertypeData) {
            setExistingOrderType(ordertypeData as IOrderType)
            setShowLoadDialogOrderType(true)
          }
        }

        const responseCategory = await getById(
          `${OrderTypeCategory.getByCode}/${trimmedCode}`
        )

        if (responseCategory.data.result === 1 && responseCategory.data.data) {
          const ordertypeCategoryData = Array.isArray(
            responseCategory.data.data
          )
            ? responseCategory.data.data[0]
            : responseCategory.data.data

          if (ordertypeCategoryData) {
            setExistingOrderTypeCategory(
              ordertypeCategoryData as IOrderTypeCategory
            )
            setShowLoadDialogCategory(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Load existing records
  const handleLoadExistingOrderType = () => {
    if (existingOrderType) {
      setModalMode("edit")
      setSelectedOrderType(existingOrderType)
      setShowLoadDialogOrderType(false)
      setExistingOrderType(null)
    }
  }

  const handleLoadExistingCategory = () => {
    if (existingOrderTypeCategory) {
      setModalMode("edit")
      setSelectedOrderTypeCategory(existingOrderTypeCategory)
      setShowLoadDialogCategory(false)
      setExistingOrderTypeCategory(null)
    }
  }

  // Loading state removed - individual tables handle their own loading states
  useEffect(() => {
    setOrderTypeSearchInput(filters.search || "")
  }, [filters.search])
  useEffect(() => {
    setOrderTypeCategorySearchInput(categoryFilters.search || "")
  }, [categoryFilters.search])





  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Order Type
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage order type information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          {activeTab === "ordertype" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search order types..."
                  value={orderTypeSearchInput}
                  onChange={(evt) => setOrderTypeSearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setOrderTypeSearchInput("")
                      handleFilterChange({
                        search: undefined,
                        sortOrder: filters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {orderTypeSearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setOrderTypeSearchInput("")
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
          {activeTab === "ordertypecategory" && (
            <>
              <div className="relative w-full">
                <Input
                  placeholder="Search order type categories..."
                  value={orderTypeCategorySearchInput}
                  onChange={(evt) => setOrderTypeCategorySearchInput(evt.target.value)}
                  onKeyDown={(evt) => {
                    if (evt.key === "Enter") {
                      handleCategoryFilterChangeSearchSubmit()
                    }
                    if (evt.key === "Escape") {
                      setOrderTypeCategorySearchInput("")
                      handleCategoryFilterChange({
                        search: undefined,
                        sortOrder: categoryFilters.sortOrder,
                      })
                    }
                  }}
                  className="h-7 rounded-md pr-8"
                />
                {orderTypeCategorySearchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setOrderTypeCategorySearchInput("")
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
        defaultValue="ordertype"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="ordertype">Order Type</TabsTrigger>
          <TabsTrigger value="ordertypecategory">
            Order Type Category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ordertype" className="space-y-4">
          {isLoadingOrderType ? (
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
          ) : ordertypesResult === -2 ||
            (!canView && !canEdit && !canDelete && !canCreate) ? (
            <LockSkeleton locked={true}>
              <OrderTypeTable
                data={[]}
                isLoading={false}
                totalRecords={ordertypesTotalRecords}
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
            <OrderTypeTable
              data={ordertypesData || []}
              totalRecords={ordertypesTotalRecords}
              onSelect={canView ? handleViewOrderType : undefined}
              onDeleteAction={canDelete ? handleDeleteOrderType : undefined}
              onEditAction={canEdit ? handleEditOrderType : undefined}
              onCreateAction={canCreate ? handleCreateOrderType : undefined}
              onRefreshAction={refetchOrderType}
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

        <TabsContent value="ordertypecategory" className="space-y-4">
          {isLoadingOrderTypeCategory ? (
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
          ) : ordertypesCategoryResult === -2 ||
            (!canViewCategory &&
              !canEditCategory &&
              !canDeleteCategory &&
              !canCreateCategory) ? (
            <LockSkeleton locked={true}>
              <OrderTypeCategoryTable
                data={[]}
                isLoading={false}
                totalRecords={ordertypesCategoryTotalRecords}
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
          ) : (
            <OrderTypeCategoryTable
              data={ordertypesCategoryData || []}
              totalRecords={ordertypesCategoryTotalRecords}
              onSelect={
                canViewCategory ? handleViewOrderTypeCategory : undefined
              }
              onDeleteAction={
                canDeleteCategory ? handleDeleteOrderTypeCategory : undefined
              }
              onEditAction={
                canEditCategory ? handleEditOrderTypeCategory : undefined
              }
              onCreateAction={
                canCreateCategory ? handleCreateOrderTypeCategory : undefined
              }
              onRefreshAction={refetchOrderTypeCategory}
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
          )}
        </TabsContent>
      </Tabs>

      {/* Order Type Form Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Order Type"}
              {modalMode === "edit" && "Update Order Type"}
              {modalMode === "view" && "View Order Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new order type to the system database."
                : modalMode === "edit"
                  ? "Update order type information in the system database."
                  : "View order type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <OrderTypeForm
            initialData={modalMode !== "create" ? selectedOrderType : undefined}
            submitAction={handleOrderTypeSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Order Type Category Form Dialog */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent
          className="sm:max-w-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" && "Create Order Type Category"}
              {modalMode === "edit" && "Update Order Type Category"}
              {modalMode === "view" && "View Order Type Category"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new order type category to the system database."
                : modalMode === "edit"
                  ? "Update order type category information."
                  : "View order type category details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <OrderTypeCategoryForm
            initialData={
              modalMode !== "create" ? selectedOrderTypeCategory : undefined
            }
            submitAction={handleOrderTypeCategorySubmit}
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
        open={showLoadDialogOrderType}
        onOpenChange={setShowLoadDialogOrderType}
        onLoad={handleLoadExistingOrderType}
        onCancelAction={() => setExistingOrderType(null)}
        code={existingOrderType?.orderTypeCode}
        name={existingOrderType?.orderTypeName}
        typeLabel="Order Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <LoadConfirmation
        open={showLoadDialogCategory}
        onOpenChange={setShowLoadDialogCategory}
        onLoad={handleLoadExistingCategory}
        onCancelAction={() => setExistingOrderTypeCategory(null)}
        code={existingOrderTypeCategory?.orderTypeCategoryCode}
        name={existingOrderTypeCategory?.orderTypeCategoryName}
        typeLabel="Order Type Category"
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
            type: "ordertype",
          })
        }
        isDeleting={
          deleteConfirmation.type === "ordertype"
            ? deleteMutation.isPending
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
          saveConfirmation.type === "ordertype"
            ? (saveConfirmation.data as OrderTypeSchemaType)?.orderTypeName ||
              ""
            : (saveConfirmation.data as OrderTypeCategorySchemaType)
                ?.orderTypeCategoryName || ""
        }
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={() => {
          if (saveConfirmation.data) {
            handleConfirmedFormSubmit(saveConfirmation.data)
          }
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "ordertype",
          })
        }}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            data: null,
            type: "ordertype",
          })
        }
        isSaving={
          saveConfirmation.type === "ordertype"
            ? saveMutation.isPending || updateMutation.isPending
            : saveCategoryMutation.isPending || updateCategoryMutation.isPending
        }
      />
    </div>
  )
}
