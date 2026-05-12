"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
  Heart,
  Lightbulb,
  Rocket,
  Sparkles,
  Star,
  Target,
  Wind,
  Zap,
} from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

import { AFFIRMATIONS, ONE_THING_TODAY, QUOTES, TIPS_OF_DAY } from "./content"

const ROTATE_MIN_MS = 50_000
const ROTATE_MAX_MS = 60_000

function randomIndex(length: number) {
  return length > 0 ? Math.floor(Math.random() * length) : 0
}

function nextRotateDelayMs() {
  return ROTATE_MIN_MS + Math.random() * (ROTATE_MAX_MS - ROTATE_MIN_MS)
}

/** Returns exactly 6 tips for today; which 6 changes each day based on date. */
function getTipsForToday(tips: string[]): string[] {
  if (tips.length === 0) return []
  const startOfYear = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - startOfYear.getTime()) / 86_400_000)
  const startIndex = dayOfYear % tips.length
  return Array.from({ length: 6 }, (_, i) => tips[(startIndex + i) % tips.length])
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [affirmationIndex, setAffirmationIndex] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [oneThingIndex, setOneThingIndex] = useState(0)
  const [greeting, setGreeting] = useState({
    text: "",
    icon: "🌅",
    message: "",
    energy: "high",
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDark = resolvedTheme === "dark"

  const rotateAll = useCallback(() => {
    setQuoteIndex((_) => randomIndex(QUOTES.length))
    setAffirmationIndex((_) => randomIndex(AFFIRMATIONS.length))
    setTipIndex((_) => randomIndex(TIPS_OF_DAY.length))
    setOneThingIndex((_) => randomIndex(ONE_THING_TODAY.length))
  }, [])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    rotateAll()
    function scheduleNext() {
      timerRef.current = setTimeout(() => {
        rotateAll()
        scheduleNext()
      }, nextRotateDelayMs())
    }
    scheduleNext()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [rotateAll])

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) {
      setGreeting({
        text: "Good Morning",
        icon: "🌅",
        message: "Rise and shine! A great day starts with a clear focus.",
        energy: "high",
      })
    } else if (h < 18) {
      setGreeting({
        text: "Good Afternoon",
        icon: "☀️",
        message: "Keep the momentum. You're right where you need to be.",
        energy: "medium",
      })
    } else {
      setGreeting({
        text: "Good Evening",
        icon: "🌙",
        message: "You've done a lot today. Time to wind down well.",
        energy: "low",
      })
    }
  }, [])

  const currentQuote = QUOTES[quoteIndex]
  const affirmationOfTheDay = AFFIRMATIONS[affirmationIndex]
  const tipOfTheDay = TIPS_OF_DAY[tipIndex]
  const oneThingPrompt = ONE_THING_TODAY[oneThingIndex]
  const tipsForToday = getTipsForToday(TIPS_OF_DAY)

  if (!mounted) {
    return (
      <div className="bg-background flex min-h-[50vh] items-center justify-center">
        <div className="border-primary h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-x-hidden transition-colors duration-300",
        isDark
          ? "bg-gradient-to-br from-gray-950 from-20% via-slate-900 via-50% to-gray-950"
          : "bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60"
      )}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="animate-float absolute"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 100}%`,
              animationDelay: `${(i % 5) * 0.8}s`,
              animationDuration: `${4 + (i % 3)}s`,
            }}
          >
            <Star
              className={cn(
                "h-3 w-3 sm:h-4 sm:w-4",
                isDark ? "text-violet-400/25" : "text-slate-400/40",
                i % 2 === 0 ? "animate-pulse" : "opacity-70"
              )}
            />
          </div>
        ))}
      </div>
      <div
        className={cn(
          "absolute -top-32 -left-32 h-64 w-64 animate-pulse rounded-full blur-3xl",
          isDark ? "bg-violet-600/20" : "bg-violet-200/40"
        )}
      />
      <div
        className={cn(
          "absolute -right-32 -bottom-32 h-64 w-64 animate-pulse rounded-full blur-3xl",
          isDark ? "bg-slate-600/15" : "bg-slate-200/50"
        )}
        style={{ animationDelay: "1.5s" }}
      />

      {/* Full-width layout: 100% viewport, no narrow max-width */}
      <div className="relative mx-auto w-full max-w-full px-4 py-6 sm:px-6 sm:py-10 md:px-8">
        {/* Welcome + theme indicator so dark/light difference is obvious */}
        <div className="animate-fade-in-up mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <p
              className={cn(
                "text-sm font-semibold",
                isDark ? "text-violet-300" : "text-violet-600"
              )}
            >
              {greeting.icon} {greeting.text}
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                isDark
                  ? "bg-violet-500/30 text-violet-200"
                  : "bg-violet-100 text-violet-700"
              )}
            >
              {isDark ? "Dark mode" : "Light mode"}
            </span>
          </div>
          <h1
            className={cn(
              "mt-1 text-2xl font-extrabold tracking-tight sm:text-4xl",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Welcome back, {user?.userName || "there"}!
          </h1>
          <p
            className={cn(
              "mt-2 text-base",
              isDark ? "text-gray-300" : "text-gray-600"
            )}
          >
            {greeting.message}
          </p>
        </div>

        {/* Motivation cards – clear dark vs light: solid backgrounds and borders */}
        <div
          className="animate-fade-in-up mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ animationDelay: "0.05s" }}
        >
          {/* Card 1: Daily quote */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border-l-4 p-4 shadow-lg transition hover:shadow-xl",
              isDark
                ? "border border-slate-700 border-l-violet-400 bg-slate-800/95"
                : "border border-border border-l-violet-500 bg-card"
            )}
          >
            <div className="absolute top-2 right-2 opacity-20">
              <Sparkles
                className={cn(
                  "h-10 w-10",
                  isDark ? "text-violet-300" : "text-violet-500"
                )}
              />
            </div>
            <p
              className={cn(
                "text-sm font-semibold",
                isDark ? "text-violet-300" : "text-violet-700"
              )}
            >
              Daily quote
            </p>
            <p
              className={cn(
                "mt-1 text-xs leading-relaxed",
                isDark ? "text-gray-200" : "text-gray-800"
              )}
            >
              &ldquo;
              {currentQuote && currentQuote.quote.length > 72
                ? `${currentQuote.quote.slice(0, 72)}…`
                : (currentQuote?.quote ?? "")}
              &rdquo;
            </p>
            <p
              className={cn(
                "mt-2 text-[10px]",
                isDark ? "text-gray-400" : "text-gray-500"
              )}
            >
              — {currentQuote?.author ?? ""}
            </p>
          </div>

          {/* Card 2: Affirmation */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 shadow-lg transition hover:shadow-xl",
              isDark
                ? "border-sky-500/40 bg-slate-800/95"
                : "border-sky-200 bg-sky-50/80"
            )}
          >
            <span className="text-3xl" aria-hidden>
              💪
            </span>
            <p
              className={cn(
                "mt-2 text-sm font-semibold",
                isDark ? "text-sky-300" : "text-sky-800"
              )}
            >
              Affirmation
            </p>
            <p
              className={cn(
                "mt-1 text-xs leading-snug",
                isDark ? "text-gray-200" : "text-gray-700"
              )}
            >
              {affirmationOfTheDay}
            </p>
          </div>

          {/* Card 3: Tip of the day */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 shadow-lg transition hover:shadow-xl",
              isDark
                ? "border-emerald-500/40 bg-slate-800/95"
                : "border-emerald-200 bg-emerald-50/90"
            )}
          >
            <div
              className={cn(
                "absolute -top-4 -right-4 h-20 w-20 rounded-full",
                isDark ? "bg-emerald-500/20" : "bg-emerald-400/20"
              )}
            />
            <Zap
              className={cn(
                "relative h-6 w-6",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}
            />
            <p
              className={cn(
                "relative mt-2 text-sm font-semibold",
                isDark ? "text-white" : "text-gray-800"
              )}
            >
              Tip of the day
            </p>
            <p
              className={cn(
                "relative mt-1 text-xs leading-snug",
                isDark ? "text-gray-200" : "text-gray-700"
              )}
            >
              {tipOfTheDay}
            </p>
          </div>

          {/* Card 4: One thing today */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 shadow-lg transition hover:shadow-xl",
              isDark
                ? "border-rose-500/40 bg-slate-800/95"
                : "border-rose-200 bg-rose-50/90"
            )}
          >
            <Target
              className={cn(
                "h-6 w-6",
                isDark ? "text-rose-400" : "text-rose-600"
              )}
            />
            <p
              className={cn(
                "mt-2 text-sm font-semibold",
                isDark ? "text-rose-300" : "text-rose-800"
              )}
            >
              One thing today
            </p>
            <p
              className={cn(
                "mt-1 text-xs leading-snug",
                isDark ? "text-gray-200" : "text-gray-700"
              )}
            >
              {oneThingPrompt}
            </p>
          </div>
        </div>

        {/* Tips to boost your day – clear cards */}
        <div
          className="animate-fade-in-up mt-8"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb
              className={cn(
                "h-5 w-5",
                isDark ? "text-sky-400" : "text-sky-600"
              )}
            />
            <h2
              className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-800"
              )}
            >
              Tips to boost your day
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {tipsForToday.map((tip, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 rounded-xl border p-3 text-left transition hover:shadow-md",
                  isDark
                    ? "border-slate-600 bg-slate-800/95"
                    : "border-border bg-card"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isDark
                      ? "bg-violet-500/50 text-violet-200"
                      : "bg-violet-100 text-violet-700"
                  )}
                >
                  {i + 1}
                </span>
                <p
                  className={cn(
                    "text-sm leading-snug",
                    isDark ? "text-gray-200" : "text-gray-700"
                  )}
                >
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Breathe / intention strip */}
        <div
          className={cn(
            "animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-5 py-4",
            isDark
              ? "border-slate-600 bg-slate-800/95"
              : "border-teal-200 bg-teal-50"
          )}
          style={{ animationDelay: "0.2s" }}
        >
          <Wind
            className={cn(
              "h-5 w-5 animate-pulse",
              isDark ? "text-teal-400" : "text-teal-600"
            )}
          />
          <p
            className={cn(
              "text-center text-sm font-medium",
              isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            Take a breath. Set one intention for this session—then go.
          </p>
        </div>

        {/* Closing motivation */}
        <div
          className={cn(
            "animate-fade-in-up mt-6 flex flex-wrap items-center justify-center gap-2 rounded-full border px-6 py-3 shadow-md",
            isDark
              ? "border-slate-600 bg-slate-800/95"
              : "border-border bg-card"
          )}
          style={{ animationDelay: "0.25s" }}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isDark ? "text-pink-400" : "text-pink-500"
            )}
          />
          <span
            className={cn(
              "text-sm font-semibold",
              isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            You&apos;ve got this. Keep that energy flowing.
          </span>
          <Rocket
            className={cn(
              "h-4 w-4",
              isDark ? "text-rose-400" : "text-rose-500"
            )}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out both;
        }
      `}</style>
    </div>
  )
}
