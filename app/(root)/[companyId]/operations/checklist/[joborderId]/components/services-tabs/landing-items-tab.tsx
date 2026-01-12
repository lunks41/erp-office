"use client"

import { useCallback, useMemo, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IDebitNoteData,
  IDebitNoteHd,
  IJobOrderHd,
  ILandingItems,
} from "@/interfaces/checklist"
import { LandingItemsSchemaType } from "@/schemas/checklist"
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
  JobOrder_LandingItems,
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
import { CompanyAutocomplete } from "@/components/autocomplete"
import JobOrderCompanyAutocomplete from "@/components/autocomplete/autocomplete-joborder-company"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"

import { CombinedFormsDialog } from "../services-combined/combined-forms-dialog"
import DebitNoteDialog from "../services-combined/debit-note-dialog"
import { PurchaseDialog } from "../services-combined/purchase-dialog"
import { LandingItemsForm } from "../services-forms/landing-items-form"
import { LandingItemsTable } from "../services-tables/landing-items-table"

interface LandingItemsTabProps {
  jobData: IJobOrderHd
  onTaskAdded?: () => void
  isConfirmed: boolean
}

export function LandingItemsTab({
  jobData,
  onTaskAdded,
  isConfirmed,
}: LandingItemsTabProps) {
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.landingItems
  const { hasPermission } = usePermissionStore()
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const canDebitNote = hasPermission(moduleId, transactionId, "isDebitNote")
  const jobOrderId = jobData.jobOrderId
  const queryClient = useQueryClient()

  // Get default values for Landing Items task
  const { defaults: taskDefaults } = useTaskServiceDefaults(Task.LandingItems)
  //states
  const [selectedItem, setSelectedItem] = useState<ILandingItems | undefined>(
    undefined
  )
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCombinedServiceModal, setShowCombinedServiceModal] =
    useState(false)
  const [showDebitNoteModal, setShowDebitNoteModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [debitNoteHd, setDebitNoteHd] = useState<IDebitNoteHd | null>(null)
  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    landingItemId: string | null
    jobOrderId: number | null
    landingItemName: string | null
  }>({
    isOpen: false,
    landingItemId: null,
    jobOrderId: null,
    landingItemName: null,
  })

  // State for bulk delete confirmation
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{
    isOpen: boolean
    landingItemIds: string[]
    jobOrderId: number | null
    count: number
  }>({
    isOpen: false,
    landingItemIds: [],
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
      jobOrderId: jobData?.jobOrderId,
      jobOrderNo: jobData?.jobOrderNo,
      createById: jobData?.createById,
    }),
    [jobData]
  )

  // Data fetching
  const { data: response, refetch } = useGetById<ILandingItems>(
    `${JobOrder_LandingItems.get}`,
    "landingItems",

    `${jobOrderId || ""}`
  )

  const { data } = (response as ApiResponse<ILandingItems>) ?? {
    result: 0,
    message: "",
    data: [],
  }

  // Mutations
  const saveMutation = usePersist<LandingItemsSchemaType>(
    `${JobOrder_LandingItems.add}`
  )
  const updateMutation = usePersist<LandingItemsSchemaType>(
    `${JobOrder_LandingItems.add}`
  )
  const deleteMutation = useDelete(`${JobOrder_LandingItems.delete}`)
  // Debit note mutation
  const debitNoteMutation = usePersist<IDebitNoteData>(
    `${JobOrder_DebitNote.generate}`
  )

  // Debit note delete mutation
  const debitNoteDeleteMutation = useDelete(`${JobOrder_DebitNote.delete}`)

  // Handlers
  const handleSelect = useCallback(
    async (item: ILandingItems | undefined) => {
      if (!item) return

      try {
        const response = (await getData(
          `${JobOrder_LandingItems.getById}/${jobOrderId}/${item.landingItemId}`
        )) as ApiResponse<ILandingItems>
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
    const itemToDelete = data?.find(
      (item) => item.landingItemId.toString() === id
    )
    if (!itemToDelete) return

    setDeleteConfirmation({
      isOpen: true,
      landingItemId: id,
      jobOrderId: jobData.jobOrderId,
      landingItemName: `Landing Item ${itemToDelete.name}`,
    })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.landingItemId && deleteConfirmation.jobOrderId) {
      try {
        await deleteMutation.mutateAsync(
          `${deleteConfirmation.jobOrderId}/${deleteConfirmation.landingItemId}`
        )
        queryClient.invalidateQueries({ queryKey: ["landingItems"] })
        onTaskAdded?.()
      } catch (error) {
        console.error("Failed to delete landing item:", error)
      } finally {
        setDeleteConfirmation({
          isOpen: false,
          landingItemId: null,
          jobOrderId: jobData.jobOrderId,
          landingItemName: null,
        })
      }
    }
  }

  const handleBulkDelete = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) {
        toast.error("Please select at least one landing item to delete")
        return
      }

      // Check if any selected items have a debitNoteId
      const itemsWithDebitNote = data?.filter(
        (item) =>
          selectedIds.includes(item.landingItemId.toString()) &&
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
        landingItemIds: selectedIds,
        jobOrderId: jobData.jobOrderId,
        count: selectedIds.length,
      })
    },
    [jobData.jobOrderId, data]
  )

  const handleConfirmBulkDelete = async () => {
    if (
      bulkDeleteConfirmation.landingItemIds.length === 0 ||
      !bulkDeleteConfirmation.jobOrderId
    ) {
      return
    }

    try {
      // Use bulk delete endpoint for better performance
      const response = await postData(
        `${JobOrder_LandingItems.bulkDelete}/${bulkDeleteConfirmation.jobOrderId}`,
        {
          landingItemIds: bulkDeleteConfirmation.landingItemIds,
        }
      )

      if (response.result === 1) {
        queryClient.invalidateQueries({ queryKey: ["landingItems"] })
        onTaskAdded?.()
        toast.success(
          `Successfully deleted ${bulkDeleteConfirmation.landingItemIds.length} item(s)`
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
        landingItemIds: [],
        jobOrderId: null,
        count: 0,
      })
    }
  }

  const handleEdit = useCallback(
    async (item: ILandingItems) => {
      const response = (await getData(
        `${JobOrder_LandingItems.getById}/${jobOrderId}/${item.landingItemId}`
      )) as ApiResponse<ILandingItems>
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
    async (formData: Partial<ILandingItems>) => {
      try {
        const processedData = {
          ...formData,
          date: formatDateForApi(formData.date) || undefined,
          returnDate: formatDateForApi(formData.returnDate) || undefined,
        }
        const submitData = { ...processedData, ...jobDataProps }

        let response
        if (modalMode === "edit" && selectedItem) {
          response = await updateMutation.mutateAsync({
            ...submitData,
            landingItemId: selectedItem.landingItemId,
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
      toast.error("Please select at least one landing item to clone")
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
    async (landingItemsId: string, debitNoteNo?: string) => {
      try {
        // Handle both single ID and comma-separated multiple IDs
        const selectedIds = landingItemsId.includes(",")
          ? landingItemsId.split(",").map((id) => id.trim())
          : [landingItemsId]

        console.log("Selected IDs for debit note:", selectedIds)

        // Find all selected items
        const foundItems = data?.filter((item) =>
          selectedIds.includes(item.landingItemId.toString())
        )

        if (!foundItems || foundItems.length === 0) {
          console.error("Landing Items(s) not found")
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

          // Fetch the existing debit note data
          const debitNoteResponse = (await getData(
            `${JobOrder_DebitNote.getById}/${jobData.jobOrderId}/${Task.LandingItems}/${firstItem.debitNoteId}`
          )) as ApiResponse<IDebitNoteHd>

          if (debitNoteResponse.result === 1 && debitNoteResponse.data) {
            console.log("New debit note data:", debitNoteResponse.data)
            const debitNoteData = Array.isArray(debitNoteResponse.data)
              ? debitNoteResponse.data[0]
              : debitNoteResponse.data

            console.log("New debitNoteData", debitNoteData)
            setDebitNoteHd(debitNoteData)
            setSelectedItem(firstItem)
            setShowDebitNoteModal(true)

            queryClient.invalidateQueries({ queryKey: ["landingItems"] })
          } else {
            console.error("Failed to fetch existing debit note data")
          }

          console.log("Opening existing debit note")
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
          taskId: Task.LandingItems,
          jobOrderId: jobData.jobOrderId,
          debitNoteNo: debitNoteNo || "",
        }

        console.log("Debit note data to be sent:", debitNoteData)

        // Call the mutation
        const response = await debitNoteMutation.mutateAsync(debitNoteData)

        // Check if the mutation was successful
        if (response.result > 0) {
          // Set the first selected item and open the debit note modal
          // Fetch the debit note data using the returned ID
          const debitNoteResponse = (await getData(
            `${JobOrder_DebitNote.getById}/${jobData.jobOrderId}/${Task.LandingItems}/${response.totalRecords}`
          )) as ApiResponse<IDebitNoteHd>
          console.log("debitNoteResponse", debitNoteResponse)
          if (debitNoteResponse.result === 1 && debitNoteResponse.data) {
            console.log("New debit note data:", debitNoteResponse.data)
            const debitNoteHdData = Array.isArray(debitNoteResponse.data)
              ? debitNoteResponse.data[0]
              : debitNoteResponse.data

            console.log("New debitNoteData", debitNoteHdData)
            setDebitNoteHd(debitNoteHdData)
            setSelectedItem(foundItems[0])
            setShowDebitNoteModal(true)
          }

          console.log(
            `Debit note created successfully for ${foundItems.length} item(s)`
          )

          // Clear selections FIRST to prevent errors when accessing item.id on undefined items
          handleClearSelection()

          // Invalidate queries with a small delay to allow clear selection to complete
          requestAnimationFrame(() => {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["landingItems"] })
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
    (landingItemId: string) => {
      const item = data?.find(
        (service) => service.landingItemId.toString() === landingItemId
      )
      setSelectedItem(item)
      setShowPurchaseModal(true)
    },
    [data]
  )
  const handleCreateLandingItems = useCallback(() => {
    setSelectedItem(undefined)
    setModalMode("create")
    setIsModalOpen(true)
  }, [])

  const handleRefreshLandingItems = useCallback(() => {
    refetch()
  }, [refetch])

  const handleCloneTask = async () => {
    const formValues = cloneTaskForm.getValues()

    if (!formValues.toCompanyId || !formValues.toJobOrderId) {
      toast.error("Please select both company and job order")
      return
    }

    if (selectedItems.length === 0) {
      toast.error("Please select at least one landing item to clone")
      return
    }

    setIsCloning(true)
    try {
      // Prepare clone request data according to API specification
      const cloneData = {
        toCompanyId: formValues.toCompanyId as number,
        fromTaskId: Task.LandingItems,
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
            "Landing items cloned to different company successfully!"
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
        toast.error(response.data.message || "Failed to clone landing items")
      }
    } catch (error) {
      console.error("Error cloning landing items to different company:", error)
      toast.error("Failed to clone landing items. Please try again.")
    } finally {
      setIsCloning(false)
    }
  }

  // Handle debit note delete
  const handleDeleteDebitNote = useCallback(
    async (debitNoteId: number) => {
      try {
        await debitNoteDeleteMutation.mutateAsync(
          `${jobData.jobOrderId}/${Task.LandingItems}/${debitNoteId}`
        )

        // Clear selections FIRST to prevent errors when accessing item.id on undefined items
        handleClearSelection()

        // Invalidate queries with a small delay to allow clear selection to complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["landingItems"] })
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
          <LandingItemsTable
            key={tableResetKey}
            data={data || []}
            onLandingItemsSelect={handleSelect}
            onDeleteLandingItems={handleDelete}
            onBulkDeleteLandingItems={handleBulkDelete}
            onEditActionLandingItems={handleEdit}
            onCreateActionLandingItems={handleCreateLandingItems}
            onCombinedService={handleCombinedService}
            onCloneTask={handleCloneTaskClick}
            onDebitNoteAction={handleDebitNote}
            onPurchaseAction={handlePurchase}
            onRefreshAction={handleRefreshLandingItems}
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
          className="max-h-[80vh] w-[60vw] !max-w-none overflow-y-auto"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Landing Items</DialogTitle>
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
              <Badge
                variant="outline"
                className="border-purple-200 bg-purple-100 text-purple-800"
              >
                {jobData.jobOrderNo}
              </Badge>
            </div>
            <DialogDescription>
              {modalMode === "create"
                ? "Add a new landing item to this job order."
                : modalMode === "edit"
                  ? "Update the landing item details."
                  : "View landing item details (read-only)."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <LandingItemsForm
            jobData={jobData}
            initialData={
              modalMode === "edit" || modalMode === "view"
                ? selectedItem
                : undefined
            }
            taskDefaults={taskDefaults} // Pass defaults to form
            submitAction={handleSubmit}
            onCancelAction={() => setIsModalOpen(false)}
            isSubmitting={saveMutation.isPending || updateMutation.isPending}
            isConfirmed={modalMode === "view"}
          />
        </DialogContent>
      </Dialog>
      {/* Combined Services Modal */}
      {showCombinedServiceModal && (
        <CombinedFormsDialog
          open={showCombinedServiceModal}
          onOpenChange={setShowCombinedServiceModal}
          jobData={jobData}
          moduleId={moduleId}
          transactionId={transactionId}
          isConfirmed={isConfirmed}
          taskId={Task.LandingItems}
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
          taskId={Task.LandingItems}
          debitNoteHd={debitNoteHd ?? undefined}
          isConfirmed={isConfirmed}
          onDeleteAction={handleDeleteDebitNote}
          onClearSelection={handleClearSelection}
          title="Debit Note"
          description="Manage debit note details for this landing items."
        />
      )}

      {/* Purchase Table Modal */}
      {showPurchaseModal && (
        <PurchaseDialog
          open={showPurchaseModal}
          onOpenChangeAction={setShowPurchaseModal}
          title="Purchase"
          description="Manage purchase details for this landing items."
          jobOrderId={jobData.jobOrderId}
          taskId={Task.LandingItems}
          serviceItemNo={selectedItem?.landingItemId ?? 0}
          isConfirmed={isConfirmed}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation((prev) => ({ ...prev, isOpen }))
        }
        title="Delete Landing Item"
        description="This action cannot be undone. This will permanently delete the landing item from our servers."
        itemName={deleteConfirmation.landingItemName || ""}
        onConfirm={handleConfirmDelete}
        onCancelAction={() =>
          setDeleteConfirmation({
            isOpen: false,
            landingItemId: null,
            jobOrderId: null,
            landingItemName: null,
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
        title="Delete Multiple Landing Items"
        description="This action cannot be undone. This will permanently delete the selected landing items from our servers."
        itemName={`${bulkDeleteConfirmation.count} landing item${bulkDeleteConfirmation.count !== 1 ? "s" : ""}`}
        onConfirm={handleConfirmBulkDelete}
        onCancelAction={() =>
          setBulkDeleteConfirmation({
            isOpen: false,
            landingItemIds: [],
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
              {selectedItems.length} selected landing item(s).
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
              Are you sure you want to clone {selectedItems.length} landing
              item(s) to the selected company and job order? This action will
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
