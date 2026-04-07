"use client"

import { Search, X } from "lucide-react"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { ITaskStatus, ITaskStatusFilter } from "@/interfaces/task-status"
import { TaskStatusSchemaType } from "@/schemas/task-status"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getById } from "@/lib/api-client"
import { TaskStatus } from "@/lib/api-routes"
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

import { TaskStatusForm } from "./components/task-status-form"
import { TaskStatusesTable } from "./components/task-status-table"

export default function TaskStatusPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.taskStatus

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<ITaskStatusFilter>({})
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
      setFilters(newFilters as ITaskStatusFilter)
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
    data: taskStatusesResponse,
    refetch,
    isLoading,
  } = useGetWithPagination<ITaskStatus>(
    `${TaskStatus.get}`,
    "taskStatuses",
    filters.search,
    currentPage,
    pageSize
  )

  const {
    result: taskStatusesResult,
    data: taskStatusesData,
    totalRecords,
  } = (taskStatusesResponse as ApiResponse<ITaskStatus>) ?? {
    result: 0,
    message: "",
    data: [],
    totalRecords: 0,
  }

  const saveMutation = usePersist<TaskStatusSchemaType>(`${TaskStatus.add}`)
  const updateMutation = usePersist<TaskStatusSchemaType>(`${TaskStatus.add}`)
  const deleteMutation = useDelete(`${TaskStatus.delete}`)

  const [selectedTaskStatus, setSelectedTaskStatus] =
    useState<ITaskStatus | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )

  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingTaskStatus, setExistingTaskStatus] =
    useState<ITaskStatus | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    taskStatusId: string | null
    taskStatusName: string | null
  }>({
    isOpen: false,
    taskStatusId: null,
    taskStatusName: null,
  })

  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    data: TaskStatusSchemaType | null
  }>({
    isOpen: false,
    data: null,
  })

  const handleRefresh = () => {
    refetch()
  }

  const handleCreateTaskStatus = () => {
    setModalMode("create")
    setSelectedTaskStatus(null)
    setIsModalOpen(true)
  }

  const handleEditTaskStatus = (taskStatus: ITaskStatus) => {
    setModalMode("edit")
    setSelectedTaskStatus(taskStatus)
    setIsModalOpen(true)
  }

  const handleViewTaskStatus = (taskStatus: ITaskStatus | null) => {
    if (!taskStatus) return
    setModalMode("view")
    setSelectedTaskStatus(taskStatus)
    setIsModalOpen(true)
  }

  const handleFormSubmit = (data: TaskStatusSchemaType) => {
    setSaveConfirmation({
      isOpen: true,
      data: data,
    })
  }

  const handleConfirmedFormSubmit = async (data: TaskStatusSchemaType) => {
    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["taskStatuses"] })
          setIsModalOpen(false)
        }
      } else if (modalMode === "edit" && selectedTaskStatus) {
        const response = await updateMutation.mutateAsync(data)
        if (response.result === 1) {
          queryClient.invalidateQueries({ queryKey: ["taskStatuses"] })
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
    }
  }

  const handleDeleteTaskStatus = (taskStatusId: string) => {
    const taskStatusToDelete = taskStatusesData?.find(
      (b) => b.taskStatusId.toString() === taskStatusId
    )
    if (!taskStatusToDelete) return
    setDeleteConfirmation({
      isOpen: true,
      taskStatusId,
      taskStatusName: taskStatusToDelete.taskStatusName,
    })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.taskStatusId) {
      deleteMutation.mutateAsync(deleteConfirmation.taskStatusId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["taskStatuses"] })
      })
      setDeleteConfirmation({
        isOpen: false,
        taskStatusId: null,
        taskStatusName: null,
      })
    }
  }

  const handleCodeBlur = useCallback(
    async (code: string) => {
      if (modalMode === "edit" || modalMode === "view") return

      const trimmedCode = code?.trim()
      if (!trimmedCode) return

      try {
        const response = await getById(`${TaskStatus.getByCode}/${trimmedCode}`)
        if (response?.result === 1 && response.data) {
          const taskStatusData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (taskStatusData) {
            const validTaskStatusData: ITaskStatus = {
              taskStatusId: taskStatusData.taskStatusId,
              taskStatusCode: taskStatusData.taskStatusCode,
              taskStatusName: taskStatusData.taskStatusName,
              seqNo: taskStatusData.seqNo || 0,
              companyId: taskStatusData.companyId,
              remarks: taskStatusData.remarks || "",
              isActive: taskStatusData.isActive ?? true,
              createBy: taskStatusData.createBy,
              editBy: taskStatusData.editBy,
              createDate: taskStatusData.createDate,
              editDate: taskStatusData.editDate,
              createById: taskStatusData.createById,
              editById: taskStatusData.editById,
            }
            setExistingTaskStatus(validTaskStatusData)
            setShowLoadDialog(true)
          }
        }
      } catch (error) {
        console.error("Error checking code availability:", error)
      }
    },
    [modalMode]
  )

  const handleLoadExistingTaskStatus = () => {
    if (existingTaskStatus) {
      setModalMode("edit")
      setSelectedTaskStatus(existingTaskStatus)
      setShowLoadDialog(false)
      setExistingTaskStatus(null)
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
            Task Statuses
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage task status information and settings
          </p>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 sm:w-auto">
          <div className="relative w-full">
            <Input
              placeholder="Search task statuses..."
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
      ) : taskStatusesResult === -2 ||
        (!canView && !canEdit && !canDelete && !canCreate) ? (
        <LockSkeleton locked={true}>
          <TaskStatusesTable
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
        <TaskStatusesTable
          data={taskStatusesData || []}
          isLoading={isLoading}
          totalRecords={totalRecords}
          onSelect={canView ? handleViewTaskStatus : undefined}
          onDeleteAction={canDelete ? handleDeleteTaskStatus : undefined}
          onEditAction={canEdit ? handleEditTaskStatus : undefined}
          onCreateAction={canCreate ? handleCreateTaskStatus : undefined}
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
              {modalMode === "create" && "Create Task Status"}
              {modalMode === "edit" && "Update Task Status"}
              {modalMode === "view" && "View Task Status"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new task status to the system database."
                : modalMode === "edit"
                  ? "Update task status information in the system database."
                  : "View task status details."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TaskStatusForm
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedTaskStatus
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
        onLoad={handleLoadExistingTaskStatus}
        onCancelAction={() => setExistingTaskStatus(null)}
        code={existingTaskStatus?.taskStatusCode}
        name={existingTaskStatus?.taskStatusName}
        typeLabel="Task Status"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Task Status"
        description="This action cannot be undone. This will permanently delete the task status from our servers."
        itemName={deleteConfirmation.taskStatusName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            taskStatusId: null,
            taskStatusName: null,
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
          modalMode === "create" ? "Create Task Status" : "Update Task Status"
        }
        itemName={saveConfirmation.data?.taskStatusName || ""}
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
