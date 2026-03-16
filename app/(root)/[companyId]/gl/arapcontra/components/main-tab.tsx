"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  allocateBetweenModules,
  calauteLocalAmtandGainLoss,
  calculateManualAllocation,
  validateAllocation as validateAllocationHelper,
} from "@/helpers/gl-contra-calculations"
import { IApOutTransaction, IArOutTransaction, IGLContraDt } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { GLContraDtSchemaType, GLContraHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { Plus, RotateCcw, Zap } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { APTransactionId, ARTransactionId, ModuleId } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ApOutStandingTransactionsDialog from "@/components/accounttransaction/ap-outstandingtransactions-dialog"
import ArOutStandingTransactionsDialog from "@/components/accounttransaction/ar-outstandingtransactions-dialog"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"

import ApGLContraDetailsTable from "./glContra-ap-details-table"
import ArGLContraDetailsTable from "./glContra-ar-details-table"
import ContraForm from "./glContra-form"

interface MainProps {
  form: UseFormReturn<GLContraHdSchemaType>
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
  const decimalConfig = useMemo(
    () =>
      decimals[0] ||
      ({
        amtDec: 2,
        locAmtDec: 2,
        exhRateDec: 6,
      } as const),
    [decimals]
  )
  const amtDec = decimalConfig.amtDec

  const [showArTransactionDialog, setShowArTransactionDialog] = useState(false)
  const [showApTransactionDialog, setShowApTransactionDialog] = useState(false)

  const [isAllocated, setIsAllocated] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dataDetails, setDataDetails] = useState<GLContraDtSchemaType[]>([])
  const [arDataDetails, setArDataDetails] = useState<GLContraDtSchemaType[]>([])
  const [apDataDetails, setApDataDetails] = useState<GLContraDtSchemaType[]>([])
  const dataDetailsRef = useRef<GLContraDtSchemaType[]>([])
  const getNextItemNo = useCallback(() => {
    if (dataDetails.length === 0) {
      return 1
    }
    return Math.max(...dataDetails.map((detail) => detail.itemNo)) + 1
  }, [dataDetails])

  const [isBulkDeleteDialogOpenAr, setIsBulkDeleteDialogOpenAr] =
    useState(false)
  const [pendingBulkDeleteItemNosAr, setPendingBulkDeleteItemNosAr] = useState<
    number[]
  >([])
  const [isBulkDeleteDialogOpenAp, setIsBulkDeleteDialogOpenAp] =
    useState(false)
  const [pendingBulkDeleteItemNosAp, setPendingBulkDeleteItemNosAp] = useState<
    number[]
  >([])

  const arDialogParamsRef = useRef<{
    customerId?: number
    currencyId?: number
    accountDate?: string
    isRefund?: boolean
    documentId?: string
    transactionId: number
  } | null>(null)

  const apDialogParamsRef = useRef<{
    supplierId?: number
    currencyId?: number
    accountDate?: string
    isRefund?: boolean
    documentId?: string
    transactionId: number
  } | null>(null)

  const classifyDetail = useCallback((detail: GLContraDtSchemaType) => {
    if (detail?.moduleId === ModuleId.ap) return "ap"
    if (detail?.moduleId === ModuleId.ar) return "ar"
    return Number(detail.docBalAmt) < 0 ? "ap" : "ar"
  }, [])

  const splitDetailsByModule = useCallback(
    (details: GLContraDtSchemaType[] = []) => {
      const arList: GLContraDtSchemaType[] = []
      const apList: GLContraDtSchemaType[] = []

      details.forEach((detail) => {
        const type = classifyDetail(detail)
        if (type === "ap") {
          apList.push(detail)
        } else {
          arList.push(detail)
        }
      })

      return { arList, apList }
    },
    [classifyDetail]
  )

  const cloneDetails = useCallback(
    (details: GLContraDtSchemaType[]): GLContraDtSchemaType[] =>
      details.map((detail) => ({ ...detail })),
    []
  )

  const combineDetails = useCallback(
    (
      arList: GLContraDtSchemaType[],
      apList: GLContraDtSchemaType[]
    ): GLContraDtSchemaType[] => {
      return [...arList, ...apList].sort((a, b) => a.itemNo - b.itemNo)
    },
    []
  )

  const recalcLocalAmounts = useCallback(
    (details: GLContraDtSchemaType[]) => {
      const arr = details as unknown as IGLContraDt[]
      const exhRate = Number(form.getValues("exhRate")) || 1
      for (let i = 0; i < arr.length; i++) {
        calauteLocalAmtandGainLoss(arr, i, exhRate, decimalConfig)
      }
      return arr as unknown as GLContraDtSchemaType[]
    },
    [decimalConfig, form]
  )

  const resetAllocationsForDetails = useCallback(
    (details: GLContraDtSchemaType[]): GLContraDtSchemaType[] =>
      details.map((detail) => ({
        ...detail,
        allocAmt: 0,
        allocLocalAmt: 0,
        docAllocAmt: 0,
        docAllocLocalAmt: 0,
        centDiff: 0,
        exhGainLoss: 0,
      })),
    []
  )

  const formatAmount = useCallback(
    (value: number | string | null | undefined, fractionDigits = amtDec) => {
      const numericValue = Number(value) || 0
      return numericValue.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
    },
    [amtDec]
  )

  const computeSectionTotals = useCallback(
    (details: GLContraDtSchemaType[]) => {
      return details.reduce(
        (acc, detail) => ({
          alloc: acc.alloc + (Number(detail.allocAmt) || 0),
          allocLocal: acc.allocLocal + (Number(detail.allocLocalAmt) || 0),
          balance: acc.balance + (Number(detail.docBalAmt) || 0),
          exhGainLoss: acc.exhGainLoss + (Number(detail.exhGainLoss) || 0),
        }),
        { alloc: 0, allocLocal: 0, balance: 0, exhGainLoss: 0 }
      )
    },
    []
  )

  const updateHeaderSummary = useCallback(
    (details: GLContraDtSchemaType[]) => {
      const totals = details.reduce(
        (acc, detail) => {
          const moduleId = Number(detail.moduleId)
          const allocAmt = Number(detail.allocAmt) || 0
          const allocLocal = Number(detail.allocLocalAmt) || 0
          const exhGainLoss = Number(detail.exhGainLoss) || 0

          if (moduleId === ModuleId.ap) {
            acc.ap.totAmt += allocAmt
            acc.ap.totLocalAmt += allocLocal
            acc.ap.exhGainLoss += exhGainLoss
          } else {
            acc.ar.totAmt += allocAmt
            acc.ar.totLocalAmt += allocLocal
            acc.ar.exhGainLoss += exhGainLoss
          }
          return acc
        },
        {
          ar: { totAmt: 0, totLocalAmt: 0, exhGainLoss: 0 },
          ap: { totAmt: 0, totLocalAmt: 0, exhGainLoss: 0 },
        }
      )

      const arAbs = Math.abs(totals.ar.totAmt)
      const apAbs = Math.abs(totals.ap.totAmt)
      const limitingTotals = arAbs <= apAbs ? totals.ar : totals.ap

      form.setValue("totAmt", limitingTotals.totAmt, { shouldDirty: true })
      form.setValue("totLocalAmt", limitingTotals.totLocalAmt, {
        shouldDirty: true,
      })
      form.setValue("exhGainLoss", limitingTotals.exhGainLoss, {
        shouldDirty: true,
      })
    },
    [form]
  )

  const applyDetailsChange = useCallback(
    (
      nextAr: GLContraDtSchemaType[],
      nextAp: GLContraDtSchemaType[],
      options?: {
        recalcLocal?: boolean
        triggerValidation?: boolean
      }
    ) => {
      const arClone = cloneDetails(nextAr)
      const apClone = cloneDetails(nextAp)
      const merged = combineDetails(arClone, apClone)
      const detailsToStore = options?.recalcLocal
        ? recalcLocalAmounts(merged.map((detail) => ({ ...detail })))
        : merged

      setArDataDetails(arClone)
      setApDataDetails(apClone)
      setDataDetails(detailsToStore)
      dataDetailsRef.current = detailsToStore

      form.setValue("data_details", detailsToStore, {
        shouldDirty: true,
        shouldTouch: true,
      })
      updateHeaderSummary(detailsToStore)
      if (options?.triggerValidation !== false) {
        form.trigger("data_details")
      }

      setRefreshKey((prev) => prev + 1)

      return detailsToStore
    },
    [
      cloneDetails,
      combineDetails,
      form,
      recalcLocalAmounts,
      updateHeaderSummary,
    ]
  )

  const watchedDataDetails = form.watch("data_details")

  useEffect(() => {
    const details =
      (watchedDataDetails as GLContraDtSchemaType[] | undefined) ?? []

    if (dataDetailsRef.current === details) {
      return
    }

    dataDetailsRef.current = details
    setDataDetails(details)

    const { arList, apList } = splitDetailsByModule(details)
    setArDataDetails(arList)
    setApDataDetails(apList)
  }, [splitDetailsByModule, watchedDataDetails])

  // Calculate sum of balance amounts across all details
  const arSectionTotals = useMemo(
    () => computeSectionTotals(arDataDetails),
    [arDataDetails, computeSectionTotals]
  )

  const apSectionTotals = useMemo(
    () => computeSectionTotals(apDataDetails),
    [apDataDetails, computeSectionTotals]
  )

  // Clear dialog params when dialog closes
  useEffect(() => {
    if (!showArTransactionDialog) {
      arDialogParamsRef.current = null
    }
  }, [showArTransactionDialog])

  useEffect(() => {
    if (!showApTransactionDialog) {
      apDialogParamsRef.current = null
    }
  }, [showApTransactionDialog])

  // Check allocation status when data details change
  useEffect(() => {
    const hasAllocations = dataDetails.some(
      (detail) => Math.abs(Number(detail.allocAmt) || 0) > 0
    )
    setIsAllocated(hasAllocations)
  }, [dataDetails])

  const removeDetails = useCallback(
    (type: "ar" | "ap", itemNos: number[]) => {
      if (!itemNos || itemNos.length === 0) return

      const normalizedItemNos = itemNos
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item))
      if (normalizedItemNos.length === 0) return

      const itemsToRemove = new Set(normalizedItemNos)
      const source = type === "ar" ? arDataDetails : apDataDetails
      const filtered = source.filter((item) => !itemsToRemove.has(item.itemNo))

      if (filtered.length === source.length) {
        return
      }

      const nextAr = type === "ar" ? filtered : arDataDetails
      const nextAp = type === "ap" ? filtered : apDataDetails

      const resetAr = resetAllocationsForDetails(nextAr)
      const resetAp = resetAllocationsForDetails(nextAp)

      applyDetailsChange(resetAr, resetAp, {
        recalcLocal: true,
      })
    },
    [
      apDataDetails,
      applyDetailsChange,
      arDataDetails,
      resetAllocationsForDetails,
    ]
  )

  const handleArDelete = useCallback(
    (itemNo: number) => removeDetails("ar", [itemNo]),
    [removeDetails]
  )
  const handleApDelete = useCallback(
    (itemNo: number) => removeDetails("ap", [itemNo]),
    [removeDetails]
  )

  const handleArBulkDelete = useCallback((selectedItemNos: number[]) => {
    const validItemNos = selectedItemNos.filter((itemNo) =>
      Number.isFinite(itemNo)
    )
    if (validItemNos.length === 0) return

    const uniqueItemNos = Array.from(new Set(validItemNos))
    setPendingBulkDeleteItemNosAr(uniqueItemNos)
    setIsBulkDeleteDialogOpenAr(true)
  }, [])

  const handleApBulkDelete = useCallback((selectedItemNos: number[]) => {
    const validItemNos = selectedItemNos.filter((itemNo) =>
      Number.isFinite(itemNo)
    )
    if (validItemNos.length === 0) return

    const uniqueItemNos = Array.from(new Set(validItemNos))
    setPendingBulkDeleteItemNosAp(uniqueItemNos)
    setIsBulkDeleteDialogOpenAp(true)
  }, [])

  const handleArBulkDeleteConfirm = useCallback(() => {
    if (pendingBulkDeleteItemNosAr.length === 0) return
    removeDetails("ar", pendingBulkDeleteItemNosAr)
    setPendingBulkDeleteItemNosAr([])
    setIsBulkDeleteDialogOpenAr(false)
  }, [pendingBulkDeleteItemNosAr, removeDetails])

  const handleApBulkDeleteConfirm = useCallback(() => {
    if (pendingBulkDeleteItemNosAp.length === 0) return
    removeDetails("ap", pendingBulkDeleteItemNosAp)
    setPendingBulkDeleteItemNosAp([])
    setIsBulkDeleteDialogOpenAp(false)
  }, [pendingBulkDeleteItemNosAp, removeDetails])

  const handleArBulkDeleteCancel = useCallback(() => {
    setPendingBulkDeleteItemNosAr([])
    setIsBulkDeleteDialogOpenAr(false)
  }, [])

  const handleApBulkDeleteCancel = useCallback(() => {
    setPendingBulkDeleteItemNosAp([])
    setIsBulkDeleteDialogOpenAp(false)
  }, [])

  const handleArBulkDeleteDialogChange = useCallback((open: boolean) => {
    setIsBulkDeleteDialogOpenAr(open)
    if (!open) {
      setPendingBulkDeleteItemNosAr([])
    }
  }, [])

  const handleApBulkDeleteDialogChange = useCallback((open: boolean) => {
    setIsBulkDeleteDialogOpenAp(open)
    if (!open) {
      setPendingBulkDeleteItemNosAp([])
    }
  }, [])

  const buildBulkDeleteLabel = useCallback(
    (
      pendingItemNos: number[],
      source: GLContraDtSchemaType[]
    ): string | undefined => {
      if (pendingItemNos.length === 0) return undefined

      const matches = source.filter((detail) =>
        pendingItemNos.includes(detail.itemNo)
      )

      if (matches.length === 0) {
        return `Selected items (${pendingItemNos.length})`
      }

      const lines = matches.slice(0, 10).map((detail) => {
        const docNo = detail.documentNo
          ? detail.documentNo.toString().trim()
          : ""
        return docNo ? `Document ${docNo}` : `Item No ${detail.itemNo}`
      })

      if (matches.length > 10) {
        lines.push(`...and ${matches.length - 10} more`)
      }

      return lines.join("<br/>")
    },
    []
  )

  const bulkDeleteItemNameAr = useMemo(
    () => buildBulkDeleteLabel(pendingBulkDeleteItemNosAr, arDataDetails),
    [arDataDetails, buildBulkDeleteLabel, pendingBulkDeleteItemNosAr]
  )

  const bulkDeleteItemNameAp = useMemo(
    () => buildBulkDeleteLabel(pendingBulkDeleteItemNosAp, apDataDetails),
    [apDataDetails, buildBulkDeleteLabel, pendingBulkDeleteItemNosAp]
  )

  const handleArDataReorder = useCallback(
    (newData: IGLContraDt[]) => {
      applyDetailsChange(
        newData as unknown as GLContraDtSchemaType[],
        arDataDetails,
        { recalcLocal: false, triggerValidation: false }
      )
    },
    [arDataDetails, applyDetailsChange]
  )

  const handleApDataReorder = useCallback(
    (newData: IGLContraDt[]) => {
      applyDetailsChange(
        apDataDetails,
        newData as unknown as GLContraDtSchemaType[],
        { recalcLocal: false, triggerValidation: false }
      )
    },
    [applyDetailsChange, apDataDetails]
  )

  // ==================== HELPER FUNCTIONS ====================

  const validateAllocation = useCallback((data: GLContraDtSchemaType[]) => {
    if (!validateAllocationHelper(data as unknown as IGLContraDt[])) {
      return false
    }
    return true
  }, [])

  // Helper function to update allocation calculations
  const updateAllocationCalculations = useCallback(
    (
      updatedData: GLContraDtSchemaType[],
      rowIndex: number,
      allocValue: number
    ): number | undefined => {
      const arr = updatedData as unknown as IGLContraDt[]
      if (rowIndex === -1 || rowIndex >= arr.length) return

      const exhRate = Number(form.getValues("exhRate"))
      const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }

      const { result, wasAutoSetToZero } = calculateManualAllocation(
        arr,
        rowIndex,
        allocValue,
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

      const sumExhGainLoss = arr.reduce(
        (s, r) => s + (Number(r.exhGainLoss) || 0),
        0
      )

      form.setValue("data_details", updatedData, {
        shouldDirty: true,
        shouldTouch: true,
      })
      setDataDetails(updatedData)
      const { arList, apList } = splitDetailsByModule(
        updatedData as GLContraDtSchemaType[]
      )
      setArDataDetails(arList)
      setApDataDetails(apList)
      dataDetailsRef.current = updatedData as GLContraDtSchemaType[]
      form.setValue("exhGainLoss", sumExhGainLoss, { shouldDirty: true })
      form.trigger("data_details")
      setRefreshKey((prev) => prev + 1)

      return arr[rowIndex].allocAmt as number
    },
    [decimals, form, splitDetailsByModule]
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
      const headerBalAmt = Number(form.getValues("totAmt")) || 0
      if (headerBalAmt === 0) {
        toast.error(
          "Balance Amount is zero. Cannot manually allocate. Please use Auto Allocation or enter Balance Amount."
        )
        // Set amount to 0
        const updatedData = [...currentData]

        const arr = updatedData as unknown as IGLContraDt[]
        const rowIndex = arr.findIndex((r) => r.itemNo === itemNo)
        if (rowIndex === -1) return

        const finalValue = updateAllocationCalculations(
          updatedData,
          rowIndex,
          0
        )
        return finalValue ?? 0
      } else {
        // When balTotAmt > 0, allow manual entry with validation
        const updatedData = [...currentData]
        const arr = updatedData as unknown as IGLContraDt[]
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
    const arLength = arDataDetails.length
    const apLength = apDataDetails.length

    if (!arLength || !apLength) {
      toast.error(
        "Please add both AR and AP transactions before auto allocation."
      )
      return
    }

    const resetAr = resetAllocationsForDetails(arDataDetails)
    const resetAp = resetAllocationsForDetails(apDataDetails)

    const allocationResult = allocateBetweenModules(
      resetAr as unknown as IGLContraDt[],
      resetAp as unknown as IGLContraDt[],
      decimalConfig
    )

    if (
      !allocationResult ||
      allocationResult.limitingAmount === undefined ||
      allocationResult.limitingAmount <= 0
    ) {
      toast.error(
        "Unable to allocate amounts. Ensure both sides have outstanding balances."
      )
      return
    }

    const normalizedAr = (
      allocationResult.updatedArDetails as unknown as GLContraDtSchemaType[]
    ).map((detail) => ({
      ...detail,
      documentId:
        typeof detail.documentId === "string"
          ? detail.documentId
          : String(detail.documentId ?? ""),
    }))

    const normalizedAp = (
      allocationResult.updatedApDetails as unknown as GLContraDtSchemaType[]
    ).map((detail) => ({
      ...detail,
      documentId:
        typeof detail.documentId === "string"
          ? detail.documentId
          : String(detail.documentId ?? ""),
    }))

    const combined = combineDetails(normalizedAr, normalizedAp)

    if (!validateAllocation(combined)) return

    applyDetailsChange(normalizedAr, normalizedAp, {
      recalcLocal: true,
    })
  }, [
    apDataDetails,
    applyDetailsChange,
    arDataDetails,
    combineDetails,
    decimalConfig,
    resetAllocationsForDetails,
    validateAllocation,
  ])

  const handleResetAllocation = useCallback(() => {
    if (dataDetails.length === 0) {
      return
    }

    const resetAr = resetAllocationsForDetails(arDataDetails)
    const resetAp = resetAllocationsForDetails(apDataDetails)
    applyDetailsChange(resetAr, resetAp, {
      recalcLocal: true,
    })
  }, [
    apDataDetails,
    applyDetailsChange,
    arDataDetails,
    dataDetails.length,
    resetAllocationsForDetails,
  ])

  // Check if supplier is selected

  const customerId = form.watch("customerId")
  const isCustomerSelected = customerId && customerId > 0
  const currencyId = form.watch("currencyId")
  const accountDate = form.watch("accountDate")

  const handleSelectArTransaction = useCallback(() => {
    if (!customerId || !currencyId || !accountDate) {
      return
    }

    arDialogParamsRef.current = {
      customerId,
      currencyId,
      accountDate: accountDate?.toString() || "",
      isRefund: false,
      documentId: form.getValues("contraId") || "0",
      transactionId: ARTransactionId.docsetoff,
    }

    setShowArTransactionDialog(true)
  }, [accountDate, currencyId, customerId, form])

  // Check if customer is selected
  const supplierId = form.watch("supplierId")
  const isSupplierSelected = supplierId && supplierId > 0

  const handleSelectApTransaction = useCallback(() => {
    if (!supplierId || !currencyId || !accountDate) {
      return
    }

    apDialogParamsRef.current = {
      supplierId,
      currencyId,
      accountDate: accountDate?.toString() || "",
      isRefund: false,
      documentId: form.getValues("contraId") || "0",
      transactionId: APTransactionId.docsetoff,
    }

    setShowApTransactionDialog(true)
  }, [accountDate, currencyId, form, supplierId])

  const handleArTxnAddSelectedTransactions = useCallback(
    (transactions: IArOutTransaction[]) => {
      if (!transactions || transactions.length === 0) {
        setShowArTransactionDialog(false)
        return
      }

      const startItemNo = getNextItemNo()
      const contraId = form.getValues("contraId") || "0"
      const contraNo = form.getValues("contraNo") || ""

      const newDetails: GLContraDtSchemaType[] = transactions.map(
        (transaction, index) => ({
          companyId,
          contraId,
          contraNo,
          itemNo: startItemNo + index,
          moduleId: ModuleId.ar,
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
          // Preserve original sign so credit notes / negative balances stay negative
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

      const nextAr = [...arDataDetails, ...newDetails]
      applyDetailsChange(nextAr, apDataDetails, { recalcLocal: true })
      setShowArTransactionDialog(false)
    },
    [
      apDataDetails,
      applyDetailsChange,
      arDataDetails,
      companyId,
      form,
      getNextItemNo,
    ]
  )

  const handleApTxnAddSelectedTransactions = useCallback(
    (transactions: IApOutTransaction[]) => {
      if (!transactions || transactions.length === 0) {
        setShowApTransactionDialog(false)
        return
      }

      const startItemNo = getNextItemNo()
      const contraId = form.getValues("contraId") || "0"
      const contraNo = form.getValues("contraNo") || ""

      const newDetails: GLContraDtSchemaType[] = transactions.map(
        (transaction, index) => {
          return {
            companyId,
            contraId,
            contraNo,
            itemNo: startItemNo + index,
            moduleId: ModuleId.ap,
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

      const nextAp = [...apDataDetails, ...newDetails]
      applyDetailsChange(arDataDetails, nextAp, { recalcLocal: true })
      setShowApTransactionDialog(false)
    },
    [
      apDataDetails,
      applyDetailsChange,
      arDataDetails,
      companyId,
      form,
      getNextItemNo,
    ]
  )

  return (
    <div className="w-full">
      <ContraForm
        form={form}
        onSuccessAction={onSuccessAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
        isCancelled={isCancelled}
        dataDetails={dataDetails}
      />
      <div className="flex flex-wrap items-center gap-1">
        <Button
          size="sm"
          onClick={handleAutoAllocation}
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
      </div>

      <div className="px-2 pt-1">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* AR Details Section */}
          <section className="border-border bg-card rounded-md border p-2 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <Button
                size="sm"
                onClick={handleSelectArTransaction}
                disabled={!isCustomerSelected}
                className={
                  !isCustomerSelected
                    ? "cursor-not-allowed px-3 py-1 text-xs opacity-50"
                    : "px-3 py-1 text-xs"
                }
                title="Select outstanding transactions"
              >
                <Plus className="h-4 w-4" />
                Select Txn
              </Button>
              <Badge className="border-blue-200 bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                Tot Alloc: {formatAmount(arSectionTotals.alloc)}
              </Badge>
              <Badge className="border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
                Tot Alloc Local:{" "}
                {formatAmount(
                  arSectionTotals.allocLocal,
                  decimalConfig.locAmtDec
                )}
              </Badge>
              <Badge className="border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800">
                Bal Amt: {formatAmount(arSectionTotals.balance)}
              </Badge>
              <Badge className="border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800">
                Ex Gain/Loss: {formatAmount(arSectionTotals.exhGainLoss)}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <ArGLContraDetailsTable
                key={`${refreshKey}-ar`}
                data={(arDataDetails as unknown as IGLContraDt[]) || []}
                visible={visible}
                onDeleteAction={handleArDelete}
                onBulkDeleteAction={handleArBulkDelete}
                onDataReorder={handleArDataReorder}
                onCellEdit={handleCellEdit}
              />
            </div>
          </section>

          {/* AP Details Section */}
          <section className="border-border bg-card rounded-md border p-2 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <Button
                size="sm"
                onClick={handleSelectApTransaction}
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
              <Badge className="border-blue-200 bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                Tot Alloc: {formatAmount(apSectionTotals.alloc)}
              </Badge>
              <Badge className="border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
                Tot Alloc Local:{" "}
                {formatAmount(
                  apSectionTotals.allocLocal,
                  decimalConfig.locAmtDec
                )}
              </Badge>
              <Badge className="border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800">
                Bal Amt: {formatAmount(apSectionTotals.balance)}
              </Badge>
              <Badge className="border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-800">
                Ex Gain/Loss: {formatAmount(apSectionTotals.exhGainLoss)}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <ApGLContraDetailsTable
                key={`${refreshKey}-ap`}
                data={(apDataDetails as unknown as IGLContraDt[]) || []}
                visible={visible}
                onDeleteAction={handleApDelete}
                onBulkDeleteAction={handleApBulkDelete}
                onDataReorder={handleApDataReorder}
                onCellEdit={handleCellEdit}
              />
            </div>
          </section>
        </div>
      </div>

      <DeleteConfirmation
        open={isBulkDeleteDialogOpenAr}
        onOpenChange={handleArBulkDeleteDialogChange}
        onConfirm={handleArBulkDeleteConfirm}
        onCancelAction={handleArBulkDeleteCancel}
        itemName={bulkDeleteItemNameAr}
        description="Selected AR contra details will be removed. This action cannot be undone."
      />

      <DeleteConfirmation
        open={isBulkDeleteDialogOpenAp}
        onOpenChange={handleApBulkDeleteDialogChange}
        onConfirm={handleApBulkDeleteConfirm}
        onCancelAction={handleApBulkDeleteCancel}
        itemName={bulkDeleteItemNameAp}
        description="Selected AP contra details will be removed. This action cannot be undone."
      />

      {/* Transaction Selection Dialog */}
      {showArTransactionDialog && arDialogParamsRef.current && (
        <ArOutStandingTransactionsDialog
          open={showArTransactionDialog}
          onOpenChangeAction={setShowArTransactionDialog}
          customerId={arDialogParamsRef.current.customerId}
          currencyId={arDialogParamsRef.current.currencyId}
          accountDate={arDialogParamsRef.current.accountDate}
          isRefund={arDialogParamsRef.current.isRefund}
          documentId={arDialogParamsRef.current.documentId}
          transactionId={arDialogParamsRef.current.transactionId}
          visible={visible}
          onAddSelected={handleArTxnAddSelectedTransactions}
          existingDocumentIds={arDataDetails.map((detail) =>
            Number(detail.documentId)
          )}
        />
      )}

      {/* Transaction Selection Dialog */}
      {showApTransactionDialog && apDialogParamsRef.current && (
        <ApOutStandingTransactionsDialog
          open={showApTransactionDialog}
          onOpenChangeAction={setShowApTransactionDialog}
          supplierId={apDialogParamsRef.current.supplierId}
          currencyId={apDialogParamsRef.current.currencyId}
          accountDate={apDialogParamsRef.current.accountDate}
          isRefund={apDialogParamsRef.current.isRefund}
          documentId={apDialogParamsRef.current.documentId}
          transactionId={apDialogParamsRef.current.transactionId}
          visible={visible}
          onAddSelected={handleApTxnAddSelectedTransactions}
          existingDocumentIds={apDataDetails.map((detail) =>
            Number(detail.documentId)
          )}
        />
      )}
    </div>
  )
}
