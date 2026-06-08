import { z } from "zod"

import {
  tallyFreshWaterLineSchema,
  tallyLaunchServiceLineSchema,
} from "./tally-service-lines"

export const tallyServiceSchema = z.object({
  tallyServiceId: z.number(),
  tallyServiceNo: z.string().max(50).optional(),
  tallyServiceNoSeq: z.number().min(0).optional(),
  referenceNo: z.string().max(100).optional(),
  date: z.string().min(1, "Service Date is required"),
  accountDate: z.string().min(1, "Account Date is required"),
  seriesDate: z.string().min(1, "Series Date is required"),
  customerId: z.number().min(1, "Customer is required"),
  currencyId: z.number().min(1, "Currency is required"),
  exhRate: z.number().min(0, "Exchange rate must be 0 or greater"),
  vesselId: z.number().min(1, "Vessel is required"),
  bargeId: z.number().min(1, "Barge is required"),
  portId: z.number().min(1, "Port is required"),
  addressId: z.number().min(1, "Address is required"),
  contactId: z.number().min(1, "Contact is required"),
  gstId: z.number().min(1, "VAT is required"),
  gstPercentage: z.number().optional(),
  isActive: z.boolean(),
  isPost: z.boolean().optional(),
  isCancel: z.boolean(),
  cancelRemarks: z.string().max(500).optional(),
  billName: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  address4: z.string().optional(),
  pinCode: z.string().optional(),
  countryId: z.number().min(1, "Country is required"),
  phoneNo: z.string().optional(),
  faxNo: z.string().optional(),
  contactName: z.string().optional(),
  mobileNo: z.string().optional(),
  emailAdd: z.string().optional(),
  freshWaterLines: z.array(tallyFreshWaterLineSchema),
  launchServiceLines: z.array(tallyLaunchServiceLineSchema),
  invoiceId: z.number().min(0, "Invoice Id must be 0 or greater"),
  invoiceNo: z.string().optional(),
  jobStatusId: z.number().min(1, "Status is required"),
  remarks: z
    .string()
    .max(500, "Remarks must be less than 500 characters")
    .optional(),
  editVersion: z.number(),
})
  .superRefine((data, ctx) => {
    const hasFreshWater = data.freshWaterLines.some(
      (l) => l.chargeId > 0 && l.uomId > 0
    )
    const hasLaunch = data.launchServiceLines.some((l) => l.chargeId > 0)
    if (!hasFreshWater && !hasLaunch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Add at least one freshwater line (charge and UOM) or one launch service line (charge).",
        path: ["freshWaterLines", 0, "chargeId"],
      })
    }

    data.freshWaterLines.forEach((line, index) => {
      if (line.chargeId <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Charge is required",
          path: ["freshWaterLines", index, "chargeId"],
        })
      }
      if (line.chargeId > 0 && line.uomId <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "UOM is required",
          path: ["freshWaterLines", index, "uomId"],
        })
      }
    })

    data.launchServiceLines.forEach((line, index) => {
      if (line.chargeId <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Charge is required",
          path: ["launchServiceLines", index, "chargeId"],
        })
      }
    })
  })

export type TallyServiceSchemaType = z.infer<typeof tallyServiceSchema>

export {
  tallyFreshWaterLineSchema,
  tallyLaunchServiceLineSchema,
} from "./tally-service-lines"
export type {
  TallyFreshWaterLineSchemaType,
  TallyLaunchServiceLineSchemaType,
} from "./tally-service-lines"
