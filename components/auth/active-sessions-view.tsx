"use client"

import Image from "next/image"
import { IActiveSession } from "@/interfaces/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Monitor, Smartphone, Globe, Clock, ShieldAlert } from "lucide-react"

interface Props {
  sessions: IActiveSession[]
  isLoading?: boolean
  imageUrl?: string
  onSignOutOthers: (sessionIds: number[]) => void
  onCancel: () => void
}

function DeviceIcon({ type }: { type?: string }) {
  if (type?.toLowerCase() === "mobile")
    return <Smartphone className="h-5 w-5 text-muted-foreground" />
  return <Monitor className="h-5 w-5 text-muted-foreground" />
}

function formatRelative(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function ActiveSessionsView({
  sessions,
  isLoading,
  imageUrl,
  onSignOutOthers,
  onCancel,
}: Props) {
  const sessionIds = sessions.map((s) => s.sessionId)

  return (
    <Card className="overflow-hidden p-0 w-full">
      <CardContent className="grid p-0 md:grid-cols-2">
        {/* Left — session info */}
        <div className="flex flex-col gap-6 p-6 md:p-8">
          {/* Icon + heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ShieldAlert className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Already Signed In</h1>
              <p className="text-muted-foreground mt-1 text-sm text-balance">
                Your account is currently active on{" "}
                {sessions.length === 1
                  ? "another device"
                  : `${sessions.length} other devices`}
                . Sign out from those devices to continue.
              </p>
            </div>
          </div>

          {/* Session cards */}
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.sessionId}
                className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3"
              >
                <DeviceIcon type={s.deviceType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.browserName ?? "Unknown browser"}
                    {s.browserVersion ? ` ${s.browserVersion}` : ""}
                    {s.osName ? ` on ${s.osName}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {s.ipAddress && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {s.ipAddress}
                      </span>
                    )}
                    {s.screenResolution && <span>{s.screenResolution}</span>}
                    {s.platform && <span>{s.platform}</span>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Signed in {formatRelative(s.loginAt)}
                    {s.lastActivityAt &&
                      ` · active ${formatRelative(s.lastActivityAt)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => onSignOutOthers(sessionIds)}
              disabled={isLoading}
            >
              {isLoading ? "Signing out..." : "Sign Out & Continue"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Signing out will revoke access from all listed devices.
          </p>
        </div>

        {/* Right — background image (same as login) */}
        <div className="bg-primary/50 relative hidden md:block">
          {imageUrl && (
            <Image
              fill
              src={imageUrl}
              alt="Background"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
