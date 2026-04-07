"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ILandingType, ILandingTypeFilter } from "@/interfaces/landing-type"
import { LandingTypeSchemaType } from "@/schemas/landing-type"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { LandingType } from "@/lib/api-routes"
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

import { LandingTypeForm } from "./components/landing-type-form"
import { LandingTypesTable } from "./components/landing-type-table"

export default function LandingTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.landingType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ILandingTypeFilter>({})
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
      setFilters(newFilters as ILandingTypeFilter)
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
    data: landingTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ILandingType>(
    `${LandingType.get}`,
    "landingTypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: landingTypesResult,
    data: landingTypesData,
    totalRecords,
  } = (landingTypesResponse as ApiResponse<ILandingType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<LandingTypeSchemaType>(`${LandingType.add}`)
  const updateMutation = usePersist<LandingTypeSchemaType>(`${LandingType.add}`)
  const deleteMutation = useDelete(`${LandingType.delete}`)

  const [selectedLandingType, setSelectedLandingType] =
    useState<ILandingType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingLandingType, setExistingLandingType] =
    useState<ILandingType | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    landingTypeId: string | null
    landingTypeName: string | null
  }>({
    isOpen: false,
    landingTypeId: null,
    landingTypeName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: LandingTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateLandingType = () => {
    setModalMode("create")
    setSelectedLandingType(null)
    setIsModalOpen(true)
  }

  const handleEditLandingType = (landingType: ILandingType) => {
    setModalMode("edit")
    setSelectedLandingType(landingType)
    setIsModalOpen(true)
  }

  const handleViewLandingType = (landingType: ILandingType | null) => {
    if (!landingType) return
    setModalMode("view")
    setSelectedLandingType(landingType)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: LandingTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: LandingTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["landingTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedLandingType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["landingTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteLandingType = (landingTypeId: string) => {
    const landingTypeToDelete = landingTypesData?.find(
      (b) => b.landingTypeId.toString() === landingTypeId
    )
    if (!landingTypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      landingTypeId,
      landingTypeName: landingTypeToDelete.landingTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.landingTypeId) {
      deleteMutation.mutateAsync(deleteConfirmation.landingTypeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["landingTypes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        landingTypeId: null,
        landingTypeName: null,
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
          `${LandingType.getByCode}/${trimmedCode}`
        )
        if (response?.result === 1 && response.data) {
          const landingTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (landingTypeData) {
            const validLandingTypeData: ILandingType = {
              landingTypeId: landingTypeData.landingTypeId,
              landingTypeCode: landingTypeData.landingTypeCode,
              landingTypeName: landingTypeData.landingTypeName,
              seqNo: landingTypeData.seqNo || 0,
              companyId: landingTypeData.companyId,
              remarks: landingTypeData.remarks || "",
              isActive: landingTypeData.isActive ?? true,
              createBy: landingTypeData.createBy,
              editBy: landingTypeData.editBy,
              createDate: landingTypeData.createDate,
              editDate: landingTypeData.editDate,
              createById: landingTypeData.createById,
              editById: landingTypeData.editById,
            }
            setExistingLandingType(validLandingTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingLandingType = () => {
    if (existingLandingType) {
      setModalMode("edit")
      setSelectedLandingType(existingLandingType)
      setShowLoadDialog(false)
      setExistingLandingType(null)
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
            Landing Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage landing type information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search landing types..."
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
      ) : landingTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <LandingTypesTable
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
        <LandingTypesTable
          data={landingTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewLandingType : undefined}
          onDeleteAction={canDelete ? handleDeleteLandingType : undefined}
          onEditAction={canEdit ? handleEditLandingType : undefined}
          onCreateAction={canCreate ? handleCreateLandingType : undefined}
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
              {modalMode === "create" && "Create Landing Type"}
              {modalMode === "edit" && "Update Landing Type"}
              {modalMode === "view" && "View Landing Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new landing type to the system database."
                : modalMode === "edit"
                  ? "Update landing type information in the system database."
                  : "View landing type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <LandingTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedLandingType
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
        onLoad={handleLoadExistingLandingType}
        onCancelAction={() => setExistingLandingType(null)}
        code={existingLandingType?.landingTypeCode}
        name={existingLandingType?.landingTypeName}
        typeLabel="Landing Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Landing Type"
        description="This action cannot be undone. This will permanently delete the landing type from our servers."
        itemName={deleteConfirmation.landingTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            landingTypeId: null,
            landingTypeName: null,
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
          modalMode === "create" ? "Create Landing Type" : "Update Landing Type"
        }
        itemName={saveConfirmation.data?.landingTypeName || ""}
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
