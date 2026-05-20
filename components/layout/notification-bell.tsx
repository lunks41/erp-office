"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import {
  useNotificationStore,
  parseNotificationListResponse,
  parseUnreadCountResponse,
  countUnreadFromHistory,
  type UserNotificationPreferences,
} from "@/stores/notification-store"
import { useAuthStore } from "@/stores/auth-store"
import { useSignalR } from "@/hooks/use-signalr"
import { apiClient } from "@/lib/api-client"
import { NotificationRoutes } from "@/lib/notification-routes"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { COMPANY_HEADER_UTILITY_BUTTON } from "@/components/layout/company-header-utility"

export function NotificationBell() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")
  const [ringing, setRinging] = useState(false)
  const prevUnread = useRef(0)
  const {
    history,
    unreadCount,
    preferences,
    markRead,
    markAllRead,
    addFromServer,
    setFromServer,
    setUnreadCount,
    setPreferences,
  } = useNotificationStore()
  const { isAuthenticated, _hasHydrated: authHydrated } = useAuthStore()
  const setHasHydrated = useNotificationStore((s) => s.setHasHydrated)

  useEffect(() => {
    if (useNotificationStore.persist.hasHydrated()) {
      setHasHydrated(true)
      return
    }
    return useNotificationStore.persist.onFinishHydration(() => {
      setHasHydrated(true)
    })
  }, [setHasHydrated])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get(
        `${NotificationRoutes.list}?pageNumber=1&pageSize=20`
      )
      const items = parseNotificationListResponse(res)
      setFromServer(items)
      setUnreadCount(countUnreadFromHistory(
        items.map((n) => ({
          read: n.isRead,
          archived: n.isArchived,
        }))
      ))
    } catch {
      /* silent */
    }
  }, [setFromServer, setUnreadCount])

  const syncUnreadFromHistory = useCallback(() => {
    setUnreadCount(countUnreadFromHistory(useNotificationStore.getState().history))
  }, [setUnreadCount])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get(NotificationRoutes.unreadCount)
      const count = parseUnreadCountResponse(res)
      if (count !== null) {
        setUnreadCount(count)
        return
      }
    } catch {
      /* use history fallback below */
    }
    syncUnreadFromHistory()
  }, [setUnreadCount, syncUnreadFromHistory])

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await apiClient.get(NotificationRoutes.preferencesV2)
      const data = (res.data as { data?: unknown })?.data ?? res.data
      if (data && typeof data === "object")
        setPreferences(data as UserNotificationPreferences)
    } catch {
      /* silent */
    }
  }, [setPreferences])

  const refreshAll = useCallback(async () => {
    await fetchNotifications()
    await fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    if (authHydrated && isAuthenticated) {
      void refreshAll()
      void fetchPreferences()
    }
  }, [authHydrated, isAuthenticated, refreshAll, fetchPreferences])

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setRinging(true)
      const t = setTimeout(() => setRinging(false), 2000)
      prevUnread.current = unreadCount
      return () => clearTimeout(t)
    }
    prevUnread.current = unreadCount
  }, [unreadCount])

  const showToast = useCallback(
    (title: string, message: string, priorityLevel?: number) => {
      if (preferences && !preferences.isPopupEnabled) return
      const level = priorityLevel ?? 1
      if (level >= 3) toast.error(title, { description: message })
      else if (level >= 2) toast.warning(title, { description: message })
      else toast.info(title, { description: message })
    },
    [preferences]
  )

  const handleMarkRead = async (id: string, notificationId: number) => {
    markRead(id)
    try {
      await apiClient.post(NotificationRoutes.markRead, { notificationId })
      await fetchUnreadCount()
    } catch {
      /* silent */
    }
  }

  const handleMarkAllRead = async () => {
    markAllRead()
    try {
      await apiClient.post(NotificationRoutes.markAllRead, {})
      setUnreadCount(0)
    } catch {
      /* silent */
    }
  }

  useSignalR({
    ReceiveNotification: (payload) => {
      const isNew = addFromServer({
        notificationId: payload.notificationId,
        title: payload.title,
        message: payload.message,
        notificationType: payload.notificationType ?? payload.type,
        priorityLevel: payload.priorityLevel ?? 1,
        createdDate: payload.createdDate ?? new Date().toISOString(),
        isRead: payload.isRead ?? false,
        readOn: null,
        actionUrl: payload.actionUrl,
      })
      if (isNew) {
        showToast(payload.title, payload.message, payload.priorityLevel)
        void fetchUnreadCount()
      }
    },
    UnreadCount: (count) => setUnreadCount(count),
    ReceiveAnnouncement: (payload) => {
      if (preferences?.isAnnouncementEnabled === false) return
      addFromServer({
        notificationId: payload.announcementId ?? Date.now(),
        title: payload.title,
        message: payload.message,
        notificationType: payload.isUrgent ? "warning" : "info",
        priorityLevel: payload.isUrgent ? 3 : 1,
        createdDate: new Date().toISOString(),
        isRead: false,
        readOn: null,
      })
      showToast(payload.title, payload.message, payload.isUrgent ? 3 : 1)
    },
    ReceiveApprovalNotification: (payload) => {
      addFromServer({
        notificationId: payload.approvalRequestId,
        title: payload.title,
        message: payload.message,
        notificationType: "approval",
        priorityLevel: 2,
        createdDate: new Date().toISOString(),
        isRead: false,
        readOn: null,
      })
      showToast(payload.title, payload.message, 2)
    },
    NotificationMarkedAsRead: (notificationUserId) => {
      markRead(`srv-${notificationUserId}`)
      void fetchUnreadCount()
    },
  })

  return (
    <NotificationDropdown
      companyId={companyId}
      history={history}
      unreadCount={unreadCount}
      ringing={ringing}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      onOpenChange={(open) => {
        if (open) void refreshAll()
      }}
      triggerClassName={COMPANY_HEADER_UTILITY_BUTTON}
    />
  )
}
