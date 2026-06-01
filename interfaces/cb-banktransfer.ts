export interface ICbBankTransfer {
  companyId: number
  transferId: string
  transferNo: string
  referenceNo: string
  trnDate: Date | string
  accountDate: Date | string
  paymentTypeId: number
  paymentTypeCode: string
  paymentTypeName: string
  chequeNo: string | null
  chequeDate: Date | string
  jobOrderId: number
  jobOrderNo: string
  taskId: number
  taskName: string
  serviceItemNo: number
  serviceItemNoName: string

  fromBankId: number
  fromBankCode: string
  fromBankName: string
  fromCurrencyId: number
  fromCurrencyCode: string
  fromCurrencyName: string
  fromExhRate: number
  fromBankChgGLId: number
  fromBankChgGLCode: string
  fromBankChgGLName: string
  fromBankChgAmt: number
  fromBankChgLocalAmt: number
  fromTotAmt: number
  fromTotLocalAmt: number

  toBankId: number
  toBankCode: string
  toBankName: string
  toCurrencyId: number
  toCurrencyCode: string
  toCurrencyName: string
  toExhRate: number
  toBankChgGLId: number
  toBankChgGLCode: string
  toBankChgGLName: string
  toBankChgAmt: number
  toBankChgLocalAmt: number
  toTotAmt: number
  toTotLocalAmt: number

  bankExhRate: number
  bankTotAmt: number
  bankTotLocalAmt: number

  remarks: string
  payeeTo: string
  exhGainLoss: number
  moduleFrom: string
  createBy: string
  createDate: Date | string
  editBy: string | null
  editDate: Date | null
  editVersion: number
  isCancel: boolean
  cancelBy: string | null
  cancelDate: Date | null
  cancelRemarks: string | null
  isPost: boolean | null
  postBy: string | null
  postDate: Date | null
  appStatusId: number | null
  appBy: string | null
  appDate: Date | null
}

export interface ICbBankTransferFilter {
  startDate: Date | string
  endDate: Date | string
  search: string
  sortOrder: string
  sortBy: string
  pageNumber?: number
  pageSize?: number
}
