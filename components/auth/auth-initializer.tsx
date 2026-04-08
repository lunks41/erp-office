"use client"
import React, { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { jwtDecode } from "@/lib/auth-helpers"
import { toast } from "sonner"
/**
 * Auth Initializer Component
 *
 * This component runs on app initialization and validates token expiration.
 * It ensures users with expired tokens are automatically logged out and redirected to login.
 *
 * Features:
 * 1. Client-side token validation on app start
 * 2. Automatic logout for expired tokens
 * 3. Redirect to login screen when needed
 * 4. Prevents access with invalid/expired tokens
 */
export function AuthInitializer() {
  const router = useRouter()
  const pathname = usePathname()
  const { token, isAuthenticated, logOutSuccess, isLoading } = useAuthStore()
  const [hasInitialized, setHasInitialized] = React.useState(false)
  // Public routes that don't require authentication
  const publicRoutes = useMemo(
    () => [
      "/login",
      "/register",
      "/forgot-password",
      "/pdf-tools",
      "/erp-tools",
      "/ai",
      "/reports",
    ],
    []
  )
  // Allow auth store to initialize before checking authentication
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasInitialized(true)
    }, 100) // Small delay to allow store initialization
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    // Skip validation if we're on a public route
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return
    }
    // Skip if not initialized yet
    if (!hasInitialized) {
      return
    }
    // Skip if already loading (to prevent multiple validations)
    if (isLoading) {
      return
    }
    // Only run validation if we have both authentication state and token
    // This prevents interference with login process
    if (isAuthenticated && token) {
      try {
        const decoded = jwtDecode(token)
        if (!decoded || !decoded.exp) {
          logOutSuccess()
          router.push("/login")
          return
        }
        const isExpired = Date.now() >= decoded.exp * 1000
        if (isExpired) {
          toast.error("Session Expired", {
            description: "Your session has expired. Please log in again.",
            duration: 3000,
          })
          logOutSuccess()
          router.push("/login")
          return
        }
        // Check if token expires soon (within 5 minutes)
        const expiresIn = decoded.exp * 1000 - Date.now()
        const expiresSoon = expiresIn < 5 * 60 * 1000 // 5 minutes
        if (expiresSoon) {
          // The automatic refresh system will handle this
        }
        } catch (error) {
        console.error(
          "❌ [AuthInitializer] Token validation error, logging out:",
          error
        )
        logOutSuccess()
        router.push("/login")
      }
    } else if (
      !isAuthenticated &&
      !publicRoutes.some((route) => pathname.startsWith(route))
    ) {
      // User is not authenticated and trying to access protected route
      router.push("/login")
    }
  }, [
    isAuthenticated,
    token,
    logOutSuccess,
    router,
    pathname,
    isLoading,
    publicRoutes,
    hasInitialized,
  ])
  // This component doesn't render anything
  return null
}
/**
 * Hook to check if current route is public
 */
export function useIsPublicRoute(): boolean {
  const pathname = usePathname()
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/pdf-tools",
    "/erp-tools",
    "/ai",
    "/reports",
  ]
  return publicRoutes.some((route) => pathname.startsWith(route))
}
