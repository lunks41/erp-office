"use client"

import { usePathname } from "next/navigation"

import { SkipLink } from "@/components/ui/accessibility"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { CompanyDocumentTitle } from "@/components/layout/company-document-title"
import { ChangelogButton } from "@/components/layout/changelog-button"
import { HeaderUserInfo } from "@/components/layout/header-userinfo"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ModeSwitcher } from "@/components/layout/mode-switcher"
import { NavHeader } from "@/components/layout/nav-header"
import { ScreenLock } from "@/components/layout/screen-lock"
import { ThemeSelector } from "@/components/layout/theme-selector"

const KENDO_THEME_STYLESHEET =
  "https://kendo.cdn.telerik.com/themes/10.2.0/default/default-ocean-blue.css"

function isReportWindowRoute(pathname: string | null): boolean {
  if (!pathname) return false
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length < 2) return false
  return (
    parts[parts.length - 2] === "reports" &&
    parts[parts.length - 1] === "window"
  )
}

export function CompanyAppChrome({
  children,
  defaultSidebarOpen,
}: {
  children: React.ReactNode
  defaultSidebarOpen: boolean
}) {
  const pathname = usePathname()

  if (isReportWindowRoute(pathname)) {
    return (
      <>
        <CompanyDocumentTitle />
        <link rel="stylesheet" href={KENDO_THEME_STYLESHEET} />
        <div className="bg-background h-screen w-screen overflow-hidden">
          {children}
        </div>
      </>
    )
  }

  return (
    <>
      <CompanyDocumentTitle />
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar className="hidden md:block" />
        <SidebarInset className="flex min-h-screen flex-col">
          <header
            id="navigation"
            className="bg-background sticky inset-x-0 top-0 isolate z-10 flex shrink-0 items-center gap-2 border-b shadow-sm"
            role="banner"
          >
            <link rel="stylesheet" href={KENDO_THEME_STYLESHEET} />
            <div className="flex h-14 w-full items-center gap-2 px-3 sm:px-4 lg:px-6">
              <MobileNav />
              <SidebarTrigger className="-ml-1.5 hidden md:flex" />
              <NavHeader />
              <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <ChangelogButton />
                <ThemeSelector />
                <ModeSwitcher />
                <ScreenLock />
                <HeaderUserInfo />
              </div>
            </div>
          </header>
          <main id="main-content" className="bg-muted/20 flex-1" role="main">
            <div className="min-h-full">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
