"use client"

import { useCompanyStore } from "@/stores/company-store"
import * as React from "react"
import Image from "next/image"
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/ui/sidebar"

export function CompanySwitcher() {
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const { companies, currentCompany, getCompanies } = useCompanyStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  const getCompanyInitial = (company: typeof currentCompany) => {
    if (!company) return "?"
    return (company.companyCode || company.companyName || "?")
      .charAt(0)
      .toUpperCase()
  }

  React.useEffect(() => {
    const fetchCompanies = async () => {
      if (companies.length === 0) {
        try {
          await getCompanies()
        } catch (error) {
          console.error("Failed to fetch companies:", error)
          toast.error("Failed to load companies. Please try again.")
        }
      }
    }
    fetchCompanies()
  }, [companies.length, getCompanies])

  const handleCompanySwitch = React.useCallback(
    async (newCompanyId: string) => {
      if (!newCompanyId || newCompanyId === currentCompany?.companyId) return
      setIsLoading(true)
      try {
        const companyExists = companies.some((c) => c.companyId === newCompanyId)
        if (!companyExists) {
          toast.error("Invalid company selected. Please choose a valid company.")
          return
        }
        const parts = window.location.pathname.split("/")
        parts[1] = newCompanyId
        const newPath = parts.join("/")
        window.open(newPath, "_blank")
      } catch (error) {
        console.error("Failed to switch company:", error)
        toast.error("Failed to switch company")
      } finally {
        setIsLoading(false)
      }
    },
    [companies, currentCompany?.companyId]
  )

  if (!currentCompany || companies.length === 0) {
    return null
  }

  const companyName = currentCompany.companyName || "Unknown Company"
  const companyCode = currentCompany.companyCode || "No Code"

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isLoading}
          className={cn(
            "hover:bg-sidebar-accent flex w-full min-w-0 items-start gap-2.5 rounded-lg p-1 text-left transition-colors",
            "focus-visible:ring-sidebar-ring outline-none focus-visible:ring-2",
            isCollapsed && "justify-center gap-0 p-0.5",
            isLoading && "cursor-not-allowed opacity-50"
          )}
          aria-label={`Current company: ${companyName}. Switch company.`}
        >
          <div className="bg-sidebar-accent/50 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border">
            {isLoading ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : (
              <>
                <Image
                  src={`/uploads/companies/${currentCompany.companyId}.svg`}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    e.currentTarget.nextElementSibling?.classList.remove("hidden")
                  }}
                />
                <span className="text-sidebar-foreground hidden text-xs font-semibold">
                  {getCompanyInitial(currentCompany)}
                </span>
              </>
            )}
          </div>
          <div
            className={cn(
              "min-w-0 flex-1 space-y-0.5 pt-0.5",
              isCollapsed && "hidden"
            )}
          >
            <p
              className="text-sidebar-foreground text-xs leading-snug font-semibold wrap-break-word"
              title={companyName}
            >
              {companyName}
            </p>
            <p
              className="text-muted-foreground text-[11px] leading-snug"
              title={companyCode}
            >
              {companyCode}
            </p>
          </div>
          <ChevronsUpDown
            className={cn(
              "text-muted-foreground mt-0.5 size-4 shrink-0",
              isCollapsed && "hidden"
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg p-2"
        align="start"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-xs">
          Companies
        </DropdownMenuLabel>
        {companies.map((company, index) => (
          <DropdownMenuItem
            key={company.companyId}
            onClick={() => handleCompanySwitch(company.companyId)}
            className={cn(
              "gap-2 rounded-md p-2 transition-colors duration-200",
              "hover:bg-accent/50"
            )}
            disabled={
              isLoading || company.companyId === currentCompany.companyId
            }
          >
            <div
              className={cn(
                "flex size-6 items-center justify-center overflow-hidden rounded-xs border transition-transform duration-200 hover:scale-105",
                "bg-transparent"
              )}
            >
              <Image
                src={`/uploads/companies/${company.companyId}.svg`}
                alt=""
                width={24}
                height={24}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling?.classList.remove("hidden")
                }}
              />
              <span className="hidden">{getCompanyInitial(company)}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium wrap-break-word">
                {company.companyName || "Unknown Company"}
              </span>
              <span className="text-muted-foreground text-xs">
                {company.companyCode || "No Code"}
              </span>
            </div>
            {company.companyId === currentCompany.companyId ? (
              <Check className="size-4" />
            ) : (
              <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          className={cn(
            "gap-2 rounded-md p-2 transition-colors duration-200",
            "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {}}
        >
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-md border transition-transform duration-200 hover:scale-105"
            )}
          >
            <Plus className="size-4" />
          </div>
          <div className="font-medium">Add company</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
