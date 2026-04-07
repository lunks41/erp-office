"use client"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IJobStatus, IJobStatusFilter } from "@/interfaces/job-status"
import { JobStatusSchemaType } from "@/schemas/job-status"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { JobStatus } from "@/lib/api-routes"
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

import { JobStatusForm } from "./components/job-status-form"
import { JobStatusesTable } from "./components/job-status-table"

export default function JobStatusPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.jobStatus

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<IJobStatusFilter>({})

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
      setFilters(newFilters as IJobStatusFilter)
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
    data: jobStatusesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<IJobStatus>(
    `${JobStatus.get}`,
    "jobStatuses",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: jobStatusesResult,
    data: jobStatusesData,
    totalRecords,
  } = (jobStatusesResponse as ApiResponse<IJobStatus>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<JobStatusSchemaType>(`${JobStatus.add}`)
  const updateMutation = usePersist<JobStatusSchemaType>(`${JobStatus.add}`)
  const deleteMutation = useDelete(`${JobStatus.delete}`)

  const [selectedJobStatus, setSelectedJobStatus] = useState<IJobStatus | null>(
    null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingJobStatus, setExistingJobStatus] = useState<IJobStatus | null>(
    null
  )

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    jobStatusId: string | null
    jobStatusName: string | null
  }>({
    isOpen: false,
    jobStatusId: null,
    jobStatusName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: JobStatusSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateJobStatus = () => {
    setModalMode("create")
    setSelectedJobStatus(null)
    setIsModalOpen(true)
  }

  const handleEditJobStatus = (jobStatus: IJobStatus) => {
    setModalMode("edit")
    setSelectedJobStatus(jobStatus)
    setIsModalOpen(true)
  }

  const handleViewJobStatus = (jobStatus: IJobStatus | null) => {
    if (!jobStatus) return
    setModalMode("view")
    setSelectedJobStatus(jobStatus)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: JobStatusSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: JobStatusSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["jobStatuses"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedJobStatus) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["jobStatuses"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteJobStatus = (jobStatusId: string) => {
    const jobStatusToDelete = jobStatusesData?.find(
      (b) => b.jobStatusId.toString() === jobStatusId
    )
    if (!jobStatusToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      jobStatusId,
      jobStatusName: jobStatusToDelete.jobStatusName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.jobStatusId) {
      deleteMutation.mutateAsync(deleteConfirmation.jobStatusId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["jobStatuses"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        jobStatusId: null,
        jobStatusName: null,
      })
    }
  }

  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${JobStatus.getByCode}/${trimmedCode}`)
        if (response?.result === 1 && response.data) {
          const jobStatusData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (jobStatusData) {
            const validJobStatusData: IJobStatus = {
              jobStatusId: jobStatusData.jobStatusId,
              jobStatusCode: jobStatusData.jobStatusCode,
              jobStatusName: jobStatusData.jobStatusName,
              seqNo: jobStatusData.seqNo || 0,
              companyId: jobStatusData.companyId,
              remarks: jobStatusData.remarks || "",
              isActive: jobStatusData.isActive ?? true,
              createBy: jobStatusData.createBy,
              editBy: jobStatusData.editBy,
              createDate: jobStatusData.createDate,
              editDate: jobStatusData.editDate,
              createById: jobStatusData.createById,
              editById: jobStatusData.editById,
            }
            setExistingJobStatus(validJobStatusData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingJobStatus = () => {
    if (existingJobStatus) {
      setModalMode("edit")
      setSelectedJobStatus(existingJobStatus)
      setShowLoadDialog(false)
      setExistingJobStatus(null)
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Job Statuses
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage job status information and settings
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
      ) : jobStatusesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <JobStatusesTable
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
        <JobStatusesTable
          data={jobStatusesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewJobStatus : undefined}
          onDeleteAction={canDelete ? handleDeleteJobStatus : undefined}
          onEditAction={canEdit ? handleEditJobStatus : undefined}
          onCreateAction={canCreate ? handleCreateJobStatus : undefined}
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
              {modalMode === "create" && "Create Job Status"}
              {modalMode === "edit" && "Update Job Status"}
              {modalMode === "view" && "View Job Status"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new job status to the system database."
                : modalMode === "edit"
                  ? "Update job status information in the system database."
                  : "View job status details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <JobStatusForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedJobStatus
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
        onLoad={handleLoadExistingJobStatus}
        onCancelAction={() => setExistingJobStatus(null)}
        code={existingJobStatus?.jobStatusCode}
        name={existingJobStatus?.jobStatusName}
        typeLabel="Job Status"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Job Status"
        description="This action cannot be undone. This will permanently delete the job status from our servers."
        itemName={deleteConfirmation.jobStatusName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            jobStatusId: null,
            jobStatusName: null,
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
          modalMode === "create" ? "Create Job Status" : "Update Job Status"
        }
        itemName={saveConfirmation.data?.jobStatusName || ""}
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
