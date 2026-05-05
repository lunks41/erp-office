import type { IEquipmentUsed, IEquipmentUsedDt } from "@/interfaces/checklist"
import type { EquipmentUsedSchemaType } from "@/schemas/checklist"

/** One line in `Ser_EquipmentUsedDt` (IsOffloading: false = Loading, true = Offloading). */
export type EquipmentUsedDetailFormValues = NonNullable<
  EquipmentUsedSchemaType["details"]
>[number]

export function defaultEquipmentUsedDetailRows(): EquipmentUsedDetailFormValues[] {
  return [
    {
      itemNo: 0,
      isOffloading: false,
      tallySheetNo: "",
      crane: 0,
      forklift: 0,
      stevedore: 0,
    },
    {
      itemNo: 0,
      isOffloading: true,
      tallySheetNo: "",
      crane: 0,
      forklift: 0,
      stevedore: 0,
    },
  ]
}

function mapApiDetailRows(
  rows: IEquipmentUsedDt[]
): EquipmentUsedDetailFormValues[] {
  return rows.map((d) => ({
    itemNo: d.itemNo ?? 0,
    companyId: d.companyId,
    jobOrderId: d.jobOrderId,
    equipmentUsedId: d.equipmentUsedId,
    isOffloading: !!d.isOffloading,
    tallySheetNo: d.tallySheetNo ?? "",
    crane: d.crane ?? 0,
    forklift: d.forklift ?? 0,
    stevedore: d.stevedore ?? 0,
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
    return defaultEquipmentUsedDetailRows()
  }
  return [
    {
      itemNo: 0,
      isOffloading: false,
      tallySheetNo: data.loadingRefNo ?? "",
      crane: data.craneloading ?? 0,
      forklift: data.forkliftloading ?? 0,
      stevedore: data.stevedoreloading ?? 0,
    },
    {
      itemNo: 0,
      isOffloading: true,
      tallySheetNo: data.offloadingRefNo ?? "",
      crane: data.craneOffloading ?? 0,
      forklift: data.forkliftOffloading ?? 0,
      stevedore: data.stevedoreOffloading ?? 0,
    },
  ]
}

/**
 * Keeps legacy header tally fields in sync with the **first** loading and **first** offloading
 * detail row for APIs that still read `loadingRefNo` / `craneloading` etc. on the header.
 * Full line list remains in `details` for `Ser_EquipmentUsedDt`-style saves.
 */
export function applyLegacySummaryFromDetails(
  data: EquipmentUsedSchemaType
): EquipmentUsedSchemaType {
  const details = data.details ?? []
  const firstLoad = details.find((d) => !d.isOffloading)
  const firstOff = details.find((d) => d.isOffloading)
  return {
    ...data,
    loadingRefNo: firstLoad?.tallySheetNo ?? "",
    craneloading: firstLoad?.crane ?? 0,
    forkliftloading: firstLoad?.forklift ?? 0,
    stevedoreloading: firstLoad?.stevedore ?? 0,
    offloadingRefNo: firstOff?.tallySheetNo ?? "",
    craneOffloading: firstOff?.crane ?? 0,
    forkliftOffloading: firstOff?.forklift ?? 0,
    stevedoreOffloading: firstOff?.stevedore ?? 0,
  }
}
