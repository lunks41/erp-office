"use client"

import { useEffect, useRef } from "react"
import * as signalR from "@microsoft/signalr"
import { useAuthStore } from "@/stores/auth-store"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

export type SignalRNotificationPayload = {
  notificationId: number
  headerNotificationId?: number
  title: string
  message: string
  notificationType?: string
  type?: string
  priorityLevel?: number
  actionUrl?: string
  createdDate?: string
  isRead?: boolean
}

export type SignalREventMap = {
  ReceiveNotification: (payload: SignalRNotificationPayload) => void
  UnreadCount: (count: number) => void
  ReceiveAnnouncement: (payload: { title: string; message: string; isUrgent: boolean; announcementId?: number }) => void
  ReceiveApprovalNotification: (payload: { title: string; message: string; approvalRequestId: number; isApproved?: boolean }) => void
  NotificationMarkedAsRead: (notificationUserId: number) => void
  ForceLogout: (payload: { reason: string }) => void
}

export function useSignalR(handlers?: Partial<SignalREventMap>) {
  const { token, isAuthenticated, forceLogout } = useAuthStore()
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!isAuthenticated || !token || !BACKEND_URL) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/notificationHub`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connectionRef.current = connection

    connection.on("ReceiveNotification", (payload) => {
      handlersRef.current?.ReceiveNotification?.(payload)
    })
    connection.on("UnreadCount", (count: number) => {
      handlersRef.current?.UnreadCount?.(count)
    })
    connection.on("ReceiveAnnouncement", (payload) => {
      handlersRef.current?.ReceiveAnnouncement?.(payload)
    })
    connection.on("ReceiveApprovalNotification", (payload) => {
      handlersRef.current?.ReceiveApprovalNotification?.(payload)
    })
    connection.on("NotificationMarkedAsRead", (id: number) => {
      handlersRef.current?.NotificationMarkedAsRead?.(id)
    })
    connection.on("ForceLogout", () => {
      forceLogout()
    })

    connection.onreconnected(async () => {
      try {
        await connection.invoke("OnReconnected")
      } catch {
        /* hub may not expose method on older server */
      }
    })

    connection.start().catch(() => {})

    return () => {
      connection.stop()
      connectionRef.current = null
    }
  }, [isAuthenticated, token, forceLogout])

  return connectionRef.current
}
