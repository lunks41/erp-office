export interface ICbBankReconHd {
  companyId: number
  reconId: string
  reconNo: string
  prevReconId: number
  prevReconNo: string
  referenceNo: string
  trnDate: Date | string
  accountDate: Date | string
  bankId: number
  currencyId: number
  fromDate: Date | string
  toDate: Date | string
  remarks: string
  totAmt: number
  opBalAmt: number
  clBalAmt: number
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
  data_details: ICbBankReconDt[]
}

export interface ICbBankReconFilter {
  startDate: Date | string
  endDate: Date | string
  search: string
  sortOrder: string
  sortBy: string
  pageNumber?: number
  pageSize?: number
}

export interface ICbBankReconDt {
  reconId: string
  reconNo: string
  itemNo: number
  isSel: boolean
  moduleId: number
  transactionId: number
  documentId: number
  documentNo: string
  docReferenceNo: string
  accountDate: Date | string
  paymentTypeId: number
  paymentTypeName: string
  chequeNo: string | null
  chequeDate: Date | string
  customerId: number
  supplierId: number
  glId: number
  isDebit: boolean
  exhRate: number
  totAmt: number
  totLocalAmt: number
  paymentFromTo: string | null
  remarks: string
  editVersion: number
}
