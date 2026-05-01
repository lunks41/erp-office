import { z } from "zod"

export const pdaDtSchema = z.object({
  pdaId: z.number().optional(),
  itemNo: z.number(),
  rowType: z.number().min(0).max(1).default(0),
  parentItemNo: z.number().nullable().optional(),
  sectionNo: z.string().optional(),
  sectionAmount: z.number().optional(),
  taskId: z.number().min(1, "Task required"),
  chargeId: z.number().min(1, "Charge required"),
  description: z.string().min(1, "Description required"),
  qty: z.number().min(0),
  unit: z.string(),
  rate: z.number().min(0),
  amount: z.number(),
  currencyId: z.number(),
  isEstimate: z.boolean(),
  isManual: z.boolean(),
  isWarningComment: z.boolean().optional(),
  remarks: z.string().optional(),
})

export const pdaHdSchema = z.object({
  pdaId: z.number().optional(),
  pdaNo: z.string().optional(),
  pdaDate: z.string().optional(),
  jobOrderId: z.number().min(1, "Job Order required"),
  vesselId: z.number().optional(),
  customerId: z.number().optional(),
  portId: z.number().optional(),
  status: z.number().optional(),
  currencyId: z.number().min(1, "Currency required"),
  exchRate: z.number().min(0.0001),
  typeOfCall: z.string().min(1, "Type of Call required"),
  basisOfPda: z.string().optional(),
  etaDate: z.string().nullable().optional(),
  etdDate: z.string().nullable().optional(),
  advanceReceived: z.number().min(0).default(0),
  remarks: z.string().optional(),
  details: z.array(pdaDtSchema).min(1, "At least one charge line required"),
})

export type PdaHdFormValues = z.input<typeof pdaHdSchema>
export type PdaDtFormValues = z.input<typeof pdaDtSchema>
