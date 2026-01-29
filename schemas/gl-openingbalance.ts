import * as z from "zod"

export const GLOpeningBalanceSchema = z.object({
  companyId: z.number(),
  documentId: z.string(),
  itemNo: z.number().min(1, "Item No is required"),
  glId: z.number().min(1, "GL Account is required"),
  documentNo: z.string().min(1, "Document No is required"),
  accountDate: z.union([z.date(), z.string()]),
  customerId: z.number().optional(),
  supplierId: z.number().optional(),
  currencyId: z.number().min(1, "Currency is required"),

  exhRate: z.number().min(0.000001, "Exchange rate must be greater than 0"),

  isDebit: z.boolean(),

  totAmt: z.number(),
  totLocalAmt: z.number(),

  departmentId: z.number().optional(),
  employeeId: z.number().optional(),
  productId: z.number().optional(),
  portId: z.number().optional(),
  vesselId: z.number().optional(),
  bargeId: z.number().optional(),
  voyageId: z.number().optional(),

  isSystem: z.boolean().optional().default(false),
  createById: z.number(),

  // NotMapped → still needed in UI
  createDate: z.string(),

  editById: z.number().nullable().optional(),
  editDate: z.string().nullable().optional(),
  editVersion: z.number(),
})

export type GLOpeningBalanceSchemaType = z.infer<typeof GLOpeningBalanceSchema>
