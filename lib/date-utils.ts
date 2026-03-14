import { format, isValid, parse } from "date-fns"

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return ""

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date))
  } catch {
    return ""
  }
}

export const clientDateTimeFormat = "yyyy-MMM-dd HH:mm:ss.SSS"
//export const clientDateFormat = "yyyy-MM-dd"
export const clientDateFormat = "dd/MM/yyyy"

export const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null
  try {
    // Array of possible date formats to try
    const formats = [
      clientDateFormat, // Default client format (e.g., dd/MM/yyyy)
      "dd/MMM/yyyy", // Support for short month names with slash
      "dd-MMM-yyyy", // Support for short month names with hyphen
      "dd MMM yyyy", // Support for short month names with spaces
      "yyyy-MM-dd", // ISO format: 2025-10-15
      "yyyy-MMM-dd", // API format: 2025-Oct-15
      "dd-MM-yyyy", // Alternative: 15-10-2025
      "MM/dd/yyyy", // US format: 10/15/2025
      "yyyy/MM/dd", // Alternative ISO: 2025/10/15
      clientDateTimeFormat, // yyyy-MMM-dd HH:mm:ss.SSS
    ]

    // Try each format
    for (const format of formats) {
      const date = parse(dateStr, format, new Date())
      if (isValid(date) && !isNaN(date.getTime())) {
        return date
      }
    }

    // If all formats fail, try native Date constructor
    const nativeDate = new Date(dateStr)
    if (isValid(nativeDate) && !isNaN(nativeDate.getTime())) {
      return nativeDate
    }

    return null
  } catch (e) {
    console.error("Error parsing date:", dateStr, e)
    return null
  }
}

export const formatDateWithoutTimezone = (
  date: Date | string | null | undefined
): string | undefined => {
  if (!date) return undefined
  try {
    let dateObj: Date

    if (typeof date === "string") {
      // If it's already a properly formatted ISO string without timezone, return it
      // Check for format: yyyy-MM-ddTHH:mm:ss.SSS (no Z, no +, no timezone offset)
      const hasTimezone =
        date.endsWith("Z") ||
        /[+-]\d{2}:?\d{2}$/.test(date) ||
        /[+-]\d{4}$/.test(date)

      if (date.includes("T") && !hasTimezone) {
        return date
      }

      // Remove timezone info if present (Z, +04:00, -05:00, etc.)
      const cleanedDate = date
        .replace(/Z$/, "") // Remove Z
        .replace(/[+-]\d{2}:?\d{2}$/, "") // Remove +04:00 or +0400
        .replace(/[+-]\d{4}$/, "") // Remove +0400
      dateObj = new Date(cleanedDate)
    } else {
      dateObj = date
    }

    // Validate that we have a proper Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn("Invalid date object:", date)
      return undefined
    }

    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, "0")
    const day = String(dateObj.getDate()).padStart(2, "0")
    const hours = String(dateObj.getHours()).padStart(2, "0")
    const minutes = String(dateObj.getMinutes()).padStart(2, "0")
    const seconds = String(dateObj.getSeconds()).padStart(2, "0")
    const milliseconds = String(dateObj.getMilliseconds()).padStart(3, "0")

    // Return WITHOUT 'Z' suffix - .NET will treat as local time (Dubai timezone)
    // Format: yyyy-MM-ddTHH:mm:ss.SSS (no timezone indicator)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`
  } catch (e) {
    console.error("Error formatting date:", date, e)
    return undefined
  }
}

/**
 * Standardized function to format dates for API calls (date-only)
 * Formats as ISO 8601 date format: yyyy-MM-dd
 *
 * @param date - Date value (Date object, string, null, or undefined)
 * @returns Formatted date string (yyyy-MM-dd) or null
 *
 * @example
 * formatDateForApi(new Date()) // "2025-12-28"
 * formatDateForApi("18/12/2025") // "2025-12-18"
 */
export const formatDateForApi = (
  date: Date | string | null | undefined
): string | null => {
  if (!date) return null

  try {
    let dateObj: Date

    if (typeof date === "string") {
      // If it's already in yyyy-MM-dd format, return it
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date
      }
      // Try parsing the date string
      const parsed = parseDate(date)
      if (!parsed) {
        return null
      }
      dateObj = parsed
    } else {
      dateObj = date
    }

    // Validate that we have a proper Date object
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn("Invalid date object:", date)
      return null
    }

    // Format as yyyy-MM-dd (ISO 8601 date format)
    return format(dateObj, "yyyy-MM-dd")
  } catch (e) {
    console.error("Error formatting date for API:", date, e)
    return null
  }
}

/**
 * Standardized function to format DateTime for API calls (with time)
 * Formats as ISO 8601 DateTime format WITHOUT timezone: yyyy-MM-ddTHH:mm:ss.SSS
 * Used for fields that require both date and time (e.g., launch services, ETA/ETD)
 *
 * NOTE: No 'Z' suffix is added to prevent .NET from converting UTC to local timezone.
 * .NET will treat this as local time (Dubai timezone) and store as-is.
 *
 * @param date - Date value (Date object, string, null, or undefined)
 * @returns Formatted DateTime string (yyyy-MM-ddTHH:mm:ss.SSS) or undefined
 *
 * @example
 * formatDateTimeForApi(new Date()) // "2025-12-28T14:30:00.000"
 * formatDateTimeForApi("18/12/2025 14:30:00") // "2025-12-18T14:30:00.000"
 */
export const formatDateTimeForApi = (
  date: Date | string | null | undefined
): string | undefined => {
  // Use the existing formatDateWithoutTimezone function which already formats as ISO 8601
  return formatDateWithoutTimezone(date)
}

/**
 * Get timestamp for table sorting - handles Date, string (ISO or dd/MM/yyyy), null, undefined
 */
export const getDateTimestamp = (val: unknown): number => {
  if (!val) return 0
  let date: Date | null = null
  if (typeof val === "string") {
    date = parseDate(val)
  } else if (val instanceof Date && isValid(val) && !isNaN(val.getTime())) {
    date = val
  }
  return date ? date.getTime() : 0
}

/**
 * TanStack Table sortingFn for date columns - ensures correct chronological order
 */
export const dateSortingFn = <_T>(
  rowA: { getValue: (columnId: string) => unknown },
  rowB: { getValue: (columnId: string) => unknown },
  columnId: string
): number => {
  const tsA = getDateTimestamp(rowA.getValue(columnId))
  const tsB = getDateTimestamp(rowB.getValue(columnId))
  return tsA - tsB
}
