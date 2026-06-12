"use client"

import type { TallyServiceDisplayLine } from "@/helpers/tally-service-details"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const lineStackClass = "flex min-h-[1.25rem] flex-col justify-center gap-1 py-0.5"

function LineStack({
  lines,
  children,
}: {
  lines: TallyServiceDisplayLine[]
  children: (entry: TallyServiceDisplayLine, index: number) => React.ReactNode
}) {
  if (lines.length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  return (
    <div className={lineStackClass}>
      {lines.map((entry, index) => (
        <div key={`${entry.kind}-${entry.line.itemNo ?? index}`}>
          {children(entry, index)}
        </div>
      ))}
    </div>
  )
}

export function TallyServiceInlineTypeCell({
  lines,
}: {
  lines: TallyServiceDisplayLine[]
}) {
  return (
    <LineStack lines={lines}>
      {(entry) => (
        <Badge
          variant="outline"
          className={cn(
            "h-5 w-fit border px-1.5 text-[10px] font-medium",
            entry.kind === "launch"
              ? "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          )}
        >
          {entry.kind === "launch" ? "Launch" : "Fresh water"}
        </Badge>
      )}
    </LineStack>
  )
}

export function TallyServiceInlineTextCell({
  lines,
  format,
}: {
  lines: TallyServiceDisplayLine[]
  format: (entry: TallyServiceDisplayLine) => string
}) {
  return (
    <LineStack lines={lines}>
      {(entry) => (
        <span className="text-xs leading-tight">{format(entry) || "-"}</span>
      )}
    </LineStack>
  )
}

export function TallyServiceInlineNumberCell({
  lines,
  format,
}: {
  lines: TallyServiceDisplayLine[]
  format: (entry: TallyServiceDisplayLine) => string | number
}) {
  return (
    <LineStack lines={lines}>
      {(entry) => (
        <span className="block text-right text-xs leading-tight tabular-nums">
          {format(entry)}
        </span>
      )}
    </LineStack>
  )
}
