"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { getDeviceInfo, type DeviceInfo } from "@/lib/device-info"
import { IActiveSession } from "@/interfaces/auth"
import { ActiveSessionsView } from "@/components/auth/active-sessions-view"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Validation rules and helpers
 */
const validateUserName = (value: string): string | undefined => {
  if (!value.trim()) {
    return "Username is required"
  }
  if (value.trim().length < 2) {
    return "Username must be at least 2 characters"
  }
  if (value.trim().length > 50) {
    return "Username must be less than 50 characters"
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(value.trim())) {
    return "Username can only contain letters, numbers, dots, hyphens, and underscores"
  }
  return undefined
}

const validatePassword = (value: string): string | undefined => {
  if (!value) {
    return "Password is required"
  }
  if (value.length < 2) {
    return "Password must be at least 2 characters"
  }
  if (value.length > 128) {
    return "Password must be less than 128 characters"
  }
  return undefined
}

const validateForm = (userName: string, userPassword: string) => {
  const errors: { userName?: string; userPassword?: string; general?: string } =
    {}

  const userNameError = validateUserName(userName)
  const passwordError = validatePassword(userPassword)

  if (userNameError) errors.userName = userNameError
  if (passwordError) errors.userPassword = passwordError

  return errors
}

/**
 * Login Form Component
 *
 * This component provides a user interface for authentication with the following features:
 * 1. Username and password input fields with validation
 * 2. Real-time form validation
 * 3. Error handling and display
 * 4. Loading state management
 * 5. Redirect after successful login
 * 6. Links to forgot password and registration
 */
export function LoginForm({
  className,
  imageUrl,
  ...props
}: React.ComponentProps<"div"> & {
  imageUrl?: string
}) {
  // State Management
  // ---------------
  const [userName, setUserName] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<{
    userName?: string
    userPassword?: string
    general?: string
  }>({})
  const [touched, setTouched] = useState<{
    userName?: boolean
    userPassword?: boolean
    form?: boolean
  }>({})
  const [activeSessions, setActiveSessions] = useState<IActiveSession[] | null>(null)
  const [pendingDeviceInfo, setPendingDeviceInfo] = useState<DeviceInfo | undefined>()
  const { logIn, loginForce, isLoading, error } = useAuthStore()
  const router = useRouter()

  // Validation effects
  useEffect(() => {
    if (touched.userName) {
      const error = validateUserName(userName)
      setErrors((prev) => ({ ...prev, userName: error }))
    }
  }, [userName, touched.userName])

  useEffect(() => {
    if (touched.userPassword) {
      const error = validatePassword(userPassword)
      setErrors((prev) => ({ ...prev, userPassword: error }))
    }
  }, [userPassword, touched.userPassword])

  useEffect(() => {
    // Show error from auth store after login attempt
    if (error) {
      setErrors((prev) => ({ ...prev, general: error }))
    } else {
      // Clear general error when auth store error is cleared
      setErrors((prev) => ({ ...prev, general: undefined }))
    }
  }, [error])

  // Input handlers with validation
  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value)
    setErrors((prev) => ({ ...prev, general: undefined }))
    setMessage("") // Clear any status messages
    setTouched((prev) => ({ ...prev, userName: true }))

    // Clear auth store error when user starts typing
    if (error) {
      useAuthStore.setState({ error: null })
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserPassword(e.target.value)
    setErrors((prev) => ({ ...prev, general: undefined }))
    setMessage("") // Clear any status messages
    setTouched((prev) => ({ ...prev, userPassword: true }))

    // Clear auth store error when user starts typing
    if (error) {
      useAuthStore.setState({ error: null })
    }
  }

  const handleUserNameBlur = () => {
    setTouched((prev) => ({ ...prev, userName: true }))
  }

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, userPassword: true }))
  }

  /**
   * Handles form submission with validation
   * Flow:
   * 1. Validate form inputs
   * 2. Prevent default form submission
   * 3. Call login API through auth store
   * 4. Handle response
   * 5. Redirect on success
   * 6. Display message on failure
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched to trigger validation
    setTouched({ userName: true, userPassword: true })

    // Validate form
    const validationErrors = validateForm(userName, userPassword)
    setErrors(validationErrors)

    // If there are validation errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    try {
      // Mark form as touched to show errors
      setTouched((prev) => ({ ...prev, form: true }))

      // Clear previous errors and message
      setErrors({})
      setMessage("")

      const deviceInfo = getDeviceInfo()
      const loginResponse = await logIn(userName.trim(), userPassword, deviceInfo)

      if (loginResponse.result === 1 && !useAuthStore.getState().error) {
        router.push("/company-select")
      } else if (loginResponse.result === 2 && loginResponse.activeSessions?.length) {
        // Active sessions detected — show the concurrent session dialog
        setPendingDeviceInfo(deviceInfo)
        setActiveSessions(loginResponse.activeSessions)
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("Login failed:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      setErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }))
    }
  }

  const handleSignOutOthers = async (sessionIds: number[]) => {
    try {
      const response = await loginForce(userName.trim(), userPassword, sessionIds, pendingDeviceInfo)
      if (response.result === 1) {
        setActiveSessions(null)
        router.push("/company-select")
      }
    } catch {
      setActiveSessions(null)
    }
  }

  if (activeSessions) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <ActiveSessionsView
          sessions={activeSessions}
          isLoading={isLoading}
          imageUrl={imageUrl}
          onSignOutOthers={handleSignOutOthers}
          onCancel={() => setActiveSessions(null)}
        />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your account
                </p>
              </div>

              {/* Status Messages */}
              {message && (
                <Alert>
                  <AlertDescription className="text-center font-medium text-red-500">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {errors.general && (
                <Alert>
                  <AlertDescription className="text-center font-medium text-red-500">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              {/* Username Field */}
              <div className="grid gap-3">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={handleUserNameChange}
                  onBlur={handleUserNameBlur}
                  required
                  tabIndex={1}
                  className={cn(
                    errors.userName &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="Enter your username"
                />
                {errors.userName && (
                  <p className="text-sm text-red-500">{errors.userName}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="userPassword">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="userPassword"
                  type="password"
                  value={userPassword}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  required
                  tabIndex={2}
                  className={cn(
                    errors.userPassword &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="Enter your password"
                />
                {errors.userPassword && (
                  <p className="text-sm text-red-500">{errors.userPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isLoading || !userName.trim() || !userPassword}
                tabIndex={3}
                type="submit"
              >
                {isLoading ? "Logging in..." : "Log in"}
              </Button>

              {/* Registration Link */}
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>

          {/* Background Image */}
          <div className="bg-primary/50 relative hidden md:block">
            {imageUrl && (
              <Image
                fill
                src={imageUrl}
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Privacy */}
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
