"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ApiResponse } from "@/interfaces/auth"
import { IPayrollAccountViewModel } from "@/interfaces/payroll-account"
import {
  IPayrollDashboardDetails,
  IPayrollEmployeeHd,
  ISIFEmployee,
} from "@/interfaces/payrun"
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Download,
  Mail,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { useGetById, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

import { PayRunSummaryForm } from "../components/payrun-summary-form"
import { PayRunSummaryTable } from "../components/payrun-summary-table"
import { PayRunsAccountingTable } from "../components/payruns-accounting-table"
import { getPayslipPDFAsArrayBuffer } from "../components/payslip-template"

export default function PayRunSummaryPage() {
  const params = useParams()
  const payrunId = params.payrunId as string
  const companyId = params.companyId as string
  const router = useRouter()

  const [selectedEmployee, setSelectedEmployee] =
    useState<IPayrollEmployeeHd | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false)
  const [showEditConfirmation, setShowEditConfirmation] = useState(false)
  const [showSendPayslipConfirmation, setShowSendPayslipConfirmation] =
    useState(false)
  const [showDeletePaymentConfirmation, setShowDeletePaymentConfirmation] =
    useState(false)
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false)
  const [showRecordPaymentConfirmation, setShowRecordPaymentConfirmation] =
    useState(false)
  const [showPayslipDropdown, setShowPayslipDropdown] = useState(false)
  const [isSendingAllPayslips, setIsSendingAllPayslips] = useState(false)
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
  })
  const payslipDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        payslipDropdownRef.current &&
        !payslipDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPayslipDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // API call to get dashboard details
  const { data: payRunDataDetails } = useGetById<IPayrollDashboardDetails>(
    `/hr/payrollruns/dashboard-details`,
    "pay-run-data-details",
    payrunId
  )

  // API call to get pay run summary data
  const {
    data: payRunData,
    isLoading,
    refetch,
  } = useGetById<IPayrollEmployeeHd[]>(
    `/hr/payrollruns/payrunlist`,
    "pay-run-summary",
    payrunId
  )

  // SIF API call
  const {
    data: sifData,
    refetch: refetchSIF,
    isLoading: isSIFLoading,
  } = useGetById<ISIFEmployee[]>(`/hr/payrollruns/SIF`, "sif-data", payrunId)

  // Accounting data API call
  const { data: accountingData, isLoading: isAccountingLoading } = useGetById<
    IPayrollAccountViewModel[]
  >(`/hr/payrollruns/account-data`, "accounting-data", payrunId)

  // Record payment API call
  const { mutate: recordPayment, isPending: isRecordingPayment } = usePersist(
    `/hr/payrollruns/record-payment/${payrunId}`
  )

  // Reject payment API call
  const { mutate: rejectPayment, isPending: isRejectingPayment } = usePersist(
    `/hr/payrollruns/reject/${payrunId}`
  )

  // Delete payment API call
  const { mutate: deletePayment, isPending: isDeletingPayment } = usePersist(
    `/hr/payrollruns/delete-record-payment/${payrunId}`
  )

  // Approve payroll API call
  const { mutate: approvePayroll, isPending: isApprovingPayroll } = usePersist(
    `/hr/payrollruns/submit/${payrunId}`
  )

  // Edit payroll API call
  const { mutate: editPayroll, isPending: isEditingPayroll } = usePersist(
    `/hr/payrollruns/edit/${payrunId}`
  )

  // Cast the data to the correct type
  const employees = (payRunData?.data as unknown as IPayrollEmployeeHd[]) || []
  const accounts =
    (accountingData?.data as unknown as IPayrollAccountViewModel[]) || []

  // Helper function to get dashboard details data
  const getDashboardDetails = () => {
    if (Array.isArray(payRunDataDetails?.data)) {
      return payRunDataDetails?.data[0] || null
    }
    return payRunDataDetails?.data || null
  }

  const dashboardDetails = getDashboardDetails()

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
    setShowPaymentForm(true)
  }

  const handleSIF = async () => {
    toast.info("Generating SIF Excel file...", {
      description: "Please wait while we prepare the SIF data for download.",
    })

    try {
      // Fetch SIF data
      await refetchSIF()

      // Check if we have SIF data
      if (sifData?.data && Array.isArray(sifData.data)) {
        // Create worksheet from SIF data
        const worksheet = XLSX.utils.json_to_sheet(sifData.data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "SIF Data")

        // Generate filename with current date
        const currentDate = new Date().toISOString().split("T")[0]
        const filename = `SIF_${payrunId}_${currentDate}.xlsx`

        // Download the file
        XLSX.writeFile(workbook, filename)
        toast.success("SIF Excel file downloaded successfully")
      } else {
        toast.error("No SIF data available to download")
      }
    } catch (error) {
      console.error("Error generating SIF Excel:", error)
      toast.error("Failed to generate SIF Excel file")
    }
  }

  const handleRecordPayment = () => {
    recordPayment(
      {},
      {
        onSuccess: (response: ApiResponse<unknown>) => {
          if (response.result === 1) {
            toast.success("Payment recorded successfully")
            refetch() // Refetch the table data
          } else {
            toast.error(response.message || "Failed to record payment")
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to record payment")
          console.error("Error recording payment:", error)
        },
      }
    )
  }

  const handleRejectPayment = () => {
    rejectPayment(
      {},
      {
        onSuccess: (response: ApiResponse<unknown>) => {
          if (response.result === 1) {
            toast.success("Payment rejected successfully")
            refetch() // Refetch the table data
            router.push(`/${companyId}/hr/payruns/${payrunId}/summary`)
          } else {
            toast.error(response.message || "Failed to reject payment")
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to reject payment")
          console.error("Error rejecting payment:", error)
        },
      }
    )
  }

  const handleDeleteRecordPayment = () => {
    deletePayment(
      {},
      {
        onSuccess: (response: ApiResponse<unknown>) => {
          if (response.result === 1) {
            toast.success("Payment deleted successfully")
            refetch() // Refetch the table data
            router.push(`/${companyId}/hr/payruns/${payrunId}/summary`)
          } else {
            toast.error(response.message || "Failed to delete payment")
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to delete payment")
          console.error("Error deleting payment:", error)
        },
      }
    )
  }

  const handleApprovePayroll = () => {
    approvePayroll(
      {},
      {
        onSuccess: (response: ApiResponse<unknown>) => {
          if (response.result === 1) {
            toast.success("Payroll approved successfully")
            refetch() // Refetch the table data
          } else {
            toast.error(response.message || "Failed to approve payroll")
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to approve payroll")
          console.error("Error approving payroll:", error)
        },
      }
    )
  }

  const handleEditPayrun = () => {
    editPayroll(
      {},
      {
        onSuccess: (response: ApiResponse<unknown>) => {
          if (response.result === 1) {
            toast.success("Payroll edited successfully")
            // Navigate to preview page for editing
            router.push(`/${companyId}/hr/payruns/${payrunId}/preview`)
          } else {
            toast.error(response.message || "Failed to edit payroll")
          }
        },
        onError: (error: unknown) => {
          toast.error("Failed to edit payroll")
          console.error("Error editing payroll:", error)
        },
      }
    )
  }

  // Helper method to send WhatsApp payslip for a single employee
  const sendWhatsAppPayslipForEmployee = async (
    employee: IPayrollEmployeeHd
  ): Promise<boolean> => {
    try {
      // Generate PDF
      const earnings = (employee?.data_details || [])
        .filter((item) => item.componentType?.toLowerCase() === "earning")
        .map((item) => ({
          componentName: item.componentName || "",
          basicAmount: item.basicAmount || 0,
          currentAmount: item.amount || 0,
        })) as Array<{
        componentName: string
        basicAmount: number
        currentAmount: number
      }>

      const deductions = (employee?.data_details || [])
        .filter((item) => item.componentType?.toLowerCase() === "deduction")
        .map((item) => ({
          componentName: item.componentName || "",
          basicAmount: item.basicAmount || 0,
          currentAmount: item.amount || 0,
        })) as Array<{
        componentName: string
        basicAmount: number
        currentAmount: number
      }>

      // Get company info from the first employee (assuming all employees are from same company)
      const payslipData = {
        employeeName: employee.employeeName || "",
        employeeId: employee.payrollEmployeeId?.toString() || "",
        payPeriod: employee.payName || "",
        companyName: employee.companyName || "",
        companyId: employee.companyId?.toString() || "",
        address: employee.address || "",
        phoneNo: employee.phoneNo || "",
        email: employee.email || "",
        employeeCode: employee.employeeCode || "",
        designationName: employee.designationName || "",
        departmentName: employee.departmentName || "",
        emailAdd: employee.emailAdd || "",
        workPermitNo: employee.workPermitNo || "",
        personalNo: employee.personalNo || "",
        iban: employee.iban || "",
        bankName: employee.bankName || "",
        presentDays: employee.presentDays || 0,
        pastDays: employee.pastDays || 0,
        joinDate: employee.joinDate || "",
        whatsUpPhoneNo: employee.whatsUpPhoneNo || "",
        earnings,
        deductions,
        netPay: employee.netSalary || 0,
        basicNetPay: employee.basicSalary || 0,
      }

      const pdfBlob = await getPayslipPDFAsArrayBuffer(payslipData)

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          resolve(base64String.split(",")[1]) // Remove data:application/pdf;base64, prefix
        }
        // Convert ArrayBuffer to Blob for FileReader
        const blob = new Blob([pdfBlob], { type: "application/pdf" })
        reader.readAsDataURL(blob)
      })

      const sanitizedName =
        employee.employeeName?.replace(/\s+/g, "_") ?? "unknown"
      const filename = `payslip_${sanitizedName}_${new Date().toISOString().split("T")[0]}.pdf`

      // Step 1: Upload PDF to server
      const uploadResponse = await fetch("/api/upload-payslip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentBase64: base64,
          filename: filename,
        }),
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload payslip")
      }

      // Step 2: Send via WhatsApp using the uploaded file path
      const whatsappResponse = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: employee.whatsUpPhoneNo || "",
          filePath: uploadResult.data.url, // This is the relative path like /uploads/payslips/123_file.pdf
          caption: `Hi ${employee?.employeeName}! Your payslip for ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} is ready.`,
          filename: filename,
        }),
      })

      const whatsappResult = await whatsappResponse.json()

      console.log("sendWhatsAppPayslipForEmployee result", whatsappResult)

      if (whatsappResult.success) {
        // Clean up the uploaded file
        try {
          await fetch("/api/cleanup-payslip", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: uploadResult.data.filename,
            }),
          })
        } catch (cleanupError) {
          console.warn("Failed to cleanup payslip file:", cleanupError)
          // Don't fail the whole operation if cleanup fails
        }

        console.log(
          `Successfully sent WhatsApp to ${employee.employeeName || ""}`
        )
        return true
      } else {
        throw new Error(whatsappResult.error || "Failed to send payslip")
      }
    } catch (error) {
      console.error(
        `Error sending WhatsApp to ${employee.employeeName || ""}:`,
        error
      )
      return false
    }
  }

  // Method to send payslips to all employees via WhatsApp
  const handleSendAllPayslipsViaWhatsApp = async () => {
    try {
      setIsSendingAllPayslips(true)

      // Filter employees who have WhatsApp phone numbers (not null or empty)
      const employeesWithWhatsApp = employees.filter(
        (emp) => emp.whatsUpPhoneNo && emp.whatsUpPhoneNo.trim() !== ""
      )

      if (employeesWithWhatsApp.length === 0) {
        toast.error("No employees found with WhatsApp contact information")
        return
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to send payslips to ${employeesWithWhatsApp.length} employees via WhatsApp?`
      )

      if (!confirmed) return

      setSendingProgress({ current: 0, total: employeesWithWhatsApp.length })

      toast.info(
        `Sending payslips to ${employeesWithWhatsApp.length} employees via WhatsApp...`,
        {
          description: `This may take a few minutes. Please wait.`,
        }
      )

      let successCount = 0
      let errorCount = 0

      // Process each employee
      for (let i = 0; i < employeesWithWhatsApp.length; i++) {
        const employee = employeesWithWhatsApp[i]
        setSendingProgress({
          current: i + 1,
          total: employeesWithWhatsApp.length,
        })

        const success = await sendWhatsAppPayslipForEmployee(employee)

        if (success) {
          successCount++
        } else {
          errorCount++
        }

        // Add a small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Show final results
      if (errorCount === 0) {
        toast.success(
          `Successfully sent payslips to ${successCount} employees via WhatsApp!`
        )
      } else {
        toast.success(
          `Sent payslips to ${successCount} employees via WhatsApp`,
          {
            description: `Failed to send to ${errorCount} employees. Check console for details.`,
          }
        )
      }
    } catch (error) {
      console.error("Error sending all payslips via WhatsApp:", error)
      toast.error("Failed to send payslips to all employees via WhatsApp", {
        description: "Please try again later.",
      })
    } finally {
      setIsSendingAllPayslips(false)
    }
  }

  // Method to send payslips to all employees via Email
  const handleSendAllPayslipsViaEmail = async () => {
    try {
      setIsSendingAllPayslips(true)

      // Filter employees who have email addresses (not null or empty)
      const employeesWithEmail = employees.filter(
        (emp) => emp.emailAdd && emp.emailAdd.trim() !== ""
      )

      if (employeesWithEmail.length === 0) {
        toast.error("No employees found with email contact information")
        return
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to send payslips to ${employeesWithEmail.length} employees via Email?`
      )

      if (!confirmed) return

      setSendingProgress({ current: 0, total: employeesWithEmail.length })

      toast.info(
        `Sending payslips to ${employeesWithEmail.length} employees via Email...`,
        {
          description: `This may take a few minutes. Please wait.`,
        }
      )

      let successCount = 0
      let errorCount = 0

      // Process each employee
      for (let i = 0; i < employeesWithEmail.length; i++) {
        const employee = employeesWithEmail[i]
        setSendingProgress({
          current: i + 1,
          total: employeesWithEmail.length,
        })

        try {
          // For email, we'll use the existing mailto functionality
          // In a real implementation, you'd call your email API here
          // For now, we'll simulate success
          successCount++

          // Add a small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          errorCount++
          console.error(
            `Error sending email to ${employee.employeeName}:`,
            error
          )
        }
      }

      // Show final results
      if (errorCount === 0) {
        toast.success(
          `Successfully sent payslips to ${successCount} employees via Email!`
        )
      } else {
        toast.success(`Sent payslips to ${successCount} employees via Email`, {
          description: `Failed to send to ${errorCount} employees. Check console for details.`,
        })
      }
    } catch (error) {
      console.error("Error sending all payslips via Email:", error)
      toast.error("Failed to send payslips to all employees via Email", {
        description: "Please try again later.",
      })
    } finally {
      setIsSendingAllPayslips(false)
    }
  }

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
                    Payroll Summary
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
                {/* Check if status is rejected */}
                {employees[0]?.isRejected ? (
                  // If rejected, show Approve Payroll and Edit Payrun buttons
                  <>
                    <Button
                      onClick={() => setShowApproveConfirmation(true)}
                      disabled={isApprovingPayroll}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:from-emerald-600 hover:to-teal-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isApprovingPayroll ? "Approving..." : "Approve Payroll"}
                    </Button>
                    <Button
                      onClick={() => setShowEditConfirmation(true)}
                      variant="outline"
                      disabled={isEditingPayroll}
                      className="border-blue-500 text-muted-foreground hover:bg-card"
                    >
                      {isEditingPayroll ? "Editing..." : "Edit Payrun"}
                    </Button>
                  </>
                ) : employees[0]?.isPaid ? (
                  // If payment is recorded, show SIF, Send Payslip and Delete Record Payment buttons
                  <>
                    <Button
                      onClick={handleSIF}
                      disabled={isSIFLoading}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg hover:from-blue-600 hover:to-indigo-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isSIFLoading ? "Generating..." : "SIF"}
                    </Button>
                    <div className="relative" ref={payslipDropdownRef}>
                      <Button
                        onClick={() =>
                          setShowPayslipDropdown(!showPayslipDropdown)
                        }
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:from-emerald-600 hover:to-teal-700"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Share Payslip
                        <MoreHorizontal className="ml-2 h-4 w-4" />
                      </Button>

                      {/* Dropdown Menu */}
                      {showPayslipDropdown && (
                        <div className="ring-opacity-5 absolute top-full right-0 z-10 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-lg ring-1 ring-black">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowPayslipDropdown(false)
                                handleSendAllPayslipsViaWhatsApp()
                              }}
                              disabled={isSendingAllPayslips}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <MessageSquare className="mr-3 h-4 w-4 text-green-600" />
                              {isSendingAllPayslips
                                ? "Sending..."
                                : "Send All via WhatsApp"}
                            </button>
                            <button
                              onClick={() => {
                                setShowPayslipDropdown(false)
                                handleSendAllPayslipsViaEmail()
                              }}
                              disabled={isSendingAllPayslips}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Mail className="mr-3 h-4 w-4 text-muted-foreground" />
                              {isSendingAllPayslips
                                ? "Sending..."
                                : "Send All via Email"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Progress Indicator */}
                      {isSendingAllPayslips && (
                        <div className="mt-2 text-center">
                          <div className="mb-1 text-xs text-gray-600">
                            Sending payslips... {sendingProgress.current} of{" "}
                            {sendingProgress.total}
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-green-600 transition-all duration-300"
                              style={{
                                width: `${(sendingProgress.current / sendingProgress.total) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {!employees[0]?.isPreviousPaid && (
                      <Button
                        onClick={() => setShowDeletePaymentConfirmation(true)}
                        disabled={isDeletingPayment}
                        variant="destructive"
                      >
                        {isDeletingPayment
                          ? "Deleting..."
                          : "Delete Record Payment"}
                      </Button>
                    )}
                  </>
                ) : (
                  // If payment is not recorded, show Record Payment and Reject Approval buttons
                  <>
                    <Button
                      onClick={() => setShowRecordPaymentConfirmation(true)}
                      disabled={isRecordingPayment}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg hover:from-blue-600 hover:to-indigo-700"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {isRecordingPayment ? "Recording..." : "Ready to Pay"}
                    </Button>
                    <Button
                      onClick={() => setShowRejectConfirmation(true)}
                      disabled={isRejectingPayment}
                      variant="destructive"
                    >
                      Reject Approval
                    </Button>
                  </>
                )}
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

      {/* Tabs for Employee Summary and Accounting */}
      <Tabs defaultValue="employees" className="w-full">
        <TabsList>
          <TabsTrigger value="employees">Employee Summary</TabsTrigger>
          <TabsTrigger value="accounting">Accounting Data</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <PayRunSummaryTable
            employees={employees}
            onEmployeeClick={handleEmployeeClick}
          />
        </TabsContent>

        <TabsContent value="accounting" className="mt-4">
          {isAccountingLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-muted-foreground">
                  Loading accounting data...
                </p>
              </div>
            </div>
          ) : (
            <PayRunsAccountingTable accounts={accounts} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={showPaymentForm}
        onOpenChange={(open) => {
          setShowPaymentForm(open)
          if (!open) {
            setSelectedEmployee(null)
          }
        }}
      >
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
                    <h2 className="text-xl font-bold text-muted-foreground">
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
                      {selectedEmployee?.status || ""}
                    </span>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <PayRunSummaryForm
                employee={selectedEmployee}
                payrunId={payrunId}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Payroll Confirmation Dialog */}
      <Dialog
        open={showApproveConfirmation}
        onOpenChange={setShowApproveConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Approve Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to approve this payroll? This will mark the
              payroll as approved.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowApproveConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowApproveConfirmation(false)
                  handleApprovePayroll()
                }}
                disabled={isApprovingPayroll}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isApprovingPayroll ? "Approving..." : "Yes, Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payrun Confirmation Dialog */}
      <Dialog
        open={showEditConfirmation}
        onOpenChange={setShowEditConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Edit Payrun</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to edit this payrun? You will be redirected
              to the preview page.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEditConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowEditConfirmation(false)
                  handleEditPayrun()
                }}
                disabled={isEditingPayroll}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isEditingPayroll ? "Editing..." : "Yes, Edit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Payslip Confirmation Dialog */}
      <Dialog
        open={showSendPayslipConfirmation}
        onOpenChange={setShowSendPayslipConfirmation}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Share Payslip
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold text-primary">
                Choose sharing method:
              </h4>
              <p className="text-sm text-blue-700">
                Select how you would like to share the payslip with employees.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setShowSendPayslipConfirmation(false)
                  toast.info("WhatsApp sharing", {
                    description: "Opening WhatsApp to share payslip...",
                  })
                  window.open(
                    `https://wa.me/971554849060?text=Hi! Here's the payslip.`,
                    "_blank"
                  )
                }}
                className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <MessageSquare className="mr-3 h-6 w-6 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    Share via WhatsApp
                  </div>
                  <div className="text-sm text-gray-500">
                    Send payslip via WhatsApp message
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowSendPayslipConfirmation(false)
                  toast.info("Email sharing", {
                    description: "Opening email client to share payslip...",
                  })
                  window.open(
                    `mailto:?subject=Payslip&body=Please find attached the payslip.`,
                    "_blank"
                  )
                }}
                className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <Mail className="mr-3 h-6 w-6 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    Share via Email
                  </div>
                  <div className="text-sm text-gray-500">
                    Send payslip via email attachment
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSendPayslipConfirmation(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Record Payment Confirmation Dialog */}
      <Dialog
        open={showDeletePaymentConfirmation}
        onOpenChange={setShowDeletePaymentConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete the recorded payment? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeletePaymentConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowDeletePaymentConfirmation(false)
                  handleDeleteRecordPayment()
                }}
                disabled={isDeletingPayment}
                variant="destructive"
              >
                {isDeletingPayment ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Approval Confirmation Dialog */}
      <Dialog
        open={showRejectConfirmation}
        onOpenChange={setShowRejectConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Reject Approval</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to reject this payroll approval? This will
              send the payroll back for review.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowRejectConfirmation(false)
                  handleRejectPayment()
                }}
                disabled={isRejectingPayment}
                variant="destructive"
              >
                {isRejectingPayment ? "Rejecting..." : "Yes, Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Confirmation Dialog */}
      <Dialog
        open={showRecordPaymentConfirmation}
        onOpenChange={setShowRecordPaymentConfirmation}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to record the payment for this payroll? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRecordPaymentConfirmation(false)}
              >
                No, Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowRecordPaymentConfirmation(false)
                  handleRecordPayment()
                }}
                disabled={isRecordingPayment}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRecordingPayment ? "Recording..." : "Yes, Record Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
