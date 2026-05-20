"use client"

import { Bell, CheckCheck } from "lucide-react"
import { NotificationItem } from "@/components/notifications/notification-item"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { NotificationHistoryItem } from "@/stores/notification-store"
import {
  COMPANY_HEADER_UTILITY_COUNT_BADGE,
  COMPANY_HEADER_UTILITY_COUNT_BADGE_COLORS,
} from "@/components/layout/company-header-utility"
import Link from "next/link"

export function NotificationDropdown({
  companyId,
  history,
  unreadCount,
  ringing,
  onMarkRead,
  onMarkAllRead,
  onOpenChange,
  triggerClassName,
}: {
  companyId: string
  history: NotificationHistoryItem[]
  unreadCount: number
  ringing?: boolean
  onMarkRead: (id: string, notificationId: number) => void
  onMarkAllRead: () => void
  onOpenChange?: (open: boolean) => void
  triggerClassName?: string
}) {
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className={`relative ${triggerClassName ?? ""}`}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className={ringing ? "h-4 w-4 animate-bounce" : "h-4 w-4"} />
          {unreadCount > 0 && (
            <span
              className={`${COMPANY_HEADER_UTILITY_COUNT_BADGE} ${COMPANY_HEADER_UTILITY_COUNT_BADGE_COLORS}`}
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 sm:w-[420px]">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="default" className="h-5 rounded-full px-1.5 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onMarkAllRead}>
              <CheckCheck className="mr-1 h-3 w-3" />
              All read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[min(420px,60vh)]">
          <div className="p-1">
            {history.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">No notifications</p>
            ) : (
              history.slice(0, 15).map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onMarkRead={onMarkRead}
                  showPriority
                />
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href={`/${companyId}/notifications`}>View all</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
