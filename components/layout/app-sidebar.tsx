"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useCompanyStore } from "@/stores/company-store"
import {
  AlertTriangle,
  Anchor,
  ArrowLeftRight,
  Award,
  Banknote,
  BarChart,
  Bell,
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
  FileSpreadsheet,
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
  Monitor,
  Package,
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

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { CompanySwitcher } from "@/components/layout/company-switcher"
import { SidebarSessionFooter } from "@/components/layout/sidebar-session-footer"

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
    document: FileText,
    dashboard: LayoutDashboard,
    einvoicing: FileCheck,
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
    pda: FileSpreadsheet,
    tariff: Coins,
    tallyservice: Ship,
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
    company: Building,
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
    sessions: Monitor,
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
  const user = useAuthStore((s) => s.user)
  const getUserTransactions = useAuthStore((s) => s.getUserTransactions)
  const currentCompany = useCompanyStore((s) => s.currentCompany)
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

// AdmTransactionCategory-based config (from dbo.AdmTransactionCategory)
const MASTER_TRANSACTION_CATEGORIES = [
  { id: 1, code: "Region", displayName: "Region", seqNo: 1 },
  { id: 2, code: "Product", displayName: "Product", seqNo: 2 },
  { id: 3, code: "Customer", displayName: "Customer / Vendor", seqNo: 3 },
  { id: 4, code: "Finance", displayName: "Finance", seqNo: 4 },
  { id: 5, code: "GLCode", displayName: "GL Code", seqNo: 5 },
  { id: 6, code: "Category", displayName: "Category", seqNo: 6 },
  { id: 7, code: "Employee", displayName: "Employee", seqNo: 7 },
  { id: 10, code: "Other", displayName: "Others", seqNo: 10 },
] as const

type KnownMasterCategoryConfig = (typeof MASTER_TRANSACTION_CATEGORIES)[number]
/** Known categories from config or any id/code returned by the API */
type MasterCategoryConfig =
  | KnownMasterCategoryConfig
  | {
      id: number
      code: string
      displayName: string
      seqNo: number
    }

// Icon and color for each master category (for consistent sidebar styling)
const getMasterCategoryIcon = (categoryCode: string) => {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    Region: MapPin,
    Product: Box,
    Customer: Users,
    Finance: Wallet,
    GLCode: ChartArea,
    Category: FolderKanban,
    Employee: Users,
    Other: Target,
  }
  return map[categoryCode] || Target
}

interface MasterCategoryGroup {
  title: string
  transCategoryCode: string
  icon: React.ComponentType<{ className?: string }>
  items: MenuItem[]
}

interface MenuGroup {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  items?: MenuItem[]
  categories?: MasterCategoryGroup[] // Master: submenu by AdmTransactionCategory
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
  {
    category: string
    displayLabel: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  ar_overview: {
    category: "overview",
    displayLabel: "AR Overview",
    icon: BarChart,
  },
  ap_overview: {
    category: "overview",
    displayLabel: "AP Overview",
    icon: BarChart,
  },
  cb_overview: {
    category: "overview",
    displayLabel: "CB Overview",
    icon: BarChart,
  },
  gl_overview: {
    category: "overview",
    displayLabel: "GL Overview",
    icon: BarChart,
  },
  ar_invoice: {
    category: "invoice",
    displayLabel: "AR Invoice",
    icon: Receipt,
  },
  ap_invoice: {
    category: "invoice",
    displayLabel: "AP Invoice",
    icon: Receipt,
  },
  ar_invoicectm: {
    category: "invoice",
    displayLabel: "AR Invoice CTM",
    icon: Receipt,
  },
  ar_creditnote: {
    category: "creditnote",
    displayLabel: "AR Credit Note",
    icon: FilePlus,
  },
  ap_creditnote: {
    category: "creditnote",
    displayLabel: "AP Credit Note",
    icon: FilePlus,
  },
  ar_debitnote: {
    category: "debitnote",
    displayLabel: "AR Debit Note",
    icon: FileMinus,
  },
  ap_debitnote: {
    category: "debitnote",
    displayLabel: "AP Debit Note",
    icon: FileMinus,
  },
  ar_receipt: {
    category: "receipt",
    displayLabel: "AR Receipt",
    icon: PlusCircle,
  },
  cb_cbgenreceipt: {
    category: "receipt",
    displayLabel: "CB Receipt",
    icon: PlusCircle,
  },
  ar_receiptmulticurrency: {
    category: "receipt",
    displayLabel: "AR Receipt Multicurrency",
    icon: PlusCircle,
  },
  ap_payment: {
    category: "payment",
    displayLabel: "AP Payment",
    icon: MinusCircle,
  },
  cb_cbgenpayment: {
    category: "payment",
    displayLabel: "CB Payment",
    icon: MinusCircle,
  },
  ar_refund: { category: "refund", displayLabel: "AR Refund", icon: Undo2 },
  ap_refund: { category: "refund", displayLabel: "AP Refund", icon: Undo2 },
  ar_docsetoff: {
    category: "setoff",
    displayLabel: "AR Doc Setoff",
    icon: FileStack,
  },
  ar_documentsetoff: {
    category: "setoff",
    displayLabel: "AR Doc Setoff",
    icon: FileStack,
  },
  ap_docsetoff: {
    category: "setoff",
    displayLabel: "AP Doc Setoff",
    icon: FileStack,
  },
  ap_documentsetoff: {
    category: "setoff",
    displayLabel: "AP Doc Setoff",
    icon: FileStack,
  },
  gl_arapcontra: {
    category: "setoff",
    displayLabel: "Ar-Ap Contra",
    icon: ArrowLeftRight,
  },
  cb_cbbanktransfer: {
    category: "bank",
    displayLabel: "CB Bank Transfer",
    icon: ArrowLeftRight,
  },
  cb_cbbanktransferctm: {
    category: "bank",
    displayLabel: "CB Bank Transfer CTM",
    icon: ArrowLeftRight,
  },
  cb_cbbankrecon: {
    category: "bank",
    displayLabel: "CB Bank Reconciliation",
    icon: Scale,
  },
  gl_journalentry: {
    category: "gl",
    displayLabel: "GL Journal",
    icon: BookOpen,
  },
  cb_cbpettycash: {
    category: "pettycash",
    displayLabel: "Petty Cash",
    icon: HandCoins,
  },
  ar_adjustment: {
    category: "adjustment",
    displayLabel: "AR Adjustment",
    icon: Sliders,
  },
  ap_adjustment: {
    category: "adjustment",
    displayLabel: "AP Adjustment",
    icon: Sliders,
  },
  ar_reports: {
    category: "reports",
    displayLabel: "AR Reports",
    icon: BarChart,
  },
  ap_reports: {
    category: "reports",
    displayLabel: "AP Reports",
    icon: BarChart,
  },
  cb_reports: {
    category: "reports",
    displayLabel: "CB Reports",
    icon: BarChart,
  },
  gl_reports: {
    category: "reports",
    displayLabel: "GL Reports",
    icon: BarChart,
  },
  ap_jobtransactions: {
    category: "other",
    displayLabel: "Job Transactions",
    icon: ClipboardList,
  },
  gl_yearendprocess: {
    category: "other",
    displayLabel: "Year-End Process",
    icon: CalendarCheck,
  },
  gl_periodclose: {
    category: "other",
    displayLabel: "GL Period Close",
    icon: Lock,
  },
  gl_openingbalance: {
    category: "other",
    displayLabel: "Opening Balance",
    icon: Scale,
  },
  gl_fixedasset: {
    category: "other",
    displayLabel: "Fixed Asset",
    icon: Landmark,
  },
}

/** Shown in rights / direct URL only — not listed in the sidebar */
const SIDEBAR_EXCLUDED_ACCOUNT_KEYS = new Set<string>(["ar_invoice_edit"])

const ACCOUNT_CATEGORY_META: Record<
  string,
  {
    title: string
    icon: React.ComponentType<{ className?: string }>
    isDirectLink: boolean
  }
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
  return m === "AR"
    ? "AR"
    : m === "AP"
      ? "AP"
      : m === "CB"
        ? "CB"
        : m === "GL"
          ? "GL"
          : moduleCode
}

const getIconColor = (_identifier?: string, _title?: string): string =>
  "text-muted-foreground/70"

const buildAccountMenu = (transactions: IUserTransaction[]): MenuGroup[] => {
  const categoryMap = new Map<string, MenuItem[]>()
  const directLinkMap = new Map<string, MenuItem>()

  transactions.forEach((t) => {
    const mod = t.moduleCode.toLowerCase()
    const trn = t.transactionCode.toLowerCase()
    const key = `${mod}_${trn}`
    if (SIDEBAR_EXCLUDED_ACCOUNT_KEYS.has(key)) return
    const config = ACCOUNT_CATEGORY_CONFIG[key]
    const category = config?.category ?? "other"
    const displayLabel =
      config?.displayLabel ??
      `${getModuleDisplayPrefix(t.moduleCode)} ${t.transactionName}`
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

// Build Master menu grouped by AdmTransactionCategory (Region, Product, Customer, etc.)
const buildMasterMenu = (
  transactions: IUserTransaction[]
): MenuGroup | null => {
  const masterTxs = transactions.filter(
    (t) => t.moduleCode.toLowerCase() === "master" && t.isVisible
  )
  if (masterTxs.length === 0) return null

  const categoryOrder: number[] = MASTER_TRANSACTION_CATEGORIES.map((c) => c.id)
  const knownCategoryIdSet = new Set(categoryOrder)
  const categoryMap = new Map<
    number,
    { config: MasterCategoryConfig; items: MenuItem[] }
  >()

  // Initialize categories that exist in config
  MASTER_TRANSACTION_CATEGORIES.forEach((config) => {
    categoryMap.set(config.id, { config, items: [] })
  })

  masterTxs.forEach((t) => {
    const catId = t.transCategoryId ?? 0
    let entry = categoryMap.get(catId)
    if (!entry) {
      const knownConfig = MASTER_TRANSACTION_CATEGORIES.find(
        (c) => c.id === catId
      )
      if (!knownConfig) {
        const dynamicConfig: MasterCategoryConfig = {
          id: catId,
          code: t.transCategoryCode,
          displayName: t.transCategoryName || t.transCategoryCode,
          seqNo: 99,
        }
        entry = { config: dynamicConfig, items: [] }
        categoryMap.set(catId, entry)
      } else {
        entry = { config: knownConfig, items: [] }
        categoryMap.set(catId, entry)
      }
    }
    if (!entry) return
    const trn = t.transactionCode.toLowerCase()
    entry.items.push({
      title: t.transactionName,
      url: `/master/${trn}`,
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

  const categories: MasterCategoryGroup[] = []
  for (const id of categoryOrder) {
    const entry = categoryMap.get(id)
    if (entry && entry.items.length > 0) {
      entry.items.sort((a, b) => a.title.localeCompare(b.title))
      categories.push({
        title: entry.config.displayName,
        transCategoryCode: entry.config.code,
        icon: getMasterCategoryIcon(entry.config.code),
        items: entry.items,
      })
    }
  }
  // Add any category not in standard list (e.g. id 0 or others)
  categoryMap.forEach((entry, id) => {
    if (!knownCategoryIdSet.has(id) && entry.items.length > 0) {
      entry.items.sort((a, b) => a.title.localeCompare(b.title))
      categories.push({
        title: entry.config.displayName,
        transCategoryCode: entry.config.code,
        icon: getMasterCategoryIcon(entry.config.code),
        items: entry.items,
      })
    }
  })

  if (categories.length === 0) return null
  return {
    title: "Master",
    url: "/master",
    icon: GalleryVerticalEnd,
    categories,
    isDirectLink: false,
  }
}

const buildOtherModulesMenu = (
  transactions: IUserTransaction[]
): MenuGroup[] => {
  const menuMap = new Map<
    string,
    {
      title: string
      url: string
      icon: React.ComponentType<{ className?: string }>
      items: MenuItem[]
    }
  >()

  transactions.forEach((t) => {
    const mod = t.moduleCode.toLowerCase()
    if (ACCOUNT_MODULES.includes(mod as (typeof ACCOUNT_MODULES)[number]))
      return
    if (mod === "master") return // Master uses buildMasterMenu with categories

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

  // Inject HR Overview at the top of the HR module group
  const hrGroup = groups.find((m) => m.url === "/hr")
  if (hrGroup) {
    const hasHrOverview = hrGroup.items.some(
      (item) => item.url === "/hr/overview"
    )
    if (!hasHrOverview) {
      hrGroup.items.unshift({
        title: "HR Overview",
        url: "/hr/overview",
        icon: BarChart,
      })
    }
  }

  // Inject Operations Overview at the top of the Operations module group
  const operationsGroup = groups.find((m) => m.url === "/operations")
  if (operationsGroup) {
    const hasOperationsOverview = operationsGroup.items.some(
      (item) => item.url === "/operations/overview"
    )
    if (!hasOperationsOverview) {
      operationsGroup.items.unshift({
        title: "Operations Overview",
        url: "/operations/overview",
        icon: BarChart,
      })
    }
  }

  return groups
}

const buildDynamicMenu = (transactions: IUserTransaction[]): MenuGroup[] => {
  const visible = transactions.filter((t) => t.isVisible === true)
  const accountTxs = visible.filter((t) =>
    ACCOUNT_MODULES.includes(
      t.moduleCode.toLowerCase() as (typeof ACCOUNT_MODULES)[number]
    )
  )
  const otherTxs = visible.filter(
    (t) =>
      !ACCOUNT_MODULES.includes(
        t.moduleCode.toLowerCase() as (typeof ACCOUNT_MODULES)[number]
      )
  )

  const accountMenu = buildAccountMenu(accountTxs)
  const otherMenu = buildOtherModulesMenu(otherTxs)

  // Add "Checklist Report" (operations/reports) to Reports group if user has permission
  const opsReports = otherTxs.find(
    (t) =>
      t.moduleCode.toLowerCase() === "operations" &&
      t.transactionCode.toLowerCase() === "reports"
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

  const master = buildMasterMenu(visible)
  const operations = otherMenu.find((m) => m.url === "/operations")
  const rest = otherMenu.filter(
    (m) => m.url !== "/master" && m.url !== "/operations"
  )

  return [
    ...(master ? [master] : []),
    ...(operations ? [operations] : []),
    ...accountMenu,
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
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
    },
    {
      title: "Approvals",
      url: "/approvals/pending",
      icon: ShieldCheck,
    },
  ],
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const currentCompany = useCompanyStore((s) => s.currentCompany)
  const { transactions, isLoading: transactionsLoading } = useUserTransactions()
  const { state: sidebarState, isMobile } = useSidebar()
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
  const [openCategory, setOpenCategory] = React.useState<string | null>(null)
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
        setOpenCategory(null)
        setSelectedSubMenu(null)
        return
      }
      if (menu.items) {
        for (const subItem of menu.items) {
          if (currentPath === getUrlWithCompanyId(subItem.url)) {
            setSelectedMenu(menu.title)
            setOpenMenu(menu.title)
            setOpenCategory(null)
            setSelectedSubMenu(subItem.title)
            return
          }
        }
      }
    }
    for (const group of dynamicMenu) {
      if (
        group.isDirectLink &&
        currentPath === getUrlWithCompanyId(group.url)
      ) {
        setSelectedMenu(group.title)
        setOpenMenu(null)
        setOpenCategory(null)
        setSelectedSubMenu(null)
        return
      }
      if (group.categories) {
        for (const cat of group.categories) {
          for (const subItem of cat.items) {
            if (currentPath === getUrlWithCompanyId(subItem.url)) {
              setSelectedMenu(group.title)
              setOpenMenu(group.title)
              setOpenCategory(cat.title)
              setSelectedSubMenu(subItem.title)
              return
            }
          }
        }
      }
      for (const subItem of group.items || []) {
        if (currentPath === getUrlWithCompanyId(subItem.url)) {
          setSelectedMenu(group.title)
          setOpenMenu(group.title)
          setOpenCategory(null)
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
    if (openMenu !== menuTitle) setOpenCategory(null)
  }

  const handleCategoryClick = (categoryTitle: string) => {
    setOpenCategory(openCategory === categoryTitle ? null : categoryTitle)
  }

  const isCategoryActive = (categoryTitle: string) => {
    return openCategory === categoryTitle
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
      <SidebarContent
        className={
          sidebarState === "collapsed" && !isMobile
            ? "overflow-hidden overscroll-none"
            : undefined
        }
      >
        <SidebarGroup className="px-2 py-1">
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
                          className={`hover:bg-accent/60 relative transition-colors duration-200 ${
                            isMenuActive(item.title) ||
                            hoveredMenu === item.title
                              ? "bg-primary/15 text-primary font-semibold"
                              : ""
                          }`}
                        >
                          <div className="relative">
                            {item.icon && (
                              <item.icon
                                className={`h-4 w-4 shrink-0 ${getIconColor(item.url, item.title)}`}
                              />
                            )}
                          </div>
                          <span>{item.title}</span>
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
                          {item.icon && (
                            <item.icon
                              className={`h-4 w-4 shrink-0 ${getIconColor(item.url, item.title)}`}
                            />
                          )}
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
                            className={`hover:bg-accent/60 relative transition-colors duration-200 ${
                              isMenuActive(item.title) ||
                              hoveredMenu === item.title
                                ? "bg-primary/15 text-primary font-semibold"
                                : ""
                            }`}
                          >
                            <div className="relative">
                              {item.icon && (
                                <item.icon
                                  className={`h-4 w-4 shrink-0 ${getIconColor(item.url, item.title)}`}
                                />
                              )}
                            </div>
                            <span>{item.title}</span>
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
                                  className={`hover:bg-accent/50 rounded-sm transition-colors duration-200 ${
                                    isSubMenuActive(subItem.title) ||
                                    hoveredSubMenu === subItem.title
                                      ? "bg-primary/15 text-primary border-primary border-l-2 font-semibold"
                                      : "text-muted-foreground"
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
                    className={`hover:bg-accent/60 relative transition-colors duration-200 ${
                      isMenuActive(item.title) || hoveredMenu === item.title
                        ? "bg-primary/15 text-primary font-semibold"
                        : ""
                    }`}
                  >
                    <Link href={getUrlWithCompanyId(item.url)}>
                      <div className="relative">
                        {item.icon && (
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${getIconColor(item.url, item.title)}`}
                          />
                        )}
                      </div>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </div>
        </SidebarGroup>
        <SidebarGroup className="px-2 py-1">
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
                      className={`hover:bg-accent/60 relative transition-colors duration-200 ${
                        isMenuActive(group.title) || hoveredMenu === group.title
                          ? "bg-primary/15 text-primary font-semibold"
                          : ""
                      }`}
                    >
                      <Link href={getUrlWithCompanyId(group.url)}>
                        {group.icon && (
                          <group.icon
                            className={`h-4 w-4 shrink-0 ${getIconColor(group.url, group.title)}`}
                          />
                        )}
                        {!(sidebarState === "collapsed" && !isMobile) && (
                          <span>{group.title}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  ) : group.categories && group.categories.length > 0 ? (
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
                            className={`hover:bg-accent/60 relative transition-colors duration-200 ${
                              isMenuActive(group.title) ||
                              hoveredMenu === group.title
                                ? "bg-primary/15 text-primary font-semibold"
                                : ""
                            }`}
                          >
                            {group.icon && (
                              <group.icon
                                className={`h-4 w-4 shrink-0 ${getIconColor(group.url, group.title)}`}
                              />
                            )}
                            {!(sidebarState === "collapsed" && !isMobile) && (
                              <span>{group.title}</span>
                            )}
                            {!(sidebarState === "collapsed" && !isMobile) && (
                              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="gap-0.5">
                            {group.categories.map((cat) => (
                              <Collapsible
                                key={cat.transCategoryCode}
                                asChild
                                open={openCategory === cat.title}
                                className="group/category"
                              >
                                <div>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton
                                      onClick={() =>
                                        handleCategoryClick(cat.title)
                                      }
                                      className={`hover:bg-accent/50 rounded-sm transition-colors duration-200 ${
                                        isCategoryActive(cat.title)
                                          ? "bg-primary/15 text-primary font-semibold"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {cat.icon && (
                                        <cat.icon
                                          className={`h-4 w-4 shrink-0 ${getIconColor(cat.transCategoryCode, cat.title)}`}
                                        />
                                      )}
                                      <span className="text-xs">
                                        {cat.title}
                                      </span>
                                      <ChevronRightIcon className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]/category:rotate-90" />
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenuSub className="pl-4">
                                      {cat.items.map((subItem) => (
                                        <SidebarMenuSubItem key={subItem.url}>
                                          <SidebarMenuSubButton
                                            asChild
                                            onMouseEnter={() =>
                                              setHoveredSubMenu(subItem.title)
                                            }
                                            onMouseLeave={() =>
                                              setHoveredSubMenu(null)
                                            }
                                            className={`hover:bg-accent/50 rounded-sm transition-colors duration-200 ${
                                              isSubMenuActive(subItem.title) ||
                                              hoveredSubMenu === subItem.title
                                                ? "bg-background text-foreground border-primary border-l-2 font-semibold shadow-sm"
                                                : "text-muted-foreground"
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
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ) : group.items &&
                    group.items.length > 0 &&
                    sidebarState === "collapsed" &&
                    !isMobile ? (
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
                          className={`hover:bg-accent/60 transition-colors duration-200 ${
                            isMenuActive(group.title) ||
                            hoveredMenu === group.title
                              ? "bg-primary/15 text-primary font-semibold"
                              : ""
                          }`}
                        >
                          {group.icon && (
                            <group.icon
                              className={`h-4 w-4 shrink-0 ${getIconColor(group.url, group.title)}`}
                            />
                          )}
                          {!(sidebarState === "collapsed" && !isMobile) && (
                            <span>{group.title}</span>
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
                          {group.icon && (
                            <group.icon
                              className={`h-4 w-4 shrink-0 ${getIconColor(group.url, group.title)}`}
                            />
                          )}
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
                            className={`hover:bg-accent/60 transition-colors duration-200 ${
                              isMenuActive(group.title) ||
                              hoveredMenu === group.title
                                ? "bg-primary/15 text-primary font-semibold"
                                : ""
                            }`}
                          >
                            {group.icon && (
                              <group.icon
                                className={`h-4 w-4 shrink-0 ${getIconColor(group.url, group.title)}`}
                              />
                            )}
                            {!(sidebarState === "collapsed" && !isMobile) && (
                              <span>{group.title}</span>
                            )}
                            {group.items &&
                              !(sidebarState === "collapsed" && !isMobile) && (
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
                                    className={`hover:bg-accent/60 transition-colors duration-200 ${
                                      isSubMenuActive(subItem.title) ||
                                      hoveredSubMenu === subItem.title
                                        ? "bg-primary/15 text-primary font-semibold"
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
      <SidebarFooter className="border-t p-0">
        <SidebarSessionFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
