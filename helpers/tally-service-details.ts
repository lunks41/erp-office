import type {
  ITallyFreshWaterLine,
  ITallyLaunchServiceLine,
  ITallyService,
} from "@/interfaces/tally-service"

export type TallyServiceDisplayLine =
  | { kind: "freshwater"; line: ITallyFreshWaterLine }
  | { kind: "launch"; line: ITallyLaunchServiceLine }

/** Read line arrays from API responses (camelCase or PascalCase). */
export function readTallyServiceLineArray<T>(
  item: Partial<ITallyService> | undefined,
  camelKey: "freshWaterLines" | "launchServiceLines",
  pascalKey: "FreshWaterLines" | "LaunchServiceLines"
): T[] {
  if (!item) return []
  const record = item as Record<string, T[] | undefined>
  const lines = record[camelKey] ?? record[pascalKey]
  return Array.isArray(lines) ? lines : []
}

/** Fresh water lines then launch lines — one stacked block per tally service row. */
export function getDisplayTallyServiceLines(
  item: ITallyService
): TallyServiceDisplayLine[] {
  const freshWater = readTallyServiceLineArray<ITallyFreshWaterLine>(
    item,
    "freshWaterLines",
    "FreshWaterLines"
  ).map((line) => ({ kind: "freshwater" as const, line }))

  const launch = readTallyServiceLineArray<ITallyLaunchServiceLine>(
    item,
    "launchServiceLines",
    "LaunchServiceLines"
  ).map((line) => ({ kind: "launch" as const, line }))

  return [...freshWater, ...launch]
}
