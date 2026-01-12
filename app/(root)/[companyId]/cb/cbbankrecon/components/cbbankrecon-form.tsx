"use client"

import * as React from "react"
import { IBankLookup, ICurrencyLookup } from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbBankReconHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { FormProvider, UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  BankAutocomplete,
  CurrencyAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

interface BankReconFormProps {
  form: UseFormReturn<CbBankReconHdSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
}

export default function BankReconForm({
  form,
  onSuccessAction,
  isEdit: _isEdit,
  visible,
  required,
  companyId: _companyId,
}: BankReconFormProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2

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

  // Handle bank selection
  const handleBankChange = React.useCallback(
    (selectedBank: IBankLookup | null) => {
      // Additional logic when bank changes
      // When bank changes in New Mode, update currency to match bank's currency
      if (!_isEdit && selectedBank && selectedBank.currencyId) {
        const currentCurrencyId = form.getValues("currencyId")

        // Only update currency if it's different from bank's currency
        if (currentCurrencyId !== selectedBank.currencyId) {
          form.setValue("currencyId", selectedBank.currencyId)
          form.trigger("currencyId")
        }
      }
    },
    [_isEdit, form]
  )

  // Handle currency selection
  const handleCurrencyChange = React.useCallback(
    (_selectedCurrency: ICurrencyLookup | null) => {
      // Additional logic when currency changes if needed
    },
    []
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-7 gap-2 rounded-md p-2"
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
          isFutureShow={false}
        />

        {/* Previous Reconciliation No */}
        <CustomInput
          form={form}
          name="prevReconNo"
          label="Previous Reconciliation No"
          isDisabled={true}
        />

        {/* Reference No */}
        <CustomInput
          form={form}
          name="referenceNo"
          label="Reference No"
          isRequired={required?.m_ReferenceNo}
        />

        {/* Bank */}
        <BankAutocomplete
          form={form}
          name="bankId"
          label="Bank"
          isRequired={true}
          onChangeEvent={handleBankChange}
        />

        {/* Currency */}
        <CurrencyAutocomplete
          form={form}
          name="currencyId"
          label="Currency"
          isRequired={true}
          onChangeEvent={handleCurrencyChange}
        />

        {/* From Date */}
        <CustomDateNew
          form={form}
          name="fromDate"
          label="From Date"
          isRequired={true}
        />

        {/* To Date */}
        <CustomDateNew
          form={form}
          name="toDate"
          label="To Date"
          isRequired={true}
        />

        {/* Opening Balance Amount */}
        <CustomNumberInput
          form={form}
          name="opBalAmt"
          label="Opening Balance"
          round={amtDec}
          isDisabled={true}
          className="text-right"
        />

        {/* Closing Balance Amount */}
        <CustomNumberInput
          form={form}
          name="clBalAmt"
          label="Closing Balance"
          round={amtDec}
          isDisabled={true}
          className="text-right"
        />

        {/* Total Amount */}
        <CustomNumberInput
          form={form}
          name="totAmt"
          label="Total Amount"
          round={amtDec}
          isDisabled={true}
          className="text-right"
        />

        {/* Remarks */}
        <CustomTextarea
          form={form}
          name="remarks"
          label="Remarks"
          isRequired={required?.m_Remarks}
          className="col-span-3"
        />

        {/* Action buttons */}
        <div className="col-span-1 flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            className="ml-auto"
            disabled={form.formState.isSubmitting}
          >
            Refresh
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
