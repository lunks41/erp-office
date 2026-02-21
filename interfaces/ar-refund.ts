export interface IArRefundHd {
  companyId: number
  refundId: string
  refundNo: string
  referenceNo: string
  trnDate: Date | string
  accountDate: Date | string
  bankId: number
  paymentTypeId: number
  chequeNo: string | null
  chequeDate: Date | string
  bankChgGLId: number
  isBankCharges: boolean
  isAdjCharges: boolean
  bankChgAmt: number
  bankChgLocalAmt: number
  customerId: number
  currencyId: number
  exhRate: number
  totAmt: number
  totLocalAmt: number
  recCurrencyId: number
  recExhRate: number
  recTotAmt: number
  recTotLocalAmt: number
  exhGainLoss: number
  remarks: string | null
  allocTotAmt: number | null
  allocTotLocalAmt: number | null
  jobOrderId: number | null
  jobOrderNo: string | null
  moduleFrom: string
  createById: number
  createDate: Date | string
  editById: number | null
  editDate: Date | null
  editVersion: number
  isCancel: boolean
  cancelById: number | null
  cancelDate: Date | null
  cancelRemarks: string | null
  isPost: boolean | null
  postById: number | null
  postDate: Date | null
  appStatusId: number | null
  appById: number | null
  appDate: Date | null
  createBy: string
  editBy: string
  cancelBy: string
  appBy: string
  data_details: IArRefundDt[]
}

export interface IArRefundFilter {
  startDate: Date | string
  endDate: Date | string
  search: string
  sortOrder: string
  sortBy: string
  pageNumber?: number
  pageSize?: number
}

export interface IArRefundDt {
  companyId: number
  refundId: string
  refundNo: string
  itemNo: number
  transactionId: number
  documentId: number
  documentNo: string
  docRefNo: string
  docCurrencyId: number
  docCurrencyCode: string
  docExhRate: number
  docAccountDate: Date | string
  docDueDate: Date | string
  docTotAmt: number
  docTotLocalAmt: number
  docBalAmt: number
  docBalLocalAmt: number
  allocAmt: number
  allocLocalAmt: number
  docAllocAmt: number
  docAllocLocalAmt: number
  centDiff: number
  exhGainLoss: number
  editVersion: number
}
