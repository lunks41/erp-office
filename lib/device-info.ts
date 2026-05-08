export interface DeviceInfo {
  screenResolution?: string
  timezone?: string
  language?: string
  platform?: string
  hardwareConcurrency?: number
  touchPoints?: number
}

const BROWSER_INSTANCE_ID_KEY = "browser-instance-id"

function createBrowserInstanceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `bid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getBrowserInstanceId(): string {
  if (typeof window === "undefined") return "server"
  const existing = localStorage.getItem(BROWSER_INSTANCE_ID_KEY)
  if (existing) return existing
  const nextId = createBrowserInstanceId()
  localStorage.setItem(BROWSER_INSTANCE_ID_KEY, nextId)
  return nextId
}

export function getClientFingerprint(): string {
  if (typeof window === "undefined") return "server"
  const device = getDeviceInfo()
  return [
    navigator.userAgent || "ua-unknown",
    getBrowserInstanceId(),
    device.platform || "platform-unknown",
    device.screenResolution || "res-unknown",
    device.timezone || "tz-unknown",
  ].join("|")
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") return {}
  return {
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    touchPoints: navigator.maxTouchPoints,
  }
}
