export interface IJobOrderHd {
  companyId: number
  jobOrderId: number
  jobOrderNo?: string
  jobOrderDate?: Date | string
  customerId?: number
  customerCode?: string
  customerName?: string
  currencyId?: number
  currencyCode?: string
  currencyName?: string
  baseCurrencyId?: number
  baseCurrencyCode?: string
  exhRate?: number
  vesselId: number
  vesselName?: string
  imoCode?: string
  vesselDistance?: number
  portId?: number
  portName?: string
  lastPortId?: number
  lastPortName?: string
  nextPortId?: number
  nextPortName?: string
  voyageId?: number
  voyageNo?: string
  geoLocationId?: number
  geoLocationName?: string
  latitude?: string
  longitude?: string
  natureOfCall?: string
  isps?: string
  etaDate?: Date | string | null
  etdDate?: Date | string | null
  ownerName?: string
  ownerAgent?: string
  masterName?: string
  charters?: string
  chartersAgent?: string
  invoiceId?: string
  invoiceNo?: string
  accountDate?: Date | string
  seriesDate?: Date | string
  addressId?: number
  contactId?: number
  remarks?: string
  jobStatusId?: number
  jobStatusName?: string
  gstId?: number
  gstPercentage?: number
  isActive?: boolean
  isTaxable?: boolean
  isClose?: boolean
  isPost?: boolean
  editVersion?: number
  createById?: number
  createDate?: Date | string
  editById?: number
  editDate?: Date | string
  createBy?: string
  editBy?: string
  billName?: string
  address1?: string
  address2?: string
  address3?: string
  address4?: string
  pinCode?: string
  phoneNo?: string
  faxNo?: string
  countryId?: number
  contactName?: string
  mobileNo?: string
  emailAdd?: string
}

export interface IJobOrderDt {
  jobOrderId: number
  companyId?: number
  jobOrderNo?: string
  itemNo: number
  taskId: number
  taskItemNo: number
  serviceId: number
}

export interface IAgencyRemuneration {
  companyId: number
  agencyRemunerationId: number
  date: Date | string
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string
  chargeId: number
  chargeName?: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  taskStatusId: number
  taskStatusName?: string
  remarks?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface IConsignmentExport {
  consignmentExportId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string
  chargeId: number
  chargeName?: string
  awbNo: string
  carrierId: number
  carrierName?: string
  uomId: number
  uomName?: string
  serviceModeId?: number
  serviceModeName?: string
  consignmentTypeId: number
  consignmentTypeName?: string
  landingTypeId?: number
  landingTypeName?: string
  noOfPcs?: number
  weight: number
  pickupLocation?: string
  deliveryLocation?: string
  clearedBy?: string
  billEntryNo?: string
  declarationNo?: string
  referenceNo?: string
  receiveDate?: Date | string
  deliverDate?: Date | string
  arrivalDate?: Date | string
  amountDeposited?: number
  refundInstrumentNo?: string
  taskStatusId: number
  taskStatusName?: string
  remarks: string
  description: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  isCleared?: boolean
  existPortCustom?: string | null
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface IConsignmentImport {
  consignmentImportId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string
  chargeId: number
  chargeName?: string

  awbNo: string
  carrierId: number
  carrierName?: string
  uomId: number
  uomName?: string
  serviceModeId?: number
  serviceModeName?: string
  consignmentTypeId: number
  consignmentTypeName?: string
  landingTypeId?: number
  landingTypeName?: string
  noOfPcs?: number
  weight: number
  pickupLocation?: string
  deliveryLocation?: string
  clearedBy?: string
  billEntryNo?: string
  declarationNo?: string
  referenceNo?: string
  receiveDate?: Date | string
  deliverDate?: Date | string
  arrivalDate?: Date | string
  amountDeposited?: number
  refundInstrumentNo?: string
  taskStatusId: number
  taskStatusName?: string
  remarks: string
  description: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  isCleared?: boolean
  existPortCustom?: string | null
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface ICrewMiscellaneous {
  crewMiscellaneousId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  description: string

  quantity: number
  chargeId?: number
  chargeName?: string
  remarks: string
  taskStatusId: number
  taskStatusName?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  createBy?: string
  editBy?: string
  editVersion: number
}

export interface ICrewSignOff {
  crewSignOffId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  chargeId: number
  chargeName?: string

  visaId: number
  crewName: string
  nationalityId: number
  nationalityName?: string
  rankId: number
  rankName?: string
  flightDetails: string
  hotelName: string
  departureDetails?: string
  transportName?: string
  clearing?: string
  taskStatusId: number
  taskStatusName?: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  overStayRemark?: string
  modificationRemark?: string
  cidClearance?: string
  remarks: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface ICrewSignOn {
  crewSignOnId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  chargeId: number
  chargeName?: string

  visaId: number
  crewName: string
  nationalityId: number
  nationalityName?: string
  rankId: number
  rankName?: string
  flightDetails: string
  hotelName: string
  departureDetails?: string
  transportName?: string
  clearing?: string
  taskStatusId: number
  taskStatusName?: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  overStayRemark?: string
  modificationRemark?: string
  cidClearance?: string
  remarks: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface IEquipmentUsed {
  equipmentUsedId: number
  date: Date | string
  referenceNo: string
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string
  chargeId: number
  chargeName?: string

  mafi?: string
  others?: string
  craneChargeId?: number
  craneChargeName?: string
  forkliftChargeId?: number
  forkliftChargeName?: string
  stevedoreChargeId?: number
  stevedoreChargeName?: string
  loadingRefNo?: string
  craneloading?: number
  forkliftloading?: number
  stevedoreloading?: number
  offloadingRefNo?: string
  craneOffloading?: number
  forkliftOffloading?: number
  stevedoreOffloading?: number
  remarks?: string
  taskStatusId: number
  taskStatusName?: string
  isNotes?: boolean
  notes?: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  createBy?: string
  editBy?: string
  editVersion: number
}

export interface IFreshWater {
  freshWaterId: number
  date: Date | string
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string | null | null
  chargeId: number
  chargeName?: string | null
  bargeId: number
  bargeName?: string | null
  operatorName?: string | null
  supplyBarge?: string | null
  distance: number
  quantity: number
  receiptNo: string
  uomId: number
  uomName?: string | null
  taskStatusId: number
  taskStatusName?: string | null
  remarks: string
  debitNoteId?: number | null
  debitNoteNo?: string | null
  poNo?: string | null
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface ILandingItems {
  landingItemId: number
  date: Date | string
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string

  chargeId: number
  chargeName?: string
  name: string
  quantity: number
  weight: number
  landingPurposeId: number
  landingPurposeName?: string
  locationName: string
  uomId: number
  uomName?: string
  returnDate?: Date | string
  taskStatusId: number
  taskStatusName?: string
  remarks: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface ILaunchService {
  companyId: number
  launchServiceId: number
  date: Date | string
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string
  uomId: number
  uomName?: string

  chargeId: number
  chargeName?: string
  bargeId?: number
  bargeName?: string
  ameTally?: string
  boatopTally?: string
  boatOperator?: string
  distance?: number
  loadingTime?: Date | string
  leftJetty?: Date | string
  waitingTime?: number
  alongsideVessel?: Date | string
  departedFromVessel?: Date | string
  timeDiff?: number
  arrivedAtJetty?: Date | string
  deliveredWeight: number
  landedWeight: number
  annexure?: string
  invoiceNo?: string
  taskStatusId: number
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  remarks: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  createBy?: string
  editBy?: string
  editVersion: number
}

export interface ILaunchServiceFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IAgencyRemunerationFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IConsignmentExportFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IConsignmentImportFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ICrewMiscellaneousFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ICrewSignOffFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ICrewSignOnFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IEquipmentUsedFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IFreshWaterFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ILandingItemsFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IMedicalAssistanceFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IOtherServiceFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ITechnicianSurveyorFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IThirdPartyFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IMedicalAssistance {
  medicalAssistanceId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  chargeId: number
  chargeName?: string

  crewName: string
  nationalityId: number
  nationalityName?: string
  rankId: number
  rankName?: string
  visaId: number
  visaName?: string
  reason?: string
  admittedDate?: Date | string
  dischargedDate?: Date | string
  flightDetails: string
  hotelName: string
  departureDetails?: string
  transportName?: string
  clearing?: string
  overStayRemark?: string
  modificationRemark?: string
  clinicName?: string
  taskStatusId: number
  taskStatusName?: string
  remarks: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface IOtherService {
  otherServiceId: number
  date: Date | string
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  chargeId: number
  chargeName?: string

  serviceProvider: string
  quantity: number
  amount: number
  uomId: number
  uomName?: string
  taskStatusId: number
  taskStatusName?: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  remarks: string
  description?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface IPortExpenses {
  portExpenseId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string
  quantity: number
  supplierId: number
  supplierName?: string
  chargeId: number
  chargeName?: string
  taskStatusId: number
  taskStatusName?: string
  uomId: number
  uomName?: string
  deliverDate?: Date | string

  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  remarks?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  createBy?: string
  editBy?: string
  editVersion: number
}

export interface IPortExpensesFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ITechnicianSurveyor {
  technicianSurveyorId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string

  chargeId: number
  chargeName?: string
  name: string
  quantity: number
  uomId: number
  natureOfAttendance: string
  companyInfo: string
  passTypeId: number
  passTypeName?: string
  embarked?: Date | string
  disembarked?: Date | string
  portRequestNo?: string
  taskStatusId: number
  taskStatusName?: string
  remarks: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  isTransport: boolean
  isHotel: boolean
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  createBy?: string
  editBy?: string
}

export interface IThirdParty {
  thirdPartyId: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  vesselName?: string
  taskId: number
  taskName?: string
  debitNoteId?: number
  debitNoteNo?: string
  poNo?: string
  description?: string
  name?: string
  remarks?: string
  createById: number
  createDate: Date
  editById?: number
  editDate?: Date
  editVersion: number
  quantity: number
  supplyTypeId: number
  supplyTypeName?: string
  supplierName?: string

  chargeId: number
  chargeName?: string
  taskStatusId: number
  taskStatusName?: string
  supplierId: number
  uomId: number
  uomName?: string
  deliverDate?: Date | string
  createBy?: string
  editBy?: string
}

export interface IDebitNoteHd {
  companyId: number
  debitNoteId: number
  debitNoteNo: string
  debitNoteDate: Date | string
  itemNo: number
  jobOrderId: number
  taskId: number
  taskName?: string
  chargeId: number
  chargeName?: string
  glId?: number
  currencyId: number
  currencyName?: string
  exhRate: number
  totAmt: number
  gstAmt: number
  totAmtAftGst: number

  taxableAmt: number
  nonTaxableAmt: number
  isLocked: boolean
  editVersion: number
  data_details?: IDebitNoteDt[]
}

export interface IDebitNoteDt {
  debitNoteId: number
  debitNoteNo: string
  itemNo: number
  refItemNo?: number
  taskId: number
  taskName?: string
  chargeId: number
  chargeName?: string
  qty: number
  unitPrice: number
  totLocalAmt: number
  totAmt: number
  gstId: number
  gstName?: string
  gstPercentage: number
  gstAmt: number
  totAmtAftGst: number
  remarks: string
  editVersion: number
  isServiceCharge: boolean
  serviceCharge: number
}

export interface ITaskDetails {
  portExpense: number
  launchService: number
  equipmentUsed: number
  crewSignOn: number
  crewSignOff: number
  crewMiscellaneous: number
  medicalAssistance: number
  consignmentImport: number
  consignmentExport: number
  thirdParty: number
  freshWater: number
  technicianSurveyor: number
  landingItems: number
  otherService: number
  agencyRemuneration: number
}

export interface IDebitNoteData {
  multipleId: string
  taskId: number
  jobOrderId: number
  debitNoteNo: string
}

export interface IBulkChargeData {
  chargeId: number
  chargeName: string
  remarks: string
  taskId?: number
  taskName?: string
  basicRate: number
  minUnit: number
  maxUnit: number
  displayRate: number
  additionalRate: number
  isTariff: boolean
}

export interface IDebitNoteItem {
  debitNoteId: number
  taskId: number
  taskName?: string
  debitNoteNo: string
  itemNo: number
  updatedItemNo?: number
  updatedDebitNoteNo?: string
  totAmt?: number
  gstAmt?: number
  totAmtAftGst?: number
}

export interface ISaveDebitNoteItem {
  debitNoteId: number
  debitNoteNo: string
  itemNo: number
  updatedItemNo?: number
  updatedDebitNoteNo?: string
}

export interface IPurchaseData {
  moduleId: number
  transactionId: number
  isAllocated: boolean
  documentId: string
  documentNo: string
  itemNo: number
  accountDate: Date | string
  suppInvoiceNo: string
  supplierName: string
  remarks?: string
  totAmt?: number
  gstAmt?: string
  totAmtAftGst: number
}

export interface ISavePurchaseData {
  moduleId: number
  transactionId: number
  isAllocated: boolean
  documentId: string
  itemNo: number
  jobOrderId: number
  taskId: number
  serviceItemNo: number
}

export interface ITransportationLog {
  itemNo: number
  companyId: number
  jobOrderId: number
  jobOrderNo: string
  taskId: number
  serviceItemNo: string
  serviceItemNoName: string
  transportDate: Date | string
  fromLocationId: number
  toLocationId: number
  transportModeId: number
  vehicleNo?: string | null
  driverName?: string | null
  passengerCount: number
  chargeId?: number | null
  cargoTypeId?: number | null
  remarks?: string | null
  refNo?: string | null
  vendor?: string | null
  createById: number
  createDate: Date | string
  editById?: number | null
  editDate?: Date | string | null
  editVersion: number
  createBy?: string
  editBy?: string
  taskName?: string
  serviceName?: string
  transportModeName?: string
  chargeName?: string
  cargoTypeName?: string
}
