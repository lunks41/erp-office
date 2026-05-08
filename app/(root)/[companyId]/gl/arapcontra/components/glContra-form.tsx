"use client"

import { useCompanyStore } from "@/stores/company-store"

import * as React from "react"
import { calculateMultiplierAmount, setExchangeRate } from "@/helpers/account"
import {
  ICurrencyLookup,
  ICustomerLookup,
  ISupplierLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { GLContraDtSchemaType, GLContraHdSchemaType } from "@/schemas"
import { format } from "date-fns"
import { FormProvider, UseFormReturn } from "react-hook-form"

import { clientDateFormat } from "@/lib/date-utils"
import { parseNumberWithCommas } from "@/lib/utils"
import { useGetDynamicLookup } from "@/hooks/use-lookup"
import {
  CurrencyAutocomplete,
  CustomerAutocomplete,
  DynamicCustomerAutocomplete,
  DynamicSupplierAutocomplete,
  SupplierAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface ContraFormProps {
  form: UseFormReturn<GLContraHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  isCancelled?: boolean
  dataDetails?: GLContraDtSchemaType[]
}

export default function ContraForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  isCancelled = false,
  dataDetails = [],
}: ContraFormProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const isDynamicCustomer = dynamicLookup?.isCustomer ?? false
  const isDynamicSupplier = dynamicLookup?.isSupplier ?? false

  const dateFormat = React.useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  // Refs to store original values on focus for comparison on blur
  const originalExhRateRef = React.useRef<number>(0)
  const originalTotAmtRef = React.useRef<number>(0)

  // Watch totAmt and auto-clear related fields when set to 0
  const totAmt = form.watch("totAmt")

  React.useEffect(() => {
    // Step 1: Check if totAmt is 0
    if (totAmt === 0) {
      // Step 2: Clear all related total fields
      form.setValue("totLocalAmt", 0, { shouldDirty: true })
    }
  }, [totAmt, form])

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
      }
    },
    [dateFormat, exhRateDec, form, visible]
  )

  // Handle customer selection
  const handleCustomerChange = React.useCallback(
    async (selectedCustomer: ICustomerLookup | null) => {
      if (selectedCustomer) {
        // ✅ Customer selected - populate related fields
        if (!isEdit) {
          form.setValue("currencyId", selectedCustomer.currencyId || 0)
        }

        // Only set exchange rates if currency is available
        if (selectedCustomer.currencyId > 0) {
          await setExchangeRate(form, exhRateDec, visible)
        } else {
          // If no currency, set exchange rates to zero
          form.setValue("exhRate", 0)
        }
      } else {
        // ✅ Customer cleared - reset all related fields
        if (!isEdit) {
          // Clear customer-related fields
          form.setValue("currencyId", 0)
        }

        // Clear exchange rates
        form.setValue("exhRate", 0)

        // Trigger validation
        form.trigger()
      }
    },
    [exhRateDec, form, isEdit, visible]
  )

  // Handle supplier selection
  const handleSupplierChange = React.useCallback(
    async (selectedSupplier: ISupplierLookup | null) => {
      if (selectedSupplier) {
        form.setValue("supplierId", selectedSupplier.supplierId || 0)
      } else {
        form.setValue("supplierId", 0)
      }
    },
    [form]
  )

  // Handle currency selection
  const handleCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      const currencyId = selectedCurrency?.currencyId || 0
      form.setValue("currencyId", currencyId, { shouldDirty: true })

      if (currencyId && accountDate) {
        // First update exchange rates
        await setExchangeRate(form, exhRateDec, visible)
      }
    },
    [form, exhRateDec, visible, accountDate]
  )

  // Handle exchange rate focus - capture original value
  const handleExchangeRateFocus = React.useCallback(() => {
    originalExhRateRef.current = form.getValues("exhRate") || 0
  }, [form])

  // Handle exchange rate change
  const handleExchangeRateChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const exhRate = parseNumberWithCommas(e.target.value)
      const originalExhRate = originalExhRateRef.current

      if (exhRate !== originalExhRate) {
        form.setValue("exhRate", exhRate, { shouldDirty: true })
        const totAmt = form.getValues("totAmt") || 0
        const totLocalAmt = calculateMultiplierAmount(
          totAmt,
          exhRate,
          locAmtDec
        )
        form.setValue("totLocalAmt", totLocalAmt, { shouldDirty: true })
      }
    },
    [form, locAmtDec]
  )

  // Handle totAmt focus - capture original value
  const handleTotAmtFocus = React.useCallback(() => {
    originalTotAmtRef.current = form.getValues("totAmt") || 0
  }, [form])

  // Handle totAmt change
  const handleTotAmtChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const totAmt = parseNumberWithCommas(e.target.value)
      const originalTotAmt = originalTotAmtRef.current

      // Only recalculate if value is different from original
      if (totAmt !== originalTotAmt) {
        form.setValue("totAmt", totAmt, { shouldDirty: true })
        const exhRate = form.getValues("exhRate") || 0
        const totLocalAmt = calculateMultiplierAmount(
          totAmt,
          exhRate,
          locAmtDec
        )
        form.setValue("totLocalAmt", totLocalAmt, { shouldDirty: true })
      }
    },
    [form, locAmtDec]
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={`grid grid-cols-9 gap-1 rounded-md p-2 ${
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

        {/* Customer */}
        {isDynamicCustomer ? (
          <DynamicCustomerAutocomplete
            form={form}
            name="customerId"
            label="Customer"
            isRequired={true}
            onChangeEvent={handleCustomerChange}
            isDisabled={dataDetails.length > 0}
          />
        ) : (
          <CustomerAutocomplete
            form={form}
            name="customerId"
            label="Customer"
            isRequired={true}
            onChangeEvent={handleCustomerChange}
            isDisabled={dataDetails.length > 0}
          />
        )}

        {/* Customer */}
        {isDynamicSupplier ? (
          <DynamicSupplierAutocomplete
            form={form}
            name="supplierId"
            label="Supplier"
            isRequired={true}
            onChangeEvent={handleSupplierChange}
            isDisabled={dataDetails.length > 0}
          />
        ) : (
          <SupplierAutocomplete
            form={form}
            name="supplierId"
            label="Supplier"
            isRequired={true}
            onChangeEvent={handleSupplierChange}
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

        {/* Total Amount - Read-only when currencies are different */}
        <CustomNumberInput
          form={form}
          name="totAmt"
          label="Total Amount"
          round={amtDec}
          className="text-right"
          onFocusEvent={handleTotAmtFocus}
          onBlurEvent={handleTotAmtChange}
        />

        {/* Total Local Amount - Always read-only */}
        <CustomNumberInput
          form={form}
          name="totLocalAmt"
          label="Total Local Amount"
          round={locAmtDec}
          isDisabled={true}
          className="text-right"
        />

        {/* Exchange Gain/Loss */}
        <CustomNumberInput
          form={form}
          name="exhGainLoss"
          label="Exchange Gain/Loss"
          round={locAmtDec}
        />
        {/* Remarks */}
        {visible?.m_Remarks && (
          <CustomTextarea
            form={form}
            name="remarks"
            label="Remarks"
            isRequired={required?.m_Remarks_Hd}
            className="col-span-2"
          />
        )}
      </form>
    </FormProvider>
  )
}
