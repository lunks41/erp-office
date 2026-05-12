"use client"

import { useCallback, useMemo, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IDebitNoteData,
  IDebitNoteHd,
  IJobOrderHd,
  IPortExpenses,
} from "@/interfaces/checklist"
import { PortExpensesSchemaType } from "@/schemas/checklist"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { apiClient, getData, postData } from "@/lib/api-client"
import {
  JobOrder,
  JobOrder_DebitNote,
  JobOrder_PortExpenses,
} from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { Task } from "@/lib/operations-utils"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import { useDelete, useGetById, usePersist } from "@/hooks/use-common"
import { useTaskServiceDefaults } from "@/hooks/use-task-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyAutocomplete } from "@/components/autocomplete"
import JobOrderCompanyAutocomplete from "@/components/autocomplete/autocomplete-joborder-company"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"

import { CombinedFormsDialog } from "../services-combined/combined-forms-dialog"
import DebitNoteDialog from "../services-combined/debit-note-dialog"
import { PurchaseDialog } from "../services-combined/purchase-dialog"
import { TransportationLogTab } from "../services-combined/transporationlog"
import { PortExpensesForm } from "../services-forms/port-expenses-form"
import { PortExpensesTable } from "../services-tables/port-expenses-table"

interface PortExpensesTabProps {
  jobData: IJobOrderHd
  onTaskAdded?: () => void
  isConfirmed: boolean
}

export function PortExpensesTab({
  jobData,
  onTaskAdded,
  isConfirmed,
}: PortExpensesTabProps) {
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.portExpenses
  const { hasPermission } = usePermissionStore()
  console.log("PortExpensesTab hasPermission", hasPermission)
  console.log("PortExpensesTab moduleId", moduleId)
  console.log("PortExpensesTab transactionId", transactionId)
  // Calculate permissions using the correct transaction ID for this service
  // Each service tab should use its own transaction ID, not the parent's
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const canDebitNote = hasPermission(moduleId, transactionId, "isDebitNote")
  console.log("PortExpensesTab canView", canView)
  console.log("PortExpensesTab canEdit", canEdit)
  console.log("PortExpensesTab canDelete", canDelete)
  console.log("PortExpensesTab canCreate", canCreate)
  console.log("PortExpensesTab canDebitNote", canDebitNote)
  // Get default values for Port Expenses task
  const { defaults: taskDefaults } = useTaskServiceDefaults(Task.PortExpenses)

  const jobOrderId = jobData.jobOrderId

  const queryClient = useQueryClient()
  //states
  const [selectedItem, setSelectedItem] = useState<IPortExpenses | undefined>(
    undefined
  )
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDebitNoteModal, setShowDebitNoteModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showCombinedServiceModal, setShowCombinedServiceModal] =
    useState(false)
  const [debitNoteHd, setDebitNoteHd] = useState<IDebitNoteHd | null>(null)
  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    portExpenseId: string | null
    jobOrderId: number | null
    portExpenseName: string | null
  }>({
    isOpen: false,
    portExpenseId: null,
    jobOrderId: null,
    portExpenseName: null,
  })

  // State for bulk delete confirmation
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{
    isOpen: boolean
    portExpenseIds: string[]
    jobOrderId: number | null
    count: number
  }>({
    isOpen: false,
    portExpenseIds: [],
    jobOrderId: null,
    count: 0,
  })

  // State for selected items (for bulk operations)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  // Key to reset table selection state
  const [tableResetKey, setTableResetKey] = useState(0)

  // Clone Task Dialog State
  const [showCloneTaskDialog, setShowCloneTaskDialog] = useState(false)
  const [showCloneTaskConfirmDialog, setShowCloneTaskConfirmDialog] =
    useState(false)
  const [isCloning, setIsCloning] = useState(false)

  // Clone single Port Expense confirmation state
  const [cloneSaveConfirmation, setCloneSaveConfirmation] = useState<{
    isOpen: boolean
    sourceItem: IPortExpenses | null
  }>({
    isOpen: false,
    sourceItem: null,
  })

  // Clone Task Form Schema
  const cloneTaskSchema = z.object({
    toCompanyId: z.number().min(1, "Please select a company"),
    toJobOrderId: z.number().min(1, "Please select a job order"),
  })

  type CloneTaskFormType = z.infer<typeof cloneTaskSchema>

  const cloneTaskForm = useForm<CloneTaskFormType>({
    resolver: zodResolver(cloneTaskSchema),
    defaultValues: {
      toCompanyId: 0,
      toJobOrderId: 0,
    },
  })

  const selectedCompanyId = cloneTaskForm.watch("toCompanyId")

  const jobDataProps = useMemo(
    () => ({
      jobOrderId: jobData?.jobOrderId ?? 0,
      jobOrderNo: jobData?.jobOrderNo ?? "",
      createById: jobData?.createById ?? 0,
    }),
    [jobData]
  )

  // Data fetching
  const { data: response, refetch } = useGetById<IPortExpenses>(
    `${JobOrder_PortExpenses.get}`,
    "portExpenses",

    `${jobOrderId || ""}`
  )

  const { data } = (response as ApiResponse<IPortExpenses>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  // Mutations
  const saveMutation = usePersist<PortExpensesSchemaType>(
    `${JobOrder_PortExpenses.add}`
  )
  const updateMutation = usePersist<PortExpensesSchemaType>(
    `${JobOrder_PortExpenses.add}`
  )
  const deleteMutation = useDelete(`${JobOrder_PortExpenses.delete}`)
  // Debit note mutation
  const debitNoteMutation = usePersist<IDebitNoteData>(
    `${JobOrder_DebitNote.generate}`
  )

  // Debit note delete mutation
  const debitNoteDeleteMutation = useDelete(`${JobOrder_DebitNote.delete}`)

  // Handlers
  const handleSelect = useCallback(
    async (item: IPortExpenses | undefined) => {
      if (!item) return

      try {
        const response = (await getData(
          `${JobOrder_PortExpenses.getById}/${jobOrderId}/${item.portExpenseId}`
        )) as ApiResponse<IPortExpenses>
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
        console.error("An error occurred while fetching details:", error)
      }
    },
    [jobOrderId]
  )

  const handleDelete = (id: string) => {
    const itemToDelete = data?.find(
      (item) => item.portExpenseId.toString() === id
    )
    if (!itemToDelete) return

    setDeleteConfirmation({
      isOpen: true,
      portExpenseId: id,
      jobOrderId: jobData.jobOrderId,
      portExpenseName: `Port Expense ${itemToDelete.chargeName}`,
    })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.portExpenseId && deleteConfirmation.jobOrderId) {
      try {
        await deleteMutation.mutateAsync(
          `${deleteConfirmation.jobOrderId}/${deleteConfirmation.portExpenseId}`
        )
        queryClient.invalidateQueries({ queryKey: ["portExpenses"] })
        onTaskAdded?.()
      } catch (error) {
        console.error("Failed to delete port expense:", error)
      } finally {
        setDeleteConfirmation({
          isOpen: false,
          portExpenseId: null,
          jobOrderId: null,
          portExpenseName: null,
        })
      }
    }
  }

  // Single-row clone handler (called from Actions column)
  const handleCloneRow = useCallback((item: IPortExpenses) => {
    setCloneSaveConfirmation({ isOpen: true, sourceItem: item })
  }, [])

  const handleBulkDelete = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) {
        toast.error("Please select at least one port expense to delete")
        return
      }

      // Check if any selected items have a debitNoteId
      const itemsWithDebitNote = data?.filter(
        (item) =>
          selectedIds.includes(item.portExpenseId.toString()) &&
          item.debitNoteId &&
          item.debitNoteId > 0
      )

      if (itemsWithDebitNote && itemsWithDebitNote.length > 0) {
        toast.error(
          `Cannot delete: ${itemsWithDebitNote.length} selected item(s) have a Debit Note. Please remove the Debit Note first.`
        )
        return
      }

      setBulkDeleteConfirmation({
        isOpen: true,
        portExpenseIds: selectedIds,
        jobOrderId: jobData.jobOrderId,
        count: selectedIds.length,
      })
    },
    [jobData.jobOrderId, data]
  )

  const handleConfirmBulkDelete = async () => {
    if (
      bulkDeleteConfirmation.portExpenseIds.length === 0 ||
      !bulkDeleteConfirmation.jobOrderId
    ) {
      return
    }

    try {
      // Use bulk delete endpoint for better performance
      const response = await postData(
        `${JobOrder_PortExpenses.bulkDelete}/${bulkDeleteConfirmation.jobOrderId}`,
        {
          portExpenseIds: bulkDeleteConfirmation.portExpenseIds,
        }
      )

      if (response.result === 1) {
        queryClient.invalidateQueries({ queryKey: ["portExpenses"] })
        onTaskAdded?.()
        toast.success(
          `Successfully deleted ${bulkDeleteConfirmation.portExpenseIds.length} item(s)`
        )
        handleClearSelection()
      } else {
        toast.error(response.message || "Failed to delete selected items")
      }
    } catch (error) {
      console.error("Error during bulk delete:", error)
      toast.error("An error occurred while deleting items")
    } finally {
      setBulkDeleteConfirmation({
        isOpen: false,
        portExpenseIds: [],
        jobOrderId: null,
        count: 0,
      })
    }
  }

  const handleCreate = () => {
    setSelectedItem(undefined)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleEdit = useCallback(
    async (item: IPortExpenses) => {
      try {
        const response = (await getData(
          `${JobOrder_PortExpenses.getById}/${jobOrderId}/${item.portExpenseId}`
        )) as ApiResponse<IPortExpenses>
        if (response.result === 1 && response.data) {
          console.log("Response data:", response.data)
          const itemData = Array.isArray(response.data)
            ? response.data[0]
            : response.data

          if (itemData) {
            console.log("Setting selected item for edit:", itemData)
            console.log("isConfirmed value when editing:", isConfirmed)
            setSelectedItem(itemData)
            setModalMode("edit")
            setIsModalOpen(true)
          }
        } else {
          console.error("Failed to load item details for editing")
        }
      } catch (error) {
        console.error("An error occurred while fetching item details:", error)
      }
    },
    [jobOrderId, isConfirmed]
  )

  const handleSubmit = useCallback(
    async (formData: Partial<IPortExpenses>) => {
      try {
        const processedData = {
          ...formData,
          deliverDate: formatDateForApi(formData.deliverDate) || undefined,
        }
        const submitData = { ...processedData, ...jobDataProps }

        let response
        if (modalMode === "edit" && selectedItem) {
          response = await updateMutation.mutateAsync({
            ...submitData,
            portExpenseId: selectedItem.portExpenseId,
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
      }
    },
    [
      modalMode,
      jobDataProps,
      selectedItem,
      updateMutation,
      saveMutation,
      refetch,
      onTaskAdded,
    ]
  )

  const handleCombinedService = useCallback((selectedIds: string[]) => {
    setSelectedItems(selectedIds)
    setShowCombinedServiceModal(true)
  }, [])

  // Handler for clone task from table header - receives selectedIds from table
  const handleCloneTaskClick = useCallback((selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one port expense to clone")
      return
    }
    // Store selected IDs for use in clone API call
    setSelectedItems(selectedIds)
    setShowCloneTaskDialog(true)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedItems([])
    // Reset table selection by changing key
    setTableResetKey((prev) => prev + 1)
  }, [])

  const handleDebitNote = useCallback(
    async (portExpenseId: string, debitNoteNo?: string) => {
      try {
        // Handle both single ID and comma-separated multiple IDs
        const selectedIds = portExpenseId.includes(",")
          ? portExpenseId.split(",").map((id) => id.trim())
          : [portExpenseId]

        console.log("Selected IDs for debit note:", selectedIds)

        // Find all selected items
        const foundItems = data?.filter((item) =>
          selectedIds.includes(item.portExpenseId.toString())
        )

        if (!foundItems || foundItems.length === 0) {
          console.error("Port expense(s) not found")
          return
        }

        // Check if any selected items have existing debit notes
        const itemsWithExistingDebitNotes = foundItems.filter(
          (item) => item.debitNoteId && item.debitNoteId > 0
        )

        // If all selected items have existing debit notes
        if (itemsWithExistingDebitNotes.length === foundItems.length) {
          console.log("All selected items have existing debit notes")

          // For now, open the first item's debit note
          // In the future, you might want to handle multiple debit notes differently
          const firstItem = itemsWithExistingDebitNotes[0]

          // Fetch the existing debit note data FIRST
          const debitNoteResponse = (await getData(
            `${JobOrder_DebitNote.getById}/${jobData.jobOrderId}/${Task.PortExpenses}/${firstItem.debitNoteId}`
          )) as ApiResponse<IDebitNoteHd>

          console.log("Debit note response:", debitNoteResponse)

          if (debitNoteResponse.result === 1 && debitNoteResponse.data) {
            console.log("Existing debit note data:", debitNoteResponse.data)
            const debitNoteData = Array.isArray(debitNoteResponse.data)
              ? debitNoteResponse.data[0]
              : debitNoteResponse.data

            console.log("Existing debitNoteData", debitNoteData)
            setDebitNoteHd(debitNoteData)

            // Set the selected item and open the modal AFTER data is fetched
            setSelectedItem(firstItem)
            setShowDebitNoteModal(true)

            queryClient.invalidateQueries({ queryKey: ["portExpenses"] })
            console.log("Opening existing debit note")
          } else {
            console.error("Failed to fetch existing debit note data")
          }
          return
        }

        // If some or all items don't have debit notes, create new ones
        console.log(
          "Creating new debit note(s) for selected items:",
          selectedIds
        )

        // Prepare the data for the debit note mutation with comma-separated IDs
        const debitNoteData: IDebitNoteData = {
          multipleId: selectedIds.join(","), // Comma-separated string of all selected IDs
          taskId: Task.PortExpenses,
          jobOrderId: jobData.jobOrderId,
          debitNoteNo: debitNoteNo || "",
        }

        console.log("Debit note data to be sent:", debitNoteData)

        // Call the mutation
        const response = await debitNoteMutation.mutateAsync(debitNoteData)

        console.log("response", response)

        // Check if the mutation was successful
        if (response.result > 0) {
          console.log("response.totalRecords", response.totalRecords)
          // Fetch the debit note data using the returned ID FIRST
          const debitNoteResponse = (await getData(
            `${JobOrder_DebitNote.getById}/${jobData.jobOrderId}/${Task.PortExpenses}/${response.totalRecords}`
          )) as ApiResponse<IDebitNoteHd>
          console.log("debitNoteResponse", debitNoteResponse)

          if (debitNoteResponse.result === 1 && debitNoteResponse.data) {
            console.log("New debit note data:", debitNoteResponse.data)
            const debitNoteData = Array.isArray(debitNoteResponse.data)
              ? debitNoteResponse.data[0]
              : debitNoteResponse.data

            console.log("New debitNoteData", debitNoteData)
            setDebitNoteHd(debitNoteData)

            // Set the first selected item and open the debit note modal AFTER data is fetched
            setSelectedItem(foundItems[0])
            setShowDebitNoteModal(true)
          } else {
            console.error("Failed to fetch debit note data after creation")
          }

          console.log(
            `Debit note created successfully for ${foundItems.length} item(s)`
          )

          // Clear selections FIRST to prevent errors when accessing item.id on undefined items
          handleClearSelection()

          // Invalidate queries with a small delay to allow clear selection to complete
          requestAnimationFrame(() => {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["portExpenses"] })
              queryClient.invalidateQueries({ queryKey: ["taskCount"] })
              queryClient.invalidateQueries({ queryKey: ["debitNote"] })
            }, 50)
          })
        }
      } catch (error) {
        console.error("Error handling debit note:", error)
      }
    },
    [debitNoteMutation, data, jobData, queryClient, handleClearSelection]
  )

  const handlePurchase = useCallback(
    (portExpenseId: string) => {
      // Find the selected port expense item
      const item = data?.find(
        (p) => p.portExpenseId.toString() === portExpenseId
      )
      setSelectedItem(item)
      setShowPurchaseModal(true)
    },
    [data]
  )

  const handleRefreshPortExpenses = useCallback(() => {
    refetch()
  }, [refetch])

  const handleCloneTask = async () => {
    const formValues = cloneTaskForm.getValues()

    if (!formValues.toCompanyId || !formValues.toJobOrderId) {
      toast.error("Please select both company and job order")
      return
    }

    if (selectedItems.length === 0) {
      toast.error("Please select at least one port expense to clone")
      return
    }

    setIsCloning(true)
    try {
      // Prepare clone request data according to API specification
      const cloneData = {
        toCompanyId: formValues.toCompanyId as number,
        fromTaskId: Task.PortExpenses,
        fromJobOrderId: jobData.jobOrderId,
        toJobOrderId: formValues.toJobOrderId,
        multipleId: selectedItems.join(","),
      }

      const response = await apiClient.post(
        JobOrder.cloneTaskChecklist,
        cloneData
      )

      if (response.data.result === 1) {
        toast.success(
          response.data.message ||
            "Port expenses cloned to different company successfully!"
        )

        // Close dialogs
        setShowCloneTaskDialog(false)
        setShowCloneTaskConfirmDialog(false)
        cloneTaskForm.reset()
        handleClearSelection()

        // Refresh the data
        refetch()
        onTaskAdded?.()
      } else {
        toast.error(response.data.message || "Failed to clone port expenses")
      }
    } catch (error) {
      console.error("Error cloning port expenses to different company:", error)
      toast.error("Failed to clone port expenses. Please try again.")
    } finally {
      setIsCloning(false)
    }
  }

  // Handle debit note delete
  const handleDeleteDebitNote = useCallback(
    async (debitNoteId: number) => {
      try {
        await debitNoteDeleteMutation.mutateAsync(
          `${jobData.jobOrderId}/${Task.PortExpenses}/${debitNoteId}`
        )

        // Clear selections FIRST to prevent errors when accessing item.id on undefined items
        handleClearSelection()

        // Invalidate queries with a small delay to allow clear selection to complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["portExpenses"] })
            queryClient.invalidateQueries({ queryKey: ["debitNote"] })
            queryClient.invalidateQueries({ queryKey: ["taskCount"] })
          }, 50)
        })

        onTaskAdded?.()
        setShowDebitNoteModal(false)
        setDebitNoteHd(null)
      } catch (error) {
        console.error("Failed to delete debit note:", error)
      }
    },
    [
      debitNoteDeleteMutation,
      jobData.jobOrderId,
      queryClient,
      onTaskAdded,
      handleClearSelection,
    ]
  )

  return (
    <>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <PortExpensesTable
            key={tableResetKey}
            data={data || []}
            onPortExpensesSelect={handleSelect}
            onDeletePortExpenses={handleDelete}
            onBulkDeletePortExpenses={handleBulkDelete}
            onEditActionPortExpenses={handleEdit}
            onCreateActionPortExpenses={handleCreate}
            onCombinedService={handleCombinedService}
            onCloneTask={handleCloneTaskClick}
            onCloneRow={handleCloneRow}
            onDebitNoteAction={handleDebitNote}
            onPurchaseAction={handlePurchase}
            onRefreshAction={handleRefreshPortExpenses}
            moduleId={moduleId}
            transactionId={transactionId}
            isConfirmed={isConfirmed}
            jobData={jobData}
            canView={canView}
            canEdit={canEdit}
            canDelete={canDelete}
            canCreate={canCreate}
            canDebitNote={canDebitNote}
          />
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-h-[85vh] w-[95vw] !max-w-[1400px] overflow-x-hidden overflow-y-auto"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Port Expense</DialogTitle>
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
                      : "border-border bg-blue-100 text-primary"
                }
              >
                {modalMode === "create"
                  ? "New"
                  : modalMode === "edit"
                    ? "Edit"
                    : "View"}
              </Badge>
              <Badge
                variant="outline"
                className="border-purple-200 bg-purple-100 text-purple-800"
              >
                {jobData.jobOrderNo}
              </Badge>
            </div>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new port expense to this job order."
                : modalMode === "edit"
                  ? "Update the port expense details."
                  : "View port expense details (read-only)."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {modalMode === "edit" || modalMode === "view" ? (
            <Tabs defaultValue="portExpenses">
              <TabsList className="mb-3">
                <TabsTrigger value="portExpenses">Port Expense</TabsTrigger>
                <TabsTrigger value="transportation">Transportation</TabsTrigger>
              </TabsList>

              <TabsContent value="portExpenses">
                <PortExpensesForm
                  jobData={jobData}
                  initialData={selectedItem}
                  taskDefaults={taskDefaults}
                  submitAction={handleSubmit}
                  onCancelAction={() => setIsModalOpen(false)}
                  isSubmitting={
                    saveMutation.isPending || updateMutation.isPending
                  }
                  isConfirmed={isConfirmed || modalMode === "view"}
                />
              </TabsContent>

              <TabsContent
                value="transportation"
                className="w-full max-w-full overflow-x-hidden overflow-y-auto"
              >
                <TransportationLogTab
                  jobData={jobData}
                  taskId={Task.PortExpenses}
                  serviceItemNo={selectedItem?.portExpenseId ?? 0}
                  moduleId={moduleId}
                  transactionId={transactionId}
                  onTaskAdded={onTaskAdded}
                  isConfirmed={isConfirmed}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <PortExpensesForm
              jobData={jobData}
              initialData={isConfirmed ? selectedItem : undefined}
              taskDefaults={taskDefaults}
              submitAction={handleSubmit}
              onCancelAction={() => setIsModalOpen(false)}
              isSubmitting={saveMutation.isPending || updateMutation.isPending}
              isConfirmed={isConfirmed}
            />
          )}
        </DialogContent>
      </Dialog>

      <SaveConfirmation
        open={cloneSaveConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setCloneSaveConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Clone Port Expense"
        itemName={`Port Expense ${
          cloneSaveConfirmation.sourceItem?.chargeName ?? ""
        }`}
        onConfirm={async () => {
          const src = cloneSaveConfirmation.sourceItem
          if (!src) return

          const submitData: PortExpensesSchemaType = {
            ...(src as unknown as PortExpensesSchemaType),
            portExpenseId: 0,
            // Clear any existing debit note linkage on cloned record
            debitNoteId: 0,
            deliverDate: formatDateForApi(src.deliverDate) as string,
            ...jobDataProps,
          }

          const response = await saveMutation.mutateAsync(submitData)
          if (response?.result === 1) {
            refetch()
            onTaskAdded?.()
          }

          setCloneSaveConfirmation({ isOpen: false, sourceItem: null })
        }}
      />

      {/* Combined Services Modal */}
      {showCombinedServiceModal && (
        <CombinedFormsDialog
          open={showCombinedServiceModal}
          onOpenChange={setShowCombinedServiceModal}
          jobData={jobData}
          moduleId={moduleId}
          transactionId={transactionId}
          isConfirmed={isConfirmed}
          taskId={Task.PortExpenses}
          multipleId={selectedItems.join(",")}
          onTaskAdded={onTaskAdded}
          onClearSelection={handleClearSelection}
          onCancelAction={() => setShowCombinedServiceModal(false)}
          title="Combined Services"
          description="Manage bulk updates and task forwarding operations"
        />
      )}

      {/* Debit Note Modal */}
      {showDebitNoteModal && (
        <DebitNoteDialog
          open={showDebitNoteModal}
          onOpenChange={setShowDebitNoteModal}
          taskId={Task.PortExpenses}
          debitNoteHd={debitNoteHd ?? undefined}
          isConfirmed={isConfirmed}
          onDeleteAction={handleDeleteDebitNote}
          onClearSelection={handleClearSelection}
          title="Debit Note"
          description="Manage debit note details for this port expenses."
          jobOrder={jobData}
        />
      )}

      {/* Purchase Table Modal */}
      {showPurchaseModal && (
        <PurchaseDialog
          open={showPurchaseModal}
          onOpenChangeAction={setShowPurchaseModal}
          title="Purchase"
          description="Manage purchase details for this port expenses."
          jobOrderId={jobData.jobOrderId}
          taskId={Task.PortExpenses}
          serviceItemNo={selectedItem?.portExpenseId ?? 0}
          isConfirmed={isConfirmed}
        />
      )}

      {/* Delete Confirmation of Port Expense */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Port Expense"
        description="This action cannot be undone. This will permanently delete the port expense from our servers."
        itemName={deleteConfirmation.portExpenseName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            portExpenseId: null,
            jobOrderId: null,
            portExpenseName: null,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmation
        open={bulkDeleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setBulkDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Multiple Port Expenses"
        description="This action cannot be undone. This will permanently delete the selected port expenses from our servers."
        itemName={`${bulkDeleteConfirmation.count} port expense${bulkDeleteConfirmation.count !== 1 ? "s" : ""}`}
        onConfirm={handleConfirmBulkDelete}
        onCancelAction={() =>
          setBulkDeleteConfirmation({
            isOpen: false,
            portExpenseIds: [],
            jobOrderId: null,
            count: 0,
          })
        }
        isDeleting={deleteMutation.isPending}
      />

      {/* Clone Task Dialog */}
      <Dialog
        open={showCloneTaskDialog}
        onOpenChange={(open) => {
          setShowCloneTaskDialog(open)
          if (!open) {
            cloneTaskForm.reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Task to Different Company</DialogTitle>
            <DialogDescription>
              Select the target company and job order to clone{" "}
              {selectedItems.length} selected port expense(s).
            </DialogDescription>
          </DialogHeader>
          <Form {...cloneTaskForm}>
            <form className="space-y-4">
              <CompanyAutocomplete
                form={cloneTaskForm}
                name="toCompanyId"
                label="Company"
                isRequired
              />
              <JobOrderCompanyAutocomplete
                form={cloneTaskForm}
                name="toJobOrderId"
                label="Job Order"
                isRequired
                isDisabled={!selectedCompanyId}
                companyId={selectedCompanyId as number}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloneTaskDialog(false)
                cloneTaskForm.reset()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const formValues = cloneTaskForm.getValues()
                if (!formValues.toCompanyId || !formValues.toJobOrderId) {
                  toast.error("Please select both company and job order")
                  return
                }
                setShowCloneTaskConfirmDialog(true)
              }}
              disabled={isCloning}
            >
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Task Confirmation Dialog */}
      <Dialog
        open={showCloneTaskConfirmDialog}
        onOpenChange={setShowCloneTaskConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Clone</DialogTitle>
            <DialogDescription>
              Are you sure you want to clone {selectedItems.length} port
              expense(s) to the selected company and job order? This action will
              create new records in the target job order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloneTaskConfirmDialog(false)}
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button onClick={handleCloneTask} disabled={isCloning}>
              {isCloning ? "Cloning..." : "Yes, Clone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
