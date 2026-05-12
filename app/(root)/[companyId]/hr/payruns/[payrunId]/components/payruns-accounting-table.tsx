"use client"

import React, { useEffect, useState } from "react"
import { IPayrollAccountViewModel } from "@/interfaces/payroll-account"
import { ChevronDown, ChevronRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PayRunsAccountingTableProps {
  accounts: IPayrollAccountViewModel[]
}

export function PayRunsAccountingTable({
  accounts,
}: PayRunsAccountingTableProps) {
  console.log(
    "🔄 PayRunsAccountingTable: Component rendered with accounts:",
    accounts
  )

  // Helper function for number formatting without currency symbol
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)
  }

  const [filteredAccounts, setFilteredAccounts] = useState<
    IPayrollAccountViewModel[]
  >([])
  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(
    new Set()
  )

  useEffect(() => {
    console.log(
      "🔄 PayRunsAccountingTable: useEffect triggered - setting accounts"
    )
    if (accounts && accounts.length > 0) {
      setFilteredAccounts(accounts)
      // Start with all companies collapsed
      setExpandedCompanies(new Set())
    } else {
      setFilteredAccounts([])
      setExpandedCompanies(new Set())
    }
  }, [accounts])

  // Calculate company-wise totals
  const companyTotals = filteredAccounts.reduce(
    (acc, account) => {
      const companyId = account.companyId
      if (!acc[companyId]) {
        acc[companyId] = {
          companyName: account.companyName,
          totalDebit: 0,
          totalCredit: 0,
        }
      }
      acc[companyId].totalDebit += account.debitAmount
      acc[companyId].totalCredit += account.creditAmount
      return acc
    },
    {} as Record<
      number,
      { companyName: string; totalDebit: number; totalCredit: number }
    >
  )

  // Group accounts by company
  const groupedAccounts = filteredAccounts.reduce(
    (acc, account) => {
      const companyId = account.companyId
      if (!acc[companyId]) {
        acc[companyId] = []
      }
      acc[companyId].push(account)
      return acc
    },
    {} as Record<number, IPayrollAccountViewModel[]>
  )

  // Toggle company expansion
  const toggleCompany = (companyId: number) => {
    setExpandedCompanies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(companyId)) {
        newSet.delete(companyId)
      } else {
        newSet.add(companyId)
      }
      return newSet
    })
  }

  // Calculate grand totals
  const grandTotalDebit = Object.values(companyTotals).reduce(
    (sum, company) => sum + company.totalDebit,
    0
  )
  const grandTotalCredit = Object.values(companyTotals).reduce(
    (sum, company) => sum + company.totalCredit,
    0
  )

  return (
    <div className="flex h-full flex-col">
      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <TooltipProvider>
          <div className="h-full overflow-x-auto rounded-lg border">
            {/* Header table */}
            <Table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[200px] min-w-[180px]" />
                <col className="w-[180px] min-w-[160px]" />
                <col className="w-[220px] min-w-[200px]" />
                <col className="w-[150px] min-w-[130px]" />
                <col className="w-[120px] min-w-[100px]" />
                <col className="w-[120px] min-w-[100px]" />
                <col className="w-[150px] min-w-[130px]" />
              </colgroup>
              <TableHeader className="bg-background sticky top-0 z-20">
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px] min-w-[180px]">
                    COMPANY
                  </TableHead>
                  <TableHead className="w-[180px] min-w-[160px]">
                    DEPARTMENT
                  </TableHead>
                  <TableHead className="w-[220px] min-w-[200px]">
                    COMPONENT
                  </TableHead>
                  <TableHead className="w-[150px] min-w-[130px]">
                    EMPLOYEE
                  </TableHead>
                  <TableHead className="w-[120px] min-w-[100px] text-right">
                    DEBIT
                  </TableHead>
                  <TableHead className="w-[120px] min-w-[100px] text-right">
                    CREDIT
                  </TableHead>
                  <TableHead className="w-[150px] min-w-[130px]">
                    GL CODE
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            {/* Scrollable body table */}
            <div
              className="overflow-y-auto"
              style={{ height: "calc(100vh - 280px)" }}
            >
              <Table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[200px] min-w-[180px]" />
                  <col className="w-[180px] min-w-[160px]" />
                  <col className="w-[220px] min-w-[200px]" />
                  <col className="w-[150px] min-w-[130px]" />
                  <col className="w-[120px] min-w-[100px]" />
                  <col className="w-[120px] min-w-[100px]" />
                  <col className="w-[150px] min-w-[130px]" />
                </colgroup>
                <TableBody>
                  {Object.entries(groupedAccounts).map(
                    ([companyId, companyAccounts]) => (
                      <React.Fragment key={companyId}>
                        {/* Company Header Row */}
                        <TableRow
                          className="bg-muted/30 border-muted hover:bg-card cursor-pointer border-t-2"
                          onClick={() => toggleCompany(Number(companyId))}
                        >
                          <TableCell className="bg-background sticky left-0 z-10 py-2 font-semibold">
                            <div className="flex min-w-0 items-center space-x-2">
                              {expandedCompanies.has(Number(companyId)) ? (
                                <ChevronDown className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                              )}
                              <div className="text-foreground truncate text-sm font-bold">
                                {companyTotals[Number(companyId)]
                                  ?.companyName || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-center font-semibold">
                            <div className="text-muted-foreground text-sm font-bold">
                              TOTAL
                            </div>
                          </TableCell>
                          <TableCell className="py-2"></TableCell>
                          <TableCell className="py-2"></TableCell>
                          <TableCell className="py-2">
                            <div className="text-right text-sm font-bold text-red-600">
                              {formatNumber(
                                companyTotals[Number(companyId)]?.totalDebit ||
                                  0
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="text-right text-sm font-bold text-green-600">
                              {formatNumber(
                                companyTotals[Number(companyId)]?.totalCredit ||
                                  0
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2"></TableCell>
                        </TableRow>

                        {/* Company Accounts */}
                        {expandedCompanies.has(Number(companyId)) &&
                          companyAccounts.map((account, index) => (
                            <TableRow
                              key={`${account.companyId}-${account.departmentId}-${account.componentId}-${index}`}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="bg-background sticky left-0 z-10 py-1">
                                <div className="text-muted-foreground truncate pl-4 text-xs">
                                  {account.companyName || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell className="py-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate text-xs">
                                      {account.departmentName || "N/A"}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{account.departmentName || "N/A"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="py-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate">
                                      <div className="text-xs font-medium">
                                        {account.componentName}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {account.componentType}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {account.componentName} (
                                      {account.componentType})
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="py-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate text-xs">
                                      {account.employeeName || "N/A"}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{account.employeeName || "N/A"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="py-1">
                                <div className="text-right text-xs font-medium text-red-600">
                                  {account.debitAmount > 0
                                    ? formatNumber(account.debitAmount)
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell className="py-1">
                                <div className="text-right text-xs font-medium text-green-600">
                                  {account.creditAmount > 0
                                    ? formatNumber(account.creditAmount)
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell className="py-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate">
                                      <div className="text-xs font-medium">
                                        {account.glCode || "N/A"}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {account.glName || "N/A"}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {account.glCode} - {account.glName}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                      </React.Fragment>
                    )
                  )}

                  {/* Grand Total Row */}
                  <TableRow className="bg-primary/10 border-primary border-t-4">
                    <TableCell className="bg-background sticky left-0 z-10 py-3 font-bold">
                      <div className="text-foreground text-base font-bold">
                        GRAND TOTAL
                      </div>
                    </TableCell>
                    <TableCell className="py-3"></TableCell>
                    <TableCell className="py-3"></TableCell>
                    <TableCell className="py-3"></TableCell>
                    <TableCell className="py-3">
                      <div className="text-right text-base font-bold text-red-600">
                        {formatNumber(grandTotalDebit)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-right text-base font-bold text-green-600">
                        {formatNumber(grandTotalCredit)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            grandTotalDebit === grandTotalCredit
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {grandTotalDebit === grandTotalCredit
                            ? "BALANCED"
                            : "UNBALANCED"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
