"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { IChartOfAccountLookup } from "@/interfaces/lookup"
import { useAuthStore } from "@/stores/auth-store"
import { IconCopy, IconEye, IconX } from "@tabler/icons-react"
import { addMonths, format, startOfMonth, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"

import { formatDateForApi } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  ChartOfAccountAutocomplete,
  CurrencyAutocomplete,
  DepartmentAutocomplete,
  GSTAutocomplete,
  PaymentTypeAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import ChartOfAccountMultiSelect from "@/components/multiselection-chartofaccount"

interface IReportFormData extends Record<string, unknown> {
  fromGlId: string
  toGlId: string
  glIds: number[]
  sameToGl: boolean
  departmentId: string
  fromDate: string
  toDate: string
  asOfDate: string
  currencyId: string
  useTrsDate: boolean
  useAsDate: boolean
  reportType: number
  vatType: string
  vatId: string
}

interface IReportParameters {
  companyId: number
  fromGlId: number | null
  toGlId: number | null
  glIds: number[]
  departmentId: number | null
  paymentTypeId: number | null
  fromDate: string | null
  toDate: string | null
  asOfDate: string | null
  currencyId: number
  reportType: number
  vatType: string
  vatId: number | null
}

interface IReport {
  id: string
  name: string
  category: string
  reportFile?: string
  reportType?: string
  supportsReportType?: boolean
  defaultReportType?: number
}

// Reports that use TrsDate (From/To Date)
// Note: GL reports typically use TrsDate for date range reports
// Reports without TrsDate use AsDate (single date)
const TRS_DATE_REPORTS: string[] = [
  // Add report IDs here if specific reports require TrsDate
  // For now, all GL reports can use either TrsDate or AsDate based on user selection
]

const REPORT_CATEGORIES = [
  {
    name: "Financial Report",
    reports: [
      {
        id: "trial-balance",
        name: "Trial Balance",
        supportsReportType: true, // This report supports reportType selection
      },
      {
        id: "balance-sheet",
        name: "Balance Sheet",
        supportsReportType: true,
      },
      {
        id: "profit-loss",
        name: "Profit & Loss Account",
        supportsReportType: true,
      },
    ],
  },
  {
    name: "VAT & Activities",
    reports: [
      {
        id: "gl-ledger",
        name: "GLLedger",
        reportFile: "gl/Ledger.trdp",
        supportsReportType: false,
      },
      {
        id: "combined-vat-computation",
        name: "Combined VAT Computation",
        reportFile: "gl/CombinedGstComputation.trdp",
        supportsReportType: false,
      },
      {
        id: "vat-authority",
        name: "VAT Authority",
        reportFile: "gl/GstAuthority.trdp",
        supportsReportType: false,
      },
      {
        id: "vat",
        name: "VAT",
        supportsReportType: true,
        defaultReportType: 0, // Default to Summary
      },
    ],
  },
]

// Mapping function to get reportFile based on reportId and reportType
const getReportFile = (reportId: string, reportType: number): string | null => {
  // Trial Balance mappings
  if (reportId === "trial-balance") {
    switch (reportType) {
      case 0: // Summary
        return "gl/TrialBalance.trdp"
      case 2: // OB/CB
        return "gl/TrialBalanceSummary.trdp"
      case 3: // D/C - Year
        return "gl/TrialBalanceDebitCredit.trdp"
      default:
        return "gl/TrialBalance.trdp"
    }
  }

  // Balance Sheet mappings
  if (reportId === "balance-sheet") {
    switch (reportType) {
      case 0: // Summary
        return "gl/BalanceSheetSummary.trdp"
      case 1: // Details
        return "gl/BalanceSheetDetails.trdp"
      default:
        return "gl/BalanceSheetSummary.trdp"
    }
  }

  // Profit & Loss Account mappings
  if (reportId === "profit-loss") {
    switch (reportType) {
      case 0: // Summary
        return "gl/ProfitLossSummary.trdp"
      case 1: // Details
        return "gl/ProfitLossDetails.trdp"
      default:
        return "gl/ProfitLossSummary.trdp"
    }
  }

  // VAT reports that don't support reportType
  const vatCategory = REPORT_CATEGORIES[1]
  const vatReport = vatCategory.reports.find((r) => r.id === reportId)
  if (vatReport) {
    const vatReportWithFile = vatReport as {
      id: string
      name: string
      reportFile?: string
      supportsReportType?: boolean
      defaultReportType?: number
    }
    if (!vatReportWithFile.supportsReportType && vatReportWithFile.reportFile) {
      return vatReportWithFile.reportFile
    }
  }

  // VAT report mappings
  if (reportId === "vat") {
    switch (reportType) {
      case 0: // Summary
        return "gl/GstSummary.trdp"
      case 1: // Details
        return "gl/GstDetails.trdp"
      default:
        return "gl/GstSummary.trdp"
    }
  }

  return null
}

// Get the reportType value to send to API based on reportId and selected reportType
const getReportTypeForApi = (reportId: string, reportType: number): number => {
  // Trial Balance: Summary=0, OB/CB=2, D/C-Year=2
  if (reportId === "trial-balance") {
    if (reportType === 0) return 0 // Summary
    if (reportType === 2) return 2 // OB/CB
    if (reportType === 3) return 2 // D/C - Year
  }

  // Balance Sheet and Profit & Loss: Summary=0, Details=2
  if (reportId === "balance-sheet" || reportId === "profit-loss") {
    if (reportType === 0) return 0 // Summary
    if (reportType === 1) return 2 // Details
  }

  // VAT report
  if (reportId === "vat") {
    if (reportType === 0) return 0 // Summary
    if (reportType === 1) return 1 // Details
  }

  return reportType
}

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

  // Get date 2 months ago formatted, starting from the 1st day of that month
  const getTwoMonthsAgoDate = () => {
    const twoMonthsAgo = subMonths(new Date(), 2)
    const firstDayOfMonth = startOfMonth(twoMonthsAgo)
    return format(firstDayOfMonth, dateFormat)
  }

  const form = useForm<IReportFormData>({
    defaultValues: {
      fromGlId: "",
      toGlId: "",
      sameToGl: false,
      glIds: [],
      departmentId: "",
      fromDate: getTwoMonthsAgoDate(),
      toDate: getCurrentDate(),
      asOfDate: getCurrentDate(),
      currencyId: "0",
      useTrsDate: true,
      useAsDate: false,
      reportType: 0,
      vatType: "",
      vatId: "",
    },
  })

  // Handle fromDate change and automatically set toDate to 2 months later
  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      const twoMonthsLater = addMonths(date, 2)
      const formattedToDate = format(twoMonthsLater, dateFormat)
      form.setValue("toDate", formattedToDate)
    }
  }

  // Handle fromGlId change and set toGlId if sameToGl is checked
  const handleFromGlChange = (gl: { glId: number } | null) => {
    // If fromGlId is cleared, also clear sameToGl and toGlId
    if (!gl) {
      form.setValue("sameToGl", false)
      form.setValue("toGlId", "")
    } else {
      // If sameToGl is checked, copy to toGlId
      if (form.watch("sameToGl")) {
        form.setValue("toGlId", gl.glId.toString())
      }
      // Clear multi-select if range is being used
      const glIds = form.watch("glIds")
      if (Array.isArray(glIds) && glIds.length > 0) {
        form.setValue("glIds", [])
      }
    }
  }

  // Handle copy button click - toggle copy/uncopy fromGlId to toGlId
  const handleCopyToGl = () => {
    const fromGlId = form.watch("fromGlId")
    const sameToGl = form.watch("sameToGl")

    if (fromGlId) {
      if (sameToGl) {
        // Uncopy: clear toGlId and reset sameToGl
        form.setValue("toGlId", "")
        form.setValue("sameToGl", false)
      } else {
        // Copy: set toGlId to fromGlId
        form.setValue("toGlId", fromGlId)
        form.setValue("sameToGl", true)
      }
    }
  }

  // Handle toGlId change - clear multi-select if range is being used
  const handleToGlChange = (gl: { glId: number } | null) => {
    const glIds = form.watch("glIds")
    if (gl && Array.isArray(glIds) && glIds.length > 0) {
      form.setValue("glIds", [])
    }
  }

  // Handle glIds (multi-select) change - clear range if multi-select is being used
  const handleGlIdsChange = (selectedAccounts: IChartOfAccountLookup[]) => {
    const hasSelection =
      Array.isArray(selectedAccounts) && selectedAccounts.length > 0
    if (hasSelection) {
      // Clear range fields if multi-select has values
      const fromGlId = form.watch("fromGlId")
      const toGlId = form.watch("toGlId")
      if (fromGlId || toGlId) {
        form.setValue("fromGlId", "")
        form.setValue("toGlId", "")
        form.setValue("sameToGl", false)
      }
    }
  }

  // Handle asOfDate change and automatically set toDate to the same value
  const handleAsDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = format(date, dateFormat)
      form.setValue("asOfDate", formattedDate)
      form.setValue("toDate", formattedDate)
    }
  }

  // Handle toDate change and automatically set asOfDate to the same value
  const handleToDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = format(date, dateFormat)
      form.setValue("toDate", formattedDate)
      form.setValue("asOfDate", formattedDate)
    }
  }

  const handleReportToggle = (reportId: string) => {
    setSelectedReports((prev) => (prev.includes(reportId) ? [] : [reportId]))
  }

  const getAllReports = (): IReport[] => {
    return REPORT_CATEGORIES.flatMap((category) =>
      category.reports.map((report) => ({
        ...report,
        category: category.name,
        reportFile: (report as { reportFile?: string }).reportFile || "",
        reportType: (
          (report as { defaultReportType?: number }).defaultReportType ?? 0
        ).toString(),
        supportsReportType:
          (report as { supportsReportType?: boolean }).supportsReportType ??
          false,
      }))
    )
  }

  const getSelectedReportObjects = (): IReport[] => {
    const allReports = getAllReports()
    return allReports.filter((report) => selectedReports.includes(report.id))
  }

  // Update date selection and reportType based on selected report
  useEffect(() => {
    if (selectedReports.length > 0) {
      const selectedReportId = selectedReports[0]
      const usesTrsDate = TRS_DATE_REPORTS.includes(selectedReportId)
      const allReports = getAllReports()
      const selectedReport = allReports.find((r) => r.id === selectedReportId)

      if (usesTrsDate) {
        // Set TrsDate to true and disable AsDate
        form.setValue("useTrsDate", true)
        form.setValue("useAsDate", false)
      } else {
        // Set AsDate to true and disable TrsDate
        form.setValue("useTrsDate", false)
        form.setValue("useAsDate", true)
      }

      // Set default reportType based on selected report
      if (selectedReport) {
        const supportsReportType =
          (selectedReport as { supportsReportType?: boolean })
            .supportsReportType ?? false

        if (supportsReportType) {
          // For reports that support reportType, set default based on report
          if (selectedReportId === "trial-balance") {
            form.setValue("reportType", 0) // Default to Summary for Trial Balance
          } else if (
            selectedReportId === "balance-sheet" ||
            selectedReportId === "profit-loss"
          ) {
            form.setValue("reportType", 0) // Default to Summary
          } else if (selectedReportId === "vat") {
            form.setValue("reportType", 0) // Default to Summary for VAT
          } else {
            // For other reports with defaultReportType
            const defaultReportType =
              (selectedReport as { defaultReportType?: number })
                .defaultReportType ?? 0
            form.setValue("reportType", defaultReportType)
          }
        } else {
          // For reports that don't support reportType, keep current value or default to 0
          form.setValue("reportType", 0)
        }
      } else {
        form.setValue("reportType", 0)
      }
    }
  }, [selectedReports, form])

  const buildReportParameters = (data: IReportFormData): IReportParameters => {
    // Format all dates to yyyy-MM-dd format using formatDateForApi
    const formattedFromDate = formatDateForApi(data.fromDate)
    const formattedToDate = formatDateForApi(data.toDate)
    const formattedAsOfDate = formatDateForApi(
      data.asOfDate || getCurrentDate()
    )

    return {
      companyId,
      fromGlId: data.fromGlId ? Number(data.fromGlId) : null,
      toGlId: data.toGlId ? Number(data.toGlId) : null,
      glIds: data.glIds ? data.glIds : [],
      departmentId: data.departmentId ? Number(data.departmentId) : null,
      paymentTypeId: data.paymentTypeId ? Number(data.paymentTypeId) : null,
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      asOfDate: formattedAsOfDate,
      currencyId: data.currencyId ? Number(data.currencyId) : 0,
      reportType: typeof data.reportType === "number" ? data.reportType : 0,
      vatType: data.vatType || "",
      vatId: data.vatId ? Number(data.vatId) : null,
    }
  }

  const handleViewReport = (data: IReportFormData) => {
    const selectedReportObjects = getSelectedReportObjects()
    if (selectedReportObjects.length === 0) {
      return
    }

    const parameters = buildReportParameters(data)
    const report = selectedReportObjects[0] // Only one report can be selected
    const reportId = report.id
    const reportType = parameters.reportType

    // Get the actual reportFile based on reportId and reportType
    const reportFile = getReportFile(reportId, reportType)

    // Check if report is not available (Trial Balance Details)
    if (reportFile === null) {
      toast.error("No report available for this selection")
      return
    }

    // Get the reportType value to send to API
    const apiReportType = getReportTypeForApi(reportId, reportType)

    const reportParams = {
      companyId: parameters.companyId,
      companyName: companyName || "",
      fromGlId: parameters.fromGlId?.toString() || "0",
      toGlId: parameters.toGlId?.toString() || "0",
      glIds: parameters.glIds?.toString() || "0",
      departmentId: parameters.departmentId || "0",
      paymentTypeId: parameters.paymentTypeId || "0",
      fromDate: parameters.fromDate,
      toDate: parameters.toDate,
      asDate: parameters.asOfDate,
      currencyId: parameters.currencyId || "0",
      reptype: apiReportType,
      gstTypeId: parameters.vatType || "0",
      gstId: parameters.vatId || "0",
      amtDec: amtDec,
      locAmtDec: locAmtDec,
      url: "",
      userName: user?.userName || "",
      isMonthly: false,
      userId: user?.userId || "0",
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage with a fixed key to avoid URL parameters
    const reportData = {
      reportFile: reportFile,
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
          reportFile
        )}&params=${encodeURIComponent(JSON.stringify(reportParams))}`,
        "_blank"
      )
    }
  }

  const handleClear = () => {
    const currentDate = format(new Date(), dateFormat)
    const twoMonthsAgoDate = getTwoMonthsAgoDate()
    form.reset({
      fromGlId: "",
      toGlId: "",
      sameToGl: false,
      glIds: [],
      departmentId: "",
      fromDate: twoMonthsAgoDate,
      toDate: currentDate,
      asOfDate: currentDate,
      currencyId: "0",
      useTrsDate: true,
      useAsDate: false,
      reportType: 0,
      vatType: "",
      vatId: "",
    })
    setSelectedReports([])
  }

  // Watch for changes to determine which selection method is active
  const glIds = form.watch("glIds")
  const fromGlId = form.watch("fromGlId")
  const toGlId = form.watch("toGlId")
  const hasMultiSelect = Array.isArray(glIds) && glIds.length > 0
  const hasRangeSelect = !!(fromGlId || toGlId)

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-2 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            GL Reports
          </h1>
          <p className="text-muted-foreground text-xs">
            Select reports and configure parameters to generate GL reports
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-3 md:grid-cols-2">
        {/* Report Selection Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Select Reports</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {REPORT_CATEGORIES.map((category) => (
                  <div key={category.name} className="space-y-2">
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              Report Parameters
              {selectedReports.length > 0 && (
                <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium">
                  {getSelectedReportObjects()[0]?.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(handleViewReport)}
                className="space-y-2.5"
              >
                {/* Report Type - Show on top */}
                {(() => {
                  const selectedReportObjects = getSelectedReportObjects()
                  const selectedReport = selectedReportObjects[0]
                  const supportsReportType =
                    selectedReport?.supportsReportType ?? false

                  // Determine which reportType options to show
                  // Trial Balance: Summary, OB/CB, D/C - Year (no Details)
                  const showAllOptions = selectedReport?.id === "trial-balance"
                  // Balance Sheet, Profit & Loss, VAT: Summary, Details
                  const showSummaryDetailsOnly =
                    selectedReport?.id === "balance-sheet" ||
                    selectedReport?.id === "profit-loss" ||
                    selectedReport?.id === "vat"

                  return supportsReportType ? (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Report Type:
                      </label>
                      <Select
                        value={
                          typeof form.watch("reportType") === "number"
                            ? form.watch("reportType").toString()
                            : "0"
                        }
                        onValueChange={(value) => {
                          const numValue = Number(value) || 0
                          form.setValue("reportType", numValue)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select.." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Summary</SelectItem>
                          {showAllOptions && (
                            <>
                              <SelectItem value="2">OB/CB</SelectItem>
                              <SelectItem value="3">D/C - Year</SelectItem>
                            </>
                          )}
                          {showSummaryDetailsOnly && (
                            <SelectItem value="1">Details</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null
                })()}

                {/* GL Name Selection - Range Method */}
                <div className="space-y-1.5">
                  <div className="flex flex-row items-end gap-2">
                    <div className="flex-1">
                      <ChartOfAccountAutocomplete
                        form={form}
                        name="fromGlId"
                        label="From GL Name"
                        companyId={companyId}
                        isRequired={false}
                        isDisabled={hasMultiSelect}
                        onChangeEvent={handleFromGlChange}
                      />
                    </div>

                    {/* Copy/Uncopy Button - Only show when fromGlId has value */}
                    {form.watch("fromGlId") && !hasMultiSelect && (
                      <button
                        type="button"
                        onClick={handleCopyToGl}
                        disabled={hasMultiSelect || !form.watch("fromGlId")}
                        className={cn(
                          "border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          form.watch("sameToGl") &&
                            "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                        )}
                        title={
                          form.watch("sameToGl")
                            ? "Click to uncopy (clear To GL Name)"
                            : "Click to copy From GL Name to To GL Name"
                        }
                      >
                        <IconCopy className="size-3.5" />
                        {form.watch("sameToGl") ? (
                          <span className="text-[10px]">Uncopy</span>
                        ) : (
                          <span className="text-[10px]">Copy</span>
                        )}
                      </button>
                    )}

                    <div className="flex-1">
                      <ChartOfAccountAutocomplete
                        form={form}
                        name="toGlId"
                        label="To GL Name"
                        companyId={companyId}
                        isRequired={false}
                        isDisabled={form.watch("sameToGl") || hasMultiSelect}
                        onChangeEvent={handleToGlChange}
                      />
                    </div>
                  </div>
                  {hasMultiSelect && (
                    <p className="text-muted-foreground mt-0.5 text-xs italic">
                      Range selection disabled when using multi-select
                    </p>
                  )}
                </div>

                {/* GL Name Selection - Multi-Select Method */}
                <div className="space-y-1.5">
                  <ChartOfAccountMultiSelect
                    form={form}
                    name="glIds"
                    label="GL Names (Multi Selection)"
                    companyId={companyId}
                    isRequired={false}
                    isDisabled={hasRangeSelect}
                    onChangeEvent={handleGlIdsChange}
                  />
                  {hasRangeSelect && (
                    <p className="text-muted-foreground mt-0.5 text-xs italic">
                      Multi-select disabled when using range selection
                    </p>
                  )}
                </div>

                {/* Date Selection Checkboxes */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="useTrsDate"
                      checked={form.watch("useTrsDate")}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean
                        form.setValue("useTrsDate", isChecked)
                        if (isChecked) {
                          form.setValue("useAsDate", false)
                        }
                      }}
                    />
                    <label
                      htmlFor="useTrsDate"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Trs Date:
                    </label>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id="useAsDate"
                      checked={form.watch("useAsDate")}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean
                        form.setValue("useAsDate", isChecked)
                        if (isChecked) {
                          form.setValue("useTrsDate", false)
                        }
                      }}
                    />
                    <label
                      htmlFor="useAsDate"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                    isDisabled={form.watch("useAsDate")}
                    onChangeEvent={handleFromDateChange}
                  />
                  <CustomDateNew
                    form={form}
                    name="toDate"
                    label="To Date:"
                    isRequired={false}
                    isDisabled={form.watch("useAsDate")}
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
                    isDisabled={form.watch("useTrsDate")}
                    onChangeEvent={handleAsDateChange}
                  />
                </div>

                {/* Currency, Department, Payment Type */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <CurrencyAutocomplete
                    form={form}
                    name="currencyId"
                    label="* Currency:"
                    isRequired={true}
                  />
                  <DepartmentAutocomplete
                    form={form}
                    name="departmentId"
                    label="Department:"
                    isRequired={false}
                  />
                  <PaymentTypeAutocomplete
                    form={form}
                    name="paymentTypeId"
                    label="Payment Type:"
                    isRequired={false}
                  />
                </div>

                {/* VAT Type and VAT in one row */}
                <div className="flex flex-row gap-3">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <label className="text-sm font-medium">VAT Type:</label>
                    <Select
                      value={form.watch("vatType")}
                      onValueChange={(value) => form.setValue("vatType", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select.." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="input">Input</SelectItem>
                        <SelectItem value="output">Output</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <GSTAutocomplete
                      form={form}
                      name="vatId"
                      label="VAT:"
                      isRequired={false}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={selectedReports.length === 0}
                    className="flex-1"
                  >
                    <IconEye className="mr-2 size-4" />
                    View Report
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="flex-1"
                  >
                    <IconX className="mr-2 size-4" />
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
