"use client"

import * as React from "react"
import {
  EntityType,
  setAddressContactDetails,
  setDueDate,
  setExchangeRate,
  setExchangeRateLocal,
  setGSTPercentage,
} from "@/helpers/account"
import {
  recalculateAllDetailsLocalAndCtyAmounts,
  recalculateAndSetHeaderTotals,
  syncCountryExchangeRate,
} from "@/helpers/ap-invoice-calculations"
import { IApInvoiceDt } from "@/interfaces"
import {
  IBankLookup,
  ICreditTermLookup,
  ICurrencyLookup,
  ISupplierLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ApInvoiceDtSchemaType, ApInvoiceHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { format, isValid, parse } from "date-fns"
import { FormProvider, UseFormReturn, useWatch } from "react-hook-form"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { useGetDynamicLookup } from "@/hooks/use-lookup"
import {
  BankAutocomplete,
  CreditTermAutocomplete,
  CurrencyAutocomplete,
  DynamicSupplierAutocomplete,
  SupplierAutocomplete,
} from "@/components/autocomplete"
import ServiceCategoryAutocomplete from "@/components/autocomplete/autocomplete-servicecategory"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

import { InvoiceDetailsFormRef } from "./invoice-details-form"

interface InvoiceFormProps {
  form: UseFormReturn<ApInvoiceHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  defaultCurrencyId?: number
  detailsFormRef?: React.RefObject<InvoiceDetailsFormRef | null>
}

export default function InvoiceForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  defaultCurrencyId = 0,
  detailsFormRef,
}: InvoiceFormProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const isDynamicSupplier = dynamicLookup?.isSupplier ?? false

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
  const dueDateMinDate = React.useMemo(() => {
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

  // Helper function to calculate and set due date
  const calculateAndSetDueDate = React.useCallback(async () => {
    const creditTermId = form.getValues("creditTermId")
    const accountDate = form.getValues("accountDate")

    if (creditTermId && creditTermId > 0) {
      // Credit term available - calculate due date based on credit term
      await setDueDate(form)
    } else if (accountDate) {
      // No credit term - set due date to account date
      const dueDateValue =
        typeof accountDate === "string"
          ? accountDate
          : format(accountDate, dateFormat)
      form.setValue("dueDate", dueDateValue)
      form.trigger("dueDate")
    } else {
      // No account date either - set to today
      const todayValue = format(new Date(), dateFormat)
      form.setValue("dueDate", todayValue)
      form.trigger("dueDate")
    }
  }, [form, dateFormat])

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
      form.setValue("deliveryDate", trnDateStr)
      form?.trigger("accountDate")
      form?.trigger("deliveryDate")
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
      await setDueDate(form)
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

        form.setValue("deliveryDate", accountDateStr)
        form?.trigger("deliveryDate")

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

        // Calculate and set due date
        await calculateAndSetDueDate()
      }
    },
    [exhRateDec, form, visible, calculateAndSetDueDate, dateFormat]
  )

  // Handle supplier selection
  const handleSupplierChange = React.useCallback(
    async (selectedSupplier: ISupplierLookup | null) => {
      if (selectedSupplier) {
        // ✅ Supplier selected - populate related fields
        if (!isEdit) {
          form.setValue("currencyId", selectedSupplier.currencyId || 0)
          form.setValue("creditTermId", selectedSupplier.creditTermId || 0)
          form.setValue("bankId", selectedSupplier.bankId || 0)
        }

        await setExchangeRate(form, exhRateDec, visible)
        await setExchangeRateLocal(form, exhRateDec)
        await setAddressContactDetails(form, EntityType.SUPPLIER)

        // Calculate and set due date after supplier fields are set
        await calculateAndSetDueDate()
      } else {
        // ✅ Supplier cleared - reset all related fields
        if (!isEdit) {
          // Clear supplier-related fields, use default currency if available
          form.setValue("currencyId", defaultCurrencyId)
          form.setValue("creditTermId", 0)
          form.setValue("bankId", 0)
        }

        // Clear exchange rates
        form.setValue("exhRate", 0)
        form.setValue("ctyExhRate", 0)

        // Calculate and set due date (will use account date if available, otherwise today)
        await calculateAndSetDueDate()

        // Clear address fields
        form.setValue("addressId", 0)
        form.setValue("address1", "")
        form.setValue("address2", "")
        form.setValue("address3", "")
        form.setValue("address4", "")
        form.setValue("pinCode", "")
        form.setValue("countryId", 0)
        form.setValue("phoneNo", "")

        // Clear contact fields
        form.setValue("contactId", 0)
        form.setValue("contactName", "")
        form.setValue("mobileNo", "")
        form.setValue("emailAdd", "")
        form.setValue("faxNo", "")

        // Trigger validation
        form.trigger()
      }
    },
    [
      exhRateDec,
      form,
      isEdit,
      visible,
      defaultCurrencyId,
      calculateAndSetDueDate,
    ]
  )

  // Handle credit term selection
  const handleCreditTermChange = React.useCallback(
    async (_selectedCreditTerm: ICreditTermLookup | null) => {
      // Calculate and set due date when credit term changes
      await calculateAndSetDueDate()
    },
    [calculateAndSetDueDate]
  )

  // Handle bank selection
  const handleBankChange = React.useCallback(
    (_selectedBank: IBankLookup | null) => {
      // Additional logic when bank changes
    },
    []
  )

  // Handle delivery date change
  const handleDeliveryDateChange = React.useCallback(
    async (_selectedDeliveryDate: Date | null) => {
      await setDueDate(form)
    },
    [form]
  )

  // Set default currency when form is initialized (not in edit mode)
  React.useEffect(() => {
    // Only run when defaultCurrencyId is loaded and we're not in edit mode
    if (!isEdit && defaultCurrencyId > 0) {
      const currentCurrencyId = form.getValues("currencyId")
      const currentSupplierId = form.getValues("supplierId")

      // Only set default if no currency is set and no supplier is selected
      if (
        (!currentCurrencyId || currentCurrencyId === 0) &&
        (!currentSupplierId || currentSupplierId === 0)
      ) {
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
      formDetails as unknown as IApInvoiceDt[],
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
          formDetails as unknown as IApInvoiceDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as ApInvoiceDtSchemaType[],
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
          formDetails as unknown as IApInvoiceDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as ApInvoiceDtSchemaType[],
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
        formDetails as unknown as IApInvoiceDt[],
        exchangeRate,
        countryExchangeRate,
        decimals[0],
        !!visible?.m_CtyCurr
      )

      // Update form with recalculated details
      form.setValue(
        "data_details",
        updatedDetails as unknown as ApInvoiceDtSchemaType[],
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

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-12 rounded-md p-2"
      >
        <div className="col-span-10 grid grid-cols-6 gap-1 gap-y-0 pb-0">
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
              label="Supplier-D"
              isRequired={true}
              onChangeEvent={handleSupplierChange}
            />
          ) : (
            <SupplierAutocomplete
              form={form}
              name="supplierId"
              label="Supplier-S"
              isRequired={true}
              onChangeEvent={handleSupplierChange}
            />
          )}
          {/*flag*/}
          {/* customerInvoiceNo */}
          <CustomInput
            form={form}
            name="suppInvoiceNo"
            label="Supplier Invoice No."
            isRequired={required?.m_SuppInvoiceNo}
          />

          {/* Reference No */}
          <CustomInput
            form={form}
            name="referenceNo"
            label="Reference No."
            isRequired={required?.m_ReferenceNo}
          />

          {/* Credit Terms */}
          <CreditTermAutocomplete
            form={form}
            name="creditTermId"
            label="Credit Terms"
            isRequired={true}
            onChangeEvent={handleCreditTermChange}
          />

          {/* Due Date */}
          <CustomDateNew
            form={form}
            name="dueDate"
            label="Due Date"
            isRequired={true}
            isFutureShow={true}
            minDate={dueDateMinDate}
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

          {/* Delivery Date */}
          {visible?.m_DeliveryDate && (
            <CustomDateNew
              form={form}
              name="deliveryDate"
              label="Delivery Date"
              isRequired={required?.m_DeliveryDate}
              onChangeEvent={handleDeliveryDateChange}
              isFutureShow={true}
            />
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
                round={amtDec}
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
                round={amtDec}
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
                label="Total Country Amount After GST"
                isDisabled={true}
                round={amtDec}
                className="text-right"
              />
            </>
          )}

          {/* Service Category */}
          {visible?.m_ServiceCategoryId && (
            <ServiceCategoryAutocomplete
              form={form}
              name="serviceCategoryId"
              label="Service Category"
              isRequired={true}
            />
          )}

          {/* Remarks */}
          <CustomTextarea
            form={form}
            name="remarks"
            label="Remarks"
            isRequired={required?.m_Remarks_Hd}
            className="col-span-3 pb-2"
          />
        </div>

        {/* {form.watch("invoiceId") != "0" && (
          <>
            {/* Summary Box */}
        {/* Right Section: Summary Box */}
        <div className="col-span-2 ml-2 flex flex-col justify-start">
          <div className="w-full rounded-md border border-blue-200 bg-gray-100 px-4 py-1.5 shadow-sm">
            {/* Header Row */}
            <div className="mb-1 grid grid-cols-3 gap-x-4 border-b border-blue-300 text-sm">
              <div className="px-1.5 text-left font-bold text-blue-800">
                Trns
              </div>
              <div className="text-center"></div>
              <div className="px-1.5 text-right font-bold text-blue-800">
                Local
              </div>
            </div>

            {/* 3-column grid: [Amt] [Label] [Local] */}
            <div className="grid grid-cols-3 gap-x-4 text-sm">
              {/* Column 1: Foreign Amounts (Amt) */}
              <div className="space-y-1 px-1.5 text-left">
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
                <div className="font-bold text-blue-900">
                  {(form.watch("payAmt") || 0).toLocaleString(undefined, {
                    minimumFractionDigits: amtDec,
                    maximumFractionDigits: amtDec,
                  })}
                </div>
                <div className="font-bold text-blue-900">
                  {(form.watch("balAmt") || 0).toLocaleString(undefined, {
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
                <div className="font-bold text-blue-800">Payment</div>
                <div className="font-bold text-blue-800">Balance</div>
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
                <div className="font-bold text-blue-900">
                  {(form.watch("payLocalAmt") || 0).toLocaleString(undefined, {
                    minimumFractionDigits: locAmtDec,
                    maximumFractionDigits: locAmtDec,
                  })}
                </div>
                <div className="font-bold text-blue-900">
                  {(form.watch("balLocalAmt") || 0).toLocaleString(undefined, {
                    minimumFractionDigits: locAmtDec,
                    maximumFractionDigits: locAmtDec,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
