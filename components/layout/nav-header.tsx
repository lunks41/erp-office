"use client"

import { useCompanyStore } from "@/stores/company-store"
import { useEffect, useState } from "react"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermissionStore } from "@/stores/permission-store"
import {
  ModuleId,
  OperationsTransactionId,
} from "@/lib/utils"
import { cn } from "@/lib/utils"
import {
  Building2,
  ClipboardList,
  FileSpreadsheet,
} from "lucide-react"

import { COMPANY_HEADER_PILL_HEIGHT } from "@/components/layout/company-header-utility"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

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
    return <div className="relative hidden w-full items-center justify-between px-3 sm:flex" />
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
                      "flex! h-7 min-h-7 flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      pathname === getUrlWithCompanyId("/operations/checklist") &&
                        "bg-accent text-foreground"
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
                      "flex! flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      pathname === getUrlWithCompanyId("/operations/pda") &&
                        "bg-accent text-foreground"
                    )}
                  >
                    <FileSpreadsheet className="size-4 shrink-0" />
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
            <span className="relative flex h-8 w-8 shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <Image
                src={`/uploads/companies/${currentCompany.companyId}.svg`}
                alt={currentCompany.companyName || "Company Logo"}
                width={40}
                height={40}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling?.classList.remove("hidden")
                }}
              />
              <Building2 className="text-primary absolute inset-0 hidden h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10" />
            </span>
            <span className="text-foreground max-w-[240px] truncate text-lg font-bold sm:max-w-[320px] sm:text-xl md:max-w-[400px] md:text-2xl lg:max-w-[500px]">
              {currentCompany.companyName}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1" />
    </div>
  )
}
