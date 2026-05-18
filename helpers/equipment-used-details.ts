import { format } from "date-fns"

import type { IEquipmentUsed, IEquipmentUsedDt } from "@/interfaces/checklist"
import type { EquipmentUsedSchemaType } from "@/schemas/checklist"
import { clientDateFormat, parseDate } from "@/lib/date-utils"

/** One line in `Ser_EquipmentUsedDt` (IsOffloading: false = Loading, true = Offloading). */
export type EquipmentUsedDetailFormValues = NonNullable<
  EquipmentUsedSchemaType["details"]
>[number]

/** Detail lines from list/get-by-id (`details` or `data_details`). */
export function getEquipmentUsedDetailLines(
  row?: Pick<IEquipmentUsed, "details" | "data_details">
): IEquipmentUsedDt[] {
  if (!row) return []
  if (row.details && row.details.length > 0) return row.details
  if (row.data_details && row.data_details.length > 0) return row.data_details
  return []
}

/** Detail lines for list display (API lines or legacy header fallback). */
export function getDisplayDetailLines(item: IEquipmentUsed): IEquipmentUsedDt[] {
  const lines = getEquipmentUsedDetailLines(item)
  if (lines.length > 0) return lines
  const legacy = buildEquipmentUsedDetailsFromApi(item)
  return legacy.length > 0 ? (legacy as IEquipmentUsedDt[]) : []
}

export function countEquipmentUsedLinesByType(
  lines: IEquipmentUsedDt[]
): { loading: number; offloading: number } {
  return lines.reduce(
    (acc, line) => {
      if (line.isOffloading) acc.offloading += 1
      else acc.loading += 1
      return acc
    },
    { loading: 0, offloading: 0 }
  )
}

export function formatDetailDateForForm(
  value?: string | Date | null,
  fallback?: string | Date | null
): string {
  if (value) {
    const parsed =
      value instanceof Date
        ? value
        : (parseDate(value) ??
          (Number.isNaN(new Date(value).getTime()) ? null : new Date(value)))
    if (parsed) return format(parsed, clientDateFormat)
  }
  if (fallback) {
    const parsed =
      fallback instanceof Date
        ? fallback
        : (parseDate(fallback) ??
          (Number.isNaN(new Date(fallback).getTime())
            ? null
            : new Date(fallback)))
    if (parsed) return format(parsed, clientDateFormat)
  }
  return format(new Date(), clientDateFormat)
}

/** Empty by default — users add loading/offloading lines explicitly. */
export function defaultEquipmentUsedDetailRows(): EquipmentUsedDetailFormValues[] {
  return []
}

/** Stamp header keys onto each detail row for save API payloads. */
export function mapEquipmentUsedDetailsForSave(
  details: EquipmentUsedDetailFormValues[] | undefined,
  header: {
    equipmentUsedId: number
    jobOrderId?: number
    companyId?: number
  }
): EquipmentUsedDetailFormValues[] {
  return (details ?? []).map((d) => ({
    ...d,
    equipmentUsedId: header.equipmentUsedId,
    jobOrderId: d.jobOrderId ?? header.jobOrderId,
    companyId: d.companyId ?? header.companyId,
  }))
}

function mapApiDetailRows(rows: IEquipmentUsedDt[]): EquipmentUsedDetailFormValues[] {
  return rows.map((d) => ({
    itemNo: d.itemNo ?? 0,
    companyId: d.companyId,
    jobOrderId: d.jobOrderId,
    equipmentUsedId: d.equipmentUsedId,
    isOffloading: !!d.isOffloading,
    date: formatDetailDateForForm(d.date),
    referenceNo: (d.referenceNo ?? "").trim(),
    tallySheetNo: d.tallySheetNo ?? "",
    crane: d.crane ?? 0,
    forklift: d.forklift ?? 0,
    stevedore: d.stevedore ?? 0,
    mafi: (d.mafi ?? "").trim(),
    gear: d.gear ?? 0,
    remarks: (d.remarks ?? "").trim(),
  }))
}

/** Prefer API line list: `details` or `data_details` (get-by-id), else legacy header columns. */
export function buildEquipmentUsedDetailsFromApi(
  data?: IEquipmentUsed
): EquipmentUsedDetailFormValues[] {
  const apiRows =
    data?.details && data.details.length > 0
      ? data.details
      : data?.data_details && data.data_details.length > 0
        ? data.data_details
        : undefined

  if (apiRows && apiRows.length > 0) {
    return mapApiDetailRows(apiRows)
  }
  if (!data) {
    return []
  }
  return [
    {
      itemNo: 0,
      equipmentUsedId: data.equipmentUsedId ?? 0,
      jobOrderId: data.jobOrderId,
      companyId: data.companyId,
      isOffloading: false,
      date: formatDetailDateForForm(),
      referenceNo: "",
      tallySheetNo: data.loadingRefNo ?? "",
      crane: data.craneloading ?? 0,
      forklift: data.forkliftloading ?? 0,
      stevedore: data.stevedoreloading ?? 0,
      mafi: data.mafi ?? "",
      gear: data.gear ?? 0,
      remarks: data.remarks ?? "",
    },
    {
      itemNo: 0,
      equipmentUsedId: data.equipmentUsedId ?? 0,
      jobOrderId: data.jobOrderId,
      companyId: data.companyId,
      isOffloading: true,
      date: formatDetailDateForForm(),
      referenceNo: "",
      tallySheetNo: data.offloadingRefNo ?? "",
      crane: data.craneOffloading ?? 0,
      forklift: data.forkliftOffloading ?? 0,
      stevedore: data.stevedoreOffloading ?? 0,
      mafi: data.mafi ?? "",
      gear: data.gear ?? 0,
      remarks: data.remarks ?? "",
    },
  ]
}

/** Defaults for clone: first detail line, else API summary fields from list/get-by-id. */
function formatDateRangeLabel(
  lines: IEquipmentUsedDt[],
  formatDate: (value: unknown) => string
): string {
  const dates = lines
    .map((l) => l.date)
    .filter((d): d is string | Date => d != null && d !== "")
  if (dates.length === 0) return ""
  const formatted = dates.map((d) => formatDate(d)).filter((d) => d !== "-")
  if (formatted.length === 0) return ""
  if (formatted.length === 1) return formatted[0]
  const sorted = [...formatted].sort()
  if (sorted[0] === sorted[sorted.length - 1]) return sorted[0]
  return `${sorted[0]}–${sorted[sorted.length - 1]}`
}

/** `REF | TALLY, REF | TALLY : Remarks` for lookups / transportation labels. */
export function formatEquipmentUsedServiceItemLabel(
  lines: Pick<IEquipmentUsedDt, "referenceNo" | "tallySheetNo" | "remarks">[],
  remarks?: string | null
): string {
  const pairs = lines
    .map((line) => {
      const ref = (line.referenceNo ?? "").trim() || "-"
      const tally = (line.tallySheetNo ?? "").trim() || "-"
      return `${ref} | ${tally}`
    })
    .filter(Boolean)
  const body = pairs.join(", ")
  const lineRemarks = lines
    .map((l) => (l.remarks ?? "").trim())
    .filter(Boolean)
    .join("; ")
  const note = (remarks ?? lineRemarks).trim()
  if (!body) return note
  return note ? `${body} : ${note}` : body
}

/** Summary for list row: counts and optional date span per type. */
export function formatEquipmentUsedLinesSummary(
  lines: IEquipmentUsedDt[],
  formatDate: (value: unknown) => string
): string {
  if (lines.length === 0) return ""
  const { loading, offloading } = countEquipmentUsedLinesByType(lines)
  const parts: string[] = []
  if (loading > 0) {
    const range = formatDateRangeLabel(
      lines.filter((l) => !l.isOffloading),
      formatDate
    )
    parts.push(`${loading} loading${range ? ` · ${range}` : ""}`)
  }
  if (offloading > 0) {
    const range = formatDateRangeLabel(
      lines.filter((l) => l.isOffloading),
      formatDate
    )
    parts.push(`${offloading} offloading${range ? ` · ${range}` : ""}`)
  }
  return parts.join(" · ")
}

export function getEquipmentUsedCloneDetailDefaults(data?: IEquipmentUsed): {
  date?: string
  referenceNo?: string
} {
  const firstLine =
    data?.data_details?.[0] ?? data?.details?.[0] ?? undefined
  return {
    date: firstLine?.date
      ? formatDetailDateForForm(firstLine.date)
      : formatDetailDateForForm(data?.date),
    referenceNo: (firstLine?.referenceNo ?? data?.referenceNo ?? "").trim(),
  }
}

/**
 * Keeps legacy header tally fields in sync with the **first** loading and **first** offloading
 * detail row for APIs that still read `loadingRefNo` / `craneloading` etc. on the header.
 * Full line list remains in `details` for `Ser_EquipmentUsedDt`-style saves.
 */
export function applyLegacySummaryFromDetails(
  data: EquipmentUsedSchemaType
): EquipmentUsedSchemaType & { date?: string; referenceNo?: string } {
  const details = data.details ?? []
  const firstLoad = details.find((d) => !d.isOffloading)
  const firstOff = details.find((d) => d.isOffloading)
  const firstLine =
    details.find((d) => d.date?.trim()) ?? details[0]
  const firstReference =
    details.find((d) => (d.referenceNo ?? "").trim()) ?? details[0]
  return {
    ...data,
    /** Legacy header fields for APIs that still validate `SaveEquipmentUsedViewModel.ReferenceNo`. */
    date: firstLine?.date ?? formatDetailDateForForm(),
    referenceNo: (firstReference?.referenceNo ?? "").trim(),
    loadingRefNo: firstLoad?.tallySheetNo ?? "",
    craneloading: firstLoad?.crane ?? 0,
    forkliftloading: firstLoad?.forklift ?? 0,
    stevedoreloading: firstLoad?.stevedore ?? 0,
    offloadingRefNo: firstOff?.tallySheetNo ?? "",
    craneOffloading: firstOff?.crane ?? 0,
    forkliftOffloading: firstOff?.forklift ?? 0,
    stevedoreOffloading: firstOff?.stevedore ?? 0,
    mafi: (firstLine?.mafi ?? "").trim(),
    gear: firstLine?.gear ?? 0,
    remarks: (firstLine?.remarks ?? "").trim(),
  }
}
