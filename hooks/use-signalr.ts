"use client"

import { useEffect, useRef, useCallback } from "react"
import * as signalR from "@microsoft/signalr"
import { useAuthStore } from "@/stores/auth-store"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

export type SignalREventMap = {
  ReceiveNotification: (payload: { title: string; message: string; type: string; notificationId: number }) => void
  UnreadCount: (count: number) => void
  ReceiveAnnouncement: (payload: { title: string; message: string }) => void
  ForceLogout: (payload: { reason: string }) => void
}

export function useSignalR(
  handlers?: Partial<SignalREventMap>
) {
  const { token, isAuthenticated, forceLogout } = useAuthStore()
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const startConnection = useCallback(async (connection: signalR.HubConnection) => {
    try {
      await connection.start()
    } catch {
      // Reconnect is handled by withAutomaticReconnect
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token || !BACKEND_URL) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BACKEND_URL}/notificationHub`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
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
    connection.on("ForceLogout", () => {
      forceLogout()
    })

    startConnection(connection)

    return () => {
      connection.stop()
      connectionRef.current = null
    }
  }, [isAuthenticated, token, forceLogout, startConnection])

  return connectionRef.current
}
