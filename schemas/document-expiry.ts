import { z } from "zod"

export const saveDocumentSchema = z.object({
  documentId: z.number().optional(),
  docTypeId: z.number().min(1, "Document type is required"),
  docCategoryId: z.number().min(1, "Category is required"),
  documentNo: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required").max(200),
  issueDate: z.string().optional(),
  expiryDate: z.string().min(1, "Expiry date is required"),
  reminderDays: z.number().nullable().optional(),
  isMandatory: z.boolean(),
  remarks: z.string().nullable().optional(),
})

export const saveReminderRuleSchema = z.object({
  reminderRuleId: z.number(),
  docTypeId: z.number().nullable().optional(),
  daysBeforeExpiry: z.number().min(1).max(365),
  priorityLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  isPopupEnabled: z.boolean(),
  isEmailEnabled: z.boolean(),
  isActive: z.boolean(),
})

export const saveDocumentTypeSchema = z.object({
  documentTypeId: z.number(),
  documentTypeCode: z.string().min(1).max(30),
  documentTypeName: z.string().min(1).max(100),
  defaultReminderDays: z.number().min(1).max(365),
  isExpiryRequired: z.boolean(),
  isMandatory: z.boolean(),
  isActive: z.boolean(),
})

export type SaveDocumentSchemaType = z.infer<typeof saveDocumentSchema>
export type SaveReminderRuleSchemaType = z.infer<typeof saveReminderRuleSchema>
export type SaveDocumentTypeSchemaType = z.infer<typeof saveDocumentTypeSchema>
