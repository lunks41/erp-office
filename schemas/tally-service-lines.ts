import { z } from "zod"

export const tallyFreshWaterLineSchema = z.object({
  itemNo: z.number().optional(),
  chargeId: z.number().min(1, "Charge is required"),
  uomId: z.number().min(1, "UOM is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  distance: z.number().min(0, "Distance must be 0 or greater").optional(),
  tallyNo: z.string().optional(),
})

export const tallyLaunchServiceLineSchema = z.object({
  itemNo: z.number().optional(),
  chargeId: z.number().min(1, "Charge is required"),
  loadingTime: z.union([z.date(), z.string()]).optional(),
  leftJetty: z.union([z.date(), z.string()]).optional(),
  waitingTime: z.number().min(0).optional(),
  alongsideVessel: z.union([z.date(), z.string()]).optional(),
  departedFromVessel: z.union([z.date(), z.string()]).optional(),
  timeDiff: z.number().min(0).optional(),
  arrivedAtJetty: z.union([z.date(), z.string()]).optional(),
  deliveredWeight: z.number().min(0).optional(),
  landedWeight: z.number().min(0).optional(),
  distance: z.number().min(0, "Distance must be 0 or greater").optional(),
  tallyNo: z.string().optional(),
})

export type TallyFreshWaterLineSchemaType = z.infer<
  typeof tallyFreshWaterLineSchema
>
export type TallyLaunchServiceLineSchemaType = z.infer<
  typeof tallyLaunchServiceLineSchema
>
