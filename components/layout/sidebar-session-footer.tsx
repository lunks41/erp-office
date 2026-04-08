"use client"

import { Clock, Timer } from "lucide-react"

import { useSessionCountdown } from "@/hooks/use-session-countdown"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const APP_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "AMES ERP"
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"

export function SidebarSessionFooter() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const {
    showFooterCountdown,
    isUrgent,
    isWarning,
    formattedTime,
    sessionDuration,
  } = useSessionCountdown()

  const countdownColor = isUrgent
    ? "text-red-500"
    : isWarning
      ? "text-amber-500"
      : "text-green-500"

  const countdownBg = isUrgent
    ? "bg-red-500/10 border-red-500/20"
    : isWarning
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-green-500/10 border-green-500/20"

  const dotColor = isUrgent
    ? "bg-red-500"
    : isWarning
      ? "bg-amber-500"
      : "bg-green-500"

  // ── Collapsed (icon-only) mode ──────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-2 py-2">
        {showFooterCountdown && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border",
                    countdownBg,
                    isUrgent && "animate-pulse"
                  )}
                >
                  <Clock className={cn("h-4 w-4", countdownColor)} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-mono font-semibold">{formattedTime}</p>
                <p className="text-muted-foreground text-xs">Session expires</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-muted-foreground/50 flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold">
                v{APP_VERSION}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{APP_NAME}</p>
              <p className="text-muted-foreground text-xs">v{APP_VERSION}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  // ── Expanded mode ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-1.5 px-3 py-2">
      {/* Session countdown — only when ≤ 10 min remaining */}
      {showFooterCountdown && (
        <div
          className={cn(
            "flex items-center justify-between rounded-md border px-2.5 py-1.5",
            countdownBg
          )}
        >
          <div className="flex items-center gap-1.5">
            <Clock
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                countdownColor,
                isUrgent && "animate-pulse"
              )}
            />
            <span className={cn("text-xs font-medium", countdownColor)}>
              Session expires
            </span>
          </div>
          <span className={cn("font-mono text-sm font-bold", countdownColor)}>
            {formattedTime}
          </span>
        </div>
      )}

      {/* App info row */}
      <div className="flex items-center justify-between px-0.5">
        {/* App name + version */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor)} />
          <span className="text-muted-foreground truncate text-[11px] font-medium">
            {APP_NAME}
          </span>
          <span className="text-muted-foreground/50 shrink-0 text-[10px]">
            v{APP_VERSION}
          </span>
        </div>

        {/* Session duration */}
        <div className="flex items-center gap-1 shrink-0">
          <Timer className="text-muted-foreground/50 h-3 w-3" />
          <span className="text-muted-foreground/70 text-[10px]">
            {sessionDuration}
          </span>
        </div>
      </div>
    </div>
  )
}
