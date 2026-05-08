import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { jwtDecode, refreshToken } from "@/lib/auth-helpers"
import { toast } from "sonner"

const WARNING_SECONDS = 5 * 60       // show warning 5 minutes before expiry
const CHECK_INTERVAL_MS = 10 * 1000  // check every 10 seconds
const ACTIVITY_IDLE_THRESHOLD = 5 * 60 * 1000  // treat user as idle after 5 min no input
const CHANNEL_NAME = "erp_session_expiry"
const LAST_ACTIVITY_KEY = "erp_last_activity"

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"] as const

type ChannelMessage =
  | { type: "MODAL_SHOWN"; timeRemaining: number }
  | { type: "TOKEN_REFRESHED" }
  | { type: "SIGN_OUT" }
  | { type: "ACTIVITY_UPDATE"; lastActivity: number }

const getSecondsUntilExpiry = (token: string): number => {
  const payload = jwtDecode(token)
  if (!payload?.exp) return 0
  return Math.floor((payload.exp * 1000 - Date.now()) / 1000)
}

const getLastActivityAcrossTabs = (): number => {
  try {
    return parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) ?? "0", 10) || 0
  } catch {
    return 0
  }
}

const setLastActivityAcrossTabs = (ts: number) => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(ts))
  } catch {}
}

export function useSessionExpiry() {
  const { token, isAuthenticated, logOut } = useAuthStore()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const modalActiveRef = useRef(false)
  const lastActivityRef = useRef(Date.now())

  const broadcast = useCallback((message: ChannelMessage) => {
    if (typeof window === "undefined") return
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.postMessage(message)
    ch.close()
  }, [])

  // ── Activity tracking ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleActivity = () => {
      const now = Date.now()
      lastActivityRef.current = now
      setLastActivityAcrossTabs(now)
      broadcast({ type: "ACTIVITY_UPDATE", lastActivity: now })
    }

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity))
    }
  }, [broadcast])

  const doSignOut = useCallback(async () => {
    setShowModal(false)
    modalActiveRef.current = false
    broadcast({ type: "SIGN_OUT" })
    await logOut()
    router.push("/login")
  }, [logOut, router, broadcast])

  const handleStaySignedIn = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      const newToken = await refreshToken()
      if (newToken) {
        setShowModal(false)
        modalActiveRef.current = false
        broadcast({ type: "TOKEN_REFRESHED" })
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, broadcast])

  const handleClose = useCallback(() => {}, [])

  // ── Cross-tab communication ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return

    const channel = new BroadcastChannel(CHANNEL_NAME)

    channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
      switch (event.data.type) {
        case "MODAL_SHOWN":
          modalActiveRef.current = true
          setShowModal(false)
          break

        case "TOKEN_REFRESHED":
          setShowModal(false)
          modalActiveRef.current = false
          useAuthStore.persist.rehydrate()
          break

        case "SIGN_OUT":
          setShowModal(false)
          modalActiveRef.current = false
          useAuthStore.getState().logOutSuccess()
          router.push("/login")
          break

        case "ACTIVITY_UPDATE":
          // Sync activity time from other tabs
          lastActivityRef.current = Math.max(lastActivityRef.current, event.data.lastActivity)
          break
      }
    }

    return () => channel.close()
  }, [router])

  // ── Session check interval ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setShowModal(false)
      modalActiveRef.current = false
      return
    }

    const check = async () => {
      const seconds = getSecondsUntilExpiry(token)

      if (seconds <= 0) {
        toast.error("Session Expired", {
          description: "Your session has expired. Please log in again.",
          duration: 3000,
        })
        doSignOut()
        return
      }

      if (seconds > WARNING_SECONDS) {
        // Outside warning window — close any stale modal
        if (modalActiveRef.current) {
          setShowModal(false)
          modalActiveRef.current = false
        }
        return
      }

      // Within warning window — check if user was recently active
      const crossTabActivity = getLastActivityAcrossTabs()
      const lastActivity = Math.max(lastActivityRef.current, crossTabActivity)
      const idleMs = Date.now() - lastActivity

      if (idleMs < ACTIVITY_IDLE_THRESHOLD && !isRefreshing) {
        // User is active → silently auto-refresh, no modal needed
        if (modalActiveRef.current) {
          setShowModal(false)
          modalActiveRef.current = false
        }
        setIsRefreshing(true)
        try {
          const newToken = await refreshToken()
          if (newToken) {
            broadcast({ type: "TOKEN_REFRESHED" })
          }
        } finally {
          setIsRefreshing(false)
        }
        return
      }

      // User is idle → show warning modal
      if (!modalActiveRef.current) {
        modalActiveRef.current = true
        setTimeRemaining(seconds)
        setShowModal(true)
        broadcast({ type: "MODAL_SHOWN", timeRemaining: seconds })
      }
    }

    check()
    const id = setInterval(check, CHECK_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") check()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isAuthenticated, token, doSignOut, broadcast, isRefreshing])

  return {
    showModal,
    timeRemaining,
    isRefreshing,
    onSignOut: doSignOut,
    onStaySignedIn: handleStaySignedIn,
    onCloseAction: handleClose,
  }
}
