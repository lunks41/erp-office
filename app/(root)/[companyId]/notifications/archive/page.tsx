"use client"

import { useCallback, useEffect, useState } from "react"
import { Archive, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { NotificationRoutes } from "@/lib/notification-routes"
import { NotificationItem } from "@/components/notifications/notification-item"
import type { NotificationHistoryItem } from "@/stores/notification-store"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const PAGE_SIZE = 20

export default function NotificationArchivePage() {
  const [items, setItems] = useState<NotificationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await apiClient.get(
        `${NotificationRoutes.list}?pageNumber=${p}&pageSize=${PAGE_SIZE}&archivedOnly=true&includeArchived=true`
      )
      const raw = res.data?.data ?? res.data?.items ?? []
      const mapped: NotificationHistoryItem[] = raw.map(
        (n: {
          notificationId: number
          title: string
          message: string
          priorityLevel?: number
          createdDate: string
          isRead: boolean
          actionUrl?: string
        }) => ({
          id: `srv-${n.notificationId}`,
          notificationId: n.notificationId,
          title: n.title,
          message: n.message,
          type: "info" as const,
          priorityLevel: n.priorityLevel ?? 1,
          createdAt: new Date(n.createdDate).getTime(),
          read: n.isRead,
          archived: true,
          actionUrl: n.actionUrl,
        })
      )
      setItems(mapped)
      setTotal(res.data?.totalRecords ?? res.data?.totalCount ?? 0)
      setPage(p)
    } catch {
      toast.error("Failed to load archive.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const restore = async (notificationId: number) => {
    try {
      await apiClient.post(NotificationRoutes.restoreArchive, { notificationId })
      toast.success("Restored from archive.")
      fetchPage(page)
    } catch {
      toast.error("Restore failed.")
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="@container mx-auto space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Archive className="h-6 w-6" />
            Notification Archive
          </h1>
          <p className="text-sm text-muted-foreground">
            Archived notifications are hidden from your inbox and unread count.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="../notifications">Back to inbox</Link>
        </Button>
      </div>

      <div className="rounded-lg border">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No archived items.</p>
        ) : (
          <div className="divide-y p-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <NotificationItem item={item} showPriority />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => restore(item.notificationId)}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchPage(page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
