"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useSessionStore } from "@/stores/session-store"

const FOOTER_SHOW_THRESHOLD_SECONDS = 10 * 60 // show footer countdown when ≤ 10 min
const URGENT_THRESHOLD_SECONDS = 5 * 60 // red when < 5 min

const getSecondsUntilExpiry = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return Math.floor((payload.exp * 1000 - Date.now()) / 1000)
  } catch {
    return -1
  }
}

const formatTime = (seconds: number): string => {
  if (seconds < 0) return "--:--"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

const formatDuration = (ms: number): string => {
  if (ms <= 0) return "0m"
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function useSessionCountdown() {
  const { token, isAuthenticated } = useAuthStore()
  const { sessionAnalytics } = useSessionStore()
  const [secondsRemaining, setSecondsRemaining] = useState<number>(-1)
  const [sessionDurationMs, setSessionDurationMs] = useState<number>(0)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSecondsRemaining(-1)
      return
    }

    const update = () => {
      setSecondsRemaining(getSecondsUntilExpiry(token))
      setSessionDurationMs(
        sessionAnalytics?.loginTime ? Date.now() - sessionAnalytics.loginTime : 0
      )
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [isAuthenticated, token, sessionAnalytics?.loginTime])

  const showFooterCountdown =
    secondsRemaining >= 0 && secondsRemaining <= FOOTER_SHOW_THRESHOLD_SECONDS

  const isUrgent = secondsRemaining >= 0 && secondsRemaining < URGENT_THRESHOLD_SECONDS
  const isWarning =
    secondsRemaining >= URGENT_THRESHOLD_SECONDS &&
    secondsRemaining <= FOOTER_SHOW_THRESHOLD_SECONDS

  return {
    secondsRemaining,
    showFooterCountdown,
    isUrgent,
    isWarning,
    formattedTime: formatTime(secondsRemaining),
    sessionDuration: formatDuration(sessionDurationMs),
  }
}
