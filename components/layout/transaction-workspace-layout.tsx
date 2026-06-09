"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { cn } from "@/lib/utils"

type TransactionWorkspaceRootProps = {
  activeTab: string
  onTabChange: (value: string) => void
  leftColumn: React.ReactNode
  centerColumn: React.ReactNode
  rightColumn: React.ReactNode
  children: React.ReactNode
}

/**
 * Shared shell for AR/AP/CB/GL transaction pages — matches the AR Invoice layout:
 * full viewport height, sticky blurred toolbar (3-column grid), scrollable tab body.
 */
export function TransactionWorkspaceRoot({
  activeTab,
  onTabChange,
  leftColumn,
  centerColumn,
  rightColumn,
  children,
}: TransactionWorkspaceRootProps) {
  return (
    <div className="@container flex h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] min-h-0 flex-col gap-0 overflow-hidden px-2 pb-2 pt-1">
      <Tabs
        defaultValue="main"
        className="flex h-full min-h-0 w-full flex-1 flex-col gap-0"
        value={activeTab}
        onValueChange={onTabChange}
      >
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 shrink-0 border-b backdrop-blur-sm">
          <div className="grid w-full min-w-0 grid-cols-1 items-center gap-x-2 gap-y-1 py-1 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:justify-self-start">
              {leftColumn}
            </div>
            <div className="flex min-w-0 w-full items-center justify-center">
              {centerColumn}
            </div>
            <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1.5 justify-self-end pr-2 sm:flex-nowrap sm:pr-3">
              {rightColumn}
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-0.5">
          {children}
        </div>
      </Tabs>
    </div>
  )
}

export function MainOtherHistoryTabList() {
  return (
    <TabsList className="h-8 shrink-0 gap-0.5 p-[3px]">
      <TabsTrigger value="main" className="px-2.5 py-1 text-xs">
        Main
      </TabsTrigger>
      <TabsTrigger value="other" className="px-2.5 py-1 text-xs">
        Other
      </TabsTrigger>
      <TabsTrigger value="history" className="px-2.5 py-1 text-xs">
        History
      </TabsTrigger>
    </TabsList>
  )
}

export function MainHistoryTabList({
  historyDisabled = false,
}: {
  historyDisabled?: boolean
}) {
  return (
    <TabsList className="h-8 shrink-0 gap-0.5 p-[3px]">
      <TabsTrigger value="main" className="px-2.5 py-1 text-xs">
        Main
      </TabsTrigger>
      <TabsTrigger
        value="history"
        disabled={historyDisabled}
        className="px-2.5 py-1 text-xs"
      >
        History
      </TabsTrigger>
    </TabsList>
  )
}

export const transactionTabPanelClassName =
  "mt-0 focus-visible:outline-none"

export function transactionTabPanelClass(className?: string) {
  return cn(transactionTabPanelClassName, className)
}
