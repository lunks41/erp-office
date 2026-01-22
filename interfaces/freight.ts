export interface IFreight {
  companyId: number
  companyCode: string
  consignmentImportId: number
  jobOrderId: number
  jobOrderNo: string
  referenceNo: string
  vesselName: string
  vesselId: number
  awbNo: string
  declarationNo: string
  billEntryNo: string
  receiveDate: string | null
  arrivalDate: string | null
  noOfPcs: number | null
  weight: number | null
  clearedBy: string
  amountDeposited: number | null
  remarks: string
  description: string
  carrierId: number | null
  carrierName: string
  refundInstrumentNo: string
  taskId: number | null
  poNo: string
  chargeId: number
  chargeName: string
  serviceModeId: number | null
  serviceModeName: string
  consignmentTypeId: number | null
  consignmentTypeName: string
  landingTypeId: number | null
  landingTypeName: string
  pickupLocation: string
  deliveryLocation: string
  deliverDate: string | null
  uomId: number | null
  uomName: string
  debitNoteId: number | null
  debitNoteNo: string
  taskStatusId: number
  taskStatusName: string
  createById: number
  createDate: string
  createBy: string
  editById: number | null
  editDate: string | null
  editBy: string
  editVersion: number
  isCleared?: boolean
  existPortCustom?: string | null
}

