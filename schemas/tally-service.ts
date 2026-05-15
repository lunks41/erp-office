import { z } from "zod"

export const tallyServiceSchema = z.object({
  tallyServiceId: z.number(),
  date: z.string().min(1, "Service Date is required"),
  accountDate: z.string().min(1, "Account Date is required"),
  customerId: z.number().min(1, "Customer is required"),
  currencyId: z.number().min(1, "Currency is required"),
  exhRate: z.number().min(0, "Exchange rate must be 0 or greater"),
  vesselId: z.number().min(1, "Vessel is required"),
  imoCode: z.string().optional(),
  vesselDistance: z.number().min(0, "Vessel distance must be 0 or greater"),
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
  jobStatusId: z.number().min(1, "Status is required"),
  remarks: z
    .string()
    .max(500, "Remarks must be less than 500 characters")
    .optional(),
  editVersion: z.number(),
})

export type TallyServiceSchemaType = z.infer<typeof tallyServiceSchema>
