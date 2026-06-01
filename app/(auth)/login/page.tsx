"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

import { AuthPageBackground } from "@/components/auth/auth-page-background"
import { LoginHeroPanel } from "@/components/auth/login-hero-panel"
import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  const { isAuthenticated, logInStatusCheck, isLoading, forceLogout } =
    useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await logInStatusCheck()
        if (useAuthStore.getState().isAuthenticated) {
          router.push("/company-select")
        }
      } catch {
        forceLogout()
      }
    }
    checkAuthStatus()
  }, [isAuthenticated, logInStatusCheck, router, forceLogout])

  useEffect(() => {
    if (isLoading && !isAuthenticated) {
      const timer = setTimeout(() => forceLogout(), 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, forceLogout])

  return (
    <div className="relative flex min-h-dvh w-full overflow-hidden">
      <AuthPageBackground />

      <div className="relative hidden lg:block lg:w-[58%] xl:w-[60%]">
        <LoginHeroPanel />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:w-[42%] xl:w-[40%]">
        <LoginForm className="w-full max-w-[420px]" />
      </div>
    </div>
  )
}
