"use client"

import * as React from "react"
import {
  calculateMultiplierAmount,
  setExchangeRate,
  setExchangeRateLocal,
  setGSTPercentage,
} from "@/helpers/account"
import {
  recalculateAllDetailsLocalAndCtyAmounts,
  recalculateAndSetHeaderTotals,
  syncCountryExchangeRate,
} from "@/helpers/cb-genpayment-calculations"
import { ICbGenPaymentDt } from "@/interfaces"
import {
  IBankLookup,
  ICurrencyLookup,
  IPaymentTypeLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbGenPaymentDtSchemaType, CbGenPaymentHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { format } from "date-fns"
import { PlusIcon } from "lucide-react"
import { FormProvider, UseFormReturn } from "react-hook-form"

import { clientDateFormat } from "@/lib/date-utils"
import { parseNumberWithCommas } from "@/lib/utils"
import {
  BankAutocomplete,
  CurrencyAutocomplete,
  PaymentTypeAutocomplete,
} from "@/components/autocomplete"

const REQUIRE_CHEQUE_NO_WHEN_CHEQUE =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_REQUIRE_CHEQUE_NO_WHEN_CHEQUE === "true"
import PayeeSelectionDialog from "@/components/common/payee-selection-dialog"
import { CustomInputGroup } from "@/components/custom"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

import { CbGenPaymentDetailsFormRef } from "./cbgenpayment-details-form"

interface CbGenPaymentFormProps {
  form: UseFormReturn<CbGenPaymentHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  defaultCurrencyId?: number
  detailsFormRef?: React.RefObject<CbGenPaymentDetailsFormRef | null>
}

export default function CbGenPaymentForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  defaultCurrencyId = 0,
  detailsFormRef,
}: CbGenPaymentFormProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const ctyAmtDec = decimals[0]?.ctyAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const dateFormat = React.useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  // State to control payee selection dialog
  const [isPayeeDialogOpen, setIsPayeeDialogOpen] = React.useState(false)
  const [isChequePayment, setIsChequePayment] = React.useState(false)

  // Refs to store original values on focus for comparison on change
  const originalExhRateRef = React.useRef<number>(0)
  const originalCtyExhRateRef = React.useRef<number>(0)
  const originalBankChgAmtRef = React.useRef<number>(0)

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
      form?.trigger("accountDate")
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
      formDetails as unknown as ICbGenPaymentDt[],
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
          formDetails as unknown as ICbGenPaymentDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as CbGenPaymentDtSchemaType[],
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
          formDetails as unknown as ICbGenPaymentDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as CbGenPaymentDtSchemaType[],
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

  // Handle add payee to button click
  const handleAddPayeeTo = React.useCallback(() => {
    setIsPayeeDialogOpen(true)
  }, [])

  // Handle bank selection
  const handleBankChange = React.useCallback(
    async (selectedBank: IBankLookup | null) => {
      // Additional logic when bank changes
      // When bank changes in New Mode, update currency to match bank's currency
      if (!isEdit && selectedBank && selectedBank.currencyId) {
        const currentCurrencyId = form.getValues("currencyId")

        // Only update currency if it's different from bank's currency
        if (currentCurrencyId !== selectedBank.currencyId) {
          form.setValue("currencyId", selectedBank.currencyId)

          // Trigger exchange rate fetch when currency is set
          await setExchangeRate(form, exhRateDec, visible)
          if (visible?.m_CtyCurr) {
            await setExchangeRateLocal(form, exhRateDec)
          }
        }
      }
    },
    [isEdit, form, exhRateDec, visible]
  )

  // Handle payment type change
  const handlePaymentTypeChange = React.useCallback(
    (selectedPaymentType: IPaymentTypeLookup | null) => {
      if (selectedPaymentType) {
        // Check if payment type is "Cheque"
        const isCheque =
          selectedPaymentType?.paymentTypeName
            ?.toLowerCase()
            .includes("cheque") ||
          selectedPaymentType?.paymentTypeCode?.toLowerCase().includes("cheque")

        setIsChequePayment(isCheque)

        // Clear cheque number if not cheque payment, but keep chequeDate
        if (!isCheque) {
          form.setValue("chequeNo", "")
          // Do not clear chequeDate - keep it as requested
        } else {
          const currentChequeDate = form.getValues("chequeDate")
          const currentAccountDate = form.getValues("accountDate")

          if (!currentChequeDate && currentAccountDate) {
            const accountDateStr =
              typeof currentAccountDate === "string"
                ? currentAccountDate
                : format(currentAccountDate, dateFormat)

            form.setValue("chequeDate", accountDateStr, {
              shouldDirty: true,
            })
          }
        }
      } else {
        setIsChequePayment(false)
        // No payment type selected, clear cheque number but keep chequeDate
        form.setValue("chequeNo", "")
        // Do not clear chequeDate - keep it as requested
      }
    },
    [dateFormat, form]
  )

  // Handle payee selection from dialog
  const handlePayeeSelect = React.useCallback(
    (payeeName: string, _payeeType: "customer" | "supplier" | "employee") => {
      form.setValue("payeeTo", payeeName)
      form.trigger("payeeTo")
    },
    [form]
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
        formDetails as unknown as ICbGenPaymentDt[],
        exchangeRate,
        countryExchangeRate,
        decimals[0],
        !!visible?.m_CtyCurr
      )

      // Update form with recalculated details
      form.setValue(
        "data_details",
        updatedDetails as unknown as CbGenPaymentDtSchemaType[],
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

  // Handle bank charges amount focus - capture original value
  const handleBankChgAmtFocus = React.useCallback(() => {
    originalBankChgAmtRef.current = form.getValues("bankChgAmt") || 0
    console.log(
      "handleBankChgAmtFocus - original value:",
      originalBankChgAmtRef.current
    )
  }, [form])

  // Handle bank charges amount change
  const handleBankChgAmtChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const bankChgAmt = parseNumberWithCommas(e.target.value)
      const originalBankChgAmt = originalBankChgAmtRef.current

      console.log("handleBankChgAmtChange", {
        newValue: bankChgAmt,
        originalValue: originalBankChgAmt,
        isDifferent: bankChgAmt !== originalBankChgAmt,
      })

      // Only recalculate if value is different from original
      if (bankChgAmt !== originalBankChgAmt) {
        console.log("Bank Charges Amount changed - recalculating local amount")
        form.setValue("bankChgAmt", bankChgAmt, { shouldDirty: true })

        // Calculate bank charges local amount: bankChgAmt * exhRate
        const exhRate = form.getValues("exhRate") || 0
        if (exhRate > 0) {
          const bankChgLocalAmt = calculateMultiplierAmount(
            bankChgAmt,
            exhRate,
            locAmtDec
          )
          form.setValue("bankChgLocalAmt", bankChgLocalAmt, {
            shouldDirty: true,
          })
        } else {
          form.setValue("bankChgLocalAmt", 0, { shouldDirty: true })
        }
      } else {
        console.log("Bank Charges Amount unchanged - skipping recalculation")
      }
    },
    [form, locAmtDec]
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-12 rounded-md p-2"
      >
        <div className="col-span-10 grid grid-cols-6 gap-1 gap-y-1">
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

          {/* Payee To */}
          <CustomInputGroup
            form={form}
            name="payeeTo"
            label="Payee To"
            isRequired={true}
            className="col-span-2"
            buttonText=""
            buttonIcon={<PlusIcon className="h-4 w-4" />}
            buttonPosition="right"
            onButtonClick={handleAddPayeeTo}
            buttonVariant="default"
            buttonDisabled={false}
          />

          {/* Reference No */}
          <CustomInput
            form={form}
            name="referenceNo"
            label="Reference No."
            isRequired={required?.m_ReferenceNo}
          />

          {/* Supplier Reg No */}
          <CustomInput
            form={form}
            name="supplierRegNo"
            label="Supplier Reg No (TRN No.)"
          />

          {/* Bank */}
          {visible?.m_BankId && (
            <BankAutocomplete
              form={form}
              name="bankId"
              label="Bank"
              isRequired={required?.m_BankId}
              onChangeEvent={handleBankChange}
            />
          )}

          {/* Payment Type */}
          <PaymentTypeAutocomplete
            form={form}
            name="paymentTypeId"
            label="Pay"
            isRequired={required?.m_PaymentTypeId}
            onChangeEvent={handlePaymentTypeChange}
          />
          <CustomInput
            form={form}
            name="chequeNo"
            label="Pay No"
            isRequired={REQUIRE_CHEQUE_NO_WHEN_CHEQUE && isChequePayment}
          />
          <CustomDateNew
            form={form}
            name="chequeDate"
            label="Pay Date"
            isFutureShow={true}
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
              {/* GST Country Amount */}
              <CustomNumberInput
                form={form}
                name="gstCtyAmt"
                label="GST Country Amount"
                isDisabled={true}
                round={ctyAmtDec}
                className="text-right"
              />
            </>
          )}

          {visible?.m_CtyCurr && (
            <>
              {/* Total Country Amount After GST */}
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

          {/* Bank Charges Amount */}
          <CustomNumberInput
            form={form}
            name="bankChgAmt"
            label="Bank Charges Amount"
            round={amtDec}
            onFocusEvent={handleBankChgAmtFocus}
            onBlurEvent={handleBankChgAmtChange}
          />

          {/* Bank Charges Local Amount */}
          <CustomNumberInput
            form={form}
            name="bankChgLocalAmt"
            label="Bank Charges Local Amount"
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
        </div>

        {/* {form.watch("paymentId") != "0" && (
          <>
            {/* Summary Box */}
        {/* Right Section: Summary Box */}
        <div className="col-span-2 ml-2 flex flex-col justify-start">
          <div className="w-full rounded-md border border-blue-200 bg-blue-50 p-3 shadow-sm">
            {/* Header Row */}
            <div className="mb-2 grid grid-cols-3 gap-x-4 border-b border-blue-300 pb-2 text-xs">
              <div className="text-right font-bold text-blue-800">Trns</div>
              <div className="text-center"></div>
              <div className="text-right font-bold text-blue-800">Local</div>
            </div>

            {/* 3-column grid: [Amt] [Label] [Local] */}
            <div className="grid grid-cols-3 gap-x-4 text-xs">
              {/* Column 1: Foreign Amounts (Amt) */}
              <div className="space-y-1 text-right">
                <div className="font-medium text-gray-700">
                  {(form.watch("totAmt") || 0).toLocaleString(undefined, {
                    minimumFractionDigits: amtDec,
                    maximumFractionDigits: amtDec,
                  })}
                </div>
                {visible?.m_GstId && (
                  <div className="font-medium text-gray-700">
                    {(form.watch("gstAmt") || 0).toLocaleString(undefined, {
                      minimumFractionDigits: amtDec,
                      maximumFractionDigits: amtDec,
                    })}
                  </div>
                )}
                <hr className="my-1 border-blue-300" />
                <div className="font-bold text-blue-900">
                  {(form.watch("totAmtAftGst") || 0).toLocaleString(undefined, {
                    minimumFractionDigits: amtDec,
                    maximumFractionDigits: amtDec,
                  })}
                </div>
              </div>

              {/* Column 2: Labels */}
              <div className="space-y-1 text-center">
                <div className="font-medium text-blue-600">Amt</div>
                {visible?.m_GstId && (
                  <div className="font-medium text-blue-600">VAT</div>
                )}
                <div></div>
                <div className="font-bold text-blue-800">Total</div>
              </div>

              {/* Column 3: Local Amounts */}
              <div className="space-y-1 text-right">
                <div className="font-medium text-gray-700">
                  {(form.watch("totLocalAmt") || 0).toLocaleString(undefined, {
                    minimumFractionDigits: locAmtDec,
                    maximumFractionDigits: locAmtDec,
                  })}
                </div>
                {visible?.m_GstId && (
                  <div className="font-medium text-gray-700">
                    {(form.watch("gstLocalAmt") || 0).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: locAmtDec,
                        maximumFractionDigits: locAmtDec,
                      }
                    )}
                  </div>
                )}
                <hr className="my-1 border-blue-300" />
                <div className="font-bold text-blue-900">
                  {(form.watch("totLocalAmtAftGst") || 0).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: locAmtDec,
                      maximumFractionDigits: locAmtDec,
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Payee Selection Dialog */}
      <PayeeSelectionDialog
        open={isPayeeDialogOpen}
        onOpenChangeAction={setIsPayeeDialogOpen}
        onSelectPayeeAction={handlePayeeSelect}
        companyId={_companyId}
      />
    </FormProvider>
  )
}
