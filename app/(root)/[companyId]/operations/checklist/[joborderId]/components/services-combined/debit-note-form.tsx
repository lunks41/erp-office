"use client"

import { useCallback, useEffect, useRef } from "react"
import { calculateMultiplierAmount } from "@/helpers/account"
import {
  calculateTotalAfterVat,
  normalizeDebitNoteLineTotals,
} from "@/helpers/debit-note-calculations"
import { IDebitNoteDt, IDebitNoteHd, IJobOrderHd } from "@/interfaces/checklist"
import { IChargeLookup, IGstLookup } from "@/interfaces/lookup"
import { debitNoteDtSchema, DebitNoteDtSchemaType } from "@/schemas/checklist"
import { useCompanyStore } from "@/stores/company-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

import { getData } from "@/lib/api-client"
import { BasicSetting } from "@/lib/api-routes"
import { parseDate } from "@/lib/date-utils"
import { useChartOfAccountLookup, useGstLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { ChargeAutocomplete, GSTAutocomplete } from "@/components/autocomplete"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextArea from "@/components/custom/custom-textarea"

interface DebitNoteFormProps {
  debitNoteHd?: IDebitNoteHd
  editingDetail?: IDebitNoteDt | null
  existingDetails?: IDebitNoteDt[]
  submitAction: (data: DebitNoteDtSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isConfirmed?: boolean
  taskId: number
  companyId?: number
  onChargeChange?: (chargeName: string) => void // Add callback for charge name changes
  summaryTotals?: {
    totalAmount: number
    vatAmount: number
    totalAfterVat: number
  } // Summary totals from table
  currencyCode?: string // Currency code for remarks update
  baseCurrencyCode?: string // Base/local currency code for labels (e.g. "Base Local (SGD)")
  onServiceChargeUpdate?: (
    itemNo: number,
    chargeId: number,
    totAmtAftGst: number,
    serviceCharge: number,
    taskId: number,
    gstId: number,
    gstPercentage: number
  ) => void // Callback to update service charge entry when parent changes
  /** When true, form resets to create defaults (e.g. after adding a line item) */
  shouldResetForm?: boolean
  jobData?: IJobOrderHd
}

export default function DebitNoteForm({
  debitNoteHd,
  editingDetail,
  existingDetails = [],
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isConfirmed,
  taskId,
  companyId,
  onChargeChange,
  summaryTotals,
  currencyCode,
  baseCurrencyCode,
  onServiceChargeUpdate,
  shouldResetForm = false,
  jobData,
}: DebitNoteFormProps) {
  const { decimals } = useCompanyStore()

  // Store callback in ref to avoid dependency issues
  const onServiceChargeUpdateRef = useRef(onServiceChargeUpdate)

  useEffect(() => {
    onServiceChargeUpdateRef.current = onServiceChargeUpdate
  }, [onServiceChargeUpdate])

  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const priceDec = decimals[0]?.priceDec || 2
  const qtyDec = decimals[0]?.qtyDec || 2

  // taskId 8 or 9: use Prepayment; otherwise use ServiceCharge (labels and remarks)
  const isPrepaymentTask = taskId === 8 || taskId === 9
  const chargeTypeLabel = isPrepaymentTask ? "Prepayment" : "Service Chg"
  const isChargeLabel = isPrepaymentTask ? "Is Prepayment?" : "Is Sr Chg?"

  const { isLoading: _isChartOfAccountLoading } = useChartOfAccountLookup(
    Number(companyId)
  )

  // Get GST data for lookups
  const { data: allGst = [] } = useGstLookup()

  // Calculate next itemNo based on existing details (like invoice-details-form getNextItemNo)
  const getNextItemNo = useCallback(() => {
    if (existingDetails.length === 0) return 1
    const maxItemNo = Math.max(...existingDetails.map((d) => d.itemNo ?? 0))
    return maxItemNo + 1
  }, [existingDetails])

  // Factory for create-mode values (like invoice-details-form createDefaultValues – no separate default object)
  const createDefaultValues = useCallback(
    (itemNo: number): DebitNoteDtSchemaType => ({
      // If job order is taxable and has valid GST values, default debit note GST from job order.
      // Otherwise keep existing fallback behavior.
      ...(Number(jobData?.gstId) > 1 &&
      (Number(jobData?.gstPercentage) || 0) > 0
        ? {
            gstId: Number(jobData?.gstId),
            gstPercentage: Number(jobData?.gstPercentage ?? 0),
          }
        : {
            gstId: 1,
            gstPercentage: 0,
          }),
      debitNoteId: debitNoteHd?.debitNoteId ?? 0,
      debitNoteNo: debitNoteHd?.debitNoteNo ?? "",
      itemNo,
      refItemNo: 0,
      taskId: taskId,
      chargeId: 0,
      qty: 0,
      unitPrice: 0,
      totAmt: 0,
      gstAmt: 0,
      totAmtAftGst: 0,
      remarks: "",
      editVersion: 0,
      totLocalAmt: 0,
      isServiceCharge: false,
      serviceCharge: 0,
    }),
    [
      debitNoteHd?.debitNoteId,
      debitNoteHd?.debitNoteNo,
      taskId,
      jobData?.gstId,
      jobData?.gstPercentage,
    ]
  )

  // Stable initial defaultValues; form syncs from editingDetail only when it actually changes (see useEffect below)
  const form = useForm<DebitNoteDtSchemaType>({
    resolver: zodResolver(debitNoteDtSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: createDefaultValues(1),
  })

  const editingDetailRef = useRef(editingDetail)
  editingDetailRef.current = editingDetail

  // Refs to store original values on focus so we skip calculation on blur when unchanged
  const originalQtyRef = useRef<number>(0)
  const originalUnitPriceRef = useRef<number>(0)
  const originalTotAmtRef = useRef<number>(0)
  const originalTotLocalAmtRef = useRef<number>(0)

  // Exchange rate from debit note header: totLocalAmt = totAmt * exhRate => totAmt = totLocalAmt / exhRate
  const exhRate = Math.max(Number(debitNoteHd?.exhRate) || 1, 0.000001)

  // Reset form only when editingDetail identity changes (different row or create vs edit), not on every parent re-render
  const lastEditingKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const editingKey =
      editingDetail == null
        ? "create"
        : `${editingDetail.itemNo}-${editingDetail.gstId ?? 0}`
    if (lastEditingKeyRef.current === editingKey) return
    lastEditingKeyRef.current = editingKey
    if (editingDetail) {
      const gstId = Number(editingDetail.gstId) || 0
      form.reset({
        debitNoteId: editingDetail.debitNoteId ?? debitNoteHd?.debitNoteId ?? 0,
        debitNoteNo:
          editingDetail.debitNoteNo ?? debitNoteHd?.debitNoteNo ?? "",
        itemNo: editingDetail.itemNo ?? getNextItemNo(),
        refItemNo: editingDetail.refItemNo ?? 0,
        taskId: taskId,
        chargeId: editingDetail.chargeId ?? 0,
        qty: editingDetail.qty ?? 0,
        unitPrice: editingDetail.unitPrice ?? 0,
        totAmt: editingDetail.totAmt ?? 0,
        gstId,
        gstPercentage: editingDetail.gstPercentage ?? 0,
        gstAmt: editingDetail.gstAmt ?? 0,
        totAmtAftGst: editingDetail.totAmtAftGst ?? 0,
        remarks: editingDetail.remarks ?? "",
        editVersion: editingDetail.editVersion ?? 0,
        totLocalAmt: editingDetail.totLocalAmt ?? 0,
        isServiceCharge: editingDetail.isServiceCharge ?? false,
        serviceCharge: editingDetail.serviceCharge ?? 0,
      })
    } else {
      form.reset(createDefaultValues(getNextItemNo()))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDetail?.itemNo, editingDetail?.gstId, editingDetail == null])

  // Reset form to create-mode defaults when parent signals (e.g. after adding a line item)
  useEffect(() => {
    if (shouldResetForm) {
      form.reset(createDefaultValues(getNextItemNo()))
    }
  }, [shouldResetForm, form, createDefaultValues, getNextItemNo])

  // Helper function to calculate totAmtAftGst = totAmt + gstAmt
  const calculateTotAmtAftGst = useCallback(() => {
    const totAmt = form.getValues("totAmt") || 0
    const gstAmt = form.getValues("gstAmt") || 0
    const calculatedTotAmtAftGst = calculateTotalAfterVat(totAmt, gstAmt, amtDec)
    form.setValue("totAmtAftGst", calculatedTotAmtAftGst, { shouldDirty: false })
  }, [form, amtDec])

  // Helper function to calculate gstAmt and update related fields (uses ref so no editingDetail in deps = stable callback)
  const calculateGstAmt = useCallback(() => {
    if (isConfirmed) return
    const gstId = Number(form.getValues("gstId")) || 0
    const current = editingDetailRef.current
    const effectiveGstId = gstId > 0 ? gstId : Number(current?.gstId) || 0
    const totAmt = form.getValues("totAmt") || 0
    const gstPct = Number(form.getValues("gstPercentage")) || 0
    if (effectiveGstId > 0) {
      const selectedGst = allGst.find(
        (gst: IGstLookup) => Number(gst.gstId) === effectiveGstId
      )
      const gstPercentage =
        gstPct > 0 ? gstPct : (selectedGst?.gstPercentage ?? 0)
      requestAnimationFrame(() => {
        if (gstPct <= 0 && selectedGst)
          form.setValue("gstPercentage", gstPercentage, { shouldDirty: false })
        const calculatedGstAmt = calculateMultiplierAmount(
          totAmt,
          gstPercentage / 100,
          amtDec
        )
        form.setValue("gstAmt", calculatedGstAmt, { shouldDirty: false })
        calculateTotAmtAftGst()
      })
    } else {
      requestAnimationFrame(() => {
        form.setValue("gstPercentage", 0, { shouldDirty: false })
        form.setValue("gstAmt", 0, { shouldDirty: false })
        calculateTotAmtAftGst()
      })
    }
  }, [form, allGst, amtDec, isConfirmed, calculateTotAmtAftGst])

  // Helper function to calculate totAmt = qty * unitPrice, then gstAmt and totAmtAftGst
  const calculateTotAmt = useCallback(() => {
    if (isConfirmed) return
    const qty = form.getValues("qty") || 0
    const unitPrice = form.getValues("unitPrice") || 0
    const calculatedTotAmt = calculateMultiplierAmount(qty, unitPrice, amtDec)
    requestAnimationFrame(() => {
      form.setValue("totAmt", calculatedTotAmt, { shouldDirty: false })
      calculateGstAmt()
    })
  }, [form, amtDec, isConfirmed, calculateGstAmt])

  // When form has gstId but VAT % or Vat Amt is 0 (e.g. after edit load or allGst loaded late), recalc from lookup
  useEffect(() => {
    const detail = editingDetailRef.current
    if (!detail?.gstId || detail.gstId <= 0 || !allGst.length) return
    const gstPercentage = form.getValues("gstPercentage") ?? 0
    const gstAmt = form.getValues("gstAmt") ?? 0
    if (gstPercentage > 0 && gstAmt !== 0) return // Already set
    const timer = setTimeout(() => {
      calculateGstAmt()
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDetail?.itemNo, editingDetail?.gstId, allGst.length, form])

  // Sync gstId from editingDetail when GST options have loaded (fixes VAT dropdown not showing selected value on edit)
  useEffect(() => {
    if (!editingDetail?.gstId || editingDetail.gstId <= 0 || !allGst.length)
      return
    const currentGstId = Number(form.getValues("gstId")) || 0
    const detailGstId = Number(editingDetail.gstId) || 0
    if (currentGstId === detailGstId) return
    form.setValue("gstId", detailGstId, { shouldDirty: false })
  }, [editingDetail?.gstId, editingDetail?.itemNo, allGst.length, form])

  // Parse GST percentage from API response (handles: number, { data: number }, { data: { data: number } })
  const parseGstPercentageFromResponse = useCallback(
    (
      res: number | { data?: number | { data?: number } } | null | undefined
    ) => {
      if (res === null || res === undefined) return undefined
      if (typeof res === "number" && !Number.isNaN(res)) return res
      const raw = (res as { data?: number | { data?: number } }).data
      if (typeof raw === "number" && !Number.isNaN(raw)) return raw
      if (raw && typeof raw === "object" && "data" in raw) {
        const inner = Number((raw as { data?: number }).data)
        return Number.isNaN(inner) ? undefined : inner
      }
      return undefined
    },
    []
  )

  // Fetch GST percentage from API when editing (same as checklist-main) so VAT % matches gstId for debit note date
  useEffect(() => {
    if (!editingDetail?.gstId || editingDetail.gstId <= 0 || !debitNoteHd)
      return
    // If GST percentage is already available from the row, skip API call
    const gstId = Number(editingDetail.gstId) || 0
    const debitNoteDate = debitNoteHd.debitNoteDate || new Date()
    const dateValue = debitNoteDate
    const date =
      dateValue instanceof Date
        ? dateValue
        : parseDate(
            typeof dateValue === "string" ? dateValue : String(dateValue)
          ) || new Date(dateValue)
    if (!date || isNaN(date.getTime())) return

    const fetchGstPercentage = async () => {
      try {
        const dt = format(date, "yyyy-MM-dd")
        const res = await getData(
          `${BasicSetting.getGstPercentage}/${gstId}/${dt}`
        )
        const gstPercentage = parseGstPercentageFromResponse(res)
        if (gstPercentage !== undefined && gstPercentage !== null) {
          form.setValue("gstPercentage", gstPercentage, { shouldDirty: false })
          form.trigger("gstPercentage")
          const totAmt = form.getValues("totAmt") || 0
          const calculatedGstAmt = calculateMultiplierAmount(
            totAmt,
            gstPercentage / 100,
            amtDec
          )
          form.setValue("gstAmt", calculatedGstAmt, { shouldDirty: false })
          calculateTotAmtAftGst()
        }
      } catch (error) {
        console.error("Error fetching GST percentage on edit:", error)
      }
    }
    fetchGstPercentage()
  }, [
    editingDetail?.gstId,
    editingDetail?.gstPercentage,
    editingDetail?.itemNo,
    debitNoteHd,
    form,
    amtDec,
    calculateTotAmtAftGst,
    parseGstPercentageFromResponse,
  ])

  // Handler for qty change (called from blur when value changed)
  const handleQtyChange = useCallback(() => {
    calculateTotAmt()
  }, [calculateTotAmt])

  const handleQtyFocus = useCallback(() => {
    originalQtyRef.current = form.getValues("qty") ?? 0
  }, [form])

  const handleQtyBlur = useCallback(() => {
    const current = form.getValues("qty") ?? 0
    if (current === originalQtyRef.current) return
    handleQtyChange()
  }, [form, handleQtyChange])

  // Handler for unitPrice change (called from blur when value changed)
  const handleUnitPriceChange = useCallback(() => {
    calculateTotAmt()
  }, [calculateTotAmt])

  const handleUnitPriceFocus = useCallback(() => {
    originalUnitPriceRef.current = form.getValues("unitPrice") ?? 0
  }, [form])

  const handleUnitPriceBlur = useCallback(() => {
    const current = form.getValues("unitPrice") ?? 0
    if (current === originalUnitPriceRef.current) return
    handleUnitPriceChange()
  }, [form, handleUnitPriceChange])

  // Handler for totAmt change (when manually entered) - recalc gstAmt same as qty/unitPrice (use form gstPercentage or lookup)
  const handleTotAmtChange = useCallback(
    (newTotAmt?: number) => {
      if (newTotAmt !== undefined) {
        form.setValue("totAmt", newTotAmt, { shouldDirty: false })
      }
      calculateGstAmt()
    },
    [form, calculateGstAmt]
  )

  const handleTotAmtFocus = useCallback(() => {
    originalTotAmtRef.current = form.getValues("totAmt") ?? 0
  }, [form])

  const handleTotAmtBlur = useCallback(() => {
    const current = form.getValues("totAmt") ?? 0
    if (current === originalTotAmtRef.current) return
    handleTotAmtChange()
  }, [form, handleTotAmtChange])

  // When user enters totLocalAmt, on blur: unitPrice = totLocalAmt / exhRate, then recalc totAmt, gst and totAmtAftGst
  const handleTotLocalAmtFocus = useCallback(() => {
    originalTotLocalAmtRef.current = form.getValues("totLocalAmt") ?? 0
  }, [form])

  const handleTotLocalAmtBlur = useCallback(() => {
    const totLocalAmt = Number(form.getValues("totLocalAmt")) || 0
    if (totLocalAmt === originalTotLocalAmtRef.current) return
    if (exhRate <= 0) return
    const calculatedUnitPrice = Number(
      (totLocalAmt / exhRate).toFixed(priceDec)
    )
    form.setValue("unitPrice", calculatedUnitPrice, { shouldDirty: true })
    form.trigger("unitPrice")
    calculateTotAmt()
    calculateGstAmt()

    // Append "- {currencyCode} {baseAmt}" to remarks
    const currCode = baseCurrencyCode ?? currencyCode ?? ""
    if (currCode) {
      const currentRemarks = form.getValues("remarks") || ""
      const suffix = ` - ${currCode} `
      // Strip existing suffix to avoid duplication
      const lastIdx = currentRemarks.lastIndexOf(suffix)
      const baseRemarks =
        lastIdx !== -1 ? currentRemarks.substring(0, lastIdx) : currentRemarks
      const formattedAmt = totLocalAmt.toFixed(locAmtDec)
      const newRemarks = baseRemarks
        ? `${baseRemarks} - ${currCode} ${formattedAmt}`
        : `- ${currCode} ${formattedAmt}`
      form.setValue("remarks", newRemarks, { shouldDirty: true })
    }
  }, [
    form,
    exhRate,
    priceDec,
    calculateTotAmt,
    calculateGstAmt,
    baseCurrencyCode,
    currencyCode,
    locAmtDec,
  ])

  // Handler for gstAmt change (when manually entered)
  const handleGstAmtChange = useCallback(() => {
    calculateTotAmtAftGst()
  }, [calculateTotAmtAftGst])

  // Handler for isServiceCharge checkbox change (table updates only on Update button)
  const handleIsServiceChargeChange = useCallback(() => {
    // No auto-update to table; user must click Update to apply
  }, [])

  // Handler for serviceCharge percentage change (table updates only on Update button)
  const handleServiceChargeChange = useCallback(() => {
    // No auto-update to table; user must click Update to apply
  }, [])

  // 4. Handle charge name change - update remarks
  const handleChargeChange = useCallback(
    (selectedCharge: IChargeLookup | null) => {
      if (selectedCharge && selectedCharge.chargeName) {
        const currentRemarks = form.getValues("remarks") || ""
        const remarksLower = currentRemarks.toLowerCase()
        // Do not overwrite remarks when they contain predefined Prepayment or Service Charges
        const hasPrepaymentRemark =
          (taskId === 8 || taskId === 9) && remarksLower.includes("prepayment")
        const hasServiceChargeRemark =
          taskId !== 8 &&
          taskId !== 9 &&
          remarksLower.includes("service charge")
        if (hasPrepaymentRemark || hasServiceChargeRemark) {
          onChargeChange?.(selectedCharge.chargeName)
          return
        }
        // Only update if remarks is empty or if it matches the previous charge name
        if (!currentRemarks || currentRemarks.trim() === "") {
          form.setValue("remarks", selectedCharge.chargeName, {
            shouldDirty: false,
          })
        }
        onChargeChange?.(selectedCharge.chargeName)
      } else {
        onChargeChange?.("")
      }
    },
    [form, onChargeChange, taskId]
  )

  // 5. Handle GST change - get percentage from API then calculate (use selectedGst so gstId is correct when form not yet updated)
  const handleGstChange = useCallback(
    async (selectedGst: IGstLookup | null) => {
      const gstId = selectedGst?.gstId ?? form.getValues("gstId")

      if (!gstId || gstId === 0) {
        form.setValue("gstPercentage", 0, { shouldDirty: false })
        form.setValue("gstAmt", 0, { shouldDirty: false })
        calculateTotAmtAftGst()
        return
      }

      let gstPercentage: number | undefined
      try {
        const dateValue = debitNoteHd?.debitNoteDate || new Date()
        const date =
          dateValue instanceof Date
            ? dateValue
            : parseDate(
                typeof dateValue === "string" ? dateValue : String(dateValue)
              ) || new Date(dateValue)
        if (!date || isNaN(date.getTime())) {
          throw new Error("Invalid debit note date")
        }
        const res = await getData(
          `${BasicSetting.getGstPercentage}/${gstId}/${format(date, "yyyy-MM-dd")}`
        )
        gstPercentage = parseGstPercentageFromResponse(res)
      } catch (error) {
        console.error("Error fetching GST percentage:", error)
        const fallback = allGst.find((gst: IGstLookup) => gst.gstId === gstId)
        gstPercentage = fallback?.gstPercentage ?? 0
      }

      const pct = gstPercentage ?? 0
      form.setValue("gstPercentage", pct, { shouldDirty: false })
      form.trigger("gstPercentage")
      const totAmt = form.getValues("totAmt") || 0
      const gstAmt = calculateMultiplierAmount(totAmt, pct / 100, amtDec)
      form.setValue("gstAmt", gstAmt, { shouldDirty: false })
      calculateTotAmtAftGst()
    },
    [
      form,
      debitNoteHd,
      allGst,
      amtDec,
      calculateTotAmtAftGst,
      parseGstPercentageFromResponse,
    ]
  )

  const onSubmit = (data: DebitNoteDtSchemaType) => {
    submitAction(normalizeDebitNoteLineTotals(data, { amtDec }))
  }

  // Cancel edit / clear form (aligned with invoice-details-form handleCancelEdit)
  const handleCancel = () => {
    const nextItemNo = getNextItemNo()
    form.reset(createDefaultValues(nextItemNo))
    onChargeChange?.("")
    onCancelAction?.()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full gap-3"
      >
        {/* Left Section: Form Fields */}
        <div className="w-[88%] min-w-0">
          <div className="space-y-2">
            {/* Row 1: Charge, Qty, Unit Price, Amt Local, Total Amt */}
            <div className="grid grid-cols-10 gap-2">
              <div className="col-span-2">
                <ChargeAutocomplete
                  form={form}
                  name="chargeId"
                  label="Charge Name"
                  isRequired={true}
                  isDisabled={isConfirmed}
                  onChangeEvent={handleChargeChange}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="qty"
                  label="Qty"
                  round={qtyDec}
                  isDisabled={isConfirmed}
                  onFocusEvent={handleQtyFocus}
                  onBlurEvent={handleQtyBlur}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="totLocalAmt"
                  label={
                    (baseCurrencyCode ?? currencyCode)
                      ? `Base  (${baseCurrencyCode ?? currencyCode})`
                      : "Base "
                  }
                  round={locAmtDec}
                  isDisabled={isConfirmed}
                  onFocusEvent={handleTotLocalAmtFocus}
                  onBlurEvent={handleTotLocalAmtBlur}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="unitPrice"
                  label="Unit Price"
                  round={priceDec}
                  isDisabled={isConfirmed}
                  onFocusEvent={handleUnitPriceFocus}
                  onBlurEvent={handleUnitPriceBlur}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="totAmt"
                  label="Total Amt"
                  round={amtDec}
                  isDisabled={isConfirmed}
                  onFocusEvent={handleTotAmtFocus}
                  onBlurEvent={handleTotAmtBlur}
                />
              </div>
              <div className="col-span-1 border-l border-slate-200 pl-2">
                <GSTAutocomplete
                  form={form}
                  name="gstId"
                  label={`VAT (${form.watch("gstPercentage") ?? 0}%)`}
                  isDisabled={isConfirmed}
                  onChangeEvent={handleGstChange}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="gstPercentage"
                  label="VAT %"
                  round={amtDec}
                  isDisabled={true}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="gstAmt"
                  label="VAT Amt"
                  round={amtDec}
                  isDisabled={isConfirmed}
                  onBlurEvent={handleGstAmtChange}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="totAmtAftGst"
                  label="Tot Aft VAT"
                  round={amtDec}
                  isDisabled={true}
                />
              </div>
            </div>

            {/* Row 2: Vat, Vat %, Vat Amt, Tot Aft Vat, Is Prepayment/Is Sr Chg?, Prepayment/Service Chg, Remarks, Action Buttons */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-1">
                <CustomSwitch
                  form={form}
                  name="isServiceCharge"
                  label={isChargeLabel}
                  isDisabled={isConfirmed}
                  onBlurEvent={handleIsServiceChargeChange}
                />
              </div>

              <div className="col-span-1">
                <CustomNumberInput
                  form={form}
                  name="serviceCharge"
                  label={chargeTypeLabel}
                  round={amtDec}
                  isDisabled={isConfirmed}
                  onBlurEvent={handleServiceChargeChange}
                />
              </div>

              <div className="col-span-6">
                <CustomTextArea
                  form={form}
                  name="remarks"
                  label="Remarks"
                  isDisabled={isConfirmed}
                  isRequired={true}
                  minRows={3}
                  maxRows={6}
                />
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 flex items-end justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleCancel}
                  disabled={isConfirmed}
                  size="sm"
                >
                  {isConfirmed ? "Close" : "Cancel"}
                </Button>
                {!isConfirmed && (
                  <Button type="submit" disabled={isSubmitting} size="sm">
                    {isSubmitting
                      ? "Saving..."
                      : editingDetail
                        ? "Update"
                        : "Add"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Summary Box */}
        <div className="w-[12%] min-w-0 shrink-0">
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 shadow-sm">
            <div className="mb-3 border-b border-slate-200 pb-2 text-center text-sm font-semibold text-slate-700">
              Total Summary
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Amt</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  {(summaryTotals?.totalAmount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">VAT</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  {(summaryTotals?.vatAmount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {(summaryTotals?.totalAfterVat || 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
