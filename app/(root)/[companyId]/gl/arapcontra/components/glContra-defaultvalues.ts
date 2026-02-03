import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"

const buildDefaultContraDetails = (dateFormat: string) => ({
  companyId: 0,
  contraId: 0,
  contraNo: "",
  itemNo: 0,
  moduleId: 0,
  transactionId: 0,
  documentId: 0,
  documentNo: "",
  docRefNo: "",
  docCurrencyId: 0,
  docCurrencyCode: "",
  docExhRate: 0,
  docAccountDate: format(new Date(), dateFormat),
  docDueDate: format(new Date(), dateFormat),
  docTotAmt: 0,
  docTotLocalAmt: 0,
  docBalAmt: 0,
  docBalLocalAmt: 0,
  allocAmt: 0,
  allocLocalAmt: 0,
  docAllocAmt: 0,
  docAllocLocalAmt: 0,
  centDiff: 0,
  exhGainLoss: 0,
  editVersion: 0,
})

const buildDefaultContra = (dateFormat: string) => ({
  contraId: "0",
  contraNo: "",
  referenceNo: "",
  supplierId: 0,
  customerId: 0,
  trnDate: format(new Date(), dateFormat),
  accountDate: format(new Date(), dateFormat),
  currencyId: 0,
  exhRate: 0,
  totAmt: 0,
  totLocalAmt: 0,
  exhGainLoss: 0,
  remarks: "",
  moduleFrom: "",
  editVersion: 0,
  createBy: "",
  createDate: "",
  editBy: "",
  editDate: "",
  isCancel: false,
  cancelBy: "",
  cancelDate: "",
  cancelRemarks: "",
  data_details: [],
})

// Function to get default values with custom date format
export const getDefaultValues = (dateFormat: string = clientDateFormat) => ({
  defaultContra: buildDefaultContra(dateFormat),
  defaultContraDetails: buildDefaultContraDetails(dateFormat),
})

export const defaultContra = buildDefaultContra(clientDateFormat)
export const defaultContraDetails = buildDefaultContraDetails(clientDateFormat)
