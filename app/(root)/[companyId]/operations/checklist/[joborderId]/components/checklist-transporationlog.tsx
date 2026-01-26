"use client"

import { useCallback, useMemo, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IJobOrderHd, ITransportationLog } from "@/interfaces/checklist"
import { TransportationLogSchemaType } from "@/schemas/checklist"
import { useQueryClient } from "@tanstack/react-query"

import { getData } from "@/lib/api-client"
import { JobOrder_TransportationLog } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { useDelete, useGetById, usePersist } from "@/hooks/use-common"
import { useTaskServiceDefaults } from "@/hooks/use-task-service"
import { Badge } from "@/components/ui/badge"
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

import { TransportationLogForm } from "./checklist-transporationlog-form"
import { TransportationLogTable } from "./checklist-transporationlog-table"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import { usePermissionStore } from "@/stores/permission-store"

interface TransportationLogTabProps {
  jobData: IJobOrderHd
  moduleId: number
  transactionId: number
  onTaskAdded?: () => void
  isConfirmed: boolean
}

export function TransportationLogTab({
  jobData,
  onTaskAdded,
  isConfirmed,
}: TransportationLogTabProps) {
  const jobOrderId = jobData.jobOrderId
  const queryClient = useQueryClient()

  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.transportationLog
  const { hasPermission } = usePermissionStore()
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const canDebitNote = hasPermission(moduleId, transactionId, "isDebitNote")

  // Get default values for Transportation task - use taskId from initialData or a default value
  // Since Task.Transportation doesn't exist, we'll use 0 as default
  const { defaults: taskDefaults } = useTaskServiceDefaults(0)

  // States
  const [selectedItem, setSelectedItem] = useState<
    ITransportationLog | undefined
  >(undefined)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    formData: Partial<ITransportationLog> | null
    operationType: "create" | "update"
  }>({
    isOpen: false,
    formData: null,
    operationType: "create",
  })

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    itemNo: string | null
    transportationLogName: string | null
    jobOrderId: number | null
  }>({
    isOpen: false,
    itemNo: null,
    transportationLogName: null,
    jobOrderId: null,
  })

  const jobDataProps = useMemo(
    () => ({
      jobOrderId: jobData?.jobOrderId,
      jobOrderNo: jobData?.jobOrderNo,
      createById: jobData?.createById,
    }),
    [jobData]
  )

  // Data fetching
  const { data: response, refetch } = useGetById<ITransportationLog>(
    `${JobOrder_TransportationLog.get}`,
    "transportationLog",
    `${jobOrderId || ""}`
  )

  const { data } = (response as ApiResponse<ITransportationLog>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  // Mutations
  const saveMutation = usePersist<TransportationLogSchemaType>(
    `${JobOrder_TransportationLog.add}`
  )
  const updateMutation = usePersist<TransportationLogSchemaType>(
    `${JobOrder_TransportationLog.add}`
  )
  const deleteMutation = useDelete(`${JobOrder_TransportationLog.delete}`)

  // Handlers
  const handleSelect = useCallback(
    async (item: ITransportationLog | null) => {
      if (!item) return

      try {
        const response = (await getData(
          `${JobOrder_TransportationLog.getById}/${jobOrderId}/${item.itemNo}`
        )) as ApiResponse<ITransportationLog>
        if (response.result === 1 && response.data) {
          const itemData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (itemData) {
            setSelectedItem(itemData)
            setModalMode("view")
            setIsModalOpen(true)
          }
        } else {
          console.error("Failed to load details")
        }
      } catch (error) {
        console.error("An error occurred while fetching details")
        console.error("Error fetching item:", error)
      }
    },
    [jobOrderId]
  )

  const handleDelete = (id: string) => {
    const itemToDelete = data?.find((item) => item.itemNo.toString() === id)
    if (!itemToDelete) return

    setDeleteConfirmation({
      isOpen: true,
      itemNo: id,
      transportationLogName: `Transportation ${itemToDelete.fromLocationId} to ${itemToDelete.toLocationId}`,
      jobOrderId: jobData.jobOrderId,
    })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.itemNo && deleteConfirmation.jobOrderId) {
      try {
        await deleteMutation.mutateAsync(
          `${deleteConfirmation.jobOrderId}/${deleteConfirmation.itemNo}`
        )
        queryClient.invalidateQueries({ queryKey: ["transportationLog"] })
        onTaskAdded?.()
      } catch (error) {
        console.error("Failed to delete transportation log:", error)
      } finally {
        setDeleteConfirmation({
          isOpen: false,
          itemNo: null,
          jobOrderId: null,
          transportationLogName: null,
        })
      }
    }
  }

  const handleEdit = useCallback(
    async (item: ITransportationLog) => {
      const response = (await getData(
        `${JobOrder_TransportationLog.getById}/${jobOrderId}/${item.itemNo}`
      )) as ApiResponse<ITransportationLog>
      if (response.result === 1 && response.data) {
        const itemData = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        if (itemData) {
          setSelectedItem(itemData)
          setModalMode("edit")
          setIsModalOpen(true)
        }
      }
    },
    [jobOrderId]
  )

  const handleSubmit = useCallback(
    (formData: Partial<ITransportationLog>) => {
      // Show save confirmation instead of directly submitting
      setSaveConfirmation({
        isOpen: true,
        formData,
        operationType: modalMode === "edit" ? "update" : "create",
      })
    },
    [modalMode]
  )

  // Actual save function that gets called after confirmation
  const handleConfirmSave = useCallback(async () => {
    console.log("saveConfirmation.formData", saveConfirmation.formData)
    if (!saveConfirmation.formData) return

    try {
      // Convert null to undefined for chargeId to match schema type (number | undefined, not number | null)
      const { chargeId, ...restFormData } = saveConfirmation.formData
      const processedData = {
        ...restFormData,
        transportDate:
          formatDateForApi(saveConfirmation.formData.transportDate) ||
          undefined,
        chargeId: chargeId ?? undefined,
      }
      const submitData = { ...processedData, ...jobDataProps }

      let response
      if (saveConfirmation.operationType === "update" && selectedItem) {
        response = await updateMutation.mutateAsync({
          ...submitData,
          itemNo: selectedItem.itemNo,
        })
      } else {
        response = await saveMutation.mutateAsync(submitData)
      }

      // Check if API response indicates success (result=1)
      if (response && response.result === 1) {
        // Only close modal and reset state on successful submission
        setIsModalOpen(false)
        setSelectedItem(undefined)
        setModalMode("create")
        refetch()
        onTaskAdded?.()
      } else {
        // If result !== 1, don't close the modal - let user see the error
        console.error(
          "API returned error result:",
          response?.result,
          response?.message
        )
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      // Don't close the modal on error - let user fix the issue and retry
    } finally {
      // Close the save confirmation dialog
      setSaveConfirmation({
        isOpen: false,
        formData: null,
        operationType: "create",
      })
    }
  }, [
    saveConfirmation.formData,
    saveConfirmation.operationType,
    jobDataProps,
    selectedItem,
    updateMutation,
    saveMutation,
    refetch,
    onTaskAdded,
  ])

  const handleCreateTransportationLog = useCallback(() => {
    setSelectedItem(undefined)
    setModalMode("create")
    setIsModalOpen(true)
  }, [])

  const handleRefreshTransportationLog = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <TransportationLogTable
            data={data || []}
            onTransportationLogSelect={handleSelect}
            onDeleteTransportationLog={handleDelete}
            onEditActionTransportationLog={handleEdit}
            onCreateActionTransportationLog={handleCreateTransportationLog}
            onRefreshAction={handleRefreshTransportationLog}
            moduleId={moduleId}
            transactionId={transactionId}
            isConfirmed={isConfirmed}
          />
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-h-[80vh] w-[60vw] !max-w-none overflow-y-auto"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Transportation Log</DialogTitle>
              <Badge
                variant={
                  modalMode === "create"
                    ? "default"
                    : modalMode === "edit"
                      ? "secondary"
                      : "outline"
                }
                className={
                  modalMode === "create"
                    ? "border-green-200 bg-green-100 text-green-800"
                    : modalMode === "edit"
                      ? "border-orange-200 bg-orange-100 text-orange-800"
                      : "border-blue-200 bg-blue-100 text-blue-800"
                }
              >
                {modalMode === "create"
                  ? "New"
                  : modalMode === "edit"
                    ? "Edit"
                    : "View"}
              </Badge>
            </div>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new transportation log entry to this job order."
                : modalMode === "edit"
                  ? "Update the transportation log details."
                  : "View transportation log details (read-only)."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TransportationLogForm
            jobData={jobData}
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedItem
                : undefined
            }
            taskDefaults={taskDefaults}
            submitAction={handleSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isConfirmed={isConfirmed || modalMode === "view"}
          />
        </DialogContent>
      </Dialog>
      {/* Save Confirmation */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Confirm Save"
        itemName={
          saveConfirmation.operationType === "update"
            ? `Transportation ${selectedItem?.fromLocationId || ""} to ${selectedItem?.toLocationId || ""}`
            : "New Transportation Log"
        }
        operationType={saveConfirmation.operationType}
        onConfirm={handleConfirmSave}
        onCancelAction={() =>
          setSaveConfirmation({
            isOpen: false,
            formData: null,
            operationType: "create",
          })
        }
        isSaving={saveMutation.isPending || updateMutation.isPending}
      />
      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Transportation Log"
        description="This action cannot be undone. This will permanently delete the transportation log from our servers."
        itemName={deleteConfirmation.transportationLogName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            itemNo: null,
            jobOrderId: null,
            transportationLogName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />
    </>
  )
}
