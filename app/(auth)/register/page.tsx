"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

import { RegistrationForm } from "@/app/(auth)/register/components/registration-form"

export default function RegisterPage() {
  const { isAuthenticated, logInStatusCheck } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const checkAuthStatus = async () => {
      await logInStatusCheck()
      if (isAuthenticated) {
        router.push("/")
      }
    }
    checkAuthStatus()
  }, [isAuthenticated, logInStatusCheck, router])

  return (
    <div className="bg-muted dark:bg-background flex flex-1 flex-col items-center justify-center gap-16 p-6 md:p-50">
      <div className="theme-login-one w-full max-w-sm md:max-w-3xl">
        <RegistrationForm imageUrl="https://images.unsplash.com/photo-1482872376051-5ce74ebf0908?q=80&w=3050&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
      </div>
    </div>
  )
}
