import { randomBytes, timingSafeEqual } from "crypto"

export const CSRF_TOKEN_COOKIE = "csrf-token"
export const CSRF_TOKEN_HEADER = "x-csrf-token"

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex")
}

export function validateCsrfTokens(
  cookieValue: string | undefined,
  headerValue: string | undefined
): boolean {
  if (!cookieValue || !headerValue) return false
  if (cookieValue.length !== 64 || headerValue.length !== 64) return false
  try {
    const a = Buffer.from(cookieValue, "hex")
    const b = Buffer.from(headerValue, "hex")
    if (a.length !== 32 || b.length !== 32) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
