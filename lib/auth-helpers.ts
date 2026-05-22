import { AuthResponse } from "@/interfaces"
import { useAuthStore } from "@/stores/auth-store"
import { JwtPayload, jwtDecode as decodeJwt } from "jwt-decode"

import { enhancedFetch, handleApiResponse, logError } from "@/lib/error-handler"

// Get registration ID from environment variables
const DEFAULT_REGISTRATION_ID = process.env
  .NEXT_PUBLIC_DEFAULT_REGISTRATION_ID as string

/**
 * Get port number from environment variables or use the default
 */
export function getPortNumber(): number {
  // Try to get port from environment
  const envPort = process.env.NEXT_PUBLIC_PORT

  if (envPort) {
    const parsedPort = parseInt(envPort, 10)
    if (!isNaN(parsedPort)) {
      return parsedPort
    }
  }

  // Default port for Next.js
  return 5149
}

/**
 * Decode a JWT token and return its payload
 */
export function jwtDecode(token: string): JwtPayload | null {
  try {
    return decodeJwt<JwtPayload>(token)
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error("JWT decode failed"),
      "jwtDecode"
    )
    return null
  }
}

/**
 * Attempts to refresh the authentication token
 * @returns A new token if refresh was successful, null otherwise
 */
export const refreshToken = async (): Promise<string | null> => {
  try {
    const state = useAuthStore.getState()

    if (!state.token) {
      console.error("❌ [AuthHelpers] No token available for refresh")
      return null
    }

    if (!state.refreshToken) {
      console.error("❌ [AuthHelpers] No refresh token available")
      return null
    }

    // console.log("🔄 [AuthHelpers] Starting token refresh...")
    // console.log(
    //   "🔄 [AuthHelpers] Current token preview:",
    //   state.token.substring(0, 20) + "..."
    // )
    // console.log(
    //   "🔄 [AuthHelpers] Refresh token preview:",
    //   state.refreshToken.substring(0, 20) + "..."
    // )

    // Use enhanced fetch with retry logic
    const response = await enhancedFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
          "X-Reg-Id": DEFAULT_REGISTRATION_ID,
        },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      }
    )
    // console.log("🔄 [AuthHelpers] Refresh token response:", {
    //   status: response.status,
    //   ok: response.ok,
    //   statusText: response.statusText,
    // })

    // Check if response is successful before parsing
    if (!response.ok) {
      console.error(
        "❌ [AuthHelpers] Token refresh failed with status:",
        response.status
      )
      throw new Error(
        `Token refresh failed: ${response.status} ${response.statusText}`
      )
    }

    const data = await handleApiResponse(response, {
      result: 0,
      message: "",
      user: {
        userId: "",
        userCode: "",
        userName: "",
        userEmail: "",
        remarks: "",
        isActive: false,
        isLocked: false,
        failedLoginAttempts: 0,
        userGroupId: "",
        userGroupName: "",
        userRoleId: "",
        userRoleName: "",
        profilePicture: "",
      },
      token: "",
      refreshToken: "",
    } as AuthResponse)

    // console.log("🔄 [AuthHelpers] Parsed response data:", {
    //   hasToken: !!data.token,
    //   hasUser: !!data.user,
    //   hasRefreshToken: !!data.refreshToken,
    //   result: data.result,
    //   message: data.message,
    // })

    if (!data.token || data.token.length === 0) {
      console.error("❌ [AuthHelpers] No token in refresh response:", data)
      throw new Error("No token in refresh response")
    }

    // Update the auth store with the new token
    // console.log("🔄 [AuthHelpers] Updating auth store with new token")

    if (data.user && data.token) {
      // console.log("✅ [AuthHelpers] Using new user data from response")
      useAuthStore
        .getState()
        .logInSuccess(
          data.user,
          data.token,
          data.refreshToken || state.refreshToken || ""
        )
    } else if (state.user && data.token) {
      // console.log("✅ [AuthHelpers] Using existing user data with new token")
      useAuthStore
        .getState()
        .logInSuccess(
          state.user,
          data.token,
          data.refreshToken || state.refreshToken || ""
        )
    } else {
      console.warn("⚠️ [AuthHelpers] No user data available for token update")
    }

    // console.log("✅ [AuthHelpers] Token refresh completed, returning token")
    return data.token
  } catch (error) {
    console.error("❌ [AuthHelpers] Token refresh error:", error)
    logError(
      error instanceof Error ? error : new Error("Token refresh failed"),
      "refreshToken"
    )
    return null
  }
}

/**
 * Removes the current session data from the auth store
 */
export const removeSession = () => {
  useAuthStore.getState().logOutSuccess()
}
