"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ITallyService, ITallyServiceFilter } from "@/interfaces"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { TallyService } from "@/lib/api-routes"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import {
  useDelete,
  useGetById,
  useGetWithPagination,
  usePersist,
} from "@/hooks/use-common"
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
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { TallyServiceForm } from "./tally-service-form"
import { TallyServiceTable } from "./tally-service-table"

function createEmptyTallyService(companyId: number): ITallyService {
  return {
    companyId,
    tallyServiceId: 0,
    date: "",
    serviceDate: "",
    accountDate: "",
    chargeId: 0,
    bargeId: 0,
    uomId: 0,
    quantity: 1,
    receiptNo: "",
    ameTally: "",
    boatopTally: "",
    boatOperator: "",
    operatorName: "",
    supplyBarge: "",
    distance: 0,
    waitingTime: 0,
    timeDiff: 0,
    deliveredWeight: 0,
    landedWeight: 0,
    annexure: "",
    invoiceId: 0,
    invoiceNo: "",
    poNo: "",
    isPost: false,
    taskStatusId: 1,
    remarks: "",
    createById: 0,
    createDate: new Date(),
    editById: 0,
    editDate: new Date(),
    createBy: "",
    editBy: "",
    editVersion: 0,
  }
}

function extractRows<T>(data: T | T[] | T[][] | null | undefined): T[] {
  if (!data) return []
  if (!Array.isArray(data)) return [data]
  if (data.length > 0 && Array.isArray(data[0])) {
    return (data as T[][]).flat()
  }
  return data as T[]
}

function normalizeTallyService(
  item: Partial<ITallyService> | undefined,
  companyId: number
): ITallyService | undefined {
  if (!item) return undefined

  const base = createEmptyTallyService(companyId)
  const serviceDate = item.date ?? item.serviceDate ?? base.date
  const accountDate = item.accountDate ?? serviceDate

  return {
    ...base,
    ...item,
    companyId: item.companyId ?? companyId,
    tallyServiceId: item.tallyServiceId ?? 0,
    date: serviceDate,
    serviceDate: serviceDate,
    accountDate,
    chargeId: item.chargeId ?? 0,
    bargeId: item.bargeId ?? 0,
    uomId: item.uomId ?? 0,
    quantity: item.quantity ?? base.quantity,
    invoiceId: item.invoiceId ?? base.invoiceId,
    isPost: item.isPost ?? base.isPost,
    taskStatusId: item.taskStatusId ?? base.taskStatusId,
    createById: item.createById ?? base.createById,
    createDate: item.createDate ?? base.createDate,
    editVersion: item.editVersion ?? base.editVersion,
  }
}

export function TallyServicePage() {
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.tallyService

  const params = useParams()
  const companyId = Number(params?.companyId) || 0
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const { defaults } = useUserSettingDefaults()
  const [filters, setFilters] = useState<ITallyServiceFilter>({})
  const [isLocked, setIsLocked] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )
  const [selectedTallyServiceId, setSelectedTallyServiceId] = useState<
    string | undefined
  >(undefined)
  const [selectedSnapshot, setSelectedSnapshot] = useState<
    ITallyService | undefined
  >(undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    item: ITallyService | null
  }>({
    isOpen: false,
    item: null,
  })
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: ITallyService | null
  }>({
    isOpen: false,
    data: null,
  })

  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  const {
    data: tallyServicesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ITallyService>(
    TallyService.get,
    "tallyServices",
    filters.search,
    currentPage,
    pageSize
  )

  useEffect(() => {
    if (!tallyServicesResponse) return

    if (tallyServicesResponse.result === -1) {
      setFilters({})
    } else if (tallyServicesResponse.result === -2 && !isLocked) {
      setIsLocked(true)
    } else if (tallyServicesResponse.result !== -2) {
      setIsLocked(false)
    }
  }, [isLocked, tallyServicesResponse])

  const listData = useMemo(() => {
    const rows = extractRows(tallyServicesResponse?.data)
    return rows
      .map((item) => normalizeTallyService(item, companyId))
      .filter((item): item is ITallyService => !!item)
  }, [companyId, tallyServicesResponse?.data])

  const totalRecords = tallyServicesResponse?.totalRecords || listData.length

  const {
    data: tallyServiceByIdResponse,
    isLoading: isLoadingTallyServiceById,
  } = useGetById<ITallyService>(
    TallyService.getById,
    "tallyService",
    selectedTallyServiceId || "",
    {
      enabled:
        !!selectedTallyServiceId &&
        isModalOpen &&
        (modalMode === "edit" || modalMode === "view"),
    }
  )

  const selectedTallyService = useMemo(() => {
    const details = extractRows(tallyServiceByIdResponse?.data)
    return normalizeTallyService(details[0] || selectedSnapshot, companyId)
  }, [companyId, selectedSnapshot, tallyServiceByIdResponse?.data])

  const saveMutation = usePersist<ITallyService>(TallyService.add)
  const updateMutation = usePersist<ITallyService>(TallyService.add)
  const deleteMutation = useDelete(TallyService.delete)

  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as ITallyServiceFilter)
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

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const resetModalState = useCallback(() => {
    setIsModalOpen(false)
    setSelectedTallyServiceId(undefined)
    setSelectedSnapshot(undefined)
    setModalMode("create")
  }, [])

  const handleCreate = () => {
    setModalMode("create")
    setSelectedTallyServiceId(undefined)
    setSelectedSnapshot(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (item: ITallyService) => {
    setModalMode("edit")
    setSelectedTallyServiceId(item.tallyServiceId.toString())
    setSelectedSnapshot(item)
    setIsModalOpen(true)
  }

  const handleView = (item: ITallyService | null) => {
    if (!item) return
    setModalMode("view")
    setSelectedTallyServiceId(item.tallyServiceId.toString())
    setSelectedSnapshot(item)
    setIsModalOpen(true)
  }

  const handleDeleteRequest = (item: ITallyService) => {
    setDeleteConfirmation({
      isOpen: true,
      item,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.item) return

    await deleteMutation.mutateAsync(
      deleteConfirmation.item.tallyServiceId.toString()
    )
    await queryClient.invalidateQueries({ queryKey: ["tallyServices"] })
    setDeleteConfirmation({ isOpen: false, item: null })
  }

  const handleSaveRequest = (data: ITallyService) => {
    setSaveConfirmation({
      isOpen: true,
      data,
    })
  }

  const handleSaveConfirm = async () => {
    if (!saveConfirmation.data) return

    const payload = saveConfirmation.data

    if (modalMode === "create") {
      await saveMutation.mutateAsync(payload)
    } else {
      await updateMutation.mutateAsync(payload)
    }

    await queryClient.invalidateQueries({ queryKey: ["tallyServices"] })
    await queryClient.invalidateQueries({ queryKey: ["tallyService"] })
    setSaveConfirmation({ isOpen: false, data: null })
    resetModalState()
  }

  const modalTitle =
    modalMode === "create"
      ? "Add Tally Service"
      : modalMode === "edit"
        ? "Edit Tally Service"
        : "Tally Service Details"

  const modalDescription =
    modalMode === "create"
      ? "Create a new tally service transaction."
      : modalMode === "edit"
        ? "Update the selected tally service transaction."
        : "Review the selected tally service transaction."

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Tally Service
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage standalone tally service records and related service timings.
          </p>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={8}
          filterCount={2}
          cellWidths={[
            "10rem",
            "10rem",
            "14rem",
            "10rem",
            "8rem",
            "10rem",
            "10rem",
            "10rem",
          ]}
          shrinkZero
        />
      ) : tallyServicesResponse?.result === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <TallyServiceTable
            data={[]}
            isLoading={false}
            totalRecords={0}
            onSelect={() => {}}
            onDeleteAction={() => {}}
            onEditAction={() => {}}
            onCreateAction={() => {}}
            onRefreshAction={() => {}}
            onFilterChange={() => {}}
            moduleId={moduleId}
            transactionId={transactionId}
            canView={false}
            canCreate={false}
            canEdit={false}
            canDelete={false}
          />
        </LockSkeleton>
      ) : (
        <TallyServiceTable
          data={listData}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleView : undefined}
          onDeleteAction={canDelete ? handleDeleteRequest : undefined}
          onEditAction={canEdit ? handleEdit : undefined}
          onCreateAction={canCreate ? handleCreate : undefined}
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
          canView={canView}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetModalState()
            return
          }
          setIsModalOpen(true)
        }}
      >
        <DialogContent
          className="max-h-[85vh] overflow-x-hidden overflow-y-auto"
          style={{ width: "80vw", maxWidth: "1400px" }}
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDescription}</DialogDescription>
          </DialogHeader>
          <Separator />
          {isLoadingTallyServiceById && modalMode !== "create" ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading tally service details...</p>
            </div>
          ) : (
            <TallyServiceForm
              companyId={companyId}
              initialData={
                modalMode === "create" ? undefined : selectedTallyService
              }
              mode={modalMode}
              submitAction={handleSaveRequest}
              onCancelAction={resetModalState}
              isSubmitting={saveMutation.isPending || updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Tally Service"
        itemName={
          deleteConfirmation.item?.receiptNo ||
          deleteConfirmation.item?.chargeName ||
          (deleteConfirmation.item
            ? `Tally Service #${deleteConfirmation.item.tallyServiceId}`
            : "")
        }
        description="This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancelAction={() =>
          setDeleteConfirmation({ isOpen: false, item: null })
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
            ? "Create Tally Service"
            : "Update Tally Service"
        }
        itemName={
          saveConfirmation.data?.receiptNo ||
          saveConfirmation.data?.chargeName ||
          "this tally service"
        }
        operationType={modalMode === "create" ? "create" : "update"}
        onConfirm={handleSaveConfirm}
        onCancelAction={() =>
          setSaveConfirmation({ isOpen: false, data: null })
        }
        isSaving={saveMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
