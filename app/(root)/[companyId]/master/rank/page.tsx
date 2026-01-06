"use client"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IRank, IRankFilter } from "@/interfaces/rank"
import { RankSchemaType } from "@/schemas/rank"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { Rank } from "@/lib/api-routes"
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

import { RankForm } from "./components/rank-form"
import { RanksTable } from "./components/rank-table"

export default function RankPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.rank

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IRankFilter>({})

  // Get user setting defaults
  const { defaults } = useUserSettingDefaults()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when defaults change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // Filter handler wrapper
  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as IRankFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])
  const {
    data: ranksResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IRank>(
    `${Rank.get}`,
    "ranks",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: ranksResult,
    data: ranksData,
    totalRecords,
  } = (ranksResponse as ApiResponse<IRank>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<RankSchemaType>(`${Rank.add}`)
  const updateMutation = usePersist<RankSchemaType>(`${Rank.add}`)
  const deleteMutation = useDelete(`${Rank.delete}`)

  const [selectedRank, setSelectedRank] = useState<IRank | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingRank, setExistingRank] = useState<IRank | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    rankId: string | null
    rankName: string | null
  }>({
    isOpen: false,
    rankId: null,
    rankName: null,
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: RankSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateRank = () => {
    setModalMode("create")
    setSelectedRank(null)
    setIsModalOpen(true)
  }

  const handleEditRank = (rank: IRank) => {
    setModalMode("edit")
    setSelectedRank(rank)
    setIsModalOpen(true)
  }

  const handleViewRank = (rank: IRank | null) => {
    if (!rank) return
    setModalMode("view")
    setSelectedRank(rank)
    setIsModalOpen(true)
  }

  // Handler for form submission (create or edit) - shows confirmation first
  const handleFormSubmit = (data: RankSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  // Handler for confirmed form submission
  const handleConfirmedFormSubmit = async (data: RankSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["ranks"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedRank) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["ranks"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteRank = (rankId: string) => {
    const rankToDelete = ranksData?.find((b) => b.rankId.toString() === rankId)
    if (!rankToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      rankId,
      rankName: rankToDelete.rankName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.rankId) {
      deleteMutation.mutateAsync(deleteConfirmation.rankId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["ranks"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        rankId: null,
        rankName: null,
      })
    }
  }

  // Handler for code availability check
  const handleCodeBlur = useCallback(
    async (code: string) => {
      // Skip if:
      // 1. In edit mode
      // 2. In read-only mode
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${Rank.getByCode}/${trimmedCode}`)
        // Check if response has data and it's not empty
        if (response?.result === 1 && response.data) {
          // Handle both array and single object responses
          const rankData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (rankData) {
            // Ensure all required fields are present
            const validRankData: IRank = {
              rankId: rankData.rankId,
              rankCode: rankData.rankCode,
              rankName: rankData.rankName,
              seqNo: rankData.seqNo || 0,
              companyId: rankData.companyId,
              remarks: rankData.remarks || "",
              isActive: rankData.isActive ?? true,
              createBy: rankData.createBy,
              editBy: rankData.editBy,
              createDate: rankData.createDate,
              editDate: rankData.editDate,
              createById: rankData.createById,
              editById: rankData.editById,
            }
            setExistingRank(validRankData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  // Handler for loading existing rank
  const handleLoadExistingRank = () => {
    if (existingRank) {
      // Log the data we're about to set
      // Set the states
      setModalMode("edit")
      setSelectedRank(existingRank)
      setShowLoadDialog(false)
      setExistingRank(null)
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Ranks
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage rank information and settings
          </p>
        </div>
      </div>

      {/* Ranks Table */}
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
      ) : ranksResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <RanksTable
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
        <RanksTable
          data={ranksData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewRank : undefined}
          onDeleteAction={canDelete ? handleDeleteRank : undefined}
          onEditAction={canEdit ? handleEditRank : undefined}
          onCreateAction={canCreate ? handleCreateRank : undefined}
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
          // Pass permissions to table
          canEdit={canEdit}
          canDelete={canDelete}
          canView={canView}
          canCreate={canCreate}
        />
      )}

      {/* Modal for Create, Edit, and View */}
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
              {modalMode === "create" && "Create Rank"}
              {modalMode === "edit" && "Update Rank"}
              {modalMode === "view" && "View Rank"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new rank to the system database."
                : modalMode === "edit"
                  ? "Update rank information in the system database."
                  : "View rank details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <RankForm
            initialData={
              modalMode === "edit" || modalMode === "view" ? selectedRank : null
            }
            submitAction={handleFormSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isReadOnly={modalMode === "view"}
            onCodeBlur={handleCodeBlur}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Rank Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingRank}
        onCancelAction={() => setExistingRank(null)}
        code={existingRank?.rankCode}
        name={existingRank?.rankName}
        typeLabel="Rank"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Rank"
        description="This action cannot be undone. This will permanently delete the rank from our servers."
        itemName={deleteConfirmation.rankName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            rankId: null,
            rankName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title={modalMode === "create" ? "Create Rank" : "Update Rank"}
        itemName={saveConfirmation.data?.rankName || ""}
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
