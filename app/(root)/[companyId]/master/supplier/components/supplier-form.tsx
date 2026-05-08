"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ISupplier } from "@/interfaces/supplier"
import { supplierSchema } from "@/schemas/supplier"
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
} from "@/components/autocomplete/autocomplete-supplier"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"
import SupplierCodeLookupInput from "@/components/lookup/supplier-code-lookup-input"

interface SupplierFormProps {
  initialData?: ISupplier | null
  onSaveAction: (supplier: ISupplier) => void
  onSupplierLookup?: (supplierCode: string, supplierName: string) => void
}

const emptySupplierFormValues: z.infer<typeof supplierSchema> = {
  supplierId: 0,
  supplierCode: "",
  supplierName: "",
  supplierOtherName: "",
  supplierShortName: "",
  supplierRegNo: "",
  currencyId: 0,
  bankId: 0,
  creditTermId: 0,
  parentSupplierId: 0,
  accSetupId: 0,
  customerId: 0,
  isCustomer: false,
  isVendor: false,
  isTrader: false,
  isSupplier: true,
  isDiffGstGl: false,
  peppolId: "",
  remarks: "",
  isActive: true,
}

export default function SupplierForm({
  initialData,
  onSaveAction,
  onSupplierLookup,
}: SupplierFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          peppolId: initialData.peppolId ?? "",
        }
      : emptySupplierFormValues,
  })

  // Remove the watch effect since we'll use onBlurEvent instead
  useEffect(() => {
    form.reset(
      initialData
        ? { ...initialData, peppolId: initialData.peppolId ?? "" }
        : emptySupplierFormValues
    )
  }, [initialData, form])

  const onSubmit = (data: z.infer<typeof supplierSchema>) => {
    // Convert string values to numbers for numeric fields
    const processedData = {
      ...data,
      supplierId: Number(data.supplierId),
      currencyId: Number(data.currencyId),
      bankId: Number(data.bankId),
      creditTermId: Number(data.creditTermId),
      parentSupplierId: Number(data.parentSupplierId),
      accSetupId: Number(data.accSetupId),
      customerId: Number(data.customerId),
      peppolId: data.peppolId?.trim() || "",
    }
    console.log("processedData :", processedData)
    onSaveAction(processedData as ISupplier)
  }

  return (
    <div className="max-w flex flex-col gap-0">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <div className="grid gap-2">
            <div className="grid grid-cols-6 gap-2">
              <SupplierCodeLookupInput
                form={form}
                name="supplierCode"
                label="Supplier Code"
                isRequired
                isDisabled={
                  initialData?.supplierId ? initialData.supplierId > 0 : false
                }
                onSelect={(supplierCode) => {
                  if (supplierCode && onSupplierLookup) {
                    onSupplierLookup(supplierCode, "0")
                  }
                }}
              />
              <CustomInput
                form={form}
                name="supplierName"
                label="Supplier Name"
                isRequired
                onBlurEvent={() => {
                  const supplierName = form.getValues("supplierName")
                  if (supplierName && onSupplierLookup) {
                    onSupplierLookup("0", supplierName)
                  }
                }}
              />

              <CustomInput
                form={form}
                name="supplierOtherName"
                label="Other Name"
              />
              <CustomInput
                form={form}
                name="supplierShortName"
                label="Short Name"
              />

              <CustomInput
                form={form}
                name="supplierRegNo"
                label="Supplier Reg No (TRN No.)"
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
              <SupplierAutocomplete
                form={form}
                name="parentSupplierId"
                label="Parent Supplier"
              />

              <AccountSetupAutocomplete
                form={form}
                name="accSetupId"
                label="Account Setup"
                isRequired={true}
              />

              <CustomerAutocomplete
                form={form}
                name="customerId"
                label="Customer"
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
              <CustomSwitch
                form={form}
                name="isCustomer"
                label="Is Customer"
                activeColor="success"
              />
              <CustomSwitch
                form={form}
                name="isVendor"
                label="Is Vendor"
                activeColor="success"
              />

              <CustomSwitch
                form={form}
                name="isTrader"
                label="Is Trader"
                activeColor="success"
              />
              <CustomSwitch
                form={form}
                name="isSupplier"
                label="Is Supplier"
                activeColor="success"
              />
              <CustomSwitch
                form={form}
                name="isDiffGstGl"
                label="Diff VAT GL"
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
            id="supplier-form-submit"
            className="hidden"
            aria-hidden="true"
          />
        </form>
      </Form>
    </div>
  )
}
