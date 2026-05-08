"use client"

import React from "react"
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer"

// Define proper types for payslip data
interface PayslipEarning {
  componentName: string
  basicAmount: number
  currentAmount: number
}

interface PayslipDeduction {
  componentName: string
  basicAmount: number
  currentAmount: number
}

interface PayslipData {
  employeeName: string
  employeeId: string
  payPeriod: string
  companyName: string
  companyId: string
  companyLogo?: string
  address: string
  phoneNo: string
  email: string
  employeeCode: string
  designationName: string
  departmentName: string
  emailAdd: string
  workPermitNo: string
  personalNo: string
  iban: string
  presentDays: number
  pastDays: number
  bankName: string
  joinDate: string
  whatsUpPhoneNo: string
  earnings: PayslipEarning[]
  deductions: PayslipDeduction[]
  netPay: number
  basicNetPay: number
}

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 8,
    backgroundColor: "#ffffff",
  },

  // Company Header Section
  companyHeader: {
    marginTop: 30,
    marginBottom: 15,
    borderBottom: "2px solid #000000",
    paddingBottom: 10,
    alignItems: "center",
    textAlign: "center",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: "#000000",
  },
  companyDetails: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 5,
    color: "#000000",
  },

  // Payslip Title
  payslipTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#000000",
    textTransform: "uppercase",
  },

  // Pay Summary Section (Employee Details + Total Net Pay)
  employeeSummary: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },

  // Left side - Employee Details
  employeeDetails: {
    width: "65%",
    border: "1px solid #cccccc",
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  employeeDetailsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
    borderBottom: "1px solid #cccccc",
    paddingBottom: 5,
  },
  employeeRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  employeeLabel: {
    width: "40%",
    fontWeight: "bold",
    color: "#333333",
    fontSize: 8,
  },
  employeeValue: {
    width: "60%",
    color: "#000000",
    fontSize: 8,
  },

  // Right side - Total Net Pay Box
  totalNetPayBox: {
    width: "35%",
    border: "1px solid #000000",
    padding: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  totalNetPayTitle: {
    fontSize: 9,
    fontWeight: "normal",
    marginBottom: 4,
    color: "#000000",
    textAlign: "center",
    width: "100%",
  },
  totalNetPayAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
    textAlign: "center",
    width: "100%",
  },

  // Tables Container
  tablesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 20,
  },
  mainTableTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#000000",
    textTransform: "uppercase",
    borderBottom: "1px solid #cccccc",
    paddingBottom: 3,
  },

  // Earnings Table
  earningsSection: {
    width: "60%",
  },
  earningsTable: {
    border: "0.5px solid #cccccc",
  },
  earningsHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "0.5px solid #cccccc",
  },
  earningsHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    borderRight: "0.5px solid #cccccc",
  },
  earningsRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #cccccc",
  },
  earningsCell: {
    padding: 4,
    fontSize: 8,
    textAlign: "left",
    borderRight: "0.5px solid #cccccc",
  },
  earningsTotalRow: {
    flexDirection: "row",
  },
  earningsTotalCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "left",
    borderRight: "0.5px solid #cccccc",
  },

  // Deductions Table
  deductionsSection: {
    width: "40%",
  },
  deductionsTable: {
    border: "0.5px solid #cccccc",
  },
  deductionsHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "0.5px solid #cccccc",
  },
  deductionsHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "left",
    borderRight: "0.5px solid #cccccc",
  },
  deductionsRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #cccccc",
  },
  deductionsCell: {
    padding: 4,
    fontSize: 8,
    textAlign: "left",
    borderRight: "0.5px solid #cccccc",
  },
  deductionsTotalRow: {
    flexDirection: "row",
  },
  deductionsTotalCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "left",
    borderRight: "0.5px solid #cccccc",
  },

  // Leave Summary Table
  leaveSummaryTable: {
    border: "1px solid #cccccc",
    marginTop: 44,
    backgroundColor: "#f9f9f9",
  },
  leaveSummaryHeader: {
    padding: 6,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#000000",
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottom: "1px solid #cccccc",
  },
  leaveSummaryHeaderCell: {
    padding: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "left",
    borderRight: "1px solid #cccccc",
  },
  leaveSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  leaveSummaryCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
    padding: 6,
    textAlign: "left",
    borderRight: "1px solid #cccccc",
  },
  leaveSummaryLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#333333",
    paddingLeft: 6,
  },
  leaveSummaryValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
    paddingRight: 6,
  },

  // Net Pay Summary
  netPaySummary: {
    border: "1px solid #cccccc",
    padding: 8,
    backgroundColor: "#f9f9f9",
    alignSelf: "flex-end",
    width: "40%",
  },
  netPaySummaryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#000000",
  },
  netPaySummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  netPaySummaryLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#333333",
  },
  netPaySummaryValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },

  // Footer
  footer: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 10,
    borderTop: "1px solid #cccccc",
    paddingTop: 10,
    marginTop: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    width: "20%",
  },
  logo: {
    width: "100%",
    height: "auto",
    maxHeight: 60,
  },
  gap: {
    width: "5%",
  },
  companyInfo: {
    width: "75%",
  },
})

export const getBaseUrl = () => {
  // Browser environment - get URL from window.location
  if (typeof window !== "undefined") {
    // Get the current origin (protocol + hostname + port)
    return window.location.origin
  }

  // Server-side rendering
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // Vercel production
  return `http://localhost:${process.env.PORT ?? 4000}` // Local development
}

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AED",
  }).format(amount)
}

// Helper function to format numbers without currency symbol
const formatNumber = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Helper function to calculate totals
const calculateTotals = (data: PayslipData) => {
  const currentAmountsSum = data.earnings.reduce(
    (acc: number, item: PayslipEarning) => acc + (item.currentAmount || 0),
    0
  )
  const totalDeductions = data.deductions.reduce(
    (acc: number, item: PayslipDeduction) => acc + (item.currentAmount || 0),
    0
  )
  const netPay = currentAmountsSum - totalDeductions
  return { currentAmountsSum, totalDeductions, netPay }
}

interface PayslipTemplateProps {
  data: PayslipData
}

const PayslipTemplate: React.FC<PayslipTemplateProps> = ({ data }) => {
  const { currentAmountsSum, totalDeductions, netPay } = calculateTotals(data)

  // Show all earnings without filtering
  const earningsToShow = data.earnings

  // Default earnings if none are present
  const defaultEarnings: PayslipEarning[] =
    earningsToShow.length === 0
      ? [
          { componentName: "Basic Salary", basicAmount: 0, currentAmount: 0 },
          {
            componentName: "House Rent Allowance",
            basicAmount: 0,
            currentAmount: 0,
          },
          {
            componentName: "Food & Conveyance Allowance",
            basicAmount: 0,
            currentAmount: 0,
          },
          {
            componentName: "Other Allowances",
            basicAmount: 0,
            currentAmount: 0,
          },
          { componentName: "Bonus", basicAmount: 0, currentAmount: 0 },
          { componentName: "Leave Pay", basicAmount: 0, currentAmount: 0 },
          { componentName: "Ticket Pay", basicAmount: 0, currentAmount: 0 },
          {
            componentName: "Indemnity / Gratuity",
            basicAmount: 0,
            currentAmount: 0,
          },
          { componentName: "Other", basicAmount: 0, currentAmount: 0 },
        ]
      : []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.companyHeader}>
          <View style={styles.headerRow}>
            {data.companyId && (
              <View style={styles.logoContainer}>
                {/* react-pdf Image component does not support HTML alt; suppress jsx-a11y false positive */}
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image
                  style={styles.logo}
                  src={`${getBaseUrl()}/uploads/companies/${data.companyId}.png`}
                />
              </View>
            )}
            <View style={styles.gap} />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{data.companyName}</Text>
              <Text style={styles.companyDetails}>
                {data.address} | {data.phoneNo} | {data.email}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.payslipTitle}>
          Payslip for the month of {data.payPeriod}
        </Text>

        {/* Employee Information */}
        <View style={styles.employeeSummary}>
          <View style={styles.employeeDetails}>
            <Text style={styles.employeeDetailsTitle}>Employee Details</Text>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>Employee Name</Text>
              <Text style={[styles.employeeValue, { fontWeight: "bold" }]}>
                : {data.employeeName}
              </Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>Employee Code</Text>
              <Text style={styles.employeeValue}>: {data.employeeCode}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>Designation</Text>
              <Text style={styles.employeeValue}>: {data.designationName}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>Department</Text>
              <Text style={styles.employeeValue}>: {data.departmentName}</Text>
            </View>

            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>Work Permit No</Text>
              <Text style={styles.employeeValue}>: {data.workPermitNo}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>MOL ID</Text>
              <Text style={styles.employeeValue}>: {data.personalNo}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>Bank Name</Text>
              <Text style={styles.employeeValue}>: {data.bankName}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>IBAN</Text>
              <Text style={styles.employeeValue}>: {data.iban}</Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>Date of Joining</Text>
              <Text style={styles.employeeValue}>
                : {formatDate(data.joinDate)}
              </Text>
            </View>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeLabel}>WhatsApp No</Text>
              <Text style={styles.employeeValue}>: {data.whatsUpPhoneNo}</Text>
            </View>
          </View>
          <View style={styles.totalNetPayBox}>
            <Text style={styles.totalNetPayTitle}>Total Net Pay</Text>
            <Text style={styles.totalNetPayAmount}>
              {formatCurrency(netPay)}
            </Text>
            <Text style={styles.totalNetPayTitle}>
              Paid Days: {data.presentDays} | LOP Days: {30 - data.presentDays}
            </Text>
          </View>
        </View>

        <Text style={styles.mainTableTitle}>Pay Summary</Text>

        {/* Tables Container - Side by Side */}
        <View style={styles.tablesContainer}>
          {/* Earnings Table */}
          <View style={styles.earningsSection}>
            <View style={styles.earningsTable}>
              <View style={styles.earningsHeader}>
                <Text
                  style={[
                    styles.earningsHeaderCell,
                    { width: "50%", textAlign: "center" },
                  ]}
                >
                  Earnings
                </Text>
                <Text
                  style={[
                    styles.earningsHeaderCell,
                    { width: "25%", textAlign: "center" },
                  ]}
                >
                  Fixed
                </Text>
                <Text
                  style={[
                    styles.earningsHeaderCell,
                    { width: "25%", textAlign: "center" },
                  ]}
                >
                  Current
                </Text>
              </View>
              {[...earningsToShow, ...defaultEarnings].map(
                (earning: PayslipEarning, index: number) => (
                  <View style={styles.earningsRow} key={index}>
                    <Text style={[styles.earningsCell, { width: "50%" }]}>
                      {earning.componentName}
                    </Text>
                    <Text
                      style={[
                        styles.earningsCell,
                        { width: "25%", textAlign: "right" },
                      ]}
                    >
                      {formatNumber(earning.basicAmount)}
                    </Text>
                    <Text
                      style={[
                        styles.earningsCell,
                        { width: "25%", textAlign: "right" },
                      ]}
                    >
                      {formatNumber(earning.currentAmount)}
                    </Text>
                  </View>
                )
              )}
              <View style={styles.earningsTotalRow}>
                <Text style={[styles.earningsTotalCell, { width: "50%" }]}>
                  Gross Earnings:
                </Text>
                <Text
                  style={[
                    styles.earningsTotalCell,
                    { width: "25%", textAlign: "right" },
                  ]}
                >
                  {formatCurrency(
                    data.earnings.reduce(
                      (sum, item) => sum + (item.basicAmount || 0),
                      0
                    )
                  )}
                </Text>
                <Text
                  style={[
                    styles.earningsTotalCell,
                    { width: "25%", textAlign: "right" },
                  ]}
                >
                  {formatCurrency(currentAmountsSum)}
                </Text>
              </View>
            </View>
          </View>

          {/* Deductions Table */}
          <View style={styles.deductionsSection}>
            <View style={styles.deductionsTable}>
              <View style={styles.deductionsHeader}>
                <Text
                  style={[
                    styles.deductionsHeaderCell,
                    { width: "75%" },
                    { textAlign: "center" },
                  ]}
                >
                  Deductions
                </Text>
                <Text
                  style={[
                    styles.deductionsHeaderCell,
                    { width: "25%", textAlign: "center" },
                  ]}
                >
                  Amount
                </Text>
              </View>
              {data.deductions.length === 0 ? (
                <>
                  <View style={styles.deductionsRow}>
                    <Text style={[styles.deductionsCell, { width: "75%" }]}>
                      Loan
                    </Text>
                    <Text
                      style={[
                        styles.deductionsCell,
                        { width: "25%", textAlign: "right" },
                      ]}
                    >
                      {formatNumber(0)}
                    </Text>
                  </View>
                  <View style={styles.deductionsRow}>
                    <Text style={[styles.deductionsCell, { width: "75%" }]}>
                      Other
                    </Text>
                    <Text
                      style={[
                        styles.deductionsCell,
                        { width: "25%", textAlign: "right" },
                      ]}
                    >
                      {formatNumber(0)}
                    </Text>
                  </View>

                  <View style={styles.deductionsRow}>
                    <Text style={[styles.deductionsCell, { width: "75%" }]}>
                      Fine
                    </Text>
                    <Text
                      style={[
                        styles.deductionsCell,
                        { width: "25%", textAlign: "right" },
                      ]}
                    >
                      {formatNumber(0)}
                    </Text>
                  </View>
                  <View style={styles.deductionsRow}>
                    <Text style={[styles.deductionsCell, { width: "75%" }]}>
                      Advance Salary
                    </Text>
                    <Text
                      style={[
                        styles.deductionsCell,
                        { width: "25%", textAlign: "right" },
                      ]}
                    >
                      {formatNumber(0)}
                    </Text>
                  </View>
                </>
              ) : (
                data.deductions.map(
                  (deduction: PayslipDeduction, index: number) => (
                    <View style={styles.deductionsRow} key={index}>
                      <Text style={[styles.deductionsCell, { width: "75%" }]}>
                        {deduction.componentName}
                      </Text>
                      <Text
                        style={[
                          styles.deductionsCell,
                          { width: "25%", textAlign: "right" },
                        ]}
                      >
                        {formatNumber(deduction.currentAmount)}
                      </Text>
                    </View>
                  )
                )
              )}
              <View style={styles.deductionsTotalRow}>
                <Text style={[styles.deductionsTotalCell, { width: "75%" }]}>
                  Total Deductions:
                </Text>
                <Text
                  style={[
                    styles.deductionsTotalCell,
                    { width: "25%", textAlign: "right" },
                  ]}
                >
                  {formatCurrency(totalDeductions)}
                </Text>
              </View>
            </View>

            {/* Net Pay Summary */}
            <View style={styles.leaveSummaryTable}>
              <Text style={styles.leaveSummaryHeader}>Net Pay Summary</Text>

              <View style={styles.leaveSummaryRow}>
                <Text style={styles.leaveSummaryLabel}>Gross Earnings</Text>
                <Text style={styles.leaveSummaryValue}>
                  {formatCurrency(currentAmountsSum)}
                </Text>
              </View>
              <View style={styles.leaveSummaryRow}>
                <Text style={styles.leaveSummaryLabel}>Total Deductions</Text>
                <Text style={styles.leaveSummaryValue}>
                  (-) {formatCurrency(totalDeductions)}
                </Text>
              </View>
              <View style={styles.leaveSummaryRow}>
                <Text style={styles.leaveSummaryLabel}>Net Pay</Text>
                <Text style={styles.leaveSummaryValue}>
                  {formatCurrency(netPay)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Note : This is a computer generated payslip and does not require a
          signature.
        </Text>
      </Page>
    </Document>
  )
}

/**
 * Generate payslip PDF as a Blob
 * @param data - Payslip data
 * @returns Promise<Blob> - PDF as a Blob
 */
export const generatePayslipPDF = async (data: PayslipData): Promise<Blob> => {
  try {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      throw new Error("PDF generation is only available in the browser")
    }

    // Validate required data
    if (!data.employeeName || !data.payPeriod) {
      throw new Error("Missing required employee data (name or pay period)")
    }

    if (!data.earnings || data.earnings.length === 0) {
      console.warn("No earnings data provided, using defaults")
    }

    const stream = await pdf(<PayslipTemplate data={data} />).toBlob()
    return stream
  } catch (error) {
    console.error("Error generating payslip PDF:", error)
    throw new Error("Failed to generate payslip PDF")
  }
}

/**
 * Download payslip PDF directly
 * @param data - Payslip data
 * @param filename - Optional filename
 */
export const downloadPayslipPDF = async (
  data: PayslipData,
  filename?: string
): Promise<void> => {
  console.log("📥 PayslipTemplate: downloadPayslipPDF called with data:", data)
  try {
    const pdfBlob = await generatePayslipPDF(data)

    // Create download link
    const url = URL.createObjectURL(pdfBlob)

    const link = document.createElement("a")
    link.href = url
    link.download =
      filename || `payslip-${data.employeeName}-${data.payPeriod}.pdf`

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Cleanup
    URL.revokeObjectURL(url)
    console.log("✅ PayslipTemplate: Download triggered successfully")
  } catch (error) {
    console.log("❌ PayslipTemplate: Download error:", error)
    console.error("Error downloading payslip PDF:", error)
    throw new Error("Failed to download payslip PDF")
  }
}

/**
 * Get PDF as base64 for email attachments
 * @param data - Payslip data
 * @returns Promise<string> - PDF as base64
 */
export const getPayslipPDFAsBase64 = async (
  data: PayslipData
): Promise<string> => {
  try {
    const pdfBlob = await generatePayslipPDF(data)

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(",")[1] // Remove data:application/pdf;base64, prefix
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(pdfBlob)
    })
  } catch (error) {
    console.error("Error converting to base64:", error)
    throw new Error("Failed to convert PDF to base64")
  }
}

/**
 * Get PDF as array buffer for WhatsApp API
 * @param data - Payslip data
 * @returns Promise<ArrayBuffer> - PDF as array buffer
 */
export const getPayslipPDFAsArrayBuffer = async (
  data: PayslipData
): Promise<ArrayBuffer> => {
  try {
    const pdfBlob = await generatePayslipPDF(data)
    return await pdfBlob.arrayBuffer()
  } catch (error) {
    console.error("Error converting to array buffer:", error)
    throw new Error("Failed to convert PDF to array buffer")
  }
}

export default PayslipTemplate
