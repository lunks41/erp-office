"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ITransportMode, ITransportModeFilter } from "@/interfaces/transport-mode"
import { TransportModeSchemaType } from "@/schemas/transport-mode"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { TransportMode } from "@/lib/api-routes"
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

import { TransportModeForm } from "./components/transport-mode-form"
import { TransportModesTable } from "./components/transport-mode-table"

export default function TransportModePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.transportMode

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ITransportModeFilter>({})
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
      setFilters(newFilters as ITransportModeFilter)
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
    data: transportModesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ITransportMode>(
    `${TransportMode.get}`,
    "transportModes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: transportModesResult,
    data: transportModesData,
    totalRecords,
  } = (transportModesResponse as ApiResponse<ITransportMode>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<TransportModeSchemaType>(`${TransportMode.add}`)
  const updateMutation = usePersist<TransportModeSchemaType>(`${TransportMode.add}`)
  const deleteMutation = useDelete(`${TransportMode.delete}`)

  const [selectedTransportMode, setSelectedTransportMode] = useState<ITransportMode | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingTransportMode, setExistingTransportMode] = useState<ITransportMode | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    transportModeId: string | null
    transportModeName: string | null
  }>({
    isOpen: false,
    transportModeId: null,
    transportModeName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: TransportModeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateTransportMode = () => {
    setModalMode("create")
    setSelectedTransportMode(null)
    setIsModalOpen(true)
  }

  const handleEditTransportMode = (transportMode: ITransportMode) => {
    setModalMode("edit")
    setSelectedTransportMode(transportMode)
    setIsModalOpen(true)
  }

  const handleViewTransportMode = (transportMode: ITransportMode | null) => {
    if (!transportMode) return
    setModalMode("view")
    setSelectedTransportMode(transportMode)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: TransportModeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: TransportModeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["transportModes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedTransportMode) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["transportModes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteTransportMode = (transportModeId: string) => {
    const transportModeToDelete = transportModesData?.find((b) => b.transportModeId.toString() === transportModeId)
    if (!transportModeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      transportModeId,
      transportModeName: transportModeToDelete.transportModeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.transportModeId) {
      deleteMutation.mutateAsync(deleteConfirmation.transportModeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["transportModes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        transportModeId: null,
        transportModeName: null,
      })
    }
  }

  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${TransportMode.getByCode}/${trimmedCode}`)
        if (response?.result === 1 && response.data) {
          const transportModeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (transportModeData) {
            const validTransportModeData: ITransportMode = {
              transportModeId: transportModeData.transportModeId,
              transportModeCode: transportModeData.transportModeCode,
              transportModeName: transportModeData.transportModeName,
              seqNo: transportModeData.seqNo || 0,
              companyId: transportModeData.companyId,
              remarks: transportModeData.remarks || "",
              isActive: transportModeData.isActive ?? true,
              createBy: transportModeData.createBy,
              editBy: transportModeData.editBy,
              createDate: transportModeData.createDate,
              editDate: transportModeData.editDate,
              createById: transportModeData.createById,
              editById: transportModeData.editById,
            }
            setExistingTransportMode(validTransportModeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingTransportMode = () => {
    if (existingTransportMode) {
      setModalMode("edit")
      setSelectedTransportMode(existingTransportMode)
      setShowLoadDialog(false)
      setExistingTransportMode(null)
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
            Transport Modes
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage transport mode information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search transport modes..."
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
      ) : transportModesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <TransportModesTable
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
        <TransportModesTable
          data={transportModesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewTransportMode : undefined}
          onDeleteAction={canDelete ? handleDeleteTransportMode : undefined}
          onEditAction={canEdit ? handleEditTransportMode : undefined}
          onCreateAction={canCreate ? handleCreateTransportMode : undefined}
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
              {modalMode === "create" && "Create Transport Mode"}
              {modalMode === "edit" && "Update Transport Mode"}
              {modalMode === "view" && "View Transport Mode"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new transport mode to the system database."
                : modalMode === "edit"
                  ? "Update transport mode information in the system database."
                  : "View transport mode details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TransportModeForm
            initialData={
              modalMode === "edit" || modalMode === "view" ? selectedTransportMode : null
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
        onLoad={handleLoadExistingTransportMode}
        onCancelAction={() => setExistingTransportMode(null)}
        code={existingTransportMode?.transportModeCode}
        name={existingTransportMode?.transportModeName}
        typeLabel="Transport Mode"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Transport Mode"
        description="This action cannot be undone. This will permanently delete the transport mode from our servers."
        itemName={deleteConfirmation.transportModeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            transportModeId: null,
            transportModeName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={modalMode === "create" ? "Create Transport Mode" : "Update Transport Mode"}
        itemName={saveConfirmation.data?.transportModeName || ""}
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

