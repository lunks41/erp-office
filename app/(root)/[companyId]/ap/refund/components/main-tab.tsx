"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  applyCentDiffAdjustment,
  autoAllocateAmounts,
  calauteLocalAmtandGainLoss,
  calculateManualAllocation,
  calculateUnallocated,
  validateAllocation as validateAllocationHelper,
} from "@/helpers/ap-refund-calculations"
import { IApOutTransaction, IApRefundDt } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ApRefundDtSchemaType, ApRefundHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { Plus, RotateCcw, Zap } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { APTransactionId } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ApOutStandingTransactionsDialog from "@/components/accounttransaction/ap-outstandingtransactions-dialog"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"

import RefundDetailsTable from "./refund-details-table"
import RefundForm from "./refund-form"

interface MainProps {
  form: UseFormReturn<ApRefundHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  isCancelled?: boolean
}

export default function Main({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId,
  isCancelled = false,
}: MainProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2

  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [isAllocated, setIsAllocated] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dataDetails, setDataDetails] = useState<ApRefundDtSchemaType[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [pendingBulkDeleteItemNos, setPendingBulkDeleteItemNos] = useState<
    number[]
  >([])
  const dialogParamsRef = useRef<{
    supplierId?: number
    currencyId?: number
    accountDate?: string
    isRefund?: boolean
    documentId?: string
    transactionId: number
  } | null>(null)

  const watchedDataDetails = form.watch("data_details")

  useEffect(() => {
    setDataDetails(watchedDataDetails || [])
  }, [watchedDataDetails])

  // Calculate sum of balAmt (balance amounts) from payment details
  const totalBalanceAmt = useMemo(() => {
    return dataDetails.reduce((sum, detail) => {
      const balAmt = Number((detail as unknown as IApRefundDt).docBalAmt) || 0
      return sum + balAmt
    }, 0)
  }, [dataDetails])

  // Clear dialog params when dialog closes
  useEffect(() => {
    if (!showTransactionDialog) {
      dialogParamsRef.current = null
    }
  }, [showTransactionDialog])

  // Check allocation status when data details change
  useEffect(() => {
    if (dataDetails.length === 0) {
      setIsAllocated(false)
      return
    }

    // Check if any detail has allocation amounts > 0
    const hasAllocations = dataDetails.some(
      (detail) => (detail.allocAmt || 0) > 0 || (detail.allocLocalAmt || 0) > 0
    )
    setIsAllocated(hasAllocations)
  }, [dataDetails])

  const removeRefundDetails = useCallback(
    (itemNos: number[]) => {
      if (!itemNos || itemNos.length === 0) return

      const normalizedItemNos = itemNos
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item))
      if (normalizedItemNos.length === 0) return

      const itemsToRemove = new Set(normalizedItemNos)
      const currentData = form.getValues("data_details") || []
      const updatedData = currentData.filter(
        (item) => !itemsToRemove.has(item.itemNo)
      )

      if (updatedData.length === currentData.length) {
        return
      }

      const resetData = updatedData.map((item) => ({
        ...item,
        allocAmt: 0,
      }))
      const resetArr = resetData as unknown as IApRefundDt[]

      const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
      const exhRate = Number(form.getValues("exhRate")) || 1
      for (let i = 0; i < resetArr.length; i++) {
        calauteLocalAmtandGainLoss(resetArr, i, exhRate, dec)
      }

      const finalResetData: ApRefundDtSchemaType[] = resetData.map(
        (item, index) => ({
          ...item,
          allocLocalAmt: resetArr[index]?.allocLocalAmt || 0,
          exhGainLoss: resetArr[index]?.exhGainLoss || 0,
        })
      )

      const resetSumAllocAmt = 0
      const resetSumAllocLocalAmt = 0
      const resetSumExhGainLoss = 0

      form.setValue("data_details", finalResetData, {
        shouldDirty: true,
        shouldTouch: true,
      })
      setDataDetails(finalResetData)
      form.setValue("allocTotAmt", resetSumAllocAmt, { shouldDirty: true })
      form.setValue("allocTotLocalAmt", resetSumAllocLocalAmt, {
        shouldDirty: true,
      })
      form.setValue("exhGainLoss", resetSumExhGainLoss, { shouldDirty: true })

      setIsAllocated(false)
      form.trigger("data_details")
      setRefreshKey((prev) => prev + 1)
    },
    [decimals, form]
  )

  const handleDelete = (itemNo: number) => {
    removeRefundDetails([itemNo])
  }

  const handleBulkDelete = (selectedItemNos: number[]) => {
    const validItemNos = selectedItemNos.filter((itemNo) =>
      Number.isFinite(itemNo)
    )
    if (validItemNos.length === 0) return

    const uniqueItemNos = Array.from(new Set(validItemNos))
    setPendingBulkDeleteItemNos(uniqueItemNos)
    setIsBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = useCallback(() => {
    if (pendingBulkDeleteItemNos.length === 0) return
    removeRefundDetails(pendingBulkDeleteItemNos)
    setPendingBulkDeleteItemNos([])
  }, [pendingBulkDeleteItemNos, removeRefundDetails])

  const handleBulkDeleteCancel = useCallback(() => {
    setPendingBulkDeleteItemNos([])
  }, [])

  const handleBulkDeleteDialogChange = useCallback((open: boolean) => {
    setIsBulkDeleteDialogOpen(open)
    if (!open) {
      setPendingBulkDeleteItemNos([])
    }
  }, [])

  const bulkDeleteItemName = useMemo(() => {
    if (pendingBulkDeleteItemNos.length === 0) return undefined

    const matches = dataDetails.filter((detail) =>
      pendingBulkDeleteItemNos.includes(detail.itemNo)
    )

    if (matches.length === 0) {
      return `Selected items (${pendingBulkDeleteItemNos.length})`
    }

    const lines = matches.slice(0, 10).map((detail) => {
      const docNo = detail.documentNo ? detail.documentNo.toString().trim() : ""
      return docNo ? `Document ${docNo}` : `Item No ${detail.itemNo}`
    })

    if (matches.length > 10) {
      lines.push(`...and ${matches.length - 10} more`)
    }

    return lines.join("<br/>")
  }, [dataDetails, pendingBulkDeleteItemNos])

  const handleDataReorder = (newData: IApRefundDt[]) => {
    form.setValue("data_details", newData as unknown as ApRefundDtSchemaType[])
    setDataDetails(newData as unknown as ApRefundDtSchemaType[])
  }

  // ==================== HELPER FUNCTIONS ====================

  const validateAllocation = useCallback((data: ApRefundDtSchemaType[]) => {
    if (!validateAllocationHelper(data as unknown as IApRefundDt[])) {
      return false
    }
    return true
  }, [])

  // Helper function to update allocation calculations
  const updateAllocationCalculations = useCallback(
    (
      updatedData: ApRefundDtSchemaType[],
      rowIndex: number,
      allocValue: number
    ): number | undefined => {
      const arr = updatedData as unknown as IApRefundDt[]
      if (rowIndex === -1 || rowIndex >= arr.length) return

      const exhRate = Number(form.getValues("exhRate"))
      const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
      const totAmt = Number(form.getValues("totAmt")) || 0

      const { result, wasAutoSetToZero } = calculateManualAllocation(
        arr,
        rowIndex,
        allocValue,
        totAmt,
        dec
      )

      // Show toast if allocation was auto-set to zero due to remaining amount <= 0
      if (wasAutoSetToZero) {
        toast.error("Now it's auto set to zero. Please check the allocation.")
      }

      const clampedValue =
        typeof result?.allocAmt === "number"
          ? Number(result.allocAmt)
          : Number(arr[rowIndex]?.allocAmt) || 0

      // Clamp to the absolute balance of the current row as a final safety check
      const balanceLimit = Math.abs(Number(arr[rowIndex]?.docBalAmt) || 0)
      const adjustedValue =
        Math.abs(clampedValue) > balanceLimit
          ? Math.sign(clampedValue) * balanceLimit
          : clampedValue

      if (adjustedValue !== clampedValue) {
        arr[rowIndex].allocAmt = adjustedValue
        if (adjustedValue === 0) {
          toast.error(
            "Allocation exceeds remaining balance. It has been reset."
          )
        }
      }

      calauteLocalAmtandGainLoss(arr, rowIndex, exhRate, dec)

      const sumAllocAmt = arr.reduce((s, r) => s + (Number(r.allocAmt) || 0), 0)
      let sumAllocLocalAmt = arr.reduce(
        (s, r) => s + (Number(r.allocLocalAmt) || 0),
        0
      )
      let sumExhGainLoss = arr.reduce(
        (s, r) => s + (Number(r.exhGainLoss) || 0),
        0
      )

      const totLocalAmt = Number(form.getValues("totLocalAmt"))

      let { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
        totAmt,
        totLocalAmt,
        sumAllocAmt,
        sumAllocLocalAmt,
        dec
      )

      const centDiffUpdated = applyCentDiffAdjustment(
        arr,
        unAllocAmt,
        unAllocLocalAmt,
        dec
      )

      if (centDiffUpdated) {
        sumAllocLocalAmt = arr.reduce(
          (s, r) => s + (Number(r.allocLocalAmt) || 0),
          0
        )
        sumExhGainLoss = arr.reduce(
          (s, r) => s + (Number(r.exhGainLoss) || 0),
          0
        )
        const recalculatedUnallocated = calculateUnallocated(
          totAmt,
          totLocalAmt,
          sumAllocAmt,
          sumAllocLocalAmt,
          dec
        )
        unAllocAmt = recalculatedUnallocated.unAllocAmt
        unAllocLocalAmt = recalculatedUnallocated.unAllocLocalAmt
      }

      const sumCentDiff = arr.reduce((s, r) => s + (Number(r.centDiff) || 0), 0)
      unAllocLocalAmt = unAllocLocalAmt - sumCentDiff

      form.setValue("data_details", updatedData, {
        shouldDirty: true,
        shouldTouch: true,
      })
      setDataDetails(updatedData)
      form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
      form.setValue("allocTotLocalAmt", sumAllocLocalAmt, { shouldDirty: true })
      form.setValue("exhGainLoss", sumExhGainLoss - sumCentDiff, {
        shouldDirty: true,
      })

      form.trigger("data_details")
      setRefreshKey((prev) => prev + 1)

      return arr[rowIndex].allocAmt as number
    },
    [form, decimals]
  )

  // Handle cell edit for allocAmt field
  const handleCellEdit = useCallback(
    (itemNo: number, field: string, value: number) => {
      if (field !== "allocAmt") return

      const currentData = form.getValues("data_details") || []
      const currentItem = currentData.find((item) => item.itemNo === itemNo)
      const currentValue = currentItem?.allocAmt || 0

      if (currentValue === value) {
        return currentValue
      }

      // Don't allow manual entry when totAmt = 0
      const headerTotAmt = Number(form.getValues("totAmt")) || 0
      if (headerTotAmt === 0) {
        toast.error(
          "Total Amount is zero. Cannot manually allocate. Please use Auto Allocation or enter Total Amount."
        )
        // Set amount to 0
        const updatedData = [...currentData]

        const arr = updatedData as unknown as IApRefundDt[]
        const rowIndex = arr.findIndex((r) => r.itemNo === itemNo)
        if (rowIndex === -1) return

        const finalValue = updateAllocationCalculations(
          updatedData,
          rowIndex,
          0
        )
        return finalValue ?? 0
      } else {
        // When totAmt > 0, allow manual entry with validation
        const updatedData = [...currentData]
        const arr = updatedData as unknown as IApRefundDt[]
        const rowIndex = arr.findIndex((r) => r.itemNo === itemNo)
        if (rowIndex === -1) return

        const finalValue = updateAllocationCalculations(
          updatedData,
          rowIndex,
          value
        )
        return finalValue
      }
    },
    [form, updateAllocationCalculations]
  )

  // ==================== MAIN FUNCTIONS ====================

  const handleAutoAllocation = useCallback(() => {
    const currentData = form.getValues("data_details") || []

    if (!validateAllocation(currentData)) return

    const totAmt = Number(form.getValues("totAmt")) || 0
    const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
    const result = autoAllocateAmounts(
      currentData as unknown as IApRefundDt[],
      totAmt,
      dec
    )
    const updatedData =
      result.updatedDetails as unknown as ApRefundDtSchemaType[]

    const arr = updatedData as unknown as IApRefundDt[]
    const exhRate = Number(form.getValues("exhRate")) || 1
    for (let i = 0; i < arr.length; i++) {
      calauteLocalAmtandGainLoss(arr, i, exhRate, dec)
    }
    const totLocalAmt = Number(form.getValues("totLocalAmt")) || 0
    const sumAllocAmt = arr.reduce((s, r) => s + (Number(r.allocAmt) || 0), 0)
    const sumAllocLocalAmt = arr.reduce(
      (s, r) => s + (Number(r.allocLocalAmt) || 0),
      0
    )
    let sumExhGainLoss = arr.reduce(
      (s, r) => s + (Number(r.exhGainLoss) || 0),
      0
    )

    // If totAmt was 0, update it with the calculated sumAllocAmt
    const finalTotAmt = totAmt === 0 ? sumAllocAmt : totAmt
    const finalTotLocalAmt = totLocalAmt === 0 ? sumAllocLocalAmt : totLocalAmt

    let { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
      finalTotAmt,
      finalTotLocalAmt,
      sumAllocAmt,
      sumAllocLocalAmt,
      dec
    )

    const centDiffUpdated = applyCentDiffAdjustment(
      arr,
      unAllocAmt,
      unAllocLocalAmt,
      dec
    )

    if (centDiffUpdated) {
      const sumAllocLocalAmt = arr.reduce(
        (s, r) => s + (Number(r.allocLocalAmt) || 0),
        0
      )
      sumExhGainLoss = arr.reduce((s, r) => s + (Number(r.exhGainLoss) || 0), 0)

      const recalculatedUnallocated = calculateUnallocated(
        finalTotAmt,
        finalTotLocalAmt,
        sumAllocAmt,
        sumAllocLocalAmt,
        dec
      )
      unAllocAmt = recalculatedUnallocated.unAllocAmt
      unAllocLocalAmt = recalculatedUnallocated.unAllocLocalAmt
    }

    const sumCentDiff = arr.reduce((s, r) => s + (Number(r.centDiff) || 0), 0)
    unAllocLocalAmt = unAllocLocalAmt - sumCentDiff

    form.setValue("data_details", updatedData, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setDataDetails(updatedData)

    // Update totAmt if it was 0
    if (totAmt === 0) {
      form.setValue("totAmt", sumAllocAmt, { shouldDirty: true })
      form.setValue("totLocalAmt", sumAllocLocalAmt, { shouldDirty: true })
      form.setValue("payTotAmt", sumAllocAmt, { shouldDirty: true })
      form.setValue("payTotLocalAmt", sumAllocLocalAmt, { shouldDirty: true })
    }

    form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
    form.setValue("allocTotLocalAmt", sumAllocLocalAmt, { shouldDirty: true })
    form.setValue("exhGainLoss", sumExhGainLoss - sumCentDiff, {
      shouldDirty: true,
    })

    form.trigger("data_details")
    setRefreshKey((prev) => prev + 1)
    setIsAllocated(true)
  }, [form, validateAllocation, decimals])

  const handleResetAllocation = useCallback(() => {
    const currentData = form.getValues("data_details") || []

    if (currentData.length === 0) {
      return
    }

    const updatedData = currentData.map((item) => ({
      ...item,
      allocAmt: 0,
    }))
    const arr = updatedData as unknown as IApRefundDt[]
    const exhRate = Number(form.getValues("exhRate")) || 1
    const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
    for (let i = 0; i < arr.length; i++) {
      calauteLocalAmtandGainLoss(arr, i, exhRate, dec)
    }
    const sumAllocAmt = 0
    const sumAllocLocalAmt = 0
    const sumExhGainLoss = 0

    form.setValue("data_details", updatedData, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setDataDetails(updatedData)
    form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
    form.setValue("allocTotLocalAmt", sumAllocLocalAmt, { shouldDirty: true })
    form.setValue("exhGainLoss", sumExhGainLoss, { shouldDirty: true })

    form.trigger("data_details")
    setRefreshKey((prev) => prev + 1)
    setIsAllocated(false)
  }, [form, decimals])

  // Check if supplier is selected
  const supplierId = form.watch("supplierId")
  const currencyId = form.watch("currencyId")
  const accountDate = form.watch("accountDate")
  const isSupplierSelected = supplierId && supplierId > 0

  const handleSelectTransaction = useCallback(() => {
    if (!supplierId || !currencyId || !accountDate) {
      return
    }

    dialogParamsRef.current = {
      supplierId,
      currencyId,
      accountDate: accountDate?.toString() || "",
      isRefund: true,
      documentId: form.getValues("refundId") || "0",
      transactionId: APTransactionId.payment,
    }

    setShowTransactionDialog(true)
  }, [supplierId, currencyId, accountDate, form])

  const handleAddSelectedTransactions = useCallback(
    (transactions: IApOutTransaction[]) => {
      const currentData = form.getValues("data_details") || []
      const nextItemNo =
        currentData.length > 0
          ? Math.max(...currentData.map((d) => d.itemNo)) + 1
          : 1

      const newDetails: ApRefundDtSchemaType[] = transactions.map(
        (transaction, index) => ({
          companyId: companyId,
          refundId: form.getValues("refundId") || "0",
          refundNo: form.getValues("refundNo") || "",
          itemNo: nextItemNo + index,
          transactionId: transaction.transactionId,
          documentId: String(transaction.documentId),
          documentNo: transaction.documentNo,
          referenceNo: transaction.referenceNo,
          docCurrencyId: transaction.currencyId,
          docCurrencyCode: transaction.currencyCode || "",
          docExhRate: transaction.exhRate,
          docAccountDate: transaction.accountDate,
          docDueDate: transaction.dueDate,
          docTotAmt: transaction.totAmt,
          docTotLocalAmt: transaction.totLocalAmt,
          docBalAmt: transaction.balAmt,
          docBalLocalAmt: transaction.balLocalAmt,
          allocAmt: 0,
          allocLocalAmt: 0,
          docAllocAmt: 0,
          docAllocLocalAmt: 0,
          centDiff: 0,
          exhGainLoss: 0,
          editVersion: 0,
        })
      )

      const updatedData = [...currentData, ...newDetails]

      form.setValue("data_details", updatedData, {
        shouldDirty: true,
        shouldTouch: true,
      })

      setDataDetails(updatedData)
      form.trigger("data_details")
      setShowTransactionDialog(false)
    },
    [form, companyId]
  )

  return (
    <div className="flex min-h-0 w-full flex-col px-2 pb-2">
      <RefundForm
        form={form}
        onSuccessAction={onSuccessAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
        isCancelled={isCancelled}
        dataDetails={dataDetails}
      />

      <div className="px-2 pt-1">
        {/* Control Row */}
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            onClick={handleSelectTransaction}
            disabled={!isSupplierSelected}
            className={
              !isSupplierSelected
                ? "cursor-not-allowed px-3 py-1 text-xs opacity-50"
                : "px-3 py-1 text-xs"
            }
            title="Select outstanding transactions"
          >
            <Plus className="h-4 w-4" />
            Select Txn
          </Button>
          <Button
            size="sm"
            onClick={handleAutoAllocation}
            disabled={dataDetails.length === 0}
            className="px-3 py-1 text-xs"
            title="Auto allocate amounts"
          >
            <Zap className="h-4 w-4" />
            Auto Alloc
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleResetAllocation}
            disabled={!isAllocated}
            className={
              !isAllocated
                ? "cursor-not-allowed px-3 py-1 text-xs opacity-50"
                : "px-3 py-1 text-xs"
            }
            title="Reset all allocations"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Alloc
          </Button>
          <Badge
            variant="secondary"
            className="border-blue-200 bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
          >
            Total Alloc: {(form.getValues("allocTotAmt") || 0).toFixed(amtDec)}
          </Badge>
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800"
          >
            Total Local:{" "}
            {(form.getValues("allocTotLocalAmt") || 0).toFixed(locAmtDec)}
          </Badge>
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800"
          >
            Balance Amt: {totalBalanceAmt.toFixed(amtDec)}
          </Badge>
        </div>

        <RefundDetailsTable
          key={refreshKey}
          data={(dataDetails as unknown as IApRefundDt[]) || []}
          visible={visible}
          onDeleteAction={handleDelete}
          onBulkDeleteAction={handleBulkDelete}
          onDataReorder={handleDataReorder as (newData: IApRefundDt[]) => void}
          onCellEdit={handleCellEdit}
        />
      </div>

      <DeleteConfirmation
        open={isBulkDeleteDialogOpen}
        onOpenChange={handleBulkDeleteDialogChange}
        onConfirm={handleBulkDeleteConfirm}
        onCancelAction={handleBulkDeleteCancel}
        itemName={bulkDeleteItemName}
        description="Selected payment details will be removed. This action cannot be undone."
      />

      {/* Transaction Selection Dialog */}
      {showTransactionDialog && dialogParamsRef.current && (
        <ApOutStandingTransactionsDialog
          open={showTransactionDialog}
          onOpenChangeAction={setShowTransactionDialog}
          supplierId={dialogParamsRef.current.supplierId}
          currencyId={dialogParamsRef.current.currencyId}
          accountDate={dialogParamsRef.current.accountDate}
          isRefund={dialogParamsRef.current.isRefund}
          isMultiCurrency={false}
          documentId={dialogParamsRef.current.documentId}
          transactionId={dialogParamsRef.current.transactionId}
          visible={visible}
          onAddSelected={handleAddSelectedTransactions}
          existingDocumentIds={dataDetails.map((detail) =>
            String(detail.documentId)
          )}
        />
      )}
    </div>
  )
}
