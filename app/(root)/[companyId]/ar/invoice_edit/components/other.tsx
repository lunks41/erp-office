"use client"

import { useEffect, useState } from "react"
import { ICustomerAddress, ICustomerContact } from "@/interfaces/customer"
import { ArInvoiceHdSchemaType } from "@/schemas/invoice"
import { UseFormReturn } from "react-hook-form"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import {
  AddressAutocomplete,
  ContactAutocomplete,
  CountryAutocomplete,
} from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomTextarea from "@/components/custom/custom-textarea"

import DocumentUpload from "./other/document-upload"

interface OtherProps {
  form: UseFormReturn<ArInvoiceHdSchemaType>
}

export default function Other({ form }: OtherProps) {
  const [selectedAddress, setSelectedAddress] =
    useState<ICustomerAddress | null>(null)
  const [selectedContact, setSelectedContact] =
    useState<ICustomerContact | null>(null)

  const customerId = form.getValues().customerId || 0

  // other.tsx
  useEffect(() => {
    // Initialize address from form values
    const address: ICustomerAddress = {
      billName: "",
      customerId: customerId,
      addressId: form.getValues("addressId") || 0,
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

  const handleAddressSelect = (address: ICustomerAddress | null) => {
    setSelectedAddress(address)
    if (address) {
      form.setValue("addressId", address.addressId)
      form.setValue("address1", address.address1 || "")
      form.setValue("address2", address.address2 || "")
      form.setValue("address3", address.address3 || "")
      form.setValue("address4", address.address4 || "")
      form.setValue("pinCode", address.pinCode?.toString() || "")
      form.setValue("phoneNo", address.phoneNo || "")
      form.setValue("faxNo", address.faxNo || "")
      form.setValue("countryId", address.countryId || 0)
    } else {
      form.setValue("addressId", 0)
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

  const handleContactSelect = (contact: ICustomerContact | null) => {
    setSelectedContact(contact)
    if (contact) {
      form.setValue("contactId", contact.contactId)
      form.setValue("contactName", contact.contactName || "")
      form.setValue("emailAdd", contact.otherName || "")
      form.setValue("mobileNo", contact.mobileNo || "")
    } else {
      form.setValue("contactId", 0)
      form.setValue("contactName", "")
      form.setValue("emailAdd", "")
      form.setValue("mobileNo", "")
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Address & Contact Information</h1>

      <Form {...form}>
        <div className="grid grid-cols-2 gap-2">
          {/* Address Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1">
                {customerId > 0 && (
                  <AddressAutocomplete
                    form={form}
                    name="addressId"
                    label="Address"
                    customerId={customerId}
                    onChangeEvent={handleAddressSelect}
                  />
                )}
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2">
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
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                <div className="grid grid-cols-4 gap-2">
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
                <div className="grid grid-cols-2 gap-2"></div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {customerId > 0 && (
                  <ContactAutocomplete
                    form={form}
                    name="contactId"
                    label="Contact"
                    customerId={customerId}
                    onChangeEvent={handleContactSelect}
                  />
                )}
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2">
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
                <div className="grid grid-cols-2 gap-2">
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
      </Form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload />
        </CardContent>
      </Card>
    </div>
  )
}
