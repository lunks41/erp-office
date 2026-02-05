"use client"

import { useCallback, useEffect, useRef } from "react"
import { calculateMultiplierAmount } from "@/helpers/account"
import { IDebitNoteDt, IDebitNoteHd } from "@/interfaces/checklist"
import { IChargeLookup, IGstLookup } from "@/interfaces/lookup"
import { DebitNoteDtSchemaType, debitNoteDtSchema } from "@/schemas/checklist"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

import { getData } from "@/lib/api-client"
import { BasicSetting } from "@/lib/api-routes"
import { parseDate } from "@/lib/date-utils"
import { useChartOfAccountLookup, useGstLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { ChargeAutocomplete, GSTAutocomplete } from "@/components/autocomplete"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import CustomNumberInput from "@/components/custom/custom-number-input"
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
  onServiceChargeUpdate?: (
    itemNo: number,
    chargeId: number,
    totAmtAftGst: number,
    serviceCharge: number,
    taskId: number,
    gstId: number,
    gstPercentage: number
  ) => void // Callback to update service charge entry when parent changes
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
  currencyCode: _currencyCode,
  onServiceChargeUpdate,
}: DebitNoteFormProps) {
  const { decimals } = useAuthStore()

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
      debitNoteId: debitNoteHd?.debitNoteId ?? 0,
      debitNoteNo: debitNoteHd?.debitNoteNo ?? "",
      itemNo,
      refItemNo: 0,
      taskId: taskId,
      chargeId: 0,
      qty: 0,
      unitPrice: 0,
      totAmt: 0,
      gstId: 1,
      gstPercentage: 0,
      gstAmt: 0,
      totAmtAftGst: 0,
      remarks: "",
      editVersion: 0,
      totLocalAmt: 0,
      isServiceCharge: false,
      serviceCharge: 0,
    }),
    [debitNoteHd?.debitNoteId, debitNoteHd?.debitNoteNo, taskId]
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
        gstId: editingDetail.gstId ?? 0,
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

  // Helper function to calculate totAmtAftGst = totAmt + gstAmt
  const calculateTotAmtAftGst = useCallback(() => {
    const totAmt = form.getValues("totAmt") || 0
    const gstAmt = form.getValues("gstAmt") || 0
    const calculatedTotAmtAftGst = totAmt + gstAmt
    requestAnimationFrame(() => {
      form.setValue("totAmtAftGst", calculatedTotAmtAftGst, {
        shouldDirty: false,
      })
      // Service charge row updates only on form submit (Update button), not here
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, taskId])

  // Helper function to calculate totAmt = qty * unitPrice
  const calculateTotAmt = useCallback(() => {
    if (isConfirmed) return
    const qty = form.getValues("qty") || 0
    const unitPrice = form.getValues("unitPrice") || 0
    const calculatedTotAmt = calculateMultiplierAmount(qty, unitPrice, amtDec)
    requestAnimationFrame(() => {
      form.setValue("totAmt", calculatedTotAmt, { shouldDirty: false })
      calculateTotAmtAftGst()
    })
  }, [form, amtDec, isConfirmed, calculateTotAmtAftGst])

  // Helper function to calculate gstAmt and update related fields (uses ref so no editingDetail in deps = stable callback)
  const calculateGstAmt = useCallback(() => {
    if (isConfirmed) return
    const gstId = form.getValues("gstId") ?? 0
    const current = editingDetailRef.current
    const effectiveGstId = gstId > 0 ? gstId : (current?.gstId ?? 0)
    const totAmt = form.getValues("totAmt") || 0
    if (effectiveGstId > 0) {
      const selectedGst = allGst.find(
        (gst: IGstLookup) => gst.gstId === effectiveGstId
      )
      if (selectedGst) {
        const gstPercentage = selectedGst.gstPercentage || 0
        requestAnimationFrame(() => {
          form.setValue("gstPercentage", gstPercentage, { shouldDirty: false })
          const calculatedGstAmt = calculateMultiplierAmount(
            totAmt,
            gstPercentage / 100,
            amtDec
          )
          form.setValue("gstAmt", calculatedGstAmt, { shouldDirty: false })
          calculateTotAmtAftGst()
        })
      }
    } else {
      requestAnimationFrame(() => {
        form.setValue("gstPercentage", 0, { shouldDirty: false })
        form.setValue("gstAmt", 0, { shouldDirty: false })
        calculateTotAmtAftGst()
      })
    }
  }, [form, allGst, amtDec, isConfirmed, calculateTotAmtAftGst])

  // When form has gstId but VAT % or Vat Amt is 0 (e.g. after edit load or allGst loaded late), recalc from lookup
  useEffect(() => {
    const detail = editingDetailRef.current
    if (!detail?.gstId || detail.gstId <= 0 || !allGst.length) return
    const gstPercentage = form.getValues("gstPercentage") ?? 0
    const gstAmt = form.getValues("gstAmt") ?? 0
    if (gstPercentage > 0 && gstAmt > 0) return // Already set
    const timer = setTimeout(() => {
      calculateGstAmt()
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDetail?.itemNo, editingDetail?.gstId, allGst.length, form])

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

  // Handler for totAmt change (when manually entered); uses ref so no editingDetail in deps
  const handleTotAmtChange = useCallback(
    (newTotAmt?: number) => {
      requestAnimationFrame(() => {
        const totAmt = form.getValues("totAmt") ?? newTotAmt ?? 0
        const gstId =
          form.getValues("gstId") ?? editingDetailRef.current?.gstId ?? 0
        if (gstId > 0 && totAmt >= 0) {
          const selectedGst = allGst.find(
            (gst: IGstLookup) => gst.gstId === gstId
          )
          if (selectedGst) {
            const gstPercentage = selectedGst.gstPercentage || 0
            form.setValue("gstPercentage", gstPercentage, {
              shouldDirty: false,
            })
            const calculatedGstAmt = calculateMultiplierAmount(
              totAmt,
              gstPercentage / 100,
              amtDec
            )
            form.setValue("gstAmt", calculatedGstAmt, { shouldDirty: false })
            calculateTotAmtAftGst()
          }
        }
        if (gstId <= 0) calculateGstAmt()
      })
    },
    [form, allGst, amtDec, calculateGstAmt, calculateTotAmtAftGst]
  )

  const handleTotAmtFocus = useCallback(() => {
    originalTotAmtRef.current = form.getValues("totAmt") ?? 0
  }, [form])

  const handleTotAmtBlur = useCallback(() => {
    const current = form.getValues("totAmt") ?? 0
    if (current === originalTotAmtRef.current) return
    handleTotAmtChange()
  }, [form, handleTotAmtChange])

  // When user enters totLocalAmt, on blur: unitPrice = exhRate / totLocalAmt, then recalc totAmt, gst and totAmtAftGst
  const handleTotLocalAmtFocus = useCallback(() => {
    originalTotLocalAmtRef.current = form.getValues("totLocalAmt") ?? 0
  }, [form])

  const handleTotLocalAmtBlur = useCallback(() => {
    const totLocalAmt = Number(form.getValues("totLocalAmt")) || 0
    if (totLocalAmt === originalTotLocalAmtRef.current) return
    if (exhRate <= 0 || totLocalAmt <= 0) return
    const calculatedUnitPrice = Number(
      (totLocalAmt / exhRate).toFixed(priceDec)
    )
    form.setValue("unitPrice", calculatedUnitPrice, { shouldDirty: true })
    form.trigger("unitPrice")
    calculateTotAmt()
    calculateGstAmt()
  }, [form, exhRate, priceDec, calculateTotAmt, calculateGstAmt])

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

  // 5. Handle GST change - get percentage and calculate gstAmt
  const handleGstChange = useCallback(async () => {
    const gstId = form.getValues("gstId")
    const debitNoteDate = debitNoteHd?.debitNoteDate || new Date()

    // Check if gstId exists before making API call
    if (!gstId || gstId === 0) {
      form.setValue("gstPercentage", 0, { shouldDirty: false })
      form.setValue("gstAmt", 0, { shouldDirty: false })
      calculateTotAmtAftGst()
      return
    }

    // Set VAT % and Vat Amt immediately from lookup so they are not zero while API loads
    const selectedGstSync = allGst.find(
      (gst: IGstLookup) => gst.gstId === gstId
    )
    if (selectedGstSync) {
      const gstPercentageSync = selectedGstSync.gstPercentage || 0
      const totAmt = form.getValues("totAmt") || 0
      form.setValue("gstPercentage", gstPercentageSync, { shouldDirty: false })
      const calculatedGstAmtSync = calculateMultiplierAmount(
        totAmt,
        gstPercentageSync / 100,
        amtDec
      )
      form.setValue("gstAmt", calculatedGstAmtSync, { shouldDirty: false })
      calculateTotAmtAftGst()
    }

    try {
      // Format date for API (yyyy-MM-dd format)
      const dateValue = debitNoteDate
      const date =
        dateValue instanceof Date
          ? dateValue
          : parseDate(
              typeof dateValue === "string" ? dateValue : String(dateValue)
            ) || new Date(dateValue)

      if (!date || isNaN(date.getTime())) {
        console.error("Invalid date for GST percentage lookup")
        return
      }

      const formattedDate = format(date, "yyyy-MM-dd")

      // Fetch GST percentage from API based on gstId and date
      const res = await getData(
        `${BasicSetting.getGstPercentage}/${gstId}/${formattedDate}`
      )

      const gstPercentage = res?.data as number

      if (gstPercentage !== undefined && gstPercentage !== null) {
        requestAnimationFrame(() => {
          // Set the GST percentage
          form.setValue("gstPercentage", gstPercentage, { shouldDirty: false })
          form.trigger("gstPercentage")

          // Calculate GST amount from the fetched percentage
          const totAmt = form.getValues("totAmt") || 0
          const calculatedGstAmt = calculateMultiplierAmount(
            totAmt,
            gstPercentage / 100,
            amtDec
          )
          form.setValue("gstAmt", calculatedGstAmt, { shouldDirty: false })

          // Recalculate total amount after GST
          calculateTotAmtAftGst()
        })
      }
    } catch (error) {
      console.error("Error fetching GST percentage:", error)
      // Fallback to using GST lookup data if API fails
      const selectedGst = allGst.find((gst: IGstLookup) => gst.gstId === gstId)
      if (selectedGst) {
        const gstPercentage = selectedGst.gstPercentage || 0
        requestAnimationFrame(() => {
          form.setValue("gstPercentage", gstPercentage, {
            shouldDirty: false,
          })
          // Calculate GST amount from the lookup percentage
          const totAmt = form.getValues("totAmt") || 0
          const calculatedGstAmt = calculateMultiplierAmount(
            totAmt,
            gstPercentage / 100,
            amtDec
          )
          form.setValue("gstAmt", calculatedGstAmt, { shouldDirty: false })
          calculateTotAmtAftGst()
        })
      }
    }
  }, [form, debitNoteHd, allGst, amtDec, calculateTotAmtAftGst])

  const onSubmit = (data: DebitNoteDtSchemaType) => {
    submitAction(data)
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
        className="grid grid-cols-12 gap-2"
      >
        {/* Left Section: Form Fields */}
        <Card className="col-span-10">
          <CardContent className="bg-transparent px-3 py-0">
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
                    label="Amt Local"
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
                <div className="col-span-1">
                  <GSTAutocomplete
                    form={form}
                    name="gstId"
                    label="Vat"
                    isDisabled={isConfirmed}
                    onChangeEvent={handleGstChange}
                  />
                </div>

                <div className="col-span-1">
                  <CustomNumberInput
                    form={form}
                    name="gstPercentage"
                    label="Vat %"
                    round={amtDec}
                    isDisabled={true}
                  />
                </div>

                <div className="col-span-1">
                  <CustomNumberInput
                    form={form}
                    name="gstAmt"
                    label="Vat Amt"
                    round={amtDec}
                    isDisabled={isConfirmed}
                    onBlurEvent={handleGstAmtChange}
                  />
                </div>

                <div className="col-span-1">
                  <CustomNumberInput
                    form={form}
                    name="totAmtAftGst"
                    label="Tot Aft Vat"
                    round={amtDec}
                    isDisabled={true}
                  />
                </div>
              </div>

              {/* Row 2: Vat, Vat %, Vat Amt, Tot Aft Vat, Is Prepayment/Is Sr Chg?, Prepayment/Service Chg, Remarks, Action Buttons */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-1">
                  <CustomCheckbox
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

                <div className="col-span-5">
                  <CustomTextArea
                    form={form}
                    name="remarks"
                    label="Remarks"
                    isDisabled={isConfirmed}
                    isRequired={true}
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
          </CardContent>
        </Card>

        {/* Right Section: Summary Box */}
        <Card className="col-span-2">
          <CardContent className="bg-transparent px-3 py-0">
            <div className="w-full rounded-md border border-blue-200 bg-blue-50 p-3 shadow-sm">
              {/* Header */}
              <div className="mb-2 border-b border-blue-300 pb-2 text-center text-sm font-bold text-blue-800">
                Total Summary
              </div>

              {/* Summary Values */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-600">Amt</span>
                  <span className="font-medium text-gray-700">
                    {(summaryTotals?.totalAmount || 0).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-600">VAT</span>
                  <span className="font-medium text-gray-700">
                    {(summaryTotals?.vatAmount || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <hr className="my-1 border-blue-300" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800">Total</span>
                  <span className="font-bold text-blue-900">
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
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
