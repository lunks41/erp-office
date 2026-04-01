"use client"

import * as React from "react"
import { History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import {
  COMPANY_HEADER_UTILITY_BUTTON,
  COMPANY_HEADER_UTILITY_ICON,
} from "./company-header-utility"
import { changelog, ChangeType } from "./changelog-data"

const typeMeta: Record<ChangeType, { label: string; className: string }> = {
  added:    { label: "Added",    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
  improved: { label: "Improved", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  fixed:    { label: "Fixed",    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" },
  removed:  { label: "Removed",  className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
}

export function ChangelogButton() {
  const [open, setOpen] = React.useState(false)
  const latest = changelog[0]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={COMPANY_HEADER_UTILITY_BUTTON}
          title="Changelog"
          aria-label="Changelog"
        >
          <History className={COMPANY_HEADER_UTILITY_ICON} />
          <span
            className="bg-primary text-primary-foreground pointer-events-none absolute top-0 right-0 z-10 flex h-3.5 min-w-3.5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none ring-2 ring-background"
            aria-hidden
          >
            {changelog.length}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-[360px] flex-col p-0 sm:w-[400px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="size-4 shrink-0" />
            Changelog
            <Badge variant="secondary" className="ml-auto text-xs">
              v{latest.version}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-4 py-4">
            {changelog.map((release) => (
              <div key={release.version} className="space-y-2">
                {/* Version header */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">v{release.version}</span>
                  <span className="text-muted-foreground text-xs">{release.date}</span>
                  {release.version === latest.version && (
                    <Badge className="ml-auto bg-blue-600 text-[10px] text-white hover:bg-blue-700">
                      Latest
                    </Badge>
                  )}
                </div>

                {/* Change entries */}
                <ul className="space-y-1.5 border-l-2 border-muted pl-3">
                  {release.changes.map((entry, i) => {
                    const meta = typeMeta[entry.type]
                    return (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span
                          className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-foreground leading-relaxed">{entry.text}</span>
                      </li>
                    )
                  })}
                </ul>

                {/* Divider between versions */}
                <div className="border-border border-b" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
