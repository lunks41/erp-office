"use client"

import type { IEquipmentUsedDt } from "@/interfaces/checklist"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const lineStackClass = "flex min-h-[1.25rem] flex-col justify-center gap-1 py-0.5"

function LineStack({
  lines,
  children,
}: {
  lines: IEquipmentUsedDt[]
  children: (line: IEquipmentUsedDt, index: number) => React.ReactNode
}) {
  if (lines.length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>
  }
  return (
    <div className={lineStackClass}>
      {lines.map((line, index) => (
        <div key={`${line.itemNo ?? index}-${line.isOffloading}`}>
          {children(line, index)}
        </div>
      ))}
    </div>
  )
}

export function EquipmentUsedInlineTypeCell({
  lines,
}: {
  lines: IEquipmentUsedDt[]
}) {
  return (
    <LineStack lines={lines}>
      {(line) => (
        <Badge
          variant="secondary"
          className={cn(
            "h-5 w-fit px-1.5 text-[10px]",
            line.isOffloading
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-primary"
          )}
        >
          {line.isOffloading ? "Offloading" : "Loading"}
        </Badge>
      )}
    </LineStack>
  )
}

export function EquipmentUsedInlineTextCell({
  lines,
  format,
}: {
  lines: IEquipmentUsedDt[]
  format: (line: IEquipmentUsedDt) => string
}) {
  return (
    <LineStack lines={lines}>
      {(line) => <span className="text-xs leading-tight">{format(line)}</span>}
    </LineStack>
  )
}

export function EquipmentUsedInlineNumberCell({
  lines,
  getValue,
}: {
  lines: IEquipmentUsedDt[]
  getValue: (line: IEquipmentUsedDt) => number | null | undefined
}) {
  return (
    <LineStack lines={lines}>
      {(line) => (
        <span className="block text-right text-xs leading-tight tabular-nums">
          {getValue(line) ?? 0}
        </span>
      )}
    </LineStack>
  )
}
