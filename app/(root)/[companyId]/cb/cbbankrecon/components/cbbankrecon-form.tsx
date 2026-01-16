"use client"

import * as React from "react"
import { IBankLookup, ICurrencyLookup } from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbBankReconHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { isAfter, isValid } from "date-fns"
import { Plus } from "lucide-react"
import { FormProvider, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"

import { parseDate } from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import {
  BankAutocomplete,
  CurrencyAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomInput from "@/components/custom/custom-input"
import CustomInputGroup from "@/components/custom/custom-input-group"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

import BankReconSelectionDialog from "./bankrecon-selection-dialog"

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
  visible: _visible,
  required,
  companyId,
}: BankReconFormProps) {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2

  const [isBankReconDialogOpen, setIsBankReconDialogOpen] =
    React.useState(false)

  const onSubmit = async () => {
    await onSuccessAction("save")
  }

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

  // Handle bank reconciliation selection
  const handleBankReconSelect = React.useCallback(
    (reconNo: string, reconId: string) => {
      form.setValue("prevReconNo", reconNo)
      form.setValue("prevReconId", Number(reconId) || 0)
      form.trigger("prevReconNo")
      form.trigger("prevReconId")
    },
    [form]
  )

  // Watch bankId to conditionally show plus button
  const bankId = form.watch("bankId")
  const isBankSelected = bankId && bankId > 0

  // Watch fromDate and toDate for validation
  const fromDate = form.watch("fromDate")
  const toDate = form.watch("toDate")

  // Parse dates for comparison
  const parsedFromDate = React.useMemo(() => {
    if (!fromDate) return null
    if (fromDate instanceof Date) return isValid(fromDate) ? fromDate : null
    return parseDate(fromDate as string)
  }, [fromDate])

  const parsedToDate = React.useMemo(() => {
    if (!toDate) return null
    if (toDate instanceof Date) return isValid(toDate) ? toDate : null
    return parseDate(toDate as string)
  }, [toDate])

  // Handle From Date change - validate that it's not greater than To Date
  const handleFromDateChange = React.useCallback(
    (date: Date | null) => {
      if (date && parsedToDate && isValid(parsedToDate)) {
        // If fromDate is greater than toDate, adjust toDate to match fromDate
        if (isAfter(date, parsedToDate)) {
          form.setValue("toDate", date)
          form.trigger("toDate")
          toast.warning("To Date has been adjusted to match From Date")
        }
      }
    },
    [form, parsedToDate]
  )

  // Handle To Date change - validate that it's not less than From Date
  const handleToDateChange = React.useCallback(
    (date: Date | null) => {
      if (date && parsedFromDate && isValid(parsedFromDate)) {
        // If toDate is less than fromDate, adjust fromDate to match toDate
        if (isAfter(parsedFromDate, date)) {
          form.setValue("fromDate", date)
          form.trigger("fromDate")
          toast.warning("From Date has been adjusted to match To Date")
        }
      }
    },
    [form, parsedFromDate]
  )

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-7 gap-2 rounded-md p-2"
      >
        {/* Account Date */}
        <CustomDateNew
          form={form}
          name="accountDate"
          label="Account Date"
          isRequired={true}
          isFutureShow={false}
        />

        {/* Bank */}
        <BankAutocomplete
          form={form}
          name="bankId"
          label="Bank"
          isRequired={true}
          onChangeEvent={handleBankChange}
        />

        {/* Previous Reconciliation No */}
        <CustomInputGroup
          form={form}
          name="prevReconNo"
          label="Previous Reconciliation No"
          isDisabled={true}
          buttonIcon={isBankSelected ? <Plus className="h-4 w-4" /> : undefined}
          buttonPosition="right"
          onButtonClick={() => setIsBankReconDialogOpen(true)}
          buttonVariant="default"
          buttonDisabled={!isBankSelected}
        />
        <CustomInput form={form} name="referenceNo" label="Reference No" />

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
          maxDate={parsedToDate || undefined}
          onChangeEvent={handleFromDateChange}
        />

        {/* To Date */}
        <CustomDateNew
          form={form}
          name="toDate"
          label="To Date"
          isRequired={true}
          minDate={parsedFromDate || undefined}
          onChangeEvent={handleToDateChange}
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

      {/* Bank Reconciliation Selection Dialog */}
      {isBankSelected && (
        <BankReconSelectionDialog
          open={isBankReconDialogOpen}
          onOpenChangeAction={setIsBankReconDialogOpen}
          onSelectBankReconAction={handleBankReconSelect}
          bankId={bankId}
          currencyId={form.watch("currencyId")}
          companyId={companyId}
        />
      )}
    </FormProvider>
  )
}
