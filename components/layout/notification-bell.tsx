"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, CheckCheck, Info, AlertTriangle, AlertCircle, X } from "lucide-react"
import { useNotificationStore } from "@/stores/notification-store"
import { useAuthStore } from "@/stores/auth-store"
import { useSignalR } from "@/hooks/use-signalr"
import { apiClient } from "@/lib/api-client"

import {
  COMPANY_HEADER_UTILITY_BUTTON,
  COMPANY_HEADER_UTILITY_COUNT_BADGE,
  COMPANY_HEADER_UTILITY_ICON,
} from "@/components/layout/company-header-utility"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type NotifType = "success" | "error" | "info" | "warning"

const TYPE_CONFIG: Record<NotifType, { icon: React.ComponentType<{ className?: string }>; iconClass: string; dotClass: string; bgClass: string }> = {
  error:   { icon: AlertCircle,   iconClass: "text-red-500",     dotClass: "bg-red-500",     bgClass: "bg-red-50 dark:bg-red-950/30" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-500",   dotClass: "bg-amber-500",   bgClass: "bg-amber-50 dark:bg-amber-950/30" },
  info:    { icon: Info,          iconClass: "text-blue-500",    dotClass: "bg-blue-500",    bgClass: "bg-blue-50 dark:bg-blue-950/30" },
  success: { icon: Info,          iconClass: "text-emerald-500", dotClass: "bg-emerald-500", bgClass: "bg-emerald-50 dark:bg-emerald-950/30" },
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (diff < 60_000) return "just now"
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { history, unreadCount, markRead, markAllRead, addFromServer, setFromServer, setUnreadCount } = useNotificationStore()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  // Fetch from backend only after hydration + authenticated — prevents premature
  // calls that would trigger forceLogout before session cookies are verified
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications/getnotifications?pageNumber=1&pageSize=20")
      const items = res.data?.items ?? res.data?.data ?? []
      if (Array.isArray(items)) setFromServer(items)
    } catch { /* silent */ }
  }, [setFromServer])

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) fetchNotifications()
  }, [_hasHydrated, isAuthenticated, fetchNotifications])

  // Mark as read on backend
  const handleMarkRead = async (id: string, notificationId: number) => {
    markRead(id)
    try {
      await apiClient.post("/notifications/markread", { notificationId })
    } catch { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    markAllRead()
    try {
      await apiClient.post("/notifications/markallread", {})
    } catch { /* silent */ }
  }

  // Real-time: receive new notifications and unread count via SignalR
  useSignalR({
    ReceiveNotification: (payload) => {
      addFromServer({
        notificationId: payload.notificationId,
        title: payload.title,
        message: payload.message,
        notificationType: payload.type,
        createdDate: new Date().toISOString(),
        isRead: false,
        readOn: null,
      })
    },
    UnreadCount: (count) => setUnreadCount(count),
  })

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={panelRef} className="relative">
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className={COMPANY_HEADER_UTILITY_BUTTON}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className={COMPANY_HEADER_UTILITY_ICON} />
        {unreadCount > 0 && (
          <span
            className={`${COMPANY_HEADER_UTILITY_COUNT_BADGE} bg-red-500 text-white`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-1.5 py-0.5 text-[10px]">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-6 px-1.5 text-[10px]">
                  <CheckCheck className="mr-1 h-3 w-3" /> All read
                </Button>
              )}
              <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto p-1.5">
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {history.map((item) => {
                  const cfg = TYPE_CONFIG[item.type]
                  const Icon = cfg.icon
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleMarkRead(item.id, item.notificationId)}
                      className={`group relative flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${!item.read ? cfg.bgClass : ""}`}
                    >
                      {!item.read && <span className={`absolute right-2.5 top-3 h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />}
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.iconClass}`} />
                      <div className="min-w-0 flex-1">
                        {"title" in item && (item as { title?: string }).title && (
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {(item as { title?: string }).title}
                          </p>
                        )}
                        <p className={`text-xs leading-snug ${item.read ? "text-slate-500" : "font-medium text-slate-800 dark:text-slate-100"}`}>
                          {item.message}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{formatRelative(item.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
