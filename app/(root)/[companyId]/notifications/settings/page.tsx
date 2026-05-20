"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Settings } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { NotificationRoutes } from "@/lib/notification-routes"
import { useNotificationStore, type UserNotificationPreferences } from "@/stores/notification-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

const DEFAULT_PREFS: UserNotificationPreferences = {
  isPopupEnabled: true,
  isEmailEnabled: true,
  isAnnouncementEnabled: true,
  isSoundEnabled: false,
  isFinanceEnabled: true,
  isHrEnabled: true,
  isOperationEnabled: true,
}

export default function NotificationSettingsPage() {
  const { setPreferences } = useNotificationStore()
  const [prefs, setPrefs] = useState<UserNotificationPreferences>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(NotificationRoutes.preferencesV2)
      const data = res.data?.data ?? res.data
      if (data) {
        setPrefs({ ...DEFAULT_PREFS, ...data })
        setPreferences(data)
      }
    } catch {
      toast.error("Failed to load notification settings.")
    } finally {
      setLoading(false)
    }
  }, [setPreferences])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      await apiClient.post(NotificationRoutes.savePreferencesV2, prefs)
      setPreferences(prefs)
      toast.success("Notification settings saved.")
    } catch {
      toast.error("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: keyof UserNotificationPreferences, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }))

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6" />
          Notification Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Control how you receive in-app alerts, announcements, and module notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery channels</CardTitle>
          <CardDescription>Choose which channels are enabled for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["isPopupEnabled", "Popup / toast notifications"],
              ["isEmailEnabled", "Email notifications (when configured)"],
              ["isAnnouncementEnabled", "Company announcements"],
              ["isSoundEnabled", "Sound on new notifications"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key}>{label}</Label>
              <Switch
                id={key}
                checked={prefs[key]}
                onCheckedChange={(v) => toggle(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modules</CardTitle>
          <CardDescription>Disable categories you do not want to see in the bell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["isFinanceEnabled", "Finance (AR / AP / GL)"],
              ["isHrEnabled", "Human resources"],
              ["isOperationEnabled", "Operations"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key}>{label}</Label>
              <Switch
                id={key}
                checked={prefs[key]}
                onCheckedChange={(v) => toggle(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiet hours</CardTitle>
          <CardDescription>Suppress popup toasts during these hours (24h format).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="quietFrom">From</Label>
            <Input
              id="quietFrom"
              type="time"
              value={prefs.quietHoursFrom ?? ""}
              onChange={(e) => setPrefs((p) => ({ ...p, quietHoursFrom: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="quietTo">To</Label>
            <Input
              id="quietTo"
              type="time"
              value={prefs.quietHoursTo ?? ""}
              onChange={(e) => setPrefs((p) => ({ ...p, quietHoursTo: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save settings
      </Button>
    </div>
  )
}
