"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IActiveSession } from "@/interfaces/auth"
import { useAuthStore } from "@/stores/auth-store"
import { motion, useReducedMotion } from "framer-motion"
import { Eye, EyeOff, Layers, Loader2, Lock, User } from "lucide-react"

import { getDeviceInfo, type DeviceInfo } from "@/lib/device-info"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ActiveSessionsView } from "@/components/auth/active-sessions-view"

// ─── Animation variants ───────────────────────────────────────────────────────

const fieldList = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const fieldItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// ─── Validation ───────────────────────────────────────────────────────────────

const validateUserName = (value: string): string | undefined => {
  if (!value.trim()) return "Username is required"
  if (value.trim().length < 2) return "Username must be at least 2 characters"
  if (value.trim().length > 50)
    return "Username must be less than 50 characters"
  if (!/^[a-zA-Z0-9_.-]+$/.test(value.trim()))
    return "Only letters, numbers, dots, hyphens and underscores"
  return undefined
}

const validatePassword = (value: string): string | undefined => {
  if (!value) return "Password is required"
  if (value.length < 2) return "Password must be at least 2 characters"
  if (value.length > 128) return "Password must be less than 128 characters"
  return undefined
}

const validateForm = (userName: string, userPassword: string) => {
  const errors: { userName?: string; userPassword?: string } = {}
  const u = validateUserName(userName)
  const p = validatePassword(userPassword)
  if (u) errors.userName = u
  if (p) errors.userPassword = p
  return errors
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(28px)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
}

const INPUT_CLASS =
  "bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30 " +
  "focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 " +
  "hover:border-white/20 transition-colors duration-200 h-11 pl-10"

const LABEL_CLASS = "text-white/70 text-sm font-medium"

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const reduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [userName, setUserName] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
  const [activeSessions, setActiveSessions] = useState<IActiveSession[] | null>(
    null
  )
  const [pendingDeviceInfo, setPendingDeviceInfo] = useState<
    DeviceInfo | undefined
  >()

  const { logIn, loginForce, isLoading, error } = useAuthStore()
  const router = useRouter()

  // Validation effects
  useEffect(() => {
    if (touched.userName)
      setErrors((prev) => ({ ...prev, userName: validateUserName(userName) }))
  }, [userName, touched.userName])

  useEffect(() => {
    if (touched.userPassword)
      setErrors((prev) => ({
        ...prev,
        userPassword: validatePassword(userPassword),
      }))
  }, [userPassword, touched.userPassword])

  useEffect(() => {
    if (error) setErrors((prev) => ({ ...prev, general: error }))
    else setErrors((prev) => ({ ...prev, general: undefined }))
  }, [error])

  // Handlers
  const clearGeneralError = () => {
    setErrors((prev) => ({ ...prev, general: undefined }))
    if (error) useAuthStore.setState({ error: null })
  }

  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value)
    setTouched((prev) => ({ ...prev, userName: true }))
    clearGeneralError()
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserPassword(e.target.value)
    setTouched((prev) => ({ ...prev, userPassword: true }))
    clearGeneralError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ userName: true, userPassword: true })
    const validationErrors = validateForm(userName, userPassword)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      setTouched((prev) => ({ ...prev, form: true }))
      setErrors({})

      const deviceInfo = getDeviceInfo()
      const loginResponse = await logIn(
        userName.trim(),
        userPassword,
        deviceInfo
      )

      if (loginResponse.result === 1 && !useAuthStore.getState().error) {
        router.push("/company-select")
      } else if (
        loginResponse.result === 2 &&
        loginResponse.activeSessions?.length
      ) {
        const sameDevice = loginResponse.activeSessions.find(
          (s) =>
            s.platform === deviceInfo?.platform &&
            s.screenResolution === deviceInfo?.screenResolution
        )
        if (sameDevice) {
          const forced = await loginForce(
            userName.trim(),
            userPassword,
            [sameDevice.sessionId],
            deviceInfo
          )
          if (forced.result === 1) router.push("/company-select")
        } else {
          setPendingDeviceInfo(deviceInfo)
          setActiveSessions(loginResponse.activeSessions)
        }
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Login failed. Please try again."
      setErrors((prev) => ({ ...prev, general: msg }))
    }
  }

  const handleSignOutOthers = async (sessionIds: number[]) => {
    try {
      const response = await loginForce(
        userName.trim(),
        userPassword,
        sessionIds,
        pendingDeviceInfo
      )
      if (response.result === 1) {
        setActiveSessions(null)
        router.push("/company-select")
      }
    } catch {
      setActiveSessions(null)
    }
  }

  // Active sessions overlay
  if (activeSessions) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="rounded-2xl p-6" style={CARD_STYLE}>
          <ActiveSessionsView
            sessions={activeSessions}
            isLoading={isLoading}
            onSignOutOthers={handleSignOutOthers}
            onCancel={() => setActiveSessions(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-0", className)} {...props}>
      <motion.div
        initial={!mounted || reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glass card */}
        <div className="overflow-hidden rounded-3xl" style={CARD_STYLE}>
          <form onSubmit={handleSubmit}>
            <div className="px-8 pt-9 pb-2 sm:px-10">
              {/* Logo + welcome */}
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fieldList}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={fieldItem}
                  className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0.14) 100%)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    boxShadow: "0 4px 20px rgba(16,185,129,0.15)",
                  }}
                >
                  <Layers className="h-6 w-6" style={{ color: "#10b981" }} />
                </motion.div>

                <motion.h2
                  variants={fieldItem}
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "#fff" }}
                >
                  Welcome back
                </motion.h2>
                <motion.p
                  variants={fieldItem}
                  className="mt-1.5 text-sm"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Sign in to your AMES ERP Suite workspace
                </motion.p>
              </motion.div>
            </div>

            {/* Fields */}
            <motion.div
              className="flex flex-col gap-4 px-8 py-6 sm:px-10"
              variants={fieldList}
              initial="hidden"
              animate="visible"
            >
              {/* General error */}
              {errors.general && (
                <motion.div variants={fieldItem}>
                  <Alert
                    className="border-red-500/30 bg-red-500/10"
                    style={{ backdropFilter: "blur(8px)" }}
                  >
                    <AlertDescription className="text-center text-sm font-medium text-red-400">
                      {errors.general}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Username */}
              <motion.div variants={fieldItem} className="grid gap-2">
                <Label htmlFor="userName" className={LABEL_CLASS}>
                  Username
                </Label>
                <div className="relative">
                  <User
                    className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                  <Input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={handleUserNameChange}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, userName: true }))
                    }
                    required
                    tabIndex={1}
                    placeholder="Enter your username"
                    className={cn(
                      INPUT_CLASS,
                      errors.userName &&
                        "border-red-500/50 focus-visible:border-red-500/60 focus-visible:ring-red-500/40"
                    )}
                    autoComplete="username"
                  />
                </div>
                {errors.userName && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400"
                  >
                    {errors.userName}
                  </motion.p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div variants={fieldItem} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="userPassword" className={LABEL_CLASS}>
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium transition-colors duration-200"
                    style={{ color: "rgba(16,185,129,0.75)" }}
                    tabIndex={-1}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "rgba(16,185,129,1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(16,185,129,0.75)")
                    }
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                  <Input
                    id="userPassword"
                    type={showPassword ? "text" : "password"}
                    value={userPassword}
                    onChange={handlePasswordChange}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, userPassword: true }))
                    }
                    required
                    tabIndex={2}
                    placeholder="Enter your password"
                    className={cn(
                      INPUT_CLASS,
                      "pr-11",
                      errors.userPassword &&
                        "border-red-500/50 focus-visible:border-red-500/60 focus-visible:ring-red-500/40"
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.65)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.userPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400"
                  >
                    {errors.userPassword}
                  </motion.p>
                )}
              </motion.div>

              {/* Remember me */}
              <motion.div
                variants={fieldItem}
                className="flex items-center gap-2.5"
              >
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(Boolean(v))}
                  className="border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                  tabIndex={3}
                />
                <Label
                  htmlFor="rememberMe"
                  className="cursor-pointer text-sm"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Remember me for 30 days
                </Label>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fieldItem}>
                <motion.button
                  type="submit"
                  disabled={isLoading || !userName.trim() || !userPassword}
                  tabIndex={4}
                  className={cn(
                    "relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-semibold text-white",
                    "transition-all duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #06b6d4 55%, #6366f1 100%)",
                    boxShadow: isLoading
                      ? "none"
                      : "0 4px 24px rgba(16,185,129,0.35)",
                  }}
                  whileHover={
                    reduceMotion || isLoading
                      ? undefined
                      : {
                          scale: 1.015,
                          boxShadow: "0 6px 32px rgba(16,185,129,0.5)",
                        }
                  }
                  whileTap={
                    reduceMotion || isLoading ? undefined : { scale: 0.985 }
                  }
                >
                  {/* Shimmer */}
                  {!isLoading && (
                    <motion.div
                      className="absolute inset-0 -skew-x-12"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 1.2,
                      }}
                    />
                  )}
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? "Signing in…" : "Sign in"}
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </form>

          {/* Divider + sign-up */}
          <div className="px-8 pb-8 sm:px-10">
            <div
              className="mb-5 h-px"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />
            <p
              className="text-center text-sm"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium transition-colors duration-200"
                style={{ color: "rgba(16,185,129,0.85)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#10b981")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(16,185,129,0.85)")
                }
              >
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p
          className="mt-5 text-center text-xs"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          By signing in you agree to our{" "}
          <a
            href="#"
            className="underline underline-offset-2 transition-colors duration-200 hover:text-white/40"
          >
            Terms
          </a>{" "}
          &amp;{" "}
          <a
            href="#"
            className="underline underline-offset-2 transition-colors duration-200 hover:text-white/40"
          >
            Privacy Policy
          </a>
          .
        </p>
      </motion.div>
    </div>
  )
}
