export interface IPdaHd {
  companyId: number
  pdaId: number
  pdaNo: string
  jobOrderId: number
  jobOrderNo: string
  vesselId: number
  vesselName: string
  customerId: number
  customerName: string
  portId: number
  portName: string
  etaDate: string | null
  etdDate: string | null
  currencyId: number
  currencyCode: string
  exchRate: number
  typeOfCall: string
  basisOfPda: string
  totalAmount: number
  vatAmount: number
  advanceReceived: number
  grandTotal: number
  status: number
  remarks: string
  createById: number
  createDate: string
  editById: number | null
  editDate: string | null
  isActive: boolean
}

export interface IPdaDt {
  companyId: number
  pdaId: number
  itemNo: number
  rowType: number
  parentItemNo: number | null
  sectionNo?: string
  sectionAmount?: number
  taskId: number
  taskName: string
  chargeId: number
  chargeName: string
  tariffId: number | null
  tariffItemNo: number | null
  description: string
  qty: number
  unit: string
  rate: number
  amount: number
  currencyId: number
  isEstimate: boolean
  isManual: boolean
  isWarningComment?: boolean
  remarks: string
}

export interface IPdaFilter {
  companyId: number
  searchText?: string
  status?: number
  portId?: number
  customerId?: number
  fromDate?: string
  toDate?: string
  pageNumber: number
  pageSize: number
}

export interface IPdaTariffLoadRequest {
  companyId: number
  customerId: number
  portId: number
  taskId: number
  jobOrderId: number
}

export const PDA_STATUS = {
  DRAFT: 0,
  APPROVED: 1,
  CONVERTED: 2,
} as const

export const PDA_STATUS_LABEL: Record<number, string> = {
  0: "Draft",
  1: "Approved",
  2: "Converted to DA",
}
