"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import {
  ModuleId,
  ARTransactionId,
  APTransactionId,
  CBTransactionId,
  GLTransactionId,
  OperationsTransactionId,
} from "@/lib/utils"
import { cn } from "@/lib/utils"
import { BookOpen, Building2, ClipboardList, CreditCard, Landmark, Receipt } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

export function NavHeader() {
  const pathname = usePathname()
  const { currentCompany } = useAuthStore()
  const { hasPermission } = usePermissionStore()

  const getUrlWithCompanyId = (url: string) => {
    if (!currentCompany?.companyId) return url
    if (url === "#") return url
    return `/${currentCompany.companyId}${url}`
  }

  // Permission checks for navbar buttons
  const canViewChecklist = hasPermission(
    ModuleId.operations,
    OperationsTransactionId.checklist,
    "isVisible"
  )

  // AR module permissions
  const canViewArOverview = hasPermission(ModuleId.ar, ARTransactionId.overview, "isVisible")
  const canViewArInvoice = hasPermission(ModuleId.ar, ARTransactionId.invoice, "isVisible")
  const canViewArInvoicectm = hasPermission(ModuleId.ar, ARTransactionId.invoicectm, "isVisible")
  const canViewArCreditNote = hasPermission(ModuleId.ar, ARTransactionId.creditNote, "isVisible")
  const canViewArDebitNote = hasPermission(ModuleId.ar, ARTransactionId.debitNote, "isVisible")
  const canViewArReceipt = hasPermission(ModuleId.ar, ARTransactionId.receipt, "isVisible")
  const canViewArRefund = hasPermission(ModuleId.ar, ARTransactionId.refund, "isVisible")
  const canViewArDocsetoff = hasPermission(ModuleId.ar, ARTransactionId.docsetoff, "isVisible")
  const canViewArAdjustment = hasPermission(ModuleId.ar, ARTransactionId.adjustment, "isVisible")
  const canViewArReports = hasPermission(ModuleId.ar, ARTransactionId.reports, "isVisible")
  const canViewAr =
    canViewArOverview ||
    canViewArInvoice ||
    canViewArInvoicectm ||
    canViewArCreditNote ||
    canViewArDebitNote ||
    canViewArReceipt ||
    canViewArRefund ||
    canViewArDocsetoff ||
    canViewArAdjustment ||
    canViewArReports

  // AP module permissions
  const canViewApOverview = hasPermission(ModuleId.ap, APTransactionId.overview, "isVisible")
  const canViewApInvoice = hasPermission(ModuleId.ap, APTransactionId.invoice, "isVisible")
  const canViewApCreditNote = hasPermission(ModuleId.ap, APTransactionId.creditNote, "isVisible")
  const canViewApDebitNote = hasPermission(ModuleId.ap, APTransactionId.debitNote, "isVisible")
  const canViewApPayment = hasPermission(ModuleId.ap, APTransactionId.payment, "isVisible")
  const canViewApRefund = hasPermission(ModuleId.ap, APTransactionId.refund, "isVisible")
  const canViewApDocsetoff = hasPermission(ModuleId.ap, APTransactionId.docsetoff, "isVisible")
  const canViewApAdjustment = hasPermission(ModuleId.ap, APTransactionId.adjustment, "isVisible")
  const canViewApReports = hasPermission(ModuleId.ap, APTransactionId.reports, "isVisible")
  const canViewAp =
    canViewApOverview ||
    canViewApInvoice ||
    canViewApCreditNote ||
    canViewApDebitNote ||
    canViewApPayment ||
    canViewApRefund ||
    canViewApDocsetoff ||
    canViewApAdjustment ||
    canViewApReports

  const canViewCbOverview = hasPermission(ModuleId.cb, CBTransactionId.overview, "isVisible")
  const canViewCbGenReceipt = hasPermission(ModuleId.cb, CBTransactionId.cbgenreceipt, "isVisible")
  const canViewCbGenPayment = hasPermission(ModuleId.cb, CBTransactionId.cbgenpayment, "isVisible")
  const canViewCbPettyCash = hasPermission(ModuleId.cb, CBTransactionId.cbpettycash, "isVisible")
  const canViewCbBankTransfer = hasPermission(ModuleId.cb, CBTransactionId.cbbanktransfer, "isVisible")
  const canViewCbBankTransferCtm = hasPermission(ModuleId.cb, CBTransactionId.cbbanktransferctm, "isVisible")
  const canViewCbBankRecon = hasPermission(ModuleId.cb, CBTransactionId.cbbankrecon, "isVisible")
  const canViewCbReports = hasPermission(ModuleId.cb, CBTransactionId.reports, "isVisible")
  const canViewCb =
    canViewCbOverview ||
    canViewCbGenReceipt ||
    canViewCbGenPayment ||
    canViewCbPettyCash ||
    canViewCbBankTransfer ||
    canViewCbBankTransferCtm ||
    canViewCbBankRecon ||
    canViewCbReports

  // GL module permissions
  const canViewGlOverview = hasPermission(ModuleId.gl, GLTransactionId.overview, "isVisible")
  const canViewGlJournalEntry = hasPermission(ModuleId.gl, GLTransactionId.journalentry, "isVisible")
  const canViewGlArapcontra = hasPermission(ModuleId.gl, GLTransactionId.arapcontra, "isVisible")
  const canViewGlReports = hasPermission(ModuleId.gl, GLTransactionId.reports, "isVisible")
  const canViewGl =
    canViewGlOverview || canViewGlJournalEntry || canViewGlArapcontra || canViewGlReports

  const arItems = [
    { title: "AR Overview", url: "/ar/overview", canView: canViewArOverview },
    { title: "AR Invoice", url: "/ar/invoice", canView: canViewArInvoice },
    { title: "AR Invoice CTM", url: "/ar/invoicectm", canView: canViewArInvoicectm },
    { title: "AR Credit Note", url: "/ar/creditnote", canView: canViewArCreditNote },
    { title: "AR Debit Note", url: "/ar/debitnote", canView: canViewArDebitNote },
    { title: "AR Receipt", url: "/ar/receipt", canView: canViewArReceipt },
    { title: "AR Refund", url: "/ar/refund", canView: canViewArRefund },
    { title: "AR Doc Setoff", url: "/ar/docsetoff", canView: canViewArDocsetoff },
    { title: "AR Adjustment", url: "/ar/adjustment", canView: canViewArAdjustment },
    { title: "AR Reports", url: "/ar/reports", canView: canViewArReports },
  ].filter((i) => i.canView)

  const apItems = [
    { title: "AP Overview", url: "/ap/overview", canView: canViewApOverview },
    { title: "AP Invoice", url: "/ap/invoice", canView: canViewApInvoice },
    { title: "AP Credit Note", url: "/ap/creditnote", canView: canViewApCreditNote },
    { title: "AP Debit Note", url: "/ap/debitnote", canView: canViewApDebitNote },
    { title: "AP Payment", url: "/ap/payment", canView: canViewApPayment },
    { title: "AP Refund", url: "/ap/refund", canView: canViewApRefund },
    { title: "AP Doc Setoff", url: "/ap/docsetoff", canView: canViewApDocsetoff },
    { title: "AP Adjustment", url: "/ap/adjustment", canView: canViewApAdjustment },
    { title: "AP Reports", url: "/ap/reports", canView: canViewApReports },
  ].filter((i) => i.canView)

  const cbItems = [
    { title: "CB Overview", url: "/cb/overview", canView: canViewCbOverview },
    { title: "CB Receipt", url: "/cb/cbgenreceipt", canView: canViewCbGenReceipt },
    { title: "CB Payment", url: "/cb/cbgenpayment", canView: canViewCbGenPayment },
    { title: "Petty Cash", url: "/cb/cbpettycash", canView: canViewCbPettyCash },
    { title: "Bank Transfer", url: "/cb/cbbanktransfer", canView: canViewCbBankTransfer },
    { title: "Bank Transfer CTM", url: "/cb/cbbanktransferctm", canView: canViewCbBankTransferCtm },
    { title: "Bank Reconciliation", url: "/cb/cbbankrecon", canView: canViewCbBankRecon },
    { title: "CB Reports", url: "/cb/reports", canView: canViewCbReports },
  ].filter((i) => i.canView)

  const glItems = [
    { title: "GL Overview", url: "/gl/overview", canView: canViewGlOverview },
    { title: "Journal Entry", url: "/gl/journalentry", canView: canViewGlJournalEntry },
    { title: "GL Contra", url: "/gl/arapcontra", canView: canViewGlArapcontra },
    { title: "GL Reports", url: "/gl/reports", canView: canViewGlReports },
  ].filter((i) => i.canView)

  return (
    <div className="relative hidden w-full items-center justify-between px-3 sm:flex">
      {/* Left Navigation */}
      <div className="flex flex-1 shrink-0 items-center gap-2">
        <NavigationMenu viewport={false}>
          <NavigationMenuList className="flex flex-nowrap items-center gap-2">
            {canViewChecklist && (
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuLink asChild>
                  <Link
                    href={getUrlWithCompanyId("/operations/checklist")}
                    className={cn(
                      "!flex h-8 flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-[#C4D6FF] bg-[#E0EAFF] px-3 text-xs font-medium text-[#3355CC] transition-colors hover:bg-[#C4D6FF]",
                      pathname === getUrlWithCompanyId("/operations/checklist") &&
                        "border-[#A8C4FF] bg-[#C4D6FF]"
                    )}
                  >
                    <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                    Checklist
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {canViewAr && (
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuTrigger
                  className={cn(
                    "!flex h-8 gap-1.5 whitespace-nowrap rounded-md border border-[#C4D6FF] bg-[#E0EAFF] px-3 text-xs font-medium !text-[#3355CC] transition-colors hover:bg-[#C4D6FF] data-[state=open]:border-[#A8C4FF] data-[state=open]:bg-[#C4D6FF] focus-visible:!ring-2 focus-visible:!ring-[#3355CC]/30",
                    pathname.startsWith(getUrlWithCompanyId("/ar"))
                      ? "border-[#A8C4FF] bg-[#C4D6FF]"
                      : ""
                  )}
                >
                  <Receipt className="h-3.5 w-3.5 shrink-0" />
                  AR
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex min-w-[200px] flex-col gap-0.5 p-1.5">
                    {arItems.map((item) => (
                      <li key={item.url}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={getUrlWithCompanyId(item.url)}
                            className={cn(
                              "block rounded-md px-2.5 py-1.5 text-xs font-medium text-[#3355CC] transition-colors hover:bg-[#E0EAFF] hover:text-[#3355CC]",
                              pathname === getUrlWithCompanyId(item.url) &&
                                "bg-[#E0EAFF] font-semibold text-[#3355CC]"
                            )}
                          >
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {canViewAp && (
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuTrigger
                  className={cn(
                    "!flex h-8 gap-1.5 whitespace-nowrap rounded-md border border-[#C4D6FF] bg-[#E0EAFF] px-3 text-xs font-medium !text-[#3355CC] transition-colors hover:bg-[#C4D6FF] data-[state=open]:border-[#A8C4FF] data-[state=open]:bg-[#C4D6FF] focus-visible:!ring-2 focus-visible:!ring-[#3355CC]/30",
                    pathname.startsWith(getUrlWithCompanyId("/ap"))
                      ? "border-[#A8C4FF] bg-[#C4D6FF]"
                      : ""
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  AP
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex min-w-[200px] flex-col gap-0.5 p-1.5">
                    {apItems.map((item) => (
                      <li key={item.url}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={getUrlWithCompanyId(item.url)}
                            className={cn(
                              "block rounded-md px-2.5 py-1.5 text-xs font-medium text-[#3355CC] transition-colors hover:bg-[#E0EAFF] hover:text-[#3355CC]",
                              pathname === getUrlWithCompanyId(item.url) &&
                                "bg-[#E0EAFF] font-semibold text-[#3355CC]"
                            )}
                          >
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {canViewCb && (
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuTrigger
                  className={cn(
                    "!flex h-8 gap-1.5 whitespace-nowrap rounded-md border border-[#C4D6FF] bg-[#E0EAFF] px-3 text-xs font-medium !text-[#3355CC] transition-colors hover:bg-[#C4D6FF] data-[state=open]:border-[#A8C4FF] data-[state=open]:bg-[#C4D6FF] focus-visible:!ring-2 focus-visible:!ring-[#3355CC]/30",
                    pathname.startsWith(getUrlWithCompanyId("/cb"))
                      ? "border-[#A8C4FF] bg-[#C4D6FF]"
                      : ""
                  )}
                >
                  <Landmark className="h-3.5 w-3.5 shrink-0" />
                  CB
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex min-w-[200px] flex-col gap-0.5 p-1.5">
                    {cbItems.map((item) => (
                      <li key={item.url}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={getUrlWithCompanyId(item.url)}
                            className={cn(
                              "block rounded-md px-2.5 py-1.5 text-xs font-medium text-[#3355CC] transition-colors hover:bg-[#E0EAFF] hover:text-[#3355CC]",
                              pathname === getUrlWithCompanyId(item.url) &&
                                "bg-[#E0EAFF] font-semibold text-[#3355CC]"
                            )}
                          >
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {canViewGl && (
              <NavigationMenuItem className="flex items-center">
                <NavigationMenuTrigger
                  className={cn(
                    "!flex h-8 gap-1.5 whitespace-nowrap rounded-md border border-[#C4D6FF] bg-[#E0EAFF] px-3 text-xs font-medium !text-[#3355CC] transition-colors hover:bg-[#C4D6FF] data-[state=open]:border-[#A8C4FF] data-[state=open]:bg-[#C4D6FF] focus-visible:!ring-2 focus-visible:!ring-[#3355CC]/30",
                    pathname.startsWith(getUrlWithCompanyId("/gl"))
                      ? "border-[#A8C4FF] bg-[#C4D6FF]"
                      : ""
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  GL
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex min-w-[200px] flex-col gap-0.5 p-1.5">
                    {glItems.map((item) => (
                      <li key={item.url}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={getUrlWithCompanyId(item.url)}
                            className={cn(
                              "block rounded-md px-2.5 py-1.5 text-xs font-medium text-[#3355CC] transition-colors hover:bg-[#E0EAFF] hover:text-[#3355CC]",
                              pathname === getUrlWithCompanyId(item.url) &&
                                "bg-[#E0EAFF] font-semibold text-[#3355CC]"
                            )}
                          >
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Center - Company Name */}
      <div className="flex flex-1 items-center justify-center">
        {currentCompany && (
          <div className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 flex-shrink-0 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <Image
                src={`/uploads/companies/${currentCompany.companyId}.svg`}
                alt={currentCompany.companyName || "Company Logo"}
                width={40}
                height={40}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling?.classList.remove("hidden")
                }}
              />
              <Building2 className="text-primary absolute inset-0 hidden h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10" />
            </span>
            <span className="text-foreground max-w-[240px] truncate text-lg font-bold sm:max-w-[320px] sm:text-xl md:max-w-[400px] md:text-2xl lg:max-w-[500px]">
              {currentCompany.companyName}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1" />
    </div>
  )
}
