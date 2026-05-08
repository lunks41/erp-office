export interface DeviceInfo {
  screenResolution?: string
  timezone?: string
  language?: string
  platform?: string
  hardwareConcurrency?: number
  touchPoints?: number
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
