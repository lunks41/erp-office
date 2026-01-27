import * as z from "zod"

export const tariffFiltersSchema = z.object({
  search: z.string().optional(),
  task: z.string().optional(),
  port: z.string().optional(),
  customer: z.string().optional(),
  sortBy: z.enum(["task", "charge", "uom", "type"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type TariffFiltersValues = z.infer<typeof tariffFiltersSchema>

export const tariffSchema = z
  .object({
    tariffId: z.number(),
    taskId: z.number().min(1, "Task is required"),
    chargeId: z.number().min(1, "Charge is required"),
    portId: z.number().min(1, "Port is required"),
    customerId: z.number().min(1, "Customer is required"),
    currencyId: z.number().optional(),
    uomId: z.number().min(1, "Unit of Measure is required"),
    visaId: z.number().optional(),
    displayRate: z.number().min(0, "Display Rate is required"),
    basicRate: z.number().min(0, "Basic Rate is required"),
    minUnit: z.number().min(0, "Min Unit is required"),
    maxUnit: z.number().min(0, "Max Unit is required"),
    isAdditional: z.boolean(),
    additionalUnit: z.number().optional(),
    additionalRate: z.number().optional(),
    prepaymentPercentage: z.number().optional(),
    isPrepayment: z.boolean(),
    seqNo: z.number().optional(),
    isDefault: z.boolean(),
    remarks: z.string().optional(),
    isActive: z.boolean(),
    editVersion: z.number().optional(),
  })
  .refine(
    (data) => {
      // If isAdditional is true, additionalUnit and additionalRate are required
      if (data.isAdditional) {
        return (
          data.additionalUnit &&
          data.additionalRate &&
          data.additionalUnit > 0 &&
          data.additionalRate > 0
        )
      }
      return true
    },
    {
      message:
        "Additional Unit and Additional Rate are required when Additional is enabled",
      path: ["additionalUnit", "additionalRate"],
    }
  )
  .refine(
    (data) => {
      // If isPrepayment is true, prepaymentPercentage is required
      if (data.isPrepayment) {
        return data.prepaymentPercentage && data.prepaymentPercentage > 0
      }
      return true
    },
    {
      message: "Prepayment Rate is required when Prepayment is enabled",
      path: ["prepaymentPercentage"],
    }
  )

export type TariffSchemaType = z.infer<typeof tariffSchema>

// Define tariffDtSchema first since it's referenced by tariffHdSchema
export const tariffDtSchema = z.object({
  tariffId: z.number().min(0, "Tariff ID is required"),
  itemNo: z.number().min(1, "Item no is required"),
  displayRate: z.number().min(0, "Display Rate must be 0 or greater"),
  basicRate: z.number().min(0, "Basic Rate must be 0 or greater"),
  minUnit: z.number().min(0, "Min Unit must be 0 or greater"),
  maxUnit: z.number().min(0, "Max Unit must be 0 or greater"),
  isAdditional: z.boolean(),
  additionalUnit: z.number().min(0, "Additional Unit must be 0 or greater"),
  additionalRate: z.number().min(0, "Additional Rate must be 0 or greater"),
  editVersion: z.number().min(0, "Edit version must be 0 or greater"),
})

export type TariffDtSchemaType = z.infer<typeof tariffDtSchema>

// Define tariffHdSchema after tariffDtSchema
export const tariffHdSchema = z
  .object({
    tariffId: z.number(),
    companyId: z.number().min(1, "Company ID is required"),
    customerId: z.number().min(1, "Customer is required"),
    currencyId: z.number().min(0, "Currency ID is required"),
    exhRate: z.number().optional(), // UI only - not saved to DB
    portId: z.number().min(1, "Port is required"),
    taskId: z.number().min(1, "Task is required"),
    chargeId: z.number().min(1, "Charge is required"),
    uomId: z.number().min(1, "Unit of Measure is required"),
    visaId: z.number().nullable().optional(),
    fromLocationId: z.number().nullable().optional(),
    toLocationId: z.number().nullable().optional(),
    isPrepayment: z.boolean(),
    prepaymentPercentage: z
      .number()
      .min(0, "Prepayment Percentage must be 0 or greater"),
    itemNo: z.number().nullable().optional(),
    remarks: z
      .string()
      .max(255, "Remarks must be less than 255 characters")
      .nullable()
      .optional(),
    isActive: z.boolean(),
    editVersion: z.number().min(0, "Edit version must be 0 or greater"),
    // Nested Details
    data_details: z
      .array(tariffDtSchema)
      .min(1, "At least one tariff detail is required"),
  })
  .refine(
    (data) => {
      // If isPrepayment is true, prepaymentPercentage should be greater than 0
      if (data.isPrepayment) {
        return data.prepaymentPercentage > 0
      }
      return true
    },
    {
      message: "Prepayment Percentage is required when Prepayment is enabled",
      path: ["prepaymentPercentage"],
    }
  )

export type TariffHdSchemaType = z.infer<typeof tariffHdSchema>
