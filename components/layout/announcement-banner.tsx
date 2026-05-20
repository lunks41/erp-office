"use client"

import { useCallback, useEffect, useState } from "react"
import { X, Megaphone, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { NotificationRoutes } from "@/lib/notification-routes"
import { useAuthStore } from "@/stores/auth-store"
import { useSignalR } from "@/hooks/use-signalr"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Announcement {
  announcementId: number
  title: string
  message: string
  isUrgent?: boolean
}

const DISMISSED_KEY = "dismissed_urgent_announcements"

function getDismissedUrgent(): Set<number> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch {
    return new Set()
  }
}

function persistDismissedUrgent(ids: Set<number>) {
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedBanner, setDismissedBanner] = useState<Set<number>>(new Set())
  const [urgentModal, setUrgentModal] = useState<Announcement | null>(null)
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications/GetActiveAnnouncements")
      const data: Announcement[] = res.data?.data ?? res.data ?? []
      if (!Array.isArray(data)) return

      const alreadyDismissed = getDismissedUrgent()
      setAnnouncements(data)

      // Show modal for the first undismissed urgent announcement
      const firstUrgent = data.find(
        (a) => a.isUrgent && !alreadyDismissed.has(a.announcementId)
      )
      if (firstUrgent) setUrgentModal(firstUrgent)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) fetchAnnouncements()
    else if (!isAuthenticated) setAnnouncements([])
  }, [_hasHydrated, isAuthenticated, fetchAnnouncements])

  // Real-time: push new announcement into state and trigger modal if urgent
  useSignalR({
    ReceiveAnnouncement: (payload) => {
      const newAnn: Announcement = {
        announcementId: Date.now(), // temporary id for real-time items
        title: payload.title,
        message: payload.message,
        isUrgent: payload.isUrgent,
      }
      setAnnouncements((prev) => [newAnn, ...prev])
      if (payload.isUrgent) setUrgentModal(newAnn)
    },
  })

  const dismissOnServer = async (id: number) => {
    try {
      await apiClient.post(NotificationRoutes.dismissAnnouncement(id))
    } catch { /* local dismiss still applies */ }
  }

  const dismissUrgentModal = () => {
    if (!urgentModal) return
    void dismissOnServer(urgentModal.announcementId)
    const updated = getDismissedUrgent()
    updated.add(urgentModal.announcementId)
    persistDismissedUrgent(updated)
    setUrgentModal(null)
  }

  const dismissBanner = (id: number) => {
    void dismissOnServer(id)
    setDismissedBanner((prev) => new Set([...prev, id]))
  }

  const bannerItems = announcements.filter(
    (a) => !a.isUrgent && !dismissedBanner.has(a.announcementId)
  )

  return (
    <>
      {/* Urgent announcement modal */}
      <Dialog open={urgentModal != null} onOpenChange={(open) => { if (!open) dismissUrgentModal() }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {urgentModal?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {urgentModal?.message}
          </p>
          <div className="flex justify-end pt-2">
            <Button onClick={dismissUrgentModal}>Acknowledge</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Non-urgent inline banners */}
      {bannerItems.length > 0 && (
        <div className="flex flex-col gap-1">
          {bannerItems.map((a) => (
            <div
              key={a.announcementId}
              className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
            >
              <Megaphone className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{a.title}:</span>
              <span className="flex-1">{a.message}</span>
              <button
                onClick={() => dismissBanner(a.announcementId)}
                className="ml-auto shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
