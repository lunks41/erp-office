"use client"

import { useCompanyStore } from "@/stores/company-store"
import * as React from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
// Constants for storage keys
const TAB_COMPANY_ID_KEY = "tab_company_id"
export function CompanySwitcher() {
  const { isMobile } = useSidebar()
  const searchParams = useSearchParams()
  const { companies, currentCompany, getCompanies } = useCompanyStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  // Get company ID from URL
  const urlCompanyId = searchParams.get("companyId")
  // Get the first letter of company code or name as fallback
  const getCompanyInitial = (company: typeof currentCompany) => {
    if (!company) return "?"
    return (company.companyCode || company.companyName || "?")
      .charAt(0)
      .toUpperCase()
  }
  // Effect to fetch companies if not available
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
    async (companyId: string) => {
      if (!companyId) {
        toast.error("Invalid company ID")
        return
      }
      setIsLoading(true)
      try {
        const companyExists = companies.some((c) => c.companyId === companyId)
        if (!companyExists) {
          toast.error(
            "Invalid company selected. Please choose a valid company."
          )
          return
        }
        // Open new tab with the new company ID; CompanyProvider will handle state
        // 1. grab current URL
        const url = new URL(window.location.href)
        // 2. replace the first pathname segment (old companyId) with the new one
        //    e.g. '/123/master/country' → ['','123','master','country']
        const parts = url.pathname.split("/")
        // parts[1] is the old companyId; overwrite it
        parts[1] = companyId
        url.pathname = parts.join("/")
        window.open(url.toString(), "_blank")
      } catch (error) {
        console.error("Failed to switch company:", error)
        toast.error("Failed to switch company")
      } finally {
        setIsLoading(false)
      }
    },
    [companies]
  )
  // Effect to handle URL company ID changes
  React.useEffect(() => {
    if (urlCompanyId && urlCompanyId !== currentCompany?.companyId) {
      handleCompanySwitch(urlCompanyId)
    }
  }, [urlCompanyId, currentCompany?.companyId, handleCompanySwitch])
  // Effect to sync tab company ID with current company
  React.useEffect(() => {
    if (currentCompany?.companyId) {
      sessionStorage.setItem(TAB_COMPANY_ID_KEY, currentCompany.companyId)
    }
  }, [currentCompany?.companyId])
  // If no current company or companies list is empty, don't render anything
  if (!currentCompany || companies.length === 0) {
    return null
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "transition-colors duration-200",
                isLoading && "cursor-not-allowed opacity-50"
              )}
              disabled={isLoading}
            >
              <div
                className={cn(
                  "flex aspect-square size-8 items-center justify-center rounded-lg",
                  "bg-transparent"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Image
                      src={`/uploads/companies/${currentCompany.companyId}.svg`}
                      alt={currentCompany.companyName || "Company Logo"}
                      width={32}
                      height={32}
                      className="object-contain"
                      onError={(e) => {
                        // Hide the image on error and show the initial
                        e.currentTarget.style.display = "none"
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden"
                        )
                      }}
                    />
                    <span className="hidden">
                      {getCompanyInitial(currentCompany)}
                    </span>
                  </>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentCompany.companyName || "Unknown Company"}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {currentCompany.companyCode || "No Code"}
                </span>
              </div>
              <ChevronsUpDown className="text-muted-foreground ml-auto h-4 w-4 transition-transform duration-200" />
            </SidebarMenuButton>
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
                    alt={company.companyName || "Company Logo"}
                    width={24}
                    height={24}
                    className="object-contain"
                    onError={(e) => {
                      // Hide the image on error and show the initial
                      e.currentTarget.style.display = "none"
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden"
                      )
                    }}
                  />
                  <span className="hidden">{getCompanyInitial(company)}</span>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">
                    {company.companyName || "Unknown Company"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {company.companyCode || "No Code"}
                  </span>
                </div>
                {company.companyId === currentCompany.companyId ? (
                  <Check className={cn("h-4 w-4")} />
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
              onClick={() => {
                }}
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
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
