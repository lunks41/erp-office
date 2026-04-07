"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IConsignmentType,
  IConsignmentTypeFilter,
} from "@/interfaces/consignment-type"
import { ConsignmentTypeSchemaType } from "@/schemas/consignment-type"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { ConsignmentType } from "@/lib/api-routes"
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

import { ConsignmentTypeForm } from "./components/consignment-type-form"
import { ConsignmentTypesTable } from "./components/consignment-type-table"

export default function ConsignmentTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.consignmentType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IConsignmentTypeFilter>({})
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
      setFilters(newFilters as IConsignmentTypeFilter)
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
    data: consignmentTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IConsignmentType>(
    `${ConsignmentType.get}`,
    "consignmentTypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: consignmentTypesResult,
    data: consignmentTypesData,
    totalRecords,
  } = (consignmentTypesResponse as ApiResponse<IConsignmentType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<ConsignmentTypeSchemaType>(
    `${ConsignmentType.add}`
  )
  const updateMutation = usePersist<ConsignmentTypeSchemaType>(
    `${ConsignmentType.add}`
  )
  const deleteMutation = useDelete(`${ConsignmentType.delete}`)

  const [selectedConsignmentType, setSelectedConsignmentType] =
    useState<IConsignmentType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingConsignmentType, setExistingConsignmentType] =
    useState<IConsignmentType | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    consignmentTypeId: string | null
    consignmentTypeName: string | null
  }>({
    isOpen: false,
    consignmentTypeId: null,
    consignmentTypeName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: ConsignmentTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateConsignmentType = () => {
    setModalMode("create")
    setSelectedConsignmentType(null)
    setIsModalOpen(true)
  }

  const handleEditConsignmentType = (consignmentType: IConsignmentType) => {
    setModalMode("edit")
    setSelectedConsignmentType(consignmentType)
    setIsModalOpen(true)
  }

  const handleViewConsignmentType = (
    consignmentType: IConsignmentType | null
  ) => {
    if (!consignmentType) return
    setModalMode("view")
    setSelectedConsignmentType(consignmentType)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: ConsignmentTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: ConsignmentTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["consignmentTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedConsignmentType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["consignmentTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteConsignmentType = (consignmentTypeId: string) => {
    const consignmentTypeToDelete = consignmentTypesData?.find(
      (b) => b.consignmentTypeId.toString() === consignmentTypeId
    )
    if (!consignmentTypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      consignmentTypeId,
      consignmentTypeName: consignmentTypeToDelete.consignmentTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.consignmentTypeId) {
      deleteMutation
        .mutateAsync(deleteConfirmation.consignmentTypeId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["consignmentTypes"] })
        })
      setDeleteConfirmation({
        isOpen: false,
        consignmentTypeId: null,
        consignmentTypeName: null,
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
          `${ConsignmentType.getByCode}/${trimmedCode}`
        )
        if (response?.result === 1 && response.data) {
          const consignmentTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (consignmentTypeData) {
            const validConsignmentTypeData: IConsignmentType = {
              consignmentTypeId: consignmentTypeData.consignmentTypeId,
              consignmentTypeCode: consignmentTypeData.consignmentTypeCode,
              consignmentTypeName: consignmentTypeData.consignmentTypeName,
              seqNo: consignmentTypeData.seqNo || 0,
              companyId: consignmentTypeData.companyId,
              remarks: consignmentTypeData.remarks || "",
              isActive: consignmentTypeData.isActive ?? true,
              createBy: consignmentTypeData.createBy,
              editBy: consignmentTypeData.editBy,
              createDate: consignmentTypeData.createDate,
              editDate: consignmentTypeData.editDate,
              createById: consignmentTypeData.createById,
              editById: consignmentTypeData.editById,
            }
            setExistingConsignmentType(validConsignmentTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingConsignmentType = () => {
    if (existingConsignmentType) {
      setModalMode("edit")
      setSelectedConsignmentType(existingConsignmentType)
      setShowLoadDialog(false)
      setExistingConsignmentType(null)
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
            Consignment Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage consignment type information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search consignment types..."
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
      ) : consignmentTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <ConsignmentTypesTable
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
        <ConsignmentTypesTable
          data={consignmentTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewConsignmentType : undefined}
          onDeleteAction={canDelete ? handleDeleteConsignmentType : undefined}
          onEditAction={canEdit ? handleEditConsignmentType : undefined}
          onCreateAction={canCreate ? handleCreateConsignmentType : undefined}
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
              {modalMode === "create" && "Create Consignment Type"}
              {modalMode === "edit" && "Update Consignment Type"}
              {modalMode === "view" && "View Consignment Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new consignment type to the system database."
                : modalMode === "edit"
                  ? "Update consignment type information in the system database."
                  : "View consignment type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ConsignmentTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedConsignmentType
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
        onLoad={handleLoadExistingConsignmentType}
        onCancelAction={() => setExistingConsignmentType(null)}
        code={existingConsignmentType?.consignmentTypeCode}
        name={existingConsignmentType?.consignmentTypeName}
        typeLabel="Consignment Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Consignment Type"
        description="This action cannot be undone. This will permanently delete the consignment type from our servers."
        itemName={deleteConfirmation.consignmentTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            consignmentTypeId: null,
            consignmentTypeName: null,
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
            ? "Create Consignment Type"
            : "Update Consignment Type"
        }
        itemName={saveConfirmation.data?.consignmentTypeName || ""}
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
