/** Central notification API routes (erp-office). */
export const NotificationRoutes = {
  list: "/notifications/getnotifications",
  unreadCount: "/notifications/unreadcount",
  markRead: "/notifications/markread",
  markAllRead: "/notifications/markallread",
  archive: "/notifications/archive",
  restoreArchive: "/notifications/restorearchive",
  delete: "/notifications/delete",
  stats: "/notifications/stats",
  preferencesV2: "/notifications/getpreferencesv2",
  savePreferencesV2: "/notifications/savepreferencesv2",
  activeAnnouncements: "/notifications/GetActiveAnnouncements",
  announcements: "/notifications/GetAnnouncements",
  saveAnnouncement: "/notifications/SaveAnnouncement",
  updateAnnouncement: (id: number) => `/notifications/UpdateAnnouncement/${id}`,
  deleteAnnouncement: (id: number) => `/notifications/DeleteAnnouncement/${id}`,
  markAnnouncementRead: (id: number) => `/notifications/MarkAnnouncementAsRead/${id}`,
  dismissAnnouncement: (id: number) => `/notifications/DismissAnnouncement/${id}`,
} as const

export type NotificationPriority = 1 | 2 | 3

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  1: "Info",
  2: "Warning",
  3: "Critical",
}

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  1: "bg-blue-500",
  2: "bg-amber-500",
  3: "bg-red-500",
}
