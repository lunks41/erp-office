"use client"

import { useCallback, useMemo, useState } from "react"
import {
  IReportCatalog,
  IReportCatalogGridRow,
} from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { ReportCatalogSaveSchemaType } from "@/schemas/admin"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { ReportCatalog as ReportCatalogRoutes } from "@/lib/api-routes"
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

import { ReportCatalogForm } from "./components/report-catalog-form"
import { ReportCatalogTable } from "./components/report-catalog-table"

function toGridRow(r: IReportCatalog): IReportCatalogGridRow {
  const companyId = r.companyId ?? 0
  const moduleId = r.moduleId ?? 0
  const reportId = r.reportId ?? 0
  const itemNo = r.itemNo ?? 0
  return {
    ...r,
    catalogRowKey: `${companyId}-${moduleId}-${reportId}-${itemNo}`,
  }
}

export default function AdminReportsCatalogPage() {
  const moduleId = ModuleId.admin
  const transactionId = AdminTransactionId.reports

  const { hasPermission } = usePermissionStore()
  const queryClient = useQueryClient()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [filters, setFilters] = useState<{ search?: string }>({})

  const {
    data: listResponse,
    refetch: refetchList,
    isLoading: isLoadingList,
  } = useGet<IReportCatalog>(
    ReportCatalogRoutes.get,
    "admreports",
    filters.search
  )

  const { data: listRaw } =
    (listResponse as ApiResponse<IReportCatalog>) ?? {
      result: 0,
      message: "",
      data: [],
    }

  const gridData: IReportCatalogGridRow[] = useMemo(
    () => (listRaw ?? []).map(toGridRow),
    [listRaw]
  )

  const saveMutation = usePersist(ReportCatalogRoutes.add)
  const deleteMutation = useDelete(ReportCatalogRoutes.delete)

  const [selectedRow, setSelectedRow] = useState<
    IReportCatalogGridRow | undefined
  >()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    deletePath: string | null
    name: string | null
  }>({ isOpen: false, deletePath: null, name: null })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: ReportCatalogSaveSchemaType | null
  }>({ isOpen: false, data: null })

  const handleCreate = useCallback(() => {
    setModalMode("create")
    setSelectedRow(undefined)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback((row: IReportCatalogGridRow) => {
    setModalMode("edit")
    setSelectedRow(row)
    setIsModalOpen(true)
  }, [])

  const handleView = useCallback((row: IReportCatalogGridRow | null) => {
    if (!row) return
    setModalMode("view")
    setSelectedRow(row)
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback(
    (catalogRowKey: string) => {
      const row = gridData.find((r) => r.catalogRowKey === catalogRowKey)
      if (!row) return
      const deletePath = `${row.moduleId}/${row.reportId}/${row.itemNo}`
      setDeleteConfirmation({
        isOpen: true,
        deletePath,
        name: row.reportName ?? deletePath,
      })
    },
    [gridData]
  )

  const handleConfirmDelete = () => {
    if (!deleteConfirmation.deletePath) return
    void deleteMutation
      .mutateAsync(deleteConfirmation.deletePath)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["admreports"] })
      })
    setDeleteConfirmation({
      isOpen: false,
      deletePath: null,
      name: null,
    })
  }

  const handleFormSubmit = async (data: ReportCatalogSaveSchemaType) => {
    try {
      const response = await saveMutation.mutateAsync(data)
      if (response.result === 1) {
        queryClient.invalidateQueries({ queryKey: ["admreports"] })
        setIsModalOpen(false)
      }
    } catch {
      /* toast via usePersist */
    }
  }

  const handleSaveConfirmationOpen = (data: ReportCatalogSaveSchemaType) => {
    setSaveConfirmation({ isOpen: true, data })
  }

  const handleConfirmedSubmit = async (data: ReportCatalogSaveSchemaType) => {
    try {
      const response = await saveMutation.mutateAsync(data)
      if (response.result === 1) {
        queryClient.invalidateQueries({ queryKey: ["admreports"] })
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
          Report catalog
        </h1>
        <p className="text-muted-foreground text-sm">
          Register reports (AdmReports) for modules and transactions.
        </p>
      </div>
      <Separator />

      {isLoadingList ? (
        <DataTableSkeleton columnCount={12} rowCount={8} />
      ) : (
        <ReportCatalogTable
          data={gridData}
          isLoading={isLoadingList}
          onSelect={canView ? handleView : undefined}
          onDeleteAction={canDelete ? handleDelete : undefined}
          onEditAction={canEdit ? handleEdit : undefined}
          onCreateAction={canCreate ? handleCreate : undefined}
          onRefreshAction={() => refetchList()}
          onFilterChange={(f) =>
            setFilters({ search: f.search ?? undefined })
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create"
                ? "New report"
                : modalMode === "edit"
                  ? "Edit report"
                  : "View report"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Report catalog entry
            </DialogDescription>
          </DialogHeader>
          <ReportCatalogForm
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
        title="Delete report"
        itemName={deleteConfirmation.name || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            deletePath: null,
            name: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      <SaveConfirmation
        title={modalMode === "create" ? "Create report" : "Update report"}
        itemName={saveConfirmation.data?.reportName || ""}
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
