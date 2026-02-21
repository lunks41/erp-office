import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"

const buildDefaultRefundDetails = (dateFormat: string) => ({
  companyId: 0,
  refundId: 0,
  refundNo: "",
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

const buildDefaultRefund = (dateFormat: string) => ({
  refundId: "0",
  refundNo: "",
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
  exhGainLoss: 0,
  remarks: "",
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
  defaultRefund: buildDefaultRefund(dateFormat),
  defaultRefundDetails: buildDefaultRefundDetails(dateFormat),
})

export const defaultRefund = buildDefaultRefund(clientDateFormat)
export const defaultRefundDetails = buildDefaultRefundDetails(clientDateFormat)
