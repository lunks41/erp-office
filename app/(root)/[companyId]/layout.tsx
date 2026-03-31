import { cookies } from "next/headers"

import { SessionExpiryProvider } from "@/components/auth/session-expiry-provider"
import { CompanyAppChrome } from "@/components/layout/company-app-chrome"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SessionExpiryProvider>
      <CompanyAppChrome defaultSidebarOpen={defaultSidebarOpen}>
        {children}
      </CompanyAppChrome>
    </SessionExpiryProvider>
  )
}
