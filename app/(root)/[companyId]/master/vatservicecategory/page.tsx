"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IVATServiceCategory,
  IVATServiceCategoryFilter,
} from "@/interfaces/vat-service-category"
import { VATServiceCategorySchemaType } from "@/schemas/vat-service-category"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { VATServiceCategory } from "@/lib/api-routes"
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

import { VATServiceCategoryForm } from "./components/vat-service-category-form"
import { VATServiceCategoriesTable } from "./components/vat-service-category-table"

export default function VATServiceCategoryPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.vatServiceCategory

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IVATServiceCategoryFilter>({})
  const [searchInput, setSearchInput] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const { defaults } = useUserSettingDefaults()

  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IVATServiceCategoryFilter)
      setCurrentPage(1)
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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])
  const {
    data: vatServiceCategoriesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IVATServiceCategory>(
    `${VATServiceCategory.get}`,
    "vatServiceCategories",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: vatServiceCategoriesResult,
    data: vatServiceCategoriesData,
    totalRecords,
  } = (vatServiceCategoriesResponse as ApiResponse<IVATServiceCategory>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<VATServiceCategorySchemaType>(
    `${VATServiceCategory.add}`
  )
  const updateMutation = usePersist<VATServiceCategorySchemaType>(
    `${VATServiceCategory.add}`
  )
  const deleteMutation = useDelete(`${VATServiceCategory.delete}`)

  const [selectedVATServiceCategory, setSelectedVATServiceCategory] =
    useState<IVATServiceCategory | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingVATServiceCategory, setExistingVATServiceCategory] =
    useState<IVATServiceCategory | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    vatServiceCategoryId: string | null
    vatServiceCategoryName: string | null
  }>({
    isOpen: false,
    vatServiceCategoryId: null,
    vatServiceCategoryName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: VATServiceCategorySchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateVATServiceCategory = () => {
    setModalMode("create")
    setSelectedVATServiceCategory(null)
    setIsModalOpen(true)
  }

  const handleEditVATServiceCategory = (
    vatServiceCategory: IVATServiceCategory
  ) => {
    setModalMode("edit")
    setSelectedVATServiceCategory(vatServiceCategory)
    setIsModalOpen(true)
  }

  const handleViewVATServiceCategory = (
    vatServiceCategory: IVATServiceCategory | null
  ) => {
    if (!vatServiceCategory) return
    setModalMode("view")
    setSelectedVATServiceCategory(vatServiceCategory)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: VATServiceCategorySchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (
    data: VATServiceCategorySchemaType
  ) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["vatServiceCategories"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedVATServiceCategory) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["vatServiceCategories"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteVATServiceCategory = (vatServiceCategoryId: string) => {
    const vatServiceCategoryToDelete = vatServiceCategoriesData?.find(
      (b) => b.serviceCategoryId.toString() === vatServiceCategoryId
    )
    if (!vatServiceCategoryToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      vatServiceCategoryId,
      vatServiceCategoryName: vatServiceCategoryToDelete.serviceCategoryName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.vatServiceCategoryId) {
      deleteMutation
        .mutateAsync(deleteConfirmation.vatServiceCategoryId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["vatServiceCategories"] })
        })
      setDeleteConfirmation({
        isOpen: false,
        vatServiceCategoryId: null,
        vatServiceCategoryName: null,
      })
    }
  }

  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(
          `${VATServiceCategory.getByCode}/${trimmedCode}`
        )
        if (response?.result === 1 && response.data) {
          const vatServiceCategoryData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (vatServiceCategoryData) {
            const validVATServiceCategoryData: IVATServiceCategory = {
              serviceCategoryId: vatServiceCategoryData.serviceCategoryId,
              serviceCategoryCode: vatServiceCategoryData.serviceCategoryCode,
              serviceCategoryName: vatServiceCategoryData.serviceCategoryName,
              seqNo: vatServiceCategoryData.seqNo || 0,
              companyId: vatServiceCategoryData.companyId,
              remarks: vatServiceCategoryData.remarks || "",
              isActive: vatServiceCategoryData.isActive ?? true,
              createBy: vatServiceCategoryData.createBy,
              editBy: vatServiceCategoryData.editBy,
              createDate: vatServiceCategoryData.createDate,
              editDate: vatServiceCategoryData.editDate,
              createById: vatServiceCategoryData.createById,
              editById: vatServiceCategoryData.editById,
            }
            setExistingVATServiceCategory(validVATServiceCategoryData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingVATServiceCategory = () => {
    if (existingVATServiceCategory) {
      setModalMode("edit")
      setSelectedVATServiceCategory(existingVATServiceCategory)
      setShowLoadDialog(false)
      setExistingVATServiceCategory(null)
    }
  }

  useEffect(() => {
    setSearchInput(filters.search || "")
  }, [filters.search])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            VAT Service Categories
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage VAT service category information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search VAT service categories..."
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
      ) : vatServiceCategoriesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <VATServiceCategoriesTable
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
        <VATServiceCategoriesTable
          data={vatServiceCategoriesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewVATServiceCategory : undefined}
          onDeleteAction={
            canDelete ? handleDeleteVATServiceCategory : undefined
          }
          onEditAction={canEdit ? handleEditVATServiceCategory : undefined}
          onCreateAction={
            canCreate ? handleCreateVATServiceCategory : undefined
          }
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
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
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
              {modalMode === "create" && "Create VAT Service Category"}
              {modalMode === "edit" && "Update VAT Service Category"}
              {modalMode === "view" && "View VAT Service Category"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new VAT service category to the system database."
                : modalMode === "edit"
                  ? "Update VAT service category information in the system database."
                  : "View VAT service category details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <VATServiceCategoryForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedVATServiceCategory
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

      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingVATServiceCategory}
        onCancelAction={() => setExistingVATServiceCategory(null)}
        code={existingVATServiceCategory?.serviceCategoryCode}
        name={existingVATServiceCategory?.serviceCategoryName}
        typeLabel="VAT Service Category"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete VAT Service Category"
        description="This action cannot be undone. This will permanently delete the VAT service category from our servers."
        itemName={deleteConfirmation.vatServiceCategoryName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            vatServiceCategoryId: null,
            vatServiceCategoryName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={
          modalMode === "create"
            ? "Create VAT Service Category"
            : "Update VAT Service Category"
        }
        itemName={saveConfirmation.data?.serviceCategoryName || ""}
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
