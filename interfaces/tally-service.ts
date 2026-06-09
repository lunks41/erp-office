export interface ITallyFreshWaterLine {
  itemNo?: number
  chargeId: number
  chargeName?: string | null
  uomId: number
  uomName?: string | null
  quantity: number
  distance?: number | null
  tallyNo?: string | null
  tallyDate?: Date | string | null
}

export interface ITallyLaunchServiceLine {
  itemNo?: number
  chargeId: number
  chargeName?: string | null
  loadingTime?: Date | string | null
  leftJetty?: Date | string | null
  waitingTime?: number | null
  alongsideVessel?: Date | string | null
  departedFromVessel?: Date | string | null
  timeDiff?: number | null
  arrivedAtJetty?: Date | string | null
  deliveredWeight?: number | null
  landedWeight?: number | null
  distance?: number | null
  tallyNo?: string | null
  tallyDate?: Date | string | null
}

export interface ITallyService {
  companyId: number
  tallyServiceId: number
  tallyServiceNo?: string | null
  tallyServiceNoSeq?: number | null
  referenceNo?: string | null
  date: Date | string
  serviceDate?: Date | string | null
  accountDate?: Date | string | null
  seriesDate?: Date | string | null
  customerId?: number | null
  customerCode?: string | null
  customerName?: string | null
  currencyId?: number | null
  currencyCode?: string | null
  currencyName?: string | null
  exhRate?: number | null
  vesselId?: number | null
  vesselName?: string | null
  portId?: number | null
  portName?: string | null
  addressId?: number | null
  contactId?: number | null
  gstId?: number | null
  gstName?: string | null
  gstPercentage?: number | null
  isActive?: boolean
  isPost?: boolean
  isCancel?: boolean
  cancelById?: number | null
  cancelDate?: Date | string | null
  cancelRemarks?: string | null
  billName?: string | null
  address1?: string | null
  address2?: string | null
  address3?: string | null
  address4?: string | null
  pinCode?: string | null
  countryId?: number | null
  countryName?: string | null
  phoneNo?: string | null
  faxNo?: string | null
  contactName?: string | null
  mobileNo?: string | null
  emailAdd?: string | null
  /** Display only — from first freshwater line when loaded from API */
  chargeId?: number
  chargeName?: string | null
  bargeId: number
  bargeName?: string | null
  /** Display only — from first freshwater line when loaded from API */
  uomId?: number
  uomName?: string | null
  invoiceId?: number | null
  invoiceNo?: string | null
  jobStatusId: number
  jobStatusName?: string | null
  remarks?: string | null
  createById: number
  createDate: Date | string
  editById?: number | null
  editDate?: Date | string | null
  createBy?: string | null
  editBy?: string | null
  editVersion: number
  freshWaterLines?: ITallyFreshWaterLine[]
  launchServiceLines?: ITallyLaunchServiceLine[]
  debitNoteId?: number
  debitNoteNo?: string | null
}

export interface ITallyServiceFilter {
  search?: string
  sortOrder?: "asc" | "desc"
}
