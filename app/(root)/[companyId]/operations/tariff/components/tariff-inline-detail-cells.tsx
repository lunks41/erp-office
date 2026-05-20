"use client"

import type { ITariffDetailLine } from "./tariff-table-utils"
import {
  IconCircleCheckFilled,
  IconSquareRoundedXFilled,
} from "@tabler/icons-react"

import { formatNumber } from "@/lib/format-utils"

const lineStackClass = "flex min-h-[1.25rem] flex-col justify-center gap-1 py-0.5"

function LineStack({
  lines,
  children,
}: {
  lines: ITariffDetailLine[]
  children: (line: ITariffDetailLine, index: number) => React.ReactNode
}) {
  if (lines.length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>
  }
  return (
    <div className={lineStackClass}>
      {lines.map((line, index) => (
        <div key={`${line.itemNo ?? index}-${index}`}>{children(line, index)}</div>
      ))}
    </div>
  )
}

export function TariffInlineNumberCell({
  lines,
  getValue,
  decimals = 2,
}: {
  lines: ITariffDetailLine[]
  getValue: (line: ITariffDetailLine) => number | null | undefined
  decimals?: number
}) {
  return (
    <LineStack lines={lines}>
      {(line) => (
        <span className="block text-right text-xs leading-tight tabular-nums">
          {formatNumber(getValue(line) ?? 0, decimals)}
        </span>
      )}
    </LineStack>
  )
}

export function TariffInlineBooleanCell({
  lines,
  getValue,
}: {
  lines: ITariffDetailLine[]
  getValue: (line: ITariffDetailLine) => boolean | undefined
}) {
  return (
    <LineStack lines={lines}>
      {(line) => (
        <div className="flex justify-center">
          {getValue(line) ? (
            <IconCircleCheckFilled className="h-4 w-4 text-green-500" />
          ) : (
            <IconSquareRoundedXFilled className="h-4 w-4 text-red-500" />
          )}
        </div>
      )}
    </LineStack>
  )
}

export function TariffInlineTextCell({
  lines,
  format,
}: {
  lines: ITariffDetailLine[]
  format: (line: ITariffDetailLine) => string
}) {
  return (
    <LineStack lines={lines}>
      {(line) => (
        <span className="block truncate text-xs leading-tight">{format(line)}</span>
      )}
    </LineStack>
  )
}
