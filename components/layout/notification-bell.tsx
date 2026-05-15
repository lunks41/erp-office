"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, CheckCheck, Info, AlertTriangle, AlertCircle, ClipboardCheck } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NotifType = "success" | "error" | "info" | "warning" | "approval"

const TYPE_CONFIG: Record<NotifType, { icon: React.ComponentType<{ className?: string }>; iconClass: string; dotClass: string; bgClass: string }> = {
  error:    { icon: AlertCircle,    iconClass: "text-red-500",      dotClass: "bg-red-500",      bgClass: "bg-red-50 dark:bg-red-950/30" },
  warning:  { icon: AlertTriangle,  iconClass: "text-amber-500",    dotClass: "bg-amber-500",    bgClass: "bg-amber-50 dark:bg-amber-950/30" },
  info:     { icon: Info,           iconClass: "text-blue-500",     dotClass: "bg-blue-500",     bgClass: "bg-blue-50 dark:bg-blue-950/30" },
  success:  { icon: Info,           iconClass: "text-emerald-500",  dotClass: "bg-emerald-500",  bgClass: "bg-emerald-50 dark:bg-emerald-950/30" },
  approval: { icon: ClipboardCheck, iconClass: "text-violet-500",   dotClass: "bg-violet-500",   bgClass: "bg-violet-50 dark:bg-violet-950/30" },
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
  const [ringing, setRinging] = useState(false)
  const prevUnread = useRef(0)
  const { history, unreadCount, markRead, markAllRead, addFromServer, setFromServer, setUnreadCount } = useNotificationStore()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setRinging(true)
      const t = setTimeout(() => setRinging(false), 2000)
      return () => clearTimeout(t)
    }
    prevUnread.current = unreadCount
  }, [unreadCount])

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
    ReceiveApprovalNotification: (payload) => {
      addFromServer({
        notificationId: payload.approvalRequestId,
        title: payload.title,
        message: payload.message,
        notificationType: "approval",
        createdDate: new Date().toISOString(),
        isRead: false,
        readOn: null,
      })
    },
    UnreadCount: (count) => setUnreadCount(count),
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className={COMPANY_HEADER_UTILITY_BUTTON}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className={`${COMPANY_HEADER_UTILITY_ICON} ${ringing ? "animate-bounce" : ""}`} />
          {unreadCount > 0 && (
            <span
              className={`${COMPANY_HEADER_UTILITY_COUNT_BADGE} bg-red-500 text-white`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-full w-[380px] flex-col overflow-hidden p-0 sm:w-[440px]"
      >
        <SheetHeader className="bg-muted/30 border-b px-4 py-3 pr-12">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <SheetTitle className="flex items-center gap-2 pr-2 text-base font-semibold">
                <Bell className="size-4 shrink-0" />
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="rounded-full px-1.5 py-0.5 text-[10px]"
                >
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 px-2 text-[10px]"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                All read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-1.5">
            {history.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
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
                      {!item.read && (
                        <span
                          className={`absolute right-2.5 top-3 h-1.5 w-1.5 rounded-full ${cfg.dotClass}`}
                        />
                      )}
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.iconClass}`} />
                      <div className="min-w-0 flex-1">
                        {"title" in item &&
                        (item as { title?: string }).title ? (
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {(item as { title?: string }).title}
                          </p>
                        ) : null}
                        <p
                          className={`text-xs leading-snug ${item.read ? "text-slate-500" : "font-medium text-slate-800 dark:text-slate-100"}`}
                        >
                          {item.message}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {formatRelative(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
