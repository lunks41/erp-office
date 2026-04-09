"use client"

import { useEffect } from "react"
import { ICustomerContact } from "@/interfaces/customer"
import {
  CustomerContactSchemaType,
  customerContactSchema,
} from "@/schemas/customer"
import { useAuthStore } from "@/stores/auth-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"

// Default values for the contact form
const defaultContactSchemaType: CustomerContactSchemaType = {
  customerId: 0,
  contactId: 0,
  contactName: "",
  otherName: "",
  mobileNo: "",
  offNo: "",
  faxNo: "",
  emailAdd: "",
  isActive: true,
  isSales: false,
  isFinance: false,
  isDefault: false,
  messId: "",
  contactMessType: "",
}

interface CustomerContactFormProps {
  initialData?: ICustomerContact
  customerId?: number
  submitAction: (data: CustomerContactSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
}

export function CustomerContactForm({
  initialData,
  customerId,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: CustomerContactFormProps) {
  const { decimals } = useAuthStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  // Validate that customerId is provided and valid
  if (!customerId || customerId <= 0) {
    throw new Error("Valid customerId is required for contact form")
  }
  const form = useForm<CustomerContactSchemaType>({
    resolver: zodResolver(customerContactSchema),
    defaultValues: initialData
      ? {
          customerId: initialData.customerId ?? customerId,
          contactId: initialData.contactId ?? 0,
          contactName: initialData.contactName ?? "",
          otherName: initialData.otherName ?? "",
          mobileNo: initialData.mobileNo ?? "",
          offNo: initialData.offNo ?? "",
          faxNo: initialData.faxNo ?? "",
          emailAdd: initialData.emailAdd ?? "",
          isActive: initialData.isActive ?? true,
          isSales: initialData.isSales ?? false,
          isFinance: initialData.isFinance ?? false,
          isDefault: initialData.isDefault ?? false,
          messId: initialData.messId ?? "",
          contactMessType: initialData.contactMessType ?? "",
        }
      : {
          ...defaultContactSchemaType,
          customerId: customerId,
        },
  })

  const onSubmit = (data: CustomerContactSchemaType) => {
    console.log("Form submitted with data:", data)
    console.log("Form validation errors:", form.formState.errors)

    // Process and handle null values according to CustomerContactSchemaType schema
    const contactData = {
      ...data,
      // Convert numeric fields
      customerId: data.customerId ? Number(data.customerId) : customerId,
      contactId: data.contactId ? Number(data.contactId) : 0,

      // Handle string fields
      contactName: data.contactName || "",
      otherName: data.otherName || "",
      mobileNo: data.mobileNo || "",
      offNo: data.offNo || "",
      faxNo: data.faxNo || "",
      emailAdd: data.emailAdd || "",
      messId: data.messId || "",
      contactMessType: data.contactMessType || "",

      // Boolean fields
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
      isFinance: data.isFinance ?? false,
      isSales: data.isSales ?? false,
    }
    console.log("Processed contact data:", contactData)
    console.log("Calling submitAction...")
    submitAction(contactData)
  }

  useEffect(() => {
    form.reset(
      initialData
        ? {
            customerId: initialData.customerId ?? customerId,
            contactId: initialData.contactId ?? 0,
            contactName: initialData.contactName ?? "",
            otherName: initialData.otherName ?? "",
            mobileNo: initialData.mobileNo ?? "",
            offNo: initialData.offNo ?? "",
            faxNo: initialData.faxNo ?? "",
            emailAdd: initialData.emailAdd ?? "",
            isActive: initialData.isActive ?? true,
            isSales: initialData.isSales ?? false,
            isFinance: initialData.isFinance ?? false,
            isDefault: initialData.isDefault ?? false,
            messId: initialData.messId ?? "",
            contactMessType: initialData.contactMessType ?? "",
          }
        : {
            ...defaultContactSchemaType,
            customerId: customerId,
          }
    )
  }, [initialData, customerId, form])

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation failed:", errors)
          })}
          className="space-y-2"
        >
          <div className="grid gap-2">
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                name="contactName"
                label="Contact Name"
                isRequired
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="otherName"
                label="Other Name"
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="mobileNo"
                label="Mobile Number"
                isDisabled={isReadOnly}
              />

              <CustomInput
                form={form}
                name="offNo"
                label="Office Number"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="faxNo"
                label="Fax Number"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="emailAdd"
                label="Email Address"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="messId"
                label="MessId"
                isDisabled={isReadOnly}
              />
              <CustomInput
                form={form}
                name="contactMessType"
                label="Contact Mess Type"
                isDisabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <CustomSwitch
                form={form}
                name="isActive"
                label="Active Status"
                activeColor="success"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isDefault"
                label="Default Contact"
                activeColor="success"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isSales"
                label="Sales Contact"
                activeColor="success"
                isDisabled={isReadOnly}
              />
              <CustomSwitch
                form={form}
                name="isFinance"
                label="Finance Contact"
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
