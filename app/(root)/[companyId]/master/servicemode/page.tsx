"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IServiceMode, IServiceModeFilter } from "@/interfaces/service-mode"
import { ServiceModeSchemaType } from "@/schemas/service-mode"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { ServiceMode } from "@/lib/api-routes"
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

import { ServiceModeForm } from "./components/service-mode-form"
import { ServiceModesTable } from "./components/service-mode-table"

export default function ServiceModePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.serviceMode

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IServiceModeFilter>({})
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
      setFilters(newFilters as IServiceModeFilter)
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
    data: serviceModesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IServiceMode>(
    `${ServiceMode.get}`,
    "serviceModes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: serviceModesResult,
    data: serviceModesData,
    totalRecords,
  } = (serviceModesResponse as ApiResponse<IServiceMode>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<ServiceModeSchemaType>(`${ServiceMode.add}`)
  const updateMutation = usePersist<ServiceModeSchemaType>(`${ServiceMode.add}`)
  const deleteMutation = useDelete(`${ServiceMode.delete}`)

  const [selectedServiceMode, setSelectedServiceMode] =
    useState<IServiceMode | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingServiceMode, setExistingServiceMode] =
    useState<IServiceMode | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    serviceModeId: string | null
    serviceModeName: string | null
  }>({
    isOpen: false,
    serviceModeId: null,
    serviceModeName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: ServiceModeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateServiceMode = () => {
    setModalMode("create")
    setSelectedServiceMode(null)
    setIsModalOpen(true)
  }

  const handleEditServiceMode = (serviceMode: IServiceMode) => {
    setModalMode("edit")
    setSelectedServiceMode(serviceMode)
    setIsModalOpen(true)
  }

  const handleViewServiceMode = (serviceMode: IServiceMode | null) => {
    if (!serviceMode) return
    setModalMode("view")
    setSelectedServiceMode(serviceMode)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: ServiceModeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: ServiceModeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["serviceModes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedServiceMode) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["serviceModes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteServiceMode = (serviceModeId: string) => {
    const serviceModeToDelete = serviceModesData?.find(
      (b) => b.serviceModeId.toString() === serviceModeId
    )
    if (!serviceModeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      serviceModeId,
      serviceModeName: serviceModeToDelete.serviceModeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.serviceModeId) {
      deleteMutation.mutateAsync(deleteConfirmation.serviceModeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["serviceModes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        serviceModeId: null,
        serviceModeName: null,
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
          `${ServiceMode.getByCode}/${trimmedCode}`
        )
        if (response?.result === 1 && response.data) {
          const serviceModeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (serviceModeData) {
            const validServiceModeData: IServiceMode = {
              serviceModeId: serviceModeData.serviceModeId,
              serviceModeCode: serviceModeData.serviceModeCode,
              serviceModeName: serviceModeData.serviceModeName,
              seqNo: serviceModeData.seqNo || 0,
              companyId: serviceModeData.companyId,
              remarks: serviceModeData.remarks || "",
              isActive: serviceModeData.isActive ?? true,
              createBy: serviceModeData.createBy,
              editBy: serviceModeData.editBy,
              createDate: serviceModeData.createDate,
              editDate: serviceModeData.editDate,
              createById: serviceModeData.createById,
              editById: serviceModeData.editById,
            }
            setExistingServiceMode(validServiceModeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingServiceMode = () => {
    if (existingServiceMode) {
      setModalMode("edit")
      setSelectedServiceMode(existingServiceMode)
      setShowLoadDialog(false)
      setExistingServiceMode(null)
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
            Service Modes
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage service mode information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search service modes..."
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
      ) : serviceModesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <ServiceModesTable
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
        <ServiceModesTable
          data={serviceModesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewServiceMode : undefined}
          onDeleteAction={canDelete ? handleDeleteServiceMode : undefined}
          onEditAction={canEdit ? handleEditServiceMode : undefined}
          onCreateAction={canCreate ? handleCreateServiceMode : undefined}
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
              {modalMode === "create" && "Create Service Mode"}
              {modalMode === "edit" && "Update Service Mode"}
              {modalMode === "view" && "View Service Mode"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new service mode to the system database."
                : modalMode === "edit"
                  ? "Update service mode information in the system database."
                  : "View service mode details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <ServiceModeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedServiceMode
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
        onLoad={handleLoadExistingServiceMode}
        onCancelAction={() => setExistingServiceMode(null)}
        code={existingServiceMode?.serviceModeCode}
        name={existingServiceMode?.serviceModeName}
        typeLabel="Service Mode"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Service Mode"
        description="This action cannot be undone. This will permanently delete the service mode from our servers."
        itemName={deleteConfirmation.serviceModeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            serviceModeId: null,
            serviceModeName: null,
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
          modalMode === "create" ? "Create Service Mode" : "Update Service Mode"
        }
        itemName={saveConfirmation.data?.serviceModeName || ""}
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
