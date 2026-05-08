import { NextRequest, NextResponse } from "next/server"
import { generateCsrfToken, CSRF_TOKEN_COOKIE } from "@/lib/csrf"

export async function GET(request: NextRequest) {
  const token = generateCsrfToken()
  const isHttps = request.nextUrl.protocol === "https:"

  const response = NextResponse.json({ csrfToken: token })

  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    path: "/",
    httpOnly: false,
    sameSite: "strict",
    secure: isHttps,
    maxAge: 60 * 60,
  })

  return response
}
