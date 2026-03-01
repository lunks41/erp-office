"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { formatDateForApi } from "@/lib/date-utils"
import {
  ARTransactionId,
  APTransactionId,
  GLTransactionId,
  ModuleId,
  OperationsTransactionId,
} from "@/lib/utils"
import {
  useGetChecklistInquiry,
  useGetCustomerInvoiceInquiry,
  useGetApTransactionInquiry,
  useGetGlTransactionInquiry,
} from "@/hooks/use-inquiry"
import { IJobOrderHd } from "@/interfaces/checklist"
import { IArInvoiceHd } from "@/interfaces/ar-invoice"
import { IApOutTransaction } from "@/interfaces/outtransaction"
import { IGlTransactionDetails } from "@/interfaces/history"
import { usePermissionStore } from "@/stores/permission-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

const filterSchema = z.object({
  searchText: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type FilterFormType = z.infer<typeof filterSchema>

export default function UniversalInquiryPage() {
  const { hasPermission } = usePermissionStore()

  const canViewJobOrders = hasPermission(
    ModuleId.operations,
    OperationsTransactionId.checklist,
    "isRead"
  )
  const canViewAr = hasPermission(ModuleId.ar, ARTransactionId.invoice, "isRead")
  const canViewAp = hasPermission(ModuleId.ap, APTransactionId.payment, "isRead")
  const canViewGl = hasPermission(
    ModuleId.gl,
    GLTransactionId.journalentry,
    "isRead"
  )

  const canViewAny = canViewJobOrders || canViewAr || canViewAp || canViewGl

  const [hasSearched, setHasSearched] = useState(false)

  const today = new Date()
  const defaultStartDate = new Date(today)
  defaultStartDate.setMonth(today.getMonth() - 2)

  const formatDate = (date: Date) => formatDateForApi(date) || ""

  const [startDate, setStartDate] = useState(formatDate(defaultStartDate))
  const [endDate, setEndDate] = useState(formatDate(today))

  const filterForm = useForm<FilterFormType>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      searchText: "",
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
    },
  })

  const searchText = filterForm.watch("searchText") || ""

  const jobOrdersEnabled = hasSearched && canViewJobOrders
  const arInvoicesEnabled = hasSearched && canViewAr
  const apTransactionsEnabled = hasSearched && canViewAp
  const glTransactionsEnabled = hasSearched && canViewGl

  const {
    data: jobOrderResponse,
    refetch: refetchJobOrders,
    isLoading: isLoadingJobOrders,
    isRefetching: isRefetchingJobOrders,
    error: jobOrderError,
  } = useGetChecklistInquiry(searchText || undefined, jobOrdersEnabled)

  const {
    data: arInvoiceResponse,
    refetch: refetchArInvoices,
    isLoading: isLoadingArInvoices,
    isRefetching: isRefetchingArInvoices,
    error: arInvoiceError,
  } = useGetCustomerInvoiceInquiry(
    searchText || undefined,
    startDate,
    endDate,
    arInvoicesEnabled
  )

  const {
    data: apTransactionResponse,
    refetch: refetchApTransactions,
    isLoading: isLoadingApTransactions,
    isRefetching: isRefetchingApTransactions,
    error: apTransactionError,
  } = useGetApTransactionInquiry(
    searchText || undefined,
    undefined,
    undefined,
    startDate,
    endDate,
    apTransactionsEnabled
  )

  const {
    data: glTransactionResponse,
    refetch: refetchGlTransactions,
    isLoading: isLoadingGlTransactions,
    isRefetching: isRefetchingGlTransactions,
    error: glTransactionError,
  } = useGetGlTransactionInquiry(
    searchText || undefined,
    undefined,
    startDate,
    endDate,
    glTransactionsEnabled
  )

  useEffect(() => {
    if (jobOrderError) {
      console.error("Error fetching job orders:", jobOrderError)
      toast.error("Failed to load job orders. Please try again.")
    }
  }, [jobOrderError])

  useEffect(() => {
    if (arInvoiceError) {
      console.error("Error fetching AR invoices:", arInvoiceError)
      toast.error("Failed to load AR invoices. Please try again.")
    }
  }, [arInvoiceError])

  useEffect(() => {
    if (apTransactionError) {
      console.error("Error fetching AP transactions:", apTransactionError)
      toast.error("Failed to load AP transactions. Please try again.")
    }
  }, [apTransactionError])

  useEffect(() => {
    if (glTransactionError) {
      console.error("Error fetching GL transactions:", glTransactionError)
      toast.error("Failed to load GL transactions. Please try again.")
    }
  }, [glTransactionError])

  const jobOrders = useMemo<IJobOrderHd[]>(
    () => jobOrderResponse?.data || [],
    [jobOrderResponse?.data]
  )

  const arInvoices = useMemo<IArInvoiceHd[]>(
    () => arInvoiceResponse?.data || [],
    [arInvoiceResponse?.data]
  )

  const apTransactions = useMemo<IApOutTransaction[]>(
    () => apTransactionResponse?.data || [],
    [apTransactionResponse?.data]
  )

  const glTransactions = useMemo<IGlTransactionDetails[]>(
    () => glTransactionResponse?.data || [],
    [glTransactionResponse?.data]
  )

  const totalCount =
    jobOrders.length +
    arInvoices.length +
    apTransactions.length +
    glTransactions.length

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDate(date)
      setStartDate(formattedDate)
    }
  }

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = formatDate(date)
      setEndDate(formattedDate)
    }
  }

  const handleClear = () => {
    setHasSearched(false)
    setStartDate(formatDate(defaultStartDate))
    setEndDate(formatDate(today))
    filterForm.reset({
      searchText: "",
      startDate: format(defaultStartDate, "dd/MM/yyyy"),
      endDate: format(today, "dd/MM/yyyy"),
    })
  }

  const handleSearchClick = () => {
    if (!canViewAny) {
      toast.error("You don't have permission to view any inquiry data.")
      return
    }

    setHasSearched(true)

    if (canViewJobOrders) {
      refetchJobOrders()
    }
    if (canViewAr) {
      refetchArInvoices()
    }
    if (canViewAp) {
      refetchApTransactions()
    }
    if (canViewGl) {
      refetchGlTransactions()
    }

    toast.success("Search initiated")
  }

  const handleRefresh = () => {
    if (!hasSearched) {
      toast.info("Please perform a search first")
      return
    }

    if (canViewJobOrders) {
      refetchJobOrders()
    }
    if (canViewAr) {
      refetchArInvoices()
    }
    if (canViewAp) {
      refetchApTransactions()
    }
    if (canViewGl) {
      refetchGlTransactions()
    }

    toast.success("Data refreshed successfully")
  }

  if (!canViewAny) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold sm:text-2xl">
            Access Denied
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  const isAnyLoading =
    (isLoadingJobOrders || isRefetchingJobOrders) ||
    (isLoadingArInvoices || isRefetchingArInvoices) ||
    (isLoadingApTransactions || isRefetchingApTransactions) ||
    (isLoadingGlTransactions || isRefetchingGlTransactions)

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-lg">🔍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
                Universal Inquiry
              </h1>
              <p className="text-muted-foreground text-sm">
                Search Job Orders and AR / AP / GL documents across all companies
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasSearched && (
            <Badge variant="outline" className="text-xs">
              Total Records: {totalCount}
            </Badge>
          )}
          {isAnyLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
              Updating...
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <Form {...filterForm}>
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Search Text
                </label>
                <Input
                  type="text"
                  placeholder="Job No, Invoice No, Customer, Vessel, Reference No..."
                  {...filterForm.register("searchText")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSearchClick()
                    }
                  }}
                />
              </div>
              <CustomDateNew
                form={filterForm}
                name="startDate"
                label="Start Date (for AR/AP/GL)"
                onChangeEvent={handleStartDateChange}
              />
              <CustomDateNew
                form={filterForm}
                name="endDate"
                label="End Date (for AR/AP/GL)"
                onChangeEvent={handleEndDateChange}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSearchClick}
                className="flex items-center gap-2"
              >
                <span>🔍</span>
                <span>Search</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <span>🗑️</span>
                <span>Clear</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-2"
                disabled={!hasSearched}
              >
                <span>🔄</span>
                <span>Refresh</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {!hasSearched && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">
                Cross-Company Universal Search
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Enter any job order or document details above (Job No, Invoice No, Customer,
                Vessel, Bank, Reference No, etc.), then click &quot;Search&quot; to see
                results from Job Orders, AR invoices, AP transactions and GL transactions.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasSearched && (
        <div className="space-y-6">
          {/* Job Orders */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Job Orders</h2>
              {canViewJobOrders && (
                <Badge variant="outline" className="text-xs">
                  {jobOrders.length} record(s)
                </Badge>
              )}
            </div>
            <div className="bg-card rounded-lg border shadow-sm">
              {!canViewJobOrders ? (
                <div className="p-4 text-xs text-muted-foreground">
                  You don&apos;t have permission to view Job Orders.
                </div>
              ) : isLoadingJobOrders && !jobOrders.length ? (
                <div className="p-4">
                  <DataTableSkeleton columnCount={8} />
                </div>
              ) : jobOrders.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">
                  No job orders found for the given criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Company</th>
                        <th className="px-3 py-2 text-left font-medium">Job No</th>
                        <th className="px-3 py-2 text-left font-medium">Customer</th>
                        <th className="px-3 py-2 text-left font-medium">Vessel</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {jobOrders.map((job) => (
                        <tr key={`${job.companyId}-${job.jobOrderId}`}>
                          <td className="px-3 py-1.5">{job.companyId}</td>
                          <td className="px-3 py-1.5 font-medium">
                            {job.jobOrderNo}
                          </td>
                          <td className="px-3 py-1.5">{job.customerName}</td>
                          <td className="px-3 py-1.5">{job.vesselName}</td>
                          <td className="px-3 py-1.5">{job.jobStatusName}</td>
                          <td className="px-3 py-1.5">{job.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* AR Invoices */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Accounts Receivable (AR) Invoices</h2>
              {canViewAr && (
                <Badge variant="outline" className="text-xs">
                  {arInvoices.length} record(s)
                </Badge>
              )}
            </div>
            <div className="bg-card rounded-lg border shadow-sm">
              {!canViewAr ? (
                <div className="p-4 text-xs text-muted-foreground">
                  You don&apos;t have permission to view AR invoices.
                </div>
              ) : isLoadingArInvoices && !arInvoices.length ? (
                <div className="p-4">
                  <DataTableSkeleton columnCount={8} />
                </div>
              ) : arInvoices.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">
                  No AR invoices found for the given criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Company</th>
                        <th className="px-3 py-2 text-left font-medium">Invoice No</th>
                        <th className="px-3 py-2 text-left font-medium">Customer</th>
                        <th className="px-3 py-2 text-left font-medium">Bank</th>
                        <th className="px-3 py-2 text-left font-medium">Reference No</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                        <th className="px-3 py-2 text-right font-medium">
                          Amount After GST
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {arInvoices.map((inv) => (
                        <tr key={inv.invoiceId}>
                          <td className="px-3 py-1.5">{inv.companyId}</td>
                          <td className="px-3 py-1.5 font-medium">
                            {inv.invoiceNo}
                          </td>
                          <td className="px-3 py-1.5">{inv.customerName}</td>
                          <td className="px-3 py-1.5">{inv.bankName}</td>
                          <td className="px-3 py-1.5">{inv.referenceNo}</td>
                          <td className="px-3 py-1.5 text-right">
                            {inv.totAmt.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {inv.totAmtAftGst.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* AP Transactions */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Accounts Payable (AP) Transactions</h2>
              {canViewAp && (
                <Badge variant="outline" className="text-xs">
                  {apTransactions.length} record(s)
                </Badge>
              )}
            </div>
            <div className="bg-card rounded-lg border shadow-sm">
              {!canViewAp ? (
                <div className="p-4 text-xs text-muted-foreground">
                  You don&apos;t have permission to view AP transactions.
                </div>
              ) : isLoadingApTransactions && !apTransactions.length ? (
                <div className="p-4">
                  <DataTableSkeleton columnCount={8} />
                </div>
              ) : apTransactions.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">
                  No AP transactions found for the given criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Company</th>
                        <th className="px-3 py-2 text-left font-medium">Document No</th>
                        <th className="px-3 py-2 text-left font-medium">Supplier No</th>
                        <th className="px-3 py-2 text-left font-medium">Reference No</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                        <th className="px-3 py-2 text-right font-medium">
                          Local Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {apTransactions.map((trn) => (
                        <tr
                          key={`${trn.companyId}-${trn.moduleId}-${trn.transactionId}-${trn.documentId}`}
                        >
                          <td className="px-3 py-1.5">{trn.companyId}</td>
                          <td className="px-3 py-1.5 font-medium">
                            {trn.documentNo}
                          </td>
                          <td className="px-3 py-1.5">{trn.suppNo}</td>
                          <td className="px-3 py-1.5">{trn.referenceNo}</td>
                          <td className="px-3 py-1.5 text-right">
                            {trn.totAmt.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {trn.totLocalAmt.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* GL Transactions */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">General Ledger (GL) Transactions</h2>
              {canViewGl && (
                <Badge variant="outline" className="text-xs">
                  {glTransactions.length} record(s)
                </Badge>
              )}
            </div>
            <div className="bg-card rounded-lg border shadow-sm">
              {!canViewGl ? (
                <div className="p-4 text-xs text-muted-foreground">
                  You don&apos;t have permission to view GL transactions.
                </div>
              ) : isLoadingGlTransactions && !glTransactions.length ? (
                <div className="p-4">
                  <DataTableSkeleton columnCount={8} />
                </div>
              ) : glTransactions.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">
                  No GL transactions found for the given criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Document No
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Reference No
                        </th>
                        <th className="px-3 py-2 text-left font-medium">GL Code</th>
                        <th className="px-3 py-2 text-left font-medium">GL Name</th>
                        <th className="px-3 py-2 text-left font-medium">Module</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {glTransactions.map((trn) => (
                        <tr key={trn.documentNo + "-" + trn.glCode + "-" + trn.moduleFrom}>
                          <td className="px-3 py-1.5 font-medium">
                            {trn.documentNo}
                          </td>
                          <td className="px-3 py-1.5">{trn.referenceNo}</td>
                          <td className="px-3 py-1.5">{trn.glCode}</td>
                          <td className="px-3 py-1.5">{trn.glName}</td>
                          <td className="px-3 py-1.5">{trn.moduleFrom}</td>
                          <td className="px-3 py-1.5 text-right">
                            {(trn.totAmt || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

