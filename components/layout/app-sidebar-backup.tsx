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
  Box,
  Briefcase,
  Building,
  Calendar,
  CalendarDays,
  ChartArea,
  ChevronRightIcon,
  CircleUserRound,
  ClipboardList,
  // Clock,
  Coins,
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
  MapPin,
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
import { CompanySwitcher } from "@/components/layout/company-switcher"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible"

export const menuData = {
  mainNav: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
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
    // {
    //   title: "HR",
    //   url: "/hr",
    //   icon: Users,
    //   items: [
    //     { title: "Employees", url: "/hr/employees", icon: Users },
    //     { title: "Loan", url: "/hr/loan", icon: Wallet },
    //     { title: "Leave", url: "/hr/leave", icon: CalendarDays },
    //     { title: "Attendance", url: "/hr/attendance", icon: Clock },
    //     { title: "Payruns", url: "/hr/payruns", icon: Calendar },
    //     { title: "Reports", url: "/hr/reports", icon: BarChart },
    //     {
    //       title: "Setting",
    //       url: "/hr/setting",
    //       icon: Settings,
    //     },
    //   ],
    // },
  ],
  masterNav: [
    {
      title: "Master",
      url: "/master",
      icon: GalleryVerticalEnd,
      items: [
        {
          title: "Account Group",
          url: "/master/accountgroup",
          icon: Landmark,
        },
        {
          title: "Account Setup",
          url: "/master/accountsetup",
          icon: Sliders,
        },
        { title: "Account Type", url: "/master/accounttype", icon: Landmark },
        { title: "Bank", url: "/master/bank", icon: Banknote },
        { title: "Barge", url: "/master/barge", icon: Ship },
        { title: "Category", url: "/master/category", icon: FolderKanban },
        {
          title: "Chart of Account & Category",
          url: "/master/chartofaccount",
          icon: ChartArea,
        },
        { title: "Charge", url: "/master/charge", icon: Coins },
        { title: "Country", url: "/master/country", icon: Globe },
        { title: "Credit Term", url: "/master/creditterm", icon: Calendar },
        { title: "Currency", url: "/master/currency", icon: Coins },
        { title: "Customer", url: "/master/customer", icon: Users },
        { title: "Department", url: "/master/department", icon: Building },
        {
          title: "Designation",
          url: "/master/designation",
          icon: GraduationCap,
        },
        { title: "Document Type", url: "/master/documenttype", icon: FileX },
        //{ title: "Employee", url: "/master/employee", icon: User },
        { title: "Entity Types", url: "/master/entitytypes", icon: Building },
        { title: "Gst", url: "/master/gst", icon: FileText },
        { title: "Leave Type", url: "/master/leavetype", icon: CalendarDays },
        { title: "Loan Type", url: "/master/loantype", icon: Wallet },
        { title: "Order Type", url: "/master/ordertype", icon: FileStack },
        {
          title: "Payment Type",
          url: "/master/paymenttype",
          icon: Wallet,
        },
        { title: "Port", url: "/master/port", icon: Anchor },
        { title: "Port Region", url: "/master/portregion", icon: MapPin },
        { title: "Product", url: "/master/product", icon: Box },
        {
          title: "Service Type",
          url: "/master/servicetype",
          icon: Briefcase,
        },
        {
          title: "SubCategory",
          url: "/master/subcategory",
          icon: FolderKanban,
        },
        { title: "Supplier", url: "/master/supplier", icon: Building },
        { title: "Task", url: "/master/task", icon: FileCheck },
        { title: "Tax", url: "/master/tax", icon: FileText },
        { title: "Uom", url: "/master/uom", icon: Scale },
        { title: "Vessel", url: "/master/vessel", icon: Ship },
        { title: "Voyage", url: "/master/voyage", icon: ArrowLeftRight },
      ],
    },
  ],
  operationsNav: [
    {
      title: "Operations",
      url: "/operations",
      icon: FolderKanban,
      items: [
        //{
        // title: "CheckList",
        //url: "/operations/checklist-v2",
        //icon: ClipboardList,
        //},
        {
          title: "New Checklist",
          url: "/operations/checklist/new",
          icon: ListCheck,
        },
        {
          title: "Checklist",
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
      icon: Receipt,
      items: [
        { title: "Invoice", url: "/ar/invoice", icon: Receipt },
        { title: "Debit Note", url: "/ar/debitnote", icon: FileMinus },
        { title: "Credit Note", url: "/ar/creditnote", icon: FilePlus },
        { title: "Receipt", url: "/ar/receipt", icon: Receipt },
        { title: "Refund", url: "/ar/refund", icon: Undo2 },
        { title: "Adjustment", url: "/ar/adjustment", icon: Sliders },
        { title: "Doc Setoff", url: "/ar/documentsetoff", icon: FileStack },
        { title: "Reports", url: "/ar/reports", icon: BarChart },
      ],
    },
    // {
    //   title: "AP",
    //   url: "/ap",
    //   icon: CreditCard,
    //   items: [
    //     { title: "Invoice", url: "/ap/invoice", icon: Receipt },
    //     { title: "Debit Note", url: "/ap/debitnote", icon: FileMinus },
    //     { title: "Credit Note", url: "/ap/creditnote", icon: FilePlus },
    //     { title: "Payment", url: "/ap/payment", icon: MinusCircle },
    //     { title: "Refund", url: "/ap/refund", icon: Undo2 },
    //     { title: "Adjustment", url: "/ap/adjustment", icon: Sliders },
    //     { title: "Doc Setoff", url: "/ap/documentsetoff", icon: FileStack },
    //     { title: "Reports", url: "/ap/reports", icon: BarChart },
    //   ],
    // },
    // {
    //   title: "CB",
    //   url: "/cb",
    //   icon: Banknote,
    //   items: [
    //     { title: "General Payment", url: "/cb/payment", icon: MinusCircle },
    //     { title: "General Receipt", url: "/cb/receipt", icon: PlusCircle },
    //     { title: "Batch Payment", url: "/cb/batch-payment", icon: FileStack },
    //     { title: "Bank Transfer", url: "/cb/transfer", icon: ArrowLeftRight },
    //     {
    //       title: "Bank Reconciliation",
    //       url: "/cb/reconciliation",
    //       icon: Scale,
    //     },
    //     { title: "Report", url: "/cb/reports", icon: BarChart },
    //   ],
    // },
    // {
    //   title: "GL",
    //   url: "/gl",
    //   icon: BookOpenText,
    //   items: [
    //     {
    //       title: "Journal Entry",
    //       url: "/gl/journal-entry",
    //       icon: BookOpen,
    //     },
    //     { title: "AR/AP Contra", url: "/gl/arap-contra", icon: ArrowLeftRight },
    //     { title: "Year-End Process", url: "/gl/year-end", icon: CalendarCheck },
    //     { title: "GL Period Close", url: "/gl/periodclose", icon: Lock },
    //     { title: "Opening Balance", url: "/gl/opening-balance", icon: Scale },
    //     { title: "Report", url: "/gl/reports", icon: BarChart },
    //   ],
    // },
  ],

  settingNav: [
    {
      title: "Admin",
      url: "/admin",
      icon: Landmark,
      items: [
        { title: "User", url: "/admin/users", icon: Users },
        { title: "User Role", url: "/admin/userroles", icon: UserCheck },
        { title: "User Group", url: "/admin/usergroup", icon: Users },
        {
          title: "User Rights",
          url: "/admin/userrights",
          icon: ShieldCheck,
        },
        //{
        //title: "User Wise Rights",
        // url: "/admin/userwiserrights",
        //   icon: UserCheck,
        // },
        { title: "Group Rights", url: "/admin/usergrouprights", icon: Shield },
        { title: "Share Data", url: "/admin/sharedata", icon: Share },
        { title: "Profile", url: "/admin/profile", icon: UserRoundPen },
        { title: "Audit Log", url: "/admin/auditlog", icon: History },
        { title: "Error Log", url: "/admin/errorlog", icon: AlertTriangle },
        {
          title: "User Log",
          url: "/admin/userlog",
          icon: CircleUserRound,
        },
      ],
    },
    {
      title: "Setting",
      url: "/settings",
      icon: Settings,
      items: [
        { title: "Grid", url: "/settings/grid", icon: Grid },
        { title: "Document No", url: "/settings/document", icon: FileText },
        { title: "Decimal", url: "/settings/decimal", icon: Scale },
        { title: "Finance", url: "/settings/finance", icon: Wallet },
        { title: "Task", url: "/settings/task", icon: FileCheck },
        { title: "Dynamic Lookup", url: "/settings/lookup", icon: Search },
        { title: "Account", url: "/settings/account", icon: Briefcase },
        {
          title: "Mandatory Fields",
          url: "/settings/mandatory",
          icon: FileMinus,
        },
        { title: "Visible Fields", url: "/settings/visible", icon: FilePlus },
      ],
    },
  ],
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { currentCompany } = useAuthStore()
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
  const [selectedMenu, setSelectedMenu] = React.useState<string | null>(null)
  const [selectedSubMenu, setSelectedSubMenu] = React.useState<string | null>(
    null
  )
  const [hoveredMenu, setHoveredMenu] = React.useState<string | null>(null)
  const [hoveredSubMenu, setHoveredSubMenu] = React.useState<string | null>(
    null
  )
  const pathname = usePathname()

  const platformNavs = React.useMemo(
    () => [
      menuData.masterNav[0],
      menuData.operationsNav[0],
      ...menuData.accountNav,
      //data.hrmsNav[0],
      //data.documentNav[0],
    ],
    []
  )

  const settingNavs = React.useMemo(() => menuData.settingNav, [])

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

    for (const group of platformNavs) {
      for (const subItem of group.items || []) {
        if (currentPath === getUrlWithCompanyId(subItem.url)) {
          setSelectedMenu(group.title)
          setOpenMenu(group.title)
          setSelectedSubMenu(subItem.title)
          return
        }
      }
    }
  }, [pathname, getUrlWithCompanyId, platformNavs])

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
                  // Collapsible menu item with sub-items
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
                          onMouseEnter={() => setHoveredMenu(item.title)}
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
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ) : (
                  // Simple menu item without sub-items (direct link)
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    onMouseEnter={() => setHoveredMenu(item.title)}
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
            {platformNavs.map((group) => (
              <Collapsible
                key={group.title}
                asChild
                open={openMenu === group.title}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={group.title}
                      onClick={() => handleMenuClick(group.title)}
                      onMouseEnter={() => setHoveredMenu(group.title)}
                      onMouseLeave={() => setHoveredMenu(null)}
                      className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                        isMenuActive(group.title) || hoveredMenu === group.title
                          ? "bg-primary/20 text-primary"
                          : ""
                      }`}
                    >
                      {group.icon && <group.icon />}
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
                                  handleSubMenuClick(group.title, subItem.title)
                                }
                              >
                                {subItem.icon && (
                                  <subItem.icon className="h-4 w-4" />
                                )}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
        <SidebarGroup className="p-1">
          <SidebarMenu className="gap-0.5">
            {settingNavs.map((group) => (
              <Collapsible
                key={group.title}
                asChild
                open={openMenu === group.title}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={group.title}
                      onClick={() => handleMenuClick(group.title)}
                      onMouseEnter={() => setHoveredMenu(group.title)}
                      onMouseLeave={() => setHoveredMenu(null)}
                      className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                        isMenuActive(group.title) || hoveredMenu === group.title
                          ? "bg-primary/20 text-primary"
                          : ""
                      }`}
                    >
                      {group.icon && <group.icon />}
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
                                  handleSubMenuClick(group.title, subItem.title)
                                }
                              >
                                {subItem.icon && (
                                  <subItem.icon className="h-4 w-4" />
                                )}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter>
        <SidebarGroup className="p-1">
          <div className="mt-2 border-t pt-2">
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onMouseEnter={() => setHoveredMenu("Admin")}
                  onMouseLeave={() => setHoveredMenu(null)}
                  className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                    pathname === getUrlWithCompanyId("/admin") ||
                    hoveredMenu === "Admin"
                      ? "bg-primary/20 text-primary"
                      : ""
                  }`}
                >
                  <Link href={getUrlWithCompanyId("/admin")}>
                    <Shield />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onMouseEnter={() => setHoveredMenu("SystemSettings")}
                  onMouseLeave={() => setHoveredMenu(null)}
                  className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                    pathname === getUrlWithCompanyId("/settings") ||
                    hoveredMenu === "SystemSettings"
                      ? "bg-primary/20 text-primary"
                      : ""
                  }`}
                >
                  <Link href={getUrlWithCompanyId("/settings")}>
                    <Settings />
                    <span>System Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
             
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onMouseEnter={() => setHoveredMenu("UserSettings")}
                  onMouseLeave={() => setHoveredMenu(null)}
                  className={`hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors duration-200 ${
                    pathname === getUrlWithCompanyId("/settings") ||
                    hoveredMenu === "UserSettings"
                      ? "bg-primary/20 text-primary"
                      : ""
                  }`}
                >
                  <Link href={getUrlWithCompanyId("/settings")}>
                    <Settings />
                    <span>User Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
             
            </SidebarMenu>
          </div>
        </SidebarGroup>
      </SidebarFooter>  */}
    </Sidebar>
  )
}
