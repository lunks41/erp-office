"use client"

import { useCallback, useMemo, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IJobOrderHd,
  ISerTransportationDt,
  ISerTransportationHd,
} from "@/interfaces/checklist"
import { SerTransportationHdSchemaType } from "@/schemas/checklist"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"

import { getData } from "@/lib/api-client"
import { Transportation } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
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

interface TransportationLogTabProps {
  jobData: IJobOrderHd
  moduleId: number
  transactionId: number
  onTaskAdded?: () => void
  isConfirmed: boolean
  inlineMode?: boolean
}

export function TransportationLogTab({
  jobData,
  onTaskAdded,
  isConfirmed,
  inlineMode = false,
}: TransportationLogTabProps) {
  const jobOrderId = jobData.jobOrderId
  const queryClient = useQueryClient()

  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.transportationLog
  const { hasPermission } = usePermissionStore()
  const _canView = hasPermission(moduleId, transactionId, "isRead")
  const _canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const _canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const _canDebitNote = hasPermission(moduleId, transactionId, "isDebitNote")

  // Get default values for Transportation task - use taskId from initialData or a default value
  // Since Task.Transportation doesn't exist, we'll use 0 as default
  const { defaults: taskDefaults } = useTaskServiceDefaults(0)

  // States
  const [selectedItem, setSelectedItem] = useState<
    ISerTransportationHd | undefined
  >(undefined)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    formData: Partial<SerTransportationHdSchemaType> | null
    operationType: "create" | "update"
  }>({
    isOpen: false,
    formData: null,
    operationType: "create",
  })

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    transportationId: string | null
    transportationLogName: string | null
    jobOrderId: number | null
  }>({
    isOpen: false,
    transportationId: null,
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
  const { data: response, refetch } = useGetById<ISerTransportationHd>(
    `${Transportation.get}`,
    "transportationLog",
    `${jobOrderId || ""}`
  )

  const { data } = (response as ApiResponse<ISerTransportationHd>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  // Mutations
  const saveMutation = usePersist<SerTransportationHdSchemaType>(
    `${Transportation.add}`
  )
  const updateMutation = usePersist<SerTransportationHdSchemaType>(
    `${Transportation.add}`
  )
  const deleteMutation = useDelete(`${Transportation.delete}`)

  // Handlers
  const handleSelect = useCallback(
    async (item: ISerTransportationHd | null) => {
      if (!item) return

      try {
        const response = (await getData(
          `${Transportation.getById}/${jobOrderId}/${item.transportationId}`
        )) as ApiResponse<ISerTransportationHd>
        if (response.result === 1 && response.data) {
          const itemData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (itemData) {
            setSelectedItem(itemData)
            setModalMode("view")
            if (!inlineMode) {
              setIsModalOpen(true)
            }
          }
        } else {
          console.error("Failed to load details")
        }
      } catch (error) {
        console.error("An error occurred while fetching details")
        console.error("Error fetching item:", error)
      }
    },
    [jobOrderId, inlineMode]
  )

  const handleDelete = (id: string) => {
    const itemToDelete = data?.find(
      (item) => String(item.transportationId ?? "") === id
    )
    if (!itemToDelete) return

    setDeleteConfirmation({
      isOpen: true,
      transportationId: id,
      transportationLogName: `Transportation ${itemToDelete.fromLocationId} to ${itemToDelete.toLocationId}`,
      jobOrderId: jobData.jobOrderId,
    })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.transportationId && deleteConfirmation.jobOrderId) {
      try {
        await deleteMutation.mutateAsync(
          `${deleteConfirmation.jobOrderId}/${deleteConfirmation.transportationId}`
        )
        queryClient.invalidateQueries({ queryKey: ["transportationLog"] })
        onTaskAdded?.()
      } catch (error) {
        console.error("Failed to delete transportation log:", error)
      } finally {
        setDeleteConfirmation({
          isOpen: false,
          transportationId: null,
          jobOrderId: null,
          transportationLogName: null,
        })
      }
    }
  }

  const handleEdit = useCallback(
    async (item: ISerTransportationHd) => {
      // Preserve transportationId from selected table row immediately.
      setSelectedItem(item)
      const response = (await getData(
        `${Transportation.getById}/${jobOrderId}/${item.transportationId}`
      )) as ApiResponse<ISerTransportationHd>
      if (response.result === 1 && response.data) {
        const itemData = Array.isArray(response.data)
          ? response.data[0]
          : response.data

        if (itemData) {
          setSelectedItem(itemData)
          setModalMode("edit")
          if (!inlineMode) {
            setIsModalOpen(true)
          }
        }
      }
    },
    [jobOrderId, inlineMode]
  )

  const handleSubmit = useCallback(
    (formData: Partial<SerTransportationHdSchemaType>) => {
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
      const processedData = {
        ...saveConfirmation.formData,
        transportDate:
          formatDateForApi(saveConfirmation.formData.transportDate) ||
          undefined,
      }
      const submitData: Partial<SerTransportationHdSchemaType> & {
        data_details?: ISerTransportationDt[]
      } = {
        ...processedData,
        ...jobDataProps,
        data_details: (
          (processedData.data_details as
            | Array<
                Partial<ISerTransportationDt> & {
                  itemNo: number
                  serviceItemNo: number
                }
              >
            | undefined) ?? []
        ).map((detail) => ({
          itemNo: detail.itemNo,
          serviceItemNo: detail.serviceItemNo,
          serviceItemNoName: detail.serviceItemNoName ?? "",
        })),
      }

      let response
      if (saveConfirmation.operationType === "update" && selectedItem) {
        response = await updateMutation.mutateAsync({
          ...submitData,
          transportationId:
            selectedItem.transportationId ??
            saveConfirmation.formData.transportationId,
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
    if (!inlineMode) {
      setIsModalOpen(true)
    }
  }, [inlineMode])

  const handleRefreshTransportationLog = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <>
      <div className="flex min-h-0 flex-col gap-1">
        {inlineMode && (
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-sm font-semibold">Transportation Form</h3>
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
                      : "border-border text-primary bg-blue-100"
                }
              >
                {modalMode === "create"
                  ? "New"
                  : modalMode === "edit"
                    ? "Edit"
                    : "View"}
              </Badge>
            </div>
            <TransportationLogForm
              jobData={jobData}
              initialData={
                modalMode === "edit" || modalMode === "view"
                  ? selectedItem
                  : undefined
              }
              taskDefaults={taskDefaults}
              submitAction={handleSubmit}
              onCancelAction={() => {
                setSelectedItem(undefined)
                setModalMode("create")
              }}
              isSubmitting={saveMutation.isPending || updateMutation.isPending}
              isConfirmed={isConfirmed || modalMode === "view"}
            />
          </div>
        )}

        <div className="min-h-0 flex-1">
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
      <Dialog open={!inlineMode && isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-h-[80vh] w-[60vw] max-w-none! overflow-y-auto"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Transportation | Forklift </DialogTitle>
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
                      : "border-border text-primary bg-blue-100"
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
                  ? "Update the transportation | forklift details."
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
            transportationId: null,
            jobOrderId: null,
            transportationLogName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />
    </>
  )
}
