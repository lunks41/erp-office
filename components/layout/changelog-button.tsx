"use client"

import * as React from "react"
import { History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { ChangeType, changelog } from "./changelog-data"
import {
  COMPANY_HEADER_UTILITY_BUTTON,
  COMPANY_HEADER_UTILITY_ICON,
} from "./company-header-utility"

const typeMeta: Record<ChangeType, { label: string; className: string }> = {
  added: {
    label: "Added",
    className:
      "inline-flex min-w-16 justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  improved: {
    label: "Improved",
    className:
      "inline-flex min-w-16 justify-center bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
  },
  fixed: {
    label: "Fixed",
    className:
      "inline-flex min-w-16 justify-center bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
  },
  removed: {
    label: "Removed",
    className:
      "inline-flex min-w-16 justify-center bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
  },
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
            className="bg-primary ring-background pointer-events-none absolute top-0 right-0 z-10 h-2.5 w-2.5 translate-x-1/4 -translate-y-1/4 rounded-full shadow-[0_0_10px_hsl(var(--primary))] ring-2"
            aria-hidden
          />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-full w-[380px] flex-col overflow-hidden p-0 sm:w-[440px]"
      >
        <SheetHeader className="bg-muted/30 border-b px-4 py-2 pr-12">
          <SheetTitle className="flex items-center gap-2 pr-2 text-base font-semibold">
            <History className="size-4 shrink-0" />
            Changelog
          </SheetTitle>
          <div className="mt-0.5 flex items-center">
            <Badge variant="secondary" className="rounded-md text-xs">
              Current version: v{latest.version}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 px-4 py-3">
            {changelog.map((release) => (
              <Card
                key={release.version}
                className="border-border/70 shadow-none"
              >
                <CardHeader className="space-y-0 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-sm font-semibold">
                      v{release.version}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {release.date}
                    </span>
                    {release.version === latest.version && (
                      <Badge className="ml-auto rounded-md bg-blue-600 text-[10px] text-white hover:bg-blue-700">
                        Latest
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-3 pt-0 pb-3">
                  <ul className="space-y-1.5">
                    {release.changes.map((entry, i) => {
                      const meta = typeMeta[entry.type]
                      return (
                        <li
                          key={i}
                          className="flex min-w-0 items-start gap-2 text-sm"
                        >
                          <span
                            className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-foreground min-w-0 leading-relaxed wrap-anywhere">
                            {entry.text}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
        <div className="bg-background px-4 py-2">
          <Separator className="mb-2" />
          <p className="text-muted-foreground text-xs">
            Keep this updated daily when code changes are made.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
