import { ITariffRPT } from "@/interfaces"

import { utils, writeFile } from "@/lib/xlsx-compat"

const TARIFF_EXPORT_COLUMNS: {
  key: keyof ITariffRPT
  label: string
}[] = [
  { key: "taskName", label: "Task" },
  { key: "portName", label: "Port" },
  { key: "chargeName", label: "Charge" },
  { key: "visaName", label: "Visa" },
  { key: "uomName", label: "UOM" },
  { key: "fromTransportLocationName", label: "From Location" },
  { key: "toTransportLocationName", label: "To Location" },
  { key: "isPrepayment", label: "Is Prepayment" },
  { key: "prepaymentPercentage", label: "Prepayment %" },
  { key: "isViceVersa", label: "Vice Versa" },
  { key: "displayRate", label: "Display Rate" },
  { key: "basicRate", label: "Basic Rate" },
  { key: "minUnit", label: "Min Unit" },
  { key: "maxUnit", label: "Max Unit" },
  { key: "additionalUnit", label: "Additional Unit" },
  { key: "additionalRate", label: "Additional Rate" },
  { key: "isCustomDescription", label: "Custom Description" },
  { key: "lineDescription", label: "Line Description" },
  { key: "isMultiply", label: "Is Multiply" },
]

function normalizeExportValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return ""
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return value
  return String(value)
}

export function mapTariffRptToExportRows(data: ITariffRPT[]) {
  return data.map((row) => {
    const exportRow: Record<string, string | number | boolean> = {}
    for (const column of TARIFF_EXPORT_COLUMNS) {
      exportRow[column.label] = normalizeExportValue(row[column.key])
    }
    return exportRow
  })
}

export async function downloadTariffExcel(data: ITariffRPT[], filename: string) {
  const workbook = utils.book_new()
  const worksheet = utils.json_to_sheet(mapTariffRptToExportRows(data))
  utils.book_append_sheet(workbook, worksheet, "Tariff Rates")
  await writeFile(workbook, filename)
}
