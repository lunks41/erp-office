import { NextRequest, NextResponse } from "next/server"
import { validateCsrfTokens, CSRF_TOKEN_COOKIE, CSRF_TOKEN_HEADER } from "@/lib/csrf"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL
const DEFAULT_REG_ID = (
  process.env.NEXT_PUBLIC_DEFAULT_REGISTRATION_ID ?? ""
).trim()

const LOGIN_RATE_LIMIT_WINDOW_MS =
  Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 60_000
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS =
  Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5

interface RateLimitEntry {
  count: number
  windowStart: number
}

const ipAttempts = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("true-client-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-client-ip") ??
    request.headers.get("x-original-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("fastly-client-ip") ??
    request.headers.get("x-cluster-client-ip") ??
    "unknown"
  )
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipAttempts.get(ip)

  if (!entry || now - entry.windowStart > LOGIN_RATE_LIMIT_WINDOW_MS) {
    ipAttempts.set(ip, { count: 1, windowStart: now })
    return false
  }

  if (entry.count >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
    return true
  }

  entry.count++
  return false
}

function cleanupRateLimitMap(): void {
  const now = Date.now()
  for (const [ip, entry] of ipAttempts) {
    if (now - entry.windowStart > LOGIN_RATE_LIMIT_WINDOW_MS) {
      ipAttempts.delete(ip)
    }
  }
}

export async function POST(request: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json(
      { message: "API URL not configured", result: 0 },
      { status: 500 }
    )
  }

  if (!DEFAULT_REG_ID) {
    return NextResponse.json(
      { message: "Registration ID not configured", result: 0 },
      { status: 500 }
    )
  }

  const clientIp = getClientIp(request)
  cleanupRateLimitMap()
  if (checkRateLimit(clientIp)) {
    return NextResponse.json(
      { message: "Too many login attempts. Please try again later.", result: 0 },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(LOGIN_RATE_LIMIT_WINDOW_MS / 1000)),
        },
      }
    )
  }

  const csrfHeader = request.headers.get(CSRF_TOKEN_HEADER)
  const csrfCookie = request.cookies.get(CSRF_TOKEN_COOKIE)?.value
  if (!validateCsrfTokens(csrfCookie, csrfHeader ?? undefined)) {
    return NextResponse.json(
      { message: "Invalid or missing CSRF token", result: 0 },
      { status: 403 }
    )
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json(
      { message: "Invalid request body", result: 0 },
      { status: 400 }
    )
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Reg-Id": DEFAULT_REG_ID,
  }

  if (clientIp && clientIp !== "unknown") {
    headers["X-Forwarded-For"] = clientIp
  }

  const userAgent = request.headers.get("user-agent")
  const clientFingerprint = request.headers.get("x-client-fingerprint")
  if (userAgent) {
    headers["X-User-Agent"] = clientFingerprint
      ? `${userAgent} | fp:${clientFingerprint}`
      : userAgent
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers,
      body,
    })

    const data = await response.json().catch(() => ({
      message: "Response body was not valid JSON",
      result: 0,
    }))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(
      "[Auth Login] Backend request failed:",
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { message: "Login service unavailable", result: 0 },
      { status: 502 }
    )
  }
}
