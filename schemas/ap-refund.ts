import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import * as z from "zod"

export const ApRefundHdSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields

    refundId: z.string().optional(),
    refundNo: z.string().optional(),
    referenceNo: required?.m_ReferenceNo
      ? z.string().min(1, "Reference No is required")
      : z.string().optional(),
    trnDate: visible?.m_TrnDate
      ? z.union([z.date(), z.string()])
      : z.union([z.date(), z.string()]).optional(),
    accountDate: z.union([z.date(), z.string()]),
    supplierId: z.number().min(1, "Supplier is required"),
    // Bank Fields
    bankId:
      required?.m_BankId && visible?.m_BankId
        ? z.number().min(1, "Bank is required")
        : z.number().optional(),
    // Payment Type Fields
    paymentTypeId: required?.m_PaymentTypeId
      ? z.number().min(1, "Payment Type is required")
      : z.number().optional(),
    // Cheque Fields
    chequeNo: z.string().optional(),
    chequeDate: z.union([z.date(), z.string()]),

    // Bank Charge GL Fields
    bankChgGLId: visible?.m_BankChgGLId
      ? z.number().min(0, "Bank Charge GL is required")
      : z.number().optional(),
    bankChgAmt: z.number(),
    bankChgLocalAmt: z.number(),

    // Currency Fields
    currencyId: z.number().min(1, "Currency is required"),
    exhRate: z.number().min(0, "Exchange Rate is required"),

    // Amounts
    totAmt: required?.m_TotAmt ? z.number().min(0) : z.number().optional(),
    totLocalAmt: z.number().optional(),

    // Paying Currency Fields
    payCurrencyId: z.number().min(1, "Paying Currency is required"),
    payExhRate: z.number().min(0, "Paying Exchange Rate is required"),
    payTotAmt: z.number().min(0, "Paying Total Amount is required"),
    payTotLocalAmt: z.number().min(0, "Paying Total Local Amount is required"),

    exhGainLoss: z.number().optional(),

    remarks: required?.m_Remarks_Hd
      ? z.string().min(3, "Remarks must be at least 3 characters")
      : z.string().optional(),

    // Allocated Amount Fields
    allocTotAmt: z.number().min(0, "Allocated Total Amount is required"),
    allocTotLocalAmt: z
      .number()
      .min(0, "Allocated Total Local Amount is required"),

    // Module From Field
    moduleFrom: z.string().optional(),

    // Audit Fields
    editVersion: z.number().optional(),
    createBy: z.string().optional(),
    createDate: z.string().optional(),
    editBy: z.string().optional(),
    editDate: z.string().optional(),
    cancelBy: z.string().optional(),
    cancelDate: z.string().optional(),
    isCancel: z.boolean().optional(),
    cancelRemarks: z.string().optional(),
    appBy: z.string().optional(),
    appDate: z.string().optional(),
    appStatusId: z.number().optional(),

    // Nested Details
    data_details: z
      .array(ApRefundDtSchema(required, visible))
      .min(1, "At least one refund detail is required"),
  })
}

export type ApRefundHdSchemaType = z.infer<ReturnType<typeof ApRefundHdSchema>>

export const ApRefundHdFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ApRefundHdFiltersValues = z.infer<typeof ApRefundHdFiltersSchema>

export const ApRefundDtSchema = (
  _required: IMandatoryFields,
  _visible: IVisibleFields
) => {
  return z.object({
    // Core Fields
    refundId: z.string().optional(),
    refundNo: z.string().optional(),
    itemNo: z.number().min(1, "Item No must be at least 1"),
    transactionId: z.number().min(1, "Transaction is required"),

    // Document Fields
    documentId: z.string().min(1, "Document is required"),
    documentNo: z.string().min(1, "Document No is required"),
    docRefNo: z.string().optional(),
    docCurrencyId: z.number().min(1, "Document Currency is required"),
    docExhRate: z.number().min(0, "Document Exchange Rate is required"),
    docAccountDate: z.union([z.date(), z.string()]),
    docDueDate: z.union([z.date(), z.string()]),
    docTotAmt: z.number("Document Total Amount is required"),
    docTotLocalAmt: z.number("Document Total Local Amount is required"),
    docBalAmt: z.number("Document Balanced Amount is required"),
    docBalLocalAmt: z.number("Document Balanced Local Amount is required"),

    // Allocated Amount Fields
    allocAmt: z.number("Allocated Amount is required"),
    allocLocalAmt: z.number("Allocated Local Amount is required"),
    docAllocAmt: z.number("Document Allocated Amount is required"),
    docAllocLocalAmt: z.number("Document Allocated Local Amount is required"),

    // Exchange and Difference Fields
    centDiff: z.number(),

    // Exchange Gain/Loss Fields
    exhGainLoss: z.number().optional(),

    // Audit Fields
    editVersion: z.number().optional(),
  })
}

export type ApRefundDtSchemaType = z.infer<ReturnType<typeof ApRefundDtSchema>>

export const ApRefundDtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ApRefundDtFiltersValues = z.infer<typeof ApRefundDtFiltersSchema>
