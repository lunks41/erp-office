"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function HRSettingRedirectPage() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Get the base path (e.g., /1/hr/setting) and redirect to work-location
    const basePath = pathname.replace(/\/$/, "") // Remove trailing slash if any
    router.replace(`${basePath}/work-location`)
  }, [router, pathname])

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground text-sm">
            Redirecting to Work Location settings...
          </p>
        </div>
      </div>
    </div>
  )
}
