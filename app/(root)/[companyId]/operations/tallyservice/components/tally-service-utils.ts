import { ITallyService } from "@/interfaces"

export function createEmptyTallyService(companyId: number): ITallyService {
  return {
    companyId,
    tallyServiceId: 0,
    date: "",
    serviceDate: "",
    accountDate: "",
    customerId: 0,
    currencyId: 0,
    exhRate: 0,
    vesselId: 0,
    imoCode: "",
    vesselDistance: 0,
    portId: 0,
    addressId: 0,
    contactId: 0,
    isTaxable: false,
    gstId: 0,
    gstPercentage: 0,
    isActive: true,
    isClose: false,
    isPost: false,
    isCancel: false,
    cancelRemarks: "",
    billName: "",
    address1: "",
    address2: "",
    address3: "",
    address4: "",
    pinCode: "",
    countryId: 0,
    phoneNo: "",
    faxNo: "",
    contactName: "",
    mobileNo: "",
    emailAdd: "",
    chargeId: 0,
    bargeId: 0,
    uomId: 0,
    quantity: 1,
    receiptNo: "",
    ameTally: "",
    boatopTally: "",
    boatOperator: "",
    operatorName: "",
    supplyBarge: "",
    waitingTime: 0,
    timeDiff: 0,
    deliveredWeight: 0,
    landedWeight: 0,
    annexure: "",
    invoiceId: 0,
    invoiceNo: "",
    jobStatusId: 201,
    jobStatusName: "",
    remarks: "",
    createById: 0,
    createDate: new Date(),
    editById: 0,
    editDate: new Date(),
    createBy: "",
    editBy: "",
    editVersion: 0,
  }
}

/** Payload shape expected by SaveTallyService API (camelCase JSON). */
export type TallyServiceSavePayload = {
  tallyServiceId: number
  serviceDate: string
  accountDate?: string
  customerId?: number | null
  currencyId?: number | null
  exhRate?: number | null
  vesselId?: number | null
  imoCode?: string | null
  vesselDistance?: number | null
  portId?: number | null
  addressId?: number | null
  contactId?: number | null
  isTaxable?: boolean
  gstId?: number | null
  gstPercentage?: number | null
  isActive?: boolean
  isClose?: boolean
  isPost?: boolean
  isCancel?: boolean
  cancelRemarks?: string | null
  billName?: string | null
  address1?: string | null
  address2?: string | null
  address3?: string | null
  address4?: string | null
  pinCode?: string | null
  countryId?: number | null
  phoneNo?: string | null
  faxNo?: string | null
  contactName?: string | null
  mobileNo?: string | null
  emailAdd?: string | null
  chargeId: number
  bargeId?: number | null
  uomId: number
  operatorName?: string | null
  supplyBarge?: string | null
  quantity: number
  receiptNo?: string | null
  ameTally?: string | null
  boatopTally?: string | null
  boatOperator?: string | null
  loadingTime?: string | Date | null
  leftJetty?: string | Date | null
  waitingTime?: number | null
  alongsideVessel?: string | Date | null
  departedFromVessel?: string | Date | null
  timeDiff?: number | null
  arrivedAtJetty?: string | Date | null
  deliveredWeight?: number | null
  landedWeight?: number | null
  annexure?: string | null
  invoiceId?: number | null
  invoiceNo?: string | null
  jobStatusId: number
  remarks?: string | null
  editVersion: number
}

export function mapTallyServiceForSave(data: ITallyService): TallyServiceSavePayload {
  const serviceDate = String(data.serviceDate || data.date || "")
  const accountDate = String(data.accountDate || serviceDate)

  return {
    tallyServiceId: data.tallyServiceId ?? 0,
    serviceDate,
    accountDate,
    customerId: data.customerId,
    currencyId: data.currencyId,
    exhRate: data.exhRate,
    vesselId: data.vesselId,
    imoCode: data.imoCode || "",
    vesselDistance: data.vesselDistance ?? 0,
    portId: data.portId,
    addressId: data.addressId || 0,
    contactId: data.contactId || 0,
    isTaxable: data.isTaxable ?? false,
    gstId: data.gstId,
    gstPercentage: data.gstPercentage,
    isActive: data.isActive ?? true,
    isClose: data.isClose ?? false,
    isPost: data.isPost ?? false,
    isCancel: data.isCancel ?? false,
    cancelRemarks: data.cancelRemarks || "",
    billName: data.billName || "",
    address1: data.address1 || "",
    address2: data.address2 || "",
    address3: data.address3 || "",
    address4: data.address4 || "",
    pinCode: data.pinCode || "",
    countryId: data.countryId,
    phoneNo: data.phoneNo || "",
    faxNo: data.faxNo || "",
    contactName: data.contactName || "",
    mobileNo: data.mobileNo || "",
    emailAdd: data.emailAdd || "",
    chargeId: data.chargeId,
    bargeId: data.bargeId,
    uomId: data.uomId,
    operatorName: data.operatorName || "",
    supplyBarge: data.supplyBarge || "",
    quantity: data.quantity ?? 1,
    receiptNo: data.receiptNo || "",
    ameTally: data.ameTally || "",
    boatopTally: data.boatopTally || "",
    boatOperator: data.boatOperator || "",
    loadingTime: data.loadingTime,
    leftJetty: data.leftJetty,
    waitingTime: data.waitingTime ?? 0,
    alongsideVessel: data.alongsideVessel,
    departedFromVessel: data.departedFromVessel,
    timeDiff: data.timeDiff ?? 0,
    arrivedAtJetty: data.arrivedAtJetty,
    deliveredWeight: data.deliveredWeight ?? 0,
    landedWeight: data.landedWeight ?? 0,
    annexure: data.annexure || "",
    invoiceId: data.invoiceId ?? 0,
    invoiceNo: data.invoiceNo || "",
    jobStatusId: data.jobStatusId ?? 201,
    remarks: data.remarks || "",
    editVersion: data.editVersion ?? 0,
  }
}

export function extractRows<T>(data: T | T[] | T[][] | null | undefined): T[] {
  if (!data) return []
  if (!Array.isArray(data)) return [data]
  if (data.length > 0 && Array.isArray(data[0])) {
    return (data as T[][]).flat()
  }
  return data as T[]
}

export function normalizeTallyService(
  item: Partial<ITallyService> | undefined,
  companyId: number
): ITallyService | undefined {
  if (!item) return undefined

  const base = createEmptyTallyService(companyId)
  const serviceDate = item.date ?? item.serviceDate ?? base.date
  const accountDate = item.accountDate ?? serviceDate

  return {
    ...base,
    ...item,
    companyId: item.companyId ?? companyId,
    tallyServiceId: item.tallyServiceId ?? 0,
    date: serviceDate,
    serviceDate,
    accountDate,
    customerId: item.customerId ?? base.customerId,
    currencyId: item.currencyId ?? base.currencyId,
    exhRate: item.exhRate ?? base.exhRate,
    vesselId: item.vesselId ?? base.vesselId,
    imoCode: item.imoCode ?? base.imoCode,
    vesselDistance: item.vesselDistance ?? base.vesselDistance,
    portId: item.portId ?? base.portId,
    addressId: item.addressId ?? base.addressId,
    contactId: item.contactId ?? base.contactId,
    isTaxable: item.isTaxable ?? base.isTaxable,
    gstId: item.gstId ?? base.gstId,
    gstPercentage: item.gstPercentage ?? base.gstPercentage,
    isActive: item.isActive ?? base.isActive,
    isClose: item.isClose ?? base.isClose,
    isPost: item.isPost ?? base.isPost,
    isCancel: item.isCancel ?? base.isCancel,
    cancelRemarks: item.cancelRemarks ?? base.cancelRemarks,
    billName: item.billName ?? base.billName,
    address1: item.address1 ?? base.address1,
    address2: item.address2 ?? base.address2,
    address3: item.address3 ?? base.address3,
    address4: item.address4 ?? base.address4,
    pinCode: item.pinCode ?? base.pinCode,
    countryId: item.countryId ?? base.countryId,
    phoneNo: item.phoneNo ?? base.phoneNo,
    faxNo: item.faxNo ?? base.faxNo,
    contactName: item.contactName ?? base.contactName,
    mobileNo: item.mobileNo ?? base.mobileNo,
    emailAdd: item.emailAdd ?? base.emailAdd,
    chargeId: item.chargeId ?? 0,
    bargeId: item.bargeId ?? 0,
    uomId: item.uomId ?? 0,
    quantity: item.quantity ?? base.quantity,
    invoiceId: item.invoiceId ?? base.invoiceId,
    invoiceNo: item.invoiceNo ?? base.invoiceNo,
    jobStatusId: item.jobStatusId ?? base.jobStatusId,
    jobStatusName: item.jobStatusName ?? base.jobStatusName,
    createById: item.createById ?? base.createById,
    createDate: item.createDate ?? base.createDate,
    editVersion: item.editVersion ?? base.editVersion,
  }
}

export function openTallyServiceTab(
  companyId: string,
  tallyServiceId?: number | string
) {
  const path =
    tallyServiceId && Number(tallyServiceId) > 0
      ? `/${companyId}/operations/tallyservice/${tallyServiceId}`
      : `/${companyId}/operations/tallyservice/new`
  window.open(path, "_blank", "noopener,noreferrer")
}
