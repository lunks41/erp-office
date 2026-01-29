"use client"

import { useMemo, useState } from "react"
import type {
  IAgencyRemuneration,
  IConsignmentExport,
  IConsignmentImport,
  ICrewMiscellaneous,
  ICrewSignOff,
  ICrewSignOn,
  IEquipmentUsed,
  IFreshWater,
  ILandingItems,
  ILaunchService,
  IMedicalAssistance,
  IOtherService,
  IPortExpenses,
  ITechnicianSurveyor,
  IThirdParty,
} from "@/interfaces/checklist"
import { subMonths } from "date-fns"
import { Search } from "lucide-react"
import { useForm } from "react-hook-form"

import { Reports } from "@/lib/api-routes"
import { formatDateForApi } from "@/lib/date-utils"
import { Task } from "@/lib/operations-utils"
import { useGetWithDates } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { TaskAutocomplete } from "@/components/autocomplete"
import { CustomInput } from "@/components/custom"
import { CustomDateNew } from "@/components/custom/custom-date-new"

// Import all service tables
import { AgencyRemunerationTable } from "./components/services-tables/agency-remuneration-table"
import { ConsignmentExportTable } from "./components/services-tables/consignment-export-table"
import { ConsignmentImportTable } from "./components/services-tables/consignment-import-table"
import { CrewMiscellaneousTable } from "./components/services-tables/crew-miscellaneous-table"
import { CrewSignOffTable } from "./components/services-tables/crew-sign-off-table"
import { CrewSignOnTable } from "./components/services-tables/crew-sign-on-table"
import { EquipmentUsedTable } from "./components/services-tables/equipment-used-table"
import { FreshWaterTable } from "./components/services-tables/fresh-water-table"
import { LandingItemsTable } from "./components/services-tables/landing-items-table"
import { LaunchServiceTable } from "./components/services-tables/launch-service-table"
import { MedicalAssistanceTable } from "./components/services-tables/medical-assistance-table"
import { OtherServiceTable } from "./components/services-tables/other-service-table"
import { PortExpensesTable } from "./components/services-tables/port-expenses-table"
import { TechnicianSurveyorTable } from "./components/services-tables/technician-surveyor-table"
import { ThirdPartyTable } from "./components/services-tables/third-party-table"

interface ReportsFilterForm extends Record<string, unknown> {
  taskId: number
  fromDate: Date | null
  toDate: Date | null
  search: string
}

export default function ReportsPage({
  params: _params,
}: {
  params: { companyId: string }
}) {
  const [hasSearched, setHasSearched] = useState(false)
  // Committed search value - only updates when Search button is clicked
  const [committedSearch, setCommittedSearch] = useState<string>("")
  const [committedTaskId, setCommittedTaskId] = useState<number>(0)
  const [committedFromDate, setCommittedFromDate] = useState<Date | null>(null)
  const [committedToDate, setCommittedToDate] = useState<Date | null>(null)

  // Calculate default dates: 3 months ago to today
  const today = new Date()
  const threeMonthsAgo = subMonths(today, 3)

  const form = useForm<ReportsFilterForm>({
    defaultValues: {
      taskId: 0,
      fromDate: threeMonthsAgo,
      toDate: today,
      search: "",
    },
  })

  const watchedTaskId = form.watch("taskId")

  // Format dates for API - use committed values (only update when Search is clicked)
  const startDate = useMemo(
    () =>
      committedFromDate
        ? formatDateForApi(committedFromDate) || undefined
        : undefined,
    [committedFromDate]
  )
  const endDate = useMemo(
    () =>
      committedToDate
        ? formatDateForApi(committedToDate) || undefined
        : undefined,
    [committedToDate]
  )

  // Fetch data using useGetWithDates hook
  // Using Task enum from operations-utils.ts for proper task ID mapping
  // Use committedSearch instead of watchedSearch to prevent API calls on every keystroke
  const portExpensesQuery = useGetWithDates<IPortExpenses>(
    Reports.getPortExpensesReports,
    "portExpensesReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.PortExpenses
  )

  const launchServiceQuery = useGetWithDates<ILaunchService>(
    Reports.getLaunchServiceReports,
    "launchServiceReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.LaunchServices
  )

  const equipmentUsedQuery = useGetWithDates<IEquipmentUsed>(
    Reports.getEquipmentUsedReports,
    "equipmentUsedReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.EquipmentUsed
  )

  const crewSignOnQuery = useGetWithDates<ICrewSignOn>(
    Reports.getCrewSignOnReports,
    "crewSignOnReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.CrewSignOn
  )

  const crewSignOffQuery = useGetWithDates<ICrewSignOff>(
    Reports.getCrewSignOffReports,
    "crewSignOffReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.CrewSignOff
  )

  const crewMiscellaneousQuery = useGetWithDates<ICrewMiscellaneous>(
    Reports.getCrewMiscellaneousReports,
    "crewMiscellaneousReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.CrewMiscellaneous
  )

  const medicalAssistanceQuery = useGetWithDates<IMedicalAssistance>(
    Reports.getMedicalAssistanceReports,
    "medicalAssistanceReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.MedicalAssistance
  )

  const consignmentImportQuery = useGetWithDates<IConsignmentImport>(
    Reports.getConsignmentImportReports,
    "consignmentImportReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.ConsignmentImport
  )

  const consignmentExportQuery = useGetWithDates<IConsignmentExport>(
    Reports.getConsignmentExportReports,
    "consignmentExportReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.ConsignmentExport
  )

  const thirdPartyQuery = useGetWithDates<IThirdParty>(
    Reports.getThirdPartyReports,
    "thirdPartyReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.ThirdParty
  )

  const freshWaterQuery = useGetWithDates<IFreshWater>(
    Reports.getFreshWaterReports,
    "freshWaterReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.FreshWater
  )

  const technicianSurveyorQuery = useGetWithDates<ITechnicianSurveyor>(
    Reports.getTechnicianSurveyorReports,
    "technicianSurveyorReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.TechniciansSurveyors
  )

  const landingItemsQuery = useGetWithDates<ILandingItems>(
    Reports.getLandingItemsReports,
    "landingItemsReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.LandingItems
  )

  const otherServiceQuery = useGetWithDates<IOtherService>(
    Reports.getOtherServiceReports,
    "otherServiceReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.OtherService
  )

  const agencyRemunerationQuery = useGetWithDates<IAgencyRemuneration>(
    Reports.getAgencyRemunerationReports,
    "agencyRemunerationReports",
    committedSearch,
    startDate,
    endDate,
    undefined,
    hasSearched && committedTaskId === Task.AgencyRemuneration
  )

  // Map taskId (from database) to the correct query using Task enum
  // Use committedTaskId instead of watchedTaskId to match the queries
  const currentQuery = useMemo(() => {
    if (!committedTaskId || committedTaskId === 0) return null

    // Use Task enum for proper mapping
    switch (committedTaskId) {
      case Task.PortExpenses:
        return portExpensesQuery
      case Task.LaunchServices:
        return launchServiceQuery
      case Task.EquipmentUsed:
        return equipmentUsedQuery
      case Task.CrewSignOn:
        return crewSignOnQuery
      case Task.CrewSignOff:
        return crewSignOffQuery
      case Task.CrewMiscellaneous:
        return crewMiscellaneousQuery
      case Task.MedicalAssistance:
        return medicalAssistanceQuery
      case Task.ConsignmentImport:
        return consignmentImportQuery
      case Task.ConsignmentExport:
        return consignmentExportQuery
      case Task.ThirdParty:
        return thirdPartyQuery
      case Task.FreshWater:
        return freshWaterQuery
      case Task.TechniciansSurveyors:
        return technicianSurveyorQuery
      case Task.LandingItems:
        return landingItemsQuery
      case Task.OtherService:
        return otherServiceQuery
      case Task.AgencyRemuneration:
        return agencyRemunerationQuery
      default:
        return null
    }
  }, [
    committedTaskId,
    portExpensesQuery,
    launchServiceQuery,
    equipmentUsedQuery,
    crewSignOnQuery,
    crewSignOffQuery,
    crewMiscellaneousQuery,
    medicalAssistanceQuery,
    consignmentImportQuery,
    consignmentExportQuery,
    thirdPartyQuery,
    freshWaterQuery,
    technicianSurveyorQuery,
    landingItemsQuery,
    otherServiceQuery,
    agencyRemunerationQuery,
  ])

  const handleSearch = async (data: ReportsFilterForm) => {
    // Task is mandatory - validation will prevent submission if not selected
    if (!data.taskId || data.taskId === 0) {
      form.setError("taskId", {
        type: "manual",
        message: "Task is required",
      })
      return
    }

    // Update committed values - these are what the API queries use
    // This prevents API calls on every keystroke
    setCommittedSearch(data.search || "")
    setCommittedTaskId(data.taskId)
    setCommittedFromDate(data.fromDate)
    setCommittedToDate(data.toDate)
    setHasSearched(true)

    // Manually trigger API call for the selected task
    // Use Task enum for proper mapping
    switch (data.taskId) {
      case Task.PortExpenses:
        await portExpensesQuery.refetch()
        break
      case Task.LaunchServices:
        await launchServiceQuery.refetch()
        break
      case Task.EquipmentUsed:
        await equipmentUsedQuery.refetch()
        break
      case Task.CrewSignOn:
        await crewSignOnQuery.refetch()
        break
      case Task.CrewSignOff:
        await crewSignOffQuery.refetch()
        break
      case Task.CrewMiscellaneous:
        await crewMiscellaneousQuery.refetch()
        break
      case Task.MedicalAssistance:
        await medicalAssistanceQuery.refetch()
        break
      case Task.ConsignmentImport:
        await consignmentImportQuery.refetch()
        break
      case Task.ConsignmentExport:
        await consignmentExportQuery.refetch()
        break
      case Task.ThirdParty:
        await thirdPartyQuery.refetch()
        break
      case Task.FreshWater:
        await freshWaterQuery.refetch()
        break
      case Task.TechniciansSurveyors:
        await technicianSurveyorQuery.refetch()
        break
      case Task.LandingItems:
        await landingItemsQuery.refetch()
        break
      case Task.OtherService:
        await otherServiceQuery.refetch()
        break
      case Task.AgencyRemuneration:
        await agencyRemunerationQuery.refetch()
        break
      default:
        break
    }
  }

  // Get loading state
  const isLoading =
    currentQuery?.isLoading || currentQuery?.isRefetching || false

  // Render the appropriate table based on selected task
  const renderTable = () => {
    if (!committedTaskId || committedTaskId === 0 || !hasSearched) {
      return (
        <div className="text-center">
          <p className="text-muted-foreground">
            Select a task and click Search to generate reports
          </p>
        </div>
      )
    }

    if (!currentQuery) {
      return (
        <div className="text-center">
          <p className="text-muted-foreground">
            No data available for the selected task
          </p>
        </div>
      )
    }

    const data = currentQuery.data?.data || []

    // Use Task enum for proper mapping
    switch (committedTaskId) {
      case Task.PortExpenses:
        return (
          <div className="flex h-full flex-col">
            <PortExpensesTable
              data={data as IPortExpenses[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.LaunchServices:
        return (
          <div className="flex h-full flex-col">
            <LaunchServiceTable
              data={data as ILaunchService[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.EquipmentUsed:
        return (
          <div className="flex h-full flex-col">
            <EquipmentUsedTable
              data={data as IEquipmentUsed[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.CrewSignOn:
        return (
          <div className="flex h-full flex-col">
            <CrewSignOnTable
              data={data as ICrewSignOn[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.CrewSignOff:
        return (
          <div className="flex h-full flex-col">
            <CrewSignOffTable
              data={data as ICrewSignOff[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.CrewMiscellaneous:
        return (
          <div className="flex h-full flex-col">
            <CrewMiscellaneousTable
              data={data as ICrewMiscellaneous[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.MedicalAssistance:
        return (
          <div className="flex h-full flex-col">
            <MedicalAssistanceTable
              data={data as IMedicalAssistance[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.ConsignmentImport:
        return (
          <div className="flex h-full flex-col">
            <ConsignmentImportTable
              data={data as IConsignmentImport[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.ConsignmentExport:
        return (
          <div className="flex h-full flex-col">
            <ConsignmentExportTable
              data={data as IConsignmentExport[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.ThirdParty:
        return (
          <div className="flex h-full flex-col">
            <ThirdPartyTable
              data={data as IThirdParty[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.FreshWater:
        return (
          <div className="flex h-full flex-col">
            <FreshWaterTable
              data={data as IFreshWater[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.TechniciansSurveyors:
        return (
          <div className="flex h-full flex-col">
            <TechnicianSurveyorTable
              data={data as ITechnicianSurveyor[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.LandingItems:
        return (
          <div className="flex h-full flex-col">
            <LandingItemsTable
              data={data as ILandingItems[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.OtherService:
        return (
          <div className="flex h-full flex-col">
            <OtherServiceTable
              data={data as IOtherService[]}
              isLoading={isLoading}
            />
          </div>
        )
      case Task.AgencyRemuneration:
        return (
          <div className="flex h-full flex-col">
            <AgencyRemunerationTable
              data={data as IAgencyRemuneration[]}
              isLoading={isLoading}
            />
          </div>
        )
      default:
        return (
          <div className="text-center">
            <p className="text-muted-foreground">
              No table available for the selected task
            </p>
          </div>
        )
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Compact Header */}
      <div className="flex-shrink-0 border-b px-3 py-1.5">
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-muted-foreground text-xs">
          Search and generate operational reports
        </p>
      </div>

      {/* Compact Filter Section */}
      <div className="bg-card flex-shrink-0 border-b px-3 py-2">
        <Form {...form}>
          <form>
            <div className="flex items-end gap-2">
              {/* Task Filter */}
              <div className="w-[250px]">
                <TaskAutocomplete
                  form={form}
                  name="taskId"
                  label="Task"
                  isRequired={true}
                  isDisabled={isLoading}
                />
              </div>

              {/* From Date */}
              <div className="w-[150px]">
                <CustomDateNew
                  form={form}
                  name="fromDate"
                  label="From Date"
                  isRequired={false}
                  isDisabled={isLoading}
                />
              </div>

              {/* To Date */}
              <div className="w-[150px]">
                <CustomDateNew
                  form={form}
                  name="toDate"
                  label="To Date"
                  isRequired={false}
                  isDisabled={isLoading}
                />
              </div>

              {/* Search Box */}
              <div className="w-[180px]">
                <CustomInput
                  form={form}
                  name="search"
                  label="Search"
                  isRequired={false}
                  isDisabled={isLoading}
                />
              </div>

              {/* Search Button */}
              <Button
                type="button"
                disabled={isLoading || !watchedTaskId || watchedTaskId === 0}
                className="h-9 px-6"
                onClick={() =>
                  handleSearch(form.getValues() as ReportsFilterForm)
                }
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Main Content Area - Takes remaining space with internal scrolling */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 w-full flex-col">{renderTable()}</div>
      </div>
    </div>
  )
}
