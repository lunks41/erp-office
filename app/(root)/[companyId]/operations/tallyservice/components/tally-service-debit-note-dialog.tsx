"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  calculateMultiplierAmount,
  calculatePercentagecAmount,
} from "@/helpers/account"
import {
  calculateDebitNoteSummary,
  debitNoteDetailsDifferFromSnapshot,
  findDebitNoteGstMismatches,
  findDebitNoteHeaderInternalMismatch,
  findDebitNoteHeaderTotalMismatches,
  findDebitNoteLineTotalMismatches,
  normalizeDebitNoteDetails,
  normalizeDebitNoteLineTotals,
  readDebitNoteDetailsFromHd,
  readDebitNoteHeaderAmounts,
} from "@/helpers/debit-note-calculations"
import {
  openDebitNoteReportWindow,
  TALLY_DEBIT_NOTE_REPORT_FILE,
} from "@/helpers/debit-note-report"
import { IDebitNoteDt, IDebitNoteHd } from "@/interfaces/checklist"
import { ITallyService } from "@/interfaces/tally-service"
import { DebitNoteDtSchemaType } from "@/schemas/checklist"
import { TallyDebitNoteHdSchemaType } from "@/schemas/tally-service"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Printer, Save, Trash } from "lucide-react"
import { toast } from "sonner"

import { TallyService_DebitNote } from "@/lib/api-routes"
import { formatDateForApi, parseDate } from "@/lib/date-utils"
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

import { toTallyDocumentId } from "./tally-service-utils"
import DebitNoteForm from "./tally-service-debit-note-form"
import DebitNoteTable from "./tally-service-debit-note-table"

interface DebitNoteDialogProps {
  open: boolean
  taskId: number
  debitNoteHd?: IDebitNoteHd
  isConfirmed?: boolean
  title?: string
  description?: string
  onOpenChangeAction: (open: boolean) => void
  onDeleteAction?: (debitNoteId: number) => void
  onUpdateHeader?: (updatedHeader: IDebitNoteHd) => void
  onClearSelection?: () => void
  tallyService: ITallyService
}

function normalizeTallyDebitNoteHd(data: IDebitNoteHd): IDebitNoteHd {
  return {
    ...data,
    tallyServiceId: data.tallyServiceId ?? 0,
  }
}

export default function DebitNoteDialog({
  open,
  taskId,
  debitNoteHd,
  isConfirmed,
  title = "Debit Note",
  description: _description = "Manage debit note details for this service.",
  onOpenChangeAction,
  onDeleteAction,
  onUpdateHeader,
  onClearSelection,
  tallyService,
}: DebitNoteDialogProps) {
  const tallyGstContext = useMemo(
    () => ({
      gstId: tallyService.gstId ?? 0,
      gstPercentage: tallyService.gstPercentage ?? 0,
      currencyCode: tallyService.currencyCode ?? "",
    }),
    [tallyService]
  )
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

  const [details, setDetails] = useState<IDebitNoteDt[]>(() =>
    normalizeDebitNoteDetails(readDebitNoteDetailsFromHd(debitNoteHd), {
      amtDec,
    })
  )

  /** Last saved snapshot from server (used to detect stale totals vs local edits). */
  const [savedSnapshot, setSavedSnapshot] = useState<IDebitNoteDt[]>(() =>
    readDebitNoteDetailsFromHd(debitNoteHd).map((row) => ({ ...row }))
  )

  /** Header amounts as returned from the server (before any local header updates). */
  const [savedHeaderSnapshot, setSavedHeaderSnapshot] = useState(() =>
    readDebitNoteHeaderAmounts(debitNoteHd)
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

  // Sync from server when debitNoteHd changes; normalize display lines only
  useEffect(() => {
    if (!debitNoteHd) return

    const mappedHd = normalizeTallyDebitNoteHd(debitNoteHd)

    setDebitNoteHdState(mappedHd)

    const raw = readDebitNoteDetailsFromHd(mappedHd)
    const headerAmounts = readDebitNoteHeaderAmounts(mappedHd)
    setSavedSnapshot(raw.map((row) => ({ ...row })))
    setSavedHeaderSnapshot(headerAmounts)
    setDetails(normalizeDebitNoteDetails(raw, { amtDec }))
  }, [debitNoteHd, amtDec])

  const lineTotalMismatches = useMemo(
    () => findDebitNoteLineTotalMismatches(savedSnapshot, { amtDec }),
    [savedSnapshot, amtDec]
  )

  const headerInternalMismatch = useMemo(
    () => findDebitNoteHeaderInternalMismatch(savedHeaderSnapshot, { amtDec }),
    [savedHeaderSnapshot, amtDec]
  )

  const headerTotalMismatches = useMemo(
    () =>
      findDebitNoteHeaderTotalMismatches(savedHeaderSnapshot, savedSnapshot, {
        amtDec,
      }),
    [savedHeaderSnapshot, savedSnapshot, amtDec]
  )

  const hasUnsavedLocalChanges = useMemo(
    () =>
      debitNoteDetailsDifferFromSnapshot(details, savedSnapshot, { amtDec }),
    [details, savedSnapshot, amtDec]
  )

  const gstMismatches = useMemo(
    () => findDebitNoteGstMismatches(details ?? [], { amtDec }),
    [details, amtDec]
  )

  const hasPersistedTotalsIssue = useMemo(
    () =>
      lineTotalMismatches.length > 0 ||
      gstMismatches.length > 0 ||
      headerInternalMismatch !== null ||
      headerTotalMismatches.length > 0,
    [
      lineTotalMismatches.length,
      gstMismatches.length,
      headerInternalMismatch,
      headerTotalMismatches.length,
    ]
  )

  const showTotalsCorrectionWarning = useMemo(
    () => hasPersistedTotalsIssue || (!isConfirmed && hasUnsavedLocalChanges),
    [hasPersistedTotalsIssue, isConfirmed, hasUnsavedLocalChanges]
  )

  const highlightSaveAction = showTotalsCorrectionWarning && !isConfirmed

  const saveRequiredMessage = useMemo(() => {
    if (isConfirmed) {
      return "You have changed some items but this job is confirmed. Unconfirm to save; otherwise updated data will be lost."
    }
    return "You have changed some items. Please make sure to save; otherwise updated data will be lost."
  }, [isConfirmed])

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

  const saveMutation = usePersist<TallyDebitNoteHdSchemaType>(
    TallyService_DebitNote.add
  )

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
          clonedDetail.totAmtAftGst ?? 0,
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
      const normalized = normalizeDebitNoteLineTotals(data, { amtDec })

      if (modalMode === "edit" && selectedDebitNoteDetail) {
        // Update existing item
        const updatedItemNo = selectedDebitNoteDetail.itemNo
        const wasServiceCharge = selectedDebitNoteDetail.isServiceCharge
        const isNowServiceCharge = normalized.isServiceCharge ?? false

        setDetails((prev) =>
          prev.map((item) =>
            item.itemNo === selectedDebitNoteDetail.itemNo
              ? {
                  ...item,
                  chargeId: normalized.chargeId ?? 0,
                  glId: normalized.glId ?? 0,
                  glCode: normalized.glCode ?? "",
                  glName: normalized.glName ?? "",
                  qty: normalized.qty ?? 0,
                  unitPrice: normalized.unitPrice ?? 0,
                  totLocalAmt: normalized.totLocalAmt ?? 0,
                  totAmt: normalized.totAmt ?? 0,
                  gstId: normalized.gstId ?? 1,
                  gstPercentage: normalized.gstPercentage ?? 0,
                  gstAmt: normalized.gstAmt ?? 0,
                  totAmtAftGst: normalized.totAmtAftGst ?? 0,
                  remarks: normalized.remarks ?? "",
                  editVersion: normalized.editVersion ?? 0,
                  isServiceCharge: isNowServiceCharge,
                  serviceCharge: normalized.serviceCharge ?? 0,
                }
              : item
          )
        )

        // Handle service charge entry creation/update/removal
        if (
          isNowServiceCharge &&
          normalized.serviceCharge > 0 &&
          normalized.totAmtAftGst > 0
        ) {
          createOrUpdateServiceChargeEntry(
            updatedItemNo,
            normalized.chargeId ?? 0,
            normalized.totAmtAftGst ?? 0,
            normalized.serviceCharge,
            normalized.taskId ?? 0,
            normalized.gstId,
            normalized.gstPercentage
          )
        } else if (wasServiceCharge && !isNowServiceCharge) {
          removeServiceChargeEntry(updatedItemNo)
        } else if (
          wasServiceCharge &&
          isNowServiceCharge &&
          normalized.totAmtAftGst > 0
        ) {
          createOrUpdateServiceChargeEntry(
            updatedItemNo,
            normalized.chargeId ?? 0,
            normalized.totAmtAftGst ?? 0,
            normalized.serviceCharge ?? 0,
            normalized.taskId ?? 0,
            normalized.gstId,
            normalized.gstPercentage
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
          taskId: normalized.taskId ?? 0,
          chargeId: normalized.chargeId ?? 0,
          glId: normalized.glId ?? 0,
          glCode: normalized.glCode ?? "",
          glName: normalized.glName ?? "",
          qty: normalized.qty ?? 0,
          unitPrice: normalized.unitPrice ?? 0,
          totLocalAmt: normalized.totLocalAmt ?? 0,
          totAmt: normalized.totAmt ?? 0,
          gstId: normalized.gstId ?? 1,
          gstPercentage: normalized.gstPercentage ?? 0,
          gstAmt: normalized.gstAmt ?? 0,
          totAmtAftGst: normalized.totAmtAftGst ?? 0,
          remarks: normalized.remarks ?? "",
          editVersion: normalized.editVersion ?? 0,
          isServiceCharge: normalized.isServiceCharge ?? false,
          serviceCharge: normalized.serviceCharge ?? 0,
        }

        setDetails((prev) => [...prev, newItem])

        if (
          normalized.isServiceCharge &&
          normalized.serviceCharge > 0 &&
          normalized.totAmtAftGst > 0
        ) {
          createOrUpdateServiceChargeEntry(
            newItemNo,
            normalized.chargeId ?? 0,
            normalized.totAmtAftGst ?? 0,
            normalized.serviceCharge,
            normalized.taskId ?? 0,
            normalized.gstId,
            normalized.gstPercentage
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
      amtDec,
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

      const normalizedDetails = normalizeDebitNoteDetails(details ?? [], {
        amtDec,
      })
      const { totalAmount, vatAmount, totalAfterVat } =
        calculateDebitNoteSummary(normalizedDetails, { amtDec })

      // Create the complete debit note header with details (null-safe)
      // Format debitNoteDate for API submission
      const debitNoteDateValue = debitNoteHdState?.debitNoteDate ?? new Date()
      const formattedDebitNoteDate = formatDateForApi(debitNoteDateValue) || ""

      setDetails(normalizedDetails)
      setDebitNoteHdState((prev) => ({
        ...prev,
        totAmt: totalAmount,
        gstAmt: vatAmount,
        totAmtAftGst: totalAfterVat,
      }))

      const newDebitNoteHd: TallyDebitNoteHdSchemaType = {
        debitNoteId: debitNoteHdState?.debitNoteId ?? 0,
        debitNoteNo: debitNoteHdState?.debitNoteNo ?? "",
        tallyServiceId: Number(toTallyDocumentId(tallyService.tallyServiceId)),
        debitNoteDate: formattedDebitNoteDate,
        itemNo: debitNoteHdState?.itemNo ?? 0,
        chargeId: debitNoteHdState?.chargeId ?? 0,
        currencyId: debitNoteHdState?.currencyId ?? 0,
        exhRate: debitNoteHdState?.exhRate ?? 1,
        glId: debitNoteHdState?.glId ?? 0,
        taxableAmt: debitNoteHdState?.taxableAmt ?? 0,
        nonTaxableAmt: debitNoteHdState?.nonTaxableAmt ?? 0,
        editVersion: debitNoteHdState?.editVersion ?? 0,
        totAmt: totalAmount,
        gstAmt: vatAmount,
        totAmtAftGst: totalAfterVat,
        isLocked: debitNoteHdState?.isLocked ?? false,
        data_details: normalizedDetails,
      }

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
          const responseData = normalizeTallyDebitNoteHd(
            response.data as unknown as IDebitNoteHd
          )

          const persistedDetails = normalizeDebitNoteDetails(
            (responseData.data_details as unknown as IDebitNoteDt[]) ?? [],
            { amtDec }
          )

          setDebitNoteHdState(responseData)
          setDetails(persistedDetails)
          setSavedSnapshot(persistedDetails.map((row) => ({ ...row })))
          setSavedHeaderSnapshot(readDebitNoteHeaderAmounts(responseData))

          // Update header if callback is provided
          if (onUpdateHeader) {
            onUpdateHeader(responseData)
          }
        } else {
          setSavedSnapshot(normalizedDetails.map((row) => ({ ...row })))
          setSavedHeaderSnapshot({
            totAmt: totalAmount,
            gstAmt: vatAmount,
            totAmtAftGst: totalAfterVat,
          })
        }

        // Invalidate queries with a small delay to allow clear selection to complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["tallyService"] })
            queryClient.invalidateQueries({ queryKey: ["tallyServices"] })
            queryClient.invalidateQueries({ queryKey: ["debit-note-details"] })
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
    amtDec,
    saveMutation,
    queryClient,
    onUpdateHeader,
    onClearSelection,
    tallyService,
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

  // Calculate summary totals (memoized so DebitNoteForm doesn't re-render on every dialog render)
  const summaryTotals = useMemo(
    () => calculateDebitNoteSummary(details ?? [], { amtDec }),
    [details, amtDec]
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

    const tallyServiceId = String(
      tallyService.tallyServiceId ||
        debitNoteHdState.tallyServiceId ||
        0
    )

    if (tallyServiceId === "0") {
      toast.error("Tally service id is missing. Save the tally service first.")
      return
    }

    try {
      // Report parameter is jobOrderId (maps to SQL @inJobOrderId), value = tally service id.
      openDebitNoteReportWindow({
        companyId,
        debitNoteId: debitNoteHdState.debitNoteId,
        debitNoteNo: debitNoteHdState.debitNoteNo || "",
        jobOrderId: tallyServiceId,
        taskId,
        amtDec,
        locAmtDec,
        userName: user?.userName || "",
        reportFile: TALLY_DEBIT_NOTE_REPORT_FILE,
      })
    } catch (error) {
      console.error("Error opening report:", error)
      toast.error("Failed to open report")
    }
  }, [
    debitNoteHdState,
    companyId,
    taskId,
    amtDec,
    locAmtDec,
    user,
    tallyService.tallyServiceId,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent
        className="flex max-h-[95vh] w-[90vw] max-w-none! flex-col overflow-y-auto"
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
                    className="text-primary bg-blue-100 px-2 py-0.5 text-xs whitespace-nowrap hover:bg-blue-200"
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
                className={`h-8 px-2${
                  highlightSaveAction ? "ring-2 ring-red-500 ring-offset-2" : ""
                }`}
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
                variant="destructive"
                size="sm"
                disabled={isConfirmed || !debitNoteHdState?.debitNoteId}
                onClick={handleDeleteDebitNote}
                className="ml-4 h-8 px-2"
                tabIndex={102}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showTotalsCorrectionWarning && (
          <div
            role="alert"
            className="sticky top-0 z-10 flex shrink-0 items-center rounded-md border border-red-500 bg-red-100 px-3 py-2 text-sm text-red-900 dark:border-red-600 dark:bg-red-950/90 dark:text-red-50"
          >
            <span className="font-semibold">Save Required:</span>
            <span className="ml-1">{saveRequiredMessage}</span>
          </div>
        )}

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
              currencyCode={tallyGstContext.currencyCode ?? undefined}
              onServiceChargeUpdate={handleFormServiceChargeUpdate}
              shouldResetForm={shouldResetForm}
              tallyGstContext={tallyGstContext}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
