"use client"

import { useCompanyStore } from "@/stores/company-store"

import * as React from "react"
import {
  calculateAdditionAmount as calculateAdditionAmountHelper,
  setExchangeRate,
  setExchangeRateLocal,
  setGSTPercentage,
} from "@/helpers/account"
import {
  calculateLocalAmounts,
  calculateTotalAmounts,
  recalculateAllDetailsLocalAndCtyAmounts,
  recalculateAndSetHeaderTotals,
  syncCountryExchangeRate,
} from "@/helpers/gl-journal-calculations"
import { IGLJournalDt } from "@/interfaces"
import { ICurrencyLookup } from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { GLJournalDtSchemaType, GLJournalHdSchemaType } from "@/schemas"
import { format, isValid, parse } from "date-fns"
import { FormProvider, UseFormReturn, useWatch } from "react-hook-form"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { useGetDynamicLookup } from "@/hooks/use-lookup"
import { CurrencyAutocomplete } from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"
import TransactionSummaryBox from "@/components/custom/transaction-summary-box"

import { GLJournalDetailsFormRef } from "./glJournal-details-form"

const glJournalFormControlsClassName =
  "[&_button]:text-sm [&_input]:h-7.5 [&_input]:min-h-7.5 [&_input]:text-sm [&_label]:text-sm [&_textarea]:min-h-11 [&_textarea]:text-sm"

interface GLJournalFormProps {
  form: UseFormReturn<GLJournalHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  defaultCurrencyId?: number
  detailsFormRef?: React.RefObject<GLJournalDetailsFormRef | null>
}

export default function GLJournalForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  defaultCurrencyId = 0,
  detailsFormRef,
}: GLJournalFormProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const ctyAmtDec = decimals[0]?.ctyAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const _isDynamicCustomer = dynamicLookup?.isCustomer ?? false
  const _isDynamicVessel = dynamicLookup?.isVessel ?? false
  const _isDynamicJobOrder = dynamicLookup?.isJobOrder ?? false

  const dateFormat = React.useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  const parseWithFallback = React.useCallback(
    (value: string): Date | null => {
      if (!value) return null

      const parsedByDateFormat = parse(value, dateFormat, new Date())
      if (isValid(parsedByDateFormat)) {
        return parsedByDateFormat
      }

      const fallback = parseDate(value)
      return fallback ?? null
    },
    [dateFormat]
  )

  // Watch account date to use as minDate for due date
  const accountDateValue = useWatch({
    control: form.control,
    name: "accountDate",
  })
  const _dueDateMinDate = React.useMemo(() => {
    if (!accountDateValue) return new Date()

    // Parse account date string to Date object if needed
    const accountDateObj =
      typeof accountDateValue === "string"
        ? parseWithFallback(accountDateValue)
        : accountDateValue

    return accountDateObj && !isNaN(accountDateObj.getTime())
      ? accountDateObj
      : new Date()
  }, [accountDateValue, parseWithFallback])

  // Refs to store original values on focus for comparison on change
  const originalExhRateRef = React.useRef<number>(0)
  const originalCtyExhRateRef = React.useRef<number>(0)

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

      form.setValue("gstClaimDate", trnDateStr)
      form?.trigger("gstClaimDate")
      form.setValue("accountDate", trnDateStr)
      form.setValue("revDate", trnDateStr)
      form.setValue("recurrenceUntilDate", trnDateStr)
      form?.trigger("accountDate")
      form?.trigger("revDate")
      form?.trigger("recurrenceUntilDate")
      await setExchangeRate(form, exhRateDec, visible)
      if (visible?.m_CtyCurr) {
        await setExchangeRateLocal(form, exhRateDec)
      }
      await setGSTPercentage(
        form,
        form.getValues("data_details"),
        decimals[0],
        visible
      )
    },
    [decimals, exhRateDec, form, visible, dateFormat]
  )

  // Handle account date selection
  const handleAccountDateChange = React.useCallback(
    async (selectedAccountDate: Date | null) => {
      // Get the updated account date from form (should be set by CustomDateNew)
      const accountDate = form?.getValues("accountDate") || selectedAccountDate

      if (accountDate) {
        // Format account date to string if it's a Date object
        const accountDateStr =
          typeof accountDate === "string"
            ? accountDate
            : format(accountDate, dateFormat)

        // Set gstClaimDate and deliveryDate to the new account date (as strings)
        form.setValue("gstClaimDate", accountDateStr)
        form?.trigger("gstClaimDate")

        form.setValue("revDate", accountDateStr)
        form.setValue("recurrenceUntilDate", accountDateStr)
        form?.trigger("revDate")
        form?.trigger("recurrenceUntilDate")

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
        if (visible?.m_CtyCurr) {
          await setExchangeRateLocal(form, exhRateDec)
        }
      }
    },
    [exhRateDec, form, visible, dateFormat]
  )

  // Set default currency when form is initialized (not in edit mode)
  React.useEffect(() => {
    // Only run when defaultCurrencyId is loaded and we're not in edit mode
    if (!isEdit && defaultCurrencyId > 0) {
      const currentCurrencyId = form.getValues("currencyId")

      // Only set default if no currency is set
      if (!currentCurrencyId || currentCurrencyId === 0) {
        form.setValue("currencyId", defaultCurrencyId)
        // Trigger exchange rate fetch when default currency is set
        setExchangeRate(form, exhRateDec, visible)
        if (visible?.m_CtyCurr) {
          setExchangeRateLocal(form, exhRateDec)
        }
      }
    }
    // Only depend on values that should trigger this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCurrencyId, isEdit])

  // Recalculate header totals from details
  const recalculateHeaderTotals = React.useCallback(() => {
    const formDetails = form.getValues("data_details") || []
    recalculateAndSetHeaderTotals(
      form,
      formDetails as unknown as IGLJournalDt[],
      decimals[0],
      visible
    )
  }, [decimals, form, visible])

  // Handle currency selection
  const handleCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      // Additional logic when currency changes
      const currencyId = selectedCurrency?.currencyId || 0
      const accountDate = form.getValues("accountDate")

      if (currencyId && accountDate) {
        // First update exchange rates
        await setExchangeRate(form, exhRateDec, visible)
        if (visible?.m_CtyCurr) {
          await setExchangeRateLocal(form, exhRateDec)
        }

        // Get current details and ensure they exist
        const formDetails = form.getValues("data_details")
        if (!formDetails || formDetails.length === 0) {
          return
        }

        // Get updated exchange rates
        const exchangeRate = form.getValues("exhRate") || 0
        const countryExchangeRate = form.getValues("ctyExhRate") || 0

        // Recalculate all details with new exchange rates
        const updatedDetails = recalculateAllDetailsLocalAndCtyAmounts(
          formDetails as unknown as IGLJournalDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as GLJournalDtSchemaType[],
          { shouldDirty: true, shouldTouch: true }
        )

        // Recalculate header totals from updated details
        recalculateHeaderTotals()
      }
    },
    [decimals, exhRateDec, form, recalculateHeaderTotals, visible]
  )

  // Handle exchange rate focus - capture original value
  const handleExchangeRateFocus = React.useCallback(() => {
    originalExhRateRef.current = form.getValues("exhRate") || 0
  }, [form])

  // Handle exchange rate blur - recalculate amounts when user leaves the field
  const handleExchangeRateBlur = React.useCallback(
    (_e: React.FocusEvent<HTMLInputElement>) => {
      const exchangeRate = form.getValues("exhRate") || 0
      const originalExhRate = originalExhRateRef.current

      // Only recalculate if value is different from original
      if (exchangeRate === originalExhRate) {
        return
      }

      const formDetails = form.getValues("data_details")

      // Sync city exchange rate with exchange rate if needed
      const countryExchangeRate = syncCountryExchangeRate(
        form,
        exchangeRate,
        visible
      )

      // Recalculate all details in table if they exist
      if (formDetails && formDetails.length > 0) {
        // Recalculate all details with new exchange rate
        const updatedDetails = recalculateAllDetailsLocalAndCtyAmounts(
          formDetails as unknown as IGLJournalDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as GLJournalDtSchemaType[],
          { shouldDirty: true, shouldTouch: true }
        )

        // Recalculate header totals from updated details
        recalculateHeaderTotals()
      }

      // Always trigger recalculation in details form (even if no table details exist)
      // This ensures the form being edited gets updated with new exchange rate
      // Pass exchange rate values directly to avoid timing issues with form state
      if (detailsFormRef?.current) {
        detailsFormRef.current.recalculateAmounts(
          exchangeRate,
          countryExchangeRate
        )
      }
    },
    [decimals, form, recalculateHeaderTotals, visible, detailsFormRef]
  )

  // Handle city exchange rate focus - capture original value
  const handleCountryExchangeRateFocus = React.useCallback(() => {
    originalCtyExhRateRef.current = form.getValues("ctyExhRate") || 0
  }, [form])

  // Handle city exchange rate blur - recalculate amounts when user leaves the field
  const handleCountryExchangeRateBlur = React.useCallback(
    (_e: React.FocusEvent<HTMLInputElement>) => {
      const countryExchangeRate = form.getValues("ctyExhRate") || 0
      const originalCtyExhRate = originalCtyExhRateRef.current

      // Only recalculate if value is different from original
      if (countryExchangeRate === originalCtyExhRate) {
        return
      }

      const formDetails = form.getValues("data_details")
      const exchangeRate = form.getValues("exhRate") || 0

      if (!formDetails || formDetails.length === 0) {
        return
      }

      // Recalculate all details with new city exchange rate
      const updatedDetails = recalculateAllDetailsLocalAndCtyAmounts(
        formDetails as unknown as IGLJournalDt[],
        exchangeRate,
        countryExchangeRate,
        decimals[0],
        !!visible?.m_CtyCurr
      )

      // Update form with recalculated details
      form.setValue(
        "data_details",
        updatedDetails as unknown as GLJournalDtSchemaType[],
        { shouldDirty: true, shouldTouch: true }
      )

      // Recalculate header totals from updated details
      recalculateHeaderTotals()

      // Trigger recalculation in details form if it exists
      // Pass exchange rate values directly to avoid timing issues with form state
      if (detailsFormRef?.current) {
        detailsFormRef.current.recalculateAmounts(
          exchangeRate,
          countryExchangeRate
        )
      }
    },
    [decimals, form, recalculateHeaderTotals, visible, detailsFormRef]
  )

  // Watch data_details to calculate debit-only totals
  const dataDetails = useWatch({
    control: form.control,
    name: "data_details",
  })

  // Calculate totals only from details where isDebit === true
  const debitTotals = React.useMemo(() => {
    if (!dataDetails || dataDetails.length === 0) {
      return {
        totAmt: 0,
        gstAmt: 0,
        totAmtAftGst: 0,
        totLocalAmt: 0,
        gstLocalAmt: 0,
        totLocalAmtAftGst: 0,
      }
    }

    // Filter details where isDebit === true
    const debitDetails = (dataDetails as unknown as IGLJournalDt[]).filter(
      (detail) => detail.isDebit === true
    )

    if (debitDetails.length === 0) {
      return {
        totAmt: 0,
        gstAmt: 0,
        totAmtAftGst: 0,
        totLocalAmt: 0,
        gstLocalAmt: 0,
        totLocalAmtAftGst: 0,
      }
    }

    // Calculate totals using helper functions
    const totals = calculateTotalAmounts(debitDetails, amtDec)
    const localAmounts = calculateLocalAmounts(debitDetails, locAmtDec)

    return {
      totAmt: totals.totAmt,
      gstAmt: totals.gstAmt,
      totAmtAftGst: totals.totAmtAftGst,
      totLocalAmt: localAmounts.totLocalAmt,
      gstLocalAmt: localAmounts.gstLocalAmt,
      totLocalAmtAftGst: localAmounts.totLocalAmtAftGst,
    }
  }, [dataDetails, amtDec, locAmtDec])

  // Calculate balance status (debit vs credit)
  const balanceStatus = React.useMemo(() => {
    if (!dataDetails || dataDetails.length === 0) {
      return {
        debitTotal: 0,
        creditTotal: 0,
        difference: 0,
        isBalanced: true,
      }
    }

    const details = dataDetails as unknown as IGLJournalDt[]

    // Calculate sum of totAmt for isDebit = true
    let debitTotal = 0
    const debitDetails = details.filter((detail) => detail.isDebit === true)
    debitDetails.forEach((detail) => {
      debitTotal = calculateAdditionAmountHelper(
        debitTotal,
        Number(detail.totAmt) || 0,
        amtDec
      )
    })

    // Calculate sum of totAmt for isDebit = false
    let creditTotal = 0
    const creditDetails = details.filter((detail) => detail.isDebit === false)
    creditDetails.forEach((detail) => {
      creditTotal = calculateAdditionAmountHelper(
        creditTotal,
        Number(detail.totAmt) || 0,
        amtDec
      )
    })

    const difference = Math.abs(debitTotal - creditTotal)
    // Use a very small tolerance for floating point comparison (0.0001)
    // Any difference >= 0.01 should be flagged as unbalanced
    const tolerance = 0.0001
    const isBalanced = difference < tolerance

    return {
      debitTotal,
      creditTotal,
      difference,
      isBalanced,
    }
  }, [dataDetails, amtDec])

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-12 gap-x-2 gap-y-2 py-2"
      >
        <div className="border-border/60 bg-card col-span-10 rounded-md border p-3 shadow-sm">
          <div className={glJournalFormControlsClassName}>
            <div className="grid grid-cols-6 gap-x-2 gap-y-1">
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
            onBlurEvent={handleExchangeRateBlur}
          />
          {visible?.m_CtyCurr && (
            <>
              {/* Country Exchange Rate */}
              <CustomNumberInput
                form={form}
                name="ctyExhRate"
                label="Country Exchange Rate"
                isRequired={true}
                round={exhRateDec}
                className="text-right"
                onFocusEvent={handleCountryExchangeRateFocus}
                onBlurEvent={handleCountryExchangeRateBlur}
              />
            </>
          )}

          {/* VAT Claim Date */}
          {visible?.m_GstClaimDate && (
            <CustomDateNew
              form={form}
              name="gstClaimDate"
              label="VAT Claim Date"
              isRequired={false}
              isFutureShow={true}
            />
          )}

          {visible?.m_CtyCurr && (
            <>
              {/* Total Country Amount */}
              <CustomNumberInput
                form={form}
                name="totCtyAmt"
                label="Total Country Amount"
                round={ctyAmtDec}
                isDisabled={true}
                className="text-right"
              />
            </>
          )}

          {visible?.m_CtyCurr && visible?.m_GstId && (
            <>
              {/* VAT Country Amount */}
              <CustomNumberInput
                form={form}
                name="gstCtyAmt"
                label="VAT Country Amount"
                isDisabled={true}
                round={ctyAmtDec}
                className="text-right"
              />
            </>
          )}

          {visible?.m_CtyCurr && (
            <>
              {/* Total Country Amount After VAT */}
              <CustomNumberInput
                form={form}
                name="totCtyAmtAftGst"
                label="Total Country Amount After VAT"
                isDisabled={true}
                round={ctyAmtDec}
                className="text-right"
              />
            </>
          )}

          {/* Remarks */}
          <CustomTextarea
            form={form}
            name="remarks"
            label="Remarks"
            isRequired={required?.m_Remarks_Hd}
            className="col-span-2"
          />
            </div>
          </div>
        </div>

        <div className="col-span-2 flex min-w-0 flex-col justify-start gap-2">
          {/* Balance Status Indicator */}
          {dataDetails && dataDetails.length > 0 && (
            <div
              className={`w-full rounded-md border p-3 shadow-sm ${
                balanceStatus.isBalanced
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
                <span
                  className={`text-xs font-bold ${
                    balanceStatus.isBalanced
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {balanceStatus.isBalanced ? "✓ Balanced" : "⚠ Not Balanced"}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-secondary-foreground">
                    Debit Total:
                  </span>
                  <span className="font-semibold tabular-nums text-card-foreground">
                    {balanceStatus.debitTotal.toLocaleString(undefined, {
                      minimumFractionDigits: amtDec,
                      maximumFractionDigits: amtDec,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-secondary-foreground">
                    Credit Total:
                  </span>
                  <span className="font-semibold tabular-nums text-card-foreground">
                    {balanceStatus.creditTotal.toLocaleString(undefined, {
                      minimumFractionDigits: amtDec,
                      maximumFractionDigits: amtDec,
                    })}
                  </span>
                </div>
                {!balanceStatus.isBalanced && (
                  <div className="mt-2 border-t border-red-500/30 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-400">
                        Difference:
                      </span>
                      <span className="font-bold tabular-nums text-red-400">
                        {balanceStatus.difference.toLocaleString(undefined, {
                          minimumFractionDigits: amtDec,
                          maximumFractionDigits: amtDec,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <TransactionSummaryBox
            className="w-full"
            values={{
              totAmt: debitTotals.totAmt,
              gstAmt: debitTotals.gstAmt,
              totAmtAftGst: debitTotals.totAmtAftGst,
              totLocalAmt: debitTotals.totLocalAmt,
              gstLocalAmt: debitTotals.gstLocalAmt,
              totLocalAmtAftGst: debitTotals.totLocalAmtAftGst,
            }}
            amtDec={amtDec}
            locAmtDec={locAmtDec}
            showGst={!!visible?.m_GstId}
            showPaymentBalance={false}
            textSize="xs"
          />
        </div>
      </form>
    </FormProvider>
  )
}
