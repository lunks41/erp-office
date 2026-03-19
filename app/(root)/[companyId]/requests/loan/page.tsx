"use client"

import { useState } from "react"
import { ILoanRequest } from "@/interfaces/loan"
import { LoanRequestFormData } from "@/schemas/loan"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { HrUserRequest } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { useGetById, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

import { LoanRequestForm } from "./components/loan-request-form"
import { LoanRequestTable } from "./components/loan-request-table"

export default function LoanPage() {
  const [showLoanRequestForm, setShowLoanRequestForm] = useState(false)
  const queryClient = useQueryClient()

  // Extract data with fallbacks - handle API response structure
  const extractLoanRequests = (data: unknown): ILoanRequest[] => {
    if (!data) return []
    if (Array.isArray(data)) {
      if (data.length > 0 && Array.isArray(data[0])) {
        return data[0] as ILoanRequest[]
      }
      return data as ILoanRequest[]
    }
    return []
  }

  // Fetch loan data
  const {
    data: loansData,
    isLoading: loansLoading,
    error: loansError,
  } = useGetById<ILoanRequest[]>(HrUserRequest.getloan, "loans", "33")

  // Initialize mutation hook
  const saveLoanRequestMutation = usePersist(HrUserRequest.addloan)

  // Extract data
  const loans = extractLoanRequests(loansData?.data || [])

  // Calculate statistics for current year
  const currentYear = new Date().getFullYear()
  const currentYearLoans = loans.filter((loan) => {
    const loanYear = new Date(
      loan.requestDate || loan.createdDate || new Date()
    ).getFullYear()
    return loanYear === currentYear
  })

  const totalRequests = loans.length
  const totalLoanAmount = currentYearLoans.reduce(
    (total, loan) => total + (loan.requestedAmount || 0),
    0
  )
  const totalOutstanding = currentYearLoans.reduce(
    (total, loan) => total + (loan.requestedAmount || 0),
    0
  )

  const handleAddNewLoan = () => {
    setShowLoanRequestForm(true)
  }

  const handleLoanSubmit = async (data: LoanRequestFormData) => {
    try {
      // Format dates for API submission
      const loanRequestData = {
        employeeId: data.employeeId,
        loanTypeId: data.loanTypeId,
        requestedAmount: data.requestedAmount,
        calculatedTermMonths: data.calculatedTermMonths,
        desiredEMIAmount: data.desiredEMIAmount,
        remarks: data.remarks,
        requestDate:
          formatDateForApi(data.requestDate) ||
          formatDateForApi(new Date()) ||
          "",
        statusId: 1, // Default to pending
      }

      await saveLoanRequestMutation.mutateAsync(loanRequestData)
      setShowLoanRequestForm(false)

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      queryClient.invalidateQueries({ queryKey: ["loan-detail"] })

      toast.success("Loan request submitted successfully")
    } catch (error) {
      console.error("Error submitting loan request:", error)
      toast.error("Failed to submit loan request")
    }
  }

  // Show loading state
  if (loansLoading && loans.length === 0) {
    return (
      <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="text-muted-foreground mt-2">Loading loan data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (loansError) {
    return (
      <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Error Loading Data
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Failed to load loan data. Please try refreshing the page.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Loan Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage loan requests and approvals
          </p>
        </div>
        <Button onClick={handleAddNewLoan}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-muted-foreground text-xs">All time requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loan Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyFormatter amount={totalLoanAmount} size="lg" />
            </div>
            <p className="text-muted-foreground text-xs">{currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyFormatter amount={totalOutstanding} size="lg" />
            </div>
            <p className="text-muted-foreground text-xs">{currentYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Requests Table */}
      <Card>
        <CardContent>
          <LoanRequestTable
            loans={loans}
            onSaveAction={() => {}}
            showActions={false}
          />
        </CardContent>
      </Card>

      {/* Loan Request Form Dialog */}
      <LoanRequestForm
        open={showLoanRequestForm}
        onOpenChange={setShowLoanRequestForm}
        onSubmit={handleLoanSubmit}
      />
    </div>
  )
}
