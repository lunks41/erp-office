/**
 * Dapper/overview rows often serialize with PascalCase keys (Newtonsoft + ExpandoObject).
 * Use case-insensitive lookups so SqlResponse rows map reliably to UI fields.
 */

export type OverviewAnyRecord = Record<string, unknown>

export const isOverviewPlainRecord = (value: unknown): value is OverviewAnyRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export const overviewRowAsNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const valueFromRecordInsensitive = (
  obj: OverviewAnyRecord,
  keys: string[],
): unknown => {
  const byLower = new Map<string, unknown>()
  for (const [k, v] of Object.entries(obj)) {
    byLower.set(k.toLowerCase(), v)
  }
  for (const key of keys) {
    const v = byLower.get(key.toLowerCase())
    if (v !== undefined && v !== null && v !== "") {
      return v
    }
  }
  return undefined
}

export const pickNumber = (obj: OverviewAnyRecord, keys: string[]): number => {
  const v = valueFromRecordInsensitive(obj, keys)
  return v === undefined ? 0 : overviewRowAsNumber(v)
}

export const pickString = (
  obj: OverviewAnyRecord,
  keys: string[],
  fallback = "",
): string => {
  const v = valueFromRecordInsensitive(obj, keys)
  if (typeof v === "string" && v.trim()) {
    return v.trim()
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(v)
  }
  return fallback
}
