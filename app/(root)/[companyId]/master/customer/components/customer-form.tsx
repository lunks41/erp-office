"use client"

import { useEffect } from "react"
import { ICustomer } from "@/interfaces/customer"
import { customerSchema } from "@/schemas/customer"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Form } from "@/components/ui/form"
import {
  AccountSetupAutocomplete,
  BankAutocomplete,
  CreditTermAutocomplete,
  CurrencyAutocomplete,
} from "@/components/autocomplete"
import {
  default as CustomerAutocomplete,
  default as SupplierAutocomplete,
} from "@/components/autocomplete/autocomplete-customer"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomCheckbox from "@/components/custom/custom-checkbox"
import CustomInput from "@/components/custom/custom-input"
import CustomTextarea from "@/components/custom/custom-textarea"
import CustomerCodeLookupInput from "@/components/lookup/customer-code-lookup-input"

interface CustomerFormProps {
  initialData?: ICustomer | null
  onSaveAction: (customer: ICustomer) => void
  onCustomerLookup?: (customerCode: string, customerName: string) => void
}

const emptyCustomerFormValues: z.infer<typeof customerSchema> = {
  customerId: 0,
  customerCode: "",
  customerName: "",
  customerOtherName: "",
  customerShortName: "",
  customerRegNo: "",
  currencyId: 0,
  bankId: 0,
  creditTermId: 0,
  parentCustomerId: 0,
  accSetupId: 0,
  supplierId: 0,
  isCustomer: true,
  isVendor: false,
  isTrader: false,
  isSupplier: false,
  isCredit: false,
  peppolId: "",
  remarks: "",
  isActive: true,
}

export default function CustomerForm({
  initialData,
  onSaveAction,
  onCustomerLookup,
}: CustomerFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          peppolId: initialData.peppolId ?? "",
        }
      : emptyCustomerFormValues,
  })

  // Remove the watch effect since we'll use onBlurEvent instead
  useEffect(() => {
    form.reset(
      initialData
        ? { ...initialData, peppolId: initialData.peppolId ?? "" }
        : emptyCustomerFormValues
    )
  }, [initialData, form])

  const onSubmit = (data: z.infer<typeof customerSchema>) => {
    // Convert string values to numbers for numeric fields
    const processedData = {
      ...data,
      customerId: Number(data.customerId),
      currencyId: Number(data.currencyId),
      bankId: Number(data.bankId),
      creditTermId: Number(data.creditTermId),
      parentCustomerId: Number(data.parentCustomerId),
      accSetupId: Number(data.accSetupId),
      supplierId: Number(data.supplierId),
      peppolId: data.peppolId?.trim() || "",
    }
    console.log("processedData :", processedData)
    onSaveAction(processedData as ICustomer)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-6 gap-2">
              <CustomerCodeLookupInput
                form={form}
                name="customerCode"
                label="Customer Code"
                isRequired
                isDisabled={
                  initialData?.customerId ? initialData.customerId > 0 : false
                }
                onSelect={(customerCode) => {
                  if (customerCode && onCustomerLookup) {
                    onCustomerLookup(customerCode, "0")
                  }
                }}
              />
              <CustomInput
                form={form}
                name="customerName"
                label="Customer Name"
                isRequired
                onBlurEvent={() => {
                  const customerName = form.getValues("customerName")
                  if (customerName && onCustomerLookup) {
                    onCustomerLookup("0", customerName)
                  }
                }}
              />

              <CustomInput
                form={form}
                name="customerOtherName"
                label="Other Name"
              />
              <CustomInput
                form={form}
                name="customerShortName"
                label="Short Name"
              />

              <CustomInput
                form={form}
                name="customerRegNo"
                label="Registration No (TRN)"
              />
              <BankAutocomplete
                form={form}
                name="bankId"
                label="Bank"
                isRequired={true}
              />
            </div>
            <div className="grid grid-cols-6 gap-2">
              {/* Currency */}
              <CurrencyAutocomplete
                form={form}
                name="currencyId"
                label="Currency"
                isRequired={true}
              />

              <CreditTermAutocomplete
                form={form}
                name="creditTermId"
                label="Credit Term"
                onChangeEvent={(selectedCreditTerm) => {
                  // Handle the selected credit term
                  console.log("selectedCreditTerm : ", selectedCreditTerm)
                }}
                isRequired={true}
              />
              <CustomerAutocomplete
                form={form}
                name="parentCustomerId"
                label="Parent Customer"
              />

              <AccountSetupAutocomplete
                form={form}
                name="accSetupId"
                label="Account Setup"
                isRequired={true}
              />

              <SupplierAutocomplete
                form={form}
                name="customerId"
                label="Supplier"
              />
              <CustomInput
                form={form}
                name="peppolId"
                label="Peppol ID"
                placeholder="e.g. scheme:identifier"
              />
            </div>
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-6">
                <CustomTextarea form={form} name="remarks" label="Remarks" />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              <CustomCheckbox
                form={form}
                name="isCustomer"
                label="Is Customer"
              />
              <CustomCheckbox form={form} name="isVendor" label="Is Vendor" />

              <CustomCheckbox form={form} name="isTrader" label="Is Trader" />
              <CustomCheckbox
                form={form}
                name="isSupplier"
                label="Is Supplier"
              />
              <CustomCheckbox form={form} name="isCredit" label="Is Credit" />
              <CustomCheckbox
                form={form}
                name="isActive"
                label="Active Status"
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
            id="customer-form-submit"
            className="hidden"
            aria-hidden="true"
          />
        </form>
      </Form>
    </div>
  )
}
