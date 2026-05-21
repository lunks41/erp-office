import { SessionExpiryProvider } from "@/components/auth/session-expiry-provider"
import { CompanyAppChrome } from "@/components/layout/company-app-chrome"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SessionExpiryProvider>
      <CompanyAppChrome>
        {children}
      </CompanyAppChrome>
    </SessionExpiryProvider>
  )
}
