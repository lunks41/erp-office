"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, KeyRound, CheckCircle2, XCircle } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { AuthPageBackground } from "@/components/auth/auth-page-background"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Glass card style (matches company-select) ────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(28px)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
}

// ─── Inner component (uses useSearchParams — must be inside Suspense) ─────────

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Validate token presence on mount
  const hasToken = token.length > 0

  const passwordsMatch = password === confirm
  const passwordLongEnough = password.length >= 6

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!passwordLongEnough) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (!response.ok || data.result <= 0) {
        throw new Error(data.message || "Failed to reset password.")
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Invalid / missing token ───────────────────────────────────────────────

  if (!hasToken) {
    return (
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
      >
        <div className="flex flex-col items-center gap-6 rounded-3xl p-10 text-center" style={CARD_STYLE}>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(244,63,94,0.12)",
              border: "1px solid rgba(244,63,94,0.28)",
            }}
          >
            <XCircle className="h-7 w-7" style={{ color: "#f43f5e" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#fff" }}>
              Invalid reset link
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              This password reset link is missing or malformed. Please request a new one.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 55%, #6366f1 100%)",
              boxShadow: "0 4px 24px rgba(16,185,129,0.35)",
            }}
          >
            Request new link
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
      >
        <div className="flex flex-col items-center gap-6 rounded-3xl p-10 text-center" style={CARD_STYLE}>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(16,185,129,0.14)",
              border: "1px solid rgba(16,185,129,0.3)",
              boxShadow: "0 4px 20px rgba(16,185,129,0.15)",
            }}
          >
            <CheckCircle2 className="h-7 w-7" style={{ color: "#10b981" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#fff" }}>
              Password updated!
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Your password has been reset successfully. Redirecting you to login…
            </p>
          </div>
          <Link
            href="/login"
            className="w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 55%, #6366f1 100%)",
              boxShadow: "0 4px 24px rgba(16,185,129,0.35)",
            }}
          >
            Go to login
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="w-full max-w-[420px]"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="overflow-hidden rounded-3xl" style={CARD_STYLE}>
        {/* Header */}
        <div
          className="px-8 py-7"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0.14) 100%)",
              border: "1px solid rgba(16,185,129,0.28)",
              boxShadow: "0 4px 16px rgba(16,185,129,0.12)",
            }}
          >
            <KeyRound className="h-5 w-5" style={{ color: "#10b981" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#fff" }}>
            Set new password
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            Choose a strong password — at least 6 characters.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-7">
          {/* Error */}
          {error && (
            <motion.div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.28)",
                color: "#f87171",
              }}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* New password */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="rounded-xl border-0 pr-10 text-white placeholder:text-white/25"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-75"
                style={{ color: "rgba(255,255,255,0.4)" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="confirm"
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              Confirm password
            </Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="rounded-xl border-0 pr-10 text-white placeholder:text-white/25"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  ...(confirm && !passwordsMatch
                    ? { borderColor: "rgba(244,63,94,0.5)", boxShadow: "0 0 0 1px rgba(244,63,94,0.3)" }
                    : {}),
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-75"
                style={{ color: "rgba(255,255,255,0.4)" }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm && !passwordsMatch && (
              <p className="text-xs" style={{ color: "#f87171" }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #06b6d4 55%, #6366f1 100%)",
              boxShadow: "0 4px 24px rgba(16,185,129,0.35)",
            }}
          >
            {isLoading ? "Updating password…" : "Reset password"}
          </button>

          {/* Back to login */}
          <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium underline underline-offset-4 transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </motion.div>
  )
}

// ─── Page wrapper (Suspense required for useSearchParams) ─────────────────────

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-6 py-12">
      <AuthPageBackground />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense
          fallback={
            <div className="rounded-3xl p-10 text-center" style={CARD_STYLE}>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Loading…
              </p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
