"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { useAuthStore } from "@/stores/auth-store"

import { AuthPageBackground } from "@/components/auth/auth-page-background"
import { LoginHeroPanel } from "@/components/auth/login-hero-panel"
import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  const { isAuthenticated, logInStatusCheck, isLoading, forceLogout } =
    useAuthStore()
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await logInStatusCheck()
        if (isAuthenticated) {
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
      {/* Dark animated background — visible on all breakpoints */}
      <AuthPageBackground />

      {/* Left: hero panel — hidden below lg */}
      <div className="relative hidden lg:block lg:w-[58%] xl:w-[60%]">
        <LoginHeroPanel />
      </div>

      {/* Right: glassmorphism form — full-width on mobile, 42% on lg+ */}
      <motion.div
        className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-12 sm:px-10 lg:w-[42%] xl:w-[40%]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
      >
        <LoginForm className="w-full max-w-[420px]" />
      </motion.div>
    </div>
  )
}
