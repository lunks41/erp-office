"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import {
  ArrowLeftRight,
  BarChart,
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  Coins,
  FileMinus,
  FilePlus,
  FileStack,
  Lock,
  MinusCircle,
  Package,
  PlusCircle,
  Receipt,
  Scale,
  Sliders,
  Truck,
  Undo2,
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

const _data = {
  projectNav: [
    {
      title: "Operations",
      url: "/operations",
      items: [
        {
          title: "CheckList",
          url: "/operations/checklist",
          icon: ClipboardList,
        },
        { title: "Tariff", url: "/operations/tariff", icon: Coins },
      ],
    },
  ],
  accountNav: [
    {
      title: "AR",
      url: "/ar",
      items: [
        { title: "Invoice", url: "/ar/invoice", icon: Receipt },
        { title: "Debit Note", url: "/ar/debitnote", icon: FileMinus },
        { title: "Credit Note", url: "/ar/creditnote", icon: FilePlus },
        { title: "Receipt", url: "/ar/receipt", icon: PlusCircle },
        { title: "Refund", url: "/ar/refund", icon: Undo2 },
        { title: "Adjustment", url: "/ar/adjustment", icon: Sliders },
        { title: "Doc Setoff", url: "/ar/documentsetoff", icon: FileStack },
        { title: "Reports", url: "/ar/reports", icon: BarChart },
      ],
    },
    {
      title: "AP",
      url: "/ap",
      items: [
        { title: "Invoice", url: "/ap/invoice", icon: Receipt },
        { title: "Debit Note", url: "/ap/debitnote", icon: FileMinus },
        { title: "Credit Note", url: "/ap/creditnote", icon: FilePlus },
        { title: "Payment", url: "/ap/payment", icon: MinusCircle },
        { title: "Refund", url: "/ap/refund", icon: Undo2 },
        { title: "Adjustment", url: "/ap/adjustment", icon: Sliders },
        { title: "Doc Setoff", url: "/ap/documentsetoff", icon: FileStack },
        {
          title: "Job Transactions",
          url: "/ap/jobtransactions",
          icon: ClipboardList,
        },
        { title: "Reports", url: "/ap/reports", icon: BarChart },
      ],
    },
    {
      title: "CB",
      url: "/cb",
      items: [
        { title: "General Payment", url: "/cb/payment", icon: MinusCircle },
        { title: "General Receipt", url: "/cb/receipt", icon: PlusCircle },
        { title: "Bank Transfer", url: "/cb/transfer", icon: ArrowLeftRight },
        {
          title: "Bank Reconciliation",
          url: "/cb/reconciliation",
          icon: Scale,
        },
        { title: "Report", url: "/cb/reports", icon: BarChart },
      ],
    },
    {
      title: "GL",
      url: "/gl",
      items: [
        {
          title: "Journal Entry",
          url: "/gl/journal-entry",
          icon: BookOpen,
        },
        { title: "AR/AP Contra", url: "/gl/arap-contra", icon: ArrowLeftRight },
        { title: "Year-End Process", url: "/gl/year-end", icon: CalendarCheck },
        { title: "GL Period Close", url: "/gl/periodclose", icon: Lock },
        { title: "Opening Balance", url: "/gl/opening-balance", icon: Scale },
        { title: "Report", url: "/gl/reports", icon: BarChart },
      ],
    },
    {
      title: "Logistics",
      url: "/logistics",
      items: [
        { title: "Transportation Log", url: "/logistics/log", icon: Truck },
        {
          title: "Freight Management",
          url: "/logistics/freight",
          icon: Package,
        },
        { title: "Reports", url: "/logistics/reports", icon: BarChart },
      ],
    },
  ],
}

export function NavHeader() {
  const _pathname = usePathname()
  const { currentCompany } = useAuthStore()

  const _getUrlWithCompanyId = (url: string) => {
    if (!currentCompany?.companyId) return url
    if (url === "#") return url
    return `/${currentCompany.companyId}${url}`
  }

  return (
    <div className="relative hidden w-full items-center justify-between px-4 sm:flex">
      <div className="flex flex-1 items-center">
        <NavigationMenu>
          <NavigationMenuList>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex flex-1 items-center justify-center">
        {currentCompany && (
          <div className="bg-primary/5 border-primary/10 hover:bg-primary/10 flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all">
            <span className="relative flex h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8">
              <Image
                src={`/uploads/companies/${currentCompany.companyId}.svg`}
                alt={currentCompany.companyName || "Company Logo"}
                width={32}
                height={32}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling?.classList.remove("hidden")
                }}
              />
              <Building2 className="text-primary absolute inset-0 hidden h-7 w-7 sm:h-8 sm:w-8" />
            </span>
            <span className="text-foreground max-w-[200px] truncate text-base font-semibold sm:max-w-[250px] sm:text-lg md:max-w-[300px] lg:max-w-[400px]">
              {currentCompany.companyName}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1" />
    </div>
  )
}
