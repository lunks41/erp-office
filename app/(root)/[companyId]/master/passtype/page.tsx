"use client"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IPassType, IPassTypeFilter } from "@/interfaces/pass-type"
import { PassTypeSchemaType } from "@/schemas/pass-type"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { PassType } from "@/lib/api-routes"
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
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { LoadConfirmation } from "@/components/confirmation/load-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { PassTypeForm } from "./components/pass-type-form"
import { PassTypesTable } from "./components/pass-type-table"

export default function PassTypePage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.passType

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IPassTypeFilter>({})

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
      setFilters(newFilters as IPassTypeFilter)
      setCurrentPage(1)
    },
    []
  )

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])
  const {
    data: passTypesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IPassType>(
    `${PassType.get}`,
    "passTypes",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: passTypesResult,
    data: passTypesData,
    totalRecords,
  } = (passTypesResponse as ApiResponse<IPassType>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<PassTypeSchemaType>(`${PassType.add}`)
  const updateMutation = usePersist<PassTypeSchemaType>(`${PassType.add}`)
  const deleteMutation = useDelete(`${PassType.delete}`)

  const [selectedPassType, setSelectedPassType] = useState<IPassType | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingPassType, setExistingPassType] = useState<IPassType | null>(
    null
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    passTypeId: string | null
    passTypeName: string | null
  }>({
    isOpen: false,
    passTypeId: null,
    passTypeName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: PassTypeSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreatePassType = () => {
    setModalMode("create")
    setSelectedPassType(null)
    setIsModalOpen(true)
  }

  const handleEditPassType = (passType: IPassType) => {
    setModalMode("edit")
    setSelectedPassType(passType)
    setIsModalOpen(true)
  }

  const handleViewPassType = (passType: IPassType | null) => {
    if (!passType) return
    setModalMode("view")
    setSelectedPassType(passType)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: PassTypeSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: PassTypeSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["passTypes"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedPassType) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["passTypes"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeletePassType = (passTypeId: string) => {
    const passTypeToDelete = passTypesData?.find(
      (b) => b.passTypeId.toString() === passTypeId
    )
    if (!passTypeToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      passTypeId,
      passTypeName: passTypeToDelete.passTypeName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.passTypeId) {
      deleteMutation.mutateAsync(deleteConfirmation.passTypeId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["passTypes"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        passTypeId: null,
        passTypeName: null,
      })
    }
  }

  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${PassType.getByCode}/${trimmedCode}`)
        if (response?.result === 1 && response.data) {
          const passTypeData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (passTypeData) {
            const validPassTypeData: IPassType = {
              passTypeId: passTypeData.passTypeId,
              passTypeCode: passTypeData.passTypeCode,
              passTypeName: passTypeData.passTypeName,
              seqNo: passTypeData.seqNo || 0,
              companyId: passTypeData.companyId,
              remarks: passTypeData.remarks || "",
              isActive: passTypeData.isActive ?? true,
              createBy: passTypeData.createBy,
              editBy: passTypeData.editBy,
              createDate: passTypeData.createDate,
              editDate: passTypeData.editDate,
              createById: passTypeData.createById,
              editById: passTypeData.editById,
            }
            setExistingPassType(validPassTypeData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingPassType = () => {
    if (existingPassType) {
      setModalMode("edit")
      setSelectedPassType(existingPassType)
      setShowLoadDialog(false)
      setExistingPassType(null)
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
            Pass Types
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage pass type information and settings
          </p>
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
      ) : passTypesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <PassTypesTable
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
        <PassTypesTable
          data={passTypesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewPassType : undefined}
          onDeleteAction={canDelete ? handleDeletePassType : undefined}
          onEditAction={canEdit ? handleEditPassType : undefined}
          onCreateAction={canCreate ? handleCreatePassType : undefined}
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
              {modalMode === "create" && "Create Pass Type"}
              {modalMode === "edit" && "Update Pass Type"}
              {modalMode === "view" && "View Pass Type"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new pass type to the system database."
                : modalMode === "edit"
                  ? "Update pass type information in the system database."
                  : "View pass type details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <PassTypeForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedPassType
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
        onLoad={handleLoadExistingPassType}
        onCancelAction={() => setExistingPassType(null)}
        code={existingPassType?.passTypeCode}
        name={existingPassType?.passTypeName}
        typeLabel="Pass Type"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Pass Type"
        description="This action cannot be undone. This will permanently delete the pass type from our servers."
        itemName={deleteConfirmation.passTypeName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            passTypeId: null,
            passTypeName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={modalMode === "create" ? "Create Pass Type" : "Update Pass Type"}
        itemName={saveConfirmation.data?.passTypeName || ""}
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
