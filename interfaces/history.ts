export interface IGlTransactionDetails {
  documentNo: string
  referenceNo: string
  accountDate: string | Date
  currencyCode: string
  exhRate: number
  ctyExhRate: number
  bankCode: string
  bankName: string
  glId: number
  glCode: string
  glName: string
  isDebit: boolean
  totAmt: number
  totLocalAmt: number
  totCtyAmt: number
  gstCode: string
  gstName: string
  gstAmt: number
  gstLocalAmt: number
  gstCtyAmt: number
  remarks: string
  departmentCode: string
  departmentName: string
  employeeCode: string
  employeeName: string
  portCode: string
  portName: string
  vesselCode: string
  vesselName: string
  voyageNo: string
  bargeCode: string
  bargeName: string
  productCode: string
  productName: string
  supplierCode: string
  supplierName: string
  customerCode: string
  customerName: string
  moduleFrom: string
  createBy: string
  createDate: string | Date
}

export interface IPaymentDetails {
  DocumentNO?: string
  ReferenceNo?: string
  AccountDate?: string | Date
  TotAmt?: number
  TotLocalAmt?: number
  AllAmt?: number
  AllLocalAmt?: number
  ExGainLoss?: number | string
}
export interface IPaymentHistoryDetails {
  moduleId?: number
  transactionId?: number
  trnType?: string
  documentId?: number
  documentNo?: string
  referenceNo?: string
  accountDate?: string | Date
  totAmt?: number
  totLocalAmt?: number
  allAmt?: number
  allLocalAmt?: number
  exGainLoss?: number | string
}

export interface IInvalidTransaction {
  companyId: number
  issues: string
  trnType: string
  glId: number
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
  documentId: number | string
  documentNo: string
  accountDate: string | Date
  totLocalAmt: number
  seqOrd: number
}
