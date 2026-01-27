"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
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
  initialData?: IDebitNoteDt
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
    taskId: number
  ) => void // Callback to update service charge entry when parent changes
}

export default function DebitNoteForm({
  debitNoteHd,
  initialData,
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
  const { isLoading: _isChartOfAccountLoading } = useChartOfAccountLookup(
    Number(companyId)
  )

  // Get GST data for lookups
  const { data: allGst = [] } = useGstLookup()

  const defaultValues = useMemo(
    () => ({
      debitNoteId: initialData?.debitNoteId ?? debitNoteHd?.debitNoteId,
      debitNoteNo: debitNoteHd?.debitNoteNo,
      itemNo: 0,
      refItemNo: 0,
      taskId: taskId,
      chargeId: 0,
      qty: 0,
      unitPrice: 0,
      totAmt: 0,
      gstId: 0,
      gstPercentage: 0,
      gstAmt: 0,
      totAmtAftGst: 0,
      remarks: "",
      editVersion: 0,
      totLocalAmt: 0,
      isServiceCharge: false,
      serviceCharge: 0,
    }),
    [
      initialData?.debitNoteId,
      debitNoteHd?.debitNoteId,
      debitNoteHd?.debitNoteNo,
      taskId,
    ]
  )

  const form = useForm<DebitNoteDtSchemaType>({
    resolver: zodResolver(debitNoteDtSchema),
    mode: "onChange", // Validate on blur to show errors after user interaction
    defaultValues: initialData
      ? {
          debitNoteId:
            initialData?.debitNoteId ?? debitNoteHd?.debitNoteId ?? 0,
          debitNoteNo:
            initialData?.debitNoteNo ?? debitNoteHd?.debitNoteNo ?? "",
          itemNo: initialData?.itemNo ?? 0,
          refItemNo: initialData?.refItemNo ?? 0,
          taskId: taskId,
          chargeId: initialData?.chargeId ?? 0,
          qty: initialData?.qty ?? 0,
          unitPrice: initialData?.unitPrice ?? 0,
          totAmt: initialData?.totAmt ?? 0,
          gstId: initialData?.gstId ?? 0,
          gstPercentage: initialData?.gstPercentage ?? 0,
          gstAmt: initialData?.gstAmt ?? 0,
          totAmtAftGst: initialData?.totAmtAftGst ?? 0,
          remarks: initialData?.remarks ?? "",
          editVersion: initialData?.editVersion ?? 0,
          totLocalAmt: initialData?.totLocalAmt ?? 0,
          isServiceCharge: initialData?.isServiceCharge ?? false,
          serviceCharge: initialData?.serviceCharge ?? 0,
        }
      : {
          ...defaultValues,
        },
  })

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        debitNoteId: initialData?.debitNoteId ?? debitNoteHd?.debitNoteId ?? 0,
        debitNoteNo: initialData?.debitNoteNo ?? debitNoteHd?.debitNoteNo ?? "",
        itemNo: initialData?.itemNo ?? 0,
        refItemNo: initialData?.refItemNo ?? 0,
        taskId: taskId,
        chargeId: initialData?.chargeId ?? 0,
        qty: initialData?.qty ?? 0,
        unitPrice: initialData?.unitPrice ?? 0,
        totAmt: initialData?.totAmt ?? 0,
        gstId: initialData?.gstId ?? 0,
        gstPercentage: initialData?.gstPercentage ?? 0,
        gstAmt: initialData?.gstAmt ?? 0,
        totAmtAftGst: initialData?.totAmtAftGst ?? 0,
        remarks: initialData?.remarks ?? "",
        editVersion: initialData?.editVersion ?? 0,
        totLocalAmt: initialData?.totLocalAmt ?? 0,
        isServiceCharge: initialData?.isServiceCharge ?? false,
        serviceCharge: initialData?.serviceCharge ?? 0,
      })
    } else {
      // Reset to default values when initialData is cleared (create mode)
      form.reset(defaultValues)
    }
    // Use itemNo as the key to detect changes - when it changes or becomes undefined, reset form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.itemNo, form])

  // Watch for isServiceCharge and serviceCharge changes to auto-update service charge entry
  const isServiceCharge = form.watch("isServiceCharge")
  const serviceCharge = form.watch("serviceCharge")
  const totAmtAftGst = form.watch("totAmtAftGst")
  const itemNo = form.watch("itemNo")
  const chargeId = form.watch("chargeId")

  useEffect(() => {
    if (
      onServiceChargeUpdateRef.current &&
      isServiceCharge &&
      serviceCharge > 0 &&
      totAmtAftGst > 0 &&
      itemNo > 0
    ) {
      onServiceChargeUpdateRef.current(
        itemNo,
        chargeId,
        totAmtAftGst,
        serviceCharge,
        taskId
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServiceCharge, serviceCharge, totAmtAftGst, itemNo, chargeId, taskId])

  // Helper function to calculate totAmtAftGst = totAmt + gstAmt
  const calculateTotAmtAftGst = useCallback(() => {
    const totAmt = form.getValues("totAmt") || 0
    const gstAmt = form.getValues("gstAmt") || 0
    const calculatedTotAmtAftGst = totAmt + gstAmt
    requestAnimationFrame(() => {
      form.setValue("totAmtAftGst", calculatedTotAmtAftGst, {
        shouldDirty: false,
      })

      // Auto-update service charge entry if isServiceCharge is checked
      if (onServiceChargeUpdateRef.current) {
        const isServiceCharge = form.getValues("isServiceCharge")
        const serviceCharge = form.getValues("serviceCharge") || 0
        const itemNo = form.getValues("itemNo") || 0
        const chargeId = form.getValues("chargeId") || 0

        if (
          isServiceCharge &&
          serviceCharge > 0 &&
          calculatedTotAmtAftGst > 0 &&
          itemNo > 0
        ) {
          onServiceChargeUpdateRef.current(
            itemNo,
            chargeId,
            calculatedTotAmtAftGst,
            serviceCharge,
            taskId
          )
        }
      }
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

  // Helper function to calculate gstAmt and update related fields
  const calculateGstAmt = useCallback(() => {
    if (isConfirmed) return
    const gstId = form.getValues("gstId")
    const totAmt = form.getValues("totAmt") || 0

    if (gstId && gstId > 0) {
      const selectedGst = allGst.find((gst: IGstLookup) => gst.gstId === gstId)
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

  // Handler for qty change
  const handleQtyChange = useCallback(() => {
    calculateTotAmt()
  }, [calculateTotAmt])

  // Handler for unitPrice change
  const handleUnitPriceChange = useCallback(() => {
    calculateTotAmt()
  }, [calculateTotAmt])

  // Handler for totAmt change (when manually entered)
  const handleTotAmtChange = useCallback(() => {
    calculateGstAmt()
  }, [calculateGstAmt])

  // Handler for gstAmt change (when manually entered)
  const handleGstAmtChange = useCallback(() => {
    calculateTotAmtAftGst()
  }, [calculateTotAmtAftGst])

  // Handler for isServiceCharge checkbox change
  const handleIsServiceChargeChange = useCallback(() => {
    if (!onServiceChargeUpdate) return

    const isServiceCharge = form.getValues("isServiceCharge")
    const serviceCharge = form.getValues("serviceCharge") || 0
    const totAmtAftGst = form.getValues("totAmtAftGst") || 0
    const itemNo = form.getValues("itemNo") || 0
    const chargeId = form.getValues("chargeId") || 0

    // If service charge is checked and values are valid, trigger update
    if (
      isServiceCharge &&
      serviceCharge > 0 &&
      totAmtAftGst > 0 &&
      itemNo > 0
    ) {
      onServiceChargeUpdate(
        itemNo,
        chargeId,
        totAmtAftGst,
        serviceCharge,
        taskId
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, taskId])

  // Handler for serviceCharge percentage change
  const handleServiceChargeChange = useCallback(() => {
    if (!onServiceChargeUpdate) return

    const isServiceCharge = form.getValues("isServiceCharge")
    const serviceCharge = form.getValues("serviceCharge") || 0
    const totAmtAftGst = form.getValues("totAmtAftGst") || 0
    const itemNo = form.getValues("itemNo") || 0
    const chargeId = form.getValues("chargeId") || 0

    // If service charge is checked and values are valid, trigger update
    if (
      isServiceCharge &&
      serviceCharge > 0 &&
      totAmtAftGst > 0 &&
      itemNo > 0
    ) {
      onServiceChargeUpdate(
        itemNo,
        chargeId,
        totAmtAftGst,
        serviceCharge,
        taskId
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, taskId])

  // 4. Handle charge name change - update remarks
  const handleChargeChange = useCallback(
    (selectedCharge: IChargeLookup | null) => {
      if (selectedCharge && selectedCharge.chargeName) {
        const currentRemarks = form.getValues("remarks") || ""
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
    [form, onChargeChange]
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

      console.log("gstPercentage", gstPercentage)

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

  const handleCancel = () => {
    // Reset form to default values
    form.reset({
      ...defaultValues,
    })
    // Reset refs

    // Notify parent that charge is cleared
    onChargeChange?.("")
    // Call the onCancelAction callback if provided
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
                    onChangeEvent={handleQtyChange}
                  />
                </div>

                <div className="col-span-1">
                  <CustomNumberInput
                    form={form}
                    name="unitPrice"
                    label="Unit Price"
                    round={priceDec}
                    isDisabled={isConfirmed}
                    onChangeEvent={handleUnitPriceChange}
                  />
                </div>

                <div className="col-span-1">
                  <CustomNumberInput
                    form={form}
                    name="totLocalAmt"
                    label="Amt Local"
                    round={locAmtDec}
                    isDisabled={isConfirmed}
                  />
                </div>

                <div className="col-span-1">
                  <CustomNumberInput
                    form={form}
                    name="totAmt"
                    label="Total Amt"
                    round={amtDec}
                    isDisabled={isConfirmed}
                    onChangeEvent={handleTotAmtChange}
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
                    onChangeEvent={handleGstAmtChange}
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

              {/* Row 2: Vat, Vat %, Vat Amt, Tot Aft Vat, Is Sr Chg?, Service Chg, Remarks, Action Buttons */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-1">
                  <CustomCheckbox
                    form={form}
                    name="isServiceCharge"
                    label="Is Sr Chg?"
                    isDisabled={isConfirmed}
                    onBlurEvent={handleIsServiceChargeChange}
                  />
                </div>

                <div className="col-span-1">
                  <CustomNumberInput
                    form={form}
                    name="serviceCharge"
                    label="Service Chg"
                    round={amtDec}
                    isDisabled={isConfirmed}
                    onChangeEvent={handleServiceChargeChange}
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
                        : initialData
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
