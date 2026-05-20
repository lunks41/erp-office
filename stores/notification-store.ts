import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NotificationType = "success" | "error" | "info" | "warning" | "approval"

export interface BackendNotification {
  notificationId: number
  title: string
  message: string
  notificationType?: string
  priorityLevel?: number
  createdDate: string
  isRead: boolean
  isArchived?: boolean
  readOn: string | null
  referenceType?: string
  referenceId?: number
  actionUrl?: string
  payloadJson?: string
}

export interface NotificationHistoryItem {
  id: string
  notificationId: number
  title: string
  message: string
  type: NotificationType
  priorityLevel: number
  createdAt: number
  read: boolean
  archived?: boolean
  actionUrl?: string
}

export interface UserNotificationPreferences {
  isPopupEnabled: boolean
  isEmailEnabled: boolean
  isAnnouncementEnabled: boolean
  isSoundEnabled: boolean
  isFinanceEnabled: boolean
  isHrEnabled: boolean
  isOperationEnabled: boolean
  quietHoursFrom?: string | null
  quietHoursTo?: string | null
}

interface NotificationState {
  history: NotificationHistoryItem[]
  unreadCount: number
  preferences: UserNotificationPreferences | null
  seenIds: string[]
  _hasHydrated: boolean

  setHasHydrated: (value: boolean) => void
  add: (message: string, type?: NotificationType, title?: string) => void
  addFromServer: (n: BackendNotification) => boolean
  setFromServer: (items: BackendNotification[]) => void
  setUnreadCount: (count: number) => void
  setPreferences: (prefs: UserNotificationPreferences) => void
  markRead: (id: string) => void
  markAllRead: () => void
  removeItem: (id: string) => void
  clearHistory: () => void
}

function typeFromString(t: string | undefined): NotificationType {
  if (!t) return "info"
  const lower = t.toLowerCase()
  if (lower.includes("error") || lower.includes("alert") || lower.includes("critical"))
    return "error"
  if (lower.includes("warn")) return "warning"
  if (lower.includes("success") || lower.includes("approv")) return lower.includes("approv") ? "approval" : "success"
  if (lower.includes("approv")) return "approval"
  return "info"
}

function priorityToType(level?: number): NotificationType {
  if (level === 3) return "error"
  if (level === 2) return "warning"
  return "info"
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      history: [],
      unreadCount: 0,
      preferences: null,
      seenIds: [],
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      add: (message, type = "info", title = "Notification") => {
        const item: NotificationHistoryItem = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          notificationId: 0,
          title,
          message,
          type,
          priorityLevel: type === "error" ? 3 : type === "warning" ? 2 : 1,
          createdAt: Date.now(),
          read: false,
        }
        set((state) => ({
          history: [item, ...state.history].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        }))
      },

      addFromServer: (n) => {
        const id = `srv-${n.notificationId}`
        if (get().seenIds.includes(id)) return false

        const item: NotificationHistoryItem = {
          id,
          notificationId: n.notificationId,
          title: n.title,
          message: n.message,
          type: typeFromString(n.notificationType) ?? priorityToType(n.priorityLevel),
          priorityLevel: n.priorityLevel ?? 1,
          createdAt: new Date(n.createdDate).getTime(),
          read: n.isRead,
          archived: n.isArchived,
          actionUrl: n.actionUrl,
        }

        const nextSeen = [...get().seenIds, id].slice(-500)

        set((state) => {
          if (state.history.some((h) => h.id === item.id)) return state
          return {
            history: [item, ...state.history].slice(0, 100),
            unreadCount: item.read ? state.unreadCount : state.unreadCount + 1,
            seenIds: nextSeen,
          }
        })
        return true
      },

      setFromServer: (items) => {
        const mapped: NotificationHistoryItem[] = items.map((n) => ({
          id: `srv-${n.notificationId}`,
          notificationId: n.notificationId,
          title: n.title,
          message: n.message,
          type: typeFromString(n.notificationType) ?? priorityToType(n.priorityLevel),
          priorityLevel: n.priorityLevel ?? 1,
          createdAt: new Date(n.createdDate).getTime(),
          read: n.isRead,
          archived: n.isArchived,
          actionUrl: n.actionUrl,
        }))
        set({
          history: mapped,
          unreadCount: mapped.filter((h) => !h.read && !h.archived).length,
          seenIds: mapped.map((m) => m.id),
        })
      },

      setUnreadCount: (count) => set({ unreadCount: count }),
      setPreferences: (prefs) => set({ preferences: prefs }),

      markRead: (id) =>
        set((state) => {
          const item = state.history.find((h) => h.id === id)
          if (!item || item.read) return state
          return {
            history: state.history.map((h) => (h.id === id ? { ...h, read: true } : h)),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        }),

      markAllRead: () =>
        set((state) => ({
          history: state.history.map((h) => ({ ...h, read: true })),
          unreadCount: 0,
        })),

      removeItem: (id) =>
        set((state) => {
          const item = state.history.find((h) => h.id === id)
          return {
            history: state.history.filter((h) => h.id !== id),
            unreadCount:
              item && !item.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          }
        }),

      clearHistory: () => set({ history: [], unreadCount: 0, seenIds: [] }),
    }),
    {
      name: "notification-history",
      // Do not persist history/unread — avoids empty dropdown + stale badge after rehydrate
      partialize: (state) => ({
        preferences: state.preferences,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

function normalizeBackendNotification(raw: Record<string, unknown>): BackendNotification {
  const isRead = raw.isRead ?? raw.IsRead
  const created = raw.createdDate ?? raw.CreatedDate
  return {
    notificationId: Number(raw.notificationId ?? raw.NotificationId ?? 0),
    title: String(raw.title ?? raw.Title ?? ""),
    message: String(raw.message ?? raw.Message ?? ""),
    notificationType: (raw.notificationType ?? raw.NotificationType) as string | undefined,
    priorityLevel: Number(raw.priorityLevel ?? raw.PriorityLevel ?? 1),
    createdDate: typeof created === "string" ? created : new Date().toISOString(),
    isRead: isRead === true || isRead === 1 || isRead === "true",
    isArchived: Boolean(raw.isArchived ?? raw.IsArchived),
    readOn: (raw.readOn ?? raw.ReadOn ?? null) as string | null,
    actionUrl: (raw.actionUrl ?? raw.ActionUrl) as string | undefined,
    payloadJson: (raw.payloadJson ?? raw.PayloadJson) as string | undefined,
  }
}

/** Parse getnotifications API body (supports multiple proxy/backend shapes). */
export function parseNotificationListResponse(res: { data?: unknown }): BackendNotification[] {
  const body = res.data as Record<string, unknown> | unknown[] | undefined
  if (!body) return []
  if (Array.isArray(body)) {
    return body.map((row) =>
      normalizeBackendNotification(row as Record<string, unknown>)
    )
  }
  if (typeof body !== "object" || body === null) return []

  const obj = body as Record<string, unknown>
  const nested = obj.data
  if (Array.isArray(nested)) {
    return nested.map((row) =>
      normalizeBackendNotification(row as Record<string, unknown>)
    )
  }
  if (typeof nested === "object" && nested !== null) {
    const inner = nested as Record<string, unknown>
    if (Array.isArray(inner.items)) {
      return inner.items.map((row) =>
        normalizeBackendNotification(row as Record<string, unknown>)
      )
    }
    if (Array.isArray(inner.data)) {
      return inner.data.map((row) =>
        normalizeBackendNotification(row as Record<string, unknown>)
      )
    }
  }
  if (Array.isArray(obj.items)) {
    return obj.items.map((row) =>
      normalizeBackendNotification(row as Record<string, unknown>)
    )
  }
  return []
}

/** Parse unreadcount API body ({ result, data: number }). */
export function parseUnreadCountResponse(res: { data?: unknown }): number | null {
  const body = res.data
  if (typeof body === "number") return body
  if (typeof body === "string" && body.trim() !== "" && !Number.isNaN(Number(body))) {
    return Number(body)
  }
  if (typeof body !== "object" || body === null) return null
  const obj = body as Record<string, unknown>
  const nested = obj.data ?? obj.unreadCount ?? obj.UnreadCount
  if (typeof nested === "number") return nested
  if (typeof nested === "string" && !Number.isNaN(Number(nested))) return Number(nested)
  return null
}

export function countUnreadFromHistory(
  history: Pick<NotificationHistoryItem, "read" | "archived">[]
): number {
  return history.filter((h) => !h.read && !h.archived).length
}
