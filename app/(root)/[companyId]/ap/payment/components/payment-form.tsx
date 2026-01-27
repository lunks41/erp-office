"use client"

import * as React from "react"
import {
  calculateMultiplierAmount,
  setDueDate,
  setExchangeRate,
  setExchangeRateLocal,
  setPayExchangeRate,
} from "@/helpers/account"
import {
  calauteLocalAmtandGainLoss,
  calculateDiffCurrency,
  calculateSameCurrency,
  calculateUnallocated,
} from "@/helpers/ap-payment-calculations"
import { IApPaymentDt } from "@/interfaces"
import {
  IBankLookup,
  ICurrencyLookup,
  IPaymentTypeLookup,
  ISupplierLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ApPaymentDtSchemaType, ApPaymentHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { format } from "date-fns"
import { FormProvider, UseFormReturn } from "react-hook-form"

import { clientDateFormat } from "@/lib/date-utils"
import { parseNumberWithCommas } from "@/lib/utils"
import { useGetDynamicLookup, usePaymentTypeLookup } from "@/hooks/use-lookup"
import {
  BankAutocomplete,
  BankChartOfAccountAutocomplete,
  CurrencyAutocomplete,
  DynamicSupplierAutocomplete,
  PaymentTypeAutocomplete,
  SupplierAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface PaymentFormProps {
  form: UseFormReturn<ApPaymentHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  isCancelled?: boolean
  dataDetails?: ApPaymentDtSchemaType[]
}

export default function PaymentForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  isCancelled = false,
  dataDetails = [],
}: PaymentFormProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const isDynamicSupplier = dynamicLookup?.isSupplier ?? false

  const { data: paymentTypes = [] } = usePaymentTypeLookup()

  const dateFormat = React.useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  // State to track if currencies are the same
  const [isCurrenciesEqual, setIsCurrenciesEqual] = React.useState(true)

  // State to track if payment type is cheque
  const [, setIsChequePayment] = React.useState(false)

  // Refs to store original values on focus for comparison on blur
  const originalExhRateRef = React.useRef<number>(0)
  const originalPayExhRateRef = React.useRef<number>(0)
  const originalTotAmtRef = React.useRef<number>(0)
  const originalPayTotAmtRef = React.useRef<number>(0)
  const originalBankChgAmtRef = React.useRef<number>(0)

  // Function to update currency comparison state
  const updateCurrencyComparison = React.useCallback(() => {
    const currencyId = form.getValues("currencyId") || 0
    const payCurrencyId = form.getValues("payCurrencyId") || 0
    const currenciesMatch = currencyId === payCurrencyId
    setIsCurrenciesEqual(currenciesMatch)
    return currenciesMatch
  }, [form])

  // Common function to recalculate amounts based on currency comparison
  const recalculateAmountsBasedOnCurrency = React.useCallback(
    (clearAllocations = false) => {
      const currencyId = form.getValues("currencyId") || 0
      const payCurrencyId = form.getValues("payCurrencyId") || 0
      const totAmt = form.getValues("totAmt") || 0
      const payTotAmt = form.getValues("payTotAmt") || 0
      const exhRate = form.getValues("exhRate") || 0
      const payExhRate = form.getValues("payExhRate") || 0
      const allocTotAmt = form.getValues("allocTotAmt") || 0
      const allocTotLocalAmt = form.getValues("allocTotLocalAmt") || 0

      if (currencyId === payCurrencyId) {
        // Same currency scenario - totAmt drives everything
        const {
          totLocalAmt: newTotLocalAmt,
          payTotAmt: newPayTotAmt,
          payTotLocalAmt: newPayTotLocalAmt,
        } = calculateSameCurrency(totAmt || 0, exhRate || 0, decimals[0])
        form.setValue("payTotAmt", newPayTotAmt, { shouldDirty: true })
        form.setValue("payTotLocalAmt", newPayTotLocalAmt, {
          shouldDirty: true,
        })
        form.setValue("totLocalAmt", newTotLocalAmt, { shouldDirty: true })

        // Calculate unallocated amounts
        const { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
          totAmt,
          newTotLocalAmt,
          allocTotAmt,
          allocTotLocalAmt,
          decimals[0]
        )
        form.setValue("unAllocTotAmt", unAllocAmt, { shouldDirty: true })
        form.setValue("unAllocTotLocalAmt", unAllocLocalAmt, {
          shouldDirty: true,
        })
      } else {
        if (totAmt > 0) {
          form.setValue("payTotAmt", totAmt, { shouldDirty: true })
        } else {
          form.setValue("payTotAmt", 0, { shouldDirty: true })
        }

        // Different currency scenario - payTotAmt drives everything
        const {
          payTotAmt: newPayTotAmt,
          payTotLocalAmt: newPayTotLocalAmt,
          totAmt: newTotAmt,
          totLocalAmt: newTotLocalAmt,
        } = calculateDiffCurrency(
          payTotAmt || 0,
          payExhRate,
          exhRate,
          decimals[0]
        )

        form.setValue("payTotAmt", newPayTotAmt, { shouldDirty: true })
        form.setValue("payTotLocalAmt", newPayTotLocalAmt, {
          shouldDirty: true,
        })
        form.setValue("totAmt", newTotAmt, { shouldDirty: true })
        form.setValue("totLocalAmt", newTotLocalAmt, { shouldDirty: true })

        // Calculate unallocated amounts
        const { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
          newTotAmt,
          newTotLocalAmt,
          allocTotAmt,
          allocTotLocalAmt,
          decimals[0]
        )
        form.setValue("unAllocTotAmt", unAllocAmt, { shouldDirty: true })
        form.setValue("unAllocTotLocalAmt", unAllocLocalAmt, {
          shouldDirty: true,
        })
      }

      // Payalculate all details with new exchange rate if data details exist
      if (dataDetails && dataDetails.length > 0) {
        const updatedDetails = [...dataDetails]
        const arr = updatedDetails as unknown as IApPaymentDt[]
        const exhRateForDetails = form.getValues("exhRate") || 0
        const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }

        // Clear all allocations only when clearAllocations flag is true
        if (clearAllocations) {
          for (let i = 0; i < arr.length; i++) {
            arr[i].allocAmt = 0
          }
        }

        // Payalculate local amounts and gain/loss for all rows
        for (let i = 0; i < arr.length; i++) {
          calauteLocalAmtandGainLoss(arr, i, exhRateForDetails, dec)
        }

        // Payalculate header totals from recalculated details
        const sumAllocAmt = arr.reduce(
          (s, r) => s + (Number(r.allocAmt) || 0),
          0
        )
        const sumAllocLocalAmt = arr.reduce(
          (s, r) => s + (Number(r.allocLocalAmt) || 0),
          0
        )
        const sumExhGainLoss = arr.reduce(
          (s, r) => s + (Number(r.exhGainLoss) || 0),
          0
        )

        // Payalculate unallocated amounts with updated totals
        const currentTotAmt = form.getValues("totAmt") || 0
        const currentTotLocalAmt = form.getValues("totLocalAmt") || 0
        const { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
          currentTotAmt,
          currentTotLocalAmt,
          sumAllocAmt,
          sumAllocLocalAmt,
          dec
        )

        form.setValue("data_details", updatedDetails, {
          shouldDirty: true,
          shouldTouch: true,
        })
        form.setValue("allocTotAmt", sumAllocAmt, { shouldDirty: true })
        form.setValue("allocTotLocalAmt", sumAllocLocalAmt, {
          shouldDirty: true,
        })
        form.setValue("exhGainLoss", sumExhGainLoss, { shouldDirty: true })
        form.setValue("unAllocTotAmt", unAllocAmt, { shouldDirty: true })
        form.setValue("unAllocTotLocalAmt", unAllocLocalAmt, {
          shouldDirty: true,
        })
      }
    },
    [form, decimals, dataDetails]
  )

  // Initialize currency comparison state on component mount and form changes
  React.useEffect(() => {
    updateCurrencyComparison()
  }, [updateCurrencyComparison])

  // Watch currency values and update comparison when they change
  const currencyId = form.watch("currencyId")
  const payCurrencyId = form.watch("payCurrencyId")

  React.useEffect(() => {
    updateCurrencyComparison()

    // When currencies are equal, set payExhRate = exhRate
    if (currencyId === payCurrencyId && currencyId > 0) {
      const exhRate = form.getValues("exhRate") || 0
      form.setValue("payExhRate", exhRate, { shouldDirty: true })
    }
  }, [currencyId, payCurrencyId, updateCurrencyComparison, form])

  // Watch paymentTypeId and update cheque payment state
  React.useEffect(() => {
    const paymentTypeId = form.watch("paymentTypeId")

    if (paymentTypeId && paymentTypes.length > 0) {
      const selectedPaymentType = paymentTypes.find(
        (pt: IPaymentTypeLookup) => pt.paymentTypeId === paymentTypeId
      )

      if (selectedPaymentType) {
        const isCheque =
          selectedPaymentType.paymentTypeName
            ?.toLowerCase()
            .includes("cheque") ||
          selectedPaymentType.paymentTypeCode?.toLowerCase().includes("cheque")

        setIsChequePayment(isCheque)
      } else {
        setIsChequePayment(false)
      }
    } else {
      setIsChequePayment(false)
    }
  }, [form, paymentTypes])

  // Watch totAmt and auto-clear related fields when set to 0
  const totAmt = form.watch("totAmt")

  React.useEffect(() => {
    // Step 1: Check if totAmt is 0
    if (totAmt === 0) {
      // Step 2: Clear all related total fields
      form.setValue("totLocalAmt", 0, { shouldDirty: true })
      form.setValue("payTotAmt", 0, { shouldDirty: true })
      form.setValue("payTotLocalAmt", 0, { shouldDirty: true })
    }
  }, [totAmt, form])

  // Watch accountDate and sync to chequeDate if chequeDate is empty
  const accountDate = form.watch("accountDate")
  const chequeDate = form.watch("chequeDate")

  React.useEffect(() => {
    // Step 1: Check if chequeDate is empty or null
    if (!chequeDate || chequeDate === "") {
      // Step 2: Set chequeDate to accountDate
      if (accountDate) {
        form.setValue("chequeDate", accountDate, { shouldDirty: true })
      }
    }
  }, [accountDate, chequeDate, form])

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
          form.setValue("payCurrencyId", selectedSupplier.currencyId || 0)
          form.setValue("bankId", selectedSupplier.bankId || 0)
        }

        // Calculate and set due date (for detail records)
        await setDueDate(form)

        // Only set exchange rates if currency is available
        if (selectedSupplier.currencyId > 0) {
          await setExchangeRate(form, exhRateDec, visible)
          await setPayExchangeRate(form, exhRateDec)
        } else {
          // If no currency, set exchange rates to zero
          form.setValue("exhRate", 0)
          form.setValue("payExhRate", 0)
        }

        // Update currency comparison state
        updateCurrencyComparison()
      } else {
        // ✅ Supplier cleared - reset all related fields
        if (!isEdit) {
          // Clear supplier-related fields
          form.setValue("currencyId", 0)
          form.setValue("payCurrencyId", 0)
          form.setValue("bankId", 0)
        }

        // Clear exchange rates
        form.setValue("exhRate", 0)
        form.setValue("payExhRate", 0)

        // Calculate and set due date (for detail records)
        await setDueDate(form)

        // Update currency comparison state
        updateCurrencyComparison()

        // Trigger validation
        form.trigger()
      }
    },
    [exhRateDec, form, isEdit, visible, updateCurrencyComparison]
  )

  // Handle bank selection
  const handleBankChange = React.useCallback(
    async (selectedBank: IBankLookup | null) => {
      const payCurrencyId = selectedBank?.currencyId || 0

      // Update payCurrencyId from bank's currency
      form.setValue("payCurrencyId", payCurrencyId)

      if (selectedBank && payCurrencyId > 0) {
        // Only call setPayExchangeRate if currency is available
        await setPayExchangeRate(form, exhRateDec)
        form.trigger("payExhRate")
      } else {
        // If no bank selected or no currency, set exchange rate to zero
        form.setValue("payExhRate", 0)
      }

      // Update currency comparison state after setting payCurrencyId
      // This will enable/disable payExhRate and payTotAmt fields based on currency difference
      updateCurrencyComparison()
    },
    [exhRateDec, form, updateCurrencyComparison]
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

        // Clear cheque fields if not cheque payment
        if (!isCheque) {
          form.setValue("chequeNo", "")
          form.setValue("chequeDate", "")
        }
      } else {
        // No payment type selected, hide cheque fields
        setIsChequePayment(false)
        form.setValue("chequeNo", "")
        form.setValue("chequeDate", "")
      }
    },
    [form]
  )

  // // Handle payment type change
  // const handlePaymentTypeChange = React.useCallback(
  //   (selectedPaymentType: IPaymentTypeLookup | null) => {
  //     if (selectedPaymentType) {
  //       // Check if payment type is "Cheque"
  //       const isCheque =
  //         selectedPaymentType?.paymentTypeName
  //           ?.toLowerCase()
  //           .includes("cheque") ||
  //         selectedPaymentType?.paymentTypeCode?.toLowerCase().includes("cheque")

  //       setIsChequePayment(isCheque)

  //       // Clear cheque fields if not cheque payment
  //       if (!isCheque) {
  //         form.setValue("chequeNo", "")
  //         form.setValue("chequeDate", "")
  //       }
  //     } else {
  //       // No payment type selected, hide cheque fields
  //       setIsChequePayment(false)
  //       form.setValue("chequeNo", "")
  //       form.setValue("chequeDate", "")
  //     }
  //   },
  //   [form]
  // )

  // Handle pay currency change
  const handlePayCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      const payCurrencyId = selectedCurrency?.currencyId || 0
      const currencyId = form.getValues("currencyId") || 0

      form.setValue("payCurrencyId", payCurrencyId)

      if (payCurrencyId > 0 && payCurrencyId !== currencyId) {
        await setPayExchangeRate(form, exhRateDec)
      } else if (payCurrencyId > 0 && payCurrencyId === currencyId) {
        const exhRateValue = form.getValues("exhRate") || 0
        form.setValue("payExhRate", exhRateValue, { shouldDirty: true })
      } else {
        form.setValue("payExhRate", 0)
      }

      // Payalculate all amounts based on currency comparison - clear allocations for currency change
      recalculateAmountsBasedOnCurrency(true)
    },
    [form, exhRateDec, recalculateAmountsBasedOnCurrency]
  )

  // Handle currency selection
  const handleCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      const currencyId = selectedCurrency?.currencyId || 0
      form.setValue("currencyId", currencyId, { shouldDirty: true })

      if (currencyId && accountDate) {
        // First update exchange rates
        await setExchangeRate(form, exhRateDec, visible)

        const paymentId = form.getValues("paymentId")
        let currentPayCurrency = form.getValues("payCurrencyId") || 0
        const isNewPayment = !isEdit || !paymentId || paymentId === "0"

        if (currencyId > 0 && (isNewPayment || currentPayCurrency === 0)) {
          form.setValue("payCurrencyId", currencyId, { shouldDirty: true })
          currentPayCurrency = currencyId
        }

        if (currencyId > 0 && currentPayCurrency === currencyId) {
          const exhRateValue = form.getValues("exhRate") || 0
          form.setValue("payExhRate", exhRateValue, { shouldDirty: true })
        }

        // Payalculate all amounts based on currency comparison - clear allocations for currency change
        recalculateAmountsBasedOnCurrency(true)
      }
    },
    [
      form,
      exhRateDec,
      visible,
      accountDate,
      recalculateAmountsBasedOnCurrency,
      isEdit,
    ]
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

        const currentCurrency = form.getValues("currencyId") || 0
        const currentPayCurrency = form.getValues("payCurrencyId") || 0
        if (currentCurrency > 0 && currentCurrency === currentPayCurrency) {
          form.setValue("payExhRate", exhRate, { shouldDirty: true })
        }

        // Payalculate all amounts based on currency comparison - don't clear allocations for exchange rate change
        recalculateAmountsBasedOnCurrency(false)
      } else {
        console.log("Exchange Rate unchanged - skipping recalculation")
      }
    },
    [form, recalculateAmountsBasedOnCurrency]
  )

  // Handle payment exchange rate focus - capture original value
  const handlePayExchangeRateFocus = React.useCallback(() => {
    originalPayExhRateRef.current = form.getValues("payExhRate") || 0
    console.log(
      "handlePayExchangeRateFocus - original value:",
      originalPayExhRateRef.current
    )
  }, [form])

  // Handle payment exchange rate change
  const handlePayExchangeRateChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const payExhRate = parseNumberWithCommas(e.target.value)
      const originalPayExhRate = originalPayExhRateRef.current

      console.log("handlePayExchangeRateChange", {
        newValue: payExhRate,
        originalValue: originalPayExhRate,
        isDifferent: payExhRate !== originalPayExhRate,
      })

      // Only recalculate if value is different from original
      if (payExhRate !== originalPayExhRate) {
        console.log("Payment Exchange Rate changed - recalculating amounts")
        form.setValue("payExhRate", payExhRate, { shouldDirty: true })

        // Payalculate all amounts based on currency comparison - don't clear allocations for exchange rate change
        recalculateAmountsBasedOnCurrency(false)
      } else {
        console.log("Payment Exchange Rate unchanged - skipping recalculation")
      }
    },
    [form, recalculateAmountsBasedOnCurrency]
  )

  // Handle totAmt focus - capture original value
  const handleTotAmtFocus = React.useCallback(() => {
    originalTotAmtRef.current = form.getValues("totAmt") || 0
    console.log(
      "handleTotAmtFocus - original value:",
      originalTotAmtRef.current
    )
  }, [form])

  // Handle totAmt change
  const handleTotAmtChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const totAmt = parseNumberWithCommas(e.target.value)
      const originalTotAmt = originalTotAmtRef.current

      console.log("handleTotAmtChange", {
        newValue: totAmt,
        originalValue: originalTotAmt,
        isDifferent: totAmt !== originalTotAmt,
      })

      // Only recalculate if value is different from original
      if (totAmt !== originalTotAmt) {
        console.log(
          "Total Amount changed - recalculating amounts and clearing allocations"
        )
        form.setValue("totAmt", totAmt, { shouldDirty: true })

        // Payalculate all amounts based on currency comparison - clear allocations for totAmt change
        recalculateAmountsBasedOnCurrency(true)
      } else {
        console.log("Total Amount unchanged - skipping recalculation")
      }
    },
    [form, recalculateAmountsBasedOnCurrency]
  )

  // Handle payTotAmt focus - capture original value
  const handlePayTotAmtFocus = React.useCallback(() => {
    originalPayTotAmtRef.current = form.getValues("payTotAmt") || 0
    console.log(
      "handlePayTotAmtFocus - original value:",
      originalPayTotAmtRef.current
    )
  }, [form])

  // Handle payTotAmt change
  const handlePayTotAmtChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const payTotAmt = parseNumberWithCommas(e.target.value)
      const originalPayTotAmt = originalPayTotAmtRef.current

      console.log("handlePayTotAmtChange", {
        newValue: payTotAmt,
        originalValue: originalPayTotAmt,
        isDifferent: payTotAmt !== originalPayTotAmt,
      })

      // Only recalculate if value is different from original
      if (payTotAmt !== originalPayTotAmt) {
        console.log(
          "Payment Total Amount changed - recalculating amounts and clearing allocations"
        )
        form.setValue("payTotAmt", payTotAmt, { shouldDirty: true })

        // Payalculate all amounts based on currency comparison - clear allocations for payTotAmt change
        recalculateAmountsBasedOnCurrency(true)
      } else {
        console.log("Payment Total Amount unchanged - skipping recalculation")
      }
    },
    [form, recalculateAmountsBasedOnCurrency]
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

        // Calculate bank charges local amount: bankChgAmt * payExhRate
        const payExhRate = form.getValues("payExhRate") || 0
        if (payExhRate > 0) {
          const bankChgLocalAmt = calculateMultiplierAmount(
            bankChgAmt,
            payExhRate,
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

        {/* Supplier by company*/}
        {/* <CompanySupplierAutocomplete
            form={form}
            name="supplierId"
            label="Supplier"
            isRequired={true}
            onChangeEvent={handleSupplierChange}
            companyId={_companyId}
          /> */}

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

        {/* Payment Type */}
        <PaymentTypeAutocomplete
          form={form}
          name="paymentTypeId"
          label="Pay"
          isRequired={true}
          onChangeEvent={handlePaymentTypeChange}
        />
        <CustomInput form={form} name="chequeNo" label="Pay No" />
        <CustomDateNew
          form={form}
          name="chequeDate"
          label="Pay Date"
          isFutureShow={true}
        />

        {/* Unallocated Amount - Always read-only */}
        <CustomNumberInput
          form={form}
          name="unAllocTotAmt"
          label="Unallocated Amount"
          round={amtDec}
          isDisabled={true}
        />

        {/* Unallocated Local Amount - Always read-only */}
        <CustomNumberInput
          form={form}
          name="unAllocTotLocalAmt"
          label="Unallocated Local Amount"
          round={locAmtDec}
          isDisabled={true}
        />

        {/* Pay Currency */}
        <CurrencyAutocomplete
          form={form}
          name="payCurrencyId"
          label="Pay Currency"
          onChangeEvent={handlePayCurrencyChange}
        />

        {/* Pay Exchange Rate - Enabled when currencies are different */}
        <CustomNumberInput
          form={form}
          name="payExhRate"
          label="Pay Exchange Rate"
          isRequired={true}
          round={exhRateDec}
          className="text-right"
          isDisabled={isCurrenciesEqual}
          onFocusEvent={handlePayExchangeRateFocus}
          onBlurEvent={handlePayExchangeRateChange}
        />

        {/* Pay Total Amount - Read-only when currencies are equal */}
        <CustomNumberInput
          form={form}
          name="payTotAmt"
          label="Pay Total Amount"
          round={amtDec}
          isDisabled={isCurrenciesEqual}
          onFocusEvent={handlePayTotAmtFocus}
          onBlurEvent={handlePayTotAmtChange}
        />

        {/* Pay Total Local Amount - Always read-only */}
        <CustomNumberInput
          form={form}
          name="payTotLocalAmt"
          label="Pay Total Local Amount"
          round={locAmtDec}
          isDisabled={true}
        />

        {/* Total Amount - Read-only when currencies are different */}
        <CustomNumberInput
          form={form}
          name="totAmt"
          label="Total Amount"
          round={amtDec}
          isDisabled={!isCurrenciesEqual}
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

        {/* Bank Charge GL */}
        {visible?.m_BankChgGLId && (
          <BankChartOfAccountAutocomplete
            form={form}
            name="bankChgGLId"
            label="Bank Charges GL"
            companyId={_companyId}
          />
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

        {/* Exchange Gain/Loss */}
        <CustomNumberInput
          form={form}
          name="exhGainLoss"
          label="Exchange Gain/Loss"
          round={locAmtDec}
          className="text-right"
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
