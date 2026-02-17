"use client"

import * as React from "react"
import {
  calculateMultiplierAmount,
  setDueDate,
  setExchangeRate,
  setExchangeRateLocal,
  setRecExchangeRate,
} from "@/helpers/account"
import {
  calauteLocalAmtandGainLoss,
  calculateDiffCurrency,
  calculateSameCurrency,
  calculateUnallocated,
} from "@/helpers/ar-receipt-calculationsv1"
import { IArReceiptDt } from "@/interfaces"
import {
  IBankLookup,
  ICurrencyLookup,
  ICustomerLookup,
  IJobOrderLookup,
  IPaymentTypeLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { ArReceiptDtSchemaType, ArReceiptHdSchemaType } from "@/schemas"
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
  CustomerAutocomplete,
  DynamicCustomerAutocomplete,
  DynamicJobOrderAutocomplete,
  JobOrderAutocomplete,
  PaymentTypeAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface ReceiptFormProps {
  form: UseFormReturn<ArReceiptHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  isCancelled?: boolean
  dataDetails?: ArReceiptDtSchemaType[]
}

export default function ReceiptForm({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId: _companyId,
  isCancelled = false,
  dataDetails = [],
}: ReceiptFormProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const isDynamicCustomer = dynamicLookup?.isCustomer ?? false
  const isDynamicJobOrder = dynamicLookup?.isJobOrder ?? false

  const { data: paymentTypes = [] } = usePaymentTypeLookup()

  const dateFormat = React.useMemo(
    () => decimals[0]?.dateFormat || clientDateFormat,
    [decimals]
  )

  // State to track if currencies are the same
  const [isCurrenciesEqual, setIsCurrenciesEqual] = React.useState(true)

  // State to track if receipt type is cheque
  const [, setIsChequeReceipt] = React.useState(false)

  // Refs to store original values on focus for comparison on blur
  const originalExhRateRef = React.useRef<number>(0)
  const originalRecExhRateRef = React.useRef<number>(0)
  const originalTotAmtRef = React.useRef<number>(0)
  const originalRecTotAmtRef = React.useRef<number>(0)
  const originalBankChgAmtRef = React.useRef<number>(0)
  const originalRecBankChgAmtRef = React.useRef<number>(0)

  // Function to update currency comparison state
  const updateCurrencyComparison = React.useCallback(() => {
    const currencyId = form.getValues("currencyId") || 0
    const recCurrencyId = form.getValues("recCurrencyId") || 0
    const currenciesMatch = currencyId === recCurrencyId
    setIsCurrenciesEqual(currenciesMatch)
    return currenciesMatch
  }, [form])

  // Common function to recalculate amounts based on currency comparison
  const recalculateAmountsBasedOnCurrency = React.useCallback(
    (clearAllocations = false) => {
      const currencyId = form.getValues("currencyId") || 0
      const recCurrencyId = form.getValues("recCurrencyId") || 0
      const totAmt = form.getValues("totAmt") || 0
      const recTotAmt = form.getValues("recTotAmt") || 0
      const exhRate = form.getValues("exhRate") || 0
      const recExhRate = form.getValues("recExhRate") || 0
      const allocTotAmt = form.getValues("allocTotAmt") || 0
      const allocTotLocalAmt = form.getValues("allocTotLocalAmt") || 0

      if (currencyId === recCurrencyId) {
        // Same currency scenario - totAmt drives everything
        const {
          totLocalAmt: newTotLocalAmt,
          recTotAmt: newRecTotAmt,
          recTotLocalAmt: newRecTotLocalAmt,
        } = calculateSameCurrency(totAmt || 0, exhRate || 0, decimals[0])
        form.setValue("recTotAmt", newRecTotAmt, { shouldDirty: true })
        form.setValue("recTotLocalAmt", newRecTotLocalAmt, {
          shouldDirty: true,
        })
        form.setValue("totLocalAmt", newTotLocalAmt, { shouldDirty: true })

        // Calculate unallocated amounts
        const { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
          recTotAmt,
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
          form.setValue("recTotAmt", totAmt, { shouldDirty: true })
        } else {
          form.setValue("recTotAmt", 0, { shouldDirty: true })
        }

        // Different currency scenario - recTotAmt drives everything
        const {
          recTotAmt: newRecTotAmt,
          recTotLocalAmt: newRecTotLocalAmt,
          totAmt: newTotAmt,
          totLocalAmt: newTotLocalAmt,
        } = calculateDiffCurrency(
          recTotAmt || 0,
          recExhRate,
          exhRate,
          decimals[0]
        )

        form.setValue("recTotAmt", newRecTotAmt, { shouldDirty: true })
        form.setValue("recTotLocalAmt", newRecTotLocalAmt, {
          shouldDirty: true,
        })
        form.setValue("totAmt", newTotAmt, { shouldDirty: true })
        form.setValue("totLocalAmt", newTotLocalAmt, { shouldDirty: true })

        // Calculate unallocated amounts
        const { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
          newRecTotAmt,
          newRecTotLocalAmt,
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
        const arr = updatedDetails as unknown as IArReceiptDt[]
        const exhRateForDetails = form.getValues("exhRate") || 0
        const recExhRateForDetails = form.getValues("recExhRate") || 0
        const dec = decimals[0] || { amtDec: 2, locAmtDec: 2 }

        // Clear all allocations only when clearAllocations flag is true
        if (clearAllocations) {
          for (let i = 0; i < arr.length; i++) {
            arr[i].allocAmt = 0
          }
        }

        // Payalculate local amounts and gain/loss for all rows
        for (let i = 0; i < arr.length; i++) {
          calauteLocalAmtandGainLoss(
            arr,
            i,
            exhRateForDetails,
            recExhRateForDetails,
            dec
          )
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
        const currentRecTotAmt = form.getValues("recTotAmt") || 0
        const currentRecTotLocalAmt = form.getValues("recTotLocalAmt") || 0
        const { unAllocAmt, unAllocLocalAmt } = calculateUnallocated(
          currentRecTotAmt,
          currentRecTotLocalAmt,
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
  const recCurrencyId = form.watch("recCurrencyId")

  React.useEffect(() => {
    updateCurrencyComparison()

    // When currencies are equal, set recExhRate = exhRate
    if (currencyId === recCurrencyId && currencyId > 0) {
      const exhRate = form.getValues("exhRate") || 0
      form.setValue("recExhRate", exhRate, { shouldDirty: true })
    }
  }, [currencyId, recCurrencyId, updateCurrencyComparison, form])

  // Watch paymentTypeId and update cheque receipt state
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

        setIsChequeReceipt(isCheque)
      } else {
        setIsChequeReceipt(false)
      }
    } else {
      setIsChequeReceipt(false)
    }
  }, [form, paymentTypes])

  // Watch totAmt and auto-clear related fields when set to 0
  const totAmt = form.watch("totAmt")

  React.useEffect(() => {
    // Step 1: Check if totAmt is 0
    if (totAmt === 0) {
      // Step 2: Clear all related total fields
      form.setValue("totLocalAmt", 0, { shouldDirty: true })
      form.setValue("recTotAmt", 0, { shouldDirty: true })
      form.setValue("recTotLocalAmt", 0, { shouldDirty: true })
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
        await setRecExchangeRate(form, exhRateDec)

        // Calculate and set due date (for detail records)
        await setDueDate(form)
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
          form.setValue("recCurrencyId", selectedCustomer.currencyId || 0)
          form.setValue("bankId", selectedCustomer.bankId || 0)
        }

        // Calculate and set due date (for detail records)
        await setDueDate(form)

        // Only set exchange rates if currency is available
        if (selectedCustomer.currencyId > 0) {
          await setExchangeRate(form, exhRateDec, visible)
          await setRecExchangeRate(form, exhRateDec)
        } else {
          // If no currency, set exchange rates to zero
          form.setValue("exhRate", 0)
          form.setValue("recExhRate", 0)
        }

        // Update currency comparison state
        updateCurrencyComparison()
      } else {
        // ✅ Customer cleared - reset all related fields
        if (!isEdit) {
          // Clear customer-related fields
          form.setValue("currencyId", 0)
          form.setValue("recCurrencyId", 0)
          form.setValue("bankId", 0)
        }

        // Clear exchange rates
        form.setValue("exhRate", 0)
        form.setValue("recExhRate", 0)

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
      const recCurrencyId = selectedBank?.currencyId || 0

      // Update recCurrencyId from bank's currency
      form.setValue("recCurrencyId", recCurrencyId)

      if (selectedBank && recCurrencyId > 0) {
        // Only call setRecExchangeRate if currency is available
        await setRecExchangeRate(form, exhRateDec)
        form.trigger("recExhRate")
      } else {
        // If no bank selected or no currency, set exchange rate to zero
        form.setValue("recExhRate", 0)
      }

      // Update currency comparison state after setting recCurrencyId
      // This will enable/disable recExhRate and recTotAmt fields based on currency difference
      updateCurrencyComparison()
    },
    [exhRateDec, form, updateCurrencyComparison]
  )

  // Handle job order selection
  const handleJobOrderChange = React.useCallback(
    (_selectedJobOrder: IJobOrderLookup | null) => {
      // Additional logic when job order changes can be added here if needed
    },
    []
  )

  // Handle receipt type change
  const handlePaymentTypeChange = React.useCallback(
    (selectedPaymentType: IPaymentTypeLookup | null) => {
      if (selectedPaymentType) {
        // Check if receipt type is "Cheque"
        const isCheque =
          selectedPaymentType?.paymentTypeName
            ?.toLowerCase()
            .includes("cheque") ||
          selectedPaymentType?.paymentTypeCode?.toLowerCase().includes("cheque")

        setIsChequeReceipt(isCheque)

        // Clear cheque fields if not cheque receipt
        if (!isCheque) {
          form.setValue("chequeNo", "")
          form.setValue("chequeDate", "")
        }
      } else {
        // No receipt type selected, hide cheque fields
        setIsChequeReceipt(false)
        form.setValue("chequeNo", "")
        form.setValue("chequeDate", "")
      }
    },
    [form]
  )

  // // Handle receipt type change
  // const handlePaymentTypeChange = React.useCallback(
  //   (selectedPaymentType: IPaymentTypeLookup | null) => {
  //     if (selectedPaymentType) {
  //       // Check if receipt type is "Cheque"
  //       const isCheque =
  //         selectedPaymentType?.paymentTypeName
  //           ?.toLowerCase()
  //           .includes("cheque") ||
  //         selectedPaymentType?.paymentTypeCode?.toLowerCase().includes("cheque")

  //       setIsChequeReceipt(isCheque)

  //       // Clear cheque fields if not cheque receipt
  //       if (!isCheque) {
  //         form.setValue("chequeNo", "")
  //         form.setValue("chequeDate", "")
  //       }
  //     } else {
  //       // No receipt type selected, hide cheque fields
  //       setIsChequeReceipt(false)
  //       form.setValue("chequeNo", "")
  //       form.setValue("chequeDate", "")
  //     }
  //   },
  //   [form]
  // )

  // Handle pay currency change
  const handlePayCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      const recCurrencyId = selectedCurrency?.currencyId || 0
      const currencyId = form.getValues("currencyId") || 0

      form.setValue("recCurrencyId", recCurrencyId)

      if (recCurrencyId > 0 && recCurrencyId !== currencyId) {
        await setRecExchangeRate(form, exhRateDec)
      } else if (recCurrencyId > 0 && recCurrencyId === currencyId) {
        const exhRateValue = form.getValues("exhRate") || 0
        form.setValue("recExhRate", exhRateValue, { shouldDirty: true })
      } else {
        form.setValue("recExhRate", 0)
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

        const receiptId = form.getValues("receiptId")
        let currentPayCurrency = form.getValues("recCurrencyId") || 0
        const isNewReceipt = !isEdit || !receiptId || receiptId === "0"

        if (currencyId > 0 && (isNewReceipt || currentPayCurrency === 0)) {
          form.setValue("recCurrencyId", currencyId, { shouldDirty: true })
          currentPayCurrency = currencyId
        }

        if (currencyId > 0 && currentPayCurrency === currencyId) {
          const exhRateValue = form.getValues("exhRate") || 0
          form.setValue("recExhRate", exhRateValue, { shouldDirty: true })
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
        const currentPayCurrency = form.getValues("recCurrencyId") || 0
        if (currentCurrency > 0 && currentCurrency === currentPayCurrency) {
          form.setValue("recExhRate", exhRate, { shouldDirty: true })
        }

        // Payalculate all amounts based on currency comparison - don't clear allocations for exchange rate change
        recalculateAmountsBasedOnCurrency(false)
      } else {
        console.log("Exchange Rate unchanged - skipping recalculation")
      }
    },
    [form, recalculateAmountsBasedOnCurrency]
  )

  // Handle receipt exchange rate focus - capture original value
  const handleRecExchangeRateFocus = React.useCallback(() => {
    originalRecExhRateRef.current = form.getValues("recExhRate") || 0
    console.log(
      "handleRecExchangeRateFocus - original value:",
      originalRecExhRateRef.current
    )
  }, [form])

  // Handle receipt exchange rate change
  const handleRecExchangeRateChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const recExhRate = parseNumberWithCommas(e.target.value)
      const originalRecExhRate = originalRecExhRateRef.current

      console.log("handleRecExchangeRateChange", {
        newValue: recExhRate,
        originalValue: originalRecExhRate,
        isDifferent: recExhRate !== originalRecExhRate,
      })

      // Only recalculate if value is different from original
      if (recExhRate !== originalRecExhRate) {
        console.log("Receipt Exchange Rate changed - recalculating amounts")
        form.setValue("recExhRate", recExhRate, { shouldDirty: true })

        // Payalculate all amounts based on currency comparison - don't clear allocations for exchange rate change
        recalculateAmountsBasedOnCurrency(false)
      } else {
        console.log("Receipt Exchange Rate unchanged - skipping recalculation")
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

  // Handle recTotAmt focus - capture original value
  const handleRecTotAmtFocus = React.useCallback(() => {
    originalRecTotAmtRef.current = form.getValues("recTotAmt") || 0
    console.log(
      "handleRecTotAmtFocus - original value:",
      originalRecTotAmtRef.current
    )
  }, [form])

  // Handle recTotAmt change
  const handleRecTotAmtChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const recTotAmt = parseNumberWithCommas(e.target.value)
      const originalRecTotAmt = originalRecTotAmtRef.current

      console.log("handleRecTotAmtChange", {
        newValue: recTotAmt,
        originalValue: originalRecTotAmt,
        isDifferent: recTotAmt !== originalRecTotAmt,
      })

      // Only recalculate if value is different from original
      if (recTotAmt !== originalRecTotAmt) {
        console.log(
          "Receipt Total Amount changed - recalculating amounts and clearing allocations"
        )
        form.setValue("recTotAmt", recTotAmt, { shouldDirty: true })

        // Payalculate all amounts based on currency comparison - clear allocations for recTotAmt change
        recalculateAmountsBasedOnCurrency(true)
      } else {
        console.log("Receipt Total Amount unchanged - skipping recalculation")
      }
    },
    [form, recalculateAmountsBasedOnCurrency]
  )

  // Handle bank charges amount focus - capture original value
  const handleRecBankChgAmtFocus = React.useCallback(() => {
    originalRecBankChgAmtRef.current = form.getValues("recBankChgAmt") || 0
    console.log(
      "handleRecBankChgAmtFocus - original value:",
      originalRecBankChgAmtRef.current
    )
  }, [form])

  // Handle rec bank charges amount change
  const handleRecBankChgAmtChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const recBankChgAmt = parseNumberWithCommas(e.target.value)
      const originalRecBankChgAmt = originalRecBankChgAmtRef.current

      console.log("handleBankChgAmtChange", {
        newValue: recBankChgAmt,
        originalValue: originalRecBankChgAmt,
        isDifferent: recBankChgAmt !== originalRecBankChgAmt,
      })

      // Only recalculate if value is different from original
      if (recBankChgAmt !== originalRecBankChgAmt) {
        console.log(
          "Rec Bank Charges Amount changed - recalculating local amount"
        )
        form.setValue("recBankChgAmt", recBankChgAmt, { shouldDirty: true })

        // Calculate bank charges local amount: bankChgAmt * recExhRate
        const recExhRate = form.getValues("recExhRate") || 0
        if (recExhRate > 0) {
          const recBankChgLocalAmt = calculateMultiplierAmount(
            recBankChgAmt,
            recExhRate,
            locAmtDec
          )
          form.setValue("recBankChgLocalAmt", recBankChgLocalAmt, {
            shouldDirty: true,
          })
        } else {
          form.setValue("recBankChgLocalAmt", 0, { shouldDirty: true })
        }
      } else {
        console.log(
          "Rec Bank Charges Amount unchanged - skipping recalculation"
        )
      }
    },
    [form, locAmtDec]
  )

  // Handle bank charges amount focus - sync from rec: bankChgAmt = recBankChgLocalAmt/exhRate, bankChgLocalAmt = recBankChgLocalAmt
  const handleBankChgAmtFocus = React.useCallback(() => {
    const recBankChgLocalAmt = form.getValues("recBankChgLocalAmt") || 0
    const exhRate = form.getValues("exhRate") || 0

    if (exhRate > 0) {
      const bankChgAmt = Number((recBankChgLocalAmt / exhRate).toFixed(amtDec))
      form.setValue("bankChgAmt", bankChgAmt, { shouldDirty: true })
      form.setValue("bankChgLocalAmt", recBankChgLocalAmt, {
        shouldDirty: true,
      })
    }

    originalBankChgAmtRef.current = form.getValues("bankChgAmt") || 0
  }, [form, amtDec])

  // Handle bank charges amount change
  const handleBankChgAmtChange = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const bankChgAmt = parseNumberWithCommas(e.target.value)
      const originalBankChgAmt = originalBankChgAmtRef.current

      if (bankChgAmt !== originalBankChgAmt) {
        form.setValue("bankChgAmt", bankChgAmt, { shouldDirty: true })

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

        {/* Customer */}
        {isDynamicCustomer ? (
          <DynamicCustomerAutocomplete
            form={form}
            name="customerId"
            label="Customer-D"
            isRequired={true}
            onChangeEvent={handleCustomerChange}
            className="col-span-2"
            isDisabled={dataDetails.length > 0}
          />
        ) : (
          <CustomerAutocomplete
            form={form}
            name="customerId"
            label="Customer-S"
            isRequired={true}
            onChangeEvent={handleCustomerChange}
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

        {/* Receipt Type */}
        <PaymentTypeAutocomplete
          form={form}
          name="paymentTypeId"
          label="Pay"
          isRequired={required?.m_PaymentTypeId}
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
          name="recCurrencyId"
          label="Rec Currency"
          onChangeEvent={handlePayCurrencyChange}
        />

        {/* Pay Exchange Rate - Enabled when currencies are different */}
        <CustomNumberInput
          form={form}
          name="recExhRate"
          label="Rec Exchange Rate"
          isRequired={true}
          round={exhRateDec}
          className="text-right"
          isDisabled={isCurrenciesEqual}
          onFocusEvent={handleRecExchangeRateFocus}
          onBlurEvent={handleRecExchangeRateChange}
        />

        {/* Pay Total Amount - Read-only when currencies are equal */}
        <CustomNumberInput
          form={form}
          name="recTotAmt"
          label="Rec Total Amount"
          round={amtDec}
          isDisabled={isCurrenciesEqual}
          onFocusEvent={handleRecTotAmtFocus}
          onBlurEvent={handleRecTotAmtChange}
        />

        {/* Pay Total Local Amount - Always read-only */}
        <CustomNumberInput
          form={form}
          name="recTotLocalAmt"
          label="Rec Total Local Amount"
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

        {/* Is Customer Bank Charge */}
        <CustomSwitch
          form={form}
          name="isCustPayBankChg"
          label="Is Cust Pay Bank Chg"
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

        <div className="col-span-1 flex flex-row gap-1">
          <div className="flex-1">
            {/* Bank Charges Amount */}
            <CustomNumberInput
              form={form}
              name="recBankChgAmt"
              label="Rec Bank Amt"
              round={amtDec}
              onFocusEvent={handleRecBankChgAmtFocus}
              onBlurEvent={handleRecBankChgAmtChange}
            />
          </div>
          <div className="flex-1">
            {/* Bank Charges Local Amount */}
            <CustomNumberInput
              form={form}
              name="recBankChgLocalAmt"
              label="Rec Bank Loc"
              round={locAmtDec}
              isDisabled={true}
            />
          </div>
        </div>

        <div className="col-span-1 flex flex-row gap-1">
          <div className="flex-1">
            {/* Bank Charges Amount */}
            <CustomNumberInput
              form={form}
              name="bankChgAmt"
              label="Bank Chg Amt"
              round={amtDec}
              isDisabled={true}
              onFocusEvent={handleBankChgAmtFocus}
              onBlurEvent={handleBankChgAmtChange}
            />
          </div>
          <div className="flex-1">
            {/* Bank Charges Local Amount */}
            <CustomNumberInput
              form={form}
              name="bankChgLocalAmt"
              label="Bank Locmt"
              round={locAmtDec}
              isDisabled={true}
            />
          </div>
        </div>

        {/* Exchange Gain/Loss */}
        <CustomNumberInput
          form={form}
          name="exhGainLoss"
          label="Exchange Gain/Loss"
          round={locAmtDec}
        />

        {/* Job Order */}
        {visible?.m_JobOrderIdHd &&
          (isDynamicJobOrder ? (
            <DynamicJobOrderAutocomplete
              form={form}
              name="jobOrderId"
              label="Job Order-D"
              onChangeEvent={handleJobOrderChange}
            />
          ) : (
            <JobOrderAutocomplete
              form={form}
              name="jobOrderId"
              label="Job Order-S"
              onChangeEvent={handleJobOrderChange}
            />
          ))}

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
