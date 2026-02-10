import * as z from "zod"

export const vesselTypeSchema = z.object({
  vesselTypeId: z.number(),
  vesselTypeCode: z
    .string()
    .min(1, { message: "vessel type code is required" })
    .max(50, { message: "vessel type code cannot exceed 50 characters" }),
  vesselTypeName: z
    .string()
    .min(2, { message: "vessel type name must be at least 2 characters" })
    .max(150, { message: "vessel type name cannot exceed 150 characters" }),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional(),
  isActive: z.boolean(),
})

export type VesselTypeSchemaType = z.infer<typeof vesselTypeSchema>

export const vesselTypeFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type VesselTypeFiltersValues = z.infer<typeof vesselTypeFiltersSchema>

