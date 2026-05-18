"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCompanyStore } from "@/stores/company-store"
import { usePermissionStore } from "@/stores/permission-store"
import { Building2, ClipboardList, FileSpreadsheet } from "lucide-react"

import { cn, ModuleId, OperationsTransactionId } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { COMPANY_HEADER_PILL_HEIGHT } from "@/components/layout/company-header-utility"

export function NavHeader() {
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  const currentCompany = useCompanyStore((s) => s.currentCompany)
  const { hasPermission } = usePermissionStore()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getUrlWithCompanyId = (url: string) => {
    if (!currentCompany?.companyId) return url
    if (url === "#") return url
    return `/${currentCompany.companyId}${url}`
  }

  // Permission checks for navbar buttons
  const canViewChecklist = hasPermission(
    ModuleId.operations,
    OperationsTransactionId.checklist,
    "isVisible"
  )
  const canViewPda = hasPermission(
    ModuleId.operations,
    OperationsTransactionId.pda,
    "isVisible"
  )
  // Avoid SSR/client menu divergence from persisted auth/permission state.
  if (!isMounted) {
    return (
      <div className="relative hidden w-full items-center justify-between px-3 sm:flex" />
    )
  }

  return (
    <div className="relative hidden w-full items-center justify-between px-3 sm:flex">
      {/* Left Navigation */}
      <div className="flex flex-1 shrink-0 items-center gap-2">
        <NavigationMenu viewport={false}>
          <NavigationMenuList className="flex flex-nowrap items-center gap-2">
            {canViewChecklist && (
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuLink asChild>
                  <Link
                    href={getUrlWithCompanyId("/operations/checklist")}
                    className={cn(
                      COMPANY_HEADER_PILL_HEIGHT,
                      "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex! h-7 min-h-7 flex-row items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors dark:text-white dark:hover:text-white",
                      pathname ===
                        getUrlWithCompanyId("/operations/checklist") &&
                        "bg-accent text-foreground dark:text-white"
                    )}
                  >
                    <ClipboardList className="size-3.5 shrink-0" />
                    Checklist
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {canViewPda && (
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuLink asChild>
                  <Link
                    href={getUrlWithCompanyId("/operations/pda")}
                    className={cn(
                      COMPANY_HEADER_PILL_HEIGHT,
                      "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex! h-7 min-h-7 flex-row items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors dark:text-white dark:hover:text-white",
                      pathname === getUrlWithCompanyId("/operations/pda") &&
                        "bg-accent text-foreground dark:text-white"
                    )}
                  >
                    <FileSpreadsheet className="size-3.5 shrink-0" />
                    PDA
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Center - Company Name */}
      <div className="flex flex-1 items-center justify-center">
        {currentCompany && (
          <div className="flex items-center gap-3">
            <span className="relative flex h-12 w-36 shrink-0 sm:h-12 sm:w-40 md:h-12 md:w-48">
              <Image
                src={`/uploads/companies/${currentCompany.companyId}.svg`}
                alt={currentCompany.companyName || "Company Logo"}
                width={192}
                height={48}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling?.classList.remove("hidden")
                }}
              />
              <Building2 className="text-primary absolute inset-0 hidden h-12 w-12" />
            </span>
            <span className="text-foreground max-w-[200px] truncate text-2xl font-bold sm:max-w-[280px] sm:text-2xl md:max-w-[360px] md:text-3xl lg:max-w-[460px]">
              {currentCompany.companyName}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1" />
    </div>
  )
}
