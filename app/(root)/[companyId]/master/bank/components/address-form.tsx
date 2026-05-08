"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { IBankAddress } from "@/interfaces/bank"
import { BankAddressSchemaType, bankAddressSchema } from "@/schemas/bank"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import { CountryAutocomplete } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"
import CustomTextarea from "@/components/custom/custom-textarea"

// Default values for the address form
const defaultAddressSchemaType: BankAddressSchemaType = {
  bankId: 0,
  addressId: 0,
  address1: "",
  address2: "",
  address3: "",
  address4: "",
  pinCode: "",
  countryId: 0,
  phoneNo: "",
  faxNo: "",
  emailAdd: "",
  webUrl: "",
  isActive: true,
  isDefaultAdd: false,
  isDeliveryAdd: false,
  isFinAdd: false,
  isSalesAdd: false,
}

interface BankAddressFormProps {
  initialData?: IBankAddress
  bankId?: number
  submitAction: (data: BankAddressSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
}

export function BankAddressForm({
  initialData,
  bankId,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: BankAddressFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const form = useForm<BankAddressSchemaType>({
    resolver: zodResolver(bankAddressSchema),
    defaultValues: initialData
      ? { ...initialData }
      : {
          ...defaultAddressSchemaType,
          bankId: bankId || 0,
        },
  })

  const onSubmit = (data: BankAddressSchemaType) => {
    // Process the form data according to BankAddressSchemaType schema
    const addressData = {
      ...data,
      // Convert numeric fields and handle null values
      bankId: data.bankId ? Number(data.bankId) : 0,
      addressId: data.addressId ? Number(data.addressId) : 0,
      countryId: data.countryId ? Number(data.countryId) : 0,

      // Handle string fields
      address1: data.address1 || "",
      address2: data.address2 || "",
      address3: data.address3 || "",
      address4: data.address4 || "",
      pinCode: data.pinCode ?? "",
      phoneNo: data.phoneNo || "",
      faxNo: data.faxNo || "",
      emailAdd: data.emailAdd || "",
      webUrl: data.webUrl || "",

      // Boolean fields
      isActive: data.isActive ?? true,
      isDefaultAdd: data.isDefaultAdd ?? false,
      isDeliveryAdd: data.isDeliveryAdd ?? false,
      isFinAdd: data.isFinAdd ?? false,
      isSalesAdd: data.isSalesAdd ?? false,
    }

    console.log("Address data:", addressData)
    submitAction(addressData)
  }

  useEffect(() => {
    form.reset(
      initialData || {
        bankId: 0,
        addressId: 0,
        address1: "",
        address2: "",
        address3: "",
        address4: "",
        pinCode: "",
        countryId: 0,
        phoneNo: "",
        faxNo: "",
        emailAdd: "",
        webUrl: "",
        isActive: true,
        isDefaultAdd: false,
        isDeliveryAdd: false,
        isFinAdd: false,
        isSalesAdd: false,
      }
    )
  }, [initialData, form])

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <CustomTextarea
                form={form}
                name="address1"
                label="Address Line 1"
                isDisabled={isReadOnly}
              />

              <CustomTextarea
                form={form}
                name="address2"
                label="Address Line 2"
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CustomTextarea
                form={form}
                name="address3"
                label="Address Line 3"
                isDisabled={isReadOnly}
              />

              <CustomTextarea
                form={form}
                name="address4"
                label="Address Line 4"
                isDisabled={isReadOnly}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <CustomInput
                form={form}
                name="pinCode"
                label="PIN Code"
                isDisabled={isReadOnly}
              />
              <CountryAutocomplete
                form={form}
                name="countryId"
                label="Country"
                isRequired={true}
              />

              <CustomInput
                form={form}
                name="phoneNo"
                label="Phone Number"
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="emailAdd"
                label="Email Address"
                isDisabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-6 gap-2">
              <CustomSwitch
                form={form}
                name="isActive"
                label="Active Status"
                activeColor="success"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isDefaultAdd"
                label="Default Address"
                activeColor="success"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isDeliveryAdd"
                label="Delivery Address"
                activeColor="success"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isFinAdd"
                label="Finance Address"
                activeColor="success"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isSalesAdd"
                label="Sales Address"
                activeColor="success"
                isDisabled={isReadOnly}
              />
            </div>

                        <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={onCancelAction}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : initialData ? "Edit" : "Add"}
                </Button>
              )}
            </div>

            {/* Audit Information Section */}
            <AuditTrailAccordion createBy={initialData?.createBy} createDate={initialData?.createDate} editBy={initialData?.editBy} editDate={initialData?.editDate} datetimeFormat={datetimeFormat} />
          </div>
        </form>
      </Form>
    </div>
  )
}
