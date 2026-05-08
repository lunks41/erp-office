import { NextRequest, NextResponse } from "next/server"
import { validateCsrfTokens, CSRF_TOKEN_COOKIE, CSRF_TOKEN_HEADER } from "@/lib/csrf"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL
const DEFAULT_REG_ID = (
  process.env.NEXT_PUBLIC_DEFAULT_REGISTRATION_ID ?? ""
).trim()

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("true-client-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function POST(request: NextRequest) {
  if (!BACKEND_API_URL || !DEFAULT_REG_ID) {
    return NextResponse.json(
      { message: "API not configured", result: 0 },
      { status: 500 }
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
    return NextResponse.json({ message: "Invalid request body", result: 0 }, { status: 400 })
  }

  const clientIp = getClientIp(request)
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Reg-Id": DEFAULT_REG_ID,
  }
  if (clientIp && clientIp !== "unknown") headers["X-Forwarded-For"] = clientIp
  const userAgent = request.headers.get("user-agent")
  if (userAgent) headers["X-User-Agent"] = userAgent

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/login-force`, {
      method: "POST",
      headers,
      body,
    })
    const data = await response.json().catch(() => ({ message: "Invalid response", result: 0 }))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[Auth LoginForce] Backend request failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ message: "Login service unavailable", result: 0 }, { status: 502 })
  }
}
