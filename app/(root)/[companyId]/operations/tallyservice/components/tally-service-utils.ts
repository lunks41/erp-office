import { readTallyServiceLineArray } from "@/helpers/tally-service-details"
import {
  ITallyFreshWaterLine,
  ITallyLaunchServiceLine,
  ITallyService,
} from "@/interfaces"
import {
  TallyFreshWaterLineSchemaType,
  TallyLaunchServiceLineSchemaType,
  TallyServiceSchemaType,
} from "@/schemas"

import { formatDateForApi, formatDateTimeForApi } from "@/lib/date-utils"

export function createEmptyFreshWaterLine(): TallyFreshWaterLineSchemaType {
  return {
    itemNo: 0,
    chargeId: 0,
    uomId: 0,
    quantity: 1,
    distance: 0,
    tallyNo: "",
  }
}

export function filterFreshWaterLinesForSave(
  lines?: ITallyFreshWaterLine[]
): ITallyFreshWaterLine[] {
  return (lines ?? []).filter((line) => line.chargeId > 0 && line.uomId > 0)
}

export function filterLaunchLinesForSave(
  lines?: ITallyLaunchServiceLine[]
): ITallyLaunchServiceLine[] {
  return (lines ?? []).filter((line) => line.chargeId > 0)
}

export function createEmptyLaunchLine(): TallyLaunchServiceLineSchemaType {
  return {
    itemNo: 0,
    chargeId: 0,
    waitingTime: 0,
    timeDiff: 0,
    deliveredWeight: 0,
    landedWeight: 0,
    distance: 0,
    tallyNo: "",
  }
}

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
    portId: 0,
    addressId: 0,
    contactId: 0,
    gstId: 1,
    gstPercentage: 0,
    isActive: true,
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
    invoiceId: 0,
    invoiceNo: "",
    jobStatusId: 1,
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
  portId?: number | null
  addressId?: number | null
  contactId?: number | null
  gstId?: number | null
  gstPercentage?: number | null
  isActive?: boolean
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
  bargeId?: number | null
  invoiceId?: number | null
  invoiceNo?: string | null
  jobStatusId: number
  remarks?: string | null
  editVersion: number
  freshWaterLines?: ITallyFreshWaterLine[]
  launchServiceLines?: ITallyLaunchServiceLine[]
}

export function buildFreshWaterLineFromTally(
  item?: Partial<ITallyService>
): TallyFreshWaterLineSchemaType {
  const firstLine = item?.freshWaterLines?.[0]
  return {
    itemNo: 0,
    chargeId: firstLine?.chargeId ?? item?.chargeId ?? 0,
    uomId: firstLine?.uomId ?? item?.uomId ?? 0,
    quantity: firstLine?.quantity ?? 1,
    distance: firstLine?.distance ?? 0,
    tallyNo: firstLine?.tallyNo ?? "",
  }
}

export function buildLaunchLineFromTally(
  item?: Partial<ITallyService>
): TallyLaunchServiceLineSchemaType {
  const firstLine = item?.launchServiceLines?.[0]
  return {
    itemNo: 0,
    chargeId: firstLine?.chargeId ?? item?.chargeId ?? 0,
    loadingTime: firstLine?.loadingTime ?? undefined,
    leftJetty: firstLine?.leftJetty ?? undefined,
    waitingTime: firstLine?.waitingTime ?? 0,
    alongsideVessel: firstLine?.alongsideVessel ?? undefined,
    departedFromVessel: firstLine?.departedFromVessel ?? undefined,
    timeDiff: firstLine?.timeDiff ?? 0,
    arrivedAtJetty: firstLine?.arrivedAtJetty ?? undefined,
    deliveredWeight: firstLine?.deliveredWeight ?? 0,
    landedWeight: firstLine?.landedWeight ?? 0,
    distance: firstLine?.distance ?? 0,
    tallyNo: firstLine?.tallyNo ?? "",
  }
}

export function buildFreshWaterLinesFromTally(
  item?: Partial<ITallyService>
): TallyFreshWaterLineSchemaType[] {
  const lines = readTallyServiceLineArray<ITallyFreshWaterLine>(
    item,
    "freshWaterLines",
    "FreshWaterLines"
  )
  if (lines.length === 0) return []

  return lines.map((line) => ({
    itemNo: line.itemNo ?? 0,
    chargeId: line.chargeId ?? 0,
    uomId: line.uomId ?? 0,
    quantity: line.quantity ?? 1,
    distance: line.distance ?? 0,
    tallyNo: line.tallyNo ?? "",
  }))
}

export function buildLaunchLinesFromTally(
  item?: Partial<ITallyService>
): TallyLaunchServiceLineSchemaType[] {
  const lines = readTallyServiceLineArray<ITallyLaunchServiceLine>(
    item,
    "launchServiceLines",
    "LaunchServiceLines"
  )
  if (lines.length === 0) return []

  return lines.map((line) => ({
    itemNo: line.itemNo ?? 0,
    chargeId: line.chargeId ?? 0,
    loadingTime: line.loadingTime ?? undefined,
    leftJetty: line.leftJetty ?? undefined,
    waitingTime: line.waitingTime ?? 0,
    alongsideVessel: line.alongsideVessel ?? undefined,
    departedFromVessel: line.departedFromVessel ?? undefined,
    timeDiff: line.timeDiff ?? 0,
    arrivedAtJetty: line.arrivedAtJetty ?? undefined,
    deliveredWeight: line.deliveredWeight ?? 0,
    landedWeight: line.landedWeight ?? 0,
    distance: line.distance ?? 0,
    tallyNo: line.tallyNo ?? "",
  }))
}

export function mapFormToTallyService(
  data: TallyServiceSchemaType,
  companyId: number,
  initialData?: ITallyService
): ITallyService {
  const freshWaterLines = data.freshWaterLines ?? []
  const launchServiceLines = data.launchServiceLines ?? []
  const formattedDate = formatDateForApi(data.date) || data.date
  const formattedAccountDate =
    formatDateForApi(data.accountDate) || data.accountDate

  return {
    companyId,
    tallyServiceId: data.tallyServiceId,
    date: formattedDate,
    serviceDate: formattedDate,
    accountDate: formattedAccountDate,
    customerId: data.customerId,
    currencyId: data.currencyId,
    exhRate: data.exhRate,
    vesselId: data.vesselId,
    portId: data.portId,
    addressId: data.addressId || 0,
    contactId: data.contactId || 0,
    gstId: data.gstId,
    gstPercentage: data.gstPercentage,
    isActive: data.isActive,
    isPost: data.isPost ?? false,
    isCancel: data.isCancel,
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
    chargeId:
      freshWaterLines.find((line) => line.chargeId > 0)?.chargeId ?? 0,
    bargeId: data.bargeId,
    uomId: freshWaterLines.find((line) => line.uomId > 0)?.uomId ?? 0,
    invoiceId: data.invoiceId ?? 0,
    invoiceNo: data.invoiceNo || "",
    jobStatusId: data.jobStatusId ?? 1,
    remarks: data.remarks || "",
    createById: initialData?.createById ?? 0,
    createDate: initialData?.createDate ?? new Date(),
    editById: initialData?.editById ?? 0,
    editDate: initialData?.editDate ?? new Date(),
    createBy: initialData?.createBy ?? "",
    editBy: initialData?.editBy ?? "",
    editVersion: data.editVersion || initialData?.editVersion || 0,
    freshWaterLines: freshWaterLines
      .filter((line) => line.chargeId > 0 && line.uomId > 0)
      .map((line, index) => ({
        itemNo: index + 1,
        chargeId: line.chargeId,
        uomId: line.uomId,
        quantity: line.quantity,
        distance: line.distance ?? 0,
        tallyNo: line.tallyNo || "",
      })),
    launchServiceLines: launchServiceLines
      .filter((line) => line.chargeId > 0)
      .map((line, index) => ({
      itemNo: index + 1,
      chargeId: line.chargeId,
      loadingTime: formatDateTimeForApi(line.loadingTime),
      leftJetty: formatDateTimeForApi(line.leftJetty),
      waitingTime: line.waitingTime ?? 0,
      alongsideVessel: formatDateTimeForApi(line.alongsideVessel),
      departedFromVessel: formatDateTimeForApi(line.departedFromVessel),
      timeDiff: line.timeDiff ?? 0,
      arrivedAtJetty: formatDateTimeForApi(line.arrivedAtJetty),
      deliveredWeight: line.deliveredWeight ?? 0,
      landedWeight: line.landedWeight ?? 0,
      distance: line.distance ?? 0,
      tallyNo: line.tallyNo || "",
    })),
  }
}

export function mapTallyServiceForSave(
  data: ITallyService
): TallyServiceSavePayload {
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
    portId: data.portId,
    addressId: data.addressId || 0,
    contactId: data.contactId || 0,
    gstId: data.gstId,
    gstPercentage: data.gstPercentage,
    isActive: data.isActive ?? true,
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
    bargeId: data.bargeId,
    invoiceId: data.invoiceId ?? 0,
    invoiceNo: data.invoiceNo || "",
    jobStatusId: data.jobStatusId ?? 1,
    remarks: data.remarks || "",
    editVersion: data.editVersion ?? 0,
    freshWaterLines: filterFreshWaterLinesForSave(data.freshWaterLines),
    launchServiceLines: filterLaunchLinesForSave(data.launchServiceLines),
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
    portId: item.portId ?? base.portId,
    addressId: item.addressId ?? base.addressId,
    contactId: item.contactId ?? base.contactId,
    gstId: Number(item.gstId) || base.gstId,
    gstPercentage: item.gstPercentage ?? base.gstPercentage,
    isActive: item.isActive ?? base.isActive,
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
    invoiceId: item.invoiceId ?? base.invoiceId,
    invoiceNo: item.invoiceNo ?? base.invoiceNo,
    jobStatusId: item.jobStatusId ?? base.jobStatusId,
    jobStatusName: item.jobStatusName ?? base.jobStatusName,
    remarks: item.remarks ?? base.remarks,
    createById: item.createById ?? base.createById,
    createDate: item.createDate ?? base.createDate,
    editVersion: item.editVersion ?? base.editVersion,
    freshWaterLines: readTallyServiceLineArray(
      item,
      "freshWaterLines",
      "FreshWaterLines"
    ),
    launchServiceLines: readTallyServiceLineArray(
      item,
      "launchServiceLines",
      "LaunchServiceLines"
    ),
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
