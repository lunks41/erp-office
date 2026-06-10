"use client"

import { useCompanyStore } from "@/stores/company-store"

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
} from "@/helpers/ar-debitnote-calculations"
import { IArCustomerInvoice, IArDebitNoteDt } from "@/interfaces"
import {
  IBankLookup,
  ICreditTermLookup,
  ICurrencyLookup,
  ICustomerLookup,
  IJobOrderLookup,
  ITallyServiceLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ArDebitNoteDtSchemaType, ArDebitNoteHdSchemaType } from "@/schemas"
import { format, isValid, parse } from "date-fns"
import { PlusIcon } from "lucide-react"
import { FormProvider, UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { clientDateFormat, parseDate } from "@/lib/date-utils"
import { useGetDynamicLookup } from "@/hooks/use-lookup"
import {
  BankAutocomplete,
  CreditTermAutocomplete,
  CurrencyAutocomplete,
  CustomerAutocomplete,
  DynamicCustomerAutocomplete,
  DynamicJobOrderAutocomplete,
  DynamicTallyServiceAutocomplete,
  JobOrderAutocomplete,
  TallyServiceAutocomplete,
  PortAutocomplete,
  VesselAutocomplete,
} from "@/components/autocomplete"
import DynamicVesselAutocomplete from "@/components/autocomplete/autocomplete-dynamic-vessel"
import InvoiceSelectionDialog from "@/components/common/ar-invoice-selection-dialog"
import { CustomInputGroup } from "@/components/custom"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

import TransactionSummaryBox from "@/components/custom/transaction-summary-box"

import { DebitNoteDetailsFormRef } from "./debitnote-details-form"

const invoiceFormControlsClassName =
  "[&_button]:text-sm [&_input]:h-7.5 [&_input]:min-h-7.5 [&_input]:text-sm [&_label]:text-sm [&_textarea]:min-h-11 [&_textarea]:text-sm"

interface DebitNoteFormProps {
  form: UseFormReturn<ArDebitNoteHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  defaultCurrencyId?: number
  detailsFormRef?: React.RefObject<DebitNoteDetailsFormRef | null>
}

export default function DebitNoteForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  defaultCurrencyId = 0,
  detailsFormRef,
}: DebitNoteFormProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const ctyAmtDec = decimals[0]?.ctyAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const isDynamicCustomer = dynamicLookup?.isCustomer ?? false
  const isDynamicVessel = dynamicLookup?.isVessel ?? false
  const isDynamicTallyService = dynamicLookup?.isTallyService ?? false
  const isDynamicJobOrder = dynamicLookup?.isJobOrder ?? false

  const [showInvoiceDialog, setShowInvoiceDialog] = React.useState(false)

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
  const customerIdValue = useWatch({
    control: form.control,
    name: "customerId",
  })
  const currencyIdValue = useWatch({
    control: form.control,
    name: "currencyId",
  })
  const invoiceIdValue = useWatch({
    control: form.control,
    name: "invoiceId",
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

  const isCustomerCurrencyLocked = React.useMemo(() => {
    if (invoiceIdValue === undefined || invoiceIdValue === null) {
      return false
    }

    if (typeof invoiceIdValue === "string") {
      const trimmed = invoiceIdValue.trim()
      return trimmed.length > 0 && trimmed !== "0"
    }

    if (typeof invoiceIdValue === "number") {
      return invoiceIdValue !== 0
    }

    return Boolean(invoiceIdValue)
  }, [invoiceIdValue])

  const customerIdNumeric = React.useMemo(
    () => Number(customerIdValue || 0),
    [customerIdValue]
  )
  const currencyIdNumeric = React.useMemo(
    () => Number(currencyIdValue || 0),
    [currencyIdValue]
  )
  const canSelectInvoice = React.useMemo(
    () => customerIdNumeric > 0 && currencyIdNumeric > 0,
    [customerIdNumeric, currencyIdNumeric]
  )

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

  // Handle customer selection
  const handleCustomerChange = React.useCallback(
    async (selectedCustomer: ICustomerLookup | null) => {
      if (selectedCustomer) {
        // ✅ Customer selected - populate related fields
        if (!isEdit) {
          form.setValue("currencyId", selectedCustomer.currencyId || 0)
          form.setValue("creditTermId", selectedCustomer.creditTermId || 0)
          form.setValue("bankId", selectedCustomer.bankId || 0)
        }

        await setExchangeRate(form, exhRateDec, visible)
        await setExchangeRateLocal(form, exhRateDec)
        await setAddressContactDetails(form, EntityType.CUSTOMER)

        // Calculate and set due date after customer fields are set
        await calculateAndSetDueDate()
      } else {
        // ✅ Customer cleared - reset all related fields
        if (!isEdit) {
          // Clear customer-related fields, use default currency if available
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

  const handleTallyServiceChange = React.useCallback(
    (selectedTallyService: ITallyServiceLookup | null) => {
      if (selectedTallyService) {
        form.setValue("vesselId", selectedTallyService.vesselId || 0)
        form.setValue("portId", selectedTallyService.portId || 0)
        form.trigger("vesselId")
        form.trigger("portId")
      } else {
        form.setValue("vesselId", 0)
        form.setValue("portId", 0)
        form.trigger("vesselId")
        form.trigger("portId")
      }
    },
    [form]
  )

  // Handle job order selection
  const handleJobOrderChange = React.useCallback(
    (selectedJobOrder: IJobOrderLookup | null) => {
      if (selectedJobOrder) {
        // Set vesselId and portId from selected job order
        form.setValue("vesselId", selectedJobOrder.vesselId || 0)
        form.setValue("portId", selectedJobOrder.portId || 0)

        // Trigger validation for the updated fields
        form.trigger("vesselId")
        form.trigger("portId")
      } else {
        // Clear vesselId and portId when job order is cleared
        form.setValue("vesselId", 0)
        form.setValue("portId", 0)

        // Trigger validation for the cleared fields
        form.trigger("vesselId")
        form.trigger("portId")
      }
    },
    [form]
  )

  // Set default currency when form is initialized (not in edit mode)
  React.useEffect(() => {
    // Only run when defaultCurrencyId is loaded and we're not in edit mode
    if (!isEdit && defaultCurrencyId > 0) {
      const currentCurrencyId = form.getValues("currencyId")
      const currentCustomerId = form.getValues("customerId")

      // Only set default if no currency is set and no customer is selected
      if (
        (!currentCurrencyId || currentCurrencyId === 0) &&
        (!currentCustomerId || currentCustomerId === 0)
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
      formDetails as unknown as IArDebitNoteDt[],
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
          formDetails as unknown as IArDebitNoteDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as ArDebitNoteDtSchemaType[],
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
          formDetails as unknown as IArDebitNoteDt[],
          exchangeRate,
          countryExchangeRate,
          decimals[0],
          !!visible?.m_CtyCurr
        )

        // Update form with recalculated details
        form.setValue(
          "data_details",
          updatedDetails as unknown as ArDebitNoteDtSchemaType[],
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
        formDetails as unknown as IArDebitNoteDt[],
        exchangeRate,
        countryExchangeRate,
        decimals[0],
        !!visible?.m_CtyCurr
      )

      // Update form with recalculated details
      form.setValue(
        "data_details",
        updatedDetails as unknown as ArDebitNoteDtSchemaType[],
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

  // Handle add invoice no to button click
  const handleAddInvoiceNo = React.useCallback(() => {
    const selectedCustomerId = Number(form.getValues("customerId") || 0)
    if (!selectedCustomerId) {
      toast.error("Select customer", {
        description: "Choose a customer before selecting an invoice.",
      })
      return
    }

    const selectedCurrencyId = Number(form.getValues("currencyId") || 0)
    if (!selectedCurrencyId) {
      toast.error("Select currency", {
        description: "Choose a currency before selecting an invoice.",
      })
      return
    }

    setShowInvoiceDialog(true)
  }, [form])

  const handleInvoiceInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ?? ""
      if (value.trim().length === 0) {
        form.setValue("invoiceId", "0", {
          shouldDirty: true,
          shouldTouch: true,
        })
        form.setValue("invoiceNo", "", {
          shouldDirty: true,
          shouldTouch: true,
        })
      } else {
        form.setValue("invoiceId", "", {
          shouldDirty: true,
          shouldTouch: true,
        })
      }
    },
    [form]
  )

  const handleInvoiceSelected = React.useCallback(
    (invoice: IArCustomerInvoice) => {
      const invoiceId = invoice.invoiceId ? String(invoice.invoiceId) : ""
      const invoiceNo = invoice.invoiceNo ?? ""

      form.setValue("invoiceId", invoiceId, {
        shouldDirty: true,
        shouldTouch: true,
      })
      form.setValue("invoiceNo", invoiceNo, {
        shouldDirty: true,
        shouldTouch: true,
      })
      form.trigger(["invoiceId", "invoiceNo"])
    },
    [form]
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-12 gap-x-2 gap-y-2 py-2"
      >
        <div className="border-border/60 bg-card col-span-10 rounded-md border p-3 shadow-sm">
          <div className={invoiceFormControlsClassName}>
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

          {/* Customer */}
          {isDynamicCustomer ? (
            <DynamicCustomerAutocomplete
              form={form}
              name="customerId"
              label="Customer"
              isRequired={true}
              onChangeEvent={handleCustomerChange}
              isDisabled={isCustomerCurrencyLocked}
            />
          ) : (
            <CustomerAutocomplete
              form={form}
              name="customerId"
              label="Customer"
              isRequired={true}
              onChangeEvent={handleCustomerChange}
              isDisabled={isCustomerCurrencyLocked}
            />
          )}

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

          {/* Invoice */}
          <CustomInputGroup
            form={form}
            name="invoiceNo"
            label="Invoice"
            isRequired={false}
            buttonText=""
            buttonIcon={<PlusIcon className="h-3 w-3" />}
            buttonPosition="right"
            onButtonClick={handleAddInvoiceNo}
            buttonVariant="default"
            buttonDisabled={!canSelectInvoice}
            onChangeEvent={handleInvoiceInputChange}
          />

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

          {/* Tally Service */}
          {visible?.m_TallyServiceIdHd &&
            (isDynamicTallyService ? (
              <DynamicTallyServiceAutocomplete
                form={form}
                name="tallyServiceId"
                label="Tally Service"
                onChangeEvent={handleTallyServiceChange}
              />
            ) : (
              <TallyServiceAutocomplete
                form={form}
                name="tallyServiceId"
                label="Tally Service"
                onChangeEvent={handleTallyServiceChange}
              />
            ))}

          {/* Job Order */}
          {visible?.m_JobOrderIdHd &&
            (isDynamicJobOrder ? (
              <DynamicJobOrderAutocomplete
                form={form}
                name="jobOrderId"
                label="Job Order"
                onChangeEvent={handleJobOrderChange}
              />
            ) : (
              <JobOrderAutocomplete
                form={form}
                name="jobOrderId"
                label="Job Order"
                onChangeEvent={handleJobOrderChange}
              />
            ))}

          {/* Vessel */}
          {visible?.m_VesselIdHd &&
            (isDynamicVessel ? (
              <DynamicVesselAutocomplete
                form={form}
                name="vesselId"
                label="Vessel"
              />
            ) : (
              <VesselAutocomplete form={form} name="vesselId" label="Vessel" />
            ))}

          {/* Port */}
          {visible?.m_PortIdHd && (
            <PortAutocomplete form={form} name="portId" label="Port" />
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

        <TransactionSummaryBox
          values={{
            totAmt: form.watch("totAmt"),
            gstAmt: form.watch("gstAmt"),
            totAmtAftGst: form.watch("totAmtAftGst"),
            payAmt: form.watch("payAmt"),
            balAmt: form.watch("balAmt"),
            totLocalAmt: form.watch("totLocalAmt"),
            gstLocalAmt: form.watch("gstLocalAmt"),
            totLocalAmtAftGst: form.watch("totLocalAmtAftGst"),
            payLocalAmt: form.watch("payLocalAmt"),
            balLocalAmt: form.watch("balLocalAmt"),
          }}
          amtDec={amtDec}
          locAmtDec={locAmtDec}
          showGst={!!visible?.m_GstId}
        />
      </form>
      <InvoiceSelectionDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        customerId={customerIdNumeric}
        currencyId={currencyIdNumeric}
        onSelect={handleInvoiceSelected}
      />
    </FormProvider>
  )
}
