"use client"

import { IActiveSession } from "@/interfaces/auth"
import {
  formatRelativeTime,
  formatSessionBrowserLine,
  formatSessionDeviceLine,
  formatSessionLocation,
} from "@/lib/format-session-display"
import { cn } from "@/lib/utils"
import { motion, useReducedMotion } from "framer-motion"
import {
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Monitor,
  Smartphone,
} from "lucide-react"

interface Props {
  sessions: IActiveSession[]
  isLoading?: boolean
  onSignOutOthers: (sessionIds: number[]) => void
  onCancel: () => void
  className?: string
}

function DeviceIcon({ type }: { type?: string }) {
  const mobile =
    type?.toLowerCase() === "mobile" || type?.toLowerCase() === "tablet"
  if (mobile)
    return (
      <Smartphone
        className="h-5 w-5 shrink-0"
        style={{ color: "rgba(16,185,129,0.85)" }}
      />
    )
  return (
    <Monitor
      className="h-5 w-5 shrink-0"
      style={{ color: "rgba(16,185,129,0.85)" }}
    />
  )
}

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(28px)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
}

const SESSION_CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
}

export function ConcurrentSessionPanel({
  sessions,
  isLoading,
  onSignOutOthers,
  onCancel,
  className,
}: Props) {
  const reduceMotion = useReducedMotion()
  const sessionIds = sessions.map((s) => s.sessionId)

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="overflow-hidden rounded-3xl px-8 py-9 sm:px-10" style={CARD_STYLE}>
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0.14) 100%)",
              border: "1px solid rgba(16,185,129,0.3)",
              boxShadow: "0 4px 20px rgba(16,185,129,0.15)",
            }}
          >
            <LogOut className="h-6 w-6" style={{ color: "#10b981" }} />
          </div>

          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#fff" }}
          >
            Already signed in
          </h2>
          <p
            className="mt-2 max-w-sm text-sm leading-relaxed text-balance"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {sessions.length === 1
              ? "Your account is open in another session. End that session to sign in here."
              : `Your account is open in ${sessions.length} other sessions. End them to sign in here.`}
          </p>
        </div>

        <div className="mt-6 flex max-h-52 flex-col gap-2.5 overflow-y-auto pr-0.5">
          {sessions.map((s) => {
            const location = formatSessionLocation(s.ipAddress)
            return (
              <div
                key={s.sessionId}
                className="flex items-start gap-3 rounded-xl p-3.5"
                style={SESSION_CARD_STYLE}
              >
                <DeviceIcon type={s.deviceType} />
                <div className="min-w-0 flex-1 text-left">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.92)" }}
                  >
                    {formatSessionBrowserLine(s)}
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {formatSessionDeviceLine(s)}
                  </p>
                  <div
                    className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    {location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      Active {formatRelativeTime(s.loginAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <motion.button
            type="button"
            disabled={isLoading}
            onClick={() => onSignOutOthers(sessionIds)}
            className={cn(
              "relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-semibold text-white",
              "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            )}
            style={{
              background:
                "linear-gradient(135deg, #10b981 0%, #06b6d4 55%, #6366f1 100%)",
              boxShadow: isLoading
                ? "none"
                : "0 4px 24px rgba(16,185,129,0.35)",
            }}
            whileHover={
              reduceMotion || isLoading ? undefined : { scale: 1.015 }
            }
            whileTap={reduceMotion || isLoading ? undefined : { scale: 0.985 }}
          >
            <span className="relative flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Signing out…" : "Sign out other session & continue"}
            </span>
          </motion.button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full rounded-xl py-2.5 text-sm font-medium transition-colors duration-200 disabled:opacity-50"
            style={{
              color: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.85)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.55)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
            }}
          >
            Back to sign in
          </button>
        </div>

        <p
          className="mt-5 text-center text-xs leading-relaxed"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          Other sessions will be signed out immediately. Unsaved work on those
          devices may be lost.
        </p>
      </div>
    </motion.div>
  )
}
