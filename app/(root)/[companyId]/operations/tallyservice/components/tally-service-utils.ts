import { readTallyServiceLineArray } from "@/helpers/tally-service-details"
import {
  isInvoicePosted,
  isStatusCancelled,
  isStatusConfirmed,
  isStatusPosted,
} from "@/helpers/project"
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

import {
  formatDateForApi,
  formatDateTimeForApi,
  parseDate,
} from "@/lib/date-utils"
import { isValid, parse } from "date-fns"
import { pickNumber, pickString } from "@/lib/overview-row-pickers"
import { OperationsStatus } from "@/lib/operations-utils"

export const TALLY_STATUS_TABS = [
  { value: "All", icon: "📋" },
  { value: "Pending", icon: "⏳" },
  { value: "Confirmed", icon: "✔️" },
  { value: "Posted", icon: "📤" },
  { value: "Cancel", icon: "❌" },
] as const

export type TallyStatusTab = (typeof TALLY_STATUS_TABS)[number]["value"]

/** Document ids as strings in UI — use "0" for new records (checklist invoiceId pattern). */
export function toTallyDocumentId(value?: string | number | null): string {
  if (value === undefined || value === null) return "0"
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "0"
  return trimmed
}

export function hasTallyDocumentId(value?: string | number | null): boolean {
  return Number(toTallyDocumentId(value)) > 0
}

export const TALLY_STATUS_BADGE_CLASSNAME: Record<TallyStatusTab, string> = {
  All: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
  Pending:
    "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300",
  Confirmed:
    "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
  Posted:
    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  Cancel:
    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
}

export const TALLY_STATUS_TAB_CLASSNAME: Record<TallyStatusTab, string> = {
  All: "data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border-b-amber-600 dark:data-[state=active]:bg-amber-950/30 dark:data-[state=active]:text-amber-300 dark:data-[state=active]:border-b-amber-400",
  Pending:
    "data-[state=active]:bg-orange-50 data-[state=active]:text-orange-800 data-[state=active]:border-b-orange-600 dark:data-[state=active]:bg-orange-950/30 dark:data-[state=active]:text-orange-300 dark:data-[state=active]:border-b-orange-400",
  Confirmed:
    "data-[state=active]:bg-green-50 data-[state=active]:text-green-800 data-[state=active]:border-b-green-600 dark:data-[state=active]:bg-green-950/30 dark:data-[state=active]:text-green-300 dark:data-[state=active]:border-b-green-400",
  Posted:
    "data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-b-red-600 dark:data-[state=active]:bg-red-950/30 dark:data-[state=active]:text-red-300 dark:data-[state=active]:border-b-red-400",
  Cancel:
    "data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-b-red-600 dark:data-[state=active]:bg-red-950/30 dark:data-[state=active]:text-red-300 dark:data-[state=active]:border-b-red-400",
}

export function isTallyServiceCancelled(
  item: Pick<ITallyService, "isCancel" | "jobStatusId" | "jobStatusName">
): boolean {
  return (
    item.isCancel === true ||
    isStatusCancelled({
      jobStatusId: item.jobStatusId,
      jobStatusName: item.jobStatusName,
    })
  )
}

export function isTallyServicePosted(
  item: Pick<ITallyService, "jobStatusId" | "jobStatusName" | "isPost">
): boolean {
  if (
    isStatusPosted({
      jobStatusId: item.jobStatusId,
      jobStatusName: item.jobStatusName,
    })
  ) {
    return true
  }

  return (
    isInvoicePosted(item.isPost) &&
    isStatusConfirmed({
      jobStatusId: item.jobStatusId,
      jobStatusName: item.jobStatusName,
    })
  )
}

export function matchesTallyStatusTab(
  item: ITallyService,
  tab: TallyStatusTab
): boolean {
  if (tab === "All") return true
  if (tab === "Cancel") return isTallyServiceCancelled(item)
  if (isTallyServiceCancelled(item)) return false

  switch (tab) {
    case "Pending":
      return item.jobStatusName === OperationsStatus.Pending.toString()
    case "Confirmed":
      return (
        isStatusConfirmed({
          jobStatusId: item.jobStatusId,
          jobStatusName: item.jobStatusName,
        }) && !isTallyServicePosted(item)
      )
    case "Posted":
      return isTallyServicePosted(item)
    default:
      return true
  }
}

export function filterTallyServicesByStatus(
  data: ITallyService[],
  tab: TallyStatusTab
): ITallyService[] {
  if (tab === "All") return data
  return data.filter((item) => matchesTallyStatusTab(item, tab))
}

export function getTallyStatusCounts(
  data: ITallyService[]
): Record<TallyStatusTab, number> {
  return {
    All: data.length,
    Pending: data.filter((item) => matchesTallyStatusTab(item, "Pending"))
      .length,
    Confirmed: data.filter((item) => matchesTallyStatusTab(item, "Confirmed"))
      .length,
    Posted: data.filter((item) => matchesTallyStatusTab(item, "Posted")).length,
    Cancel: data.filter((item) => matchesTallyStatusTab(item, "Cancel"))
      .length,
  }
}

export function getDisplayTallyServiceNo(
  item: Partial<ITallyService> | Record<string, unknown> | null | undefined
): string {
  if (!item) return "-"
  const record = item as Record<string, unknown>
  const no = pickString(record, ["tallyServiceNo", "TallyServiceNo"])
  if (no) return no
  const id = pickNumber(record, ["tallyServiceId", "TallyServiceId"])
  return id > 0 ? `#${id}` : "-"
}

export function resolveDefaultTallyDate(
  serviceDate?: Date | string | null,
  dateFormat?: string
): Date | undefined {
  if (!serviceDate) return undefined
  if (serviceDate instanceof Date) {
    return isValid(serviceDate) ? serviceDate : undefined
  }

  const parsed = parseDate(serviceDate)
  if (parsed) return parsed

  if (dateFormat) {
    const fromFormat = parse(serviceDate, dateFormat, new Date())
    if (isValid(fromFormat)) return fromFormat
  }

  return undefined
}

export function createEmptyFreshWaterLine(
  defaultTallyDate?: Date | string
): TallyFreshWaterLineSchemaType {
  return {
    itemNo: 0,
    chargeId: 0,
    uomId: 0,
    quantity: 1,
    distance: 0,
    tallyNo: "",
    tallyDate: resolveDefaultTallyDate(defaultTallyDate) ?? defaultTallyDate,
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

export function createEmptyLaunchLine(
  defaultTallyDate?: Date | string
): TallyLaunchServiceLineSchemaType {
  return {
    itemNo: 0,
    chargeId: 0,
    waitingTime: 0,
    timeDiff: 0,
    deliveredWeight: 0,
    landedWeight: 0,
    distance: 0,
    tallyNo: "",
    tallyDate: resolveDefaultTallyDate(defaultTallyDate) ?? defaultTallyDate,
  }
}

export function createEmptyTallyService(companyId: number): ITallyService {
  return {
    companyId,
    tallyServiceId: "0",
    tallyServiceNo: "",
    tallyServiceNoSeq: 0,
    referenceNo: "",
    date: "",
    serviceDate: "",
    accountDate: "",
    seriesDate: "",
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
    invoiceId: "0",
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
  tallyServiceNo?: string | null
  tallyServiceNoSeq?: number | null
  referenceNo?: string | null
  serviceDate: string
  accountDate?: string
  seriesDate?: string
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
    chargeId: firstLine?.chargeId ?? 0,
    uomId: firstLine?.uomId ?? 0,
    quantity: firstLine?.quantity ?? 1,
    distance: firstLine?.distance ?? 0,
    tallyNo: firstLine?.tallyNo ?? "",
    tallyDate: firstLine?.tallyDate ?? undefined,
  }
}

export function buildLaunchLineFromTally(
  item?: Partial<ITallyService>
): TallyLaunchServiceLineSchemaType {
  const firstLine = item?.launchServiceLines?.[0]
  return {
    itemNo: 0,
    chargeId: firstLine?.chargeId ?? 0,
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
    tallyDate: firstLine?.tallyDate ?? undefined,
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
    tallyDate: line.tallyDate ?? undefined,
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
    tallyDate: line.tallyDate ?? undefined,
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
  const formattedSeriesDate =
    formatDateForApi(data.seriesDate) || data.seriesDate

  return {
    companyId,
    tallyServiceId: toTallyDocumentId(data.tallyServiceId),
    tallyServiceNo: data.tallyServiceNo?.trim() || "",
    tallyServiceNoSeq: data.tallyServiceNoSeq ?? 0,
    referenceNo: data.referenceNo?.trim() || "",
    date: formattedDate,
    serviceDate: formattedDate,
    accountDate: formattedAccountDate,
    seriesDate: formattedSeriesDate,
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
    bargeId: data.bargeId,
    invoiceId: toTallyDocumentId(data.invoiceId),
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
        tallyDate: formatDateForApi(line.tallyDate) || undefined,
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
      tallyDate: formatDateForApi(line.tallyDate) || undefined,
    })),
  }
}

export function mapTallyServiceForSave(
  data: ITallyService
): TallyServiceSavePayload {
  const serviceDate = String(data.serviceDate || data.date || "")
  const accountDate = String(data.accountDate || serviceDate)
  const seriesDate = String(data.seriesDate || serviceDate)

  const isNewRecord = !hasTallyDocumentId(data.tallyServiceId)

  return {
    tallyServiceId: Number(toTallyDocumentId(data.tallyServiceId)),
    tallyServiceNo: isNewRecord ? "" : data.tallyServiceNo?.trim() || "",
    tallyServiceNoSeq: isNewRecord ? 0 : data.tallyServiceNoSeq ?? 0,
    referenceNo: data.referenceNo?.trim() || "",
    serviceDate,
    accountDate,
    seriesDate,
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
    invoiceId: Number(toTallyDocumentId(data.invoiceId)),
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
  const seriesDate = item.seriesDate ?? serviceDate

  const itemRecord = item as Record<string, unknown>

  return {
    ...base,
    ...item,
    companyId: item.companyId ?? companyId,
    tallyServiceId: toTallyDocumentId(
      pickString(itemRecord, ["tallyServiceId", "TallyServiceId"]) ||
        pickNumber(itemRecord, ["tallyServiceId", "TallyServiceId"])
    ),
    tallyServiceNo: pickString(itemRecord, ["tallyServiceNo", "TallyServiceNo"]),
    tallyServiceNoSeq: pickNumber(itemRecord, [
      "tallyServiceNoSeq",
      "TallyServiceNoSeq",
    ]),
    referenceNo: pickString(itemRecord, ["referenceNo", "ReferenceNo"]),
    date: serviceDate,
    serviceDate,
    accountDate,
    seriesDate,
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
    chargeId:
      item.freshWaterLines?.find((line) => line.chargeId > 0)?.chargeId ??
      item.launchServiceLines?.find((line) => line.chargeId > 0)?.chargeId ??
      item.chargeId ??
      0,
    bargeId: item.bargeId ?? 0,
    uomId:
      item.freshWaterLines?.find((line) => line.uomId > 0)?.uomId ??
      item.uomId ??
      0,
    invoiceId: toTallyDocumentId(
      pickString(itemRecord, ["invoiceId", "InvoiceId"]) ||
        pickNumber(itemRecord, ["invoiceId", "InvoiceId"])
    ),
    invoiceNo: pickString(itemRecord, ["invoiceNo", "InvoiceNo"]),
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
    hasTallyDocumentId(tallyServiceId)
      ? `/${companyId}/operations/tallyservice/${tallyServiceId}`
      : `/${companyId}/operations/tallyservice/new`
  window.open(path, "_blank", "noopener,noreferrer")
}
