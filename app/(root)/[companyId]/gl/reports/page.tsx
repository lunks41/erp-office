"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { IChartOfAccountLookup } from "@/interfaces/lookup"
import { useAuthStore } from "@/stores/auth-store"
import { IconCopy, IconEye, IconX } from "@tabler/icons-react"
import { format, parse, startOfMonth, startOfYear, subMonths } from "date-fns"
import { FormProvider, useForm } from "react-hook-form"

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
  GSTAutocomplete,
} from "@/components/autocomplete"
import { CustomDateNew } from "@/components/custom/custom-date-new"
import { CustomDateWithPresets } from "@/components/custom/custom-date-with-presets"
import ChartOfAccountMultiSelect from "@/components/multiselection-chartofaccount"

interface IReportFormData extends Record<string, unknown> {
  fromGlId: string
  toGlId: string
  glIds: number[]
  sameToGl: boolean
  fromDate: string
  toDate: string
  asOfDate: string
  currencyId: string
  useTrsDate: boolean
  useAsDate: boolean
  reportType: number
  gstTypeId: number
  gstId: number
}

interface IReportParameters {
  companyId: number
  fromGlId: number | null
  toGlId: number | null
  glIds: number[]
  fromDate: string | null
  toDate: string | null
  asOfDate: string | null
  currencyId: number
  reportType: number
  gstTypeId: number
  gstId: number | null
}

interface IReport {
  id: string
  name: string
  category: string
  reportFile: string
  reportType?: string
}

// Reports that use TrsDate (From/To Date)
// Note: GL reports typically use TrsDate for date range reports
// Reports without TrsDate use AsDate (single date)
const TRS_DATE_REPORTS: string[] = [
  "gl-ledger",
  "combined-vat-computation",
  "vat-authority",
  "vat-details",
  "vat-summary",
]

// Reports that use AsDate only (single date)
const AS_DATE_REPORTS: string[] = [
  "trial-balance-debit-credit",
  "trial-balance",
  "balance-sheet-details",
  "profit-loss-details",
]

const REPORT_CATEGORIES = [
  {
    name: "Financial Report",
    reports: [
      // {
      //   id: "trial-balance-summary",
      //   name: "Trial Balance Summary Report (OB/CB)",
      //   reportFile: "gl/TrialBalanceSummary.trdp",
      //   reportType: 1,
      // },
      {
        id: "trial-balance-debit-credit",
        name: "Trial Balance (DEBIT/CREDIT)",
        reportFile: "gl/TrialBalanceDebitCredit.trdp",
        reportType: 1,
      },
      {
        id: "trial-balance",
        name: "Trial Balance",
        reportFile: "gl/TrialBalance.trdp",
        reportType: 2,
      },
      {
        id: "balance-sheet-details",
        name: "Balance Sheet Details",
        reportFile: "gl/BalanceSheetDetails.trdp",
        reportType: 2,
      },
      {
        id: "profit-loss-details",
        name: "Profit & Loss Account Details",
        reportFile: "gl/ProfitLossDetails.trdp",
        reportType: 2,
      },
      // {
      //   id: "balance-sheet-summary",
      //   name: "Balance Sheet Summary",
      //   reportFile: "gl/BalanceSheetSummary.trdp",
      //   reportType: 2,
      // },
      // {
      //   id: "profit-loss-summary",
      //   name: "Profit & Loss Account Summary",
      //   reportFile: "gl/ProfitLossSummary.trdp",
      //   reportType: 2,
      // },
    ],
  },
  {
    name: "VAT & Activities",
    reports: [
      {
        id: "gl-ledger",
        name: "GLLedger",
        reportFile: "gl/Ledger.trdp",
      },
      {
        id: "combined-vat-computation",
        name: "Combined VAT Computation",
        reportFile: "gl/CombinedGstComputation.trdp",
      },
      {
        id: "vat-authority",
        name: "VAT Authority",
        reportFile: "gl/GstAuthority.trdp",
      },
      {
        id: "vat-details",
        name: "VAT Details",
        reportFile: "gl/GstDetails.trdp",
      },
      {
        id: "vat-summary",
        name: "VAT Summary",
        reportFile: "gl/GstSummary.trdp",
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

  // fromDate: start of (today - 2 months), but not before 1 Jan current year
  const getDefaultFromDate = () => {
    const now = new Date()
    const twoMonthsAgo = subMonths(now, 2)
    const firstOfTwoMonthsAgo = startOfMonth(twoMonthsAgo)
    const firstOfYear = startOfYear(now)
    const fromDate =
      firstOfTwoMonthsAgo < firstOfYear ? firstOfYear : firstOfTwoMonthsAgo
    return format(fromDate, dateFormat)
  }

  const form = useForm<IReportFormData>({
    defaultValues: {
      fromGlId: "",
      toGlId: "",
      sameToGl: false,
      glIds: [],
      fromDate: getDefaultFromDate(),
      toDate: getCurrentDate(),
      asOfDate: getCurrentDate(),
      currencyId: "0",
      useTrsDate: true,
      useAsDate: false,
      reportType: 0,
      gstTypeId: 0,
      gstId: 0,
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

  const handleReportToggle = (reportId: string) => {
    setSelectedReports((prev) => (prev.includes(reportId) ? [] : [reportId]))
  }

  const getAllReports = (): IReport[] => {
    return REPORT_CATEGORIES.flatMap((category) =>
      category.reports.map((report) => ({
        ...report,
        category: category.name,
        reportType: (
          (report as { reportType?: number }).reportType ?? 0
        ).toString(),
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

      // Set reportType from the selected report if available
      if (selectedReport?.reportType !== undefined) {
        const reportTypeNum = Number(selectedReport.reportType) || 0
        form.setValue("reportType", reportTypeNum)
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
      fromDate: formattedFromDate,
      toDate: formattedToDate,
      asOfDate: formattedAsOfDate,
      currencyId: data.currencyId ? Number(data.currencyId) : 0,
      reportType: typeof data.reportType === "number" ? data.reportType : 0,
      gstTypeId: typeof data.gstTypeId === "number" ? data.gstTypeId : 0,
      gstId: typeof data.gstId === "number" ? data.gstId : null,
    }
  }

  const handleViewReport = (data: IReportFormData) => {
    const selectedReportObjects = getSelectedReportObjects()
    if (selectedReportObjects.length === 0) {
      return
    }

    const parameters = buildReportParameters(data)
    const report = selectedReportObjects[0] // Only one report can be selected

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "")

    const reportParams = {
      companyId: parameters.companyId,
      companyName: companyName || "",
      fromGlId: parameters.fromGlId?.toString() || "0",
      toGlId: parameters.toGlId?.toString() || "0",
      glIds: parameters.glIds?.toString() || "0",
      fromDate: parameters.fromDate,
      toDate: parameters.toDate,
      asOfDate: parameters.asOfDate,
      currencyId: parameters.currencyId || "0",
      reptype: parameters.reportType,
      gstTypeId: parameters.gstTypeId || 0,
      gstId: parameters.gstId || 0,
      amtDec: amtDec,
      locAmtDec: locAmtDec,
      url: baseUrl,
      userName: user?.userName || "",
      isMonthly: false,
      userId: user?.userId || "0",
    }

    console.log("reportParams", reportParams)

    // Store report data in sessionStorage with a fixed key to avoid URL parameters
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
      fromGlId: "",
      toGlId: "",
      sameToGl: false,
      glIds: [],
      fromDate: getDefaultFromDate(),
      toDate: currentDate,
      asOfDate: currentDate,
      currencyId: "0",
      useTrsDate: true,
      useAsDate: false,
      reportType: 0,
      gstTypeId: 0,
      gstId: 0,
    })
    setSelectedReports([])
  }

  // Watch for changes to determine which selection method is active
  const glIds = form.watch("glIds")
  const fromGlId = form.watch("fromGlId")
  const toGlId = form.watch("toGlId")
  const hasMultiSelect = Array.isArray(glIds) && glIds.length > 0
  const hasRangeSelect = !!(fromGlId || toGlId)

  // Check if selected report requires TrsDate (fromDate/toDate only)
  const requiresTrsDate =
    selectedReports.length > 0 && TRS_DATE_REPORTS.includes(selectedReports[0])

  // Check if selected report requires AsDate (asOfDate only)
  const requiresAsDate =
    selectedReports.length > 0 && AS_DATE_REPORTS.includes(selectedReports[0])

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
        <Card className="gap-1">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2">
              Report Parameters
              {selectedReports.length > 0 && (
                <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium">
                  {getSelectedReportObjects()[0]?.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(handleViewReport)}
                className="space-y-2.5"
              >
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
                      className={cn(
                        "text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        (requiresTrsDate || requiresAsDate) &&
                          "cursor-not-allowed opacity-50"
                      )}
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
                            // Sync asOfDate with toDate when As Date is enabled
                            const toDate = form.watch("toDate")
                            if (toDate) {
                              form.setValue("asOfDate", toDate)
                            } else {
                              // If toDate is empty, set to current date
                              form.setValue("asOfDate", getCurrentDate())
                              form.setValue("toDate", getCurrentDate())
                            }
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="useAsDate"
                      className={cn(
                        "text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        requiresTrsDate && "cursor-not-allowed opacity-50"
                      )}
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

                {/* As Date - Show only for non-TrsDate reports (with preset shortcuts) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CustomDateWithPresets
                    form={form}
                    name="asOfDate"
                    label="As Date:"
                    isRequired={false}
                    isDisabled={form.watch("useTrsDate") || requiresTrsDate}
                    onChangeEvent={handleAsDateChange}
                  />
                </div>

                {/* Currency */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CurrencyAutocomplete
                    form={form}
                    name="currencyId"
                    label="* Currency:"
                  />

                  {/* VAT Type and VAT in one row - Only show for VAT Details report */}
                  {selectedReports.includes("vat-details") && (
                    <div className="flex flex-row gap-3">
                      <div className="flex flex-1 flex-col gap-0.5">
                        <label className="text-sm font-medium">VAT Type:</label>
                        <Select
                          value={
                            form.watch("gstTypeId") &&
                            form.watch("gstTypeId") !== 0
                              ? form.watch("gstTypeId").toString()
                              : undefined
                          }
                          onValueChange={(value) =>
                            form.setValue("gstTypeId", Number(value))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select.." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Input</SelectItem>
                            <SelectItem value="2">Output</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <GSTAutocomplete
                          form={form}
                          name="gstId"
                          label="VAT:"
                          isRequired={false}
                        />
                      </div>
                    </div>
                  )}
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
