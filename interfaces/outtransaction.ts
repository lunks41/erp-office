export interface IApOutTransaction {
  companyId: number
  moduleId: number
  transactionId: number
  trnType: string
  documentId: string
  documentNo: string
  referenceNo: string
  suppNo: string
  accountDate: Date | string
  dueDate: Date | string
  currencyId: number
  currencyCode: null | string
  currencyName: null | string
  exhRate: number
  totAmt: number
  totLocalAmt: number
  balAmt: number
  balLocalAmt: number
}
export interface IArOutTransaction {
  companyId: number
  moduleId: number
  transactionId: number
  trnType: string
  custNo: string
  documentId: string
  documentNo: string
  referenceNo: string
  accountDate: Date | string
  dueDate: Date | string
  currencyId: number
  currencyCode: null | string
  currencyName: null | string
  exhRate: number
  totAmt: number
  totLocalAmt: number
  balAmt: number
  balLocalAmt: number
}
