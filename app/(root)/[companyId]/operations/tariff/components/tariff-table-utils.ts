import type { ITariff } from "@/interfaces/tariff"

/** One rate tier line under a tariff header (Ser_TariffDt). */
export interface ITariffDetailLine {
  itemNo?: number
  displayRate?: number
  basicRate?: number
  minUnit?: number
  maxUnit?: number
  isAdditional: boolean
  additionalUnit?: number
  additionalRate?: number
  lineDescription?: string
  isCustomDescription?: boolean
  isMultiply?: boolean
}

/** Grouped tariff row: one header with stacked detail lines (equipment-used table pattern). Header flags (e.g. isPrepayment, isViceVersa) come from ITariff. */
export interface ITariffTableRow extends Omit<
  ITariff,
  | "displayRate"
  | "basicRate"
  | "minUnit"
  | "maxUnit"
  | "additionalUnit"
  | "additionalRate"
  | "lineDescription"
  | "isCustomDescription"
  | "isMultiply"
> {
  detailLines: ITariffDetailLine[]
}

function detailLineFromTariff(row: ITariff): ITariffDetailLine {
  return {
    displayRate: row.displayRate,
    basicRate: row.basicRate,
    minUnit: row.minUnit,
    maxUnit: row.maxUnit,
    isAdditional: row.isAdditional,
    additionalUnit: row.additionalUnit,
    additionalRate: row.additionalRate,
    lineDescription: row.lineDescription,
    isCustomDescription: row.isCustomDescription,
    isMultiply: row.isMultiply,
  }
}

/** Merge flat API rows (one row per detail line) into one row per tariff header. */
export function groupTariffRows(data: ITariff[]): ITariffTableRow[] {
  const byTariffId = new Map<number, ITariffTableRow>()

  for (const row of data) {
    const tariffId = row.tariffId
    const existing = byTariffId.get(tariffId)
    const line = detailLineFromTariff(row)

    if (existing) {
      existing.detailLines.push(line)
      continue
    }

    const {
      displayRate: _d,
      basicRate: _b,
      minUnit: _min,
      maxUnit: _max,
      additionalUnit: _au,
      additionalRate: _ar,
      lineDescription: _ld,
      isCustomDescription: _icd,
      isMultiply: _im,
      ...header
    } = row

    byTariffId.set(tariffId, {
      ...header,
      detailLines: [line],
    })
  }

  return Array.from(byTariffId.values())
}

/** Map grouped row back to ITariff for existing page handlers (uses first detail line). */
export function tariffTableRowToTariff(row: ITariffTableRow): ITariff {
  const first = row.detailLines[0]
  return {
    ...row,
    displayRate: first?.displayRate,
    basicRate: first?.basicRate,
    minUnit: first?.minUnit,
    maxUnit: first?.maxUnit,
    isAdditional: first?.isAdditional ?? row.isAdditional,
    additionalUnit: first?.additionalUnit,
    additionalRate: first?.additionalRate,
    lineDescription: first?.lineDescription,
    isCustomDescription: first?.isCustomDescription,
    isMultiply: first?.isMultiply,
  }
}
