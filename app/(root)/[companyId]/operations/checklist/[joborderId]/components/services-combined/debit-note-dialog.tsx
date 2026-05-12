"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  calculateMultiplierAmount,
  calculatePercentagecAmount,
} from "@/helpers/account"
import { calculateDebitNoteSummary } from "@/helpers/debit-note-calculations"
import {
  IBulkChargeData,
  IDebitNoteDt,
  IDebitNoteHd,
  IJobOrderHd,
} from "@/interfaces/checklist"
import {
  DebitNoteDtSchemaType,
  DebitNoteHdSchemaType,
} from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ListChecks, Printer, Save, Trash } from "lucide-react"
import { toast } from "sonner"

import { getData } from "@/lib/api-client"
import { JobOrder_DebitNote } from "@/lib/api-routes"
import { formatDateForApi, parseDate } from "@/lib/date-utils"
import { TaskIdToName } from "@/lib/operations-utils"
import { usePersist } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"

import { BulkDebitNoteTable } from "./debit-note-bulk-table"
import DebitNoteForm from "./debit-note-form"
import DebitNoteTable from "./debit-note-table"

interface DebitNoteDialogProps {
  open: boolean
  taskId: number
  debitNoteHd?: IDebitNoteHd
  isConfirmed?: boolean
  title?: string
  description?: string
  onOpenChange: (open: boolean) => void
  onDeleteAction?: (debitNoteId: number) => void
  onUpdateHeader?: (updatedHeader: IDebitNoteHd) => void
  onClearSelection?: () => void
  jobOrder?: IJobOrderHd
}

export default function DebitNoteDialog({
  open,
  taskId,
  debitNoteHd,
  isConfirmed,
  title = "Debit Note",
  description: _description = "Manage debit note details for this service.",
  // Note: onOpenChange is a standard Dialog prop from shadcn/ui - Next.js linter warning is a false positive
  // as this is a client component using a client component (Dialog)
  onOpenChange,
  onDeleteAction,
  onUpdateHeader,
  onClearSelection,
  jobOrder,
}: DebitNoteDialogProps) {
  const params = useParams()
  const companyId = params.companyId as string
  const { user } = useAuthStore()
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  const [debitNoteHdState, setDebitNoteHdState] = useState<IDebitNoteHd>(
    debitNoteHd ?? ({} as IDebitNoteHd)
  )

  const [details, setDetails] = useState<IDebitNoteDt[]>(
    debitNoteHd?.data_details ?? []
  )

  const detailsRef = useRef(details)

  // State for modal and selected debit note detail
  const [selectedDebitNoteDetail, setSelectedDebitNoteDetail] = useState<
    IDebitNoteDt | undefined
  >(undefined)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const queryClient = useQueryClient()

  // Update details when debitNoteHd changes
  useEffect(() => {
    setDetails(debitNoteHd?.data_details ?? [])
  }, [debitNoteHd])

  // Update ref when details change
  useEffect(() => {
    detailsRef.current = details
  }, [details])

  // State for delete confirmation (for debit note details)
  const [detailsDeleteConfirmation, setDetailsDeleteConfirmation] = useState<{
    isOpen: boolean
    debitNoteId: number | null
    debitNoteNo: string | null
  }>({
    isOpen: false,
    debitNoteId: null,
    debitNoteNo: null,
  })

  // State for main debit note delete confirmation
  const [mainDeleteConfirmation, setMainDeleteConfirmation] = useState<{
    isOpen: boolean
    debitNoteId: number | null
    debitNoteNo: string | null
  }>({
    isOpen: false,
    debitNoteId: null,
    debitNoteNo: null,
  })

  // State to trigger form reset
  const [shouldResetForm, setShouldResetForm] = useState<boolean>(false)

  // Reset the shouldResetForm flag after it's been used
  useEffect(() => {
    if (shouldResetForm) {
      setShouldResetForm(false)
    }
  }, [shouldResetForm])

  // State for bulk delete confirmation
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{
    isOpen: boolean
    selectedIds: string[]
    count: number
    itemsList?: string
  }>({
    isOpen: false,
    selectedIds: [],
    count: 0,
    itemsList: "",
  })

  // State for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
  }>({
    isOpen: false,
  })

  // State for bulk charges dialog
  const [bulkChargesDialog, setBulkChargesDialog] = useState<{
    isOpen: boolean
  }>({
    isOpen: false,
  })

  const saveMutation = usePersist<DebitNoteHdSchemaType>(
    `${JobOrder_DebitNote.add}`
  )

  const [selectedBulkItems, setSelectedBulkItems] = useState<IBulkChargeData[]>(
    []
  )

  // Ref to store current bulk charges data to avoid dependency issues
  const bulkChargesDataRef = useRef<IBulkChargeData[]>([])

  // Fetch bulk charges only when bulk charges dialog is opened
  const { data: bulkChargesResponse, isLoading: isBulkChargesLoading } =
    useQuery({
      queryKey: [`bulk-charges-${taskId}`],
      queryFn: async () =>
        await getData(
          `${JobOrder_DebitNote.getBulkDetails}/${taskId}/${jobOrder?.customerId}/${jobOrder?.portId}`
        ),
      enabled: bulkChargesDialog.isOpen,
      staleTime: 0.5 * 60 * 1000, // 0.5 minutes
      gcTime: 1 * 60 * 1000, // 1 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })

  // Update ref when bulk charges data is available
  useEffect(() => {
    if (bulkChargesResponse?.data) {
      console.log(
        "Updating bulkChargesDataRef with data:",
        bulkChargesResponse.data
      )
      bulkChargesDataRef.current = bulkChargesResponse.data
    }
  }, [bulkChargesResponse?.data])

  // Handler to open modal for creating a new debit note detail
  const handleCreateDebitNoteDetail = useCallback(() => {
    setModalMode("create")
    setSelectedDebitNoteDetail(undefined)
  }, [])

  // Handler to open modal for editing a debit note detail
  const handleEditDebitNoteDetail = useCallback(
    (debitNoteDetail: IDebitNoteDt) => {
      setModalMode("edit")
      setSelectedDebitNoteDetail(debitNoteDetail)
    },
    []
  )

  // Function to create or update service charge entry
  const createOrUpdateServiceChargeEntry = useCallback(
    (
      parentItemNo: number,
      chargeId: number,
      totAmtAftGst: number,
      serviceCharge: number,
      taskId: number,
      gstId: number,
      gstPercentage: number
    ) => {
      if (serviceCharge <= 0 || totAmtAftGst <= 0) return

      const isPrepaymentTask = taskId === 8 || taskId === 9
      const chargeRemarks = isPrepaymentTask
        ? `${serviceCharge}% Prepayment`
        : `${serviceCharge}% Service Charges`

      // Calculate service charge amount = totAmtAftGst * (serviceCharge / 100)
      const serviceChargeAmount = calculatePercentagecAmount(
        totAmtAftGst,
        serviceCharge,
        amtDec
      )
      const qty = 1
      const unitPrice = serviceChargeAmount // Since qty = 1, unitPrice = totAmt
      const totAmt = serviceChargeAmount
      const gstAmt = calculateMultiplierAmount(
        totAmt,
        gstPercentage / 100,
        amtDec
      )

      setDetails((prev) => {
        // Check if service charge entry already exists (by refItemNo)
        const existingServiceChargeIndex = prev.findIndex(
          (item) => item.refItemNo === parentItemNo && !item.isServiceCharge
        )

        if (existingServiceChargeIndex >= 0) {
          // Update existing service charge entry
          const updatedDetails = [...prev]
          updatedDetails[existingServiceChargeIndex] = {
            ...updatedDetails[existingServiceChargeIndex],
            chargeId: chargeId,
            qty: qty,
            unitPrice: unitPrice,
            totAmt: totAmt,
            gstId: gstId,
            gstPercentage: gstPercentage,
            gstAmt: gstAmt,
            totAmtAftGst: totAmt + gstAmt,
            remarks: chargeRemarks,
            isServiceCharge: false,
            serviceCharge: 0,
          }
          return updatedDetails
        } else {
          // Create new service charge entry
          const serviceChargeItem: IDebitNoteDt = {
            debitNoteId: debitNoteHdState?.debitNoteId ?? 0,
            debitNoteNo: debitNoteHdState?.debitNoteNo ?? "",
            itemNo: 0, // Will be set based on position
            refItemNo: parentItemNo, // Reference to parent item
            taskId: taskId,
            chargeId: chargeId,
            qty: qty,
            unitPrice: unitPrice,
            totLocalAmt: 0,
            totAmt: totAmt,
            gstId: gstId,
            gstPercentage: gstPercentage,
            gstAmt: gstAmt,
            totAmtAftGst: totAmt + gstAmt,
            remarks: chargeRemarks,
            editVersion: 0,
            isServiceCharge: false,
            serviceCharge: 0,
          }

          // Find the index of the parent item
          const parentIndex = prev.findIndex(
            (item) => item.itemNo === parentItemNo
          )

          if (parentIndex < 0) {
            // Parent item not found, add at the end
            const maxItemNo =
              prev.length > 0
                ? Math.max(...prev.map((item) => item.itemNo || 0))
                : 0
            serviceChargeItem.itemNo = maxItemNo + 1
            return [...prev, serviceChargeItem]
          }

          // Find the next itemNo after parent (check if there's already a service charge entry)
          const itemsAfterParent = prev.filter(
            (item) => item.itemNo > parentItemNo
          )
          const nextItemNo =
            itemsAfterParent.length > 0
              ? Math.min(...itemsAfterParent.map((item) => item.itemNo))
              : parentItemNo + 1

          // Check if nextItemNo is already a service charge for this parent
          const nextItem = prev.find((item) => item.itemNo === nextItemNo)
          if (nextItem && nextItem.refItemNo === parentItemNo) {
            // Update existing service charge at that position
            const updatedDetails = [...prev]
            updatedDetails[
              prev.findIndex((item) => item.itemNo === nextItemNo)
            ] = {
              ...serviceChargeItem,
              itemNo: nextItemNo,
            }
            return updatedDetails
          }

          // Insert service charge entry right after parent item
          // First, update itemNo for all items that come after the parent item
          const updatedDetails = prev.map((item) => {
            if (item.itemNo >= nextItemNo) {
              return {
                ...item,
                itemNo: item.itemNo + 1,
              }
            }
            return item
          })

          serviceChargeItem.itemNo = nextItemNo
          updatedDetails.splice(parentIndex + 1, 0, serviceChargeItem)

          return updatedDetails
        }
      })
    },
    [debitNoteHdState, amtDec]
  )

  // Handler to clone an existing debit note detail
  const handleCloneDebitNoteDetail = useCallback(
    (detail: IDebitNoteDt) => {
      const currentDetails = detailsRef.current ?? []

      const nextItemNo =
        currentDetails.length === 0
          ? 1
          : Math.max(...currentDetails.map((d) => d.itemNo || 0)) + 1

      const clonedDetail: IDebitNoteDt = {
        ...detail,
        itemNo: nextItemNo,
        refItemNo: 0,
        editVersion: 0,
      }

      setDetails((prev) => [...prev, clonedDetail])

      if (
        clonedDetail.isServiceCharge &&
        clonedDetail.serviceCharge > 0 &&
        clonedDetail.totAmtAftGst > 0
      ) {
        createOrUpdateServiceChargeEntry(
          nextItemNo,
          clonedDetail.chargeId ?? 0,
          clonedDetail.totAmt ?? 0,
          clonedDetail.serviceCharge,
          clonedDetail.taskId ?? 0,
          clonedDetail.gstId,
          clonedDetail.gstPercentage
        )
      }

      setModalMode("edit")
      setSelectedDebitNoteDetail(clonedDetail)
    },
    [createOrUpdateServiceChargeEntry]
  )

  // Handler to open modal for viewing a debit note detail
  const handleViewDebitNoteDetail = useCallback(
    (debitNoteDetail: IDebitNoteDt | null) => {
      if (!debitNoteDetail) return
      setModalMode("view")
      setSelectedDebitNoteDetail(debitNoteDetail)
    },
    []
  )

  // Function to remove service charge entry when isServiceCharge is unchecked
  const removeServiceChargeEntry = useCallback((parentItemNo: number) => {
    setDetails((prev) => {
      // Find and remove service charge entry
      const serviceChargeIndex = prev.findIndex(
        (item) => item.refItemNo === parentItemNo && !item.isServiceCharge
      )

      if (serviceChargeIndex < 0) {
        return prev // No service charge entry found
      }

      const serviceChargeItemNo = prev[serviceChargeIndex].itemNo

      // Remove the service charge entry
      const filtered = prev.filter(
        (item) => item.itemNo !== serviceChargeItemNo
      )

      // Rearrange itemNo to maintain sequential order
      return filtered.map((item, index) => ({
        ...item,
        itemNo: index + 1,
      }))
    })
  }, [])

  // Stable callbacks for DebitNoteForm to avoid extra re-renders when dialog re-renders
  const handleFormCancel = useCallback(() => {
    setSelectedDebitNoteDetail(undefined)
  }, [])
  const handleFormServiceChargeUpdate = useCallback(
    (
      itemNo: number,
      chargeId: number,
      totAmtAftGst: number,
      serviceCharge: number,
      taskId: number,
      gstId: number,
      gstPercentage: number
    ) => {
      if (itemNo > 0 && serviceCharge > 0 && totAmtAftGst > 0) {
        createOrUpdateServiceChargeEntry(
          itemNo,
          chargeId,
          totAmtAftGst,
          serviceCharge,
          taskId,
          gstId,
          gstPercentage
        )
      }
    },
    [createOrUpdateServiceChargeEntry]
  )

  // Handler for form submission (create or edit) - add to table directly
  const handleFormSubmit = useCallback(
    (data: DebitNoteDtSchemaType) => {
      if (modalMode === "edit" && selectedDebitNoteDetail) {
        // Update existing item
        const updatedItemNo = selectedDebitNoteDetail.itemNo
        const wasServiceCharge = selectedDebitNoteDetail.isServiceCharge
        const isNowServiceCharge = data.isServiceCharge ?? false

        setDetails((prev) =>
          prev.map((item) =>
            item.itemNo === selectedDebitNoteDetail.itemNo
              ? {
                  ...item,
                  chargeId: data.chargeId ?? 0,
                  qty: data.qty ?? 0,
                  unitPrice: data.unitPrice ?? 0,
                  totLocalAmt: data.totLocalAmt ?? 0,
                  totAmt: data.totAmt ?? 0,
                  gstId: data.gstId ?? 0,
                  gstPercentage: data.gstPercentage ?? 0,
                  gstAmt: data.gstAmt ?? 0,
                  totAmtAftGst: data.totAmtAftGst ?? 0,
                  remarks: data.remarks ?? "",
                  editVersion: data.editVersion ?? 0,
                  isServiceCharge: isNowServiceCharge,
                  serviceCharge: data.serviceCharge ?? 0,
                }
              : item
          )
        )

        // Handle service charge entry creation/update/removal
        if (
          isNowServiceCharge &&
          data.serviceCharge > 0 &&
          data.totAmtAftGst > 0
        ) {
          // Create or update service charge entry (use totAmtAftGst for % calculation)
          createOrUpdateServiceChargeEntry(
            updatedItemNo,
            data.chargeId ?? 0,
            data.totAmt ?? 0,
            data.serviceCharge,
            data.taskId ?? 0,
            data.gstId,
            data.gstPercentage
          )
        } else if (wasServiceCharge && !isNowServiceCharge) {
          // Remove service charge entry if unchecked
          removeServiceChargeEntry(updatedItemNo)
        } else if (
          wasServiceCharge &&
          isNowServiceCharge &&
          data.totAmtAftGst > 0
        ) {
          // Update existing service charge entry if totAmtAftGst changed
          createOrUpdateServiceChargeEntry(
            updatedItemNo,
            data.chargeId ?? 0,
            data.totAmt ?? 0,
            data.serviceCharge ?? 0,
            data.taskId ?? 0,
            data.gstId,
            data.gstPercentage
          )
        }

        // Reset form after successful update
        setSelectedDebitNoteDetail(undefined)
        setModalMode("create")
        setShouldResetForm(true)
      } else {
        // Add new item to local state directly (no confirmation needed for add)
        const currentItemNo = detailsRef.current?.length ?? 0
        const newItemNo = currentItemNo + 1

        const newItem: IDebitNoteDt = {
          debitNoteId: debitNoteHd?.debitNoteId ?? 0,
          debitNoteNo: debitNoteHd?.debitNoteNo ?? "",
          itemNo: newItemNo,
          refItemNo: 0, // New items don't have refItemNo initially
          taskId: data.taskId ?? 0,
          chargeId: data.chargeId ?? 0,
          qty: data.qty ?? 0,
          unitPrice: data.unitPrice ?? 0,
          totLocalAmt: data.totLocalAmt ?? 0,
          totAmt: data.totAmt ?? 0,
          gstId: data.gstId ?? 0,
          gstPercentage: data.gstPercentage ?? 0,
          gstAmt: data.gstAmt ?? 0,
          totAmtAftGst: data.totAmtAftGst ?? 0,
          remarks: data.remarks ?? "",
          editVersion: data.editVersion ?? 0,
          isServiceCharge: data.isServiceCharge ?? false,
          serviceCharge: data.serviceCharge ?? 0,
        }

        setDetails((prev) => [...prev, newItem])

        // Create service charge entry if needed (use totAmtAftGst for % calculation)
        if (
          data.isServiceCharge &&
          data.serviceCharge > 0 &&
          data.totAmtAftGst > 0
        ) {
          createOrUpdateServiceChargeEntry(
            newItemNo,
            data.chargeId ?? 0,
            data.totAmt ?? 0,
            data.serviceCharge,
            data.taskId ?? 0,
            data.gstId,
            data.gstPercentage
          )
        }

        // Reset form after successful addition
        setSelectedDebitNoteDetail(undefined)
        setModalMode("create")
        setShouldResetForm(true)
      }
    },
    [
      debitNoteHd,
      modalMode,
      selectedDebitNoteDetail,
      createOrUpdateServiceChargeEntry,
      removeServiceChargeEntry,
    ]
  )

  // Handler for deleting a debit note detail
  const handleDeleteDebitNoteDetail = useCallback((itemNo: string) => {
    if (!itemNo || !detailsRef.current) return

    const detailToDelete = detailsRef.current.find(
      (detail) => detail?.itemNo?.toString() === itemNo
    )

    if (!detailToDelete) return

    // Open delete confirmation dialog with detail information
    setDetailsDeleteConfirmation({
      isOpen: true,
      debitNoteId: detailToDelete.itemNo ?? 0,
      debitNoteNo: `Item ${detailToDelete.itemNo ?? 0}${detailToDelete.remarks ? ` - ${detailToDelete.remarks}` : ""}`,
    })
  }, [])

  const handleConfirmDeleteDetails = useCallback(() => {
    if (detailsDeleteConfirmation.debitNoteId) {
      const deletedItemNo = detailsDeleteConfirmation.debitNoteId
      setDetails((prev) => {
        // Cascade: also delete rows whose refItemNo points to the deleted item (e.g. Prepayment rows)
        const childItemNos = new Set(
          prev
            .filter((item) => (item.refItemNo ?? 0) === deletedItemNo)
            .map((item) => item.itemNo)
        )
        const toDelete = new Set<number>([deletedItemNo, ...childItemNos])
        const filtered = prev.filter((item) => !toDelete.has(item.itemNo ?? 0))
        // Renumber and update refItemNo so it points to new itemNos
        const oldToNew = new Map<number, number>()
        filtered.forEach((item, index) => {
          const oldNo = item.itemNo ?? 0
          if (oldNo) oldToNew.set(oldNo, index + 1)
        })
        return filtered.map((item, index) => {
          const newItemNo = index + 1
          const refItemNo =
            (item.refItemNo ?? 0) > 0 ? (oldToNew.get(item.refItemNo!) ?? 0) : 0
          return { ...item, itemNo: newItemNo, refItemNo }
        })
      })
      setDetailsDeleteConfirmation({
        isOpen: false,
        debitNoteId: null,
        debitNoteNo: null,
      })
    }
  }, [detailsDeleteConfirmation])

  // Handler for saving the debit note
  const handleSaveDebitNote = useCallback(async () => {
    try {
      if (!debitNoteHdState?.debitNoteId) {
        console.error("Debit note header not found")
        return
      }

      // Calculate totals from details with null safety
      const totalAmount = details.reduce(
        (sum, detail) => sum + (detail?.totAmt ?? 0),
        0
      )
      const totalGstAmount = details.reduce(
        (sum, detail) => sum + (detail?.gstAmt ?? 0),
        0
      )
      const totalAfterGst = details.reduce(
        (sum, detail) => sum + (detail?.totAmtAftGst ?? 0),
        0
      )

      // Create the complete debit note header with details (null-safe)
      // Format debitNoteDate for API submission
      const debitNoteDateValue = debitNoteHdState?.debitNoteDate ?? new Date()
      const formattedDebitNoteDate = formatDateForApi(debitNoteDateValue) || ""

      const newDebitNoteHd: DebitNoteHdSchemaType = {
        debitNoteId: debitNoteHdState?.debitNoteId ?? 0,
        debitNoteNo: debitNoteHdState?.debitNoteNo ?? "",
        jobOrderId: debitNoteHdState?.jobOrderId ?? 0,
        debitNoteDate: formattedDebitNoteDate,
        itemNo: debitNoteHdState?.itemNo ?? 0,
        taskId: debitNoteHdState?.taskId ?? 0,
        chargeId: debitNoteHdState?.chargeId ?? 0,
        currencyId: debitNoteHdState?.currencyId ?? 0,
        exhRate: debitNoteHdState?.exhRate ?? 1,
        glId: debitNoteHdState?.glId ?? 0,
        taxableAmt: debitNoteHdState?.taxableAmt ?? 0,
        nonTaxableAmt: debitNoteHdState?.nonTaxableAmt ?? 0,
        editVersion: debitNoteHdState?.editVersion ?? 0,
        totAmt: totalAmount,
        gstAmt: totalGstAmount,
        totAmtAftGst: totalAfterGst,
        isLocked: debitNoteHdState?.isLocked ?? false,
        data_details: details ?? [], // Include all details with null safety
      }

      // Save the complete debit note (header + details) using the new API
      const response = await saveMutation.mutateAsync(newDebitNoteHd)

      if (response.result > 0) {
        // Close the save confirmation dialog
        setSaveConfirmation({ isOpen: false })

        // Clear selections FIRST to prevent errors when accessing item.id on undefined items
        if (onClearSelection) {
          onClearSelection()
        }

        console.log("debit note response", response)

        // Update local state with response data if available
        if (response.data && "data_details" in response.data) {
          const responseData = response.data as unknown as {
            data_details: IDebitNoteDt[]
          } & IDebitNoteHd

          console.log("debit note response data", responseData)

          setDebitNoteHdState(responseData as unknown as IDebitNoteHd)

          // Update details
          setDetails(responseData.data_details as unknown as IDebitNoteDt[])

          // Update header if callback is provided
          if (onUpdateHeader) {
            onUpdateHeader(responseData)
          }
        }

        // Invalidate queries with a small delay to allow clear selection to complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
              queryKey: [
                JobOrder_DebitNote.getDetails,
                debitNoteHdState.jobOrderId,
                taskId,
                debitNoteHdState.debitNoteId,
              ],
            })
            queryClient.invalidateQueries({ queryKey: ["debit-note-details"] })
            queryClient.invalidateQueries({ queryKey: ["portExpenses"] })
            queryClient.invalidateQueries({ queryKey: ["taskCount"] })
          }, 50)
        })
      }
    } catch (error) {
      console.error("Error saving debit note:", error)
      alert("Error saving debit note. Please try again.")
    }
  }, [
    debitNoteHdState,
    details,
    saveMutation,
    queryClient,
    taskId,
    onUpdateHeader,
    onClearSelection,
  ])

  // Handler for deleting the entire debit note - shows confirmation first
  const handleDeleteDebitNote = useCallback(() => {
    if (debitNoteHdState?.debitNoteId) {
      setMainDeleteConfirmation({
        isOpen: true,
        debitNoteId: debitNoteHdState.debitNoteId,
        debitNoteNo: debitNoteHdState.debitNoteNo,
      })
    }
  }, [debitNoteHdState])

  // Handler for confirmed main debit note deletion
  const handleConfirmMainDeleteMain = useCallback(() => {
    if (mainDeleteConfirmation.debitNoteId && onDeleteAction) {
      onDeleteAction(mainDeleteConfirmation.debitNoteId)
      setMainDeleteConfirmation({
        isOpen: false,
        debitNoteId: null,
        debitNoteNo: null,
      })
    }
  }, [mainDeleteConfirmation, onDeleteAction])

  // Handler for bulk delete of debit note details
  const handleBulkDeleteDebitNoteDetails = useCallback(
    (selectedIds: string[]) => {
      if (!selectedIds?.length || !detailsRef.current) return

      // Get details for selected items
      const selectedDetails = detailsRef.current.filter(
        (detail) =>
          detail?.itemNo && selectedIds.includes(detail.itemNo.toString())
      )

      // Create numbered list of items with remarks
      const itemsList = selectedDetails
        .map((detail, index) => {
          const itemInfo = `Item ${detail?.itemNo ?? 0}`
          const remarks = detail?.remarks?.trim()
          return `${index + 1}. ${itemInfo}${remarks ? ` - ${remarks}` : ""}`
        })
        .join("<br/>")

      setBulkDeleteConfirmation({
        isOpen: true,
        selectedIds,
        count: selectedIds.length,
        itemsList, // Add the formatted list
      })
    },
    []
  )

  // Handler for confirmed bulk delete
  const handleConfirmBulkDeleteBulk = useCallback(() => {
    if (!bulkDeleteConfirmation.selectedIds.length) {
      return
    }

    setDetails((prev) => {
      const selectedSet = new Set(
        bulkDeleteConfirmation.selectedIds.map((id) => Number(id))
      )
      // Cascade: also delete rows whose refItemNo points to any selected (deleted) item
      const toDelete = new Set(selectedSet)
      let added: boolean
      do {
        added = false
        for (const item of prev) {
          const ref = item.refItemNo ?? 0
          if (ref > 0 && toDelete.has(ref) && !toDelete.has(item.itemNo ?? 0)) {
            toDelete.add(item.itemNo ?? 0)
            added = true
          }
        }
      } while (added)

      const filtered = prev.filter((item) => !toDelete.has(item.itemNo ?? 0))
      // Renumber and update refItemNo so it points to new itemNos
      const oldToNew = new Map<number, number>()
      filtered.forEach((item, index) => {
        const oldNo = item.itemNo ?? 0
        if (oldNo) oldToNew.set(oldNo, index + 1)
      })
      return filtered.map((item, index) => {
        const newItemNo = index + 1
        const refItemNo =
          (item.refItemNo ?? 0) > 0 ? (oldToNew.get(item.refItemNo!) ?? 0) : 0
        return { ...item, itemNo: newItemNo, refItemNo }
      })
    })

    setBulkDeleteConfirmation({
      isOpen: false,
      selectedIds: [],
      count: 0,
    })
  }, [bulkDeleteConfirmation])

  // Handler for refreshing the table data
  const handleRefresh = useCallback(() => {
    // Reset the form state
    setSelectedDebitNoteDetail(undefined)
    setShouldResetForm(true)
  }, [])

  // Handler for data reordering
  const handleDataReorder = useCallback((newData: IDebitNoteDt[]) => {
    if (!newData?.length) return

    // Build old itemNo -> new itemNo map so refItemNo stays valid
    const oldToNew = new Map<number, number>()
    newData.forEach((item, index) => {
      const oldNo = item.itemNo ?? 0
      if (oldNo) oldToNew.set(oldNo, index + 1)
    })
    const updatedData = newData.map((item, index) => {
      const newItemNo = index + 1
      const refItemNo =
        (item.refItemNo ?? 0) > 0 ? (oldToNew.get(item.refItemNo!) ?? 0) : 0
      return { ...item, itemNo: newItemNo, refItemNo }
    })

    setDetails(updatedData)
  }, [])

  // Handler for adding bulk charges
  const handleAddBulkCharges = useCallback(
    (selectedItems: IBulkChargeData[]) => {
      if (!selectedItems?.length) return

      // Convert bulk charges to debit note details
      const newDetails: IDebitNoteDt[] = selectedItems.map((item, index) => ({
        debitNoteId: debitNoteHdState?.debitNoteId ?? 0,
        debitNoteNo: debitNoteHdState?.debitNoteNo ?? "",
        itemNo: (detailsRef.current?.length ?? 0) + index + 1,
        taskId: taskId ?? 0,
        chargeId: item?.chargeId ?? 0,
        qty: 1, // Default quantity
        unitPrice: item?.basicRate ?? 0, // Default unit price
        totLocalAmt: 0,
        totAmt: item?.basicRate ?? 0,
        gstId: 0,
        gstPercentage: 0,
        gstAmt: 0,
        totAmtAftGst: item?.basicRate ?? 0,
        remarks: item?.remarks ?? item?.chargeName ?? "",
        editVersion: 0,
        isServiceCharge: false,
        serviceCharge: 0,
      }))

      setDetails((prev) => [...(prev ?? []), ...newDetails])
    },
    [debitNoteHdState, taskId]
  )

  // Handler for bulk dialog open change
  const handleBulkDialogOpenChange = useCallback((isOpen: boolean) => {
    setBulkChargesDialog({ isOpen })
    if (!isOpen) {
      setSelectedBulkItems([]) // Clear selections when dialog closes
    }
  }, [])

  // Handler for canceling bulk charges dialog
  const handleCancelBulk = useCallback(() => {
    handleBulkDialogOpenChange(false)
  }, [handleBulkDialogOpenChange])

  // Handler for bulk selection change
  const handleBulkSelectionChange = useCallback(
    (selectedIds: string[]) => {
      if (!selectedIds?.length) {
        setSelectedBulkItems([])
        return
      }

      console.log("selectedIds handleBulkSelectionChange", selectedIds)
      console.log("bulkChargesDataRef.current", bulkChargesDataRef.current)

      // Only update state if selection actually changed
      const currentBulkData = bulkChargesDataRef.current ?? []
      const selectedItems = currentBulkData.filter(
        (item: IBulkChargeData) =>
          item?.chargeId && selectedIds.includes(item.chargeId.toString())
      )
      console.log("selectedItems after filter", selectedItems)

      // Only update state if the selection actually changed
      setSelectedBulkItems((prevItems) => {
        // Compare lengths first for quick check
        if ((prevItems?.length ?? 0) !== selectedItems.length) {
          return selectedItems
        }

        // Compare actual items
        const prevIds = (prevItems ?? [])
          .map((item) => item?.chargeId?.toString() ?? "")
          .sort()
        const newIds = selectedItems
          .map((item) => item?.chargeId?.toString() ?? "")
          .sort()

        // Only update if the selection actually changed
        if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
          return selectedItems
        }

        // No change, return previous state to prevent re-render
        return prevItems ?? []
      })
    },
    [] // No dependencies needed since we use ref
  )

  // Handler for adding selected bulk items
  const handleAddSelectedBulk = useCallback(() => {
    handleAddBulkCharges(selectedBulkItems)
    handleBulkDialogOpenChange(false)
  }, [selectedBulkItems, handleAddBulkCharges, handleBulkDialogOpenChange])

  // Calculate summary totals (memoized so DebitNoteForm doesn't re-render on every dialog render)
  const summaryTotals = useMemo(
    () => calculateDebitNoteSummary(details ?? [], { amtDec: 2 }),
    [details]
  )

  // Handle Print Debit Note Report
  const handlePrint = useCallback(() => {
    if (
      !debitNoteHdState ||
      !debitNoteHdState.debitNoteId ||
      debitNoteHdState.debitNoteId === 0
    ) {
      toast.error("Please select a debit note to print")
      return
    }

    const debitNoteId = debitNoteHdState.debitNoteId?.toString() || "0"
    const debitNoteNo = debitNoteHdState.debitNoteNo || ""
    const jobOrderId = debitNoteHdState.jobOrderId?.toString() || "0"

    // Determine report file by taskId: import, export, equipment used, or default
    let reportFile = ""
    if (taskId === 8) {
      reportFile = "debitnote/DebitNote_Import.trdp"
    } else if (taskId === 9) {
      reportFile = "debitnote/DebitNote_Export.trdp"
    } else if (taskId === 3) {
      reportFile = "debitnote/DebitNote_Used.trdp"
    } else {
      reportFile = "debitnote/DebitNote.trdp"
    }

    console.log("reportFile", reportFile)
    console.log("taskId", taskId)
    const reportParams: Record<string, string | number> = {
      companyId: companyId,
      debitNoteId: debitNoteId,
      debitNoteNo: debitNoteNo,
      jobOrderId: jobOrderId,
      taskId: taskId,
      amtDec: amtDec,
      locAmtDec: locAmtDec,
      userName: user?.userName || "",
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage
    const reportData = {
      reportFile: reportFile,
      parameters: reportParams,
    }

    try {
      localStorage.setItem(
        `report_window_${companyId}`,
        JSON.stringify(reportData)
      )

      // Open in a new window (not tab) with specific features
      const windowFeatures =
        "width=1200,height=800,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes"
      const viewerUrl = `/${companyId}/reports/window`
      window.open(viewerUrl, "_blank", windowFeatures)
    } catch (error) {
      console.error("Error opening report:", error)
      toast.error("Failed to open report")
    }
  }, [debitNoteHdState, companyId, taskId, amtDec, locAmtDec, user])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] w-[90vw] max-w-none! overflow-hidden"
        onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader className="border-b pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <DialogTitle className="text-2xl font-bold">
                {title} :{" "}
                <Badge
                  variant="secondary"
                  className="bg-orange-100 px-2 py-0.5 text-xs whitespace-nowrap text-orange-800 hover:bg-orange-200"
                >
                  {debitNoteHdState?.taskName || "N/A"}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 px-2 py-0.5 text-xs whitespace-nowrap text-green-800 hover:bg-green-200"
                  >
                    {debitNoteHdState?.debitNoteNo || "N/A"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 px-2 py-0.5 text-xs whitespace-nowrap text-primary hover:bg-blue-200"
                  >
                    {debitNoteHdState?.debitNoteDate
                      ? (() => {
                          const dateValue = debitNoteHdState.debitNoteDate
                          const date =
                            dateValue instanceof Date
                              ? dateValue
                              : parseDate(
                                  typeof dateValue === "string"
                                    ? dateValue
                                    : String(dateValue)
                                ) || new Date(dateValue)
                          return date && !isNaN(date.getTime())
                            ? format(date, dateFormat)
                            : "N/A"
                        })()
                      : "N/A"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 px-2 py-0.5 text-xs whitespace-nowrap text-purple-800 hover:bg-purple-200"
                  >
                    {debitNoteHdState?.chargeName || "N/A"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-red-100 px-2 py-0.5 text-xs whitespace-nowrap text-red-800 hover:bg-red-200"
                  >
                    v[{debitNoteHdState?.editVersion}]
                  </Badge>
                </div>
              </DialogDescription>
            </div>
            <div className="mr-10 flex flex-nowrap items-center gap-2 overflow-x-auto">
              {/* Action Buttons */}
              <Button
                size="sm"
                variant="default"
                disabled={isConfirmed || !debitNoteHdState?.debitNoteId}
                onClick={() => setSaveConfirmation({ isOpen: true })}
                className="h-8 px-2"
                tabIndex={100}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!debitNoteHdState?.debitNoteId}
                onClick={handlePrint}
                className="h-8 px-2"
                tabIndex={101}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isConfirmed}
                onClick={() => setBulkChargesDialog({ isOpen: true })}
                className="h-8 px-2"
                tabIndex={102}
              >
                <ListChecks className="mr-2 h-4 w-4" />
                Bulk Charges
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isConfirmed || !debitNoteHdState?.debitNoteId}
                onClick={handleDeleteDebitNote}
                className="ml-4 h-8 px-2"
                tabIndex={103}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="@container">
          {/* Form Section */}
          <div className="mb-2">
            <DebitNoteForm
              key={
                modalMode === "edit" || modalMode === "view"
                  ? `edit-${selectedDebitNoteDetail?.itemNo ?? 0}-${selectedDebitNoteDetail?.gstId ?? 0}`
                  : "create"
              }
              debitNoteHd={debitNoteHdState}
              editingDetail={
                modalMode === "edit" || modalMode === "view"
                  ? selectedDebitNoteDetail
                  : undefined
              }
              existingDetails={details}
              submitAction={handleFormSubmit}
              onCancelAction={handleFormCancel}
              isSubmitting={false}
              isConfirmed={isConfirmed}
              taskId={taskId}
              companyId={debitNoteHdState?.companyId || 0}
              onChargeChange={() => {}}
              summaryTotals={summaryTotals}
              currencyCode={jobOrder?.currencyCode}
              baseCurrencyCode={jobOrder?.baseCurrencyCode}
              onServiceChargeUpdate={handleFormServiceChargeUpdate}
              shouldResetForm={shouldResetForm}
              jobData={jobOrder}
            />
          </div>

          {/* Table Section */}
          <div className="">
            <div className="p-0">
              <DebitNoteTable
                data={details}
                onSelect={handleViewDebitNoteDetail}
                onEditAction={handleEditDebitNoteDetail}
                onCloneAction={handleCloneDebitNoteDetail}
                onDeleteAction={handleDeleteDebitNoteDetail}
                onBulkDeleteAction={handleBulkDeleteDebitNoteDetails}
                onCreateAction={handleCreateDebitNoteDetail}
                onRefreshAction={handleRefresh}
                onFilterChange={() => {}}
                onDataReorder={handleDataReorder}
                moduleId={taskId}
                transactionId={taskId}
                isConfirmed={isConfirmed}
              />
            </div>
          </div>

          {/* Delete Confirmation Dialog for Main Debit Note */}
          <DeleteConfirmation
            open={mainDeleteConfirmation.isOpen}
            onOpenChange={(isOpen) =>
              setMainDeleteConfirmation((prev) => ({ ...prev, isOpen }))
            }
            title="Delete Debit Note"
            description="This action cannot be undone. This will permanently delete the entire debit note and all its details from our servers."
            itemName={mainDeleteConfirmation.debitNoteNo || ""}
            onConfirm={handleConfirmMainDeleteMain}
            onCancelAction={() =>
              setMainDeleteConfirmation({
                isOpen: false,
                debitNoteId: null,
                debitNoteNo: null,
              })
            }
            isDeleting={false}
          />

          {/* Delete Confirmation Dialog for Debit Note Detail */}
          <DeleteConfirmation
            open={detailsDeleteConfirmation.isOpen}
            onOpenChange={(isOpen) =>
              setDetailsDeleteConfirmation((prev) => ({ ...prev, isOpen }))
            }
            title="Delete Debit Note Detail"
            description="This action cannot be undone. This will permanently delete the debit note detail from our servers."
            itemName={detailsDeleteConfirmation.debitNoteNo || ""}
            onConfirm={handleConfirmDeleteDetails}
            onCancelAction={() =>
              setDetailsDeleteConfirmation({
                isOpen: false,
                debitNoteId: null,
                debitNoteNo: null,
              })
            }
            isDeleting={false}
          />

          {/* Bulk Delete Confirmation Dialog */}
          <DeleteConfirmation
            open={bulkDeleteConfirmation.isOpen}
            onOpenChange={(isOpen) =>
              setBulkDeleteConfirmation((prev) => ({ ...prev, isOpen }))
            }
            title="Delete Selected Items"
            description="This action cannot be undone. This will permanently delete the selected debit note details from our servers."
            itemName={
              bulkDeleteConfirmation.itemsList ||
              `${bulkDeleteConfirmation.count} selected item${bulkDeleteConfirmation.count !== 1 ? "s" : ""}`
            }
            onConfirm={handleConfirmBulkDeleteBulk}
            onCancelAction={() =>
              setBulkDeleteConfirmation({
                isOpen: false,
                selectedIds: [],
                count: 0,
                itemsList: "",
              })
            }
            isDeleting={false}
          />

          {/* Save Confirmation Dialog */}
          <SaveConfirmation
            open={saveConfirmation.isOpen}
            onOpenChange={(isOpen) =>
              setSaveConfirmation((prev) => ({ ...prev, isOpen }))
            }
            title="Save Debit Note"
            operationType={"update"}
            itemName={`Debit Note ${debitNoteHdState?.debitNoteNo || ""}`}
            onConfirm={handleSaveDebitNote}
            onCancelAction={() =>
              setSaveConfirmation({
                isOpen: false,
              })
            }
            isSaving={saveMutation.isPending}
          />

          {/* Bulk Charges Dialog */}
          <Dialog
            open={bulkChargesDialog.isOpen}
            onOpenChange={handleBulkDialogOpenChange}
          >
            <DialogContent className="max-h-[90vh] w-[70vw] max-w-none! overflow-y-auto">
              <DialogHeader className="border-b pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                      Bulk Charges
                      <div className="flex gap-2">
                        {jobOrder?.customerName && (
                          <Badge variant="secondary" className="text-sm">
                            {jobOrder.customerName}
                          </Badge>
                        )}
                        {jobOrder?.portName && (
                          <Badge variant="outline" className="text-sm">
                            {jobOrder.portName}
                          </Badge>
                        )}
                        {TaskIdToName[taskId] && (
                          <Badge variant="default" className="text-sm">
                            {TaskIdToName[taskId]}
                          </Badge>
                        )}
                      </div>
                    </DialogTitle>
                    <DialogDescription>
                      Select charges to add to the debit note.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-hidden">
                <BulkDebitNoteTable
                  data={bulkChargesResponse?.data || []}
                  isLoading={isBulkChargesLoading}
                  moduleId={taskId}
                  transactionId={taskId}
                  isConfirmed={isConfirmed}
                  onBulkSelectionChange={handleBulkSelectionChange}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    {selectedBulkItems?.length ?? 0} item(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelBulk}
                      disabled={isConfirmed}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddSelectedBulk}
                      disabled={
                        isConfirmed || (selectedBulkItems?.length ?? 0) === 0
                      }
                    >
                      Add Selected Items ({selectedBulkItems?.length ?? 0})
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}
