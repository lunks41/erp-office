export interface ITallyService {
  companyId: number
  tallyServiceId: number
  date: Date | string
  /** Optional alias in case the backend uses a more explicit field name. */
  serviceDate?: Date | string | null
  accountDate?: Date | string | null
  chargeId: number
  chargeName?: string | null
  bargeId: number
  bargeName?: string | null
  uomId: number
  uomName?: string | null
  operatorName?: string | null
  supplyBarge?: string | null
  quantity: number
  receiptNo?: string | null
  ameTally?: string | null
  boatopTally?: string | null
  boatOperator?: string | null
  distance?: number | null
  loadingTime?: Date | string | null
  leftJetty?: Date | string | null
  waitingTime?: number | null
  alongsideVessel?: Date | string | null
  departedFromVessel?: Date | string | null
  timeDiff?: number | null
  arrivedAtJetty?: Date | string | null
  deliveredWeight?: number | null
  landedWeight?: number | null
  annexure?: string | null
  invoiceId?: number | null
  invoiceNo?: string | null
  poNo?: string | null
  isPost?: boolean
  taskStatusId: number
  taskStatusName?: string | null
  remarks?: string | null
  createById: number
  createDate: Date | string
  editById?: number | null
  editDate?: Date | string | null
  createBy?: string | null
  editBy?: string | null
  editVersion: number
}

export interface ITallyServiceFilter {
  search?: string
  sortOrder?: "asc" | "desc"
}
