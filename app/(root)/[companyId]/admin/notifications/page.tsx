"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart3, Bell, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { NotificationRoutes } from "@/lib/notification-routes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Stats {
  totalNotifications: number
  unreadNotifications: number
  todayNotifications: number
  thisWeekNotifications: number
  thisMonthNotifications: number
}

export default function NotificationAdminDashboardPage() {
  const params = useParams()
  const companyId = String(params?.companyId ?? "")
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(NotificationRoutes.stats)
      setStats(res.data?.data ?? null)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const tiles = stats
    ? [
        { label: "Total (active)", value: stats.totalNotifications },
        { label: "Unread", value: stats.unreadNotifications },
        { label: "Today", value: stats.todayNotifications },
        { label: "This week", value: stats.thisWeekNotifications },
        { label: "This month", value: stats.thisMonthNotifications },
      ]
    : []

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6" />
            Notification Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview and shortcuts for notification operations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Card key={t.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{t.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${companyId}/admin/announcements`}>
              <Bell className="mr-2 h-4 w-4" />
              Manage announcements
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${companyId}/notifications`}>View my notifications</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
