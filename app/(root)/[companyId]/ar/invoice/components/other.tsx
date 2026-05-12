"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { IBankAddress, IBankContact } from "@/interfaces/bank"
import { ICustomerAddress, ICustomerContact } from "@/interfaces/customer"
import { IVisibleFields } from "@/interfaces/setting"
import { ISupplierAddress, ISupplierContact } from "@/interfaces/supplier"
import { ArInvoiceHdSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"
import { ARTransactionId, ModuleId } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { CountryAutocomplete } from "@/components/autocomplete"
import DynamicAddressAutocomplete, {
  EntityType as AddressEntityType,
} from "@/components/autocomplete/autocomplete-address-dynamic"
import DynamicContactAutocomplete, {
  EntityType as ContactEntityType,
} from "@/components/autocomplete/autocomplete-contact-dynamic"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"
import DocumentManager from "@/components/document-manager"

interface OtherProps {
  form: UseFormReturn<ArInvoiceHdSchemaType>
  visible?: IVisibleFields
}

export default function Other({ form, visible }: OtherProps) {
  const params = useParams()
  const companyId = params.companyId as string
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2

  const [selectedAddress, setSelectedAddress] =
    useState<ICustomerAddress | null>(null)
  const [selectedContact, setSelectedContact] =
    useState<ICustomerContact | null>(null)

  const customerId = form.getValues().customerId || 0
  const invoiceId = form.getValues("invoiceId") || "0"
  const invoiceNo = form.getValues("invoiceNo") || ""

  // other.tsx
  useEffect(() => {
    // Initialize address from form values
    const address: ICustomerAddress = {
      customerId: customerId,
      addressId: form.getValues("addressId") || 0,
      billName: form.getValues("billName") || "",
      address1: form.getValues("address1") || "",
      address2: form.getValues("address2") || "",
      address3: form.getValues("address3") || "",
      address4: form.getValues("address4") || "",
      pinCode: form.getValues("pinCode") || "",
      countryId: form.getValues("countryId") || 0,
      phoneNo: form.getValues("phoneNo") || "",
      faxNo: form.getValues("faxNo") || "",
      emailAdd: "",
      webUrl: "",
      isDefaultAdd: false,
      isDeliveryAdd: false,
      isFinAdd: false,
      isSalesAdd: false,
      isActive: true,
      createById: 0,
      createDate: new Date(),
      editById: 0,
      editDate: new Date(),
      createBy: "",
      editBy: "",
    }
    setSelectedAddress(address)

    // Initialize contact from form values
    const contact: ICustomerContact = {
      contactId: form.getValues("contactId") || 0,
      customerId: customerId,
      customerCode: "",
      customerName: "",
      contactName: form.getValues("contactName") || "",
      otherName: form.getValues("emailAdd") || "",
      mobileNo: form.getValues("mobileNo") || "",
      offNo: "",
      faxNo: "",
      emailAdd: "",
      messId: "",
      contactMessType: "",
      isDefault: false,
      isFinance: false,
      isSales: false,
      isActive: true,
      createById: 0,
      createDate: new Date(),
      editById: 0,
      editDate: new Date(),
      createBy: "",
      editBy: "",
    }
    setSelectedContact(contact)
  }, [customerId, form]) // Re-run when customerId changes

  const handleAddressSelect = (
    address: ICustomerAddress | ISupplierAddress | IBankAddress | null
  ) => {
    // Type guard to ensure we only work with supplier addresses
    const customerAddress = address as ICustomerAddress | null
    setSelectedAddress(customerAddress)
    if (customerAddress) {
      form.setValue("addressId", customerAddress.addressId)
      form.setValue("billName", customerAddress.billName || "")
      form.setValue("address1", customerAddress.address1 || "")
      form.setValue("address2", customerAddress.address2 || "")
      form.setValue("address3", customerAddress.address3 || "")
      form.setValue("address4", customerAddress.address4 || "")
      form.setValue("pinCode", customerAddress.pinCode?.toString() || "")
      form.setValue("phoneNo", customerAddress.phoneNo || "")
      form.setValue("faxNo", customerAddress.faxNo || "")
      form.setValue("countryId", customerAddress.countryId || 0)
    } else {
      form.setValue("addressId", 0)
      form.setValue("billName", "")
      form.setValue("address1", "")
      form.setValue("address2", "")
      form.setValue("address3", "")
      form.setValue("address4", "")
      form.setValue("pinCode", "")
      form.setValue("phoneNo", "")
      form.setValue("faxNo", "")
      form.setValue("countryId", 0)
    }
  }

  const handleContactSelect = (
    contact: ICustomerContact | ISupplierContact | IBankContact | null
  ) => {
    // Type guard to ensure we only work with supplier contacts
    const customerContact = contact as ICustomerContact | null
    setSelectedContact(customerContact)
    if (customerContact) {
      form.setValue("contactId", customerContact.contactId)
      form.setValue("contactName", customerContact.contactName || "")
      form.setValue("emailAdd", customerContact.otherName || "")
      form.setValue("mobileNo", customerContact.mobileNo || "")
    } else {
      form.setValue("contactId", 0)
      form.setValue("contactName", "")
      form.setValue("emailAdd", "")
      form.setValue("mobileNo", "")
    }
  }

  return (
    <div className="space-y-1 px-2 pt-2 pb-2">
      <Form {...form}>
        <div className="grid grid-cols-2 gap-1">
          {/* Address Section */}
          <Card className="gap-2 rounded-md border border-border/60 bg-card py-2 shadow-sm">
            <CardContent className="px-2 py-1">
              {customerId > 0 && (
                <div className="mb-1">
                  <DynamicAddressAutocomplete
                    form={form}
                    name="addressId"
                    label="Address"
                    entityId={customerId}
                    entityType={AddressEntityType.CUSTOMER}
                    onChangeEvent={handleAddressSelect}
                  />
                </div>
              )}
              <div className="grid">
                <CustomInput
                  form={form}
                  name="billName"
                  label="Bill Name"
                  isDisabled={!selectedAddress}
                />
                <div className="grid grid-cols-2 gap-x-1 gap-y-0">
                  <CustomTextarea
                    form={form}
                    name="address1"
                    label="Address Line 1"
                    isDisabled={!selectedAddress}
                  />
                  <CustomTextarea
                    form={form}
                    name="address2"
                    label="Address Line 2"
                    isDisabled={!selectedAddress}
                  />
                  <CustomTextarea
                    form={form}
                    name="address3"
                    label="Address Line 3"
                    isDisabled={!selectedAddress}
                  />
                  <CustomTextarea
                    form={form}
                    name="address4"
                    label="Address Line 4"
                    isDisabled={!selectedAddress}
                  />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <CountryAutocomplete
                    form={form}
                    name="countryId"
                    label="Country"
                  />
                  <CustomInput
                    form={form}
                    name="pinCode"
                    label="Pin Code"
                    isDisabled={!selectedAddress}
                  />
                  <CustomInput
                    form={form}
                    name="phoneNo"
                    label="Phone No"
                    isDisabled={!selectedAddress}
                  />
                  <CustomInput
                    form={form}
                    name="faxNo"
                    label="Fax No"
                    isDisabled={!selectedAddress}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="gap-2 rounded-md border border-border/60 bg-card py-2 shadow-sm">
            <CardContent className="px-2 py-1">
              {customerId > 0 && (
                <div className="mb-1">
                  <DynamicContactAutocomplete
                    form={form}
                    name="contactId"
                    label="Contact"
                    entityId={customerId}
                    entityType={ContactEntityType.CUSTOMER}
                    onChangeEvent={handleContactSelect}
                  />
                </div>
              )}
              <div className="grid gap-1">
                <div className="grid grid-cols-2 gap-1">
                  <CustomInput
                    form={form}
                    name="contactName"
                    label="Contact Name"
                    isDisabled={!selectedContact}
                  />
                  <CustomInput
                    form={form}
                    name="emailAdd"
                    label="Email"
                    isDisabled={!selectedAddress}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <CustomInput
                    form={form}
                    name="mobileNo"
                    label="Mobile No"
                    isDisabled={!selectedContact}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Other Information Section */}
        {(visible?.m_OtherRemarks || visible?.m_AdvRecAmt) && (
          <Card className="gap-2 rounded-md border border-border/60 bg-card py-2 shadow-sm">
            <CardContent className="px-2 py-1">
              <div className="grid grid-cols-2 gap-1">
                {visible?.m_OtherRemarks && (
                  <CustomTextarea
                    form={form}
                    name="otherRemarks"
                    label="Other Remarks"
                    isRequired={false}
                  />
                )}
                {visible?.m_AdvRecAmt && (
                  <CustomNumberInput
                    form={form}
                    name="advRecAmt"
                    label="Advance Received Amount"
                    isRequired={false}
                    round={amtDec}
                    className="text-right"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </Form>

      {/* Document Upload Section - Only show after invoice is saved */}
      {invoiceId !== "0" && (
        <DocumentManager
          moduleId={ModuleId.ar}
          transactionId={ARTransactionId.invoice}
          recordId={invoiceId}
          recordNo={invoiceNo}
          companyId={Number(companyId)}
          maxFileSize={10}
          maxFiles={10}
        />
      )}
    </div>
  )
}
