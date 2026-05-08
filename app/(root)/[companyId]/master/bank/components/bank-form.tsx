"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IBank } from "@/interfaces/bank"
import { bankSchema } from "@/schemas/bank"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/ui/form"
import {
  ChartOfAccountAutocomplete,
  CurrencyAutocomplete,
} from "@/components/autocomplete"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface BankFormProps {
  initialData?: IBank | null
  submitAction: (bank: IBank) => void
  onBankLookup?: (bankCode: string, bankName: string) => void
  companyId?: number
}

export default function BankForm({
  initialData,
  submitAction,
  onBankLookup,
  companyId,
}: BankFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<z.infer<typeof bankSchema>>({
    resolver: zodResolver(bankSchema),
    defaultValues:
      initialData ||
      ({
        bankId: 0,
        companyId: 0,
        bankCode: "",
        bankName: "",
        currencyId: 0,
        accountNo: "",
        swiftCode: "",
        iban: "",
        remarks1: "",
        remarks2: "",
        remarks3: "",
        glId: 0,
        isOwnBank: false,
        isPettyCashBank: false,
        isActive: true,
      } as z.infer<typeof bankSchema>),
  })

  // Remove the watch effect since we'll use onBlurEvent instead
  useEffect(() => {
    form.reset(
      initialData || {
        bankId: 0,
        bankCode: "",
        bankName: "",
        currencyId: 0,
        accountNo: "",
        swiftCode: "",
        iban: "",
        remarks1: "",
        remarks2: "",
        remarks3: "",
        glId: 0,
        isOwnBank: false,
        isPettyCashBank: false,
        isActive: true,
      }
    )
  }, [initialData, form])

  const onSubmit = (data: z.infer<typeof bankSchema>) => {
    // Convert string values to numbers for numeric fields
    const processedData = {
      ...data,
      bankId: Number(data.bankId),
      currencyId: Number(data.currencyId),
      glId: Number(data.glId),
    }
    console.log("processedData :", processedData)
    submitAction(processedData as IBank)
  }

  return (
    <div className="max-w flex flex-col gap-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <div className="grid gap-2">
            <div className="grid grid-cols-6 gap-2">
              <CustomInput
                form={form}
                name="bankCode"
                label="Bank Code"
                isRequired
                isDisabled={
                  initialData?.bankId ? initialData.bankId > 0 : false
                }
                onBlurEvent={() => {
                  const bankCode = form.getValues("bankCode")
                  if (bankCode && onBankLookup) {
                    onBankLookup(bankCode, "0")
                  }
                }}
              />
              <CustomInput
                form={form}
                name="bankName"
                label="Bank Name"
                isRequired
                onBlurEvent={() => {
                  const bankName = form.getValues("bankName")
                  if (bankName && onBankLookup) {
                    onBankLookup("0", bankName)
                  }
                }}
              />

              {/* Currency */}
              <CurrencyAutocomplete
                form={form}
                name="currencyId"
                label="Currency"
                isRequired={true}
              />
              {/* Chart of Account */}
              <ChartOfAccountAutocomplete
                form={form}
                name="glId"
                label="Chart of Account"
                isRequired={true}
                companyId={Number(companyId)}
              />

              <CustomInput form={form} name="accountNo" label="Account No" />
              <CustomInput form={form} name="swiftCode" label="Swift Code" />
              <CustomInput form={form} name="iban" label="IBAN" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CustomTextarea form={form} name="remarks1" label="Remarks 1" />
              <CustomTextarea form={form} name="remarks2" label="Remarks 2" />
              <CustomTextarea form={form} name="remarks3" label="Remarks 3" />
            </div>

            <div className="grid grid-cols-6 gap-2">
              <CustomSwitch
                form={form}
                name="isOwnBank"
                label="Is Own Bank"
                activeColor="success"
              />
              <CustomSwitch
                form={form}
                name="isPettyCashBank"
                label="Is Petty Cash Bank"
                activeColor="success"
              />

              <CustomSwitch
                form={form}
                name="isActive"
                label="Active Status"
                activeColor="success"
              />
            </div>

            {/* Audit Information Section */}
            <AuditTrailAccordion
              createBy={initialData?.createBy}
              createDate={initialData?.createDate}
              editBy={initialData?.editBy}
              editDate={initialData?.editDate}
              datetimeFormat={datetimeFormat}
            />
          </div>

          {/* Hidden submit button for external trigger */}
          <button
            type="submit"
            id="bank-form-submit"
            className="hidden"
            aria-hidden="true"
          />
        </form>
      </Form>
    </div>
  )
}
