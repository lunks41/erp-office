"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect } from "react"
import { ISupplierContact } from "@/interfaces/supplier"
import {
  SupplierContactSchemaType,
  supplierContactSchema,
} from "@/schemas/supplier"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuditTrailAccordion } from "@/components/common/audit-trail-accordion"
import CustomInput from "@/components/custom/custom-input"
import CustomSwitch from "@/components/custom/custom-switch"

// Default values for the contact form
const defaultContactSchemaType: SupplierContactSchemaType = {
  supplierId: 0,
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

interface SupplierContactFormProps {
  initialData?: ISupplierContact
  supplierId?: number
  submitAction: (data: SupplierContactSchemaType) => void
  onCancelAction?: () => void
  isSubmitting?: boolean
  isReadOnly?: boolean
}

export function SupplierContactForm({
  initialData,
  supplierId,
  submitAction,
  onCancelAction,
  isSubmitting = false,
  isReadOnly = false,
}: SupplierContactFormProps) {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"
  const form = useForm<SupplierContactSchemaType>({
    resolver: zodResolver(supplierContactSchema),
    defaultValues: initialData
      ? { ...initialData }
      : {
          ...defaultContactSchemaType,
          supplierId: supplierId || 0,
        },
  })

  const onSubmit = (data: SupplierContactSchemaType) => {
    // Process and handle null values according to SupplierContactSchemaType schema
    const contactData = {
      ...data,
      // Convert numeric fields
      supplierId: data.supplierId ? Number(data.supplierId) : 0,
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
    console.log("Contact data:", contactData)
    submitAction(contactData)
  }

  useEffect(() => {
    form.reset(
      initialData || {
        supplierId: 0,
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
    )
  }, [initialData, form])

  return (
    <div className="max-w flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
