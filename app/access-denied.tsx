"use client"

import {
  Manrope as FontManrope,
  Lexend as FontSans,
  Newsreader as FontSerif,
} from "next/font/google"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import Cookies from "js-cookie"
import { ArrowLeft, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const fontSans = FontSans({ subsets: ["latin"], variable: "--font-sans" })
const fontSerif = FontSerif({ subsets: ["latin"], variable: "--font-serif" })
const fontManrope = FontManrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

export default function AccessDenied() {
  const router = useRouter()
  const { logOut, setCompanies } = useAuthStore()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = "/"
    }
  }

  const handleLoginWithDifferentAccount = async () => {
    try {
      //console.log("🔄 Clearing session for different account login...")
      // Clear all session data
      await logOut()
      Cookies.remove("auth-token", { path: "/" })
      Cookies.remove("selectedCompanyId", { path: "/" })
      Cookies.remove("tab_company_id", { path: "/" })

      // Clear company data
      setCompanies([])

      // Clear session storage
      if (typeof window !== "undefined") {
        sessionStorage.clear()
      }

      //console.log("✅ Session cleared, redirecting to login...")
      router.push("/login")
    } catch (error) {
      console.error("❌ Error clearing session:", error)
      // Force redirect even if logout fails
      router.push("/login")
    }
  }

  return (
    <div
      className={cn(
        "bg-muted dark:bg-background flex min-h-screen flex-col items-center justify-center p-4 text-center",
        fontSans.variable,
        fontSerif.variable,
        fontManrope.variable
      )}
    >
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <ShieldAlert className="text-destructive h-24 w-24" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Access Denied
          </h1>
          <p className="text-muted-foreground md:text-lg">
            Sorry, you do not have permission to access this page.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-2 min-[400px]:flex-row">
          <Button onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Button variant="outline" onClick={handleLoginWithDifferentAccount}>
            Login with a different account
          </Button>
        </div>
      </div>
    </div>
  )
}
