"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

import { LoginForm } from "@/components/forms/login-form"
export default function LoginPage() {
  const { isAuthenticated, logInStatusCheck, isLoading, forceLogout, error } =
    useAuthStore()
  const router = useRouter()
  // Check if user is already logged in when the page loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        //console.log("🔍 Checking authentication status...")
        await logInStatusCheck()
        //console.log("✅ Authentication check completed")
        // If user is authenticated, redirect to company select page
        if (isAuthenticated) {
          //console.log("🔄 User authenticated, redirecting to company-select")
          router.push("/company-select")
        }
      } catch (error) {
        console.error("❌ Auth status check failed:", error)
        // Force logout to clear any invalid state
        forceLogout()
      }
    }
    checkAuthStatus()
  }, [isAuthenticated, logInStatusCheck, router, forceLogout])
  // Ensure loading state is properly reset on login page
  useEffect(() => {
    // Reset loading state when login page mounts
    if (isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        forceLogout()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, forceLogout])
  // Clear any authentication errors when page loads
  useEffect(() => {
    if (error) {
    }
  }, [error])
  return (
    <div className="bg-muted dark:bg-background flex flex-1 flex-col items-center justify-center gap-16 p-6 md:p-50">
      <div className="theme-login-one w-full max-w-sm md:max-w-3xl">
        <LoginForm imageUrl="https://images.unsplash.com/photo-1482872376051-5ce74ebf0908?q=80&w=3050&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
      </div>
    </div>
  )
}
