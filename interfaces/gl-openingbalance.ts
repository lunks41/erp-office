export interface IGLOpeningBalance {
  companyId: number
  documentId: string
  itemNo: number
  glId: number
  glCode: string
  glName: string
  documentNo: string
  accountDate: Date | string
  customerId: number
  supplierId: number
  currencyId: number
  currencyCode: string
  currencyName: string

  exhRate: number

  isDebit: boolean

  totAmt: number
  totLocalAmt: number

  departmentId: number
  departemntCode: string
  departemntName: string
  employeeId: number
  employeeCode: string
  employeeName: string
  productId: number
  productCode: string
  productName: string
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

  isSystem: boolean
  createById: number

  // NotMapped in DB but required in UI
  createDate: string

  editById?: number | null
  editDate?: string | null
  editVersion: number
}
