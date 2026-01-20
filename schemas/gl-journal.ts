import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import * as z from "zod"

export const GLJournalHdSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields

    journalId: z.string().optional(),
    journalNo: z.string().optional(),
    referenceNo: required?.m_ReferenceNo
      ? z.string().min(1, "Reference No is required")
      : z.string().optional(),
    trnDate: visible?.m_TrnDate
      ? z.union([z.date(), z.string()])
      : z.union([z.date(), z.string()]).optional(),
    accountDate: z.union([z.date(), z.string()]),

    // Currency Fields
    currencyId: z.number().min(1, "Currency is required"),
    exhRate: z.number().min(0.000001, "Exchange Rate must be greater than 0"),
    ctyExhRate: z
      .number()
      .min(0.0, "Country Exchange Rate must be greater than 0"),

    // Amounts
    totAmt: required?.m_TotAmt ? z.number().min(0) : z.number().optional(),
    totLocalAmt: z.number().optional(),
    totCtyAmt: visible?.m_CtyCurr ? z.number().min(0) : z.number().optional(),
    gstClaimDate: visible?.m_GstClaimDate
      ? z.union([z.date(), z.string()])
      : z.union([z.date(), z.string()]).optional(),
    gstAmt: visible?.m_GstId ? z.number().optional() : z.number().optional(),
    gstLocalAmt: visible?.m_GstId
      ? z.number().optional()
      : z.number().optional(),
    gstCtyAmt:
      visible?.m_CtyCurr && visible?.m_GstId
        ? z.number().min(0)
        : z.number().optional(),
    totAmtAftGst: z.number().optional(),
    totLocalAmtAftGst: z.number().optional(),
    totCtyAmtAftGst: visible?.m_CtyCurr
      ? z.number().min(0)
      : z.number().optional(),

    // Order Details
    remarks: required?.m_Remarks_Hd
      ? z.string().min(3, "Remarks must be at least 3 characters")
      : z.string().optional(),

    isReverse: z.boolean().optional(),
    isRecurrency: z.boolean().optional(),
    revDate: z.union([z.date(), z.string()]).optional(),
    recurrenceUntilDate: z.union([z.date(), z.string()]).optional(),

    // Customer Details
    moduleFrom: z.string().optional(),

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
    appStatusId: z.string().optional(),

    // Nested Details
    data_details: z
      .array(GLJournalDtSchema(required, visible))
      .min(1, "At least one payment detail is required"),
  })
}

export type GLJournalHdSchemaType = z.infer<
  ReturnType<typeof GLJournalHdSchema>
>

export const GLJournalHdFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type GLJournalHdFiltersValues = z.infer<typeof GLJournalHdFiltersSchema>

export const GLJournalDtSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z.object({
    // Core Fields
    journalId: z.string().optional(),
    journalNo: z.string().optional(),
    itemNo: z.number().min(1, "Item No must be at least 1"),
    seqNo: z.number().min(1, "Sequence No must be at least 1"),
    // GL Fields
    glId: required?.m_GLId
      ? z.number().min(1, "Chart of Account is required")
      : z.number().optional(),
    glCode: z.string().optional(),
    glName: z.string().optional(),

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

    // Product Fields
    productId:
      required?.m_ProductId && visible?.m_ProductId
        ? z.number().min(1, "Product is required")
        : z.number().optional(),
    productCode: z.string().optional(),
    productName: z.string().optional(),
    isDebit: z.boolean().optional(),

    // Job Order Fields
    jobOrderId:
      required?.m_JobOrderId && visible?.m_JobOrderId
        ? z.number().min(1, "Job Order is required")
        : z.number().optional(),
    jobOrderNo: z.string().optional(),

    // Task Fields
    taskId:
      required?.m_JobOrderId && visible?.m_JobOrderId
        ? z.number().min(1, "Task is required")
        : z.number().optional(),
    taskName: z.string().optional(),

    // Service Fields
    serviceItemNo:
      required?.m_JobOrderId && visible?.m_JobOrderId
        ? z.number().min(1, "Service is required")
        : z.number().optional(),
    serviceItemNoName: z.string().optional(),
    editVersion: z.number().optional(),
  })
}

export type GLJournalDtSchemaType = z.infer<
  ReturnType<typeof GLJournalDtSchema>
>

export const GLJournalDtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type GLJournalDtFiltersValues = z.infer<typeof GLJournalDtFiltersSchema>
