"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useEffect, useMemo, useState } from "react"
import { IJobOrderHd } from "@/interfaces/checklist"
import { format, isValid } from "date-fns"
import {
  Activity,
  Anchor,
  Calendar,
  ClipboardList,
  Container,
  DollarSign,
  Droplets,
  FileCheck,
  FileText,
  Package,
  Plane,
  RefreshCw,
  Ship,
  Stethoscope,
  Truck,
  User,
  Users,
  Wrench,
} from "lucide-react"

import { Admin } from "@/lib/api-routes"
import { useGetById } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface IChecklistLogResponse {
  tblName?: string
  modeName?: string
  remarks?: string
  createDate?: string | Date
  createBy?: string
}

interface IActivityLog {
  activityId: number
  timestamp: string | Date
  description: string
  activityDetails?: string
  normalizedTableName?: string // For icon lookup
  performedBy?: string
  status?: string
  icon?: string
}

interface ChecklistLogProps {
  jobData?: IJobOrderHd | null
  isConfirmed?: boolean
  activeTab?: string // Tab identifier to detect when this tab is active
}

export function ChecklistLog({
  jobData,
  isConfirmed: _isConfirmed = false,
  activeTab,
}: ChecklistLogProps) {
  const { decimals } = useCompanyStore()
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"
  const timeFormat = "HH:mm"
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch activity logs data
  const {
    data: logsResponse,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useGetById<IChecklistLogResponse[]>(
    Admin.getChecklistLog,
    "checklistLog",
    jobData?.jobOrderId ? jobData.jobOrderId.toString() : "",
    {
      enabled: !!jobData?.jobOrderId,
    }
  )

  // Refresh when tab becomes active
  useEffect(() => {
    if (activeTab === "logs" && jobData?.jobOrderId) {
      refetchLogs()
    }
  }, [activeTab, jobData?.jobOrderId, refetchLogs])

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchLogs()
    } catch (error) {
      console.error("Error refreshing logs:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDateTime = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "-"

    try {
      let date: Date | null = null

      if (dateValue instanceof Date) {
        date = dateValue
      } else if (typeof dateValue === "string") {
        date = new Date(dateValue)
      }

      if (date && isValid(date) && !isNaN(date.getTime())) {
        const formattedDate = format(date, dateFormat)
        const formattedTime = format(date, timeFormat)
        return `${formattedDate} ${formattedTime}`
      }

      return "-"
    } catch {
      return "-"
    }
  }

  // Convert normalized table name to display name (Title Case with proper spacing)
  const getDisplayName = (normalizedName: string): string => {
    const displayNameMap: Record<string, string> = {
      checklist: "Checklist",
      portexpense: "Port Expense",
      launchservice: "Launch Service",
      equipmentused: "Equipment Used",
      crewsignon: "Crew Sign On",
      crewsignoff: "Crew Sign Off",
      crewmiscellaneous: "Crew Miscellaneous",
      medicalassistance: "Medical Assistance",
      consignmentimport: "Consignment Import",
      consignmentexport: "Consignment Export",
      thirdparty: "Third Party",
      freshwater: "Fresh Water",
      technicianssurveyors: "Technicians Surveyors",
      landingitems: "Landing Items",
      otherservice: "Other Service",
      agencyremuneration: "Agency Remuneration",
      transportation: "Transportation",
      debitnote: "Debit Note",
      tariff: "Tariff",
      template: "Template",
    }

    return displayNameMap[normalizedName] || normalizedName
  }

  // Normalize table name: remove Ser_ prefix, remove Hd suffix, convert to lowercase
  const normalizeTableName = (tblName?: string): string => {
    if (!tblName) return ""

    let normalized = tblName.trim()

    // Remove "Ser_" prefix if present
    if (normalized.startsWith("Ser_")) {
      normalized = normalized.substring(4)
    }

    // Remove "Hd" suffix if present (case-insensitive)
    const lowerNormalized = normalized.toLowerCase()
    if (lowerNormalized.endsWith("hd")) {
      normalized = normalized.substring(0, normalized.length - 2)
    }

    normalized = normalized.toLowerCase()

    // Handle special mappings to standardized names for icon lookup
    const specialMappings: Record<string, string> = {
      // Map JobOrder to checklist
      joborder: "checklist",
      // Map plural to singular forms
      portexpenses: "portexpense",
      // Handle typo in DB: TransporationLog
      transporationlog: "transportation",
        transporation: "transportation",
      transportationlog: "transportation",
      // Handle singular/plural variations
      techniciansurveyor: "technicianssurveyors",
      landingitems: "landingitems",
      otherservice: "otherservice",
      agencyremuneration: "agencyremuneration",
      equipmentused: "equipmentused",
      crewsignon: "crewsignon",
      crewsignoff: "crewsignoff",
      crewmiscellaneous: "crewmiscellaneous",
      medicalassistance: "medicalassistance",
      consignmentimport: "consignmentimport",
      consignmentexport: "consignmentexport",
      thirdparty: "thirdparty",
      freshwater: "freshwater",
      launchservice: "launchservice",
      lunchservice: "launchservice", // Handle typo case
      debitnote: "debitnote",
    }

    // Apply special mappings or return normalized name
    return specialMappings[normalized] || normalized
  }

  // Get status badge color based on modeName
  const getStatusBadgeColor = (status?: string): string => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200"

    const statusLower = status.toLowerCase()

    if (statusLower.includes("delete") || statusLower.includes("del")) {
      return "bg-red-100 text-red-800 border-red-200"
    } else if (
      statusLower.includes("create") ||
      statusLower.includes("add") ||
      statusLower.includes("new")
    ) {
      return "bg-green-100 text-green-800 border-green-200"
    } else if (
      statusLower.includes("update") ||
      statusLower.includes("edit") ||
      statusLower.includes("modify")
    ) {
      return "bg-sky-100 text-sky-800 border-sky-200"
    }

    // Default color for other statuses
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Get icon component based on table name (expects already normalized name)
  const getTableIcon = (normalizedName?: string) => {
    if (!normalizedName) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <Calendar className="h-4 w-4 text-gray-600" />
        </div>
      )
    }

    // Map table names to icons (reduced size for compact display)
    const iconMap: Record<string, React.ReactNode> = {
      checklist: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
      portexpense: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
          <Anchor className="h-4 w-4 text-green-600" />
        </div>
      ),
      launchservice: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100">
          <Ship className="h-4 w-4 text-cyan-600" />
        </div>
      ),
      equipmentused: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
          <Wrench className="h-4 w-4 text-orange-600" />
        </div>
      ),
      crewsignon: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
          <Users className="h-4 w-4 text-purple-600" />
        </div>
      ),
      crewsignoff: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
          <Users className="h-4 w-4 text-pink-600" />
        </div>
      ),
      crewmiscellaneous: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
          <Users className="h-4 w-4 text-indigo-600" />
        </div>
      ),
      medicalassistance: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
          <Stethoscope className="h-4 w-4 text-red-600" />
        </div>
      ),
      consignmentimport: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
          <Package className="h-4 w-4 text-emerald-600" />
        </div>
      ),
      consignmentexport: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
          <Container className="h-4 w-4 text-teal-600" />
        </div>
      ),
      thirdparty: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
          <Truck className="h-4 w-4 text-amber-600" />
        </div>
      ),
      freshwater: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
          <Droplets className="h-4 w-4 text-sky-600" />
        </div>
      ),
      technicianssurveyors: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
          <Activity className="h-4 w-4 text-violet-600" />
        </div>
      ),
      landingitems: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
          <Plane className="h-4 w-4 text-rose-600" />
        </div>
      ),
      otherservice: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <FileText className="h-4 w-4 text-slate-600" />
        </div>
      ),
      agencyremuneration: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
          <DollarSign className="h-4 w-4 text-yellow-600" />
        </div>
      ),
      tariff: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-100">
          <FileCheck className="h-4 w-4 text-lime-600" />
        </div>
      ),
      template: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
      // Handle special cases
      transportation: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
          <Truck className="h-4 w-4 text-muted-foreground" />
        </div>
      ),
      debitnote: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
          <FileText className="h-4 w-4 text-red-600" />
        </div>
      ),
    }

    // Return mapped icon or default
    return (
      iconMap[normalizedName] || (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <Calendar className="h-4 w-4 text-gray-600" />
        </div>
      )
    )
  }

  // Extract and map logs data from response
  const displayLogs: IActivityLog[] = useMemo(() => {
    if (logsResponse?.result === 1 && logsResponse?.data) {
      const data = logsResponse.data as unknown
      let rawLogs: IChecklistLogResponse[] = []

      if (Array.isArray(data)) {
        // Handle nested array case: [[IChecklistLogResponse[]]]
        if (data.length > 0 && Array.isArray(data[0])) {
          rawLogs = data[0] as IChecklistLogResponse[]
        } else {
          // Handle flat array case: IChecklistLogResponse[]
          rawLogs = data as IChecklistLogResponse[]
        }
      }

      // Map API response to IActivityLog format
      return rawLogs.map((log, index) => {
        const normalizedName = normalizeTableName(log.tblName)
        return {
          activityId: index + 1,
          timestamp: log.createDate || new Date(),
          description: log.remarks || "",
          activityDetails: getDisplayName(normalizedName), // Display formatted name
          normalizedTableName: normalizedName, // Keep normalized name for icon lookup
          performedBy: log.createBy || "",
          status: log.modeName || "",
        }
      })
    }
    return []
  }, [logsResponse])

  if (isLogsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading activity logs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Card className="flex max-h-[600px] flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">
            Activity Timeline
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLogsLoading}
            className="h-8 w-8 p-0"
            title="Refresh timeline"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing || isLogsLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="relative space-y-3">
            {/* Timeline line */}
            <div className="bg-border absolute top-0 left-4 h-full w-0.5" />

            {/* Timeline items */}
            {displayLogs.map((log, index) => (
              <div
                key={log.activityId || index}
                className="relative flex gap-4"
              >
                {/* Icon */}
                <div className="relative z-10 shrink-0">
                  {getTableIcon(log.normalizedTableName)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-0.5 pb-3">
                  {/* Table Name - at the top */}
                  {log.activityDetails && (
                    <div className="text-sm font-semibold">
                      {log.activityDetails}
                    </div>
                  )}

                  {/* Date and Time */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs font-medium">
                      {formatDateTime(log.timestamp)}
                    </span>
                    {log.status && (
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${getStatusBadgeColor(log.status)}`}
                      >
                        {log.status}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {log.description && (
                    <div className="text-muted-foreground text-xs leading-relaxed">
                      {log.description}
                    </div>
                  )}

                  {/* Performed By */}
                  {log.performedBy && (
                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <User className="h-2.5 w-2.5" />
                      <span>{log.performedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
