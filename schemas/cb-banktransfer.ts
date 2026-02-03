import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import * as z from "zod"

export const CbBankTransferSchema = (
  required: IMandatoryFields,
  visible: IVisibleFields
) => {
  return z
    .object({
      // Core Fields
      transferId: z.string().optional(),
      transferNo: z.string().optional(),
      referenceNo: required?.m_ReferenceNo
        ? z.string().min(1, "Reference No is required")
        : z.string().optional(),
      trnDate: visible?.m_TrnDate
        ? z.union([z.date(), z.string()])
        : z.union([z.date(), z.string()]).optional(),
      accountDate: z.union([z.date(), z.string()]),

      // Payment Fields
      paymentTypeId: required?.m_PaymentTypeId
        ? z.number().min(1, "Payment Type is required")
        : z.number().optional(),
      chequeNo: z.string().optional().nullable(),
      chequeDate: z.union([z.date(), z.string()]),

      // Job Order Fields
      jobOrderId:
        required?.m_JobOrderId && visible?.m_JobOrderId
          ? z.number().min(1, "Job Order is required")
          : z.number().optional(),
      jobOrderNo: z.string().optional().nullable(),
      taskId:
        required?.m_JobOrderId && visible?.m_JobOrderId
          ? z.number().min(1, "Task is required")
          : z.number().optional(),
      taskName: z.string().optional().nullable(),
      serviceItemNo:
        required?.m_JobOrderId && visible?.m_JobOrderId
          ? z.number().min(1, "Service is required")
          : z.number().optional(),
      serviceItemNoName: z.string().optional(),
      // From Bank Fields
      fromBankId: z.number().min(1, "From Bank is required"),
      fromCurrencyId: z.number().min(1, "From Currency is required"),
      fromExhRate: z.number().min(0, "From Exchange Rate is required"),
      fromBankChgGLId: z.number().optional(),
      fromBankChgAmt: z.number().optional(),
      fromBankChgLocalAmt: z.number().optional(),
      fromTotAmt: z
        .number()
        .min(0, "From Total Amount must be greater than or equal to 0"),
      fromTotLocalAmt: z.number().optional(),

      // To Bank Fields
      toBankId: z.number().min(1, "To Bank is required"),
      toCurrencyId: z.number().min(1, "To Currency is required"),
      toExhRate: z.number().min(0, "To Exchange Rate is required"),
      toBankChgGLId: z.number().optional(),
      toBankChgAmt: z.number().optional(),
      toBankChgLocalAmt: z.number().optional(),
      toTotAmt: z
        .number()
        .min(0, "To Total Amount must be greater than or equal to 0"),
      toTotLocalAmt: z.number().optional(),

      // Bank Exchange Fields
      bankExhRate: z.number().optional(),
      bankTotAmt: z.number().optional(),
      bankTotLocalAmt: z.number().optional(),

      // Additional Fields
      remarks: required?.m_Remarks
        ? z.string().min(3, "Remarks must be at least 3 characters")
        : z.string().optional(),
      payeeTo: z.string().optional(),
      exhGainLoss: z.number().optional(),
      moduleFrom: z.string().optional(),

      // Audit Fields
      createBy: z.string().optional(),
      createDate: z.string().optional(),
      editBy: z.string().optional(),
      editDate: z.string().optional(),
      editVersion: z.number().optional(),
      isCancel: z.boolean().optional(),
      cancelBy: z.string().optional(),
      cancelDate: z.string().optional(),
      cancelRemarks: z.string().optional().nullable(),
      isPost: z.boolean().optional().nullable(),
      postBy: z.string().optional(),
      postDate: z.string().optional(),
      appStatusId: z.number().optional().nullable(),
      appBy: z.string().optional(),
      appDate: z.string().optional(),
    })
    .refine(
      (data) => {
        // If toBankChgAmt has a value (greater than 0), toBankChgGLId is required
        const toBankChgAmt = data.toBankChgAmt || 0
        if (toBankChgAmt > 0) {
          return (
            data.toBankChgGLId !== undefined &&
            data.toBankChgGLId !== null &&
            data.toBankChgGLId > 0
          )
        }
        return true
      },
      {
        message:
          "To Bank Charge GL is required when To Bank Charge Amount has a value",
        path: ["toBankChgGLId"],
      }
    )
}

export type CbBankTransferSchemaType = z.infer<
  ReturnType<typeof CbBankTransferSchema>
>

export const CbBankTransferFiltersSchema = z.object({
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  sortBy: z.string().optional(),
  pageNumber: z.number().optional(),
  pageSize: z.number().optional(),
})

export type CbBankTransferFiltersValues = z.infer<
  typeof CbBankTransferFiltersSchema
>
