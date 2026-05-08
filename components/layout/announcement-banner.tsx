"use client"

import { useCallback, useEffect, useState } from "react"
import { X, Megaphone } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Announcement {
  announcementId: number
  title: string
  message: string
  isUrgent?: boolean
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications/GetActiveAnnouncements")
      const data = res.data?.data ?? res.data ?? []
      if (Array.isArray(data)) setAnnouncements(data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const visible = announcements.filter((a) => !dismissed.has(a.announcementId))
  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      {visible.map((a) => (
        <div
          key={a.announcementId}
          className={`flex items-center gap-3 px-4 py-2 text-sm ${
            a.isUrgent
              ? "bg-red-600 text-white"
              : "bg-amber-50 text-amber-900 border-b border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800"
          }`}
        >
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{a.title}:</span>
          <span className="flex-1">{a.message}</span>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, a.announcementId]))}
            className="ml-auto shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
