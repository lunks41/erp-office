"use client"

import { useCompanyStore } from "@/stores/company-store"

import { format, parse, isValid } from "date-fns"
import { parseDate } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface AccountDetailsProps {
  createBy: string
  createDate: string
  editBy: string | null
  editDate: string | null
  cancelBy: string | null
  cancelDate: string | null
  appBy: string | null
  appDate: string | null
}

export default function AccountDetails({
  createBy,
  createDate,
  editBy,
  editDate,
  cancelBy,
  cancelDate,
  appBy,
  appDate,
}: AccountDetailsProps) {
  const { decimals } = useCompanyStore()
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Account Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-card rounded-lg border p-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Created By
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {createBy}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {safeFormatDate(createDate, datetimeFormat)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Cancelled By
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {cancelBy || "-"}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {safeFormatDate(cancelDate, datetimeFormat)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="flex justify-center">
              <Separator orientation="vertical" className="h-full" />
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Last Edited By
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {editBy || "-"}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {safeFormatDate(editDate, datetimeFormat)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Approved By
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {appBy || "-"}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {safeFormatDate(appDate, datetimeFormat)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
