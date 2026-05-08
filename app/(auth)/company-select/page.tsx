"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ICompany } from "@/interfaces/auth"
import { useAuthStore } from "@/stores/auth-store"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SafeImage } from "@/components/ui/safe-image"

export default function CompanySelectPage() {
  const {
    isAuthenticated,
    companies,
    currentCompany,
    switchCompany,
    getCompanies,
    getCurrentTabCompanyId,
    logOut,
  } = useAuthStore()

  // Get the store's get function to access fresh state
  const get = useAuthStore.getState
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const initializePage = async () => {
      // Prevent multiple initializations
      if (isInitialized) {
        return
      }

      // Check if we're actually on the company-select page
      const currentPath = window.location.pathname
      if (currentPath !== "/company-select") {
        return
      }
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // Mark as initialized to prevent re-runs
      setIsInitialized(true)
      setFetchError(null)

      // Use companies already loaded during login; only fetch if empty
      let currentCompanies = get().companies

      if (currentCompanies.length === 0) {
        setSelectedCompanyId("")
        try {
          await getCompanies()
          currentCompanies = get().companies

          if (currentCompanies.length === 0) {
            setFetchError("No companies are available for your account. Please contact your administrator.")
            return
          }
        } catch (error) {
          console.error("❌ Failed to fetch companies:", error)
          setFetchError("Failed to load companies. Please try again.")
          return
        }
      }

      // Check if we have a company ID from the current tab (for new tabs)
      const tabCompanyId = getCurrentTabCompanyId()
      if (tabCompanyId) {
        // Verify the company exists in the companies list
        const companyExists = currentCompanies.some(
          (c) => c.companyId === tabCompanyId
        )
        if (companyExists) {
          //console.log("🔄 Auto-switching to tab company:", tabCompanyId)
          // Switch to the company if not already selected (with automatic decimal fetching)
          if (currentCompany?.companyId !== tabCompanyId) {
            await switchCompany(tabCompanyId, true) // fetchDecimals = true (automatic)
          }
          // Redirect to dashboard
          router.push(`/${tabCompanyId}/dashboard`)
          return
        } else {
          //console.log("⚠️ Tab company not found in available companies")
        }
      }

      // If only one company, automatically select and redirect
      if (currentCompanies.length === 1) {
        const singleCompany = currentCompanies[0]
        //console.log(
        //  "🔄 Auto-selecting single company:",
        //  singleCompany.companyId
        //)
        // Switch to the single company if not already selected (with automatic decimal fetching)
        if (currentCompany?.companyId !== singleCompany.companyId) {
          await switchCompany(singleCompany.companyId, true) // fetchDecimals = true (automatic)
        }
        // Redirect to dashboard
        router.push(`/${singleCompany.companyId}/dashboard`)
        return
      }

      // Multiple companies - show selection page
      // console.log("📋 Multiple companies found - showing selection page")
      // Use the current company or first available
      if (currentCompany?.companyId) {
        setSelectedCompanyId(currentCompany.companyId)
      } else if (currentCompanies.length > 0) {
        setSelectedCompanyId(currentCompanies[0].companyId)
      }
    }
    initializePage()
  }, [
    isAuthenticated,
    isInitialized,
    getCompanies,
    getCurrentTabCompanyId,
    switchCompany,
    router,
    get,
    currentCompany?.companyId,
  ])
  const handleContinue = async () => {
    if (!selectedCompanyId) return
    console.log("🎯 COMPANY-SELECT: User clicked Continue")
    console.log("📊 Selected Company ID:", selectedCompanyId)
    setError(null)
    setIsLoading(true)
    try {
      const selectedCompany = companies.find(
        (c) => c.companyId === selectedCompanyId
      )
      if (!selectedCompany) {
        throw new Error("Invalid company. Please select again.")
      }
      // Switch company with automatic decimal fetching
      if (currentCompany?.companyId !== selectedCompanyId) {
        console.log("🔄 STEP 2: Switching to company:", selectedCompanyId)
        // Await to ensure decimals are loaded before navigation
        await switchCompany(selectedCompanyId, true) // fetchDecimals = true
        console.log("✅ STEP 2 COMPLETE: Company switch finished")
      } else {
        console.log("ℹ️ Company already selected, skipping switch")
      }
      // Navigate to dashboard after company data is loaded
      console.log("🚀 STEP 3: Navigating to dashboard")
      router.push(`/${selectedCompanyId}/dashboard`)
    } catch (err) {
      console.error("❌ Company selection failed:", err)
      setError(err instanceof Error ? err.message : "Switch failed.")
    } finally {
      setIsLoading(false)
    }
  }
  // Get the first letter of company code or name as fallback
  const getCompanyInitial = (company: ICompany) => {
    return (company.companyCode || company.companyName || "?")
      .charAt(0)
      .toUpperCase()
  }
  if (fetchError) {
    return (
      <div className="bg-muted dark:bg-background flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tighter">Unable to Load Companies</h1>
            <p className="text-muted-foreground">{fetchError}</p>
          </div>
          <div className="flex flex-col justify-center gap-2 min-[400px]:flex-row">
            <Button onClick={() => { setFetchError(null); setIsInitialized(false) }}>
              Try Again
            </Button>
            <Button variant="outline" onClick={async () => { await logOut(); router.replace("/login") }}>
              Login with a different account
            </Button>
          </div>
        </div>
      </div>
    )
  }
  // Show loading while companies are being fetched or while auto-redirecting
  if (!isAuthenticated || companies.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            {!isAuthenticated
              ? "Checking authentication..."
              : "Loading companies..."}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-muted dark:bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Select Your Company</CardTitle>
          <CardDescription>
            You have access to multiple companies. Choose one below to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <Label className="block">Companies</Label>
            <RadioGroup
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {companies.map((company: ICompany) => (
                <Card
                  key={company.companyId}
                  onClick={() => setSelectedCompanyId(company.companyId)}
                  className={`cursor-pointer space-y-1 border p-4 transition-shadow hover:shadow-lg ${
                    selectedCompanyId === company.companyId
                      ? "border-indigo-500 shadow"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
                      <SafeImage
                        src={`/uploads/companies/${company.companyId}.svg`}
                        alt={company.companyName || "Company Logo"}
                        width={40}
                        height={40}
                        className="object-contain"
                        fallbackSrc="/placeholder.svg"
                        onError={() => {}}
                      />
                      <span className="hidden text-lg font-medium">
                        {getCompanyInitial(company)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-medium">
                          {company.companyName}
                        </span>
                        <RadioGroupItem
                          value={company.companyId}
                          className="!bg-transparent"
                        />
                      </div>
                      <span className="text-muted-foreground truncate text-sm">
                        {company.companyCode || "No Code"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </RadioGroup>
          </div>
          <Button
            className="mt-6 w-full"
            onClick={handleContinue}
            disabled={isLoading || !selectedCompanyId}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
