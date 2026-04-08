import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

import { refreshToken } from "@/lib/auth-helpers"

const WARNING_SECONDS = 5 * 60 // show warning 5 minutes before expiry
const CHECK_INTERVAL_MS = 10 * 1000 // check every 10 seconds
const CHANNEL_NAME = "erp_session_expiry"

type ChannelMessage =
  | { type: "MODAL_SHOWN"; timeRemaining: number }
  | { type: "TOKEN_REFRESHED" }
  | { type: "SIGN_OUT" }

const getSecondsUntilExpiry = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return Math.floor((payload.exp * 1000 - Date.now()) / 1000)
  } catch {
    return 0
  }
}

export function useSessionExpiry() {
  const { token, isAuthenticated, logOut } = useAuthStore()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Tracks whether this tab (or another tab) is already handling the warning
  const modalActiveRef = useRef(false)

  // Fire-and-forget broadcast to other tabs (BroadcastChannel doesn't send to itself)
  const broadcast = useCallback((message: ChannelMessage) => {
    if (typeof window === "undefined") return
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.postMessage(message)
    ch.close()
  }, [])

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
        // Tell other tabs: token is refreshed, hide your modals and re-sync
        broadcast({ type: "TOKEN_REFRESHED" })
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, broadcast])

  // No-op: dialog cannot be dismissed without choosing Stay or Sign Out
  const handleClose = useCallback(() => {}, [])

  // ── Cross-tab communication ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return

    const channel = new BroadcastChannel(CHANNEL_NAME)

    channel.onmessage = (event: MessageEvent<ChannelMessage>) => {
      switch (event.data.type) {
        case "MODAL_SHOWN":
          // Another tab is already showing the warning dialog.
          // Suppress our dialog so only one dialog appears across all tabs.
          modalActiveRef.current = true
          setShowModal(false)
          break

        case "TOKEN_REFRESHED":
          // Another tab refreshed the token successfully.
          // Hide our modal and re-hydrate from localStorage to get the new token
          // so our interval check uses the updated expiry time.
          setShowModal(false)
          modalActiveRef.current = false
          useAuthStore.persist.rehydrate()
          break

        case "SIGN_OUT":
          // Another tab signed out — clear local state and redirect.
          // Don't call the full logOut() (API already called by the signing tab).
          setShowModal(false)
          modalActiveRef.current = false
          useAuthStore.getState().logOutSuccess()
          router.push("/login")
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

    const check = () => {
      const seconds = getSecondsUntilExpiry(token)

      // Token already expired → notify and force logout immediately
      if (seconds <= 0) {
        toast.error("Session Expired", {
          description: "Your session has expired. Please log in again.",
          duration: 3000,
        })
        doSignOut()
        return
      }

      // Within warning window and not already handled by any tab → show dialog
      if (seconds <= WARNING_SECONDS && !modalActiveRef.current) {
        modalActiveRef.current = true
        setTimeRemaining(seconds)
        setShowModal(true)
        // Tell other tabs this tab is handling the warning
        broadcast({ type: "MODAL_SHOWN", timeRemaining: seconds })
      }
    }

    check() // immediate check on mount / token change
    const id = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isAuthenticated, token, doSignOut, broadcast])

  return {
    showModal,
    timeRemaining,
    isRefreshing,
    onSignOut: doSignOut,
    onStaySignedIn: handleStaySignedIn,
    onCloseAction: handleClose,
  }
}
