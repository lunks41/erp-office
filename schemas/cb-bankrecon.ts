import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import * as z from "zod"

export const CbBankReconHdSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields
    companyId: z.number().optional(),
    reconId: z.string().optional(),
    reconNo: z.string().optional(),
    prevReconId: z.number().optional(),
    prevReconNo: z.string().optional(),
    referenceNo: required?.m_ReferenceNo
      ? z.string().min(1, "Reference No is required")
      : z.string().optional(),
    trnDate: visible?.m_TrnDate
      ? z.union([z.date(), z.string()])
      : z.union([z.date(), z.string()]).optional(),
    accountDate: z.union([z.date(), z.string()]),

    // Bank Fields
    bankId: z.number().min(1, "Bank is required"),
    currencyId: z.number().min(1, "Currency is required"),

    // Date Range
    fromDate: z.union([z.date(), z.string()]),
    toDate: z.union([z.date(), z.string()]),

    // Amounts
    remarks: required?.m_Remarks
      ? z.string().min(3, "Remarks must be at least 3 characters")
      : z.string().optional(),
    totAmt: z.number().optional(),
    opBalAmt: z.number().optional(),
    clBalAmt: z.number().optional(),

    // Audit Fields
    createById: z.number().optional(),
    createBy: z.string().optional(),
    createDate: z.string().optional(),
    editById: z.number().optional().nullable(),
    editBy: z.string().optional(),
    editDate: z.string().optional().nullable(),
    editVersion: z.number().optional(),
    isCancel: z.boolean().optional(),
    cancelById: z.number().optional().nullable(),
    cancelBy: z.string().optional(),
    cancelDate: z.string().optional().nullable(),
    cancelRemarks: z.string().optional().nullable(),
    isPost: z.boolean().optional().nullable(),
    postById: z.number().optional().nullable(),
    postBy: z.string().optional(),
    postDate: z.string().optional().nullable(),
    appStatusId: z.number().optional().nullable(),
    appById: z.number().optional().nullable(),
    appBy: z.string().optional(),
    appDate: z.string().optional().nullable(),

    // Nested Details
    data_details: z
      .array(CbBankReconDtSchema(required, visible))
      .min(1, "At least one reconciliation detail is required"),
  })
}

export type CbBankReconHdSchemaType = z.infer<
  ReturnType<typeof CbBankReconHdSchema>
>

export const CbBankReconHdFiltersSchema = z.object({
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  sortBy: z.string().optional(),
  pageNumber: z.number().optional(),
  pageSize: z.number().optional(),
})

export type CbBankReconHdFiltersValues = z.infer<
  typeof CbBankReconHdFiltersSchema
>

export const CbBankReconDtSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields
    reconId: z.string().optional(),
    reconNo: z.string().optional(),
    itemNo: z.number().min(1, "Item No must be at least 1"),
    isSel: z.boolean(),

    // Module & Document Fields
    moduleId: z.number().min(1, "Module is required"),
    transactionId: z.number().min(1, "Transaction is required"),
    documentId: z.number().min(1, "Document is required"),
    documentNo: z.string().min(1, "Document No is required"),
    docReferenceNo: z.string().optional(),
    accountDate: z.union([z.date(), z.string()]),

    // Payment Fields
    paymentTypeId: required?.m_PaymentTypeId
      ? z.number().min(1, "Payment Type is required")
      : z.number().optional(),
    chequeNo: z.string().optional().nullable(),
    chequeDate: z.union([z.date(), z.string()]),

    // Entity Fields
    customerId: z.number().optional(),
    supplierId: z.number().optional(),

    // GL Fields
    glId: z.number().optional(),
    isDebit: z.boolean(),

    // Amounts
    exhRate: z.number().min(0.000001, "Exchange Rate must be greater than 0"),
    totAmt: z.number(),
    totLocalAmt: z.number(),

    // Additional Fields
    paymentFromTo: z.string().optional().nullable(),
    remarks: z.string().optional(),

    // Audit Fields
    editVersion: z.number().optional(),
  })
}

export type CbBankReconDtSchemaType = z.infer<
  ReturnType<typeof CbBankReconDtSchema>
>

export const CbBankReconDtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type CbBankReconDtFiltersValues = z.infer<
  typeof CbBankReconDtFiltersSchema
>
