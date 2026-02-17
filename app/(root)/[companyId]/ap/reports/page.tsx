"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { format, parse } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

import { formatDateForApi } from "@/lib/date-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  CompanySupplierAutocomplete,
  CurrencyAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"

interface IReportFormData extends Record<string, unknown> {
  supplierId: string
  currencyId: string
  fromDate: string
  toDate: string
  asOfDate: string
  useTrsDate: boolean
  useAsDate: boolean
  reportType: number
}

interface IReportParameters {
  companyId: number
  companyName: string | null
  fromDate: string | null
  toDate: string | null
  asOfDate: string | null
  supplierId: number | null
  currencyId: number
  reportType: number
  amtDec: number
  locAmtDec: number
}

interface IReport {
  id: string
  name: string
  category: string
  reportFile: string
  reportType?: number
}

// Reports that use TrsDate (From/To Date)
const TRS_DATE_REPORTS = [
  "supplier-ledger",
  "purchases-transaction",
  "pending-for-invoicing",
  "launch-invoice",
  "gross-purchases",
]

// Reports that use AsDate only (single date)
const AS_DATE_REPORTS = [
  "ap-aging-details",
  "ap-aging-summary",
  "ap-outstanding-details",
  "ap-outstanding-summary",
  "statement-of-account",
]

const REPORT_CATEGORIES = [
  {
    name: "Aging",
    reports: [
      {
        id: "ap-aging-details",
        name: "AP Aging Details",
        reportFile: "ap/ApAgingDetails.trdp",
        reportType: 2,
      },
      {
        id: "ap-aging-summary",
        name: "AP Aging Summary",
        reportFile: "ap/ApAgingSummary.trdp",
        reportType: 3,
      },
    ],
  },
  {
    name: "AP",
    reports: [
      {
        id: "ap-outstanding-details",
        name: "AP Outstanding Details",
        reportFile: "ap/ApOutstandingDetails.trdp",
        reportType: 1,
      },
      {
        id: "ap-outstanding-summary",
        name: "AP Outstanding Summary",
        reportFile: "ap/ApOutstandingSummary.trdp",
        reportType: 1,
      },
      {
        id: "ap-subsequent-receipt",
        name: "AP Subsequent Payment",
        reportFile: "ap/ApSubsequentPayment.trdp",
        reportType: 0,
      },
      {
        id: "statement-of-account",
        name: "Statement Of Account",
        reportFile: "ap/ApStatementOfAccount.trdp",
        reportType: 2,
      },
      {
        id: "monthly-payable",
        name: "Monthly Payable",
        reportFile: "ap/ApMonthlyPayable.trdp",
        reportType: 0,
      },
      {
        id: "supplier-ledger",
        name: "Supplier Ledger",
        reportFile: "ap/ApSupplierLedger.trdp",
        reportType: 0,
      },
      {
        id: "supplier-invoice-receipt",
        name: "Supplier Invoice/Payment",
        reportFile: "ap/ApSupplierInvoicePayment.trdp",
        reportType: 0,
      },
      {
        id: "purchases-transaction",
        name: "Purchase Transaction",
        reportFile: "ap/ApPurchaseTransaction.trdp",
        reportType: 2,
      },
      {
        id: "invoice-register",
        name: "Invoice Register",
        reportFile: "ap/ApInvoiceRegister.trdp",
        reportType: 1,
      },
      {
        id: "gross-purchases",
        name: "Gross Purchase",
        reportFile: "ap/ApGrossPurchase.trdp",
      },
    ],
  },
]

export default function ReportsPage() {
  const params = useParams()
  const companyId = Number(params.companyId)
  const { decimals, companies, user } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const companyName: string | null =
    companies.find((company) => company.companyId === companyId.toString())
      ?.companyName || null
  // Use the same date format logic as CustomDateNew
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const [selectedReports, setSelectedReports] = useState<string[]>([])

  // Get current date formatted
  const getCurrentDate = () => {
    return format(new Date(), dateFormat)
  }

  const form = useForm<IReportFormData>({
    defaultValues: {
      supplierId: "",
      currencyId: "0",
      fromDate: getCurrentDate(),
      toDate: getCurrentDate(),
      asOfDate: getCurrentDate(),
      useTrsDate: true,
      useAsDate: false,
      reportType: 0,
    },
  })

  // Handle fromDate change and automatically set toDate to current date
  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      const formattedFromDate = format(date, dateFormat)
      form.setValue("fromDate", formattedFromDate)

      // Set toDate to current date when fromDate changes
      const currentDate = getCurrentDate()
      form.setValue("toDate", currentDate)

      // Also update asOfDate if it's in use
      if (form.watch("useAsDate")) {
        form.setValue("asOfDate", currentDate)
      }
    }
  }

  // Handle asOfDate change and automatically set toDate to the same value
  // Also validate that fromDate is not greater than asOfDate
  const handleAsDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = format(date, dateFormat)
      const fromDateValue = form.getValues("fromDate")

      // If fromDate exists, compare dates
      if (fromDateValue) {
        try {
          // Parse both dates using the same format for comparison
          const fromDateParsed = parse(fromDateValue, dateFormat, new Date())
          const asOfDateParsed = date

          // If fromDate is greater than asOfDate, set fromDate equal to asOfDate
          if (fromDateParsed > asOfDateParsed) {
            // Set fromDate to be the same as asOfDate
            form.setValue("fromDate", formattedDate)
          }
        } catch (error) {
          // If parsing fails, proceed with normal logic
          console.error("Error parsing dates for comparison:", error)
        }
      }

      // Set asOfDate and toDate to the same value
      form.setValue("asOfDate", formattedDate)
      form.setValue("toDate", formattedDate)
    }
  }

  // Handle toDate change and automatically set asOfDate to the same value
  // Also validate that toDate is not less than fromDate
  const handleToDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = format(date, dateFormat)
      const fromDateValue = form.getValues("fromDate")

      // If fromDate exists, compare dates
      if (fromDateValue) {
        try {
          // Parse both dates using the same format for comparison
          const fromDateParsed = parse(fromDateValue, dateFormat, new Date())
          const toDateParsed = date

          // If toDate is less than fromDate, set toDate equal to fromDate
          if (toDateParsed < fromDateParsed) {
            // Set toDate to be the same as fromDate
            form.setValue("toDate", fromDateValue)
            form.setValue("asOfDate", fromDateValue)
            return
          }
        } catch (error) {
          // If parsing fails, proceed with normal logic
          console.error("Error parsing dates for comparison:", error)
        }
      }

      // Normal case: toDate is valid (greater than or equal to fromDate)
      form.setValue("toDate", formattedDate)
      form.setValue("asOfDate", formattedDate)
    }
  }

  const getAllReports = (): IReport[] => {
    return REPORT_CATEGORIES.flatMap((category) =>
      category.reports.map((report) => ({
        ...report,
        category: category.name,
      }))
    )
  }

  // Update date selection and reportType based on selected report
  useEffect(() => {
    if (selectedReports.length > 0) {
      const selectedReportId = selectedReports[0]
      const usesTrsDate = TRS_DATE_REPORTS.includes(selectedReportId)
      const usesAsDate = AS_DATE_REPORTS.includes(selectedReportId)
      const allReports = getAllReports()
      const selectedReport = allReports.find((r) => r.id === selectedReportId)

      if (usesTrsDate) {
        // Set TrsDate to true and disable AsDate
        form.setValue("useTrsDate", true)
        form.setValue("useAsDate", false)
      } else if (usesAsDate) {
        // Set AsDate to true and disable TrsDate
        form.setValue("useTrsDate", false)
        form.setValue("useAsDate", true)
      } else {
        // Default behavior - allow user selection
        // Don't force either option if not in either array
      }

      // Set reportType from the selected report
      if (selectedReport?.reportType !== undefined) {
        form.setValue("reportType", selectedReport.reportType)
      }
    }
  }, [selectedReports, form])

  const handleReportToggle = (reportId: string) => {
    setSelectedReports((prev) => (prev.includes(reportId) ? [] : [reportId]))
  }

  const getSelectedReportObjects = (): IReport[] => {
    const allReports = getAllReports()
    return allReports.filter((report) => selectedReports.includes(report.id))
  }

  const buildReportParameters = (
    data: IReportFormData,
    report?: IReport
  ): IReportParameters => {
    const reportType = report?.reportType ?? data.reportType ?? 0

    // Format all dates to yyyy-MM-dd format using formatDateForApi
    const formattedFromDate = formatDateForApi(data.fromDate)
    const formattedToDate = formatDateForApi(data.toDate)
    const formattedAsOfDate = formatDateForApi(
      data.asOfDate || getCurrentDate()
    )

    return {
      companyId,
      companyName: companyName || "",
      supplierId: data.supplierId ? Number(data.supplierId) : 0,
      currencyId: data.currencyId ? Number(data.currencyId) : 0,
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      asOfDate: formattedAsOfDate,
      reportType: reportType,
      amtDec: amtDec || 2,
      locAmtDec: locAmtDec || 2,
    }
  }

  const handleViewReport = (data: IReportFormData) => {
    const selectedReportObjects = getSelectedReportObjects()
    if (selectedReportObjects.length === 0) {
      return
    }

    const report = selectedReportObjects[0] // Only one report can be selected
    const parameters = buildReportParameters(data, report)

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "")

    const reportParams = {
      companyId: parameters.companyId,
      companyName: parameters.companyName,
      fromDate: parameters.fromDate,
      toDate: parameters.toDate,
      asOfDate: parameters.asOfDate,
      supplierId: parameters.supplierId,
      currencyId: parameters.currencyId,
      reportType: parameters.reportType,
      amtDec: parameters.amtDec,
      locAmtDec: parameters.locAmtDec,
      userName: user?.userName || "",
      userId: user?.userId || "0",
      url: baseUrl,
    }

    // Store report data in sessionStorage (clean URL approach - same pattern as transaction print)
    const reportData = {
      reportFile: report.reportFile,
      parameters: reportParams,
    }

    try {
      // Use a fixed key per company - will be overwritten each time a new report is opened
      // This matches the key used by `/[companyId]/reports/window`
      sessionStorage.setItem(
        `report_window_${companyId}`,
        JSON.stringify(reportData)
      )

      // Open in a new window (not tab) with specific features
      const windowFeatures =
        "width=1200,height=800,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes"
      const viewerUrl = `/${companyId}/reports/window`
      window.open(viewerUrl, "_blank", windowFeatures)
    } catch (error) {
      console.error("Error storing report data:", error)

      // Fallback to URL parameters using the legacy viewer if sessionStorage fails
      window.open(
        `/${companyId}/reports/viewer?report=${encodeURIComponent(
          report.reportFile
        )}&params=${encodeURIComponent(JSON.stringify(reportParams))}`,
        "_blank"
      )
    }
  }

  const handleClear = () => {
    const currentDate = getCurrentDate()
    form.reset({
      supplierId: "",
      fromDate: currentDate,
      toDate: currentDate,
      asOfDate: currentDate,
      currencyId: "0",
      useTrsDate: true,
      useAsDate: false,
      reportType: 0,
    })
    setSelectedReports([])
  }

  // Check if selected report requires TrsDate (fromDate/toDate only)
  const requiresTrsDate =
    selectedReports.length > 0 && TRS_DATE_REPORTS.includes(selectedReports[0])

  // Check if selected report requires AsDate (asOfDate only)
  const requiresAsDate =
    selectedReports.length > 0 && AS_DATE_REPORTS.includes(selectedReports[0])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            AP Reports
          </h1>
          <p className="text-muted-foreground text-xs">
            Select reports and configure parameters to generate AP reports
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Report Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-6 pr-4">
                {REPORT_CATEGORIES.map((category) => (
                  <div key={category.name} className="space-y-3">
                    <h3 className="text-foreground text-sm font-medium">
                      {category.name}
                    </h3>
                    <div className="space-y-2">
                      {category.reports.map((report) => (
                        <div
                          key={report.id}
                          className="hover:bg-muted flex cursor-pointer items-center space-x-2 rounded-md p-2 transition-colors"
                        >
                          <Checkbox
                            checked={selectedReports.includes(report.id)}
                            onCheckedChange={() => {
                              handleReportToggle(report.id)
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          />
                          <label
                            className="flex-1 cursor-pointer text-sm font-normal"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleReportToggle(report.id)
                            }}
                          >
                            {report.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Report Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Report Parameters
              {selectedReports.length > 0 && (
                <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium">
                  {getSelectedReportObjects()[0]?.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(handleViewReport)}
                className="space-y-4"
              >
                {/* Supplier */}
                <CompanySupplierAutocomplete
                  form={form}
                  name="supplierId"
                  label="Supplier"
                  companyId={companyId}
                  isRequired={false}
                />

                {/* Currency */}
                <CurrencyAutocomplete
                  form={form}
                  name="currencyId"
                  label="Currency"
                  isRequired={true}
                />

                {/* Date Selection Checkboxes */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="useTrsDate"
                      checked={form.watch("useTrsDate")}
                      disabled={requiresTrsDate || requiresAsDate}
                      onCheckedChange={(checked) => {
                        if (!requiresTrsDate && !requiresAsDate) {
                          const isChecked = checked as boolean
                          form.setValue("useTrsDate", isChecked)
                          if (isChecked) {
                            form.setValue("useAsDate", false)
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="useTrsDate"
                      className={`text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        (requiresTrsDate || requiresAsDate) &&
                        "cursor-not-allowed opacity-50"
                      }`}
                    >
                      Trs Date:
                    </label>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="useAsDate"
                      checked={form.watch("useAsDate")}
                      disabled={requiresTrsDate}
                      onCheckedChange={(checked) => {
                        if (!requiresTrsDate) {
                          const isChecked = checked as boolean
                          form.setValue("useAsDate", isChecked)
                          if (isChecked) {
                            form.setValue("useTrsDate", false)
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="useAsDate"
                      className={`text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        requiresTrsDate && "cursor-not-allowed opacity-50"
                      }`}
                    >
                      As Date:
                    </label>
                  </div>
                </div>

                {/* Date Range - Show From/To Date for TrsDate reports */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CustomDateNew
                    form={form}
                    name="fromDate"
                    label="From Date:"
                    isRequired={false}
                    isDisabled={form.watch("useAsDate") || requiresAsDate}
                    onChangeEvent={handleFromDateChange}
                  />
                  <CustomDateNew
                    form={form}
                    name="toDate"
                    label="To Date:"
                    isRequired={false}
                    isDisabled={form.watch("useAsDate") || requiresAsDate}
                    isFutureShow={true}
                    onChangeEvent={handleToDateChange}
                  />
                </div>

                {/* As Date - Show only for non-TrsDate reports */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CustomDateNew
                    form={form}
                    name="asOfDate"
                    label="As Date:"
                    isRequired={false}
                    isDisabled={form.watch("useTrsDate") || requiresTrsDate}
                    onChangeEvent={handleAsDateChange}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={selectedReports.length === 0}
                    className="flex-1"
                  >
                    View Report
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
