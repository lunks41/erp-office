"use client"

import { useCallback, useEffect, useState } from "react"
import { IActiveSession } from "@/interfaces/auth"
import { useCompanyStore } from "@/stores/company-store"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { SessionsTable } from "./components/sessions-table"

export default function AdminSessionsPage() {
  const { decimals } = useCompanyStore()
  const datetimeFormat = decimals[0]?.longDateFormat || "dd/MM/yyyy HH:mm:ss"

  const [sessions, setSessions] = useState<IActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get("/Session/active")
      setSessions(res.data?.data ?? [])
    } catch {
      toast.error("Failed to load active sessions.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRevoke = async (sessionId: number) => {
    try {
      await apiClient.post(`/Session/revoke/${sessionId}`)
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
      toast.success("Session disconnected successfully.")
    } catch {
      toast.error("Failed to disconnect session.")
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Active Sessions
          </h1>
          <p className="text-muted-foreground text-sm">
            View and manage your active login sessions across all devices.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border">
        <SessionsTable
          sessions={sessions}
          datetimeFormat={datetimeFormat}
          onRevoke={handleRevoke}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
