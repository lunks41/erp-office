"use client"

import React, { useEffect, useImperativeHandle, useRef } from "react"
import {
  calculateMultiplierAmount,
  setToExchangeRateDetails,
} from "@/helpers/account"
import { recalculateDetailFormAmounts } from "@/helpers/cb-banktransferctm-calculations"
import { ICbBankTransferCtmDt } from "@/interfaces"
import {
  IBankLookup,
  IChartOfAccountLookup,
  ICurrencyLookup,
  IJobOrderLookup,
  IServiceItemNoLookup,
  ITaskLookup,
} from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import {
  CbBankTransferCtmDtSchema,
  CbBankTransferCtmDtSchemaType,
  CbBankTransferCtmHdSchemaType,
} from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, UseFormReturn, useForm } from "react-hook-form"
import { toast } from "sonner"

import { useGetDynamicLookup } from "@/hooks/use-lookup"
import { Button } from "@/components/ui/button"
import {
  BankAutocomplete,
  BankChartOfAccountAutocomplete,
  CurrencyAutocomplete,
  DynamicJobOrderAutocomplete,
  JobOrderAutocomplete,
  JobOrderServiceAutocomplete,
  JobOrderTaskAutocomplete,
} from "@/components/autocomplete"
import CustomNumberInput from "@/components/custom/custom-number-input"

import { defaultCbBankTransferCtmDt } from "./cbbanktransferctm-defaultvalues"

export interface CbBankTransferCtmDetailsFormRef {
  recalculateAmounts: (exchangeRate?: number) => void
}

interface CbBankTransferCtmDetailsFormProps {
  Hdform: UseFormReturn<CbBankTransferCtmHdSchemaType>
  onAddRowAction?: (rowData: ICbBankTransferCtmDt) => void
  onCancelEdit?: () => void
  editingDetail?: CbBankTransferCtmDtSchemaType | null
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
  existingDetails?: CbBankTransferCtmDtSchemaType[]
  isCancelled?: boolean
}

const CbBankTransferCtmDetailsForm = React.forwardRef<
  CbBankTransferCtmDetailsFormRef,
  CbBankTransferCtmDetailsFormProps
>(
  (
    {
      Hdform,
      onAddRowAction,
      onCancelEdit: _onCancelEdit,
      editingDetail,
      visible,
      required,
      companyId,
      existingDetails = [],
      isCancelled = false,
    },
    ref
  ) => {
    const { decimals } = useAuthStore()
    const amtDec = decimals[0]?.amtDec || 2
    const locAmtDec = decimals[0]?.locAmtDec || 2
    const exhRateDec = decimals[0]?.exhRateDec || 6

    const { data: dynamicLookup } = useGetDynamicLookup()
    const isDynamicJobOrder = dynamicLookup?.isJobOrder ?? false

    const originalToTotAmtRef = useRef<number>(0)

    // Calculate next itemNo based on existing details
    const getNextItemNo = () => {
      if (existingDetails.length === 0) return 1
      const maxItemNo = Math.max(...existingDetails.map((d) => d.itemNo || 0))
      return maxItemNo + 1
    }

    // Factory function to create default values with dynamic itemNo
    const createDefaultValues = (
      itemNo: number
    ): CbBankTransferCtmDtSchemaType => ({
      ...defaultCbBankTransferCtmDt,
      itemNo,
    })

    const form = useForm<CbBankTransferCtmDtSchemaType>({
      resolver: zodResolver(CbBankTransferCtmDtSchema(required, visible)),
      mode: "onBlur",
      defaultValues: editingDetail
        ? {
            transferId: editingDetail.transferId ?? "0",
            transferNo: editingDetail.transferNo ?? "",
            itemNo: editingDetail.itemNo ?? getNextItemNo(),
            seqNo: editingDetail.seqNo ?? getNextItemNo(),

            // Job Order Fields
            jobOrderId: editingDetail.jobOrderId ?? 0,
            jobOrderNo: editingDetail.jobOrderNo ?? "",
            taskId: editingDetail.taskId ?? 0,
            taskName: editingDetail.taskName ?? "",
            serviceItemNo: editingDetail.serviceItemNo ?? 0,
            serviceItemNoName: editingDetail.serviceItemNoName ?? "",

            // To Bank Fields
            toBankId: editingDetail.toBankId ?? 0,
            toBankCode: editingDetail.toBankCode ?? "",
            toBankName: editingDetail.toBankName ?? "",
            toCurrencyId: editingDetail.toCurrencyId ?? 0,
            toCurrencyCode: editingDetail.toCurrencyCode ?? "",
            toCurrencyName: editingDetail.toCurrencyName ?? "",
            toExhRate: editingDetail.toExhRate ?? 0,
            toBankChgGLId: editingDetail.toBankChgGLId ?? 0,
            toBankChgGLCode: editingDetail.toBankChgGLCode ?? "",
            toBankChgGLName: editingDetail.toBankChgGLName ?? "",
            toBankChgAmt: editingDetail.toBankChgAmt ?? 0,
            toBankChgLocalAmt: editingDetail.toBankChgLocalAmt ?? 0,
            toTotAmt: editingDetail.toTotAmt ?? 0,
            toTotLocalAmt: editingDetail.toTotLocalAmt ?? 0,

            // Bank Exchange Fields
            toBankExhRate: editingDetail.toBankExhRate ?? 0,
            toBankTotAmt: editingDetail.toBankTotAmt ?? 0,
            toBankTotLocalAmt: editingDetail.toBankTotLocalAmt ?? 0,

            editVersion: editingDetail.editVersion ?? 0,
          }
        : createDefaultValues(getNextItemNo()),
    })

    const watchedJobOrderId = form.watch("jobOrderId")
    const watchedTaskId = form.watch("taskId")

    // Helper function to populate code/name fields from lookup data
    const populateCodeNameFields = (
      formData: CbBankTransferCtmDtSchemaType
    ): CbBankTransferCtmDtSchemaType => {
      // The code/name fields should already be populated by the onChange handlers
      // This function is kept for consistency but doesn't need to do additional work
      // since handlers set the fields directly when selections are made
      return { ...formData }
    }

    // Helper function to focus first visible field
    const focusFirstVisibleField = () => {
      // Focus on the first input field after form operations
      setTimeout(() => {
        const firstInput = document.querySelector(
          'input:not([disabled]):not([type="hidden"])'
        ) as HTMLInputElement
        firstInput?.focus()
      }, 100)
    }

    // Handle form reset
    const handleFormReset = () => {
      const updatedDetails = Hdform.getValues("data_details") || []
      const nextItemNo =
        updatedDetails.length > 0
          ? Math.max(...updatedDetails.map((d) => d.itemNo || 0)) + 1
          : 1
      form.reset({
        ...createDefaultValues(nextItemNo),
        transferId: Hdform.getValues("transferId"),
        transferNo: Hdform.getValues("transferNo"),
      })
      focusFirstVisibleField()
    }

    // Handle cancel edit
    const handleCancelEdit = () => {
      _onCancelEdit?.()
      handleFormReset()
      toast.info("Edit cancelled")
    }

    // Function to recalculate local amounts when exchange rate changes
    const recalculateAmountsOnExchangeRateChange = (exchangeRate?: number) => {
      if (exchangeRate !== undefined) {
        recalculateDetailFormAmounts(
          form,
          Hdform,
          decimals[0],
          visible,
          exchangeRate
        )
      }
    }

    // Expose recalculation function via ref so it can be called from parent
    useImperativeHandle(ref, () => ({
      recalculateAmounts: recalculateAmountsOnExchangeRateChange,
    }))

    useEffect(() => {
      if (editingDetail) {
        form.reset({
          transferId: editingDetail.transferId ?? "0",
          transferNo: editingDetail.transferNo ?? "",
          itemNo: editingDetail.itemNo ?? getNextItemNo(),
          seqNo: editingDetail.seqNo ?? getNextItemNo(),

          // Job Order Fields
          jobOrderId: editingDetail.jobOrderId ?? 0,
          jobOrderNo: editingDetail.jobOrderNo ?? "",
          taskId: editingDetail.taskId ?? 0,
          taskName: editingDetail.taskName ?? "",
          serviceItemNo: editingDetail.serviceItemNo ?? 0,
          serviceItemNoName: editingDetail.serviceItemNoName ?? "",

          // To Bank Fields
          toBankId: editingDetail.toBankId ?? 0,
          toBankCode: editingDetail.toBankCode ?? "",
          toBankName: editingDetail.toBankName ?? "",
          toCurrencyId: editingDetail.toCurrencyId ?? 0,
          toCurrencyCode: editingDetail.toCurrencyCode ?? "",
          toCurrencyName: editingDetail.toCurrencyName ?? "",
          toExhRate: editingDetail.toExhRate ?? 0,
          toBankChgGLId: editingDetail.toBankChgGLId ?? 0,
          toBankChgGLCode: editingDetail.toBankChgGLCode ?? "",
          toBankChgGLName: editingDetail.toBankChgGLName ?? "",
          toBankChgAmt: editingDetail.toBankChgAmt ?? 0,
          toBankChgLocalAmt: editingDetail.toBankChgLocalAmt ?? 0,
          toTotAmt: editingDetail.toTotAmt ?? 0,
          toTotLocalAmt: editingDetail.toTotLocalAmt ?? 0,

          // Bank Exchange Fields
          toBankExhRate: editingDetail.toBankExhRate ?? 0,
          toBankTotAmt: editingDetail.toBankTotAmt ?? 0,
          toBankTotLocalAmt: editingDetail.toBankTotLocalAmt ?? 0,

          editVersion: editingDetail.editVersion ?? 0,
        })
      } else {
        form.reset({
          ...createDefaultValues(getNextItemNo()),
          transferId: Hdform.getValues("transferId"),
          transferNo: Hdform.getValues("transferNo"),
        })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingDetail])

    const onSubmit = async (data: CbBankTransferCtmDtSchemaType) => {
      try {
        // Validate data against schema
        const validationResult = CbBankTransferCtmDtSchema(
          required,
          visible
        ).safeParse(data)

        if (!validationResult.success) {
          const errors = validationResult.error.issues
          const errorMessage = errors
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join(", ")
          toast.error(`Validation failed: ${errorMessage}`)
          console.error("Validation errors:", errors)
          return
        }

        // Use itemNo as the unique identifier
        const currentItemNo = data.itemNo || getNextItemNo()

        // Populate code/name fields before creating rowData
        const populatedData = populateCodeNameFields(data)

        const rowData: ICbBankTransferCtmDt = {
          transferId: populatedData.transferId ?? "0",
          transferNo: populatedData.transferNo ?? "",
          itemNo: populatedData.itemNo ?? currentItemNo,
          seqNo: populatedData.seqNo ?? currentItemNo,

          // Job Order Fields
          jobOrderId: populatedData.jobOrderId ?? 0,
          jobOrderNo: populatedData.jobOrderNo ?? "",
          taskId: populatedData.taskId ?? 0,
          taskName: populatedData.taskName ?? "",
          serviceItemNo: populatedData.serviceItemNo ?? 0,
          serviceItemNoName: populatedData.serviceItemNoName ?? "",

          // To Bank Fields
          toBankId: populatedData.toBankId ?? 0,
          toBankCode: populatedData.toBankCode ?? "",
          toBankName: populatedData.toBankName ?? "",
          toCurrencyId: populatedData.toCurrencyId ?? 0,
          toCurrencyCode: populatedData.toCurrencyCode ?? "",
          toCurrencyName: populatedData.toCurrencyName ?? "",
          toExhRate: populatedData.toExhRate ?? 0,
          toBankChgGLId: populatedData.toBankChgGLId ?? 0,
          toBankChgGLCode: populatedData.toBankChgGLCode ?? "",
          toBankChgGLName: populatedData.toBankChgGLName ?? "",
          toBankChgAmt: populatedData.toBankChgAmt ?? 0,
          toBankChgLocalAmt: populatedData.toBankChgLocalAmt ?? 0,
          toTotAmt: populatedData.toTotAmt ?? 0,
          toTotLocalAmt: populatedData.toTotLocalAmt ?? 0,

          // Bank Exchange Fields
          toBankExhRate: populatedData.toBankExhRate ?? 0,
          toBankTotAmt: populatedData.toBankTotAmt ?? 0,
          toBankTotLocalAmt: populatedData.toBankTotLocalAmt ?? 0,

          editVersion: populatedData.editVersion ?? 0,
        }

        if (rowData) {
          onAddRowAction?.(rowData)

          // Show success message
          if (editingDetail) {
            toast.success(`Row ${currentItemNo} updated successfully`)
          } else {
            toast.success(`Row ${currentItemNo} added successfully`)
          }

          // Reset the form with incremented itemNo
          handleFormReset()
          focusFirstVisibleField()
        }
      } catch (error) {
        console.error("Error adding row:", error)
        toast.error("Failed to add row. Please check the form and try again.")
      }
    }

    // Handle Job Order selection
    const handleJobOrderChange = (selectedOption: IJobOrderLookup | null) => {
      if (selectedOption) {
        form.setValue("jobOrderId", selectedOption.jobOrderId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("jobOrderNo", selectedOption.jobOrderNo || "")
        // // Auto-populate vessel from job order if available
        // if (selectedOption.vesselId) {
        //   form.setValue("vesselId", selectedOption.vesselId, {
        //     shouldValidate: true,
        //     shouldDirty: true,
        //   })
        // }
        // Reset task and service when job order changes
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        // Clear job order and related fields
        form.setValue("jobOrderId", 0, { shouldValidate: true })
        form.setValue("jobOrderNo", "")
        // form.setValue("vesselId", 0, { shouldValidate: true })
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    }

    // Handle Task selection
    const handleTaskChange = (selectedOption: ITaskLookup | null) => {
      if (selectedOption) {
        form.setValue("taskId", selectedOption.taskId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("taskName", selectedOption.taskName || "")
        // Reset service when task changes
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        // Clear task and service fields
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    }

    // Handle Service selection
    const handleServiceChange = (
      selectedOption: IServiceItemNoLookup | null
    ) => {
      if (selectedOption) {
        form.setValue("serviceItemNo", selectedOption.serviceItemNo, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue(
          "serviceItemNoName",
          selectedOption.serviceItemNoName || ""
        )
      } else {
        // Clear service fields
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    }

    // Calculate bank charges based on difference: toBankChgLocalAmt = toBankTotLocalAmt - toTotLocalAmt
    // Then calculate: toBankChgAmt = toBankChgLocalAmt / toExhRate
    const calculateBankChargesFromDifference = React.useCallback(() => {
      const toBankTotLocalAmt = form.getValues("toBankTotLocalAmt") || 0
      const toTotLocalAmt = form.getValues("toTotLocalAmt") || 0
      const toExhRate = form.getValues("toExhRate") || 0

      // Calculate difference: toBankChgLocalAmt = toBankTotLocalAmt - toTotLocalAmt
      const toBankChgLocalAmt = toBankTotLocalAmt - toTotLocalAmt
      form.setValue("toBankChgLocalAmt", Number(toBankChgLocalAmt.toFixed(locAmtDec)), {
        shouldDirty: true,
      })

      // Calculate toBankChgAmt if toExhRate is not zero
      if (toExhRate !== 0) {
        const toBankChgAmt = toBankChgLocalAmt / toExhRate
        form.setValue("toBankChgAmt", Number(toBankChgAmt.toFixed(amtDec)), {
          shouldDirty: true,
        })
      } else {
        form.setValue("toBankChgAmt", 0, { shouldDirty: true })
      }
    }, [form, locAmtDec, amtDec])

    // Handle bank charge amount blur - calculate local amount on blur only
    const handleToBankChgAmtBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const toBankChgAmt = parseFloat(e.target.value) || 0
        const toExhRate = form.getValues("toExhRate") || 0

        // Calculate local amount: toBankChgLocalAmt = toBankChgAmt * toExhRate
        if (toExhRate > 0) {
          const toBankChgLocalAmt = calculateMultiplierAmount(
            toBankChgAmt,
            toExhRate,
            locAmtDec
          )
          form.setValue("toBankChgLocalAmt", toBankChgLocalAmt, {
            shouldDirty: true,
          })
        } else {
          form.setValue("toBankChgLocalAmt", 0, { shouldDirty: true })
        }
      },
      [form, locAmtDec]
    )

    // Handle TO currency selection
    const handleToCurrencyChange = React.useCallback(
      async (selectedCurrency: ICurrencyLookup | null) => {
        if (selectedCurrency) {
          form.setValue("toCurrencyId", selectedCurrency.currencyId)
          form.setValue("toCurrencyCode", selectedCurrency.currencyCode || "")
          form.setValue("toCurrencyName", selectedCurrency.currencyName || "")

          // Use helper to get exchange rate from API using header form's accountDate
          const exhRate = await setToExchangeRateDetails(
            Hdform,
            form,
            exhRateDec,
            "toCurrencyId"
          )

          // Auto-calculate local amounts with new exchange rate using helper
          if (exhRate) {
            const toTotAmt = form.getValues("toTotAmt") || 0
            const toTotLocalAmt = calculateMultiplierAmount(
              toTotAmt,
              Number(exhRate),
              locAmtDec
            )
            form.setValue("toTotLocalAmt", toTotLocalAmt)
          }
        } else {
          form.setValue("toCurrencyId", 0, { shouldValidate: true })
          form.setValue("toCurrencyCode", "")
          form.setValue("toCurrencyName", "")
          form.setValue("toExhRate", 0)
          form.setValue("toTotLocalAmt", 0)
        }
      },
      [form, Hdform, exhRateDec, locAmtDec]
    )

    const handleToTotAmtFocus = React.useCallback(() => {
      originalToTotAmtRef.current = form.getValues("toTotAmt") ?? 0
    }, [form])

    const handleToTotAmtBlur = React.useCallback(() => {
      const current = form.getValues("toTotAmt") ?? 0
      if (current === originalToTotAmtRef.current) return
      form.setValue("toTotAmt", current)
      const toExhRate = form.getValues("toExhRate") || 0
      const toTotLocalAmt = calculateMultiplierAmount(
        current,
        toExhRate,
        locAmtDec
      )
      form.setValue("toTotLocalAmt", toTotLocalAmt)
    }, [form, locAmtDec])

    // Handle TO total amount change (used when value actually changes)
    const handleToTotAmtChange = React.useCallback(
      (value: number) => {
        form.setValue("toTotAmt", value)
        const toExhRate = form.getValues("toExhRate") || 0
        const toTotLocalAmt = calculateMultiplierAmount(
          value,
          toExhRate,
          locAmtDec
        )
        form.setValue("toTotLocalAmt", toTotLocalAmt)
      },
      [form, locAmtDec]
    )

    // Handle bank total amount change
    const handleToBankTotAmtChange = React.useCallback(
      (value: number) => {
        form.setValue("toBankTotAmt", value)
        const toBankExhRate = form.getValues("toBankExhRate") || 0

        // Calculate local amount based on bank exchange rate using helper
        const toBankTotLocalAmt = calculateMultiplierAmount(
          value,
          toBankExhRate,
          locAmtDec
        )
        form.setValue("toBankTotLocalAmt", toBankTotLocalAmt)
      },
      [form, locAmtDec]
    )

    // Handle bank exchange rate change - only on blur to avoid recalculation when editing
    const handleToBankExhRateBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const toBankExhRate = parseFloat(e.target.value) || 0

        // If bank exchange rate is zero, clear all bank amounts
        if (toBankExhRate === 0) {
          form.setValue("toBankTotAmt", 0)
          form.setValue("toBankTotLocalAmt", 0)
          form.setValue("toBankChgLocalAmt", 0)
          form.setValue("toBankChgAmt", 0)
          return
        }

        const toTotAmt = form.getValues("toTotAmt") || 0
        form.setValue("toBankTotAmt", toTotAmt)

        // Calculate bank local amount using helper
        const toBankTotLocalAmt = calculateMultiplierAmount(
          toTotAmt,
          toBankExhRate,
          locAmtDec
        )
        form.setValue("toBankTotLocalAmt", toBankTotLocalAmt)

        // Calculate bank charges based on difference
        calculateBankChargesFromDifference()
      },
      [form, locAmtDec, calculateBankChargesFromDifference]
    )

    // Handle TO exchange rate change
    const handleToExchangeRateChange = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const toExhRate = parseFloat(e.target.value) || 0
        const toTotAmt = form.getValues("toTotAmt") || 0

        // Calculate local amount based on exchange rate using helper
        const toTotLocalAmt = calculateMultiplierAmount(
          toTotAmt,
          toExhRate,
          locAmtDec
        )
        form.setValue("toTotLocalAmt", toTotLocalAmt)
      },
      [form, locAmtDec]
    )

    // Handle bank selection
    const handleBankChange = React.useCallback(
      async (selectedBank: IBankLookup | null) => {
        if (selectedBank) {
          form.setValue("toBankId", selectedBank.bankId, {
            shouldValidate: true,
            shouldDirty: true,
          })
          form.setValue("toBankCode", selectedBank.bankCode || "")
          form.setValue("toBankName", selectedBank.bankName || "")

          // Update currency to match bank's currency if available
          if (selectedBank.currencyId) {
            const currentCurrencyId = form.getValues("toCurrencyId")

            // Only update currency if it's different from bank's currency
            if (currentCurrencyId !== selectedBank.currencyId) {
              form.setValue("toCurrencyId", selectedBank.currencyId, {
                shouldValidate: true,
                shouldDirty: true,
              })
              

              // Fetch exchange rate for the new currency
              const exhRate = await setToExchangeRateDetails(
                Hdform,
                form,
                exhRateDec,
                "toCurrencyId"
              )

              // Auto-calculate local amounts with new exchange rate
              if (exhRate) {
                const toTotAmt = form.getValues("toTotAmt") || 0
                const toTotLocalAmt = calculateMultiplierAmount(
                  toTotAmt,
                  Number(exhRate),
                  locAmtDec
                )
                form.setValue("toTotLocalAmt", toTotLocalAmt)
              }
            }
          }
        } else {
          form.setValue("toBankId", 0, { shouldValidate: true })
          form.setValue("toBankCode", "")
          form.setValue("toBankName", "")
        }
      },
      [form, Hdform, exhRateDec, locAmtDec]
    )

    // Handle bank chart of account selection
    const handleBankChgGLChange = React.useCallback(
      (selectedGL: IChartOfAccountLookup | null) => {
        if (selectedGL) {
          form.setValue("toBankChgGLCode", selectedGL.glCode || "")
          form.setValue("toBankChgGLName", selectedGL.glName || "")
        } else {
          form.setValue("toBankChgGLCode", "")
          form.setValue("toBankChgGLName", "")
        }
      },
      [form]
    )

    return (
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={`grid w-full grid-cols-7 gap-2 p-2 ${
            isCancelled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <BankAutocomplete
            form={form}
            name="toBankId"
            label="To Bank"
            isRequired={true}
            onChangeEvent={handleBankChange}
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
            onBlurEvent={handleToExchangeRateChange}
          />

          {visible?.m_JobOrderId && (
            <>
              {isDynamicJobOrder ? (
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
                  isRequired={required?.m_JobOrderId}
                  onChangeEvent={handleJobOrderChange}
                />
              )}

              <JobOrderTaskAutocomplete
                key={`task-${watchedJobOrderId}`}
                form={form}
                name="taskId"
                jobOrderId={watchedJobOrderId || 0}
                label="Task"
                isRequired={required?.m_JobOrderId}
                onChangeEvent={handleTaskChange}
              />

              <JobOrderServiceAutocomplete
                key={`service-${watchedJobOrderId}-${watchedTaskId}`}
                form={form}
                name="serviceItemNo"
                jobOrderId={watchedJobOrderId || 0}
                taskId={watchedTaskId || 0}
                label="Service"
                isRequired={required?.m_JobOrderId}
                onChangeEvent={handleServiceChange}
              />
            </>
          )}

          <BankChartOfAccountAutocomplete
            form={form}
            name="toBankChgGLId"
            label="To Bank Charge GL"
            companyId={companyId}
            onChangeEvent={handleBankChgGLChange}
          />

          <CustomNumberInput
            form={form}
            name="toBankChgAmt"
            label="To Bank Charge Amt"
            round={amtDec}
            isDisabled={false}
            className="text-right"
            onBlurEvent={handleToBankChgAmtBlur}
          />

          <CustomNumberInput
            form={form}
            name="toBankChgLocalAmt"
            label="To Bank Charge Local Amt"
            round={locAmtDec}
            isDisabled={false}
            className="text-right"
          />

          <CustomNumberInput
            form={form}
            name="toTotAmt"
            label="To Total Amount"
            round={amtDec}
            isRequired={false}
            className="text-right"
            onFocusEvent={handleToTotAmtFocus}
            onBlurEvent={handleToTotAmtBlur}
          />

          <CustomNumberInput
            form={form}
            name="toTotLocalAmt"
            label="To Total Local Amt"
            round={locAmtDec}
            isDisabled={true}
            className="text-right"
          />

          <CustomNumberInput
            form={form}
            name="toBankExhRate"
            label="Bank Exchange Rate"
            round={exhRateDec}
            isRequired={false}
            className="text-right"
            onBlurEvent={handleToBankExhRateBlur}
          />

          <CustomNumberInput
            form={form}
            name="toBankTotAmt"
            label="Bank Total Amount"
            round={amtDec}
            isRequired={false}
            className="text-right"
            onChangeEvent={handleToBankTotAmtChange}
          />

          <CustomNumberInput
            form={form}
            name="toBankTotLocalAmt"
            label="Bank Total Local Amount"
            round={locAmtDec}
            isDisabled={false}
            className="text-right"
          />

          {/* Action buttons */}
          <div className="col-span-1 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={handleFormReset}
            >
              New
            </Button>

            <Button
              type="submit"
              size="sm"
              className="ml-auto"
              disabled={form.formState.isSubmitting}
            >
              {editingDetail ? "Update" : "Add"}
            </Button>
            {editingDetail && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    )
  }
)

CbBankTransferCtmDetailsForm.displayName = "CbBankTransferCtmDetailsForm"

export default CbBankTransferCtmDetailsForm
