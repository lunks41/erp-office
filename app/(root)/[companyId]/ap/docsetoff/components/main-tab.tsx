"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  autoAllocateAmounts,
  calauteLocalAmtandGainLoss,
  calculateManualAllocation,
  calculateUnallocated,
  validateAllocation as validateAllocationHelper,
} from "@/helpers/ap-docsetoff-calculations"
import { IApDocSetOffDt, IApOutTransaction } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ApDocSetOffDtSchemaType, ApDocSetOffHdSchemaType } from "@/schemas"
import { Check, Plus, RotateCcw, X, Zap } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { APTransactionId } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ArOutStandingTransactionsDialog from "@/components/accounttransaction/ap-outstandingtransactions-dialog"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"

import DocSetOffDetailsTable from "./docsetoff-details-table"
import DocSetOffForm from "./docsetoff-form"

interface MainProps {
  form: UseFormReturn<ApDocSetOffHdSchemaType>
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
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2

  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [isAllocated, setIsAllocated] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dataDetails, setDataDetails] = useState<ApDocSetOffDtSchemaType[]>([])
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

  // Helper function to calculate total balance amount from details
  const calculateTotalBalanceAmt = useCallback(
    (details: ApDocSetOffDtSchemaType[]) => {
      // Calculate sum of negative amounts and sum of positive amounts
      let sumOfNegative = 0
      let sumOfPositive = 0

      details.forEach((detail) => {
        const balAmt =
          Number((detail as unknown as IApDocSetOffDt).docBalAmt) || 0
        if (balAmt < 0) {
          sumOfNegative += balAmt
        } else if (balAmt > 0) {
          sumOfPositive += balAmt
        }
      })

      // Return the absolute value of whichever sum has the lower absolute value
      const absNegative = Math.abs(sumOfNegative)
      const absPositive = Math.abs(sumOfPositive)
      const lowestAmount = absNegative < absPositive ? absNegative : absPositive

      return lowestAmount
    },
    []
  )

  // Calculate sum of balAmt (balance amounts) from docSetOff details
  const totalBalanceAmt = useMemo(() => {
    return calculateTotalBalanceAmt(dataDetails)
  }, [dataDetails, calculateTotalBalanceAmt])

  // Calculate running sum of all allocAmt values (including negatives)
  // Normalize so -0 or floating-point near-zero displays as 0.00 (not -0.00)
  const totalSetOffAmt = useMemo(() => {
    const raw = dataDetails.reduce((sum, detail) => {
      const allocAmt =
        Number((detail as unknown as IApDocSetOffDt).allocAmt) || 0
      return sum + allocAmt
    }, 0)
    return Math.abs(raw) < 1e-9 ? 0 : raw
  }, [dataDetails])

  console.log("totalSetOffAmt", totalSetOffAmt)
  // Helper function to update balTotAmt and unAllocTotAmt based on current details
  const updateBalanceAndUnallocatedTotals = useCallback(
    (details: ApDocSetOffDtSchemaType[], allocTotAmt?: number) => {
      // Calculate new total balance amount from all details
      const newBalTotAmt = calculateTotalBalanceAmt(details)

      // Debug: Log the calculation
      console.log(
        "updateBalanceAndUnallocatedTotals - details:",
        details.map((d) => ({
          itemNo: d.itemNo,
          docNo: d.documentNo,
          docBalAmt: (d as unknown as IApDocSetOffDt).docBalAmt,
        }))
      )
      console.log(
        "updateBalanceAndUnallocatedTotals - newBalTotAmt:",
        newBalTotAmt
      )

      // Use provided allocTotAmt or get from form
      const currentAllocTotAmt =
        allocTotAmt !== undefined
          ? allocTotAmt
          : Number(form.getValues("allocTotAmt")) || 0

      // Calculate unallocated amount
      const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
      const { unAllocAmt } = calculateUnallocated(
        newBalTotAmt,
        currentAllocTotAmt,
        dec
      )

      // Update form values
      form.setValue("balTotAmt", newBalTotAmt, { shouldDirty: true })
      form.setValue("unAllocTotAmt", unAllocAmt, { shouldDirty: true })
    },
    [form, calculateTotalBalanceAmt, decimals]
  )

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

  const removeDocSetOffDetails = useCallback(
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
      const resetArr = resetData as unknown as IApDocSetOffDt[]

      const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
      const exhRate = Number(form.getValues("exhRate")) || 1
      for (let i = 0; i < resetArr.length; i++) {
        calauteLocalAmtandGainLoss(resetArr, i, exhRate, dec)
      }

      const finalResetData: ApDocSetOffDtSchemaType[] = resetData.map(
        (item, index) => ({
          ...item,
          allocLocalAmt: resetArr[index]?.allocLocalAmt || 0,
          exhGainLoss: resetArr[index]?.exhGainLoss || 0,
        })
      )

      //const resetSumAllocAmt = 0
      //const resetSumExhGainLoss = 0
      // Recalculate allocTotAmt and exhGainLoss from remaining data
      // Sum only positive allocAmt values
      const resetSumAllocAmt = resetArr.reduce((s, r) => {
        const amt = Number(r.allocAmt) || 0
        return amt > 0 ? s + amt : s
      }, 0)
      const resetSumExhGainLoss = resetArr.reduce(
        (s, r) => s + (Number(r.exhGainLoss) || 0),
        0
      )

      form.setValue("data_details", finalResetData, {
        shouldDirty: true,
        shouldTouch: true,
      })
      setDataDetails(finalResetData)
      form.setValue("allocTotAmt", resetSumAllocAmt, { shouldDirty: true })

      // Note: Preserve the sign of exhGainLoss (positive or negative) - do not use Math.abs()
      form.setValue("exhGainLoss", resetSumExhGainLoss, { shouldDirty: true })

      // Update balTotAmt and unAllocTotAmt based on remaining details
      // Pass the recalculated allocTotAmt directly to avoid timing issues
      updateBalanceAndUnallocatedTotals(finalResetData, resetSumAllocAmt)
      setIsAllocated(false)
      form.trigger("data_details")
      setRefreshKey((prev) => prev + 1)
    },
    [decimals, form, updateBalanceAndUnallocatedTotals]
  )

  const handleDelete = (itemNo: number) => {
    removeDocSetOffDetails([itemNo])
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
    removeDocSetOffDetails(pendingBulkDeleteItemNos)
    setPendingBulkDeleteItemNos([])
  }, [pendingBulkDeleteItemNos, removeDocSetOffDetails])

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

  const handleDataReorder = (newData: IApDocSetOffDt[]) => {
    form.setValue(
      "data_details",
      newData as unknown as ApDocSetOffDtSchemaType[]
    )
    setDataDetails(newData as unknown as ApDocSetOffDtSchemaType[])
  }

  // ==================== HELPER FUNCTIONS ====================

  const validateAllocation = useCallback((data: ApDocSetOffDtSchemaType[]) => {
    if (!validateAllocationHelper(data as unknown as IApDocSetOffDt[])) {
      return false
    }
    return true
  }, [])

  // Helper function to update allocation calculations
  const updateAllocationCalculations = useCallback(
    (
      updatedData: ApDocSetOffDtSchemaType[],
      rowIndex: number,
      allocValue: number
    ): number | undefined => {
      const arr = updatedData as unknown as IApDocSetOffDt[]
      if (rowIndex === -1 || rowIndex >= arr.length) return

      const exhRate = Number(form.getValues("exhRate"))
      const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
      const balTotAmt = Number(form.getValues("balTotAmt")) || 0

      console.log("balTotAmt", balTotAmt)

      const { result, wasAutoSetToZero } = calculateManualAllocation(
        arr,
        rowIndex,
        allocValue,
        balTotAmt,
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

      const sumAllocAmt = arr.reduce((s, r) => {
        const amt = Number(r.allocAmt) || 0
        return amt > 0 ? s + amt : s
      }, 0)
      const sumExhGainLoss = arr.reduce(
        (s, r) => s + (Number(r.exhGainLoss) || 0),
        0
      )

      const { unAllocAmt } = calculateUnallocated(balTotAmt, sumAllocAmt, dec)

      form.setValue("data_details", updatedData, {
        shouldDirty: true,
        shouldTouch: true,
      })
      setDataDetails(updatedData)
      form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
      // Note: Preserve the sign of exhGainLoss (positive or negative) - do not use Math.abs()
      form.setValue("exhGainLoss", sumExhGainLoss, { shouldDirty: true })
      form.setValue("unAllocTotAmt", unAllocAmt, { shouldDirty: true })
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

      // Don't allow manual entry when balTotAmt = 0
      const headerTotAmt = Number(form.getValues("balTotAmt")) || 0
      if (headerTotAmt === 0) {
        toast.error(
          "Total Amount is zero. Cannot manually allocate. Please use Auto Allocation or enter Total Amount."
        )
        // Set amount to 0
        const updatedData = [...currentData]

        const arr = updatedData as unknown as IApDocSetOffDt[]
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
        const arr = updatedData as unknown as IApDocSetOffDt[]
        const rowIndex = arr.findIndex((r) => r.itemNo === itemNo)
        if (rowIndex === -1) return

        console.log("value", value)

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

    const balTotAmt = Number(form.getValues("balTotAmt")) || 0
    const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
    const result = autoAllocateAmounts(
      currentData as unknown as IApDocSetOffDt[],
      dec
    )
    const updatedData =
      result.updatedDetails as unknown as ApDocSetOffDtSchemaType[]

    const arr = updatedData as unknown as IApDocSetOffDt[]
    const exhRate = Number(form.getValues("exhRate")) || 1
    for (let i = 0; i < arr.length; i++) {
      calauteLocalAmtandGainLoss(arr, i, exhRate, dec)
    }
    const sumAllocAmt = arr.reduce((s, r) => {
      console.log("r.allocAmt", r.allocAmt)
      const amt = Number(r.allocAmt) || 0
      return amt > 0 ? s + amt : s
    }, 0)
    const sumExhGainLoss = arr.reduce(
      (s, r) => s + (Number(r.exhGainLoss) || 0),
      0
    )

    console.log("sumAllocAmt", sumAllocAmt)
    console.log("sumExhGainLoss", sumExhGainLoss)
    console.log("balTotAmt", balTotAmt)

    // If balTotAmt was 0, update it with the calculated sumAllocAmt
    const finalTotAmt = balTotAmt === 0 ? sumAllocAmt : balTotAmt

    const { unAllocAmt } = calculateUnallocated(finalTotAmt, sumAllocAmt, dec)

    form.setValue("data_details", updatedData, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setDataDetails(updatedData)

    form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
    // Note: Preserve the sign of exhGainLoss (positive or negative) - do not use Math.abs()
    form.setValue("exhGainLoss", sumExhGainLoss, { shouldDirty: true })
    form.setValue("unAllocTotAmt", unAllocAmt, { shouldDirty: true })
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
    const arr = updatedData as unknown as IApDocSetOffDt[]
    const exhRate = Number(form.getValues("exhRate")) || 1
    const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }
    for (let i = 0; i < arr.length; i++) {
      calauteLocalAmtandGainLoss(arr, i, exhRate, dec)
    }
    const sumAllocAmt = 0
    const sumExhGainLoss = 0
    const balTotAmt = Number(form.getValues("balTotAmt")) || 0
    const { unAllocAmt } = calculateUnallocated(balTotAmt, sumAllocAmt, dec)

    form.setValue("data_details", updatedData, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setDataDetails(updatedData)
    form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
    // Note: Preserve the sign of exhGainLoss (positive or negative) - do not use Math.abs()
    form.setValue("exhGainLoss", sumExhGainLoss, { shouldDirty: true })
    form.setValue("unAllocTotAmt", unAllocAmt, { shouldDirty: true })
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
      isRefund: false,
      documentId: form.getValues("setoffId") || "0",
      transactionId: APTransactionId.docsetoff,
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

      const newDetails: ApDocSetOffDtSchemaType[] = transactions.map(
        (transaction, index) => {
          return {
            companyId: companyId,
            setoffId: form.getValues("setoffId") || "0",
            setoffNo: form.getValues("setoffNo") || "",
            itemNo: nextItemNo + index,
            transactionId: transaction.transactionId,
            documentId: String(transaction.documentId),
            documentNo: transaction.documentNo,
            referenceNo: transaction.suppNo,
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
          }
        }
      )

      const updatedData = [...currentData, ...newDetails]

      form.setValue("data_details", updatedData, {
        shouldDirty: true,
        shouldTouch: true,
      })

      // Update balTotAmt and unAllocTotAmt based on all details (including new ones)
      // This will calculate from the actual docBalAmt values in all details
      updateBalanceAndUnallocatedTotals(updatedData)

      setDataDetails(updatedData)
      form.trigger("data_details")
      setShowTransactionDialog(false)
    },
    [form, companyId, updateBalanceAndUnallocatedTotals]
  )

  return (
    <div className="flex min-h-0 w-full flex-col px-2 pb-2">
      <DocSetOffForm
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
            className="border-border bg-blue-100 px-3 py-1 text-sm font-medium text-primary"
          >
            Total Alloc: {(form.getValues("allocTotAmt") || 0).toFixed(amtDec)}
          </Badge>

          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800"
          >
            Balance Amt: {totalBalanceAmt.toFixed(amtDec)}
          </Badge>

          <Badge
            variant="outline"
            className={
              totalSetOffAmt !== 0
                ? "border-red-300 bg-red-200 px-3 py-1 text-sm font-medium text-black"
                : "border-green-300 bg-green-200 px-3 py-1 text-sm font-medium text-black"
            }
          >
            <span className="flex items-center gap-1.5">
              {totalSetOffAmt !== 0 ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              SetOff Amt: {totalSetOffAmt.toFixed(amtDec)}
            </span>
          </Badge>
        </div>

        <DocSetOffDetailsTable
          key={refreshKey}
          data={(dataDetails as unknown as IApDocSetOffDt[]) || []}
          visible={visible}
          onDeleteAction={handleDelete}
          onBulkDeleteAction={handleBulkDelete}
          onDataReorder={handleDataReorder}
          onCellEdit={handleCellEdit}
        />
      </div>

      <DeleteConfirmation
        open={isBulkDeleteDialogOpen}
        onOpenChange={handleBulkDeleteDialogChange}
        onConfirm={handleBulkDeleteConfirm}
        onCancelAction={handleBulkDeleteCancel}
        itemName={bulkDeleteItemName}
        description="Selected docsetoff details will be removed. This action cannot be undone."
      />

      {/* Transaction Selection Dialog */}
      {showTransactionDialog && dialogParamsRef.current && (
        <ArOutStandingTransactionsDialog
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
