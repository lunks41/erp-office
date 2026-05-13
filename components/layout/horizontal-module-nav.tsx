"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCompanyStore } from "@/stores/company-store"
import {
  Banknote,
  BookOpenText,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileCheck,
  FolderKanban,
  GalleryVerticalEnd,
  Landmark,
  Receipt,
  Search,
  Settings,
  Truck,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useUserTransactions } from "@/hooks/use-user-transactions"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const MODULE_LABEL: Record<string, string> = {
  ar: "AR",
  ap: "AP",
  cb: "CB",
  gl: "GL",
  hr: "HR",
  einvoicing: "E-Invoicing",
  admin: "Admin",
}

const MODULE_ICON: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  master: GalleryVerticalEnd,
  operations: FolderKanban,
  ar: Receipt,
  ap: CreditCard,
  cb: Banknote,
  gl: BookOpenText,
  hr: Users,
  logistics: Truck,
  inquiry: Search,
  einvoicing: FileCheck,
  settings: Settings,
  admin: Landmark,
  requests: ClipboardList,
}

const MODULE_ORDER = [
  "master",
  "operations",
  "ar",
  "ap",
  "cb",
  "gl",
  "hr",
  "logistics",
  "inquiry",
  "einvoicing",
  "settings",
  "admin",
]

interface SubItem {
  title: string
  url: string
}

interface SubCategory {
  id: number
  name: string
  seqNo: number
  items: SubItem[]
}

interface ModuleEntry {
  code: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  items: SubItem[]
  categories?: SubCategory[] // Master only: grouped by transCategoryId
}

function MasterDropdown({
  categories,
  pathname,
}: {
  categories: SubCategory[]
  pathname: string
}) {
  const [hoveredCatId, setHoveredCatId] = React.useState<number>(
    categories[0]?.id ?? 0
  )

  const activeCat =
    categories.find((c) => c.id === hoveredCatId) ?? categories[0]

  return (
    <div className="flex max-h-[60vh]">
      {/* Left: category list */}
      <div className="w-[148px] shrink-0 overflow-y-auto border-r p-1">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onMouseEnter={() => setHoveredCatId(cat.id)}
            className={cn(
              "flex cursor-default items-center justify-between rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors select-none",
              hoveredCatId === cat.id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            {cat.name}
            <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
          </div>
        ))}
      </div>

      {/* Right: transactions for hovered category */}
      <div className="min-w-[160px] overflow-y-auto p-1">
        {activeCat?.items.map((item) => (
          <NavigationMenuLink key={item.url} asChild>
            <Link
              href={item.url}
              className={cn(
                "block rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors",
                pathname === item.url
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {item.title}
            </Link>
          </NavigationMenuLink>
        ))}
      </div>
    </div>
  )
}

export function HorizontalModuleNav() {
  const [isMounted, setIsMounted] = React.useState(false)
  const pathname = usePathname()
  const currentCompany = useCompanyStore((s) => s.currentCompany)
  const { transactions } = useUserTransactions()

  React.useEffect(() => setIsMounted(true), [])

  const companyIdFromPath = pathname.split("/")[1]
  const companyId = currentCompany?.companyId ?? companyIdFromPath
  const activeModule = pathname.split("/")[2] ?? ""

  const modules = React.useMemo<ModuleEntry[]>(() => {
    if (!transactions.length) return []

    // ── Master: group by transCategoryId ─────────────────────────
    const masterTxs = transactions
      .filter((t) => t.moduleCode.toLowerCase() === "master" && t.isVisible)
      .sort(
        (a, b) =>
          (a.transCatSeqNo ?? 99) - (b.transCatSeqNo ?? 99) || a.seqNo - b.seqNo
      )

    const categoryMap = new Map<number, SubCategory>()
    masterTxs.forEach((t) => {
      const catId = t.transCategoryId ?? 0
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          name: t.transCategoryName || t.transCategoryCode || "Other",
          seqNo: t.transCatSeqNo ?? 99,
          items: [],
        })
      }
      categoryMap.get(catId)!.items.push({
        title: t.transactionName,
        url: `/${companyId}/master/${t.transactionCode.toLowerCase()}`,
      })
    })

    const masterCategories = Array.from(categoryMap.values()).sort(
      (a, b) => a.seqNo - b.seqNo
    )

    // ── Other modules: flat list ──────────────────────────────────
    const moduleMap = new Map<string, { label: string; items: SubItem[] }>()

    transactions
      .filter((t) => t.isVisible && t.moduleCode.toLowerCase() !== "master")
      .sort((a, b) => a.seqNo - b.seqNo)
      .forEach((t) => {
        const code = t.moduleCode.toLowerCase()
        const txCode = t.transactionCode.toLowerCase()
        if (!moduleMap.has(code)) {
          moduleMap.set(code, {
            label: MODULE_LABEL[code] ?? t.moduleName,
            items: [],
          })
        }
        moduleMap.get(code)!.items.push({
          title: t.transactionName,
          url: `/${companyId}/${code}/${txCode}`,
        })
      })

    // ── Build ordered list ────────────────────────────────────────
    const ordered: ModuleEntry[] = []

    for (const code of MODULE_ORDER) {
      if (code === "master") {
        if (masterCategories.length > 0) {
          ordered.push({
            code: "master",
            label: "Master",
            Icon: MODULE_ICON.master,
            items: [],
            categories: masterCategories,
          })
        }
        continue
      }
      const entry = moduleMap.get(code)
      if (entry) {
        ordered.push({
          code,
          label: entry.label,
          Icon: MODULE_ICON[code] ?? FolderKanban,
          items: entry.items,
        })
      }
    }

    moduleMap.forEach((entry, code) => {
      if (!MODULE_ORDER.includes(code)) {
        ordered.push({
          code,
          label: entry.label,
          Icon: MODULE_ICON[code] ?? FolderKanban,
          items: entry.items,
        })
      }
    })

    return ordered
  }, [transactions, companyId])

  if (!isMounted || modules.length === 0) {
    return <div className="bg-background border-border h-[33px] border-b" />
  }

  return (
    <div className="bg-background border-border sticky top-[44px] z-50 h-[33px] shrink-0 border-b shadow-[0_1px_0_0_var(--border)]">
      <NavigationMenu
        viewport={false}
        className="h-full max-w-none [&>div]:h-full"
      >
        <NavigationMenuList className="h-full flex-nowrap gap-0 px-3">
          {modules.map(({ code, label, Icon, items, categories }) => {
            const isActive = activeModule === code
            const hasContent =
              (categories && categories.length > 0) || items.length > 0

            return (
              <NavigationMenuItem
                key={code}
                className="relative flex h-full items-stretch"
              >
                {/* Emerald active underline */}
                {isActive && (
                  <span className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-[2px] rounded-t-full bg-emerald-500" />
                )}

                <NavigationMenuTrigger
                  className={cn(
                    "h-full rounded-none border-0 bg-transparent px-3 text-xs font-medium shadow-none",
                    "hover:bg-accent/60 data-[state=open]:bg-accent/60",
                    "[&_svg.lucide-chevron-down]:h-2.5 [&_svg.lucide-chevron-down]:w-2.5",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="mr-1.5 h-3 w-3 shrink-0" />
                  {label}
                </NavigationMenuTrigger>

                {hasContent && (
                  <NavigationMenuContent className="bg-popover absolute! top-full left-0 z-50 mt-0 rounded-md border shadow-md">
                    {/* Master: flyout — category list on left, transactions on right */}
                    {categories ? (
                      <MasterDropdown
                        categories={categories}
                        pathname={pathname}
                      />
                    ) : (
                      /* Other modules: flat list with max-height scroll */
                      <div className="flex max-h-[60vh] min-w-[160px] flex-col gap-0 overflow-y-auto p-1">
                        {items.map((item) => (
                          <NavigationMenuLink key={item.url} asChild>
                            <Link
                              href={item.url}
                              className={cn(
                                "block rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors",
                                pathname === item.url
                                  ? "bg-accent text-foreground font-semibold"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              {item.title}
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    )}
                  </NavigationMenuContent>
                )}
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
