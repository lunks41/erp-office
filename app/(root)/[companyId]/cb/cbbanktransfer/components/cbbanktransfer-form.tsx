"use client"

import { useCompanyStore } from "@/stores/company-store"

import * as React from "react"
import {
  calculateDivisionAmount,
  calculateMultiplierAmount,
  calculateMultiplierWithDivisionAmount,
  calculateSubtractionAmount,
  setFromExchangeRate,
  setToExchangeRate,
} from "@/helpers/account"
import {
  IBankLookup,
  ICurrencyLookup,
  IJobOrderLookup,
  IPaymentTypeLookup,
  IServiceItemNoLookup,
  ITaskLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbBankTransferSchemaType } from "@/schemas"
import { PlusIcon } from "lucide-react"
import { FormProvider, UseFormReturn } from "react-hook-form"

import { useGetDynamicLookup, usePaymentTypeLookup } from "@/hooks/use-lookup"
import { Badge } from "@/components/ui/badge"
import {
  BankAutocomplete,
  BankChartOfAccountAutocomplete,
  CurrencyAutocomplete,
  DynamicJobOrderAutocomplete,
  JobOrderAutocomplete,
  JobOrderServiceAutocomplete,
  JobOrderTaskAutocomplete,
  PaymentTypeAutocomplete,
} from "@/components/autocomplete"
import PayeeSelectionDialog from "@/components/common/payee-selection-dialog"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomInputGroup from "@/components/custom/custom-input-group"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

const REQUIRE_CHEQUE_NO_WHEN_CHEQUE =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_REQUIRE_CHEQUE_NO_WHEN_CHEQUE === "true"

interface BankTransferFormProps {
  form: UseFormReturn<CbBankTransferSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
}

export default function BankTransferForm({
  form,
  onSuccessAction,
  isEdit: _isEdit,
  visible,
  required,
  companyId: _companyId,
}: BankTransferFormProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6

  const { data: dynamicLookup } = useGetDynamicLookup()
  const isDynamicJobOrder = dynamicLookup?.isJobOrder ?? false

  const { data: paymentTypes = [] } = usePaymentTypeLookup()

  const watchedJobOrderId = form.watch("jobOrderId")
  const watchedTaskId = form.watch("taskId")
  const watchedToBankChgAmt = form.watch("toBankChgAmt")
  const isToBankChgGLRequired = (watchedToBankChgAmt || 0) > 0

  // State to track if payment type is cheque
  const [isChequePayment, setIsChequePayment] = React.useState(false)

  // State to control payee selection dialog
  const [isPayeeDialogOpen, setIsPayeeDialogOpen] = React.useState(false)

  // Ref to prevent circular updates between fromTotAmt and toTotAmt
  const isUpdatingAmounts = React.useRef(false)
  const originalFromTotAmtRef = React.useRef<number>(0)
  const originalToTotAmtRef = React.useRef<number>(0)
  const lastSyncedTransferIdRef = React.useRef<string | undefined>(undefined)

  // When form is loaded with existing transaction (from DB), sync "original" refs
  // so blur handlers do not treat current values as "changed" and overwrite DB data
  const watchedTransferId = form.watch("transferId")
  React.useEffect(() => {
    const transferId =
      typeof watchedTransferId === "string"
        ? watchedTransferId
        : String(watchedTransferId ?? "")
    if (transferId && transferId !== "0") {
      if (lastSyncedTransferIdRef.current !== transferId) {
        lastSyncedTransferIdRef.current = transferId
        originalFromTotAmtRef.current = form.getValues("fromTotAmt") ?? 0
        originalToTotAmtRef.current = form.getValues("toTotAmt") ?? 0
      }
    } else {
      lastSyncedTransferIdRef.current = undefined
    }
  }, [watchedTransferId, form])

  // Watch paymentTypeId and update cheque payment state
  React.useEffect(() => {
    const paymentTypeId = form.watch("paymentTypeId")

    if (paymentTypeId && paymentTypes.length > 0) {
      const selectedPaymentType = paymentTypes.find(
        (pt) => pt.paymentTypeId === paymentTypeId
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

  const onSubmit = async () => {
    await onSuccessAction("save")
  }

  // Handle transaction date selection
  const handleTrnDateChange = React.useCallback(
    async (_selectedTrnDate: Date | null) => {
      const { trnDate } = form?.getValues()
      form.setValue("accountDate", trnDate as Date)
      form?.trigger("accountDate")
    },
    [form]
  )

  // Handle account date change
  const handleAccountDateChange = React.useCallback(
    async (_selectedAccountDate: Date | null) => {
      const { accountDate } = form?.getValues()
      // Update chequeDate to accountDate if not cheque payment
      if (!isChequePayment) {
        form.setValue("chequeDate", accountDate)
        form?.trigger("chequeDate")
      }
    },
    [form, isChequePayment]
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

        // Set chequeDate to accountDate if not cheque payment
        if (!isCheque) {
          form.setValue("chequeNo", "")
          const accountDate = form.getValues("accountDate")
          form.setValue("chequeDate", accountDate || "")
        }
      } else {
        // No payment type selected, set chequeDate to accountDate
        setIsChequePayment(false)
        form.setValue("chequeNo", "")
        const accountDate = form.getValues("accountDate")
        form.setValue("chequeDate", accountDate || "")
      }
    },
    [form]
  )

  // Handle job order selection
  const handleJobOrderChange = (selectedOption: IJobOrderLookup | null) => {
    if (selectedOption) {
      form.setValue("jobOrderId", selectedOption.jobOrderId, {
        shouldValidate: true,
        shouldDirty: true,
      })
      form.setValue("jobOrderNo", selectedOption.jobOrderNo || "")
      // // Auto-populate vessel from job order
      // if (selectedOption.vesselId) {
      //   form.setValue("vesselId", selectedOption.vesselId, {
      //     shouldValidate: true,
      //     shouldDirty: true,
      //   })
      // }
      // Reset task and service when job order changes
      form.setValue("taskId", 0, { shouldValidate: true })
      form.setValue("serviceItemNo", 0, { shouldValidate: true })
    } else {
      form.setValue("jobOrderId", 0, { shouldValidate: true })
      form.setValue("jobOrderNo", "")
      // form.setValue("vesselId", 0, { shouldValidate: true })
      form.setValue("taskId", 0, { shouldValidate: true })
      form.setValue("serviceItemNo", 0, { shouldValidate: true })
    }
  }

  // Handle task selection
  const handleTaskChange = (selectedOption: ITaskLookup | null) => {
    if (selectedOption) {
      form.setValue("taskId", selectedOption.taskId, {
        shouldValidate: true,
        shouldDirty: true,
      })
      form.setValue("taskName", selectedOption.taskName || "")
      // Reset service when task changes
      form.setValue("serviceItemNo", 0, { shouldValidate: true })
    }
  }

  // Handle service selection
  const handleServiceChange = (selectedOption: IServiceItemNoLookup | null) => {
    if (selectedOption) {
      form.setValue("serviceItemNo", selectedOption.serviceItemNo, {
        shouldValidate: true,
        shouldDirty: true,
      })
      form.setValue("serviceItemNoName", selectedOption.serviceItemNoName || "")
    }
  }

  // When Exchange Gain/Loss is cleared, keep as zero
  const handleExhGainLossBlur = React.useCallback(() => {
    const val = form.getValues("exhGainLoss")
    if (
      val === undefined ||
      val === null ||
      (typeof val === "number" && Number.isNaN(val))
    ) {
      form.setValue("exhGainLoss", 0, { shouldDirty: false })
    }
  }, [form])

  // Handle FROM bank selection
  const handleFromBankChange = React.useCallback(
    async (selectedBank: IBankLookup | null) => {
      if (selectedBank) {
        // Set fromCurrencyId based on bank's currency
        form.setValue("fromCurrencyId", selectedBank.currencyId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        // Trigger validation for currency field
        form.trigger("fromCurrencyId")

        // Try to fetch exchange rate from API
        await setFromExchangeRate(form, exhRateDec, visible, "fromCurrencyId")
      } else {
        // Clear currency and exchange rate when bank is cleared
        form.setValue("fromCurrencyId", 0)
        form.setValue("fromExhRate", 0)
      }
    },
    [form, exhRateDec, visible]
  )

  // Handle TO bank selection
  const handleToBankChange = React.useCallback(
    async (selectedBank: IBankLookup | null) => {
      if (selectedBank) {
        // Set toCurrencyId based on bank's currency
        form.setValue("toCurrencyId", selectedBank.currencyId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        // Trigger validation for currency field
        form.trigger("toCurrencyId")

        // Fetch exchange rate from API
        await setToExchangeRate(form, exhRateDec, visible, "toCurrencyId")
      } else {
        // Clear currency and exchange rate when bank is cleared
        form.setValue("toCurrencyId", 0)
        form.setValue("toExhRate", 0)
      }
    },
    [form, exhRateDec, visible]
  )

  // Handle add payee to button click
  const handleAddPayeeTo = React.useCallback(() => {
    setIsPayeeDialogOpen(true)
  }, [])

  // Handle payee selection from dialog
  const handlePayeeSelect = React.useCallback(
    (payeeName: string, _payeeType: "customer" | "supplier" | "employee") => {
      form.setValue("payeeTo", payeeName)
      form.trigger("payeeTo")
    },
    [form]
  )

  // Handle FROM currency selection
  const handleFromCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      if (selectedCurrency) {
        await setFromExchangeRate(form, exhRateDec, visible, "fromCurrencyId")
      } else {
        form.setValue("fromCurrencyId", 0)
        form.setValue("fromExhRate", 0)
      }
    },
    [form, exhRateDec, visible]
  )

  // Handle TO currency selection
  const handleToCurrencyChange = React.useCallback(
    async (selectedCurrency: ICurrencyLookup | null) => {
      if (selectedCurrency) {
        await setToExchangeRate(form, exhRateDec, visible, "toCurrencyId")
      } else {
        form.setValue("toCurrencyId", 0)
        form.setValue("toExhRate", 0)
      }
    },
    [form, exhRateDec, visible]
  )

  // Handle FROM exchange rate change
  const handleFromExchangeRateChange = React.useCallback(
    (value: number) => {
      // Prevent circular updates
      if (isUpdatingAmounts.current) return
      isUpdatingAmounts.current = true

      try {
        const fromExhRate = value || 0
        const fromTotAmt = form.getValues("fromTotAmt") || 0
        const toExhRate = form.getValues("toExhRate") || 0
        const fromCurrencyId = form.getValues("fromCurrencyId")
        const toCurrencyId = form.getValues("toCurrencyId")

        // 1. Calculate fromTotLocalAmt = fromTotAmt * fromExhRate
        const fromTotLocalAmt = calculateMultiplierAmount(
          fromTotAmt,
          fromExhRate,
          locAmtDec
        )
        form.setValue("fromTotLocalAmt", fromTotLocalAmt, {
          shouldValidate: false,
        })

        // 2. Recalculate TO amounts based on currency relationship
        if (fromCurrencyId && toCurrencyId && fromCurrencyId !== toCurrencyId) {
          // Different currencies: local amounts must be equal
          const toTotLocalAmt = fromTotLocalAmt
          const toTotAmt =
            toExhRate > 0
              ? calculateDivisionAmount(toTotLocalAmt, toExhRate, amtDec)
              : 0
          form.setValue("toTotAmt", toTotAmt, { shouldValidate: false })
          form.setValue("toTotLocalAmt", toTotLocalAmt, {
            shouldValidate: false,
          })
        } else {
          // Same currency: TO amounts equal FROM amounts
          const toTotAmt = fromTotAmt
          const toTotLocalAmt = calculateMultiplierAmount(
            toTotAmt,
            toExhRate,
            locAmtDec
          )
          form.setValue("toTotAmt", toTotAmt, { shouldValidate: false })
          form.setValue("toTotLocalAmt", toTotLocalAmt, {
            shouldValidate: false,
          })
        }

        // 3. Recalculate bank charge local amounts
        const fromBankChgAmt = form.getValues("fromBankChgAmt") || 0
        const fromBankChgLocalAmt = calculateMultiplierAmount(
          fromBankChgAmt,
          fromExhRate,
          locAmtDec
        )
        form.setValue("fromBankChgLocalAmt", fromBankChgLocalAmt, {
          shouldValidate: false,
        })

        const toBankChgAmt = form.getValues("toBankChgAmt") || 0
        const toBankChgLocalAmt = calculateMultiplierAmount(
          toBankChgAmt,
          toExhRate,
          locAmtDec
        )
        form.setValue("toBankChgLocalAmt", toBankChgLocalAmt, {
          shouldValidate: false,
        })
      } finally {
        isUpdatingAmounts.current = false
      }
    },
    [form, amtDec, locAmtDec]
  )

  // Handle TO exchange rate change
  const handleToExchangeRateChange = React.useCallback(
    (value: number) => {
      // Prevent circular updates
      if (isUpdatingAmounts.current) return
      isUpdatingAmounts.current = true

      try {
        const toExhRate = value || 0
        const toTotAmt = form.getValues("toTotAmt") || 0
        const fromExhRate = form.getValues("fromExhRate") || 0
        const fromTotLocalAmt = form.getValues("fromTotLocalAmt") || 0

        if (fromExhRate !== toExhRate) {
          const toTotAmtWithDivision = calculateMultiplierWithDivisionAmount(
            toTotAmt,
            fromExhRate,
            toExhRate,
            locAmtDec
          )
          form.setValue("toTotAmt", toTotAmtWithDivision, {
            shouldValidate: false,
          })
          form.setValue("toTotLocalAmt", fromTotLocalAmt, {
            shouldValidate: false,
          })
        } else {
          form.setValue("toTotAmt", toTotAmt, { shouldValidate: false })
          form.setValue("toTotLocalAmt", fromTotLocalAmt, {
            shouldValidate: false,
          })
        }

        // 2. Recalculate TO bank charge local amount
        const toBankChgAmt = form.getValues("toBankChgAmt") || 0
        const toBankChgLocalAmt = calculateMultiplierAmount(
          toBankChgAmt,
          toExhRate,
          locAmtDec
        )
        form.setValue("toBankChgLocalAmt", toBankChgLocalAmt, {
          shouldValidate: false,
        })
      } finally {
        isUpdatingAmounts.current = false
      }
    },
    [form, locAmtDec]
  )

  // STEP 1: FROM Total Amount Handler (Enhanced Debugging)
  const handleFromTotAmtChange = React.useCallback(
    (value: number) => {
      const fromTotAmt = value || 0
      console.log("🔄 [FROM] TotAmt changed to:", fromTotAmt)

      // Prevent circular updates
      if (isUpdatingAmounts.current) {
        console.log("⏭️ [FROM] Skipping - already updating")
        return
      }

      isUpdatingAmounts.current = true
      console.log("🔒 [FROM] Lock acquired")

      try {
        const fromExhRate = form.getValues("fromExhRate") || 0
        const toExhRate = form.getValues("toExhRate") || 0
        const fromCurrencyId = form.getValues("fromCurrencyId")
        const toCurrencyId = form.getValues("toCurrencyId")

        console.log("📊 [FROM] Current values:", {
          fromTotAmt,
          fromExhRate,
          toExhRate,
          fromCurrencyId,
          toCurrencyId,
          differentCurrencies: fromCurrencyId !== toCurrencyId,
        })

        // STEP 1A: Calculate FROM local amount
        const fromTotLocalAmt = calculateMultiplierAmount(
          fromTotAmt,
          fromExhRate,
          locAmtDec
        )
        console.log("✅ [FROM] Local calculated:", fromTotLocalAmt)
        form.setValue("fromTotLocalAmt", fromTotLocalAmt, {
          shouldValidate: false,
        })

        // STEP 1B: Calculate TO amounts based on currency relationship
        let toTotAmt: number
        let toTotLocalAmt: number

        if (fromCurrencyId && toCurrencyId && fromCurrencyId !== toCurrencyId) {
          // Different currencies: local amounts must be equal
          toTotLocalAmt = fromTotLocalAmt // Direct assignment - no calculation
          toTotAmt =
            toExhRate > 0
              ? calculateDivisionAmount(toTotLocalAmt, toExhRate, amtDec)
              : 0
          console.log("🌍 [FROM] Different currencies - TO calculated:", {
            toTotAmt,
            toTotLocalAmt,
          })
        } else {
          // Same currency: amounts are equal
          toTotAmt = fromTotAmt
          toTotLocalAmt = calculateMultiplierAmount(
            toTotAmt,
            toExhRate,
            locAmtDec
          )
          console.log("🏠 [FROM] Same currency - TO calculated:", {
            toTotAmt,
            toTotLocalAmt,
          })
        }

        // STEP 1C: Set TO values
        form.setValue("toTotAmt", toTotAmt, { shouldValidate: false })
        form.setValue("toTotLocalAmt", toTotLocalAmt, { shouldValidate: false })

        console.log("🎯 [FROM] Final result:", {
          fromTotAmt,
          fromTotLocalAmt,
          toTotAmt,
          toTotLocalAmt,
        })
      } finally {
        isUpdatingAmounts.current = false
        console.log("🔓 [FROM] Lock released")
      }
    },
    [form, amtDec, locAmtDec]
  )

  // STEP 2: TO Total Amount Handler (Enhanced Debugging)
  const handleToTotAmtChange = React.useCallback(
    (value: number) => {
      const toTotAmt = value || 0
      console.log("🔄 [TO] TotAmt changed to:", toTotAmt)

      // Prevent circular updates
      if (isUpdatingAmounts.current) {
        console.log("⏭️ [TO] Skipping - already updating")
        return
      }

      isUpdatingAmounts.current = true
      console.log("🔒 [TO] Lock acquired")

      try {
        const toExhRate = form.getValues("toExhRate") || 0

        console.log("📊 [TO] Current values:", {
          toTotAmt,
          toExhRate,
        })

        // STEP 2A: Calculate TO local amount only
        const toTotLocalAmt = calculateMultiplierAmount(
          toTotAmt,
          toExhRate,
          locAmtDec
        )
        console.log("✅ [TO] Local calculated:", toTotLocalAmt)
        form.setValue("toTotLocalAmt", toTotLocalAmt, { shouldValidate: false })

        console.log("🎯 [TO] Final result:", {
          toTotAmt,
          toTotLocalAmt,
        })
      } finally {
        isUpdatingAmounts.current = false
        console.log("🔓 [TO] Lock released")
      }
    },
    [form, locAmtDec]
  )

  const handleFromTotAmtFocus = React.useCallback(() => {
    originalFromTotAmtRef.current = form.getValues("fromTotAmt") ?? 0
  }, [form])

  const handleFromTotAmtBlur = React.useCallback(() => {
    const current = form.getValues("fromTotAmt") ?? 0
    if (current === originalFromTotAmtRef.current) return
    handleFromTotAmtChange(current)
  }, [form, handleFromTotAmtChange])

  const handleToTotAmtFocus = React.useCallback(() => {
    originalToTotAmtRef.current = form.getValues("toTotAmt") ?? 0
  }, [form])

  const handleToTotAmtBlur = React.useCallback(() => {
    const current = form.getValues("toTotAmt") ?? 0
    if (current === originalToTotAmtRef.current) return
    handleToTotAmtChange(current)

    // Derive TO bank charge from totals: toBankChgLocalAmt = fromTotLocalAmt - toTotLocalAmt, toBankChgAmt = toBankChgLocalAmt / toExhRate
    const toTotLocalAmt = form.getValues("toTotLocalAmt") ?? 0
    const fromTotLocalAmt = form.getValues("fromTotLocalAmt") ?? 0
    const toBankChgLocalAmt = calculateSubtractionAmount(
      fromTotLocalAmt,
      toTotLocalAmt,
      locAmtDec
    )

    form.setValue("exhGainLoss", toBankChgLocalAmt, {
      shouldValidate: false,
    })
  }, [form, handleToTotAmtChange, locAmtDec])

  // STEP 3: FROM Bank Charge Amount Handler
  const handleFromBankChgAmtChange = React.useCallback(
    (value: number) => {
      const fromBankChgAmt = value || 0
      const fromExhRate = form.getValues("fromExhRate") || 0

      // Calculate local amount: fromBankChgAmt * fromExhRate
      const fromBankChgLocalAmt = calculateMultiplierAmount(
        fromBankChgAmt,
        fromExhRate,
        locAmtDec
      )

      form.setValue("fromBankChgLocalAmt", fromBankChgLocalAmt, {
        shouldValidate: false,
      })

      console.log("💰 [FROM] Bank charge calculated:", {
        fromBankChgAmt,
        fromExhRate,
        fromBankChgLocalAmt,
      })
    },
    [form, locAmtDec]
  )

  // STEP 4: TO Bank Charge Amount Handler
  const handleToBankChgAmtChange = React.useCallback(
    (value: number) => {
      const toBankChgAmt = value || 0
      const toExhRate = form.getValues("toExhRate") || 0

      // Calculate local amount: toBankChgAmt * toExhRate
      const toBankChgLocalAmt = calculateMultiplierAmount(
        toBankChgAmt,
        toExhRate,
        locAmtDec
      )

      form.setValue("toBankChgLocalAmt", toBankChgLocalAmt, {
        shouldValidate: false,
      })

      console.log("💰 [TO] Bank charge calculated:", {
        toBankChgAmt,
        toExhRate,
        toBankChgLocalAmt,
      })
    },
    [form, locAmtDec]
  )

  // STEP 5: Bank Exchange Rate Handler
  const _handleBankExhRateChange = React.useCallback(
    (value: number) => {
      const bankExhRate = value || 0

      // If bankExhRate is zero, reset related fields
      if (bankExhRate === 0) {
        form.setValue("bankTotAmt", 0, {
          shouldValidate: false,
        })
        form.setValue("bankTotLocalAmt", 0, {
          shouldValidate: false,
        })
        form.setValue("toBankChgLocalAmt", 0, {
          shouldValidate: false,
        })
        form.setValue("toBankChgAmt", 0, {
          shouldValidate: false,
        })
        return
      }

      const fromTotAmt = form.getValues("fromTotAmt") || 0

      form.setValue("bankTotAmt", fromTotAmt, {
        shouldValidate: false,
      })

      // Calculate local amount: bankTotAmt * bankExhRate
      const bankTotLocalAmt = calculateMultiplierAmount(
        fromTotAmt,
        bankExhRate,
        locAmtDec
      )

      form.setValue("bankTotLocalAmt", bankTotLocalAmt, {
        shouldValidate: false,
      })

      // Calculate toBankChgLocalAmt = fromTotLocalAmt - bankTotLocalAmt
      const fromTotLocalAmt = form.getValues("fromTotLocalAmt") || 0
      const toBankChgLocalAmt = fromTotLocalAmt - bankTotLocalAmt

      form.setValue("toBankChgLocalAmt", toBankChgLocalAmt, {
        shouldValidate: false,
      })

      // Calculate toBankChgAmt = toBankChgLocalAmt / toExhRate
      const toExhRate = form.getValues("toExhRate") || 0
      const toBankChgAmt =
        toExhRate > 0
          ? calculateDivisionAmount(toBankChgLocalAmt, toExhRate, amtDec)
          : 0

      form.setValue("toBankChgAmt", toBankChgAmt, {
        shouldValidate: false,
      })

      console.log("🏦 [BANK] Exchange rate calculated:", {
        bankExhRate,
        fromTotAmt,
        bankTotLocalAmt,
        toBankChgLocalAmt,
        toBankChgAmt,
      })
    },
    [form, locAmtDec, amtDec]
  )

  // STEP 6: Bank Total Amount Handler
  const _handleBankTotAmtChange = React.useCallback(
    (value: number) => {
      const bankTotAmt = value || 0
      const bankExhRate = form.getValues("bankExhRate") || 0

      // Calculate local amount: bankTotAmt * bankExhRate
      const bankTotLocalAmt = calculateMultiplierAmount(
        bankTotAmt,
        bankExhRate,
        locAmtDec
      )

      form.setValue("bankTotLocalAmt", bankTotLocalAmt, {
        shouldValidate: false,
      })

      console.log("🏦 [BANK] Total amount calculated:", {
        bankTotAmt,
        bankExhRate,
        bankTotLocalAmt,
      })
    },
    [form, locAmtDec]
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-md"
      >
        {/* ============ SECTION 1: HEADER ============ */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-500 dark:bg-gray-800/50">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Header Information
          </h3>
          <div className="grid grid-cols-7 gap-2">
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
            {visible?.m_PayeeTo && (
              <CustomInputGroup
                form={form}
                name="payeeTo"
                label="Payee To"
                isRequired={true}
                className="col-span-2"
                buttonText="Add"
                buttonIcon={<PlusIcon className="h-3 w-3" />}
                buttonPosition="right"
                onButtonClick={handleAddPayeeTo}
                buttonVariant="default"
                buttonDisabled={false}
              />
            )}

            {/* Reference No */}
            <CustomInput
              form={form}
              name="referenceNo"
              label="Reference No."
              isRequired={required?.m_ReferenceNo}
            />

            {/* Payment Type */}
            <PaymentTypeAutocomplete
              form={form}
              name="paymentTypeId"
              label="Payment Type"
              isRequired={required?.m_PaymentTypeId}
              onChangeEvent={handlePaymentTypeChange}
            />

            {/* Cheque No - Only show when payment type is cheque */}

            <CustomInput
              form={form}
              name="chequeNo"
              label="Cheque No"
              isRequired={REQUIRE_CHEQUE_NO_WHEN_CHEQUE && isChequePayment}
            />

            <CustomDateNew
              form={form}
              name="chequeDate"
              label="Cheque Date"
              isRequired={false}
              isFutureShow={true}
            />

            {/* JOB-SPECIFIC MODE: Job Order → Task → Service */}
            {visible?.m_JobOrderId &&
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

            {visible?.m_JobOrderId && (
              <JobOrderTaskAutocomplete
                key={`task-${watchedJobOrderId}`}
                form={form}
                name="taskId"
                jobOrderId={watchedJobOrderId || 0}
                label="Task"
                onChangeEvent={handleTaskChange}
              />
            )}

            {visible?.m_JobOrderId && (
              <JobOrderServiceAutocomplete
                key={`service-${watchedJobOrderId}-${watchedTaskId}`}
                form={form}
                name="serviceItemNo"
                jobOrderId={watchedJobOrderId || 0}
                taskId={watchedTaskId || 0}
                label="Service"
                onChangeEvent={handleServiceChange}
              />
            )}

            <CustomNumberInput
              form={form}
              name="exhGainLoss"
              label="Exchange Gain/Loss"
              round={locAmtDec}
              className="text-right"
              isDisabled={false}
              onBlurEvent={handleExhGainLossBlur}
            />

            {/* Remarks */}
            <CustomTextarea
              form={form}
              name="remarks"
              label="Remarks"
              isRequired={required?.m_Remarks}
              className="col-span-2"
            />
          </div>
        </div>

        {/* ============ SECTIONS 2 & 3: FROM BANK & TO BANK (SIDE BY SIDE) ============ */}
        <div className="grid grid-cols-2 gap-4">
          {/* ============ SECTION 2: FROM BANK ============ */}
          <div className="rounded-lg border border-border bg-card p-4 dark:border-blue-700 dark:bg-blue-900/20">
            <h3 className="mb-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
              From Bank Details
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <BankAutocomplete
                form={form}
                name="fromBankId"
                label="From Bank"
                isRequired={true}
                onChangeEvent={handleFromBankChange}
              />

              <CurrencyAutocomplete
                form={form}
                name="fromCurrencyId"
                label="From Currency"
                isRequired={true}
                onChangeEvent={handleFromCurrencyChange}
              />

              <CustomNumberInput
                form={form}
                name="fromExhRate"
                label="From Exchange Rate"
                round={exhRateDec}
                isRequired={true}
                className="text-right"
                onChangeEvent={handleFromExchangeRateChange}
              />

              <BankChartOfAccountAutocomplete
                form={form}
                name="fromBankChgGLId"
                label="From Bank Charge GL"
                companyId={_companyId}
              />

              <CustomNumberInput
                form={form}
                name="fromBankChgAmt"
                label="From Bank Charge Amt"
                round={amtDec}
                className="text-right"
                onChangeEvent={handleFromBankChgAmtChange}
              />

              <CustomNumberInput
                form={form}
                name="fromBankChgLocalAmt"
                label="From Bank Charge Local Amt"
                round={locAmtDec}
                isDisabled={true}
                className="text-right"
              />

              <CustomNumberInput
                form={form}
                name="fromTotAmt"
                label="From Total Amount"
                round={amtDec}
                isRequired={true}
                className="text-right"
                onFocusEvent={handleFromTotAmtFocus}
                onBlurEvent={handleFromTotAmtBlur}
              />

              <CustomNumberInput
                form={form}
                name="fromTotLocalAmt"
                label="From Total Local Amt"
                round={locAmtDec}
                isRequired={true}
                isDisabled={true}
                className="text-right"
              />
            </div>
          </div>

          {/* ============ SECTION 3: TO BANK ============ */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
            <h3 className="mb-3 text-sm font-semibold text-green-700 dark:text-green-300">
              To Bank Details
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <BankAutocomplete
                form={form}
                name="toBankId"
                label="To Bank"
                isRequired={true}
                onChangeEvent={handleToBankChange}
              />

              <CurrencyAutocomplete
                form={form}
                name="toCurrencyId"
                label="To Currency"
                isRequired={true}
                onChangeEvent={handleToCurrencyChange}
              />

              <CustomNumberInput
                form={form}
                name="toExhRate"
                label="To Exchange Rate"
                round={exhRateDec}
                isRequired={true}
                className="text-right"
                onChangeEvent={handleToExchangeRateChange}
              />

              <BankChartOfAccountAutocomplete
                form={form}
                name="toBankChgGLId"
                label="To Bank Charge GL"
                companyId={_companyId}
                isRequired={isToBankChgGLRequired}
              />

              <CustomNumberInput
                form={form}
                name="toBankChgAmt"
                label="To Bank Charge Amt"
                round={amtDec}
                className="text-right"
                onChangeEvent={handleToBankChgAmtChange}
              />

              <CustomNumberInput
                form={form}
                name="toBankChgLocalAmt"
                label="To Bank Charge Local Amt"
                round={locAmtDec}
                isDisabled={true}
                className="text-right"
              />

              <CustomNumberInput
                form={form}
                name="toTotAmt"
                label="To Total Amount"
                round={amtDec}
                isRequired={true}
                className="text-right"
                onFocusEvent={handleToTotAmtFocus}
                onBlurEvent={handleToTotAmtBlur}
              />

              <CustomNumberInput
                form={form}
                name="toTotLocalAmt"
                label="To Total Local Amt"
                round={locAmtDec}
                isRequired={true}
                isDisabled={true}
                className="text-right"
              />
            </div>
          </div>
        </div>

        {/* ============ SECTION 4: BANK EXCHANGE ============ */}
        {/* <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-900/20">
          <h3 className="mb-3 text-sm font-semibold text-purple-700 dark:text-purple-300">
            Bank Exchange Details
          </h3>
          <div className="grid grid-cols-7 gap-2">
            <CustomNumberInput
              form={form}
              name="bankExhRate"
              label="Bank Exchange Rate"
              round={exhRateDec}
              isRequired={false}
              className="text-right"
              onChangeEvent={handleBankExhRateChange}
            />

            <CustomNumberInput
              form={form}
              name="bankTotAmt"
              label="Bank Total Amount"
              round={amtDec}
              isRequired={false}
              className="text-right"
              //onChangeEvent={_handleBankTotAmtChange}
            />

            <CustomNumberInput
              form={form}
              name="bankTotLocalAmt"
              label="Bank Total Local Amount"
              round={locAmtDec}
              isRequired={false}
              isDisabled={true}
              className="text-right"
            />
          </div>
        </div> */}

        {/* ============ NOTES ============ */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <h3 className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
            Notes
          </h3>
          <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
            <li className="flex flex-wrap items-start gap-2">
              <Badge variant="secondary" className="shrink-0 font-medium">
                1
              </Badge>
              <span>
                In <Badge variant="outline">To Bank Details</Badge>, enter the
                amount actually received in{" "}
                <Badge variant="outline">To Total Amount</Badge>.
              </span>
            </li>
            <li className="flex flex-wrap items-start gap-2">
              <Badge variant="secondary" className="shrink-0 font-medium">
                2
              </Badge>
              <span>
                The difference between{" "}
                <Badge variant="outline">From Total Local Amt</Badge> and{" "}
                <Badge variant="outline">To Total Local Amt</Badge> is posted to{" "}
                <Badge variant="outline">Exchange Gain/Loss</Badge> in the
                header (&quot;Exchange different&quot;). The GL account is
                defined in Settings.
              </span>
            </li>
            <li className="flex flex-wrap items-start gap-2">
              <Badge variant="secondary" className="shrink-0 font-medium">
                3
              </Badge>
              <span>
                For bank charges: enter the amount in{" "}
                <Badge variant="outline">From Bank Charge Amt</Badge> or{" "}
                <Badge variant="outline">To Bank Charge Amt</Badge> and select
                the correct <Badge variant="outline">From Bank Charge GL</Badge>{" "}
                or <Badge variant="outline">To Bank Charge GL</Badge>.
              </span>
            </li>
          </ul>
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
