"use client"

import { useCompanyStore } from "@/stores/company-store"

import * as React from "react"
import {
  setDueDate,
  setExchangeRate,
  setExchangeRateLocal,
  setPayExchangeRate,
} from "@/helpers/account"
import { calauteLocalAmtandGainLoss } from "@/helpers/ap-docsetoff-calculations"
import { IApDocSetOffDt } from "@/interfaces"
import { ICurrencyLookup, ISupplierLookup } from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ApDocSetOffDtSchemaType, ApDocSetOffHdSchemaType } from "@/schemas"
import { format } from "date-fns"
import { FormProvider, UseFormReturn } from "react-hook-form"

import { clientDateFormat } from "@/lib/date-utils"
import { parseNumberWithCommas } from "@/lib/utils"
import { useGetDynamicLookup } from "@/hooks/use-lookup"
import {
  CurrencyAutocomplete,
  DynamicSupplierAutocomplete,
  SupplierAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface DocSetOffFormProps {
  form: UseFormReturn<ApDocSetOffHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  isCancelled?: boolean
  dataDetails?: ApDocSetOffDtSchemaType[]
}

export default function DocSetOffForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  isCancelled = false,
  dataDetails = [],
}: DocSetOffFormProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const isDynamicSupplier = dynamicLookup?.isSupplier ?? false

  const dateFormat = React.useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  // Refs to store original values on focus for comparison on blur
  const originalExhRateRef = React.useRef<number>(0)

  // Common function to recalculate amounts based on currency comparison
  const recalculateAmountsBasedOnCurrency = React.useCallback(
    (clearAllocations = false) => {
      const balTotAmt = form.getValues("balTotAmt") || 0

      // Recalculate all details with new exchange rate if data details exist
      if (dataDetails && dataDetails.length > 0) {
        const updatedDetails = [...dataDetails]
        const arr = updatedDetails as unknown as IApDocSetOffDt[]
        const exhRateForDetails = form.getValues("exhRate") || 0
        const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }

        // Clear all allocations only when clearAllocations flag is true
        if (clearAllocations) {
          for (let i = 0; i < arr.length; i++) {
            arr[i].allocAmt = 0
          }
        }

        // Recalculate local amounts and gain/loss for all rows
        for (let i = 0; i < arr.length; i++) {
          calauteLocalAmtandGainLoss(arr, i, exhRateForDetails, dec)
        }

        // Recalculate header totals from recalculated details
        const sumAllocAmt = arr.reduce(
          (s, r) => s + (Number(r.allocAmt) || 0),
          0
        )
        const sumExhGainLoss = arr.reduce(
          (s, r) => s + (Number(r.exhGainLoss) || 0),
          0
        )

        form.setValue("data_details", updatedDetails, {
          shouldDirty: true,
          shouldTouch: true,
        })
        form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
        // Note: Preserve the sign of exhGainLoss (positive or negative) - do not use Math.abs()
        form.setValue("exhGainLoss", sumExhGainLoss, { shouldDirty: true })
        form.setValue("balTotAmt", balTotAmt, { shouldDirty: true })
        form.setValue("unAllocTotAmt", balTotAmt, { shouldDirty: true })
      }
    },
    [form, decimals, dataDetails]
  )

  // Watch accountDate and sync to chequeDate if chequeDate is empty
  const accountDate = form.watch("accountDate")

  const onSubmit = async () => {
    await onSuccessAction("save")
  }

  // Handle transaction date selection
  const handleTrnDateChange = React.useCallback(
    async (_selectedTrnDate: Date | null) => {
      // Additional logic when transaction date changes
      const { trnDate } = form?.getValues()

      // Format trnDate to string if it's a Date object
      const trnDateStr =
        typeof trnDate === "string"
          ? trnDate
          : format(trnDate || new Date(), dateFormat)

      form.setValue("accountDate", trnDateStr)
      form?.trigger("accountDate")

      await setExchangeRate(form, exhRateDec, visible)
      if (visible?.m_CtyCurr) {
        await setExchangeRateLocal(form, exhRateDec)
      }

      // Calculate and set due date (for detail records)
      await setDueDate(form)
    },
    [dateFormat, exhRateDec, form, visible]
  )

  // Handle account date selection
  const handleAccountDateChange = React.useCallback(
    async (selectedAccountDate: Date | null) => {
      // Get the updated account date from form (should be set by CustomDateNew)
      const accountDate = form?.getValues("accountDate") || selectedAccountDate

      if (accountDate) {
        // Ensure accountDate is set in form (as string) and trigger to ensure it's updated
        if (selectedAccountDate) {
          const accountDateValue =
            typeof selectedAccountDate === "string"
              ? selectedAccountDate
              : format(selectedAccountDate, dateFormat)
          form.setValue("accountDate", accountDateValue)
          form.trigger("accountDate")
        }

        // Wait a tick to ensure form state is updated before calling setExchangeRate
        await new Promise((resolve) => setTimeout(resolve, 0))

        await setExchangeRate(form, exhRateDec, visible)
        await setPayExchangeRate(form, exhRateDec)

        // Calculate and set due date (for detail records)
        await setDueDate(form)
      }
    },
    [dateFormat, exhRateDec, form, visible]
  )

  // Handle supplier selection
  const handleSupplierChange = React.useCallback(
    async (selectedSupplier: ISupplierLookup | null) => {
      if (selectedSupplier) {
        // ✅ Supplier selected - populate related fields
        if (!isEdit) {
          form.setValue("currencyId", selectedSupplier.currencyId || 0)
        }

        // Calculate and set due date (for detail records)
        await setDueDate(form)

        // Only set exchange rates if currency is available
        if (selectedSupplier.currencyId > 0) {
          await setExchangeRate(form, exhRateDec, visible)
        } else {
          // If no currency, set exchange rates to zero
          form.setValue("exhRate", 0)
        }
      } else {
        // ✅ Supplier cleared - reset all related fields
        if (!isEdit) {
          // Clear supplier-related fields
          form.setValue("currencyId", 0)
        }

        // Clear exchange rates
        form.setValue("exhRate", 0)

        // Calculate and set due date (for detail records)
        await setDueDate(form)

        // Trigger validation
        form.trigger()
      }
    },
    [exhRateDec, form, isEdit, visible]
  )

  // Handle currency selection
  const handleCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      const currencyId = selectedCurrency?.currencyId || 0
      form.setValue("currencyId", currencyId, { shouldDirty: true })

      if (currencyId && accountDate) {
        // First update exchange rates
        await setExchangeRate(form, exhRateDec, visible)
        // Recalculate all amounts based on currency comparison - clear allocations for currency change
        recalculateAmountsBasedOnCurrency(true)
      }
    },
    [form, exhRateDec, visible, accountDate, recalculateAmountsBasedOnCurrency]
  )

  // Handle exchange rate focus - capture original value
  const handleExchangeRateFocus = React.useCallback(() => {
    originalExhRateRef.current = form.getValues("exhRate") || 0
    console.log(
      "handleExchangeRateFocus - original value:",
      originalExhRateRef.current
    )
  }, [form])

  // Handle exchange rate change
  const handleExchangeRateChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const exhRate = parseNumberWithCommas(e.target.value)
      const originalExhRate = originalExhRateRef.current

      console.log("handleExchangeRateChange", {
        newValue: exhRate,
        originalValue: originalExhRate,
        isDifferent: exhRate !== originalExhRate,
      })

      // Only recalculate if value is different from original
      if (exhRate !== originalExhRate) {
        console.log("Exchange Rate changed - recalculating amounts")
        form.setValue("exhRate", exhRate, { shouldDirty: true })

        // Recalculate all amounts based on currency comparison - don't clear allocations for exchange rate change
        recalculateAmountsBasedOnCurrency(false)
      } else {
        console.log("Exchange Rate unchanged - skipping recalculation")
      }
    },
    [form, recalculateAmountsBasedOnCurrency]
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={`grid grid-cols-8 gap-1 rounded-md p-2 ${
          isCancelled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {/* Transaction Date */}
        {visible?.m_TrnDate && (
          <CustomDateNew
            form={form}
            name="trnDate"
            label="Transaction Date"
            isRequired={true}
            onChangeEvent={handleTrnDateChange}
            isFutureShow={false}
          />
        )}

        {/* Account Date */}
        <CustomDateNew
          form={form}
          name="accountDate"
          label="Account Date"
          isRequired={true}
          onChangeEvent={handleAccountDateChange}
          isFutureShow={false}
        />

        {/* Supplier */}
        {isDynamicSupplier ? (
          <DynamicSupplierAutocomplete
            form={form}
            name="supplierId"
            label="Supplier"
            isRequired={true}
            onChangeEvent={handleSupplierChange}
            className="col-span-2"
            isDisabled={dataDetails.length > 0}
          />
        ) : (
          <SupplierAutocomplete
            form={form}
            name="supplierId"
            label="Supplier"
            isRequired={true}
            onChangeEvent={handleSupplierChange}
            className="col-span-2"
            isDisabled={dataDetails.length > 0}
          />
        )}

        {/* Reference No */}
        <CustomInput
          form={form}
          name="referenceNo"
          label="Reference No."
          isRequired={required?.m_ReferenceNo}
        />

        {/* Currency */}
        <CurrencyAutocomplete
          form={form}
          name="currencyId"
          label="Currency"
          isRequired={true}
          onChangeEvent={handleCurrencyChange}
          isDisabled={dataDetails.length > 0}
        />

        {/* Exchange Rate */}
        <CustomNumberInput
          form={form}
          name="exhRate"
          label="Exchange Rate"
          isRequired={true}
          round={exhRateDec}
          className="text-right"
          onFocusEvent={handleExchangeRateFocus}
          onBlurEvent={handleExchangeRateChange}
        />

        {/* Allocated Amount */}
        <CustomNumberInput
          form={form}
          name="allocTotAmt"
          label="Allocated Amount"
          round={amtDec}
          isDisabled={true}
        />

        {/* Balanced Amount */}
        <CustomNumberInput
          form={form}
          name="balTotAmt"
          label="Balanced Amount"
          round={amtDec}
          isDisabled={true}
        />

        {/* Unallocated Amount - Always read-only */}
        <CustomNumberInput
          form={form}
          name="unAllocTotAmt"
          label="Unallocated Amount"
          round={amtDec}
          isDisabled={true}
        />

        {/* Exchange Gain/Loss */}
        <CustomNumberInput
          form={form}
          name="exhGainLoss"
          label="Exchange Gain/Loss"
          round={locAmtDec}
          isDisabled={true}
        />

        {/* Remarks */}
        <CustomTextarea
          form={form}
          name="remarks"
          label="Remarks"
          isRequired={required?.m_Remarks_Hd}
          className="col-span-2"
        />
      </form>
    </FormProvider>
  )
}
