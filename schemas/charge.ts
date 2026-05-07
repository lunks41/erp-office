import * as z from "zod"

export const chargeSchema = z.object({
  chargeId: z.number(),
  chargeCode: z
    .string()
    .min(1, { message: "charge code is required" })
    .max(50, { message: "charge code cannot exceed 50 characters" }),
  chargeName: z
    .string()
    .min(2, { message: "charge name must be at least 2 characters" })
    .max(200, { message: "charge name cannot exceed 200 characters" }),

  uomId: z.number().min(1, { message: "uom is required" }),
  seqNo: z.number().min(0, { message: "seq no is required" }),
  isTransport: z.boolean().default(false),
  isMultiple: z.boolean().default(false),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional(),
  isActive: z.boolean().default(true),
})

export type ChargeSchemaType = z.infer<typeof chargeSchema>

export const chargeFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type ChargeFiltersValues = z.infer<typeof chargeFiltersSchema>
