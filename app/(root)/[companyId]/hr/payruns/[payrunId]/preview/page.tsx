"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ApiResponse } from "@/interfaces/auth"
import {
  IPayrollDashboardDetails,
  IPayrollEmployeeHd,
} from "@/interfaces/payrun"
import { ArrowLeft, CheckCircle, Trash } from "lucide-react"
import { toast } from "sonner"

import { useGetById, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

import { PayRunPreviewForm } from "../components/payrun-preview-form"
import { PayRunPreviewTable } from "../components/payrun-preview-table"

export default function PayRunPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const payrunId = params.payrunId as string

  const [selectedEmployee, setSelectedEmployee] =
    useState<IPayrollEmployeeHd | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const { data: payRunDataDetails } = useGetById<IPayrollDashboardDetails>(
    `/hr/payrollruns/dashboard-details`,
    "pay-run-data-details",
    payrunId
  )

  // API call to get pay run data
  const {
    data: payRunData,
    isLoading,
    refetch,
  } = useGetById<IPayrollEmployeeHd[]>(
    `/hr/payrollruns/payrunlist`,
    "pay-run-data",
    payrunId
  )

  // Submit and approve API call
  const { mutate: submitPayRun, isPending: isSubmitting } = usePersist(
    `/hr/payrollruns/submit/${payrunId}`
  )

  // Delete pay run API call
  const { mutate: deletePayRun } = usePersist(
    `/hr/payrollruns/delete/${payrunId}`
  )

  // Cast the data to the correct type
  const employees = useMemo(
    () =>
      (payRunData?.data as unknown as IPayrollEmployeeHd[]) || [],
    [payRunData?.data]
  )

  // Helper function to get dashboard details data
  const getDashboardDetails = () => {
    if (Array.isArray(payRunDataDetails?.data)) {
      return payRunDataDetails?.data[0] || null
    }
    return payRunDataDetails?.data || null
  }

  const dashboardDetails = getDashboardDetails()

  // Check if access should be restricted
  const isPaid = employees[0]?.isPaid === true

  // Redirect if payroll is already paid (should be in summary page)
  useEffect(() => {
    if (!isLoading && employees.length > 0 && isPaid) {
      toast.error(
        "Access denied: Payroll is already paid. Please use the summary page."
      )
      router.push(`/${companyId}/hr/payruns/${payrunId}/summary`)
    }
  }, [isLoading, employees, isPaid, router, companyId, payrunId])

  // Show loading or redirect if conditions are met
  if (isLoading) {
    return (
      <div className="@container flex-1 space-y-3 p-3 pt-4 md:p-4">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">Loading pay run data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect if access is denied
  if (employees.length > 0 && isPaid) {
    return null
  }

  // Calculate totals from actual data
  const totalEarnings = employees.reduce(
    (sum, emp) => sum + (emp.totalEarnings || 0),
    0
  )
  const totalDeductions = employees.reduce(
    (sum, emp) => sum + (emp.totalDeductions || 0),
    0
  )
  const totalNetPay = employees.reduce(
    (sum, emp) => sum + (emp.netSalary || 0),
    0
  )

  const handleEmployeeClick = (employee: IPayrollEmployeeHd) => {
    setSelectedEmployee(employee)
    setShowForm(true)
  }

  // Handle submit and approve
  const handleSubmitAndApprove = async () => {
    try {
      await submitPayRun(
        {},
        {
          onSuccess: (response: ApiResponse<unknown>) => {
            if (response.result === 1) {
              refetch() // Refetch the table data
              // Navigate to summary page after successful submission
              router.push(`/${companyId}/hr/payruns/${payrunId}/summary`)
            }
          },
          onError: (error: unknown) => {
            toast.error("Failed to submit pay run")
            console.error("Error submitting pay run:", error)
          },
        }
      )
    } catch (error) {
      toast.error("Failed to submit pay run")
      console.error("Error submitting pay run:", error)
    }
  }

  const handleDeletePayRun = () => {
    deletePayRun(
      {},
      {
        onSuccess: (response: ApiResponse<unknown>) => {
          if (response.result === 1) {
            // Navigate back with refetch parameter to reload the pay-run-card
            router.push(`/${companyId}/hr/payruns?refetch=true`)
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to delete pay run")
          console.error("Error deleting pay run:", error)
        },
      }
    )
  }

  return (
    <div className="@container flex-1 space-y-3 p-3 pt-4 md:p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
        {/* Main Payroll Overview Card */}
        <Card className="overflow-hidden border-0 bg-white/50 shadow-lg">
          <CardContent className="p-4">
            {/* Header Section */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/${companyId}/hr/payruns?refetch=true`)
                  }
                  className="flex items-center space-x-2 rounded-lg bg-white/80 text-gray-700 shadow-sm backdrop-blur-sm hover:bg-white hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 shadow-lg">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Payroll Preview
                  </h3>
                  <p className="text-sm text-gray-600">
                    {dashboardDetails?.payName} •{" "}
                    {dashboardDetails?.workingDaysPerMonth} Base Days
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-600">
                    Pay Day
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {dashboardDetails?.payDate
                      ? new Date(dashboardDetails.payDate)
                          .toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          .toUpperCase()
                      : ""}
                  </div>
                </div>
                <Button
                  onClick={() => setShowSubmitConfirmation(true)}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:from-emerald-600 hover:to-teal-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit & Approve"}
                </Button>

                <Button
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-red-500 to-red-600 shadow-lg hover:from-red-600 hover:to-red-700"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Financial Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Total Employees Card */}
              <div className="rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">
                      Total Employees
                    </p>
                    <p className="text-2xl font-bold">
                      {employees.length} Staff
                    </p>
                  </div>
                  <div className="rounded-full bg-white/30 p-2.5 shadow-inner">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Payroll Cost Card */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">
                      Payroll Cost
                    </p>
                    <p className="text-2xl font-bold">
                      <CurrencyFormatter amount={totalEarnings} />
                    </p>
                  </div>
                  <div className="rounded-full bg-white/30 p-2.5 shadow-inner">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Deductions Card */}
              <div className="rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Deductions</p>
                    <p className="text-2xl font-bold">
                      <CurrencyFormatter amount={totalDeductions} />
                    </p>
                  </div>
                  <div className="rounded-full bg-white/30 p-2.5 shadow-inner">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Net Pay Card */}
              <div className="rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Net Pay</p>
                    <p className="text-2xl font-bold">
                      <CurrencyFormatter amount={totalNetPay} />
                    </p>
                  </div>
                  <div className="rounded-full bg-white/30 p-2.5 shadow-inner">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <PayRunPreviewTable
        employees={employees}
        onEmployeeClick={handleEmployeeClick}
      />

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-h-[90vh] w-[40vw] !max-w-none overflow-y-auto">
          {isLoading ? (
            <DialogHeader>
              <DialogTitle>Loading Employee Details...</DialogTitle>
            </DialogHeader>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-blue-600">
                      {selectedEmployee?.employeeName || "Employee Name"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      [{selectedEmployee?.employeeCode}] |{" "}
                      {selectedEmployee?.departmentName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedEmployee?.companyName}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        selectedEmployee?.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : selectedEmployee?.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : selectedEmployee?.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedEmployee?.status || "N/A"}
                    </span>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <PayRunPreviewForm
                employee={selectedEmployee}
                onCloseAction={() => setShowForm(false)}
                onRefetch={refetch}
                payrunId={payrunId}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit & Approve Confirmation Dialog */}
      <Dialog
        open={showSubmitConfirmation}
        onOpenChange={setShowSubmitConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Submit & Approve</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to submit and approve this payroll? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSubmitConfirmation(false)
                  handleSubmitAndApprove()
                }}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? "Submitting..." : "Yes, Submit & Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this payroll? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirmation(false)
                  handleDeletePayRun()
                }}
                variant="destructive"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
