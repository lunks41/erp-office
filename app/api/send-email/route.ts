import { NextRequest, NextResponse } from "next/server"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL

type EmailAction = "send" | "password-reset" | "welcome" | "test-connection"

function backendEndpoint(action: EmailAction): string {
  switch (action) {
    case "send":           return "Email/send"
    case "password-reset": return "Email/send"       // builds body server-side via AuthService
    case "welcome":        return "Email/send-welcome"
    case "test-connection":return "Email/test-connection"
    default:               return "Email/send"
  }
}

function buildBackendBody(action: EmailAction, payload: Record<string, unknown>): unknown {
  if (action === "send") {
    return {
      to:       payload.to,
      toName:   payload.toName,
      subject:  payload.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
    }
  }
  if (action === "welcome") {
    return { email: payload.email, name: payload.name }
  }
  // test-connection needs no body
  return {}
}

export async function POST(request: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json(
      { result: -1, message: "API URL not configured" },
      { status: 500 }
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { result: -1, message: "Invalid request body" },
      { status: 400 }
    )
  }

  const action = (payload.action as EmailAction) ?? "send"
  const endpoint = backendEndpoint(action)
  const body = buildBackendBody(action, payload)

  const authHeader = request.headers.get("authorization") ?? ""

  try {
    const response = await fetch(`${BACKEND_API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({
      result: -1,
      message: "Response body was not valid JSON",
    }))

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(
      "[EmailRoute] Backend request failed:",
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { result: -1, message: "Email service unavailable. Please try again later." },
      { status: 502 }
    )
  }
}
