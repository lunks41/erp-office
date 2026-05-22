import { NextResponse, type NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/pdf-tools",
  "/erp-tools",
  "/ai",
  "/reports",
]

// Auth pages that should redirect to company-select when user is already logged in
const authPageRoutes = ["/login", "/register", "/forgot-password"]

// Define auth routes that require authentication but not company selection
const authRoutes = ["/company-select"]

// Helper function to decode JWT token
function jwtDecode(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Error decoding JWT token:", error)
    return null
  }
}

// Helper function to validate token expiration
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode(token)
    if (!decoded || !decoded.exp) return true

    // exp is in seconds, Date.now() is in milliseconds
    const isExpired = Date.now() >= (decoded.exp as number) * 1000
    return isExpired
  } catch (error) {
    console.error("Error validating token expiration:", error)
    return true
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get auth token from cookies
  const token = request.cookies.get("auth-token")?.value

  //console.log("Middleware - Current path:", pathname, "Token present:", !!token)

  // If no token is present and not on a public route, redirect to login
  if (!token && !publicRoutes.includes(pathname)) {
    console.log("Middleware - No token found, redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Enhanced: Validate token expiration for protected routes
  if (token && !publicRoutes.includes(pathname)) {
    try {
      const decoded = jwtDecode(token)

      if (!decoded || !decoded.exp) {
        console.log(
          "Middleware - Invalid token structure, redirecting to login"
        )
        return NextResponse.redirect(new URL("/login", request.url))
      }

      const isExpired = isTokenExpired(token)

      if (isExpired) {
        console.log("Middleware - Token expired, redirecting to login")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      //console.log("Middleware - Token valid, allowing access")
    } catch (error) {
      console.log(
        "Middleware - Token validation error, redirecting to login:",
        error
      )
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // If token exists but no company is selected, redirect to company select
  if (
    token &&
    !authRoutes.includes(pathname) &&
    !publicRoutes.includes(pathname)
  ) {
    // Check if the path follows the '/[companyId]/' pattern
    const pathParts = pathname.split("/")
    if (pathParts.length < 2 || !pathParts[1]) {
      console.log(
        "Middleware - No company selected, redirecting to company select"
      )
      return NextResponse.redirect(new URL("/company-select", request.url))
    }
  }

  // If authenticated user visits login/register, redirect to company-select
  if (authPageRoutes.includes(pathname) && token && !isTokenExpired(token)) {
    return NextResponse.redirect(new URL("/company-select", request.url))
  }

  // For public routes, allow access
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // For auth routes (like company-select), allow access if token exists
  if (authRoutes.includes(pathname) && token) {
    return NextResponse.next()
  }

  // For all other routes (e.g., /[companyId]/dashboard), allow access
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
