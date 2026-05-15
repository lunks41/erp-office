"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ITallyService, ITallyServiceFilter } from "@/interfaces"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { TallyService } from "@/lib/api-routes"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import { useDelete, useGetWithPagination } from "@/hooks/use-common"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

import { TallyServiceTable } from "./tally-service-table"
import {
  extractRows,
  normalizeTallyService,
  openTallyServiceTab,
} from "./tally-service-utils"

export function TallyServicePage() {
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.tallyService

  const params = useParams()
  const companyId = params.companyId as string
  const numericCompanyId = Number(companyId) || 0
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    item: ITallyService | null
  }>({
    isOpen: false,
    item: null,
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
      .map((item) => normalizeTallyService(item, numericCompanyId))
      .filter((item): item is ITallyService => !!item)
  }, [numericCompanyId, tallyServicesResponse?.data])

  const totalRecords = tallyServicesResponse?.totalRecords || listData.length
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

  const handleCreate = useCallback(() => {
    openTallyServiceTab(companyId)
  }, [companyId])

  const handleOpenRecord = useCallback(
    (item: ITallyService) => {
      openTallyServiceTab(companyId, item.tallyServiceId)
    },
    [companyId]
  )

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
            companyId={companyId}
            data={[]}
            isLoading={false}
            totalRecords={0}
            onOpenRecord={() => {}}
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
          companyId={companyId}
          data={listData}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onOpenRecord={canView ? handleOpenRecord : undefined}
          onDeleteAction={canDelete ? handleDeleteRequest : undefined}
          onEditAction={canEdit ? handleOpenRecord : undefined}
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
    </div>
  )
}
