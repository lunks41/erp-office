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
          variant="secondary"
          className={cn(
            "h-5 w-fit px-1.5 text-[10px]",
            entry.kind === "launch"
              ? "bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-100"
              : "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/50 dark:text-cyan-100"
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
