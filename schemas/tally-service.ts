import { z } from "zod"

export const tallyServiceSchema = z.object({
  tallyServiceId: z.number(),
  date: z.string().min(1, "Service Date is required"),
  accountDate: z.string().min(1, "Account Date is required"),
  chargeId: z.number().min(1, "Charge is required"),
  bargeId: z.number().min(1, "Barge is required"),
  uomId: z.number().min(1, "UOM is required"),
  operatorName: z.string().optional(),
  supplyBarge: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  receiptNo: z.string().optional(),
  ameTally: z.string().min(1, "AME Tally is required"),
  boatopTally: z.string().optional(),
  boatOperator: z.string().optional(),
  distance: z.number().min(0, "Distance must be 0 or greater").optional(),
  loadingTime: z.union([z.date(), z.string()]).optional(),
  leftJetty: z.union([z.date(), z.string()]).optional(),
  waitingTime: z.number().min(0, "Waiting time must be 0 or greater"),
  alongsideVessel: z.union([z.date(), z.string()]).optional(),
  departedFromVessel: z.union([z.date(), z.string()]).optional(),
  timeDiff: z.number().min(0, "Time difference must be 0 or greater"),
  arrivedAtJetty: z.union([z.date(), z.string()]).optional(),
  deliveredWeight: z
    .number()
    .min(0, "Delivered weight must be 0 or greater")
    .optional(),
  landedWeight: z
    .number()
    .min(0, "Landed weight must be 0 or greater")
    .optional(),
  annexure: z.string().optional(),
  invoiceId: z.number().min(0, "Invoice Id must be 0 or greater"),
  invoiceNo: z.string().optional(),
  poNo: z.string().optional(),
  isPost: z.boolean(),
  taskStatusId: z.number().min(1, "Status is required"),
  remarks: z
    .string()
    .max(500, "Remarks must be less than 500 characters")
    .optional(),
  editVersion: z.number(),
})

export type TallyServiceSchemaType = z.infer<typeof tallyServiceSchema>
