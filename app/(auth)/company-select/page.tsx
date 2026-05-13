"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ICompany } from "@/interfaces/auth"
import { useAuthStore } from "@/stores/auth-store"
import { motion, useReducedMotion } from "framer-motion"
import {
  Building2,
  Check,
  ChevronRight,
  Layers,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SafeImage } from "@/components/ui/safe-image"
import { AuthPageBackground } from "@/components/auth/auth-page-background"

// ─── Shared glass styles (mirrors the login page) ─────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(28px)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
}

const HEADER_BORDER: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.07)",
}

// ─── Gradient button (same shimmer as LoginForm) ──────────────────────────────

function GradientButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white",
        "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
      )}
      style={{
        background:
          "linear-gradient(135deg, #10b981 0%, #06b6d4 55%, #6366f1 100%)",
        boxShadow: disabled ? "none" : "0 4px 24px rgba(16,185,129,0.35)",
      }}
      whileHover={
        reduceMotion || disabled
          ? undefined
          : {
              scale: 1.015,
              boxShadow: "0 6px 32px rgba(16,185,129,0.5)",
            }
      }
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.985 }}
    >
      {!loading && (
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
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening workspace…
          </>
        ) : (
          <>
            {children}
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </span>
    </motion.button>
  )
}

// ─── Ghost / outline button ───────────────────────────────────────────────────

function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200"
      style={{
        color: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "rgba(255,255,255,0.75)"
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
        e.currentTarget.style.background = "rgba(255,255,255,0.07)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "rgba(255,255,255,0.45)"
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
        e.currentTarget.style.background = "rgba(255,255,255,0.04)"
      }}
    >
      {children}
    </button>
  )
}

// ─── Shell wrapper ─────────────────────────────────────────────────────────────

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden">
      <AuthPageBackground />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        {children}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const get = useAuthStore.getState
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const initializePage = async () => {
      if (isInitialized) return
      const currentPath = window.location.pathname
      if (currentPath !== "/company-select") return
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      setIsInitialized(true)
      setFetchError(null)
      let currentCompanies = get().companies

      if (currentCompanies.length === 0) {
        setSelectedCompanyId("")
        try {
          await getCompanies()
          currentCompanies = get().companies
          if (currentCompanies.length === 0) {
            setFetchError(
              "No companies are available for your account. Please contact your administrator."
            )
            return
          }
        } catch (err) {
          console.error("Failed to fetch companies:", err)
          setFetchError("Failed to load companies. Please try again.")
          return
        }
      }

      // Only one company — skip the selection screen automatically.
      if (currentCompanies.length === 1) {
        const singleCompany = currentCompanies[0]
        if (currentCompany?.companyId !== singleCompany.companyId) {
          await switchCompany(singleCompany.companyId, true)
        }
        router.push(`/${singleCompany.companyId}/dashboard`)
        return
      }

      // Multiple companies — pre-select the last-used one but require the
      // user to confirm by clicking Continue. Never auto-navigate.
      const tabCompanyId = getCurrentTabCompanyId()
      if (tabCompanyId && currentCompanies.some((c) => c.companyId === tabCompanyId)) {
        setSelectedCompanyId(tabCompanyId)
      } else if (currentCompany?.companyId) {
        setSelectedCompanyId(currentCompany.companyId)
      } else {
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
    setError(null)
    setIsLoading(true)
    try {
      const selectedCompany = companies.find(
        (c) => c.companyId === selectedCompanyId
      )
      if (!selectedCompany)
        throw new Error("Invalid company. Please select again.")
      if (currentCompany?.companyId !== selectedCompanyId) {
        await switchCompany(selectedCompanyId, true)
      }
      router.push(`/${selectedCompanyId}/dashboard`)
    } catch (err) {
      console.error("Company selection failed:", err)
      setError(err instanceof Error ? err.message : "Switch failed.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCompanyInitial = (company: ICompany) =>
    (company.companyCode || company.companyName || "?").charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await logOut()
    router.replace("/login")
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (!isAuthenticated || companies.length === 0) {
    return (
      <Shell>
        <motion.div
          className="text-center"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="flex flex-col items-center gap-5 rounded-3xl px-12 py-12"
            style={CARD_STYLE}
          >
            {/* Logo mark */}
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0.14) 100%)",
                border: "1px solid rgba(16,185,129,0.3)",
                boxShadow: "0 4px 20px rgba(16,185,129,0.15)",
              }}
            >
              <Layers className="h-6 w-6" style={{ color: "#10b981" }} />
            </div>

            {/* Spinner */}
            <motion.div
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2
                className="h-8 w-8"
                style={{ color: "rgba(16,185,129,0.7)" }}
              />
            </motion.div>

            <p
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {!isAuthenticated
                ? "Checking authentication…"
                : "Loading your companies…"}
            </p>
          </div>
        </motion.div>
      </Shell>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <Shell>
        <motion.div
          className="w-full max-w-md"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="overflow-hidden rounded-3xl" style={CARD_STYLE}>
            {/* Header */}
            <div className="px-8 pt-8 pb-6" style={HEADER_BORDER}>
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.28)",
                }}
              >
                <Building2 className="h-6 w-6" style={{ color: "#f43f5e" }} />
              </div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: "#fff" }}
              >
                Unable to load companies
              </h1>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {fetchError}
              </p>
            </div>

            <div className="flex flex-col gap-3 px-8 py-7">
              <GradientButton
                onClick={() => {
                  setFetchError(null)
                  setIsInitialized(false)
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </GradientButton>
              <GhostButton onClick={() => void handleSignOut()}>
                <LogOut className="h-3.5 w-3.5" />
                Use a different account
              </GhostButton>
            </div>
          </div>
        </motion.div>
      </Shell>
    )
  }

  // ── Main state ─────────────────────────────────────────────────────────────

  return (
    <Shell>
      <motion.div
        className="w-full max-w-3xl"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="overflow-hidden rounded-3xl" style={CARD_STYLE}>
          {/* ── Card header ── */}
          <div className="px-8 py-7 sm:px-10 sm:py-8" style={HEADER_BORDER}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Logo mark */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0.14) 100%)",
                    border: "1px solid rgba(16,185,129,0.28)",
                    boxShadow: "0 4px 16px rgba(16,185,129,0.12)",
                  }}
                >
                  <Layers className="h-5 w-5" style={{ color: "#10b981" }} />
                </div>
                <div>
                  <p
                    className="text-base leading-none font-semibold"
                    style={{ color: "#fff" }}
                  >
                    AMES ERP Suite
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    Enterprise Accounting & Operations Finance Suite
                  </p>
                </div>
              </div>

              {/* Sign out */}
              <GhostButton onClick={() => void handleSignOut()}>
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </GhostButton>
            </div>

            <div className="mt-6">
              <h1
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: "#fff" }}
              >
                Choose your workspace
              </h1>
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                You have access to{" "}
                <span
                  className="font-semibold"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {companies.length}{" "}
                  {companies.length === 1 ? "company" : "companies"}
                </span>
                . Select one to open your dashboard.
              </p>
            </div>
          </div>

          {/* ── Company grid ── */}
          <div className="px-8 py-7 sm:px-10 sm:py-8">
            {/* Inline error */}
            {error && (
              <motion.div
                className="mb-5 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.28)",
                }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm font-medium" style={{ color: "#f87171" }}>
                  {error}
                </p>
              </motion.div>
            )}

            <RadioGroup
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {companies.map((company: ICompany, index: number) => {
                const id = `company-radio-${company.companyId}`
                const isSelected = selectedCompanyId === company.companyId

                return (
                  <motion.div
                    key={company.companyId}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduceMotion ? 0 : index * 0.055,
                      duration: 0.38,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Hidden radio item for a11y */}
                    <RadioGroupItem
                      id={id}
                      value={company.companyId}
                      className="sr-only"
                    />

                    <motion.label
                      htmlFor={id}
                      className="relative block cursor-pointer rounded-2xl p-4 select-none"
                      style={{
                        background: isSelected
                          ? "rgba(16,185,129,0.08)"
                          : "rgba(255,255,255,0.04)",
                        border: isSelected
                          ? "1px solid rgba(16,185,129,0.38)"
                          : "1px solid rgba(255,255,255,0.09)",
                        boxShadow: isSelected
                          ? "0 0 0 1px rgba(16,185,129,0.12), 0 4px 20px rgba(16,185,129,0.12)"
                          : "none",
                        transition:
                          "background 0.2s, border-color 0.2s, box-shadow 0.2s",
                      }}
                      whileHover={
                        reduceMotion
                          ? undefined
                          : {
                              scale: 1.015,
                            }
                      }
                      whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                      transition={{ duration: 0.18 }}
                    >
                      {/* Company logo / avatar */}
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                          style={{
                            background: isSelected
                              ? "rgba(16,185,129,0.14)"
                              : "rgba(255,255,255,0.06)",
                            border: isSelected
                              ? "1px solid rgba(16,185,129,0.3)"
                              : "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <SafeImage
                            src={`/uploads/companies/${company.companyId}.svg`}
                            alt={company.companyName || "Company logo"}
                            width={44}
                            height={44}
                            className="object-contain"
                            fallbackSrc="/placeholder.svg"
                            onError={() => {}}
                          />
                          <span
                            className="hidden text-base font-bold"
                            style={{
                              color: isSelected
                                ? "#10b981"
                                : "rgba(255,255,255,0.55)",
                            }}
                          >
                            {getCompanyInitial(company)}
                          </span>
                        </div>

                        {/* Name / code */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p
                            className="truncate text-sm leading-tight font-semibold"
                            style={{
                              color: isSelected
                                ? "rgba(255,255,255,0.95)"
                                : "rgba(255,255,255,0.72)",
                            }}
                          >
                            {company.companyName}
                          </p>
                          <p
                            className="mt-1 truncate text-xs font-medium tracking-widest uppercase"
                            style={{
                              color: isSelected
                                ? "rgba(16,185,129,0.75)"
                                : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {company.companyCode || "—"}
                          </p>
                        </div>

                        {/* Selection indicator */}
                        <div
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200"
                          style={{
                            background: isSelected ? "#10b981" : "transparent",
                            border: isSelected
                              ? "none"
                              : "1.5px solid rgba(255,255,255,0.22)",
                            boxShadow: isSelected
                              ? "0 0 10px rgba(16,185,129,0.5)"
                              : "none",
                          }}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 22,
                              }}
                            >
                              <Check
                                className="h-3 w-3"
                                style={{ color: "#fff" }}
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Selected glow accent line */}
                      {isSelected && (
                        <motion.div
                          className="absolute right-4 bottom-0 left-4 h-px rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)",
                          }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.label>
                  </motion.div>
                )
              })}
            </RadioGroup>

            {/* Continue button */}
            <div className="mt-6">
              <GradientButton
                onClick={() => void handleContinue()}
                disabled={isLoading || !selectedCompanyId}
                loading={isLoading}
              >
                Continue to dashboard
              </GradientButton>
            </div>

            {/* Footer note */}
            <p
              className="mt-5 text-center text-xs"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              <Building2
                className="mr-1 inline h-3 w-3"
                style={{ verticalAlign: "-1px" }}
              />
              ERP Office · Accounting &amp; Operations
            </p>
          </div>
        </div>
      </motion.div>
    </Shell>
  )
}
