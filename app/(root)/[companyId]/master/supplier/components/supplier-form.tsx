"use client"

import { useEffect } from "react"
import { ISupplier } from "@/interfaces/supplier"
import { supplierSchema } from "@/schemas/supplier"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
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
import SupplierCodeLookupInput from "@/components/lookup/supplier-code-lookup-input"
import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

interface SupplierFormProps {
  initialData?: ISupplier | null
  onSaveAction: (supplier: ISupplier) => void
  onSupplierLookup?: (supplierCode: string, supplierName: string) => void
}

export default function SupplierForm({
  initialData,
  onSaveAction,
  onSupplierLookup,
}: SupplierFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues:
      initialData ||
      ({
        supplierId: 0,
        companyId: 0,
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
        remarks: "",
        isActive: true,
      } as z.infer<typeof supplierSchema>),
  })

  // Remove the watch effect since we'll use onBlurEvent instead
  useEffect(() => {
    form.reset(
      initialData || {
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
        remarks: "",
        isActive: true,
      }
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
    }
    console.log("processedData :", processedData)
    onSaveAction(processedData as ISupplier)
  }

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
              <CustomTextarea form={form} name="remarks" label="Remarks" />
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
            {initialData &&
              (initialData.createBy ||
                initialData.createDate ||
                initialData.editBy ||
                initialData.editDate) && (
                <div className="space-y-2">
                  <div className="border-border border-b pb-4"></div>

                  <CustomAccordion
                    type="single"
                    collapsible
                    className="border-border bg-muted/50 rounded-lg border"
                  >
                    <CustomAccordionItem
                      value="audit-info"
                      className="border-none"
                    >
                      <CustomAccordionTrigger className="hover:bg-muted rounded-lg px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">View Audit Trail</span>
                          <Badge variant="secondary" className="text-xs">
                            {initialData.createDate ? "Created" : ""}
                            {initialData.editDate ? " • Modified" : ""}
                          </Badge>
                        </div>
                      </CustomAccordionTrigger>
                      <CustomAccordionContent className="px-6 pb-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          {initialData.createDate && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-foreground text-sm font-medium">
                                  Created By
                                </span>
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {initialData.createBy}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {format(
                                  new Date(initialData.createDate),
                                  datetimeFormat
                                )}
                              </div>
                            </div>
                          )}
                          {initialData.editBy && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-foreground text-sm font-medium">
                                  Last Modified By
                                </span>
                                <Badge
                                  variant="outline"
                                  className="font-normal"
                                >
                                  {initialData.editBy}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {initialData.editDate
                                  ? format(
                                      new Date(initialData.editDate),
                                      datetimeFormat
                                    )
                                  : "-"}
                              </div>
                            </div>
                          )}
                        </div>
                      </CustomAccordionContent>
                    </CustomAccordionItem>
                  </CustomAccordion>
                </div>
              )}
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
