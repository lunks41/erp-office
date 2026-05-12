"use client"

import { useCompanyStore } from "@/stores/company-store"

import { format, isValid, parse } from "date-fns"
import { parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import { Card, CardContent } from "@/components/ui/card"

interface AccountDetailsProps {
  createBy: string
  createDate: string
  editBy: string | null
  editDate: string | null
  cancelBy: string | null
  cancelDate: string | null
  balanceAmt: number
  balanceBaseAmt: number
  paymentAmt: number
  paymentBaseAmt: number
}

export default function AccountDetails({
  createBy,
  createDate,
  editBy,
  editDate,
  cancelBy,
  cancelDate,
  balanceAmt,
  balanceBaseAmt,
  paymentAmt,
  paymentBaseAmt,
}: AccountDetailsProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const safeFormatDate = (
    dateValue: string | Date | null | undefined,
    formatStr = "yyyy-MM-dd HH:mm"
  ) => {
    if (!dateValue) return "" // if null, undefined, or empty

    // If it's already a Date object, use it directly
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? "" : format(dateValue, formatStr)
    }

    // Handle ISO datetime strings (e.g., "2025-11-04T08:29:51.19")
    // Native Date constructor can parse ISO strings correctly
    if (typeof dateValue === "string" && dateValue.includes("T")) {
      const isoDate = new Date(dateValue)
      if (!isNaN(isoDate.getTime())) {
        return format(isoDate, formatStr)
      }
    }

    // Try to parse already-formatted datetime strings (e.g., "dd/MM/yyyy HH:mm:ss")
    // Common datetime formats that might be in the form values
    if (typeof dateValue === "string") {
      const datetimeFormats = [
        "dd/MM/yyyy HH:mm:ss",
        "dd/MM/yyyy HH:mm",
        "MM/dd/yyyy HH:mm:ss",
        "MM/dd/yyyy HH:mm",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd HH:mm",
      ]

      for (const fmt of datetimeFormats) {
        try {
          const parsed = parse(dateValue, fmt, new Date())
          if (isValid(parsed) && !isNaN(parsed.getTime())) {
            return format(parsed, formatStr)
          }
        } catch {
          // Continue to next format
        }
      }
    }

    // Parse the date string using parseDate which handles multiple date formats correctly
    const date = parseDate(dateValue as string)
    return date ? format(date, formatStr) : ""
  }

  const labelClass =
    "text-[10px] font-semibold uppercase leading-none tracking-wide text-muted-foreground dark:text-blue-400"

  const infoBoxClass =
    "bg-card flex flex-col gap-0.5 rounded-md border border-border px-2 py-1.5 shadow-sm"

  return (
    <Card className="gap-0 border-0 bg-transparent py-0 shadow-none">
      <CardContent className="px-2 py-1.5">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className={infoBoxClass}>
            <div className={labelClass}>Created By</div>
            <div className="text-foreground text-xs leading-tight font-medium">
              {createBy || "—"}
            </div>
            <div className="text-muted-foreground text-[11px] leading-tight">
              {safeFormatDate(createDate, datetimeFormat) || "—"}
            </div>
          </div>

          <div className={infoBoxClass}>
            <div className={labelClass}>Edit By</div>
            <div className="text-foreground text-xs leading-tight font-medium">
              {editBy || "—"}
            </div>
            <div className="text-muted-foreground text-[11px] leading-tight">
              {safeFormatDate(editDate, datetimeFormat) || "—"}
            </div>
          </div>

          <div className={infoBoxClass}>
            <div className={labelClass}>Cancelled By</div>
            <div className="text-foreground text-xs leading-tight font-medium">
              {cancelBy || "—"}
            </div>
            <div className="text-muted-foreground text-[11px] leading-tight">
              {safeFormatDate(cancelDate, datetimeFormat) || "—"}
            </div>
          </div>

          <div className={infoBoxClass}>
            <div className={labelClass}>Summary</div>
            <div className="grid grid-cols-3 gap-x-1 gap-y-px text-[11px] leading-tight">
              <div />
              <div className="text-center font-semibold text-muted-foreground dark:text-blue-400">
                TRANS
              </div>
              <div className="text-center font-semibold text-muted-foreground dark:text-blue-400">
                LOCAL
              </div>
              <div className="text-muted-foreground font-medium">Balance</div>
              <div className="text-right font-medium tabular-nums">
                {formatNumber(balanceAmt, amtDec)}
              </div>
              <div className="text-right font-medium tabular-nums">
                {formatNumber(balanceBaseAmt, locAmtDec)}
              </div>
              <div className="text-muted-foreground font-medium">Payment</div>
              <div className="text-right font-medium tabular-nums">
                {formatNumber(paymentAmt, amtDec)}
              </div>
              <div className="text-right font-medium tabular-nums">
                {formatNumber(paymentBaseAmt, locAmtDec)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
