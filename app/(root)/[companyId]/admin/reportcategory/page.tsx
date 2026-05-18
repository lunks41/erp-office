"use client"

import { useCallback, useMemo, useState } from "react"
import { IReportCategory } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { ReportCategorySchemaType } from "@/schemas/admin"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { ReportCategoryMaster } from "@/lib/api-routes"
import { AdminTransactionId, ModuleId } from "@/lib/utils"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { ReportCategoryForm } from "./components/report-category-form"
import { ReportCategoryTable } from "./components/report-category-table"

export default function AdminReportCategoryPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.reportcategory

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [categoryFilters, setCategoryFilters] = useState<{ search?: string }>(
    {}
  )

  const {
    data: listResponse,
    refetch: refetchList,
    isLoading: isLoadingList,
  } = useGet<IReportCategory>(
    ReportCategoryMaster.get,
    "admreportcategories",
    categoryFilters.search
  )

  const { data: listRaw } =
    (listResponse as ApiResponse<IReportCategory>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const gridData: IReportCategory[] = useMemo(
    () => (Array.isArray(listRaw) ? listRaw : []),
    [listRaw]
  )

  const saveMutation = usePersist(ReportCategoryMaster.add)
  const deleteMutation = useDelete(ReportCategoryMaster.delete)

  const [selectedRow, setSelectedRow] = useState<IReportCategory | undefined>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    id: string | null
    name: string | null
  }>({ isOpen: false, id: null, name: null })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: ReportCategorySchemaType | null
  }>({ isOpen: false, data: null })

  const handleCreate = useCallback(() => {
    setModalMode("create")
    setSelectedRow(undefined)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback((row: IReportCategory) => {
    setModalMode("edit")
    setSelectedRow(row)
    setIsModalOpen(true)
  }, [])

  const handleView = useCallback((row: IReportCategory | null) => {
    if (!row) return
    setModalMode("view")
    setSelectedRow(row)
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    const row = gridData.find((r) => String(r.repCategoryId) === id)
    setDeleteConfirmation({
      isOpen: true,
      id,
      name: row?.repCategoryName ?? id,
    })
  }, [gridData])

  const handleConfirmDelete = () => {
    if (!deleteConfirmation.id) return
    void deleteMutation.mutateAsync(deleteConfirmation.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ["admreportcategories"] })
    })
    setDeleteConfirmation({ isOpen: false, id: null, name: null })
  }

  const handleFormSubmit = async (data: ReportCategorySchemaType) => {
    try {
      const response = await saveMutation.mutateAsync(data)
      if (response.result === 1) {
        queryClient.invalidateQueries({ queryKey: ["admreportcategories"] })
        setIsModalOpen(false)
      }
    } catch {
      /* toast via usePersist */
    }
  }

  const handleSaveConfirmationOpen = (data: ReportCategorySchemaType) => {
    setSaveConfirmation({ isOpen: true, data })
  }

  const handleConfirmedSubmit = async (data: ReportCategorySchemaType) => {
    try {
      const response = await saveMutation.mutateAsync(data)
      if (response.result === 1) {
        queryClient.invalidateQueries({ queryKey: ["admreportcategories"] })
        setIsModalOpen(false)
      }
    } catch {
      /* toast via usePersist */
    }
    setSaveConfirmation({ isOpen: false, data: null })
  }

  return (
    <div className="@container mx-auto space-y-3 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          Report categories
        </h1>
        <p className="text-muted-foreground text-sm">
          Maintain report category codes used by the report catalog.
        </p>
      </div>
      <Separator />

      {isLoadingList ? (
        <DataTableSkeleton columnCount={8} rowCount={8} />
      ) : (
        <ReportCategoryTable
          data={gridData}
          isLoading={isLoadingList}
          onSelect={canView ? handleView : undefined}
          onDeleteAction={canDelete ? handleDelete : undefined}
          onEditAction={canEdit ? handleEdit : undefined}
          onCreateAction={canCreate ? handleCreate : undefined}
          onRefreshAction={() => refetchList()}
          onFilterChange={(f) =>
            setCategoryFilters({ search: f.search ?? undefined })
          }
          moduleId={moduleId}
          transactionId={transactionId}
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create"
                ? "New report category"
                : modalMode === "edit"
                  ? "Edit report category"
                  : "View report category"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Report category details
            </DialogDescription>
          </DialogHeader>
          <ReportCategoryForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedRow
                : undefined
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending}
            isReadOnly={modalMode === "view"}
            onSaveConfirmation={handleSaveConfirmationOpen}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(o) =>
          setDeleteConfirmation((p) => ({ ...p, isOpen: o }))
        }
        title="Delete report category"
        itemName={deleteConfirmation.name || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({ isOpen: false, id: null, name: null })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        title={
          modalMode === "create"
            ? "Create report category"
            : "Update report category"
        }
        itemName={saveConfirmation.data?.repCategoryName || ""}
        open={saveConfirmation.isOpen}
        onOpenChange={(o) =>
          setSaveConfirmation((p) => ({ ...p, isOpen: o }))
        }
        onConfirm={() => {
          if (saveConfirmation.data)
            void handleConfirmedSubmit(saveConfirmation.data)
        }}
        onCancelAction={() =>
          setSaveConfirmation({ isOpen: false, data: null })
        }
        isSaving={saveMutation.isPending}
        operationType={modalMode === "create" ? "create" : "update"}
      />
    </div>
  )
}
