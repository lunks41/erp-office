"use client"

import { ApiResponse } from "@/interfaces/auth"
import { ITransportationLog } from "@/interfaces/checklist"
import { TransportationLogSchemaType } from "@/schemas/checklist"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  useGet,
  useGetById,
  usePersist,
} from "@/hooks/use-common"
import { useTaskServiceDefaults } from "@/hooks/use-task-service"
import { TransportationLog } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"

import { LogisticsTransactionId, ModuleId } from "@/lib/utils"
import { usePermissionStore } from "@/stores/permission-store"
import { useAuthStore } from "@/stores/auth-store"
import { TransportationLogForm } from "./components/transporationlog-form"
import { TransportationLogTable } from "./components/transporationlog-table"

export default function TransportPage() {
  const params = useParams()
  const companyId = Number(params.companyId) || 0
  const moduleId = ModuleId.logistics
  const transactionId = LogisticsTransactionId.transportation

  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionStore()
  const { decimals } = useAuthStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

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


  // Data fetching
  const {
    data: response,
    refetch,
    isLoading: isLoadingTransportationLog,
  } = useGet<ITransportationLog>(
    `${TransportationLog.get}`,
    "transportationLog"
  )

  const { data } = (response as ApiResponse<ITransportationLog>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  // Mutations
  const saveMutation = usePersist<TransportationLogSchemaType>(
    `${TransportationLog.add}`
  )
  const updateMutation = usePersist<TransportationLogSchemaType>(
    `${TransportationLog.add}`
  )

  // Fetch individual transportation log by ID
  const selectedItemId = selectedItem?.itemNo?.toString() || ""
  const {
    data: itemResponse,
    refetch: refetchItem,
    isLoading: isLoadingItem,
  } = useGetById<ITransportationLog>(
    `${TransportationLog.getById}`,
    "transportationLogById",
    selectedItemId,
    {
      enabled: !!selectedItemId && (modalMode === "view" || modalMode === "edit"),
    }
  )

  // Update selected item when item data is fetched
  useEffect(() => {
    if (itemResponse?.result === 1 && itemResponse.data) {
      const itemData = Array.isArray(itemResponse.data)
        ? itemResponse.data[0]
        : itemResponse.data
      if (itemData) {
        setSelectedItem(itemData)
      }
    }
  }, [itemResponse])

  // Handlers
  const handleSelect = useCallback((item: ITransportationLog | null) => {
    if (!item) return
    setSelectedItem(item)
    setModalMode("view")
    setIsModalOpen(true)
  }, [])


  const handleEdit = useCallback((item: ITransportationLog) => {
    setSelectedItem(item)
    setModalMode("edit")
    setIsModalOpen(true)
  }, [])

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
      const processedData: Partial<TransportationLogSchemaType> = {
        ...saveConfirmation.formData,
        companyId: companyId,
        transportDate:
          formatDateForApi(saveConfirmation.formData.transportDate) ||
          undefined,
        chargeId: saveConfirmation.formData.chargeId ?? undefined,
        cargoTypeId: saveConfirmation.formData.cargoTypeId ?? undefined,
      }

      let response
      if (saveConfirmation.operationType === "update" && selectedItem) {
        response = await updateMutation.mutateAsync({
          ...processedData,
          itemNo: selectedItem.itemNo,
        })
      } else {
        response = await saveMutation.mutateAsync(processedData)
      }

      // Check if API response indicates success (result=1)
      if (response && response.result === 1) {
        // Only close modal and reset state on successful submission
        setIsModalOpen(false)
        setSelectedItem(undefined)
        setModalMode("create")
        refetch()
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
    companyId,
    selectedItem,
    updateMutation,
    saveMutation,
    refetch,
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
      <div className="@container flex flex-1 flex-col p-4">
        {/* Header Section */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
              Transportation Log
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage transportation logs and track shipments
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <TransportationLogTable
            data={data || []}
            onTransportationLogSelect={handleSelect}
            onEditActionTransportationLog={handleEdit}
            onCreateActionTransportationLog={handleCreateTransportationLog}
            onRefreshAction={handleRefreshTransportationLog}
            moduleId={moduleId}
            transactionId={transactionId}
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
                ? "Add a new transportation log entry."
                : modalMode === "edit"
                  ? "Update the transportation log details."
                  : "View transportation log details (read-only)."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <TransportationLogForm
            companyId={companyId}
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedItem
                : undefined
            }
            taskDefaults={taskDefaults}
            submitAction={handleSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isConfirmed={modalMode === "view"}
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
    </>
  )
}
