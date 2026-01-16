"use client"

import { useEffect, useState } from "react"
import { IJobOrderHd, ITaskDetails } from "@/interfaces/checklist"
//import { useAuthStore } from "@/stores/auth-store"
import { useQueryClient } from "@tanstack/react-query"

import { getData } from "@/lib/api-client"
import { JobOrder, TaskServiceSetting } from "@/lib/api-routes"
import { useGetById } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChecklistDetailsSkeleton } from "@/components/skeleton/checklist-details-skeleton"

import { AgencyRemunerationTab } from "./services-tabs/agency-remuneration-tab"
import { ConsignmentExportTab } from "./services-tabs/consignment-export-tab"
import { ConsignmentImportTab } from "./services-tabs/consignment-import-tab"
import { CrewMiscellaneousTab } from "./services-tabs/crew-miscellaneous-tab"
import { CrewSignOffTab } from "./services-tabs/crew-sign-off-tab"
import { CrewSignOnTab } from "./services-tabs/crew-sign-on-tab"
import { EquipmentUsedTab } from "./services-tabs/equipment-used-tab"
import { FreshWaterTab } from "./services-tabs/fresh-water-tab"
import { LandingItemsTab } from "./services-tabs/landing-items-tab"
import { LaunchServicesTab } from "./services-tabs/launch-services-tab"
import { MedicalAssistanceTab } from "./services-tabs/medical-assistance-tab"
import { OtherServiceTab } from "./services-tabs/other-service-tab"
import { PortExpensesTab } from "./services-tabs/port-expenses-tab"
import { TechniciansSurveyorsTab } from "./services-tabs/technicians-surveyors-tab"
import { ThirdPartyTab } from "./services-tabs/third-party-tab"

interface ChecklistDetailsFormProps {
  jobData: IJobOrderHd
  isConfirmed: boolean
  // Permission props
  canView?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canCreate?: boolean
  canDebitNote?: boolean
}

export function ChecklistDetailsForm({
  jobData,
  isConfirmed,
  canView: _canView,
  canEdit: _canEdit,
  canDelete: _canDelete,
  canCreate: _canCreate,
  canDebitNote: _canDebitNote,
}: ChecklistDetailsFormProps) {
  //const { decimals } = useAuthStore()
  const [activeTab, setActiveTab] = useState("port-expenses")
  const queryClient = useQueryClient()

  // Prefetch task service settings when component mounts
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["task-service-settings"],
      queryFn: async () => {
        const data = await getData(TaskServiceSetting.get)
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])

  // Data fetching
  console.log("jobData.jobOrderId:", jobData.jobOrderId)
  const jobOrderIdString = `${jobData.jobOrderId || ""}`
  console.log("jobOrderIdString:", jobOrderIdString)

  const {
    data: response,
    isLoading,
    refetch,
    isError,
    error,
  } = useGetById<ITaskDetails>(
    `${JobOrder.getTaskCount}`,
    "taskCount",
    jobOrderIdString
  )

  console.log(
    "Query state - isLoading:",
    isLoading,
    "isError:",
    isError,
    "error:",
    error
  )
  console.log("Response:", response)

  // Force refetch when jobOrderId becomes available or when component mounts
  useEffect(() => {
    if (jobData.jobOrderId) {
      console.log("JobOrderId available, forcing refetch...")
      // Invalidate the query cache to force fresh data
      queryClient.invalidateQueries({
        queryKey: ["taskCount", jobOrderIdString],
      })
      refetch()
    }
  }, [jobData.jobOrderId, queryClient, jobOrderIdString, refetch])

  // Also refetch on component mount to ensure fresh data
  useEffect(() => {
    if (jobData.jobOrderId) {
      console.log("Component mounted, ensuring fresh data...")
      refetch()
    }
  }, [jobData.jobOrderId, refetch]) // Include dependencies to avoid warnings

  // Handle both array and single object responses
  const rawData = response?.data
  const data = rawData
    ? Array.isArray(rawData)
      ? rawData[0]
      : (rawData as ITaskDetails)
    : undefined

  // Function to refetch task counts
  const refreshTaskCounts = () => {
    queryClient.invalidateQueries({ queryKey: ["taskCount"] })
    refetch()
  }

  // Pass refresh function and permissions to all tab components
  const tabProps = {
    jobData,
    // moduleId,
    // transactionId,
    onTaskAdded: refreshTaskCounts,
    isConfirmed,
  }

  console.log("Task count data:", data)

  // Show loading state
  if (isLoading) {
    return <ChecklistDetailsSkeleton />
  }

  // Show error state
  if (isError) {
    return (
      <div className="@container w-full space-y-2">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-destructive mb-2 text-sm">
              Failed to load task counts
            </p>
            <button
              onClick={() => refetch()}
              className="text-primary text-xs hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container w-full space-y-2">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-2"
      >
        <div className="bg-card rounded-lg border p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm">📊</span>
            <span className="text-sm font-medium">Service Categories</span>
          </div>
          <div className="overflow-x-auto">
            <TabsList className="flex h-auto w-max flex-wrap gap-1 p-1">
              <TabsTrigger
                value="port-expenses"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">🏢</span>
                  <span className="hidden sm:inline">Port Expenses</span>
                  <span className="sm:hidden">Port</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.portExpense && data?.portExpense > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.portExpense || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="launch-services"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">🚤</span>
                  <span className="hidden sm:inline">Launch Services</span>
                  <span className="sm:hidden">Launch</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.launchService && data?.launchService > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.launchService || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="equipment-used"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">🔧</span>
                  <span className="hidden sm:inline">Equipment Used</span>
                  <span className="sm:hidden">Equipment</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.equipmentUsed && data?.equipmentUsed > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.equipmentUsed || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="crew-sign-on"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">👥</span>
                  <span className="hidden sm:inline">Crew Sign On</span>
                  <span className="sm:hidden">Sign On</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.crewSignOn && data?.crewSignOn > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.crewSignOn || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="crew-sign-off"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">👋</span>
                  <span className="hidden sm:inline">Crew Sign Off</span>
                  <span className="sm:hidden">Sign Off</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.crewSignOff && data?.crewSignOff > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.crewSignOff || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="crew-miscellaneous"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">📋</span>
                  <span className="hidden sm:inline">Crew Miscellaneous</span>
                  <span className="sm:hidden">Misc</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.crewMiscellaneous && data?.crewMiscellaneous > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.crewMiscellaneous || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="medical-assistance"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">🏥</span>
                  <span className="hidden sm:inline">Medical Assistance</span>
                  <span className="sm:hidden">Medical</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.medicalAssistance && data?.medicalAssistance > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.medicalAssistance || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="consignment-import"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">📥</span>
                  <span className="hidden sm:inline">Consignment Import</span>
                  <span className="sm:hidden">Import</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.consignmentImport && data?.consignmentImport > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.consignmentImport || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="consignment-export"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">📤</span>
                  <span className="hidden sm:inline">Consignment Export</span>
                  <span className="sm:hidden">Export</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.consignmentExport && data?.consignmentExport > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.consignmentExport || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="third-party"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">🤝</span>
                  <span className="hidden sm:inline">Third Party</span>
                  <span className="sm:hidden">3rd Party</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.thirdParty && data?.thirdParty > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.thirdParty || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="fresh-water"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">💧</span>
                  <span className="hidden sm:inline">Fresh Water</span>
                  <span className="sm:hidden">Water</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.freshWater && data?.freshWater > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.freshWater || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="technician-surveyor"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">🔍</span>
                  <span className="hidden sm:inline">Technician Surveyor</span>
                  <span className="sm:hidden">Surveyor</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.technicianSurveyor && data?.technicianSurveyor > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.technicianSurveyor || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="landing-items"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">📦</span>
                  <span className="hidden sm:inline">Landing Items</span>
                  <span className="sm:hidden">Landing</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.landingItems && data?.landingItems > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.landingItems || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="other-service"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">⚙️</span>
                  <span className="hidden sm:inline">Other Service</span>
                  <span className="sm:hidden">Other</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.otherService && data?.otherService > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.otherService || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="agency-remuneration"
                className="relative flex flex-col items-center space-y-1 px-3 py-2 text-xs sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:text-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">💰</span>
                  <span className="hidden sm:inline">Agency Remuneration</span>
                  <span className="sm:hidden">Remuneration</span>
                </div>
                <Badge
                  variant={
                    isLoading
                      ? "secondary"
                      : data?.agencyRemuneration && data?.agencyRemuneration > 0
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs font-medium"
                >
                  {isLoading ? "..." : data?.agencyRemuneration || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <TabsContent value="port-expenses" className="p-3">
            <PortExpensesTab {...tabProps} />
          </TabsContent>

          <TabsContent value="launch-services" className="p-3">
            <LaunchServicesTab {...tabProps} />
          </TabsContent>

          <TabsContent value="equipment-used" className="p-3">
            <EquipmentUsedTab {...tabProps} />
          </TabsContent>

          <TabsContent value="crew-sign-on" className="p-3">
            <CrewSignOnTab {...tabProps} />
          </TabsContent>

          <TabsContent value="crew-sign-off" className="p-3">
            <CrewSignOffTab {...tabProps} />
          </TabsContent>

          <TabsContent value="crew-miscellaneous" className="p-3">
            <CrewMiscellaneousTab {...tabProps} />
          </TabsContent>

          <TabsContent value="medical-assistance" className="p-3">
            <MedicalAssistanceTab {...tabProps} />
          </TabsContent>

          <TabsContent value="consignment-import" className="p-3">
            <ConsignmentImportTab {...tabProps} />
          </TabsContent>

          <TabsContent value="consignment-export" className="p-3">
            <ConsignmentExportTab {...tabProps} />
          </TabsContent>

          <TabsContent value="third-party" className="p-3">
            <ThirdPartyTab {...tabProps} />
          </TabsContent>

          <TabsContent value="fresh-water" className="p-3">
            <FreshWaterTab {...tabProps} />
          </TabsContent>

          <TabsContent value="technician-surveyor" className="p-3">
            <TechniciansSurveyorsTab {...tabProps} />
          </TabsContent>

          <TabsContent value="landing-items" className="p-3">
            <LandingItemsTab {...tabProps} />
          </TabsContent>

          <TabsContent value="other-service" className="p-3">
            <OtherServiceTab {...tabProps} />
          </TabsContent>

          <TabsContent value="agency-remuneration" className="p-3">
            <AgencyRemunerationTab {...tabProps} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
