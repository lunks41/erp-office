"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ICarrier, ICarrierFilter } from "@/interfaces/carrier"
import { CarrierSchemaType } from "@/schemas/carrier"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { Carrier } from "@/lib/api-routes"
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

import { CarrierForm } from "./components/carrier-form"
import { CarriersTable } from "./components/carrier-table"

export default function CarrierPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.carrier

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ICarrierFilter>({})
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
      setFilters(newFilters as ICarrierFilter)
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
    data: carriersResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ICarrier>(
    `${Carrier.get}`,
    "carriers",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: carriersResult,
    data: carriersData,
    totalRecords,
  } = (carriersResponse as ApiResponse<ICarrier>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<CarrierSchemaType>(`${Carrier.add}`)
  const updateMutation = usePersist<CarrierSchemaType>(`${Carrier.add}`)
  const deleteMutation = useDelete(`${Carrier.delete}`)

  const [selectedCarrier, setSelectedCarrier] = useState<ICarrier | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingCarrier, setExistingCarrier] = useState<ICarrier | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    carrierId: string | null
    carrierName: string | null
  }>({
    isOpen: false,
    carrierId: null,
    carrierName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: CarrierSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateCarrier = () => {
    setModalMode("create")
    setSelectedCarrier(null)
    setIsModalOpen(true)
  }

  const handleEditCarrier = (carrier: ICarrier) => {
    setModalMode("edit")
    setSelectedCarrier(carrier)
    setIsModalOpen(true)
  }

  const handleViewCarrier = (carrier: ICarrier | null) => {
    if (!carrier) return
    setModalMode("view")
    setSelectedCarrier(carrier)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: CarrierSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: CarrierSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["carriers"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedCarrier) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["carriers"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteCarrier = (carrierId: string) => {
    const carrierToDelete = carriersData?.find(
      (b) => b.carrierId.toString() === carrierId
    )
    if (!carrierToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      carrierId,
      carrierName: carrierToDelete.carrierName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.carrierId) {
      deleteMutation.mutateAsync(deleteConfirmation.carrierId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["carriers"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        carrierId: null,
        carrierName: null,
      })
    }
  }

  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${Carrier.getByCode}/${trimmedCode}`)
        if (response?.result === 1 && response.data) {
          const carrierData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (carrierData) {
            const validCarrierData: ICarrier = {
              carrierId: carrierData.carrierId,
              carrierCode: carrierData.carrierCode,
              carrierName: carrierData.carrierName,
              seqNo: carrierData.seqNo || 0,
              companyId: carrierData.companyId,
              remarks: carrierData.remarks || "",
              isActive: carrierData.isActive ?? true,
              createBy: carrierData.createBy,
              editBy: carrierData.editBy,
              createDate: carrierData.createDate,
              editDate: carrierData.editDate,
              createById: carrierData.createById,
              editById: carrierData.editById,
            }
            setExistingCarrier(validCarrierData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingCarrier = () => {
    if (existingCarrier) {
      setModalMode("edit")
      setSelectedCarrier(existingCarrier)
      setShowLoadDialog(false)
      setExistingCarrier(null)
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
            Carriers
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage carrier information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search carriers..."
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
      ) : carriersResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <CarriersTable
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
        <CarriersTable
          data={carriersData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewCarrier : undefined}
          onDeleteAction={canDelete ? handleDeleteCarrier : undefined}
          onEditAction={canEdit ? handleEditCarrier : undefined}
          onCreateAction={canCreate ? handleCreateCarrier : undefined}
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
              {modalMode === "create" && "Create Carrier"}
              {modalMode === "edit" && "Update Carrier"}
              {modalMode === "view" && "View Carrier"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new carrier to the system database."
                : modalMode === "edit"
                  ? "Update carrier information in the system database."
                  : "View carrier details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <CarrierForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedCarrier
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
        onLoad={handleLoadExistingCarrier}
        onCancelAction={() => setExistingCarrier(null)}
        code={existingCarrier?.carrierCode}
        name={existingCarrier?.carrierName}
        typeLabel="Carrier"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Carrier"
        description="This action cannot be undone. This will permanently delete the carrier from our servers."
        itemName={deleteConfirmation.carrierName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            carrierId: null,
            carrierName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={modalMode === "create" ? "Create Carrier" : "Update Carrier"}
        itemName={saveConfirmation.data?.carrierName || ""}
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
