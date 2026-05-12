"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCompanyStore } from "@/stores/company-store"
import { Building, Calendar, TrendingUp, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CompanyDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { currentCompany, companies } = useCompanyStore()
  const companyId = params.companyId as string

  useEffect(() => {
    // Check if the company exists in the available companies
    const companyExists = companies.some((c) => c.companyId === companyId)

    if (!companyExists) {
      console.error(
        `Company with ID ${companyId} not found in available companies:`,
        companies
      )
      router.push("/company-select")
      return
    }

    // Verify that the company ID in the URL matches the current company
    if (currentCompany?.companyId !== companyId) {
      console.error("Company ID mismatch")
      router.push("/company-select")
      return
    }
  }, [companyId, currentCompany, companies, router])

  // If company doesn't exist or doesn't match, show loading state
  if (!currentCompany || currentCompany.companyId !== companyId) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"></div>
          </div>
          <h1 className="mb-2 text-xl font-semibold sm:text-2xl">Loading...</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Please wait while we verify your company access...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="@container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Welcome to {currentCompany?.companyName}
        </p>
      </div>

      {/* Company Information Card */}
      <div className="mb-6 sm:mb-8">
        <Card className="border-l-primary border-l-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Building className="text-primary h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Company ID
                </p>
                <p className="text-base font-semibold">{companyId}</p>
              </div>
              {currentCompany && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Company Name
                  </p>
                  <p className="text-base font-semibold">
                    {currentCompany.companyName}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="h-5 w-5 text-muted-foreground dark:text-blue-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Total Employees
                </p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Present Today
                </p>
                <p className="text-2xl font-bold">1,156</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Attendance Rate
                </p>
                <p className="text-2xl font-bold">93.7%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Departments
                </p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 text-left transition-colors">
                <Users className="text-primary h-5 w-5" />
                <div>
                  <p className="font-medium">Manage Employees</p>
                  <p className="text-muted-foreground text-sm">
                    Add, edit, or view employees
                  </p>
                </div>
              </button>

              <button className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 text-left transition-colors">
                <Calendar className="text-primary h-5 w-5" />
                <div>
                  <p className="font-medium">Attendance</p>
                  <p className="text-muted-foreground text-sm">
                    View attendance records
                  </p>
                </div>
              </button>

              <button className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 text-left transition-colors">
                <TrendingUp className="text-primary h-5 w-5" />
                <div>
                  <p className="font-medium">Reports</p>
                  <p className="text-muted-foreground text-sm">
                    Generate reports
                  </p>
                </div>
              </button>

              <button className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 text-left transition-colors">
                <Building className="text-primary h-5 w-5" />
                <div>
                  <p className="font-medium">Settings</p>
                  <p className="text-muted-foreground text-sm">
                    Configure system settings
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
