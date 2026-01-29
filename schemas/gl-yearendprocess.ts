import * as z from "zod"

export const GLYearEndProcessRequestSchema = z.object({
  documentId: z.number().min(1, "Document ID is required"),
  isCurrency: z.boolean().default(false),
  isDepartment: z.boolean().default(false),
  isEmployee: z.boolean().default(false),
  isProduct: z.boolean().default(false),
  isPort: z.boolean().default(false),
  isVessel: z.boolean().default(false),
  isBarge: z.boolean().default(false),
  isVoyage: z.boolean().default(false),
  isCustomer: z.boolean().default(false),
  isSupplier: z.boolean().default(false),
})

export type GLYearEndProcessRequestSchemaType = z.infer<
  typeof GLYearEndProcessRequestSchema
>
