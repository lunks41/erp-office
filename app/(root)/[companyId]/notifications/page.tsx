"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useCompanyStore } from "@/stores/company-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"

interface NotificationItem {
  notificationId: number
  title: string
  message: string
  createdDate: string
  isRead: boolean
  readOn: string | null
}

const PAGE_SIZE = 20

function formatDate(dateStr: string, _fmt: string) {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm")
  } catch {
    return dateStr
  }
}

export default function NotificationsPage() {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat ?? "dd/MM/yyyy HH:mm:ss"

  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPage = useCallback(async (p: number) => {
    setIsLoading(true)
    try {
      const res = await apiClient.get(
        `/notifications/getnotifications?pageNumber=${p}&pageSize=${PAGE_SIZE}`
      )
      setItems(res.data?.data ?? res.data?.items ?? [])
      setTotal(res.data?.totalRecords ?? res.data?.totalCount ?? 0)
      setPage(p)
    } catch {
      toast.error("Failed to load notifications.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const handleMarkRead = async (id: number) => {
    try {
      await apiClient.post("/notifications/markread", { notificationId: id })
      setItems((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      )
    } catch { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post("/notifications/markallread", {})
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success("All notifications marked as read.")
    } catch {
      toast.error("Failed to mark all as read.")
    }
  }

  const unread = items.filter((n) => !n.isRead).length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm">
            Your full notification history.
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPage(page)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-40" />
            <p className="text-sm">No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((n) => (
              <div
                key={n.notificationId}
                className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                  !n.isRead ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                }`}
                onClick={() => !n.isRead && handleMarkRead(n.notificationId)}
              >
                <div
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                    !n.isRead ? "bg-blue-500" : "bg-transparent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  {n.title && (
                    <p className="text-sm font-semibold">{n.title}</p>
                  )}
                  <p
                    className={`text-sm ${
                      n.isRead ? "text-muted-foreground" : ""
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(n.createdDate, datetimeFormat)}
                  </p>
                </div>
                {!n.isRead && (
                  <Badge variant="secondary" className="mt-0.5 shrink-0 text-[10px]">
                    New
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} notification{total !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => fetchPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
