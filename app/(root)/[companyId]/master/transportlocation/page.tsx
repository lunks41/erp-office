"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ITransportLocation, ITransportLocationFilter } from "@/interfaces/transport-location"
import { TransportLocationSchemaType } from "@/schemas/transport-location"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { TransportLocation } from "@/lib/api-routes"
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

import { TransportLocationForm } from "./components/transport-location-form"
import { TransportLocationsTable } from "./components/transport-location-table"

export default function TransportLocationPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.transportLocation

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ITransportLocationFilter>({})
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
      setFilters(newFilters as ITransportLocationFilter)
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
    data: transportLocationsResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ITransportLocation>(
    `${TransportLocation.get}`,
    "transportLocations",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: transportLocationsResult,
    data: transportLocationsData,
    totalRecords,
  } = (transportLocationsResponse as ApiResponse<ITransportLocation>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<TransportLocationSchemaType>(`${TransportLocation.add}`)
  const updateMutation = usePersist<TransportLocationSchemaType>(`${TransportLocation.add}`)
  const deleteMutation = useDelete(`${TransportLocation.delete}`)

  const [selectedTransportLocation, setSelectedTransportLocation] = useState<ITransportLocation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingTransportLocation, setExistingTransportLocation] = useState<ITransportLocation | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    transportLocationId: string | null
    transportLocationName: string | null
  }>({
    isOpen: false,
    transportLocationId: null,
    transportLocationName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: TransportLocationSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateTransportLocation = () => {
    setModalMode("create")
    setSelectedTransportLocation(null)
    setIsModalOpen(true)
  }

  const handleEditTransportLocation = (transportLocation: ITransportLocation) => {
    setModalMode("edit")
    setSelectedTransportLocation(transportLocation)
    setIsModalOpen(true)
  }

  const handleViewTransportLocation = (transportLocation: ITransportLocation | null) => {
    if (!transportLocation) return
    setModalMode("view")
    setSelectedTransportLocation(transportLocation)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: TransportLocationSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: TransportLocationSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["transportLocations"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedTransportLocation) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["transportLocations"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteTransportLocation = (transportLocationId: string) => {
    const transportLocationToDelete = transportLocationsData?.find((b) => b.transportLocationId.toString() === transportLocationId)
    if (!transportLocationToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      transportLocationId,
      transportLocationName: transportLocationToDelete.transportLocationName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.transportLocationId) {
      deleteMutation.mutateAsync(deleteConfirmation.transportLocationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["transportLocations"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        transportLocationId: null,
        transportLocationName: null,
      })
    }
  }

  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${TransportLocation.getByCode}/${trimmedCode}`)
        if (response?.result === 1 && response.data) {
          const transportLocationData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (transportLocationData) {
            const validTransportLocationData: ITransportLocation = {
              transportLocationId: transportLocationData.transportLocationId,
              transportLocationCode: transportLocationData.transportLocationCode,
              transportLocationName: transportLocationData.transportLocationName,
              seqNo: transportLocationData.seqNo || 0,
              companyId: transportLocationData.companyId,
              remarks: transportLocationData.remarks || "",
              isActive: transportLocationData.isActive ?? true,
              createBy: transportLocationData.createBy,
              editBy: transportLocationData.editBy,
              createDate: transportLocationData.createDate,
              editDate: transportLocationData.editDate,
              createById: transportLocationData.createById,
              editById: transportLocationData.editById,
            }
            setExistingTransportLocation(validTransportLocationData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingTransportLocation = () => {
    if (existingTransportLocation) {
      setModalMode("edit")
      setSelectedTransportLocation(existingTransportLocation)
      setShowLoadDialog(false)
      setExistingTransportLocation(null)
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
            Transport Locations
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage transport location information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search transport locations..."
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
      ) : transportLocationsResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <TransportLocationsTable
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
        <TransportLocationsTable
          data={transportLocationsData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewTransportLocation : undefined}
          onDeleteAction={canDelete ? handleDeleteTransportLocation : undefined}
          onEditAction={canEdit ? handleEditTransportLocation : undefined}
          onCreateAction={canCreate ? handleCreateTransportLocation : undefined}
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
              {modalMode === "create" && "Create Transport Location"}
              {modalMode === "edit" && "Update Transport Location"}
              {modalMode === "view" && "View Transport Location"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new transport location to the system database."
                : modalMode === "edit"
                  ? "Update transport location information in the system database."
                  : "View transport location details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TransportLocationForm
            initialData={
              modalMode === "edit" || modalMode === "view" ? selectedTransportLocation : null
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
        onLoad={handleLoadExistingTransportLocation}
        onCancelAction={() => setExistingTransportLocation(null)}
        code={existingTransportLocation?.transportLocationCode}
        name={existingTransportLocation?.transportLocationName}
        typeLabel="Transport Location"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Transport Location"
        description="This action cannot be undone. This will permanently delete the transport location from our servers."
        itemName={deleteConfirmation.transportLocationName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            transportLocationId: null,
            transportLocationName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={modalMode === "create" ? "Create Transport Location" : "Update Transport Location"}
        itemName={saveConfirmation.data?.transportLocationName || ""}
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

