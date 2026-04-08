"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import {
  AlertTriangle,
  Anchor,
  ArrowLeftRight,
  Banknote,
  BarChart,
  BookOpen,
  BookOpenText,
  Box,
  Briefcase,
  Building,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ChartArea,
  ChevronRightIcon,
  CircleUserRound,
  ClipboardList,
  Clock,
  Coins,
  CreditCard,
  FileCheck,
  FileMinus,
  FilePlus,
  FileStack,
  FileText,
  FileX,
  FolderKanban,
  GalleryVerticalEnd,
  Globe,
  GraduationCap,
  Grid,
  HandCoins,
  History,
  Landmark,
  LayoutDashboard,
  ListCheck,
  Lock,
  MapPin,
  MinusCircle,
  PlusCircle,
  Receipt,
  Scale,
  Search,
  Settings,
  Share,
  Shield,
  ShieldCheck,
  Ship,
  Sliders,
  Undo2,
  UserCheck,
  UserRoundPen,
  Users,
  Wallet,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CompanySwitcher } from "@/components/layout/company-switcher"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible"

// Interface for user transaction data
interface IUserTransaction {
  moduleId: number
  moduleCode: string
  moduleName: string
  transactionId: number
  transactionCode: string
  transactionName: string
  transCategoryId: number
  transCategoryCode: string
  transCategoryName: string
  seqNo: number
  transCatSeqNo: number
  isRead: boolean
  isCreate: boolean
  isEdit: boolean
  isDelete: boolean
  isExport: boolean
  isPrint: boolean
  isPost: boolean
  isVisible: boolean
}
// Icon mapping for modules (main categories)
const getModuleIcon = (moduleCode: string) => {
  const moduleIconMap: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    // Main Modules
    master: GalleryVerticalEnd,
    operations: FolderKanban,
    hr: Users,
    ar: Receipt,
    ap: CreditCard,
    cb: Banknote,
    gl: BookOpenText,
    admin: Landmark,
    settings: Settings,
    requests: ClipboardList,
    document: FileText,
    dashboard: LayoutDashboard,
  }
  return moduleIconMap[moduleCode.toLowerCase()] || FolderKanban
}
// Icon mapping for transactions
const getTransactionIcon = (transactionCode: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    // Master Data
    accountgroup: Landmark,
    accountsetup: Sliders,
    accounttype: Landmark,
    bank: Banknote,
    barge: Ship,
    category: FolderKanban,
    chartofaccount: ChartArea,
    charge: Coins,
    country: Globe,
    creditterm: Calendar,
    currency: Coins,
    customer: Users,
    department: Building,
    designation: GraduationCap,
    documenttype: FileX,
    entitytypes: Building,
    gst: FileText,
    leavetype: CalendarDays,
    loantype: Wallet,
    ordertype: FileStack,
    paymenttype: Wallet,
    port: Anchor,
    portregion: MapPin,
    product: Box,
    servicetype: Briefcase,
    subcategory: FolderKanban,
    supplier: Building,
    task: FileCheck,
    tax: FileText,
    uom: Scale,
    vessel: Ship,
    voyage: ArrowLeftRight,
    worklocation: MapPin,
    // Operations
    new: ListCheck,
    checklist: ClipboardList,
    tariff: Coins,
    // HR
    employees: Users,
    loan: Wallet,
    leave: CalendarDays,
    attendance: Clock,
    payruns: Calendar,
    setting: Settings,
    hrreports: BarChart,
    // AR (Accounts Receivable)
    invoice: Receipt,
    debitnote: FileMinus,
    creditnote: FilePlus,
    receipt: Receipt,
    refund: Undo2,
    adjustment: Sliders,
    documentsetoff: FileStack,
    arreports: BarChart,
    // AP (Accounts Payable)
    payment: MinusCircle,
    batchpayment: FileStack,
    transfer: ArrowLeftRight,
    reconciliation: Scale,
    // CB (Cash Book)
    generalpayment: MinusCircle,
    generalreceipt: PlusCircle,
    banktransfer: ArrowLeftRight,
    // GL (General Ledger)
    journalentry: BookOpen,
    arapcontra: ArrowLeftRight,
    yearend: CalendarCheck,
    periodclose: Lock,
    openingbalance: Scale,
    // Admin
    users: Users,
    userroles: UserCheck,
    usergroup: Users,
    userrights: ShieldCheck,
    usergrouprights: Shield,
    sharedata: Share,
    profile: UserRoundPen,
    auditlog: History,
    errorlog: AlertTriangle,
    userlog: CircleUserRound,
    // Settings
    grid: Grid,
    document: FileText,
    decimal: Scale,
    finance: Wallet,
    lookup: Search,
    account: Briefcase,
    mandatory: FileMinus,
    visible: FilePlus,
  }
  return iconMap[transactionCode.toLowerCase()] || FileText
}
// Hook to get user transactions (uses cached data from auth store)
const useUserTransactions = () => {
  const { currentCompany, user, getUserTransactions } = useAuthStore()
  const [transactions, setTransactions] = React.useState<IUserTransaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentCompany || !user) {
        setIsLoading(false)
        setTransactions([])
        return
      }
      try {
        setIsLoading(true)
        setError(null)
        // This will use cached data if available, or fetch if not cached
        const data = await getUserTransactions()
        if (Array.isArray(data)) {
          setTransactions(data as IUserTransaction[])
        } else {
          console.warn("Transactions data is not an array:", data)
          setTransactions([])
        }
      } catch (err) {
        console.error("Error fetching user transactions:", err)
        setError(
          err instanceof Error ? err.message : "Failed to fetch transactions"
        )
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [currentCompany, user, getUserTransactions])

  return { transactions, isLoading, error }
}
// Function to build dynamic menu from transactions
interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  permissions?: {
    read: boolean
    create: boolean
    edit: boolean
    delete: boolean
    export: boolean
    print: boolean
    post: boolean
  }
}
// Removed unused SettingNavItem interface
const buildDynamicMenu = (transactions: IUserTransaction[]) => {
  const menuMap = new Map<
    string,
    {
      title: string
      url: string
      icon: React.ComponentType<{ className?: string }>
      items: MenuItem[]
    }
  >()
  // Filter transactions by isVisible=true first
  const visibleTransactions = transactions.filter(
    (transaction) => transaction.isVisible === true
  )
  // Group visible transactions by module
  visibleTransactions.forEach((transaction) => {
    const moduleKey = `${transaction.moduleId}_${transaction.moduleName}`
    if (!menuMap.has(moduleKey)) {
      menuMap.set(moduleKey, {
        title: transaction.moduleName,
        url: `/${transaction.moduleCode.toLowerCase()}`,
        icon: getModuleIcon(transaction.moduleCode.toLowerCase()),
        items: [],
      })
    }
    const moduleData = menuMap.get(moduleKey)
    if (moduleData) {
      moduleData.items.push({
        title: transaction.transactionName,
        url: `/${transaction.moduleCode.toLowerCase()}/${transaction.transactionCode.toLowerCase()}`,
        icon: getTransactionIcon(transaction.transactionCode.toLowerCase()),
        permissions: {
          read: transaction.isRead,
          create: transaction.isCreate,
          edit: transaction.isEdit,
          delete: transaction.isDelete,
          export: transaction.isExport,
          print: transaction.isPrint,
          post: transaction.isPost,
        },
      })
    }
  })
  // Filter out modules that have no visible items
  const filteredMenu = Array.from(menuMap.values()).filter(
    (module) => module.items.length > 0
  )
  return filteredMenu
}
export const menuData = {
  mainNav: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      items: [
        {
          title: "Finance & Accounting Overview",
          url: "/dashboard/dashboard1",
          icon: BookOpenText,
        },
        {
          title: "Accounts Receivable (AR) & Collections",
          url: "/dashboard/dashboard2",
          icon: Banknote,
        },
        {
          title: "Accounts Payable (AP) & Procurement",
          url: "/dashboard/dashboard3",
          icon: Users,
        },
        {
          title: "Management & Procurement Insights",
          url: "/dashboard/dashboard4",
          icon: Building,
        },
      ],
    },
    {
      title: "Document",
      url: "/document",
      icon: FileText,
    },
    {
      title: "Requests",
      url: "/requests",
      icon: ClipboardList,
      items: [
        { title: "Loan", url: "/requests/loan", icon: Wallet },
        { title: "Leave", url: "/requests/leave", icon: CalendarDays },
        {
          title: "Petty Cash",
          url: "/requests/pettycash",
          icon: HandCoins,
        },
      ],
    },
  ],
}
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { currentCompany } = useAuthStore()
  const { transactions, isLoading: transactionsLoading } = useUserTransactions()
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
  const [selectedMenu, setSelectedMenu] = React.useState<string | null>(null)
  const [selectedSubMenu, setSelectedSubMenu] = React.useState<string | null>(
    null
  )
  const [hoveredMenu, setHoveredMenu] = React.useState<string | null>(null)
  const [hoveredSubMenu, setHoveredSubMenu] = React.useState<string | null>(
    null
  )
  const [floatingMenuOpen, setFloatingMenuOpen] = React.useState<string | null>(
    null
  )
  const pathname = usePathname()

  // Debug floating menu state
  React.useEffect(() => {
    console.log("Floating menu state changed:", floatingMenuOpen)
  }, [floatingMenuOpen])
  // Build dynamic menu from user transactions
  const dynamicMenu = React.useMemo(() => {
    return buildDynamicMenu(transactions)
  }, [transactions])
  // Removed unused platformNavs and settingNavs as we use dynamicMenu instead
  const getUrlWithCompanyId = React.useCallback(
    (url: string) => {
      if (!currentCompany?.companyId) return url
      if (url === "#") return url
      return `/${currentCompany.companyId}${url}`
    },
    [currentCompany?.companyId]
  )
  React.useEffect(() => {
    const currentPath = pathname
    for (const menu of menuData.mainNav) {
      if (currentPath === getUrlWithCompanyId(menu.url)) {
        setSelectedMenu(menu.title)
        setOpenMenu(null)
        setSelectedSubMenu(null)
        return
      }
    }
    for (const group of dynamicMenu) {
      for (const subItem of group.items || []) {
        if (currentPath === getUrlWithCompanyId(subItem.url)) {
          setSelectedMenu(group.title)
          setOpenMenu(group.title)
          setSelectedSubMenu(subItem.title)
          return
        }
      }
    }
  }, [pathname, getUrlWithCompanyId, dynamicMenu])
  const handleMenuClick = (menuTitle: string) => {
    setOpenMenu(openMenu === menuTitle ? null : menuTitle)
    setSelectedMenu(menuTitle)
    setSelectedSubMenu(null)
  }
  const handleSubMenuClick = (menuTitle: string, subMenuTitle: string) => {
    setSelectedMenu(menuTitle)
    setSelectedSubMenu(subMenuTitle)
  }
  const isMenuActive = (menuTitle: string) => {
    return selectedMenu === menuTitle || openMenu === menuTitle
  }
  const isSubMenuActive = (subMenuTitle: string) => {
    return selectedSubMenu === subMenuTitle
  }

  // Floating sub-menu component
  const FloatingSubMenu = ({
    items,
    parentTitle,
    isOpen,
    onCloseAction,
  }: {
    items: MenuItem[]
    parentTitle: string
    isOpen: boolean
    onCloseAction: () => void
  }) => {
    if (!isOpen || !items || items.length === 0) {
      return null
    }

    console.log("FloatingSubMenu rendering:", {
      parentTitle,
      isOpen,
      itemsLength: items.length,
    })

    return (
      <div
        className="absolute top-0 left-full z-[9999] ml-2"
        onMouseEnter={() => {
          console.log("FloatingSubMenu hover enter:", parentTitle)
          // Keep menu open when hovering over it
          setFloatingMenuOpen(parentTitle)
        }}
        onMouseLeave={() => {
          console.log("FloatingSubMenu hover leave:", parentTitle)
          // Close menu when leaving the floating menu
          setTimeout(() => setFloatingMenuOpen(null), 100)
        }}
      >
        <div className="bg-background border-border max-w-[300px] min-w-[200px] rounded-lg border p-3 shadow-xl">
          <div className="text-muted-foreground mb-3 px-1 text-xs font-semibold tracking-wide uppercase">
            {parentTitle}
          </div>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.title}
                href={getUrlWithCompanyId(item.url)}
                onClick={() => {
                  handleSubMenuClick(parentTitle, item.title)
                  onCloseAction()
                }}
                className="hover:bg-primary/10 hover:text-primary group flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 hover:shadow-sm"
                onMouseEnter={() => setHoveredSubMenu(item.title)}
                onMouseLeave={() => setHoveredSubMenu(null)}
              >
                {item.icon && (
                  <item.icon className="text-muted-foreground group-hover:text-primary h-4 w-4 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {item.title}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {item.url}
                  </div>
                  {item.permissions && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.permissions.create && (
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                          Create
                        </span>
                      )}
                      {item.permissions.edit && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
                          Edit
                        </span>
                      )}
                      {item.permissions.delete && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">
                          Delete
                        </span>
                      )}
                      {item.permissions.export && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800">
                          Export
                        </span>
                      )}
                      {item.permissions.print && (
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800">
                          Print
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar collapsible="icon" className={props.className} {...props}>
        <SidebarHeader>
          <CompanySwitcher />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="p-1">
            <div className="flex flex-col gap-0.5">
              {menuData.mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  {item.items ? (
                    // Collapsible menu item with sub-items
                    <Collapsible
                      asChild
                      open={openMenu === item.title}
                      className="group/collapsible"
                    >
                      <div className="relative">
                        <CollapsibleTrigger asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => handleMenuClick(item.title)}
                                onMouseEnter={() => {
                                  console.log(
                                    "Main menu hover enter:",
                                    item.title
                                  )
                                  setHoveredMenu(item.title)
                                  setFloatingMenuOpen(item.title)
                                  // Add a visual indicator
                                  document.title = `HOVERING: ${item.title}`
                                }}
                                onMouseLeave={() => {
                                  console.log(
                                    "Main menu hover leave:",
                                    item.title
                                  )
                                  setHoveredMenu(null)
                                  // Delay closing to allow hover on floating menu
                                  setTimeout(
                                    () => setFloatingMenuOpen(null),
                                    100
                                  )
                                }}
                                className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary relative transition-colors duration-200 ${
                                  isMenuActive(item.title) ||
                                  hoveredMenu === item.title
                                    ? "bg-primary/20 text-primary"
                                    : ""
                                }`}
                              >
                                <div className="relative">
                                  {item.icon && (
                                    <item.icon className="h-4 w-4" />
                                  )}
                                </div>
                                <span>{item.title}</span>
                                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="ml-2">
                              <p className="font-medium">{item.title}</p>
                              {item.items && (
                                <div className="text-muted-foreground mt-2 text-xs">
                                  <div className="mb-1 font-medium">
                                    Sub-items:
                                  </div>
                                  <div className="space-y-1">
                                    {item.items.map((subItem, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2"
                                      >
                                        {subItem.icon && (
                                          <subItem.icon className="h-3 w-3" />
                                        )}
                                        <span>{subItem.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </CollapsibleTrigger>

                        {/* Floating Sub-menu on Hover */}
                        <FloatingSubMenu
                          items={item.items}
                          parentTitle={item.title}
                          isOpen={floatingMenuOpen === item.title}
                          onCloseAction={() => setFloatingMenuOpen(null)}
                        />

                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <SidebarMenuSubButton
                                      asChild
                                      onMouseEnter={() =>
                                        setHoveredSubMenu(subItem.title)
                                      }
                                      onMouseLeave={() =>
                                        setHoveredSubMenu(null)
                                      }
                                      className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                                        isSubMenuActive(subItem.title) ||
                                        hoveredSubMenu === subItem.title
                                          ? "bg-primary/20 text-primary"
                                          : ""
                                      }`}
                                    >
                                      <Link
                                        href={getUrlWithCompanyId(subItem.url)}
                                        onClick={() =>
                                          handleSubMenuClick(
                                            item.title,
                                            subItem.title
                                          )
                                        }
                                      >
                                        {subItem.icon && (
                                          <subItem.icon className="h-4 w-4" />
                                        )}
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="ml-2">
                                    <p className="font-medium">
                                      {subItem.title}
                                    </p>
                                    <div className="text-muted-foreground mt-1 text-xs">
                                      {subItem.url}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ) : (
                    // Simple menu item without sub-items (direct link)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          onMouseEnter={() => setHoveredMenu(item.title)}
                          onMouseLeave={() => setHoveredMenu(null)}
                          className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary relative transition-colors duration-200 ${
                            isMenuActive(item.title) ||
                            hoveredMenu === item.title
                              ? "bg-primary/20 text-primary"
                              : ""
                          }`}
                        >
                          <Link href={getUrlWithCompanyId(item.url)}>
                            <div className="relative">
                              {item.icon && <item.icon className="h-4 w-4" />}
                            </div>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2">
                        <p className="font-medium">{item.title}</p>
                        <div className="text-muted-foreground mt-1 text-xs">
                          {item.url}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </SidebarMenuItem>
              ))}
            </div>
          </SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroup className="p-1">
            <SidebarMenu className="gap-0.5">
              {transactionsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Spinner size="sm" />
                    <span>Loading menu...</span>
                  </div>
                </div>
              ) : (
                dynamicMenu.map((group) => (
                  <Collapsible
                    key={group.title}
                    asChild
                    open={openMenu === group.title}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <div className="relative">
                        <CollapsibleTrigger asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                onClick={() => handleMenuClick(group.title)}
                                onMouseEnter={() => {
                                  console.log(
                                    "Dynamic menu hover enter:",
                                    group.title
                                  )
                                  setHoveredMenu(group.title)
                                  setFloatingMenuOpen(group.title)
                                  // Add a visual indicator
                                  document.title = `HOVERING: ${group.title}`
                                }}
                                onMouseLeave={() => {
                                  console.log(
                                    "Dynamic menu hover leave:",
                                    group.title
                                  )
                                  setHoveredMenu(null)
                                  // Delay closing to allow hover on floating menu
                                  setTimeout(
                                    () => setFloatingMenuOpen(null),
                                    100
                                  )
                                }}
                                className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                                  isMenuActive(group.title) ||
                                  hoveredMenu === group.title
                                    ? "bg-primary/20 text-primary"
                                    : ""
                                }`}
                              >
                                {group.icon && (
                                  <group.icon className="h-4 w-4" />
                                )}
                                <span>{group.title}</span>
                                {group.items && (
                                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                )}
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="ml-2">
                              <p className="font-medium">{group.title}</p>
                              {group.items && (
                                <div className="text-muted-foreground mt-1 text-xs">
                                  {group.items.length} transactions
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </CollapsibleTrigger>

                        {/* Floating Sub-menu on Hover */}
                        <FloatingSubMenu
                          items={group.items}
                          parentTitle={group.title}
                          isOpen={floatingMenuOpen === group.title}
                          onCloseAction={() => setFloatingMenuOpen(null)}
                        />

                        {group.items && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {group.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <SidebarMenuSubButton
                                        asChild
                                        onMouseEnter={() =>
                                          setHoveredSubMenu(subItem.title)
                                        }
                                        onMouseLeave={() =>
                                          setHoveredSubMenu(null)
                                        }
                                        className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                                          isSubMenuActive(subItem.title) ||
                                          hoveredSubMenu === subItem.title
                                            ? "bg-primary/20 text-primary"
                                            : ""
                                        }`}
                                      >
                                        <Link
                                          href={getUrlWithCompanyId(
                                            subItem.url
                                          )}
                                          onClick={() =>
                                            handleSubMenuClick(
                                              group.title,
                                              subItem.title
                                            )
                                          }
                                        >
                                          {subItem.icon && (
                                            <subItem.icon className="h-4 w-4" />
                                          )}
                                          <span>{subItem.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="right"
                                      className="ml-2"
                                    >
                                      <p className="font-medium">
                                        {subItem.title}
                                      </p>
                                      <div className="text-muted-foreground mt-1 text-xs">
                                        {subItem.url}
                                      </div>
                                      {subItem.permissions && (
                                        <div className="mt-2 space-y-1">
                                          <div className="text-xs font-medium">
                                            Permissions:
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {subItem.permissions.create && (
                                              <span className="rounded bg-green-100 px-1 py-0.5 text-xs text-green-800">
                                                Create
                                              </span>
                                            )}
                                            {subItem.permissions.edit && (
                                              <span className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-800">
                                                Edit
                                              </span>
                                            )}
                                            {subItem.permissions.delete && (
                                              <span className="rounded bg-red-100 px-1 py-0.5 text-xs text-red-800">
                                                Delete
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </div>
                    </SidebarMenuItem>
                  </Collapsible>
                ))
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  )
}
