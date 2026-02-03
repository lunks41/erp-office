import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import * as z from "zod"

export const arinvoiceHdSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields

    invoiceId: z.string().optional(),
    invoiceNo: z.string().optional(),
    referenceNo: z.string().nullable().optional(),
    trnDate: z.union([z.date(), z.string()]),
    accountDate: z.union([z.date(), z.string()]),
    deliveryDate:
      required?.m_DeliveryDate && visible?.m_DeliveryDate
        ? z.union([z.date(), z.string()])
        : z.union([z.date(), z.string(), z.null()]).optional(),
    dueDate: z.union([z.date(), z.string()]),
    customerId: z.number().min(1),

    // Currency Fields
    currencyId: z.number().min(1),
    exhRate: z.number().min(0),
    ctyExhRate: z.number().min(0),

    // Credit Terms
    creditTermId: z.number().min(1),

    // Bank Fields
    bankId:
      required?.m_BankId && visible?.m_BankId
        ? z.number()
        : z.union([z.number(), z.null()]).optional(),

    // Amounts
    totAmt: required?.m_TotAmt
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),
    totLocalAmt: z.union([z.number(), z.null()]).optional(),
    totCtyAmt: visible?.m_CtyCurr
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),
    gstClaimDate: z.union([z.date(), z.string(), z.null()]).optional(),
    gstAmt: z.union([z.number(), z.null()]).optional(),
    gstLocalAmt: z.union([z.number(), z.null()]).optional(),
    gstCtyAmt: visible?.m_CtyCurr
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),
    totAmtAftGst: z.union([z.number(), z.null()]).optional(),
    totLocalAmtAftGst: z.union([z.number(), z.null()]).optional(),
    totCtyAmtAftGst: visible?.m_CtyCurr
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),
    balAmt: z.union([z.number(), z.null()]).optional(),
    balLocalAmt: z.union([z.number(), z.null()]).optional(),
    payAmt: z.union([z.number(), z.null()]).optional(),
    payLocalAmt: z.union([z.number(), z.null()]).optional(),
    exGainLoss: z.union([z.number(), z.null()]).optional(),

    // Order Details
    salesOrderId: z.union([z.string(), z.number(), z.null()]).optional(),
    salesOrderNo: z.union([z.string(), z.null()]),
    operationId: z.union([z.string(), z.number(), z.null()]).optional(),
    operationNo: z.union([z.string(), z.null()]),
    remarks: required?.m_Remarks_Hd ? z.string().min(3) : z.string().optional(),

    // Address and Contact
    addressId: z.union([z.number(), z.null()]).optional(),
    contactId: z.union([z.number(), z.null()]).optional(),
    address1: required?.m_Address1
      ? z.string().min(1)
      : z.union([z.string(), z.null()]).optional(),
    address2: required?.m_Address2
      ? z.string().min(1)
      : z.union([z.string(), z.null()]).optional(),
    address3: required?.m_Address3
      ? z.string().min(1)
      : z.union([z.string(), z.null()]).optional(),
    address4: required?.m_Address4
      ? z.string().min(1)
      : z.union([z.string(), z.null()]).optional(),
    pinCode: required?.m_PinCode ? z.string().min(1) : z.string().optional(),
    countryId: required?.m_CountryId
      ? z.number().min(1)
      : z.union([z.number(), z.null()]).optional(),
    phoneNo: required?.m_PhoneNo
      ? z.string().min(9)
      : z.union([z.string(), z.null()]).optional(),
    faxNo: z.union([z.string(), z.null()]).optional(),
    contactName: z.union([z.string(), z.null()]).optional(),
    mobileNo: z.union([z.string(), z.null()]).optional(),
    emailAdd: required?.m_EmailAdd
      ? z.string().email().nullable().optional()
      : z.union([z.string(), z.null()]).optional(),

    // Supplier Details
    moduleFrom: z.union([z.string(), z.null()]).optional(),
    suppInvoiceNo: required?.m_SuppInvoiceNo
      ? z.string().min(1)
      : z.union([z.string(), z.null()]).optional(),
    supplierName: z.union([z.string(), z.null()]).optional(),
    apInvoiceId: z.union([z.string(), z.number(), z.null()]).optional(),
    apInvoiceNo: z.union([z.string(), z.null()]).nullable(),

    // Nested Details
    data_details: z.array(arinvoiceDtSchema(required, visible)).min(1),
  })
}

export type ArInvoiceHdSchemaType = z.infer<
  ReturnType<typeof arinvoiceHdSchema>
>

export const arinvoiceHdFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ArInvoiceHdFiltersValues = z.infer<typeof arinvoiceHdFiltersSchema>

export const arinvoiceDtSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields
    invoiceId: z.string().optional(),
    invoiceNo: z.string().optional(),
    itemNo: z.number().min(1),
    seqNo: z.number().min(1),
    docItemNo: z.number(),

    // Product Fields
    productId:
      required?.m_ProductId && visible?.m_ProductId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // GL Fields
    glId: required?.m_GLId
      ? z.number().min(1)
      : z.union([z.number(), z.null()]).optional(),

    // Quantity and UOM
    qty:
      visible?.m_QTY && required?.m_QTY
        ? z.number().min(0)
        : z.union([z.number(), z.null()]).optional(),
    billQTY: visible?.m_BillQTY
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),
    uomId:
      required?.m_UomId && visible?.m_UomId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // Pricing
    unitPrice:
      visible?.m_UnitPrice && required?.m_UnitPrice
        ? z.number().min(0)
        : z.union([z.number(), z.null()]).optional(),
    totAmt: required?.m_TotAmt
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),
    totLocalAmt: z.number().min(0),
    totCtyAmt: visible?.m_CtyCurr
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),

    // Remarks
    remarks: required?.m_Remarks
      ? z.string()
      : z.union([z.string(), z.null()]).optional(),

    // GST Fields
    gstId:
      required?.m_GstId && visible?.m_GstId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),
    gstPercentage: z.number().min(0),
    gstAmt: z.number().min(0),
    gstLocalAmt: z.union([z.number(), z.null()]).optional(),
    gstCtyAmt: visible?.m_CtyCurr
      ? z.number().min(0)
      : z.union([z.number(), z.null()]).optional(),

    // Delivery Date
    deliveryDate:
      required?.m_DeliveryDate && visible?.m_DeliveryDate
        ? z.union([z.date(), z.string()])
        : z.union([z.date(), z.string(), z.null()]).optional(),

    // Department Fields
    departmentId:
      required?.m_DepartmentId && visible?.m_DepartmentId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // Employee Fields
    employeeId:
      required?.m_EmployeeId && visible?.m_EmployeeId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // Port Fields
    portId:
      visible?.m_PortId && required?.m_PortId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // Vessel Fields
    vesselId:
      required?.m_VesselId && visible?.m_VesselId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // Barge Fields
    bargeId:
      visible?.m_BargeId && required?.m_BargeId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // Voyage Fields
    voyageId:
      required?.m_VoyageId && visible?.m_VoyageId
        ? z.number().min(1)
        : z.union([z.number(), z.null()]).optional(),

    // Operation Fields
    operationId: z.union([z.string(), z.number(), z.null()]).optional(),
    operationNo: z.union([z.string(), z.null()]),
    opRefNo: z.union([z.number(), z.string(), z.null()]),

    // Sales Order Fields
    salesOrderId: z.union([z.string(), z.number(), z.null()]).optional(),
    salesOrderNo: z.union([z.string(), z.null()]),

    // Supply Date
    supplyDate:
      required?.m_SupplyDate && visible?.m_SupplyDate
        ? z.union([z.date(), z.string()])
        : z.union([z.date(), z.string(), z.null()]).optional(),

    // Supplier Details
    supplierName: z.union([z.string(), z.null()]),
    suppInvoiceNo: z.union([z.string(), z.null()]),
    apInvoiceId: z.union([z.string(), z.number(), z.null()]).optional(),
    apInvoiceNo: z.union([z.string(), z.null()]).nullable(),

    // Audit Fields
    editVersion: z.union([z.number(), z.null()]).optional(),
  })
}

export type ArInvoiceDtSchemaType = z.infer<
  ReturnType<typeof arinvoiceDtSchema>
>

export const arinvoiceDtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ArInvoiceDtFiltersValues = z.infer<typeof arinvoiceDtFiltersSchema>
