import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NotificationType = "success" | "error" | "info" | "warning" | "approval"

export interface BackendNotification {
  notificationId: number
  title: string
  message: string
  notificationType: string
  createdDate: string
  isRead: boolean
  readOn: string | null
  referenceType?: string
  referenceId?: number
}

export interface NotificationHistoryItem {
  id: string
  notificationId: number
  title: string
  message: string
  type: NotificationType
  createdAt: number
  read: boolean
}

interface NotificationState {
  history: NotificationHistoryItem[]
  unreadCount: number

  addFromServer: (n: BackendNotification) => void
  setFromServer: (items: BackendNotification[]) => void
  setUnreadCount: (count: number) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearHistory: () => void
}

function typeFromString(t: string | undefined): NotificationType {
  if (!t) return "info"
  const lower = t.toLowerCase()
  if (lower.includes("error") || lower.includes("alert")) return "error"
  if (lower.includes("warn")) return "warning"
  if (lower.includes("success")) return "success"
  if (lower.includes("approv")) return "approval"
  return "info"
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      history: [],
      unreadCount: 0,

      addFromServer: (n) => {
        const item: NotificationHistoryItem = {
          id: `srv-${n.notificationId}`,
          notificationId: n.notificationId,
          title: n.title,
          message: n.message,
          type: typeFromString(n.notificationType),
          createdAt: new Date(n.createdDate).getTime(),
          read: n.isRead,
        }
        set((state) => {
          if (state.history.some((h) => h.id === item.id)) return state
          return {
            history: [item, ...state.history].slice(0, 50),
            unreadCount: item.read ? state.unreadCount : state.unreadCount + 1,
          }
        })
      },

      setFromServer: (items) => {
        const mapped: NotificationHistoryItem[] = items.map((n) => ({
          id: `srv-${n.notificationId}`,
          notificationId: n.notificationId,
          title: n.title,
          message: n.message,
          type: typeFromString(n.notificationType),
          createdAt: new Date(n.createdDate).getTime(),
          read: n.isRead,
        }))
        set({
          history: mapped,
          unreadCount: mapped.filter((h) => !h.read).length,
        })
      },

      setUnreadCount: (count) => set({ unreadCount: count }),

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

      clearHistory: () => set({ history: [], unreadCount: 0 }),
    }),
    {
      name: "notification-history",
      partialize: (state) => ({
        history: state.history,
        unreadCount: state.unreadCount,
      }),
    }
  )
)
