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

interface MenuGroup {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  items?: MenuItem[]
  isDirectLink?: boolean
}

// Transaction-type grouping for AR, AP, CB, GL (URLs unchanged)
const ACCOUNT_MODULES = ["ar", "ap", "cb", "gl"] as const

const ACCOUNT_CATEGORY_ORDER = [
  "overview",
  "invoice",
  "creditnote",
  "debitnote",
  "receipt",
  "payment",
  "refund",
  "bank",
  "pettycash",
  "gl",
  "adjustment",
  "setoff",
  "reports",
  "other",
] as const

const ACCOUNT_CATEGORY_CONFIG: Record<
  string,
  { category: string; displayLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "ar_overview": { category: "overview", displayLabel: "AR Overview", icon: BarChart },
  "ap_overview": { category: "overview", displayLabel: "AP Overview", icon: BarChart },
  "cb_overview": { category: "overview", displayLabel: "CB Overview", icon: BarChart },
  "gl_overview": { category: "overview", displayLabel: "GL Overview", icon: BarChart },
  "ar_invoice": { category: "invoice", displayLabel: "AR Invoice", icon: Receipt },
  "ap_invoice": { category: "invoice", displayLabel: "AP Invoice", icon: Receipt },
  "ar_invoicectm": { category: "invoice", displayLabel: "AR Invoice CTM", icon: Receipt },
  "ar_creditnote": { category: "creditnote", displayLabel: "AR Credit Note", icon: FilePlus },
  "ap_creditnote": { category: "creditnote", displayLabel: "AP Credit Note", icon: FilePlus },
  "ar_debitnote": { category: "debitnote", displayLabel: "AR Debit Note", icon: FileMinus },
  "ap_debitnote": { category: "debitnote", displayLabel: "AP Debit Note", icon: FileMinus },
  "ar_receipt": { category: "receipt", displayLabel: "AR Receipt", icon: PlusCircle },
  "cb_cbgenreceipt": { category: "receipt", displayLabel: "CB Receipt", icon: PlusCircle },
  "ar_receiptmulticurrency": { category: "receipt", displayLabel: "AR Receipt Multicurrency", icon: PlusCircle },
  "ap_payment": { category: "payment", displayLabel: "AP Payment", icon: MinusCircle },
  "cb_cbgenpayment": { category: "payment", displayLabel: "CB Payment", icon: MinusCircle },
  "ar_refund": { category: "refund", displayLabel: "AR Refund", icon: Undo2 },
  "ap_refund": { category: "refund", displayLabel: "AP Refund", icon: Undo2 },
  "ar_docsetoff": { category: "setoff", displayLabel: "AR Doc Setoff", icon: FileStack },
  "ar_documentsetoff": { category: "setoff", displayLabel: "AR Doc Setoff", icon: FileStack },
  "ap_docsetoff": { category: "setoff", displayLabel: "AP Doc Setoff", icon: FileStack },
  "ap_documentsetoff": { category: "setoff", displayLabel: "AP Doc Setoff", icon: FileStack },
  "gl_arapcontra": { category: "setoff", displayLabel: "GL Contra", icon: ArrowLeftRight },
  "cb_cbbanktransfer": { category: "bank", displayLabel: "CB Bank Transfer", icon: ArrowLeftRight },
  "cb_cbbanktransferctm": { category: "bank", displayLabel: "CB Bank Transfer CTM", icon: ArrowLeftRight },
  "cb_cbbankrecon": { category: "bank", displayLabel: "CB Bank Reconciliation", icon: Scale },
  "gl_journalentry": { category: "gl", displayLabel: "GL Journal", icon: BookOpen },
  "cb_cbpettycash": { category: "pettycash", displayLabel: "Petty Cash", icon: HandCoins },
  "ar_adjustment": { category: "adjustment", displayLabel: "AR Adjustment", icon: Sliders },
  "ap_adjustment": { category: "adjustment", displayLabel: "AP Adjustment", icon: Sliders },
  "ar_reports": { category: "reports", displayLabel: "AR Reports", icon: BarChart },
  "ap_reports": { category: "reports", displayLabel: "AP Reports", icon: BarChart },
  "cb_reports": { category: "reports", displayLabel: "CB Reports", icon: BarChart },
  "gl_reports": { category: "reports", displayLabel: "GL Reports", icon: BarChart },
  "ap_jobtransactions": { category: "other", displayLabel: "Job Transactions", icon: ClipboardList },
  "gl_yearendprocess": { category: "other", displayLabel: "Year-End Process", icon: CalendarCheck },
  "gl_periodclose": { category: "other", displayLabel: "GL Period Close", icon: Lock },
  "gl_openingbalance": { category: "other", displayLabel: "Opening Balance", icon: Scale },
  "ar_invoice_edit": { category: "other", displayLabel: "AR Invoice Edit", icon: Pencil },
  "gl_fixedasset": { category: "other", displayLabel: "Fixed Asset", icon: Landmark },
}

const ACCOUNT_CATEGORY_META: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }>; isDirectLink: boolean }
> = {
  overview: { title: "Overview", icon: BarChart, isDirectLink: false },
  invoice: { title: "Invoice", icon: Receipt, isDirectLink: false },
  creditnote: { title: "Credit Note", icon: FilePlus, isDirectLink: false },
  debitnote: { title: "Debit Note", icon: FileMinus, isDirectLink: false },
  receipt: { title: "Receipt", icon: PlusCircle, isDirectLink: false },
  payment: { title: "Payment", icon: MinusCircle, isDirectLink: false },
  refund: { title: "Refund", icon: Undo2, isDirectLink: false },
  setoff: { title: "Setoff", icon: FileStack, isDirectLink: false },
  bank: { title: "Bank", icon: ArrowLeftRight, isDirectLink: false },
  gl: { title: "Journal Entry", icon: BookOpen, isDirectLink: true },
  pettycash: { title: "Petty Cash", icon: HandCoins, isDirectLink: true },
  adjustment: { title: "Adjustment", icon: Sliders, isDirectLink: false },
  reports: { title: "Reports", icon: BarChart, isDirectLink: false },
  other: { title: "Other", icon: FolderKanban, isDirectLink: false },
}

const getModuleDisplayPrefix = (moduleCode: string) => {
  const m = moduleCode.toUpperCase()
  return m === "AR" ? "AR" : m === "AP" ? "AP" : m === "CB" ? "CB" : m === "GL" ? "GL" : moduleCode
}

const buildAccountMenu = (transactions: IUserTransaction[]): MenuGroup[] => {
  const categoryMap = new Map<string, MenuItem[]>()
  const directLinkMap = new Map<string, MenuItem>()

  transactions.forEach((t) => {
    const mod = t.moduleCode.toLowerCase()
    const trn = t.transactionCode.toLowerCase()
    const key = `${mod}_${trn}`
    const config = ACCOUNT_CATEGORY_CONFIG[key]
    const category = config?.category ?? "other"
    const displayLabel = config?.displayLabel ?? `${getModuleDisplayPrefix(t.moduleCode)} ${t.transactionName}`
    const icon = config?.icon ?? getTransactionIcon(trn)

    if (!ACCOUNT_CATEGORY_META[category]) return
    const url = `/${mod}/${trn}`
    const menuItem: MenuItem = {
      title: displayLabel,
      url,
      icon,
      permissions: {
        read: t.isRead,
        create: t.isCreate,
        edit: t.isEdit,
        delete: t.isDelete,
        export: t.isExport,
        print: t.isPrint,
        post: t.isPost,
      },
    }

    const meta = ACCOUNT_CATEGORY_META[category]
    if (meta?.isDirectLink) {
      directLinkMap.set(category, menuItem)
    } else {
      const list = categoryMap.get(category) ?? []
      list.push(menuItem)
      categoryMap.set(category, list)
    }
  })

  const groups: MenuGroup[] = []
  for (const cat of ACCOUNT_CATEGORY_ORDER) {
    const meta = ACCOUNT_CATEGORY_META[cat]
    if (!meta) continue

    if (meta.isDirectLink) {
      const item = directLinkMap.get(cat)
      if (item) {
        groups.push({
          title: meta.title,
          url: item.url,
          icon: meta.icon,
          items: [],
          isDirectLink: true,
        })
      }
    } else {
      const items = categoryMap.get(cat) ?? []
      if (items.length > 0) {
        groups.push({
          title: meta.title,
          url: `#`,
          icon: meta.icon,
          items,
          isDirectLink: false,
        })
      }
    }
  }
  return groups
}

const buildOtherModulesMenu = (transactions: IUserTransaction[]): MenuGroup[] => {
  const menuMap = new Map<
    string,
    { title: string; url: string; icon: React.ComponentType<{ className?: string }>; items: MenuItem[] }
  >()

  transactions.forEach((t) => {
    const mod = t.moduleCode.toLowerCase()
    if (ACCOUNT_MODULES.includes(mod as (typeof ACCOUNT_MODULES)[number])) return

    const moduleKey = `${t.moduleId}_${t.moduleName}`
    if (!menuMap.has(moduleKey)) {
      menuMap.set(moduleKey, {
        title: t.moduleName,
        url: `/${mod}`,
        icon: getModuleIcon(mod),
        items: [],
      })
    }
    const data = menuMap.get(moduleKey)!
    const trn = t.transactionCode.toLowerCase()
    // Exclude operations/reports – moved to Reports as "Checklist Report"
    if (mod === "operations" && trn === "reports") return
    data.items.push({
      title: t.transactionName,
      url: `/${mod}/${trn}`,
      icon: getTransactionIcon(trn),
      permissions: {
        read: t.isRead,
        create: t.isCreate,
        edit: t.isEdit,
        delete: t.isDelete,
        export: t.isExport,
        print: t.isPrint,
        post: t.isPost,
      },
    })
  })

  const groups = Array.from(menuMap.values()).filter((m) => m.items.length > 0)

  // Ensure Inquiry module always shows Universal Inquiry entry
  const inquiryGroup = groups.find((m) => m.url === "/inquiry")
  if (inquiryGroup) {
    const hasUniversal = inquiryGroup.items.some(
      (item) => item.url === "/inquiry/universal"
    )
    if (!hasUniversal) {
      inquiryGroup.items.push({
        title: "Universal Inquiry",
        url: "/inquiry/universal",
        icon: Search,
      })
    }
  }

  return groups
}

const buildDynamicMenu = (transactions: IUserTransaction[]): MenuGroup[] => {
  const visible = transactions.filter((t) => t.isVisible === true)
  const accountTxs = visible.filter((t) =>
    ACCOUNT_MODULES.includes(t.moduleCode.toLowerCase() as (typeof ACCOUNT_MODULES)[number])
  )
  const otherTxs = visible.filter(
    (t) => !ACCOUNT_MODULES.includes(t.moduleCode.toLowerCase() as (typeof ACCOUNT_MODULES)[number])
  )

  const accountMenu = buildAccountMenu(accountTxs)
  const otherMenu = buildOtherModulesMenu(otherTxs)

  // Add "Checklist Report" (operations/reports) to Reports group if user has permission
  const opsReports = otherTxs.find(
    (t) => t.moduleCode.toLowerCase() === "operations" && t.transactionCode.toLowerCase() === "reports"
  )
  if (opsReports?.isVisible) {
    const reportsGroup = accountMenu.find((g) => g.title === "Reports")
    if (reportsGroup?.items) {
      reportsGroup.items.push({
        title: "Checklist Report",
        url: "/operations/reports",
        icon: BarChart,
        permissions: {
          read: opsReports.isRead,
          create: opsReports.isCreate,
          edit: opsReports.isEdit,
          delete: opsReports.isDelete,
          export: opsReports.isExport,
          print: opsReports.isPrint,
          post: opsReports.isPost,
        },
      })
    }
  }

  const master = otherMenu.find((m) => m.url === "/master")
  const operations = otherMenu.find((m) => m.url === "/operations")
  const rest = otherMenu.filter(
    (m) => m.url !== "/master" && m.url !== "/operations"
  )

  // Activation menu (Account & Job screens)
  const activationMenu: MenuGroup = {
    title: "Activation",
    url: "#",
    icon: CheckCircle,
    isDirectLink: false,
    items: [
      {
        title: "Account",
        url: "/admin/activation/account",
        icon: Landmark,
      },
      {
        title: "Job",
        url: "/admin/activation/job",
        icon: Briefcase,
      },
    ],
  }

  return [
    ...(master ? [master] : []),
    ...(operations ? [operations] : []),
    ...accountMenu,
    activationMenu,
    ...rest,
  ]
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

  // Use currentCompany when available; fall back to companyId from URL (e.g. /123/ar/...) so links work before store syncs
  const companyIdFromPath = pathname.split("/")[1]
  const effectiveCompanyId = currentCompany?.companyId ?? companyIdFromPath

  const getUrlWithCompanyId = React.useCallback(
    (url: string) => {
      if (!effectiveCompanyId) return url
      if (url === "#") return url
      return `/${effectiveCompanyId}${url}`
    },
    [effectiveCompanyId]
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
      if (group.isDirectLink && currentPath === getUrlWithCompanyId(group.url)) {
        setSelectedMenu(group.title)
        setOpenMenu(null)
        setSelectedSubMenu(null)
        return
      }
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
                <SidebarMenuItem key={`${group.title}-${group.url}`}>
                  {group.isDirectLink ? (
                    <SidebarMenuButton
                      asChild
                      tooltip={group.title}
                      onMouseEnter={() => handleMouseEnter(group.title)}
                      onMouseLeave={() => setHoveredMenu(null)}
                      className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary relative transition-colors duration-200 ${
                        isMenuActive(group.title) || hoveredMenu === group.title
                          ? "bg-primary/20 text-primary"
                          : ""
                      }`}
                    >
                      <Link href={getUrlWithCompanyId(group.url)}>
                        {group.icon && <group.icon className="h-4 w-4" />}
                        <span>{group.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : group.items && group.items.length > 0 && sidebarState === "collapsed" && !isMobile ? (
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
