"use client"

import { useState } from "react"
import { IActiveSession } from "@/interfaces/auth"
import { format, isValid } from "date-fns"
import { Monitor, Smartphone, Tablet, Globe, Loader2, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SessionsTableProps {
  sessions: IActiveSession[]
  datetimeFormat: string
  onRevoke: (sessionId: number) => Promise<void>
  isLoading?: boolean
}

function DeviceIcon({ deviceType }: { deviceType?: string }) {
  const type = deviceType?.toLowerCase() ?? ""
  if (type.includes("mobile") || type.includes("phone"))
    return <Smartphone className="h-4 w-4" />
  if (type.includes("tablet")) return <Tablet className="h-4 w-4" />
  if (type.includes("desktop") || type.includes("pc"))
    return <Monitor className="h-4 w-4" />
  return <Globe className="h-4 w-4" />
}

function formatSessionDate(value: string | null | undefined, fmt: string) {
  if (!value) return "-"
  const d = new Date(value)
  return isValid(d) ? format(d, fmt) : "-"
}

export function SessionsTable({
  sessions,
  datetimeFormat,
  onRevoke,
  isLoading,
}: SessionsTableProps) {
  const [revokingId, setRevokingId] = useState<number | null>(null)

  const handleRevoke = async (sessionId: number) => {
    setRevokingId(sessionId)
    try {
      await onRevoke(sessionId)
    } finally {
      setRevokingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No active sessions found.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Browser</TableHead>
          <TableHead>OS / Platform</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Login At</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead className="w-28" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((s) => (
          <TableRow key={s.sessionId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <DeviceIcon deviceType={s.deviceType} />
                <Badge variant="outline" className="text-xs capitalize">
                  {s.deviceType || "Unknown"}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-sm">
              {s.browserName}
              {s.browserVersion ? ` ${s.browserVersion}` : ""}
            </TableCell>
            <TableCell className="text-sm">
              {[s.osName, s.platform].filter(Boolean).join(" / ") || "-"}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {s.ipAddress || "-"}
            </TableCell>
            <TableCell className="whitespace-nowrap text-sm">
              {formatSessionDate(s.loginAt, datetimeFormat)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-sm">
              {formatSessionDate(s.lastActivityAt, datetimeFormat)}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevoke(s.sessionId)}
                disabled={revokingId === s.sessionId}
              >
                {revokingId === s.sessionId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Disconnect
                  </>
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
