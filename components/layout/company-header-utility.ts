import { cn } from "@/lib/utils"

/**
 * Shared pill height used by the remaining left-side header pills.
 */
export const COMPANY_HEADER_PILL_HEIGHT =
  "h-9 min-h-9 max-h-9 py-0 leading-none"

/**
 * Trailing controls: intentionally shorter to match the compact Checklist pill.
 */
export const COMPANY_HEADER_UTILITY_BUTTON = cn(
  "relative inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] border border-border bg-background p-0 text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 dark:text-white dark:hover:text-white"
)

/** Lucide icons in those buttons */
export const COMPANY_HEADER_UTILITY_ICON =
  "size-4 shrink-0 stroke-2 text-current"

/** Small changelog/status indicator dot */
export const COMPANY_HEADER_UTILITY_STATUS_DOT =
  "pointer-events-none absolute -top-1 -right-1 z-10 size-2.5 rounded-full ring-2 ring-background"

/** Notification count badge positioned outside the button corner */
export const COMPANY_HEADER_UTILITY_COUNT_BADGE =
  "absolute -top-1 -right-1 z-10 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none"
