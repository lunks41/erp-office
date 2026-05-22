import { NextRequest, NextResponse } from "next/server"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL
const DEFAULT_REG_ID = (
  process.env.NEXT_PUBLIC_DEFAULT_REGISTRATION_ID ?? ""
).trim()

// Allow more attempts than login since refresh is automated, but still cap it
// to prevent abuse (e.g. a tight polling loop or token farming).
const REFRESH_RATE_LIMIT_WINDOW_MS =
  Number(process.env.REFRESH_RATE_LIMIT_WINDOW_MS) || 5 * 60_000 // 5 minutes
const REFRESH_RATE_LIMIT_MAX_ATTEMPTS =
  Number(process.env.REFRESH_RATE_LIMIT_MAX_ATTEMPTS) || 30

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
    "unknown"
  )
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipAttempts.get(ip)

  if (!entry || now - entry.windowStart > REFRESH_RATE_LIMIT_WINDOW_MS) {
    ipAttempts.set(ip, { count: 1, windowStart: now })
    return false
  }

  if (entry.count >= REFRESH_RATE_LIMIT_MAX_ATTEMPTS) return true

  entry.count++
  return false
}

function cleanupRateLimitMap(): void {
  const now = Date.now()
  for (const [ip, entry] of ipAttempts) {
    if (now - entry.windowStart > REFRESH_RATE_LIMIT_WINDOW_MS) {
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

  const clientIp = getClientIp(request)
  cleanupRateLimitMap()
  if (checkRateLimit(clientIp)) {
    return NextResponse.json(
      { message: "Too many refresh attempts. Please try again later.", result: 0 },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(REFRESH_RATE_LIMIT_WINDOW_MS / 1000)),
        },
      }
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

  const authHeader = request.headers.get("authorization")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Reg-Id": DEFAULT_REG_ID,
  }
  if (authHeader) headers["Authorization"] = authHeader

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
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
      "[Auth Refresh] Backend request failed:",
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { message: "Token refresh service unavailable", result: 0 },
      { status: 502 }
    )
  }
}
