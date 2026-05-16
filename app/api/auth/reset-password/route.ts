import { NextRequest, NextResponse } from "next/server"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json(
      { result: -1, message: "API URL not configured" },
      { status: 500 }
    )
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json(
      { result: -1, message: "Invalid request body" },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })

    const data = await response.json().catch(() => ({
      result: -1,
      message: "Response body was not valid JSON",
    }))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(
      "[Auth ResetPassword] Backend request failed:",
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { result: -1, message: "Service unavailable. Please try again later." },
      { status: 502 }
    )
  }
}
