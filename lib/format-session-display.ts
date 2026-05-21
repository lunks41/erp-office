import type { IActiveSession } from "@/interfaces/auth"

/** Friendly IP — hide loopback / LAN noise on login. */
export function formatSessionLocation(ip?: string): string | null {
  if (!ip?.trim()) return null
  const v = ip.trim().toLowerCase()
  if (
    v === "::1" ||
    v === "127.0.0.1" ||
    v === "localhost" ||
    v.startsWith("192.168.") ||
    v.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v)
  ) {
    return "This computer"
  }
  return ip
}

export function formatSessionDeviceLine(session: IActiveSession): string {
  const os =
    session.osName?.trim() ||
    (session.platform?.toLowerCase().includes("win") ? "Windows" : null) ||
    (session.platform?.toLowerCase().includes("mac") ? "macOS" : null) ||
    session.platform?.trim() ||
    "Unknown OS"

  const kind =
    session.deviceType?.toLowerCase() === "mobile" ||
    session.deviceType?.toLowerCase() === "tablet"
      ? session.deviceType
      : "Desktop"

  return `${os} · ${kind}`
}

export function formatSessionBrowserLine(session: IActiveSession): string {
  const name = session.browserName?.trim() || "Browser"
  const ver = session.browserVersion?.trim()
  if (!ver) return name
  const major = ver.split(".")[0]
  if (major && /^\d+$/.test(major) && Number(major) > 40) {
    return `${name} ${major}`
  }
  return `${name} ${ver}`
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} days ago`
}
