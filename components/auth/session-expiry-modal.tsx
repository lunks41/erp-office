"use client"

import { useEffect, useState } from "react"
import { Clock, LogOut, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SessionExpiryModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onStaySignedInAction: () => void
  onSignOutAction: () => void
  timeRemaining: number
  isRefreshing?: boolean
}

export function SessionExpiryModal({
  isOpen,
  onStaySignedInAction,
  onSignOutAction,
  timeRemaining,
  isRefreshing = false,
}: SessionExpiryModalProps) {
  const [countdown, setCountdown] = useState(timeRemaining)

  // Reset countdown when modal opens with a new timeRemaining
  useEffect(() => {
    if (isOpen && timeRemaining > 0) {
      setCountdown(timeRemaining)
    }
  }, [isOpen, timeRemaining])

  // hasCountdown transitions false→true after Effect above sets countdown,
  // which re-triggers the timer effect so the interval actually starts.
  const hasCountdown = countdown > 0

  // Tick down every second; auto-logout when reaches 0
  useEffect(() => {
    if (!isOpen || !hasCountdown) return

    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setTimeout(() => onSignOutAction(), 100)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [isOpen, hasCountdown, onSignOutAction])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const progressPct = timeRemaining > 0 ? (countdown / timeRemaining) * 100 : 0
  const isUrgent = countdown <= 60

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        // Intentionally blocked — user must choose Stay or Logout
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 flex h-12 w-12 animate-pulse items-center justify-center rounded-full">
              <Clock className="text-warning h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Session Expiring Soon
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                Your session is about to expire due to inactivity.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">
                Auto logout in:
              </span>
              <span
                className={`font-mono text-2xl font-bold ${isUrgent ? "text-destructive" : "text-warning"}`}
              >
                {formatTime(countdown)}
              </span>
            </div>
            <div className="bg-muted-foreground/20 mt-3 h-2 w-full overflow-hidden rounded-full">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ease-linear ${isUrgent ? "bg-destructive" : "bg-warning"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Click <strong>Stay Signed In</strong> to continue your session, or{" "}
            <strong>Sign Out</strong> to log out now. If no action is taken, you
            will be logged out automatically.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onSignOutAction}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <Button
            onClick={onStaySignedInAction}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Stay Signed In
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
