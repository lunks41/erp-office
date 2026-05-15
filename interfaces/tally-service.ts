export interface ITallyService {
  companyId: number
  tallyServiceId: number
  date: Date | string
  serviceDate?: Date | string | null
  accountDate?: Date | string | null
  customerId?: number | null
  customerCode?: string | null
  customerName?: string | null
  currencyId?: number | null
  currencyCode?: string | null
  currencyName?: string | null
  exhRate?: number | null
  vesselId?: number | null
  vesselName?: string | null
  imoCode?: string | null
  vesselDistance?: number | null
  portId?: number | null
  portName?: string | null
  addressId?: number | null
  contactId?: number | null
  isTaxable?: boolean
  gstId?: number | null
  gstName?: string | null
  gstPercentage?: number | null
  isActive?: boolean
  isClose?: boolean
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
}

export interface ITallyServiceFilter {
  search?: string
  sortOrder?: "asc" | "desc"
}
