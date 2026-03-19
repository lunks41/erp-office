"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { IPayrollDashboard } from "@/interfaces/payrun"

import { useGet } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ProcessPayRunCard } from "./components/pay-run-card"
import { PayRunHistoryTable } from "./components/pay-run-history-table"

export default function PayRunsPage() {
  console.log("🔄 PayRunsPage: Component rendered")

  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string
  const [activeTab, setActiveTab] = useState("run-payroll")

  console.log("📡 PayRunsPage: Calling useGet hook for dashboard data")
  const { data: payRunData, refetch } = useGet<IPayrollDashboard>(
    `/hr/payrollruns/dashboard`,
    "pay-run"
  )
  const payRun = payRunData?.data as unknown as IPayrollDashboard

  console.log("📊 PayRunsPage: Dashboard data received:", payRunData)
  console.log("👥 PayRunsPage: Processed payRun:", payRun)

  // Check if refetch is requested via URL parameter
  useEffect(() => {
    console.log(
      "🔄 PayRunsPage: useEffect triggered - checking refetch parameter"
    )
    if (searchParams.get("refetch") === "true") {
      console.log("🔄 PayRunsPage: Refetch requested, calling refetch()")
      refetch()
      // Remove the refetch parameter from URL
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete("refetch")
      router.replace(`/${companyId}/hr/payruns?${newSearchParams.toString()}`)
    }
  }, [searchParams, refetch, companyId, router])

  const handleProcess = async (payrollRunId?: number) => {
    console.log("🚀 PayRunsPage: handleProcess called with ID:", payrollRunId)
    if (payrollRunId) {
      router.push(`/${companyId}/hr/payruns/${payrollRunId}/preview`)
    }
  }

  const handleApprove = (payrollRunId?: number) => {
    console.log("✅ PayRunsPage: handleApprove called with ID:", payrollRunId)
    if (payrollRunId) {
      router.push(`/${companyId}/hr/payruns/${payrollRunId}/summary`)
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Pay Runs
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage payroll processing and payment history
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 gap-2">
          <TabsTrigger value="run-payroll" className="text-xs sm:text-sm">
            Run Payroll
          </TabsTrigger>
          <TabsTrigger value="payroll-history" className="text-xs sm:text-sm">
            Payroll History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="run-payroll" className="space-y-4">
          {payRun && !payRun.isPaid && (
            <ProcessPayRunCard
              payRun={payRun}
              onProcess={handleProcess}
              onDraft={handleProcess}
              onApprove={handleApprove}
            />
          )}
          {payRun && payRun.isPaid && (
            <div className="rounded-md border p-4">
              <p className="text-muted-foreground text-sm">
                Payroll has already been processed and paid.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payroll-history" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Payroll Type:</span>
              <Badge variant="outline">All</Badge>
            </div>
          </div>
          <PayRunHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
