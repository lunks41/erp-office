import { cn } from "@/lib/utils"

/**
 * Single height for module pills (Checklist, AR, …) and trailing icon buttons in CompanyAppChrome.
 * Use h-9 everywhere so Radix nav triggers and outline buttons line up.
 */
export const COMPANY_HEADER_PILL_HEIGHT =
  "h-9 min-h-9 max-h-9 py-0 leading-none"

/** Trailing controls: fixed square, same outer height as module pills */
export const COMPANY_HEADER_UTILITY_BUTTON = cn(
  COMPANY_HEADER_PILL_HEIGHT,
  "relative box-border inline-flex w-9 min-w-9 max-w-9 shrink-0 items-center justify-center rounded-md border border-[#C4D6FF] bg-[#E0EAFF] p-0 text-[#3355CC] shadow-xs hover:bg-[#C4D6FF] hover:text-[#3355CC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3355CC]/30"
)

/** Lucide icons in those buttons */
export const COMPANY_HEADER_UTILITY_ICON =
  "size-4 shrink-0 stroke-2 text-current"
