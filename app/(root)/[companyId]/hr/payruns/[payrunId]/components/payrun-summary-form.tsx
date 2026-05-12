"use client"

import { useState } from "react"
import { IPayrollEmployeeDt, IPayrollEmployeeHd } from "@/interfaces/payrun"
import { Download, Mail, MessageSquare } from "lucide-react"
import { toast } from "sonner"

import { useGetById } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

import {
  downloadPayslipPDF,
  getPayslipPDFAsArrayBuffer,
} from "./payslip-template"

interface PayRunSummaryFormProps {
  employee: IPayrollEmployeeHd | null
  payrunId: string
}

export function PayRunSummaryForm({
  employee,
  payrunId,
}: PayRunSummaryFormProps) {
  console.log(
    "🔄 PayRunSummaryForm: Component rendered with employee:",
    employee,
    "payrunId:",
    payrunId
  )

  const [formData] = useState<Partial<IPayrollEmployeeHd>>(employee || {})
  // Remove unused state variables
  // const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
  // const [isSendingEmail, setIsSendingEmail] = useState(false)

  // API call to get detailed employee data - only when form is open and employee is selected
  console.log(
    "📡 PayRunSummaryForm: Calling useGetById hook for employee details"
  )
  const { data: employeeDetails, isLoading } = useGetById<IPayrollEmployeeDt[]>(
    `/hr/payrollruns/payrundetailslist/${payrunId}`,
    "employee-details",
    employee?.payrollEmployeeId?.toString() || ""
  )

  console.log(
    "📊 PayRunSummaryForm: Employee details received:",
    employeeDetails
  )
  console.log("⏳ PayRunSummaryForm: Loading state:", isLoading)

  const employeeData =
    (employeeDetails?.data as unknown as IPayrollEmployeeDt[]) || []

  // Calculate Net Pay based on current data
  const calculateNetPay = () => {
    const totalEarnings = employeeData
      .filter((item) => item.componentType?.toLowerCase() === "earning")
      .reduce((sum, item) => sum + (item.amount || 0), 0)

    const totalDeductions = employeeData
      .filter((item) => item.componentType?.toLowerCase() === "deduction")
      .reduce((sum, item) => sum + (item.amount || 0), 0)

    return totalEarnings - totalDeductions
  }

  const currentNetPay = calculateNetPay()

  // Calculate Basic Net Pay
  const calculateBasicNetPay = () => {
    const totalBasicEarnings = employeeData
      .filter((item) => item.componentType?.toLowerCase() === "earning")
      .reduce((sum, item) => sum + (item.basicAmount || 0), 0)

    const totalBasicDeductions = employeeData
      .filter((item) => item.componentType?.toLowerCase() === "deduction")
      .reduce((sum, item) => sum + (item.basicAmount || 0), 0)

    return totalBasicEarnings - totalBasicDeductions
  }

  const currentBasicNetPay = calculateBasicNetPay()

  // Helper function for number formatting without currency symbol
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)
  }

  const handleSendWhatsAppPayslip = async () => {
    console.log("📱 PayRunSummaryForm: handleSendWhatsAppPayslip called")
    try {
      if (!employee || !payrunId) {
        console.log("❌ PayRunSummaryForm: Missing employee or payrunId")
        return
      }

      if (!employee.phoneNo) {
        console.log(
          "❌ PayRunSummaryForm: Employee WhatsApp number not available"
        )
        toast.error("Employee WhatsApp number not available")
        return
      }

      console.log("📊 PayRunSummaryForm: Creating payslip data for WhatsApp")
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
        earnings: employeeData
          .filter((item) => item.componentType?.toLowerCase() === "earning")
          .map((item) => ({
            componentName: item.componentName,
            basicAmount: item.basicAmount || 0,
            currentAmount: item.amount || 0,
          })),
        deductions: employeeData
          .filter((item) => item.componentType?.toLowerCase() === "deduction")
          .map((item) => ({
            componentName: item.componentName,
            basicAmount: item.basicAmount || 0,
            currentAmount: item.amount || 0,
          })),
        netPay: currentNetPay,
        basicNetPay: currentBasicNetPay,
      }

      console.log("📄 PayRunSummaryForm: Getting PDF as array buffer")
      // Get PDF as array buffer for WhatsApp API
      const pdfBuffer = await getPayslipPDFAsArrayBuffer(payslipData)

      console.log("🔄 PayRunSummaryForm: Converting PDF to base64")
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          resolve(base64String.split(",")[1]) // Remove data:application/pdf;base64, prefix
        }
        // Convert ArrayBuffer to Blob for FileReader
        const blob = new Blob([pdfBuffer], { type: "application/pdf" })
        reader.readAsDataURL(blob)
      })

      const sanitizedName =
        employee.employeeName?.replace(/\s+/g, "_") ?? "unknown"
      const filename = `payslip_${sanitizedName}_${new Date().toISOString().split("T")[0]}.pdf`

      console.log("📤 PayRunSummaryForm: Uploading PDF to server")
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
      console.log("📤 PayRunSummaryForm: Upload result:", uploadResult)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload payslip")
      }

      console.log("📱 PayRunSummaryForm: Sending via WhatsApp API")
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
      console.log("📱 PayRunSummaryForm: WhatsApp API result:", whatsappResult)

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

        return true
      } else {
        throw new Error(whatsappResult.error || "Failed to send payslip")
      }
    } catch (error) {
      console.error(
        `Error sending WhatsApp to ${employee?.employeeName || ""}:`,
        error
      )
      return false
    }
  }

  const handleDownloadPayslip = async () => {
    console.log("📥 PayRunSummaryForm: handleDownloadPayslip called")
    try {
      if (!employee || !payrunId) {
        console.log(
          "❌ PayRunSummaryForm: Missing employee or payrunId for download"
        )
        toast.error("Employee data not available")
        return
      }

      // Check if we have earnings/deductions data
      if (!employeeData || employeeData.length === 0) {
        console.log(
          "❌ PayRunSummaryForm: No payroll details available for download"
        )
        toast.error("No payroll details available for this employee")
        return
      }

      console.log("📊 PayRunSummaryForm: Creating payslip data for download")
      const earnings = employeeData
        .filter((item) => item.componentType?.toLowerCase() === "earning")
        .map((item) => ({
          componentName: item.componentName,
          basicAmount: item.basicAmount || 0,
          currentAmount: item.amount || 0,
        }))

      const deductions = employeeData
        .filter((item) => item.componentType?.toLowerCase() === "deduction")
        .map((item) => ({
          componentName: item.componentName,
          basicAmount: item.basicAmount || 0,
          currentAmount: item.amount || 0,
        }))

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
        presentDays: employee.presentDays || 0,
        pastDays: employee.pastDays || 0,
        bankName: employee.bankName || "",
        joinDate: employee.joinDate || "",
        whatsUpPhoneNo: employee.whatsUpPhoneNo || "",
        earnings,
        deductions,
        netPay: currentNetPay,
        basicNetPay: currentBasicNetPay,
      }

      console.log("📄 PayRunSummaryForm: Calling downloadPayslipPDF function")
      // Show loading toast
      toast.info("Generating PDF...", {
        description: "Please wait while we create your payslip",
      })

      await downloadPayslipPDF(payslipData)
      console.log("✅ PayRunSummaryForm: Payslip downloaded successfully")
      toast.success("Payslip downloaded successfully!")
    } catch (error) {
      console.log("❌ PayRunSummaryForm: Download error:", error)
      console.error("Error downloading payslip:", error)

      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Failed to generate payslip PDF")) {
          toast.error("PDF generation failed. Please try again.")
        } else if (error.message.includes("Failed to download payslip PDF")) {
          toast.error("Download failed. Please check your browser settings.")
        } else {
          toast.error(`Download failed: ${error.message}`)
        }
      } else {
        toast.error("Failed to download payslip. Please try again.")
      }
    }
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">Loading employee details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Payment Status Banner */}
      {employee?.isPaid && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="font-medium text-green-800">
              Paid on {""}
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}{" "}
              through Bank Transfer
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6 pt-4">
        {/* Payable Days and Past Days Section */}
        <div>
          <div className="grid grid-cols-2 gap-4 border-b pb-2">
            {/* Payable Days */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payable Days</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">
                  {formData.presentDays !== undefined
                    ? formData.presentDays
                    : employee?.presentDays || 0}
                </span>
              </div>
            </div>

            {/* Past Days */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Arrears Days</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold">
                  {employee?.pastDays || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div>
          <div className="mb-2 grid grid-cols-3 gap-2 border-b pb-2">
            <h3 className="text-sm font-semibold text-green-600">
              (+) EARNINGS
            </h3>
            <span className="text-right text-sm font-medium">Basic</span>
            <span className="text-right text-sm font-medium">Current</span>
          </div>

          <div className="space-y-1">
            {employeeData
              .filter((item) => item.componentType?.toLowerCase() === "earning")
              .map((item) => (
                <div key={item.componentId}>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-sm font-medium">
                      {item.componentName}
                    </span>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-medium">
                        {formatNumber(item.basicAmount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-medium">
                        {formatNumber(item.amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            {employeeData.filter(
              (item) => item.componentType?.toLowerCase() === "earning"
            ).length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No earnings found
              </div>
            )}
          </div>
        </div>

        {/* Deductions Section */}
        <div>
          <div className="mb-2 grid grid-cols-3 gap-2 border-b pb-2">
            <h3 className="text-sm font-semibold text-red-600">
              (-) DEDUCTIONS
            </h3>
          </div>

          <div className="space-y-1">
            {employeeData
              .filter(
                (item) => item.componentType?.toLowerCase() === "deduction"
              )
              .map((item) => (
                <div key={item.componentId}>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-sm font-medium">
                      {item.componentName}
                    </span>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-medium">
                        {formatNumber(item.basicAmount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-sm font-medium">
                        {formatNumber(item.amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            {employeeData.filter(
              (item) => item.componentType?.toLowerCase() === "deduction"
            ).length === 0 && (
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium">Loan Amount</span>
                <div className="flex items-center justify-end space-x-2">
                  <span className="text-sm font-medium">{formatNumber(0)}</span>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <span className="text-sm font-medium">{formatNumber(0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Net Pay Summary */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-3 items-center gap-2">
            <span className="text-sm font-medium">NET PAY</span>
            <div className="flex items-center justify-end space-x-2">
              <span className="text-sm font-bold">
                <CurrencyFormatter amount={currentBasicNetPay} />
              </span>
            </div>
            <div className="flex items-center justify-end space-x-2">
              <span className="text-sm font-bold">
                <CurrencyFormatter amount={currentNetPay} />
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Disabled when payrun is approved */}
        <div className="space-y-3">
          <div className="flex space-x-3">
            {/* Download Payslip Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPayslip}
              disabled={employee?.status === "Approved"}
              className="flex-1 border-blue-500 text-muted-foreground hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 h-3 w-3" />
              Download
            </Button>

            {/* Send via WhatsApp Button */}
            <Button
              size="sm"
              onClick={handleSendWhatsAppPayslip}
              disabled={
                employee?.status === "Approved" ||
                // isSendingWhatsApp ||
                !employee?.phoneNo ||
                employee?.phoneNo?.trim() === ""
              }
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquare className="mr-2 h-3 w-3" />
              {/* {isSendingWhatsApp ? "Sending..." : "WhatsApp"} */}
              WhatsApp
            </Button>

            {/* Send via Email Button */}
            <Button
              size="sm"
              onClick={() => {
                console.log("📧 PayRunSummaryForm: Email button clicked")
                console.log(
                  "👤 PayRunSummaryForm: Employee for email:",
                  employee?.employeeName
                )
                toast.info("Email Sharing", {
                  description: "Opening email client to share payslip...",
                })
                // Open default email client
                const subject = `Payslip for ${employee?.employeeName}`
                const body = `Dear ${employee?.employeeName},\n\nPlease find attached your payslip.\n\nBest regards,\nHR Department`
                console.log(
                  "📧 PayRunSummaryForm: Opening email client with subject:",
                  subject
                )
                window.open(
                  `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                  "_blank"
                )
              }}
              disabled={employee?.status === "Approved"}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail className="mr-2 h-3 w-3" />
              Email
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
