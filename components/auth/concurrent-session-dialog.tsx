"use client"

import { IActiveSession } from "@/interfaces/auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Monitor, Smartphone, Globe } from "lucide-react"

interface Props {
  sessions: IActiveSession[]
  isLoading?: boolean
  onSignOutOthers: (sessionIds: number[]) => void
  onCancel: () => void
}

function DeviceIcon({ type }: { type?: string }) {
  if (type?.toLowerCase() === "mobile") return <Smartphone className="h-5 w-5 shrink-0 text-muted-foreground" />
  return <Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
}

function formatRelative(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function ConcurrentSessionDialog({ sessions, isLoading, onSignOutOthers, onCancel }: Props) {
  const sessionIds = sessions.map((s) => s.sessionId)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Already Signed In</DialogTitle>
          <DialogDescription>
            Your account is currently active on {sessions.length === 1 ? "another device" : `${sessions.length} other devices`}.
            Sign out from those devices to continue, or cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {sessions.map((s) => (
            <div key={s.sessionId} className="flex items-start gap-3 rounded-md border p-3">
              <DeviceIcon type={s.deviceType} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {s.browserName ?? "Unknown browser"}
                  {s.browserVersion ? ` ${s.browserVersion}` : ""}
                  {s.osName ? ` on ${s.osName}` : ""}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {s.ipAddress && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{s.ipAddress}</span>}
                  {s.screenResolution && <span>{s.screenResolution}</span>}
                  {s.platform && <span>{s.platform}</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Signed in {formatRelative(s.loginAt)}
                  {s.lastActivityAt && ` · active ${formatRelative(s.lastActivityAt)}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={() => onSignOutOthers(sessionIds)} disabled={isLoading}>
            {isLoading ? "Signing out..." : "Sign out from all other devices"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
