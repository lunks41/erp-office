import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"

const buildDefaultPaymentDetails = (dateFormat: string) => ({
  companyId: 0,
  paymentId: 0,
  paymentNo: "",
  itemNo: 0,
  transactionId: 0,
  documentId: "0",
  documentNo: "",
  docRefNo: "",
  docCurrencyId: 0,
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

const buildDefaultPayment = (dateFormat: string) => ({
  paymentId: "0",
  paymentNo: "",
  supplierId: 0,
  referenceNo: "",
  trnDate: format(new Date(), dateFormat),
  accountDate: format(new Date(), dateFormat),
  bankId: 0,
  paymentTypeId: 0,
  chequeNo: "",
  chequeDate: format(new Date(), dateFormat),
  bankChgGLId: 0,
  isBankCharges: false,
  isAdjCharges: false,
  bankChgAmt: 0,
  bankChgLocalAmt: 0,
  currencyId: 0,
  exhRate: 0,
  totAmt: 0,
  totLocalAmt: 0,
  payCurrencyId: 0,
  payExhRate: 0,
  payTotAmt: 0,
  payTotLocalAmt: 0,
  unAllocTotAmt: 0,
  unAllocTotLocalAmt: 0,
  exhGainLoss: 0,
  remarks: "",
  docExhRate: 0,
  docTotAmt: 0,
  docTotLocalAmt: 0,
  allocTotAmt: 0,
  allocTotLocalAmt: 0,
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
  defaultPayment: buildDefaultPayment(dateFormat),
  defaultPaymentDetails: buildDefaultPaymentDetails(dateFormat),
})

export const defaultPayment = buildDefaultPayment(clientDateFormat)
export const defaultPaymentDetails =
  buildDefaultPaymentDetails(clientDateFormat)
