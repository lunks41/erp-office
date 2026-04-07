"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  ILandingPurpose,
  ILandingPurposeFilter,
} from "@/interfaces/landing-purpose"
import { LandingPurposeSchemaType } from "@/schemas/landing-purpose"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { LandingPurpose } from "@/lib/api-routes"
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

import { LandingPurposeForm } from "./components/landing-purpose-form"
import { LandingPurposesTable } from "./components/landing-purpose-table"

export default function LandingPurposePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.landingPurpose

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ILandingPurposeFilter>({})
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
      setFilters(newFilters as ILandingPurposeFilter)
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
    data: landingPurposesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ILandingPurpose>(
    `${LandingPurpose.get}`,
    "landingPurposes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: landingPurposesResult,
    data: landingPurposesData,
    totalRecords,
  } = (landingPurposesResponse as ApiResponse<ILandingPurpose>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<LandingPurposeSchemaType>(
    `${LandingPurpose.add}`
  )
  const updateMutation = usePersist<LandingPurposeSchemaType>(
    `${LandingPurpose.add}`
  )
  const deleteMutation = useDelete(`${LandingPurpose.delete}`)

  const [selectedLandingPurpose, setSelectedLandingPurpose] =
    useState<ILandingPurpose | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingLandingPurpose, setExistingLandingPurpose] =
    useState<ILandingPurpose | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    landingPurposeId: string | null
    landingPurposeName: string | null
  }>({
    isOpen: false,
    landingPurposeId: null,
    landingPurposeName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: LandingPurposeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateLandingPurpose = () => {
    setModalMode("create")
    setSelectedLandingPurpose(null)
    setIsModalOpen(true)
  }

  const handleEditLandingPurpose = (landingPurpose: ILandingPurpose) => {
    setModalMode("edit")
    setSelectedLandingPurpose(landingPurpose)
    setIsModalOpen(true)
  }

  const handleViewLandingPurpose = (landingPurpose: ILandingPurpose | null) => {
    if (!landingPurpose) return
    setModalMode("view")
    setSelectedLandingPurpose(landingPurpose)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: LandingPurposeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: LandingPurposeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["landingPurposes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedLandingPurpose) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["landingPurposes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteLandingPurpose = (landingPurposeId: string) => {
    const landingPurposeToDelete = landingPurposesData?.find(
      (b) => b.landingPurposeId.toString() === landingPurposeId
    )
    if (!landingPurposeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      landingPurposeId,
      landingPurposeName: landingPurposeToDelete.landingPurposeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.landingPurposeId) {
      deleteMutation
        .mutateAsync(deleteConfirmation.landingPurposeId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["landingPurposes"] })
        })
      setDeleteConfirmation({
        isOpen: false,
        landingPurposeId: null,
        landingPurposeName: null,
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
          `${LandingPurpose.getByCode}/${trimmedCode}`
        )
        if (response?.result === 1 && response.data) {
          const landingPurposeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (landingPurposeData) {
            const validLandingPurposeData: ILandingPurpose = {
              landingPurposeId: landingPurposeData.landingPurposeId,
              landingPurposeCode: landingPurposeData.landingPurposeCode,
              landingPurposeName: landingPurposeData.landingPurposeName,
              seqNo: landingPurposeData.seqNo || 0,
              companyId: landingPurposeData.companyId,
              remarks: landingPurposeData.remarks || "",
              isActive: landingPurposeData.isActive ?? true,
              createBy: landingPurposeData.createBy,
              editBy: landingPurposeData.editBy,
              createDate: landingPurposeData.createDate,
              editDate: landingPurposeData.editDate,
              createById: landingPurposeData.createById,
              editById: landingPurposeData.editById,
            }
            setExistingLandingPurpose(validLandingPurposeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingLandingPurpose = () => {
    if (existingLandingPurpose) {
      setModalMode("edit")
      setSelectedLandingPurpose(existingLandingPurpose)
      setShowLoadDialog(false)
      setExistingLandingPurpose(null)
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
            Landing Purposes
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage landing purpose information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search landing purposes..."
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
      ) : landingPurposesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <LandingPurposesTable
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
        <LandingPurposesTable
          data={landingPurposesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewLandingPurpose : undefined}
          onDeleteAction={canDelete ? handleDeleteLandingPurpose : undefined}
          onEditAction={canEdit ? handleEditLandingPurpose : undefined}
          onCreateAction={canCreate ? handleCreateLandingPurpose : undefined}
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
              {modalMode === "create" && "Create Landing Purpose"}
              {modalMode === "edit" && "Update Landing Purpose"}
              {modalMode === "view" && "View Landing Purpose"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new landing purpose to the system database."
                : modalMode === "edit"
                  ? "Update landing purpose information in the system database."
                  : "View landing purpose details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <LandingPurposeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedLandingPurpose
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
        onLoad={handleLoadExistingLandingPurpose}
        onCancelAction={() => setExistingLandingPurpose(null)}
        code={existingLandingPurpose?.landingPurposeCode}
        name={existingLandingPurpose?.landingPurposeName}
        typeLabel="Landing Purpose"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Landing Purpose"
        description="This action cannot be undone. This will permanently delete the landing purpose from our servers."
        itemName={deleteConfirmation.landingPurposeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            landingPurposeId: null,
            landingPurposeName: null,
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
            ? "Create Landing Purpose"
            : "Update Landing Purpose"
        }
        itemName={saveConfirmation.data?.landingPurposeName || ""}
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
