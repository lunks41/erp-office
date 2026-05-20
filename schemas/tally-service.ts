import { z } from "zod"

import {
  tallyFreshWaterLineSchema,
  tallyLaunchServiceLineSchema,
} from "./tally-service-lines"

export const tallyServiceSchema = z.object({
  tallyServiceId: z.number(),
  date: z.string().min(1, "Service Date is required"),
  accountDate: z.string().min(1, "Account Date is required"),
  customerId: z.number().min(1, "Customer is required"),
  currencyId: z.number().min(1, "Currency is required"),
  exhRate: z.number().min(0, "Exchange rate must be 0 or greater"),
  vesselId: z.number().min(1, "Vessel is required"),
  bargeId: z.number().min(1, "Barge is required"),
  portId: z.number().min(1, "Port is required"),
  addressId: z.number().optional(),
  contactId: z.number().optional(),
  isTaxable: z.boolean(),
  gstId: z.number().optional(),
  gstPercentage: z.number().optional(),
  isActive: z.boolean(),
  isClose: z.boolean(),
  isPost: z.boolean(),
  isCancel: z.boolean(),
  cancelRemarks: z.string().max(500).optional(),
  billName: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  address4: z.string().optional(),
  pinCode: z.string().optional(),
  countryId: z.number().optional(),
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

export type TallyServiceSchemaType = z.infer<typeof tallyServiceSchema>

export {
  tallyFreshWaterLineSchema,
  tallyLaunchServiceLineSchema,
} from "./tally-service-lines"
export type {
  TallyFreshWaterLineSchemaType,
  TallyLaunchServiceLineSchemaType,
} from "./tally-service-lines"
