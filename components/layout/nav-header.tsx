"use client"

import Link from "next/link"
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

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
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
        { title: "Reports", url: "/ap/reports", icon: BarChart },
      ],
    },
    {
      title: "CB",
      url: "/cb",
      items: [
        { title: "General Payment", url: "/cb/payment", icon: MinusCircle },
        { title: "General Receipt", url: "/cb/receipt", icon: PlusCircle },
        { title: "Batch Payment", url: "/cb/batch-payment", icon: FileStack },
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
        { title: "Freight Management", url: "/logistics/freight", icon: Package },
        { title: "Reports", url: "/logistics/reports", icon: BarChart },
      ],
    },
  ],
}

export function NavHeader() {
  const pathname = usePathname()
  const { currentCompany } = useAuthStore()

  // Function to add company ID to URL
  const getUrlWithCompanyId = (url: string) => {
    if (!currentCompany?.companyId) return url
    if (url === "#") return url
    return `/${currentCompany.companyId}${url}`
  }

  return (
    <div className="relative hidden w-full items-center justify-between px-4 sm:flex">
      {/* Left Navigation */}
      <div className="flex flex-1 items-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href={getUrlWithCompanyId("/home")}
                  className={cn(
                    "hover:text-primary text-sm leading-none font-medium transition-colors",
                    pathname === getUrlWithCompanyId("/home") && "text-primary"
                  )}
                >
                  Home
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Operations Navigation - COMMENTED OUT */}
            {/* <NavigationMenuItem>
          <NavigationMenuTrigger
            className={
              pathname.startsWith(getUrlWithCompanyId(data.projectNav[0].url))
                ? "text-primary"
                : ""
            }
          >
            Operations
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] md:w-[400px] md:grid-cols-3 lg:w-[500px]">
              {data.projectNav[0].items.map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={getUrlWithCompanyId(item.url)}
                      className={cn(
                        "hover:bg-primary/20 hover:text-primary rounded-md text-sm leading-none font-medium transition duration-300 ease-in-out",
                        pathname === getUrlWithCompanyId(item.url) &&
                          "bg-primary/10 text-primary"
                      )}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem> */}

            {/* AR Navigation - COMMENTED OUT */}
            {/* <NavigationMenuItem>
          <NavigationMenuTrigger
            className={
              pathname.startsWith(getUrlWithCompanyId(data.accountNav[0].url))
                ? "text-primary"
                : ""
            }
          >
            AR
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] md:w-[400px] md:grid-cols-3 lg:w-[500px]">
              {data.accountNav[0].items.map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={getUrlWithCompanyId(item.url)}
                      className={cn(
                        "hover:bg-primary/20 hover:text-primary rounded-md text-sm leading-none font-medium transition duration-300 ease-in-out",
                        pathname === getUrlWithCompanyId(item.url) &&
                          "bg-primary/10 text-primary"
                      )}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem> */}

            {/* AP Navigation - COMMENTED OUT */}
            {/* <NavigationMenuItem>
          <NavigationMenuTrigger
            className={
              pathname.startsWith(getUrlWithCompanyId(data.accountNav[1].url))
                ? "text-primary"
                : ""
            }
          >
            AP
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] md:w-[400px] md:grid-cols-3 lg:w-[500px]">
              {data.accountNav[1].items.map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={getUrlWithCompanyId(item.url)}
                      className={cn(
                        "hover:bg-primary/20 hover:text-primary rounded-md text-sm leading-none font-medium transition duration-300 ease-in-out",
                        pathname === getUrlWithCompanyId(item.url) &&
                          "bg-primary/10 text-primary"
                      )}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem> */}

            {/* CB Navigation - COMMENTED OUT */}
            {/* <NavigationMenuItem>
          <NavigationMenuTrigger
            className={
              pathname.startsWith(getUrlWithCompanyId(data.accountNav[2].url))
                ? "text-primary"
                : ""
            }
          >
            CB
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] md:w-[400px] md:grid-cols-3 lg:w-[500px]">
              {data.accountNav[2].items.map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={getUrlWithCompanyId(item.url)}
                      className={cn(
                        "hover:bg-primary/20 hover:text-primary rounded-md text-sm leading-none font-medium transition duration-300 ease-in-out",
                        pathname === getUrlWithCompanyId(item.url) &&
                          "bg-primary/10 text-primary"
                      )}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem> */}

            {/* GL Navigation - COMMENTED OUT */}
            {/* <NavigationMenuItem>
          <NavigationMenuTrigger
            className={
              pathname.startsWith(getUrlWithCompanyId(data.accountNav[3].url))
                ? "text-primary"
                : ""
            }
          >
            GL
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[300px] md:w-[400px] md:grid-cols-3 lg:w-[500px]">
              {data.accountNav[3].items.map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={getUrlWithCompanyId(item.url)}
                      className={cn(
                        "hover:bg-primary/20 hover:text-primary rounded-md text-sm leading-none font-medium transition duration-300 ease-in-out",
                        pathname === getUrlWithCompanyId(item.url) &&
                          "bg-primary/10 text-primary"
                      )}
                    >
                      {item.title}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem> */}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Center - Company Name */}
      <div className="flex flex-1 items-center justify-center">
        {currentCompany && (
          <div className="bg-primary/5 border-primary/10 hover:bg-primary/10 flex items-center gap-2 rounded-lg border px-4 py-2 shadow-sm backdrop-blur-sm transition-all">
            <Building2 className="text-primary h-4 w-4 flex-shrink-0" />
            <span className="text-foreground max-w-[200px] truncate text-sm font-semibold sm:max-w-[250px] md:max-w-[300px] lg:max-w-[400px]">
              {currentCompany.companyName}
            </span>
          </div>
        )}
      </div>

      {/* Right Side - Reserved for future use */}
      <div className="flex-1" />
    </div>
  )
}
