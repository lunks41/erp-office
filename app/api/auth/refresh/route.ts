import { NextRequest, NextResponse } from "next/server"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL
const DEFAULT_REG_ID = (
  process.env.NEXT_PUBLIC_DEFAULT_REGISTRATION_ID ?? ""
).trim()

export async function POST(request: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json(
      { message: "API URL not configured", result: 0 },
      { status: 500 }
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
