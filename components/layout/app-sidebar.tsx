"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import {
  AlertTriangle,
  Anchor,
  ArrowLeftRight,
  Award,
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
  CheckCircle,
  ChevronRightIcon,
  CircleDot,
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
  Key,
  Landmark,
  LayoutDashboard,
  ListCheck,
  Lock,
  MapPin,
  MinusCircle,
  Package,
  Pencil,
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
  Target,
  Truck,
  Undo2,
  UserCheck,
  UserRoundPen,
  Users,
  Wallet,
} from "lucide-react"

import { useApprovalCounts } from "@/hooks/use-approval"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { CompanySwitcher } from "@/components/layout/company-switcher"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

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
    master: GalleryVerticalEnd,
    operations: FolderKanban,
    hr: Users,
    ar: Receipt,
    ap: CreditCard,
    cb: Banknote,
    gl: BookOpenText,
    logistics: Truck,
    admin: Landmark,
    settings: Settings,
    requests: ClipboardList,
    approvals: FileCheck,
    document: FileText,
    dashboard: LayoutDashboard,
  }
  return moduleIconMap[moduleCode.toLowerCase()] || FolderKanban
}

// Icon mapping for transactions
const getTransactionIcon = (transactionCode: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
    new: ListCheck,
    checklist: ClipboardList,
    tariff: Coins,
    employees: Users,
    loan: Wallet,
    leave: CalendarDays,
    attendance: Clock,
    payruns: Calendar,
    setting: Settings,
    hrreports: BarChart,
    invoice: Receipt,
    debitnote: FileMinus,
    creditnote: FilePlus,
    receipt: Receipt,
    refund: Undo2,
    adjustment: Sliders,
    documentsetoff: FileStack,
    docsetoff: FileStack,
    jobtransactions: ClipboardList,
    arreports: BarChart,
    payment: MinusCircle,
    batchpayment: FileStack,
    transfer: ArrowLeftRight,
    reconciliation: Scale,
    generalpayment: MinusCircle,
    generalreceipt: PlusCircle,
    banktransfer: ArrowLeftRight,
    journalentry: BookOpen,
    arapcontra: ArrowLeftRight,
    yearend: CalendarCheck,
    yearendprocess: CalendarCheck,
    periodclose: Lock,
    openingbalance: Scale,
    users: Users,
    userroles: UserCheck,
    usergroup: Users,
    userrights: ShieldCheck,
    usergrouprights: Shield,
    // Report-oriented rights
    usergroupreportrights: BarChart,
    userreportrights: BarChart,
    sharedata: Share,
    profile: UserRoundPen,
    auditlog: History,
    errorlog: AlertTriangle,
    userlog: CircleUserRound,
    grid: Grid,
    document: FileText,
    decimal: Scale,
    finance: Wallet,
    lookup: Search,
    account: Briefcase,
    mandatory: FileMinus,
    visible: FilePlus,
    // Master transactions
    carrier: Truck,
    consignmenttype: Package,
    jobstatus: CheckCircle,
    landingpurpose: Target,
    landingtype: MapPin,
    passtype: Key,
    rank: Award,
    servicemode: Sliders,
    taskstatus: CircleDot,
    vatservicecategory: Receipt,
    supplytype: Users,
    visa: Globe,
    geolocation: MapPin,
    transportlocation: MapPin,
    transportmode: Sliders,
    vesseltype: Ship,
    // Cash Book transactions
    cbbankrecon: Scale,
    cbbanktransfer: ArrowLeftRight,
    cbbanktransferctm: ArrowLeftRight,
    cbgenpayment: MinusCircle,
    cbgenreceipt: PlusCircle,
    cbpettycash: HandCoins,
    // AR transactions
    invoice_edit: Pencil,
    invoicectm: Receipt,
    overview: BarChart,
    // Logistics transactions
    freight: Truck,
    transportation: ArrowLeftRight,
    // Status-related transactions
    pending: Clock,
    reports: BarChart,
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

  const visibleTransactions = transactions.filter(
    (transaction) => transaction.isVisible === true
  )

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

  const filteredMenu = Array.from(menuMap.values()).filter(
    (module) => module.items.length > 0
  )
  return filteredMenu
}

// Type definition for main navigation menu items
interface MainNavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  items?: Array<{
    title: string
    url: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

export const menuData: { mainNav: MainNavItem[] } = {
  mainNav: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    // {
    //   title: "Approvals",
    //   url: "/approvals",
    //   icon: ShieldCheck,
    // },
    // {
    //   title: "Document",
    //   url: "/document",
    //   icon: FileStack,
    // },
    // {
    //   title: "Requests",
    //   url: "/requests",
    //   icon: ClipboardList,
    //   items: [
    //     { title: "Loan", url: "/requests/loan", icon: Wallet },
    //     { title: "Leave", url: "/requests/leave", icon: CalendarDays },
    //     { title: "Petty Cash", url: "/requests/pettycash", icon: HandCoins },
    //   ],
    // },
  ],
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { currentCompany } = useAuthStore()
  const { pendingCount: approvalCount, refreshCounts } = useApprovalCounts()
  const { transactions, isLoading: transactionsLoading } = useUserTransactions()
  const { state: sidebarState, isMobile } = useSidebar()
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
  const [selectedMenu, setSelectedMenu] = React.useState<string | null>(null)
  const [selectedSubMenu, setSelectedSubMenu] = React.useState<string | null>(
    null
  )
  const [hoveredMenu, setHoveredMenu] = React.useState<string | null>(null)
  const [hoveredSubMenu, setHoveredSubMenu] = React.useState<string | null>(
    null
  )
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  const dynamicMenu = React.useMemo(() => {
    return buildDynamicMenu(transactions)
  }, [transactions])

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
      if (menu.items) {
        for (const subItem of menu.items) {
          if (currentPath === getUrlWithCompanyId(subItem.url)) {
            setSelectedMenu(menu.title)
            setOpenMenu(menu.title)
            setSelectedSubMenu(subItem.title)
            return
          }
        }
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

  React.useEffect(() => {
    refreshCounts()
  }, [refreshCounts])

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

  const handleMouseEnter = (menuTitle: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setHoveredMenu(menuTitle)
  }

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null)
      closeTimeoutRef.current = null
    }, 150)
  }

  const handlePopoverContentMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  return (
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
                  sidebarState === "collapsed" && !isMobile ? (
                    <Popover open={hoveredMenu === item.title}>
                      <PopoverTrigger asChild>
                        <SidebarMenuButton
                          tooltip={
                            sidebarState === "collapsed" && !isMobile
                              ? undefined
                              : item.title
                          }
                          onMouseEnter={() => handleMouseEnter(item.title)}
                          onMouseLeave={handleMouseLeave}
                          className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary relative transition-colors duration-200 ${
                            isMenuActive(item.title) ||
                            hoveredMenu === item.title
                              ? "bg-primary/20 text-primary"
                              : ""
                          }`}
                        >
                          <div className="relative">
                            {item.icon && <item.icon className="h-4 w-4" />}
                          </div>
                          <span>{item.title}</span>
                          {item.title === "Approvals" && approvalCount > 0 && (
                            <SidebarMenuBadge>{approvalCount}</SidebarMenuBadge>
                          )}
                        </SidebarMenuButton>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        className="max-h-[calc(100vh-2rem)] w-56 overflow-y-auto p-0"
                        onMouseEnter={handlePopoverContentMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Header */}
                        <div className="bg-muted/50 flex items-center gap-2 border-b px-3 py-2">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span className="font-small text-foreground">
                            {item.title}
                          </span>
                        </div>

                        {/* Sub-menu items */}
                        <div className="py-1.5">
                          {item.items.map((subItem) => (
                            <div key={subItem.url} className="[&>a]:flex">
                              <Link
                                href={getUrlWithCompanyId(subItem.url)}
                                onClick={() =>
                                  handleSubMenuClick(item.title, subItem.title)
                                }
                                className={`text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                                  pathname === getUrlWithCompanyId(subItem.url)
                                    ? "bg-accent text-foreground"
                                    : ""
                                }`}
                              >
                                {subItem.icon && (
                                  <subItem.icon className="h-4 w-4" />
                                )}
                                <span>{subItem.title}</span>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Collapsible
                      asChild
                      open={openMenu === item.title}
                      className="group/collapsible"
                    >
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            onClick={() => handleMenuClick(item.title)}
                            onMouseEnter={() => handleMouseEnter(item.title)}
                            onMouseLeave={() => setHoveredMenu(null)}
                            className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary relative transition-colors duration-200 ${
                              isMenuActive(item.title) ||
                              hoveredMenu === item.title
                                ? "bg-primary/20 text-primary"
                                : ""
                            }`}
                          >
                            <div className="relative">
                              {item.icon && <item.icon className="h-4 w-4" />}
                            </div>
                            <span>{item.title}</span>
                            {item.title === "Approvals" &&
                              approvalCount > 0 && (
                                <SidebarMenuBadge>
                                  {approvalCount}
                                </SidebarMenuBadge>
                              )}
                            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  onMouseEnter={() =>
                                    setHoveredSubMenu(subItem.title)
                                  }
                                  onMouseLeave={() => setHoveredSubMenu(null)}
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
                                    <span className="text-xs">
                                      {subItem.title}
                                    </span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    onMouseEnter={() => handleMouseEnter(item.title)}
                    onMouseLeave={() => setHoveredMenu(null)}
                    className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary relative transition-colors duration-200 ${
                      isMenuActive(item.title) || hoveredMenu === item.title
                        ? "bg-primary/20 text-primary"
                        : ""
                    }`}
                  >
                    <Link href={getUrlWithCompanyId(item.url)}>
                      <div className="relative">
                        {item.icon && <item.icon className="h-4 w-4" />}
                      </div>
                      <span>{item.title}</span>
                      {item.title === "Approvals" && approvalCount > 0 && (
                        <SidebarMenuBadge>{approvalCount}</SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
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
                <SidebarMenuItem key={group.title}>
                  {group.items && sidebarState === "collapsed" && !isMobile ? (
                    <Popover open={hoveredMenu === group.title}>
                      <PopoverTrigger asChild>
                        <SidebarMenuButton
                          tooltip={
                            sidebarState === "collapsed" && !isMobile
                              ? undefined
                              : group.title
                          }
                          onMouseEnter={() => handleMouseEnter(group.title)}
                          onMouseLeave={handleMouseLeave}
                          className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                            isMenuActive(group.title) ||
                            hoveredMenu === group.title
                              ? "bg-primary/20 text-primary"
                              : ""
                          }`}
                        >
                          {group.icon && <group.icon className="h-4 w-4" />}
                          <span>{group.title}</span>
                        </SidebarMenuButton>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        className="max-h-[calc(100vh-2rem)] w-56 overflow-y-auto p-0"
                        onMouseEnter={handlePopoverContentMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Header */}
                        <div className="bg-muted/50 flex items-center gap-2 border-b px-3 py-2">
                          {group.icon && <group.icon className="h-4 w-4" />}
                          <span className="text-foreground text-xs font-medium">
                            {group.title}
                          </span>
                        </div>

                        {/* Sub-menu items */}
                        <div className="py-1.5">
                          {group.items.map((subItem) => (
                            <div key={subItem.title} className="[&>a]:flex">
                              <Link
                                href={getUrlWithCompanyId(subItem.url)}
                                onClick={() =>
                                  handleSubMenuClick(group.title, subItem.title)
                                }
                                className={`text-muted-foreground hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                                  pathname === getUrlWithCompanyId(subItem.url)
                                    ? "bg-accent text-foreground"
                                    : ""
                                }`}
                              >
                                {subItem.icon && (
                                  <subItem.icon className="h-4 w-4" />
                                )}
                                <span className="text-xs">{subItem.title}</span>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Collapsible
                      asChild
                      open={openMenu === group.title}
                      className="group/collapsible"
                    >
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={group.title}
                            onClick={() => handleMenuClick(group.title)}
                            onMouseEnter={() => handleMouseEnter(group.title)}
                            onMouseLeave={() => setHoveredMenu(null)}
                            className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                              isMenuActive(group.title) ||
                              hoveredMenu === group.title
                                ? "bg-primary/20 text-primary"
                                : ""
                            }`}
                          >
                            {group.icon && <group.icon className="h-4 w-4" />}
                            <span>{group.title}</span>
                            {group.items && (
                              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {group.items && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {group.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    onMouseEnter={() =>
                                      setHoveredSubMenu(subItem.title)
                                    }
                                    onMouseLeave={() => setHoveredSubMenu(null)}
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
                                          group.title,
                                          subItem.title
                                        )
                                      }
                                    >
                                      {subItem.icon && (
                                        <subItem.icon className="h-4 w-4" />
                                      )}
                                      <span className="text-xs">
                                        {subItem.title}
                                      </span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </div>
                    </Collapsible>
                  )}
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
