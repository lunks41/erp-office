import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import * as z from "zod"

export const ArDocSetOffHdSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields

    setoffId: z.string().optional(),
    setoffNo: z.string().optional(),
    referenceNo: required?.m_ReferenceNo
      ? z.string().min(1, "Reference No is required")
      : z.string().optional(),
    trnDate: visible?.m_TrnDate
      ? z.union([z.date(), z.string()])
      : z.union([z.date(), z.string()]).optional(),
    accountDate: z.union([z.date(), z.string()]),
    customerId: z.number().min(1, "Customer is required"),
    // Currency Fields
    currencyId: z.number().min(1, "Currency is required"),
    exhRate: z.number().min(0, "Exchange Rate is required"),

    // Allocated Amount Fields
    allocTotAmt: z.number().min(0, "Allocated Total Amount is required"),

    balTotAmt: z.number().min(0, "Balanced Total Amount is required"),

    // Unallocated Amount Fields
    unAllocTotAmt: z.number().min(0, "Unallocated Total Amount is required"),

    exhGainLoss: z.number().optional(),

    remarks: required?.m_Remarks_Hd
      ? z.string().min(3, "Remarks must be at least 3 characters")
      : z.string().optional(),

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
      .array(ArDocSetOffDtSchema(required, visible))
      .min(1, "At least one doc set off detail is required"),
  })
}

export type ArDocSetOffHdSchemaType = z.infer<
  ReturnType<typeof ArDocSetOffHdSchema>
>

export const ArDocSetOffHdFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ArDocSetOffHdFiltersValues = z.infer<
  typeof ArDocSetOffHdFiltersSchema
>

export const ArDocSetOffDtSchema = (
  _required: IMandatoryFields,
  _visible: IVisibleFields
) => {
  return z.object({
    // Core Fields
    setoffId: z.string().optional(),
    setoffNo: z.string().optional(),
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

export type ArDocSetOffDtSchemaType = z.infer<
  ReturnType<typeof ArDocSetOffDtSchema>
>

export const ArDocSetOffDtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ArDocSetOffDtFiltersValues = z.infer<
  typeof ArDocSetOffDtFiltersSchema
>
