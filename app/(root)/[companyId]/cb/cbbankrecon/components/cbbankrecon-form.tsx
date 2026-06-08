"use client"

import { useCompanyStore } from "@/stores/company-store"

import * as React from "react"
import { ICbBankReconHd } from "@/interfaces/cb-bankrecon"
import { IBankLookup, ICurrencyLookup } from "@/interfaces/lookup"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbBankReconHdSchemaType } from "@/schemas"
import { endOfMonth, isAfter, isValid, startOfMonth } from "date-fns"
import { Plus } from "lucide-react"
import { FormProvider, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import { getData } from "@/lib/api-client"
import { CbBankRecon } from "@/lib/api-routes"
import { parseDate } from "@/lib/date-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  onRefreshAction: () => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
}

export default function BankReconForm({
  form,
  onRefreshAction,
  isEdit: _isEdit,
  visible: _visible,
  required,
  companyId,
}: BankReconFormProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2

  const [isBankReconDialogOpen, setIsBankReconDialogOpen] =
    React.useState(false)
  const [showBankChangeConfirm, setShowBankChangeConfirm] =
    React.useState(false)
  const [pendingBank, setPendingBank] = React.useState<IBankLookup | null>(null)
  const previousBankIdRef = React.useRef<number>(form.getValues("bankId") ?? 0)

  const clearDetailsAndTotals = React.useCallback(() => {
    form.setValue("data_details", [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    form.setValue("totAmt", 0)
    form.setValue("debitTotAmt", 0)
    form.setValue("creditTotAmt", 0)
    form.setValue("allocTotAmt", 0)
    form.setValue("unAllocTotAmt", 0)
    form.trigger("data_details")
  }, [form])

  const applyPreviousReconHeader = React.useCallback(
    (recon: ICbBankReconHd) => {
      form.setValue("prevReconNo", recon.reconNo ?? "")
      form.setValue("prevReconId", Number(recon.reconId) || 0)
      form.setValue("opBalAmt", recon.clBalAmt ?? 0)
      form.trigger(["prevReconNo", "prevReconId", "opBalAmt"])
    },
    [form]
  )

  const loadLatestPreviousRecon = React.useCallback(
    async (bankIdValue: number, currencyIdValue?: number) => {
      if (!bankIdValue || bankIdValue <= 0) return

      try {
        const response = await getData(CbBankRecon.get, {
          pageNumber: "1",
          pageSize: "2000",
          searchString: "null",
          startDate: "",
          endDate: "",
          isAllTime: "true",
        })

        const records = Array.isArray(response?.data)
          ? (response.data as ICbBankReconHd[])
          : []

        const latest = records
          .filter(
            (item) =>
              item.bankId === bankIdValue &&
              !item.isCancel &&
              (!currencyIdValue || item.currencyId === currencyIdValue)
          )
          .sort((a, b) => {
            const dateA = a.accountDate
              ? new Date(a.accountDate).getTime()
              : 0
            const dateB = b.accountDate
              ? new Date(b.accountDate).getTime()
              : 0
            if (dateA !== dateB) return dateB - dateA
            return (Number(b.reconId) || 0) - (Number(a.reconId) || 0)
          })[0]

        if (latest) {
          applyPreviousReconHeader(latest)
        } else {
          form.setValue("prevReconNo", "")
          form.setValue("prevReconId", 0)
          form.setValue("opBalAmt", 0)
          form.trigger(["prevReconNo", "prevReconId", "opBalAmt"])
        }
      } catch {
        toast.error("Failed to load previous bank reconciliation")
      }
    },
    [applyPreviousReconHeader, form]
  )

  const applyBankChange = React.useCallback(
    async (selectedBank: IBankLookup | null) => {
      if (!_isEdit && selectedBank?.currencyId) {
        const currentCurrencyId = form.getValues("currencyId")
        if (currentCurrencyId !== selectedBank.currencyId) {
          form.setValue("currencyId", selectedBank.currencyId)
          form.trigger("currencyId")
        }
      }

      if (!_isEdit && selectedBank?.bankId) {
        await loadLatestPreviousRecon(
          selectedBank.bankId,
          selectedBank.currencyId
        )
      }

      previousBankIdRef.current = selectedBank?.bankId ?? 0
    },
    [_isEdit, form, loadLatestPreviousRecon]
  )

  // Handle bank selection
  const handleBankChange = React.useCallback(
    (selectedBank: IBankLookup | null) => {
      const newBankId = selectedBank?.bankId ?? 0
      const previousBankId = previousBankIdRef.current
      const details = form.getValues("data_details") || []

      if (
        !_isEdit &&
        details.length > 0 &&
        previousBankId > 0 &&
        newBankId > 0 &&
        newBankId !== previousBankId
      ) {
        setPendingBank(selectedBank)
        setShowBankChangeConfirm(true)
        form.setValue("bankId", previousBankId)
        form.trigger("bankId")
        return
      }

      void applyBankChange(selectedBank)
    },
    [_isEdit, applyBankChange, form]
  )

  const handleConfirmBankChange = React.useCallback(async () => {
    if (!pendingBank) {
      setShowBankChangeConfirm(false)
      return
    }

    clearDetailsAndTotals()
    form.setValue("prevReconNo", "")
    form.setValue("prevReconId", 0)
    form.setValue("opBalAmt", 0)
    form.setValue("bankId", pendingBank.bankId)
    form.trigger(["bankId", "prevReconNo", "prevReconId", "opBalAmt"])

    await applyBankChange(pendingBank)
    setPendingBank(null)
    setShowBankChangeConfirm(false)
    toast.info("Details cleared. Click Refresh to load transactions for the new bank.")
  }, [applyBankChange, clearDetailsAndTotals, form, pendingBank])

  const handleCancelBankChange = React.useCallback(() => {
    setPendingBank(null)
    setShowBankChangeConfirm(false)
  }, [])

  // Handle currency selection
  const handleCurrencyChange = React.useCallback(
    (_selectedCurrency: ICurrencyLookup | null) => {
      // Additional logic when currency changes if needed
    },
    []
  )

  // Handle bank reconciliation selection
  const handleBankReconSelect = React.useCallback(
    (recon: ICbBankReconHd) => {
      applyPreviousReconHeader(recon)
    },
    [applyPreviousReconHeader]
  )

  // Watch core fields
  const bankId = form.watch("bankId")

  React.useEffect(() => {
    if (bankId && bankId > 0) {
      previousBankIdRef.current = bankId
    }
  }, [bankId])
  const currencyId = form.watch("currencyId")
  const isBankSelected = bankId && bankId > 0

  // Watch accountDate, fromDate and toDate for validation
  const accountDate = form.watch("accountDate")
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

  // Enable Refresh only when mandatory filters are filled
  const isRefreshEnabled =
    !!bankId &&
    bankId > 0 &&
    !!currencyId &&
    currencyId > 0 &&
    !!parsedFromDate &&
    !!parsedToDate

  // Keep From/To Date in sync with Account Date month on load/reset/change
  React.useEffect(() => {
    if (!accountDate) return

    let accDate: Date | null = null
    if (accountDate instanceof Date) {
      accDate = isValid(accountDate) ? accountDate : null
    } else {
      accDate = parseDate(accountDate as string)
    }

    if (!accDate || !isValid(accDate)) return

    const monthStart = startOfMonth(accDate)
    const monthEnd = endOfMonth(accDate)
    form.setValue("fromDate", monthStart)
    form.setValue("toDate", monthEnd)
    form.trigger("fromDate")
    form.trigger("toDate")
  }, [accountDate, form])

  // When Account Date changes, set From/To Date to the month range of Account Date
  const handleAccountDateChange = React.useCallback(
    (date: Date | null) => {
      if (!date || !isValid(date)) return
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      form.setValue("fromDate", monthStart)
      form.setValue("toDate", monthEnd)
      form.trigger("fromDate")
      form.trigger("toDate")
    },
    [form]
  )

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
        className="grid grid-cols-8 gap-2 rounded-md p-2"
      >
        {/* Account Date */}
        <CustomDateNew
          form={form}
          name="accountDate"
          label="Account Date"
          isRequired={true}
          isFutureShow={false}
          onChangeEvent={handleAccountDateChange}
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
          buttonIcon={isBankSelected ? <Plus className="h-3 w-3" /> : undefined}
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

        {/* Debit Total / Credit Total */}
        <CustomNumberInput
          form={form}
          name="debitTotAmt"
          label="Debit Total"
          round={amtDec}
          isDisabled={true}
          className="text-right"
        />
        <CustomNumberInput
          form={form}
          name="creditTotAmt"
          label="Credit Total"
          round={amtDec}
          isDisabled={true}
          className="text-right"
        />

        {/* Allocated / Unallocated Total */}
        <CustomNumberInput
          form={form}
          name="allocTotAmt"
          label="Allocated Total"
          round={amtDec}
          isDisabled={true}
          className="text-right"
        />
        <CustomNumberInput
          form={form}
          name="unAllocTotAmt"
          label="Unallocated Total"
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
          className="col-span-1"
        />

        {/* Action buttons */}
        <div className="col-span-1 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="ml-auto"
            disabled={form.formState.isSubmitting || !isRefreshEnabled}
            onClick={async () => {
              await onRefreshAction()
            }}
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

      <AlertDialog
        open={showBankChangeConfirm}
        onOpenChange={(open) => {
          if (!open) handleCancelBankChange()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Bank?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the bank will clear all reconciliation details. You will
              need to click Refresh to load transactions for the new bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBankChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmBankChange()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  )
}
