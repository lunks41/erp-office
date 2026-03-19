"use client"

import { useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { EmployeeSalaryReport } from "./components/employee-salary-report"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("employee-salary")

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight sm:text-3xl">
            Reports
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage reports and information
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center sm:justify-start">
          <TabsList>
            <TabsTrigger
              value="employee-salary"
              className="hover:bg-muted/50 px-4 py-3 text-xs transition-all duration-200 sm:px-3 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">Employee Salary</span>
              <span className="sm:hidden">Salary</span>
            </TabsTrigger>
            <TabsTrigger
              value="employee-details"
              className="hover:bg-muted/50 px-4 py-3 text-xs transition-all duration-200 sm:px-3 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">Employee Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="employee-vacation"
              className="hover:bg-muted/50 px-4 py-3 text-xs transition-all duration-200 sm:px-3 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">Employee Vacation</span>
              <span className="sm:hidden">Vacation</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          <TabsContent value="employee-salary" className="mt-0 space-y-4">
            <EmployeeSalaryReport />
          </TabsContent>

          <TabsContent value="employee-details" className="mt-0 space-y-4">
            {/* <EmployeeDetailsReport /> */}
          </TabsContent>

          <TabsContent value="employee-vacation" className="mt-0 space-y-4">
            {/* <EmployeeVacationReport /> */}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
