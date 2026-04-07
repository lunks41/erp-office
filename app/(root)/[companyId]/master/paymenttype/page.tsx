"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IPaymentType, IPaymentTypeFilter } from "@/interfaces/paymenttype"
import { PaymentTypeSchemaType } from "@/schemas/paymenttype"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { PaymentType } from "@/lib/api-routes"
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

import { PaymentTypeForm } from "./components/payment-type-form"
import { PaymentTypesTable } from "./components/payment-type-table"

export default function PaymentTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.paymentType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IPaymentTypeFilter>({})
  const [searchInput, setSearchInput] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Get user setting defaults
  const { defaults } = useUserSettingDefaults()

  // Update page size when defaults change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter handler wrapper
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IPaymentTypeFilter)
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

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])
  const {
    data: paymentTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IPaymentType>(
    `${PaymentType.get}`,
    "paymentTypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: paymentTypesResult,
    data: paymentTypesData,
    totalRecords,
  } = (paymentTypesResponse as ApiResponse<IPaymentType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<PaymentTypeSchemaType>(`${PaymentType.add}`)
  const updateMutation = usePersist<PaymentTypeSchemaType>(`${PaymentType.add}`)
  const deleteMutation = useDelete(`${PaymentType.delete}`)

  const [selectedPaymentType, setSelectedPaymentType] =
    useState<IPaymentType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingPaymentType, setExistingPaymentType] =
    useState<IPaymentType | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    paymentTypeId: string | null
    paymentTypeName: string | null
  }>({
    isOpen: false,
    paymentTypeId: null,
    paymentTypeName: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreatePaymentType = () => {
    setModalMode("create")
    setSelectedPaymentType(null)
    setIsModalOpen(true)
  }

  const handleEditPaymentType = (paymentType: IPaymentType) => {
    setModalMode("edit")
    setSelectedPaymentType(paymentType)
    setIsModalOpen(true)
  }

  const handleViewPaymentType = (paymentType: IPaymentType | null) => {
    if (!paymentType) return
    setModalMode("view")
    setSelectedPaymentType(paymentType)
    setIsModalOpen(true)
  }

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: PaymentTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: PaymentTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: PaymentTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["paymentTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedPaymentType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["paymentTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeletePaymentType = (paymentTypeId: string) => {
    const paymentTypeToDelete = paymentTypesData?.find(
      (p) => p.paymentTypeId.toString() === paymentTypeId
    )
    if (!paymentTypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      paymentTypeId,
      paymentTypeName: paymentTypeToDelete.paymentTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.paymentTypeId) {
      deleteMutation.mutateAsync(deleteConfirmation.paymentTypeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["paymentTypes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        paymentTypeId: null,
        paymentTypeName: null,
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
          `${PaymentType.getByCode}/${trimmedCode}`
        )
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const paymentTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (paymentTypeData) {
            // Ensure all required fields are present
            const validPaymentTypeData: IPaymentType = {
              paymentTypeId: paymentTypeData.paymentTypeId,
              paymentTypeCode: paymentTypeData.paymentTypeCode,
              paymentTypeName: paymentTypeData.paymentTypeName,
              companyId: paymentTypeData.companyId,
              remarks: paymentTypeData.remarks || "",
              isActive: paymentTypeData.isActive ?? true,
              createBy: paymentTypeData.createBy,
              editBy: paymentTypeData.editBy,
              createDate: paymentTypeData.createDate,
              editDate: paymentTypeData.editDate,
            }
            setExistingPaymentType(validPaymentTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing payment type
  const handleLoadExistingPaymentType = () => {
    if (existingPaymentType) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedPaymentType(existingPaymentType)
      setShowLoadDialog(false)
      setExistingPaymentType(null)
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
            Payment Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage payment type information and settings
          </p>
        </div>
              <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search payment types..."
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
      ) : paymentTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <PaymentTypesTable
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
        <PaymentTypesTable
          data={paymentTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewPaymentType : undefined}
          onDeleteAction={canDelete ? handleDeletePaymentType : undefined}
          onEditAction={canEdit ? handleEditPaymentType : undefined}
          onCreateAction={canCreate ? handleCreatePaymentType : undefined}
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
          // Pass permissions to table
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
              {modalMode === "create" && "Create Payment Type"}
              {modalMode === "edit" && "Update Payment Type"}
              {modalMode === "view" && "View Payment Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new payment type to the system database."
                : modalMode === "edit"
                  ? "Update payment type information in the system database."
                  : "View payment type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <PaymentTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedPaymentType || undefined
                : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Payment Type Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingPaymentType}
        onCancelAction={() => setExistingPaymentType(null)}
        code={existingPaymentType?.paymentTypeCode}
        name={existingPaymentType?.paymentTypeName}
        typeLabel="Payment Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Payment Type"
        description="This action cannot be undone. This will permanently delete the payment type from our servers."
        itemName={deleteConfirmation.paymentTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            paymentTypeId: null,
            paymentTypeName: null,
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
          modalMode === "create" ? "Create Payment Type" : "Update Payment Type"
        }
        itemName={saveConfirmation.data?.paymentTypeName || ""}
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
