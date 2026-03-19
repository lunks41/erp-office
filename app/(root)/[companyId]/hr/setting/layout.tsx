"use client"

import { usePathname, useRouter } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HRSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  // Extract the current tab from the pathname
  const getCurrentTab = () => {
    if (pathname.includes("/work-location")) return "work-location"
    if (pathname.includes("/designation")) return "designation"
    if (pathname.includes("/department")) return "department"
    if (pathname.includes("/payroll-components")) return "payroll-components"

    if (pathname.includes("/pay-schedule")) return "pay-schedule"
    if (pathname.includes("/account-integration")) return "account-integration"
    if (pathname.includes("/employer")) return "employer"
    // If we're at the root /hr/setting path, return work-location as default
    if (pathname.endsWith("/hr/setting") || pathname.endsWith("/hr/setting/")) {
      return "work-location"
    }
    return "work-location" // default
  }

  const handleTabChange = (value: string) => {
    // Get the base path (e.g., /1/hr/setting) and navigate to the specific tab
    const basePath = pathname.split("/hr/setting")[0] + "/hr/setting"
    router.push(`${basePath}/${value}`)
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight sm:text-3xl">
            Settings
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage HR system settings and configurations
          </p>
        </div>
      </div>

      <Tabs
        value={getCurrentTab()}
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="work-location" className="text-xs sm:text-sm">
            Work Location
          </TabsTrigger>
          <TabsTrigger value="designation" className="text-xs sm:text-sm">
            Designation
          </TabsTrigger>
          <TabsTrigger value="department" className="text-xs sm:text-sm">
            Department
          </TabsTrigger>
          <TabsTrigger
            value="payroll-components"
            className="text-xs sm:text-sm"
          >
            Payroll Components
          </TabsTrigger>
          <TabsTrigger value="pay-schedule" className="text-xs sm:text-sm">
            Pay Schedule
          </TabsTrigger>
          <TabsTrigger
            value="account-integration"
            className="text-xs sm:text-sm"
          >
            Account Integration
          </TabsTrigger>
          <TabsTrigger value="employer" className="text-xs sm:text-sm">
            Employer Details
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </div>
  )
}
