export interface ICbGenReceiptHd {
  companyId: number
  receiptId: string
  receiptNo: string
  referenceNo: string
  trnDate: Date | string
  accountDate: Date | string
  currencyId: number
  currencyCode: null | string
  currencyName: null | string
  exhRate: number
  ctyExhRate: number
  bankId: number
  bankCode: null | string | number
  bankName: null | string
  paymentTypeId: number
  chequeNo: string | null
  chequeDate: Date | string
  bankChgAmt: number
  bankChgLocalAmt: number

  totAmt: number
  totLocalAmt: number
  totCtyAmt: number
  gstClaimDate: Date | string
  gstAmt: number
  gstLocalAmt: number
  gstCtyAmt: number
  totAmtAftGst: number
  totLocalAmtAftGst: number
  totCtyAmtAftGst: number
  remarks: string
  payeeTo: string
  supplierRegNo: string
  moduleFrom: string
  createById: number
  createDate: Date | string
  editById: null | number
  editDate: null | Date
  isCancel: false
  cancelById: number
  cancelDate: Date | null
  cancelRemarks: null | string
  createBy: string
  editBy: string
  cancelBy: string
  editVersion: number
  isPost: boolean
  postById: null | number
  postDate: null | Date
  appStatusId: null | number
  appById: null | number
  appDate: null | Date

  appBy: string

  data_details: ICbGenReceiptDt[]
}

export interface ICbGenReceiptFilter {
  startDate: Date | string
  endDate: Date | string
  search: string
  sortOrder: string
  sortBy: string
  pageNumber?: number
  pageSize?: number
}

export interface ICbGenReceiptDt {
  receiptId: string
  receiptNo: string
  itemNo: number
  seqNo: number
  glId: number
  glCode: string
  glName: string
  totAmt: number
  totLocalAmt: number
  totCtyAmt: number
  remarks: string
  gstId: number
  gstName: string
  gstPercentage: number
  gstAmt: number
  gstLocalAmt: number
  gstCtyAmt: number
  departmentId: number
  departmentCode: string
  departmentName: string
  employeeId: number
  employeeCode: string
  employeeName: string
  portId: number
  portCode: string
  portName: string
  vesselId: number
  vesselCode: string
  vesselName: string
  bargeId: number
  bargeCode: string
  bargeName: string
  voyageId: number
  voyageNo: string
  jobOrderId: number
  jobOrderNo: string
  taskId: number
  taskName: string
  serviceItemNo: number
  serviceItemNoName: string
  editVersion: number
}
