"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Spinner } from "@/components/ui/spinner"

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  // Use auth-store for companies because it persists across page refreshes.
  // useCompanyStore().companies is always empty on refresh (no persistence),
  // which caused CompanyProvider to always redirect to /company-select on reload.
  const {
    switchCompany,
    isAuthenticated,
    _hasHydrated,
    companies,
    currentCompany,
    getCurrentTabCompanyId,
    setCurrentTabCompanyId,
  } = useAuthStore()
  const companyId = params.companyId as string
  const [isCompanySwitching, setIsCompanySwitching] = React.useState(false)
  const [hasSwitched, setHasSwitched] = React.useState(false)

  // Synchronously align session storage with the URL before any useEffect/API calls fire.
  // useLayoutEffect runs after render but before useEffect, so X-Company-Id header is
  // correct for every API call in this tab — including when a new tab inherits stale
  // tab_company_id from the parent (via window.open "_blank" session storage copy).
  // No _hasHydrated guard needed: companyId comes from the URL, not Zustand state.
  React.useLayoutEffect(() => {
    if (typeof window === "undefined" || !companyId) return
    const sessionCompanyId = getCurrentTabCompanyId()
    if (sessionCompanyId !== companyId) {
      setCurrentTabCompanyId(companyId)
    }
  }, [companyId, getCurrentTabCompanyId, setCurrentTabCompanyId])

  const isRouteCompanyOutOfSync =
    _hasHydrated &&
    isAuthenticated &&
    !!companyId &&
    currentCompany?.companyId !== companyId

  // console.log("🏢 CompanyProvider initialized:", {
  //   companyId,
  //   isAuthenticated,
  //   companiesCount: companies.length,
  //   currentCompanyId: currentCompany?.companyId,
  //   companies: companies.map((c) => ({
  //     companyId: c.companyId,
  //     companyName: c.companyName,
  //   })),
  // })

  React.useEffect(() => {
    // Wait for Zustand to finish rehydrating from localStorage before acting.
    // Without this guard, companies is always [] on the very first render
    // (before onRehydrateStorage fires), causing spurious redirects.
    if (!_hasHydrated) return

    // CRITICAL: Check if company switch is needed IMMEDIATELY
    if (
      isAuthenticated &&
      companyId &&
      currentCompany?.companyId !== companyId &&
      !hasSwitched
    ) {
      // console.log("🚨 IMMEDIATE COMPANY SWITCH NEEDED!")
      // console.log("🔍 Mismatch detected:", {
      //   urlCompanyId: companyId,
      //   currentCompanyId: currentCompany?.companyId,
      //   sessionStorageCompanyId: sessionStorage.getItem("tab_company_id"),
      // })

      // Verify the company exists in the available companies
      const companyExists = companies.some((c) => c.companyId === companyId)
      if (companyExists) {
        // console.log("🔄 SWITCHING COMPANY IMMEDIATELY:", companyId)
        setIsCompanySwitching(true)
        setHasSwitched(true) // Prevent re-switching
        // Switch company immediately without delay
        switchCompany(companyId).finally(() => {
          // console.log("✅ Company switch completed")
          setIsCompanySwitching(false)
        })
        return // Exit early to prevent double execution
      } else {
        // console.log("❌ Company not found, redirecting to company-select")
        router.push("/company-select")
        return
      }
    }

    // Add a small delay to allow auth store to initialize
    const timer = setTimeout(() => {
      // console.log("⏰ CompanyProvider timer executed")
      // Only run if user is authenticated
      if (!isAuthenticated) {
        // console.log("❌ User not authenticated, skipping company logic")
        return
      }
      if (companyId) {
        // console.log("🔍 Processing company ID:", companyId)
        // console.log("🔍 Company ID mismatch check:", {
        //   urlCompanyId: companyId,
        //   currentCompanyId: currentCompany?.companyId,
        //   sessionStorageCompanyId: sessionStorage.getItem("tab_company_id"),
        //   needsSwitch: currentCompany?.companyId !== companyId,
        // })

        // Verify the company exists in the available companies
        const companyExists = companies.some((c) => c.companyId === companyId)
        // console.log("✅ Company exists check:", {
        //   companyExists,
        //   availableCompanies: companies.map((c) => c.companyId),
        // })

        if (companyExists) {
          if (currentCompany?.companyId !== companyId) {
            // console.log(
            //   "🔄 COMPANY SWITCH NEEDED: URL company differs from current company"
            // )
            // console.log("🔄 Switching to company:", companyId)
            setIsCompanySwitching(true)
            switchCompany(companyId).finally(() => {
              setIsCompanySwitching(false)
            })
          }
        } else {
          // console.log("❌ Company not found, redirecting to company-select")
          router.push("/company-select")
        }
      }
      // else {
      //   console.log(
      //     "ℹ️ No company ID in URL, letting page handle its own logic"
      //   )
      //   // No company ID in URL - only redirect if we're on a path that requires company selection
      //   // This should only happen on root paths or company-select page
      //   // Don't automatically redirect - let the specific page handle its own logic
      // }
    }, 100) // Small delay to allow auth store to initialize
    return () => clearTimeout(timer)
  }, [
    _hasHydrated,
    companyId,
    switchCompany,
    companies,
    isAuthenticated,
    router,
    currentCompany?.companyId,
    hasSwitched,
  ])
  // Show loading state while company is switching
  if (isCompanySwitching || isRouteCompanyOutOfSync) {
    // console.log("⏳ Company switching in progress, showing loading state")
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto text-gray-900" />
          <p className="mt-4 text-sm text-gray-600">Switching company...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
