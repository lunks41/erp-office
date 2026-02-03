import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import * as z from "zod"

export const ArDebitNoteHdSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields

    debitNoteId: z.string().optional(),
    debitNoteNo: z.string().optional(),
    suppDebitNoteNo: required?.m_SuppInvoiceNo
      ? z.string().min(1, "Supplier Credit Note No is required")
      : z.string().optional(),
    referenceNo: required?.m_ReferenceNo
      ? z.string().min(1, "Reference No is required")
      : z.string().optional(),
    trnDate: visible?.m_TrnDate
      ? z.union([z.date(), z.string()])
      : z.union([z.date(), z.string()]).optional(),
    accountDate: z.union([z.date(), z.string()]),
    deliveryDate:
      required?.m_DeliveryDate && visible?.m_DeliveryDate
        ? z.union([z.date(), z.string()])
        : z.union([z.date(), z.string()]).optional(),
    dueDate: z.union([z.date(), z.string()]),
    customerId: z.number().min(1, "Customer is required"),

    // Currency Fields
    currencyId: z.number().min(1, "Currency is required"),
    exhRate: z.number().min(0.000001, "Exchange Rate must be greater than 0"),
    ctyExhRate: z
      .number()
      .min(0.0, "Country Exchange Rate must be greater than 0"),

    // Credit Terms
    creditTermId: z.number().min(1, "Credit Term is required"),

    // Bank Fields
    bankId:
      required?.m_BankId && visible?.m_BankId
        ? z.number().min(1, "Bank is required")
        : z.number().optional(),
    // Invoice Fields
    invoiceId: z.string().optional(),
    invoiceNo: z.string().optional(),

    // Amounts
    totAmt: required?.m_TotAmt ? z.number().min(0) : z.number().optional(),
    totLocalAmt: z.number().optional(),
    totCtyAmt: visible?.m_CtyCurr ? z.number().min(0) : z.number().optional(),
    gstClaimDate: visible?.m_GstClaimDate
      ? z.union([z.date(), z.string()])
      : z.union([z.date(), z.string()]).optional(),
    gstAmt: z.number().optional(),
    gstLocalAmt: z.number().optional(),
    gstCtyAmt: visible?.m_CtyCurr ? z.number().min(0) : z.number().optional(),
    totAmtAftGst: z.number().optional(),
    totLocalAmtAftGst: z.number().optional(),
    totCtyAmtAftGst: visible?.m_CtyCurr
      ? z.number().min(0)
      : z.number().optional(),
    balAmt: z.number().optional(),
    balLocalAmt: z.number().optional(),
    payAmt: z.number().optional(),
    payLocalAmt: z.number().optional(),
    exGainLoss: z.number().optional(),

    // Order Details
    salesOrderId: z.union([z.string(), z.number()]).optional(),
    salesOrderNo: z.string().optional(),
    operationId: z.union([z.string(), z.number()]).optional(),
    operationNo: z.string().optional(),
    remarks: required?.m_Remarks_Hd
      ? z.string().min(3, "Remarks must be at least 3 characters")
      : z.string().optional(),

    // Address and Contact
    addressId: z.number().optional(),
    contactId: z.number().optional(),
    address1: required?.m_Address1
      ? z.string().min(1, "Address 1 is required")
      : z.string().optional(),
    address2: required?.m_Address2
      ? z.string().min(1, "Address 2 is required")
      : z.string().optional(),
    address3: required?.m_Address3
      ? z.string().min(1, "Address 3 is required")
      : z.string().optional(),
    address4: required?.m_Address4
      ? z.string().min(1, "Address 4 is required")
      : z.string().optional(),
    pinCode: required?.m_PinCode
      ? z.string().min(1, "Pin Code is required")
      : z.string().optional(),
    countryId: required?.m_CountryId
      ? z.number().min(1, "Country is required")
      : z.number().optional(),
    phoneNo: required?.m_PhoneNo
      ? z.string().min(9, "Phone No must be at least 9 characters")
      : z.string().optional(),
    faxNo: z.string().optional(),
    contactName: required?.m_ContactName
      ? z.string().min(1, "Contact Name is required")
      : z.string().optional(),
    mobileNo: required?.m_MobileNo
      ? z.string().min(9, "Mobile No must be at least 9 characters")
      : z.string().optional(),
    emailAdd: required?.m_EmailAdd
      ? z.string().email("Invalid email address").optional()
      : z.string().optional(),

    // Customer Details
    moduleFrom: z.string().optional(),

    supplierName: z.string().optional(),
    apDebitNoteId: z.string().optional(),
    apDebitNoteNo: z.string().optional(),
    editVersion: z.number().optional(),
    createBy: z.string().optional(),
    createDate: z.string().optional(),
    editBy: z.string().optional(),
    editDate: z.string().optional(),
    cancelBy: z.string().optional(),
    cancelDate: z.string().optional(),
    isCancel: z.boolean().optional(),
    cancelRemarks: z.string().optional(),

    // Job Order Fields
    jobOrderId: z.number().optional(),
    jobOrderNo: z.string().optional(),

    // Vessel Fields
    vesselId: z.number().optional(),

    // Port Fields
    portId: z.number().optional(),

    // Nested Details
    data_details: z
      .array(ArDebitNoteDtSchema(required, visible))
      .min(1, "At least one invoice detail is required"),
  })
}

export type ArDebitNoteHdSchemaType = z.infer<
  ReturnType<typeof ArDebitNoteHdSchema>
>

export const ArDebitNoteHdFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ArDebitNoteHdFiltersValues = z.infer<
  typeof ArDebitNoteHdFiltersSchema
>

export const ArDebitNoteDtSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields
    debitNoteId: z.string().optional(),
    debitNoteNo: z.string().optional(),
    itemNo: z.number().min(1, "Item No must be at least 1"),
    seqNo: z.number().min(1, "Sequence No must be at least 1"),
    docItemNo: z.number(),

    // Product Fields
    productId:
      required?.m_ProductId && visible?.m_ProductId
        ? z.number().min(1, "Product is required")
        : z.number().optional(),
    productCode: z.string().optional(),
    productName: z.string().optional(),

    // GL Fields
    glId: required?.m_GLId
      ? z.number().min(1, "Chart of Account is required")
      : z.number().optional(),
    glCode: z.string().optional(),
    glName: z.string().optional(),

    // Quantity and UOM
    qty:
      required?.m_QTY && visible?.m_QTY
        ? z.number().min(0)
        : z.number().optional(),
    billQTY: visible?.m_BillQTY ? z.number().min(0) : z.number().optional(),
    uomId:
      required?.m_UomId && visible?.m_UomId
        ? z.number().min(1, "UOM is required")
        : z.number().optional(),
    uomCode: z.string().optional(),
    uomName: z.string().optional(),

    // Pricing
    unitPrice:
      required?.m_UnitPrice && visible?.m_UnitPrice
        ? z.number().min(0)
        : z.number().optional(),
    totAmt: required?.m_TotAmt ? z.number() : z.number().optional(),
    totLocalAmt: z.number(),
    totCtyAmt: visible?.m_CtyCurr ? z.number() : z.number().optional(),

    // Remarks
    remarks:
      required?.m_Remarks && visible?.m_Remarks
        ? z.string().min(1, "Remarks is required")
        : z.string().optional(),

    // GST Fields
    gstId:
      required?.m_GstId && visible?.m_GstId
        ? z.number().min(1, "VAT is required")
        : z.number().optional(),
    gstName: z.string().optional(),
    gstPercentage: visible?.m_GstId ? z.number().min(0) : z.number().optional(),
    gstAmt: visible?.m_GstId ? z.number() : z.number().optional(),
    gstLocalAmt: visible?.m_GstId
      ? z.number().optional()
      : z.number().optional(),
    gstCtyAmt:
      visible?.m_CtyCurr && visible?.m_GstId
        ? z.number()
        : z.number().optional(),

    // Delivery Date
    deliveryDate:
      required?.m_DeliveryDate && visible?.m_DeliveryDate
        ? z.date()
        : z.union([z.date(), z.string(), z.null()]).optional(),

    // Department Fields
    departmentId:
      required?.m_DepartmentId && visible?.m_DepartmentId
        ? z.number().min(1, "Department is required")
        : z.number().optional(),
    departmentCode: z.string().optional(),
    departmentName: z.string().optional(),

    // Employee Fields
    employeeId:
      required?.m_EmployeeId && visible?.m_EmployeeId
        ? z.number().min(1, "Employee is required")
        : z.number().optional(),
    employeeCode: z.string().optional(),
    employeeName: z.string().optional(),

    // Port Fields
    portId:
      required?.m_PortId && visible?.m_PortId
        ? z.number().min(1, "Port is required")
        : z.number().optional(),
    portCode: z.string().optional(),
    portName: z.string().optional(),

    // Vessel Fields
    vesselId:
      required?.m_VesselId && visible?.m_VesselId
        ? z.number().min(1, "Vessel is required")
        : z.number().optional(),
    vesselCode: z.string().optional(),
    vesselName: z.string().optional(),

    // Barge Fields
    bargeId:
      required?.m_BargeId && visible?.m_BargeId
        ? z.number().min(1, "Barge is required")
        : z.number().optional(),
    bargeCode: z.string().optional(),
    bargeName: z.string().optional(),

    // Voyage Fields
    voyageId:
      required?.m_VoyageId && visible?.m_VoyageId
        ? z.number().min(1, "Voyage is required")
        : z.number().optional(),
    voyageNo: z.string().optional(),

    // Operation Fields
    operationId: z.union([z.string(), z.number()]).optional(),
    operationNo: z.string().optional(),
    opRefNo: z.union([z.number(), z.string()]).optional(),

    // Sales Order Fields
    salesOrderId: z.union([z.string(), z.number()]).optional(),
    salesOrderNo: z.string().optional(),

    // Supply Date
    supplyDate:
      required?.m_SupplyDate && visible?.m_SupplyDate
        ? z.date()
        : z.union([z.date(), z.string(), z.null()]).optional(),

    // Supplier Details
    supplierName: z.string().optional(),
    suppDebitNoteNo: z.string().optional(),
    apDebitNoteId: z.string().optional(),
    apDebitNoteNo: z.string().optional(),
    editVersion: z.number().optional(),
  })
}

export type ArDebitNoteDtSchemaType = z.infer<
  ReturnType<typeof ArDebitNoteDtSchema>
>

export const ArDebitNoteDtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ArDebitNoteDtFiltersValues = z.infer<
  typeof ArDebitNoteDtFiltersSchema
>
