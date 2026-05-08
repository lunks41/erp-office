import {
  AuthResponse,
  ICompany,
  IDecimal,
  IUser,
  IUserTransactionRights,
} from "@/interfaces/auth"
import Cookies from "js-cookie"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

// Constants and Configuration
// -------------------------
const ENABLE_COMPANY_SWITCHING =
  process.env.NEXT_PUBLIC_ENABLE_COMPANY_SWITCH === "true"

// Storage Keys
// ------------
const AUTH_TOKEN_COOKIE_NAME = "auth-token"
const SESSION_STORAGE_TAB_COMPANY_ID_KEY = "tab_company_id"

// Helper Functions
// ---------------
/**
 * Gets the company ID specific to the current browser tab
 * Used for multi-tab support where each tab can have a different company selected
 */
const getCurrentTabCompanyIdFromSession = () => {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(SESSION_STORAGE_TAB_COMPANY_ID_KEY)
}

/**
 * Sets the company ID for the current browser tab
 * @param companyId - The company ID to set
 */
const setCurrentTabCompanyIdInSession = (companyId: string) => {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_STORAGE_TAB_COMPANY_ID_KEY, companyId)
}

/**
 * Clears the company ID for the current browser tab
 */
const clearCurrentTabCompanyIdFromSession = () => {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(SESSION_STORAGE_TAB_COMPANY_ID_KEY)
}

const syncCompanyState = async (
  set: (partial: Partial<AuthState>) => void
): Promise<void> => {
  const { useCompanyStore } = await import("./company-store")
  const companyState = useCompanyStore.getState()
  set({
    companies: companyState.companies,
    currentCompany: companyState.currentCompany,
    decimals: companyState.decimals,
    isCompanySwitchEnabled: companyState.isCompanySwitchEnabled,
  })
}

const syncSessionState = async (
  set: (partial: Partial<AuthState>) => void
): Promise<void> => {
  const { useSessionStore } = await import("./session-store")
  const sessionState = useSessionStore.getState()
  set({
    isOnline: sessionState.isOnline,
    pendingActions: sessionState.pendingActions,
    sessionAnalytics: sessionState.sessionAnalytics,
  })
}

// Store Interface
// --------------
interface AuthState {
  // Authentication State
  isAuthenticated: boolean
  isAppLocked: boolean
  isLoading: boolean
  user: IUser | null
  token: string | null
  refreshToken: string | null
  error: string | null

  // Enhanced Security State
  tokenExpiresAt?: number
  tokenStoredAt?: number
  refreshInProgress: boolean
  lastRefreshAttempt?: number
  _refreshTimerId?: ReturnType<typeof setTimeout>
  isOnline: boolean
  pendingActions: Array<() => Promise<void>>
  sessionAnalytics: {
    loginTime: number
    sessionDuration: number
    pageViews: number
    actionsPerformed: number
    errorsEncountered: number
    companySwitches: number
    tabCount: number
  }

  // Company State
  companies: ICompany[]
  currentCompany: ICompany | null
  isCompanySwitchEnabled: boolean

  // Decimal Settings
  decimals: IDecimal[]

  // Authentication Actions
  logIn: (userName: string, userPassword: string, deviceInfo?: Record<string, unknown>) => Promise<AuthResponse>
  loginForce: (userName: string, userPassword: string, sessionIdsToRevoke: number[], deviceInfo?: Record<string, unknown>) => Promise<AuthResponse>

  applocklogIn: (
    userName: string,
    userPassword: string
  ) => Promise<AuthResponse>

  logInSuccess: (user: IUser, token: string, refreshToken: string) => void
  logInFailed: (error: string) => void
  logInStatusCheck: () => Promise<void>
  logInStatusSuccess: (user: IUser) => void
  logInStatusFailed: (showError?: boolean) => void
  logOut: () => Promise<void>
  logOutSuccess: () => void
  setAppLocked: (locked: boolean) => void

  // Enhanced Security Actions
  refreshTokenAutomatically: () => Promise<string | null>
  setupTokenRefresh: () => void
  validateTokenExpiration: (token: string) => boolean
  trackUserAction: (action: string, metadata?: Record<string, unknown>) => void
  setOnline: (isOnline: boolean) => void
  addPendingAction: (action: () => Promise<void>) => void
  processPendingActions: () => Promise<void>
  initializeAuth: () => void
  forceLogout: () => void

  // Company Actions
  getCompanies: () => Promise<void>
  setCompanies: (companies: ICompany[]) => void
  switchCompany: (
    companyId: string,
    fetchDecimals?: boolean
  ) => Promise<ICompany | undefined>

  // Decimal Actions
  getDecimals: () => Promise<void>
  setDecimals: (decimals: IDecimal[]) => void

  // Tab Company ID Actions
  getCurrentTabCompanyId: () => string | null
  setCurrentTabCompanyId: (companyId: string) => void
  clearCurrentTabCompanyId: () => void

  // Permission Actions
  getPermissions: (retryCount?: number) => Promise<void>

  // User Transactions Actions
  getUserTransactions: () => Promise<IUserTransactionRights[]>
}

// Stable event handler references so addEventListener/removeEventListener match
const _handleOnline = () => useAuthStore.getState().setOnline(true)
const _handleOffline = () => useAuthStore.getState().setOnline(false)

// Store Implementation
// -------------------
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        isAuthenticated: false,
        isAppLocked: false,
        isLoading: false,
        user: null,
        token: null,
        refreshToken: null,
        error: null,
        companies: [],
        currentCompany: null,
        isCompanySwitchEnabled: ENABLE_COMPANY_SWITCHING,
        decimals: [],

        // Enhanced Security Initial State
        tokenExpiresAt: undefined,
        tokenStoredAt: undefined,
        refreshInProgress: false,
        lastRefreshAttempt: undefined,
        isOnline: true,
        pendingActions: [],
        sessionAnalytics: {
          loginTime: 0,
          sessionDuration: 0,
          pageViews: 0,
          actionsPerformed: 0,
          errorsEncountered: 0,
          companySwitches: 0,
          tabCount: 1,
        },

        // Authentication Actions
        setAppLocked: (locked: boolean) => {
          set({ isAppLocked: locked })
        },

        /**
         * Handles user login
         * Flow:
         * 1. Set loading state
         * 2. Make login API request
         * 3. Handle response
         * 4. Update store state
         * 5. Fetch companies if login successful
         * @returns Login response data including user info and tokens
         */
        logIn: async (userName: string, userPassword: string, deviceInfo?: Record<string, unknown>) => {
          set({ isLoading: true, error: null })

          try {
            const csrfRes = await fetch("/api/auth/csrf")
            const { csrfToken } = await csrfRes.json()
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
              },
              body: JSON.stringify({ userName, userPassword, deviceInfo }),
            })

            if (response.status === 401) {
              get().setAppLocked(true)
            }

            const data: AuthResponse = await response.json()

            if (!response.ok) {
              throw new Error(data.message || "Login failed")
            }

            if (data.result === 1) {
              console.log("🔐 LOGIN SUCCESS: User authenticated")
              get().logInSuccess(data.user, data.token, data.refreshToken)

              if (!get().isAppLocked) {
                console.log("🏢 STEP 1: Fetching companies...")
                await get().getCompanies()
                console.log("✅ STEP 1 COMPLETE: Companies fetched")
              }
            } else if (data.result === 2) {
              // Active sessions detected — UI handles the dialog, not an error
              set({ isLoading: false })
            } else {
              console.log("🔐 LOGIN FAILED: User not authenticated")
              set({ isLoading: false, error: data.message })
            }

            return {
              result: data.result,
              message: data.message,
              user: data.user,
              token: data.token,
              refreshToken: data.refreshToken,
            }
          } catch (error) {
            set({ isLoading: false })
            get().logInFailed(
              error instanceof Error
                ? error.message
                : "An unknown error occurred"
            )
            throw error
          }
        },

        loginForce: async (userName: string, userPassword: string, sessionIdsToRevoke: number[], deviceInfo?: Record<string, unknown>) => {
          set({ isLoading: true, error: null })
          try {
            const csrfRes = await fetch("/api/auth/csrf")
            const { csrfToken } = await csrfRes.json()
            const response = await fetch("/api/auth/login-force", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
              body: JSON.stringify({ userName, userPassword, sessionIdsToRevoke, deviceInfo }),
            })
            const data: AuthResponse = await response.json()

            if (data.result === 1) {
              get().logInSuccess(data.user, data.token, data.refreshToken)
              await get().getCompanies()
            } else {
              set({ isLoading: false, error: data.message })
            }
            return data
          } catch (error) {
            set({ isLoading: false })
            get().logInFailed(error instanceof Error ? error.message : "An unknown error occurred")
            throw error
          }
        },

        applocklogIn: async (userName: string, userPassword: string) => {
          set({ isLoading: true, error: null })

          try {
            const { getDeviceInfo } = await import("@/lib/device-info")
            const csrfRes = await fetch("/api/auth/csrf")
            const { csrfToken } = await csrfRes.json()
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-csrf-token": csrfToken,
              },
              body: JSON.stringify({ userName, userPassword, deviceInfo: getDeviceInfo() }),
            })

            if (response.status === 401) {
              get().setAppLocked(true)
            }

            const data: AuthResponse = await response.json()

            if (!response.ok) {
              throw new Error(data.message || "Login failed")
            }

            if (data.result !== 1) {
              get().setAppLocked(true)
              if (data.user?.isLocked === true) {
                Cookies.remove(AUTH_TOKEN_COOKIE_NAME)

                set({
                  isAuthenticated: false,
                  isAppLocked: false,
                  isLoading: false,
                  user: null,
                  token: null,
                  refreshToken: null,
                  error: data.message,
                })
              }
            } else {
              get().logInSuccess(data.user, data.token, data.refreshToken)
            }

            return {
              result: data.result,
              message: data.message,
              user: data.user,
              token: data.token,
              refreshToken: data.refreshToken,
            }
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },

        /**
         * Updates store state after successful login
         * Sets authentication state and stores tokens with enhanced security tracking
         */
        logInSuccess: (user: IUser, token: string, refreshToken: string) => {
          // Decode token to get expiration time
          let tokenExpiresAt: number | undefined
          try {
            const decoded = JSON.parse(atob(token.split(".")[1]))
            tokenExpiresAt = decoded.exp ? decoded.exp * 1000 : undefined
          } catch (error) {
            console.warn("Could not decode token expiration:", error)
          }

          Cookies.set(AUTH_TOKEN_COOKIE_NAME, token, {
            expires: 7,
            secure: true,
            sameSite: "strict",
          })

          set({
            isAuthenticated: true,
            isAppLocked: false,
            isLoading: false,
            user,
            token,
            refreshToken,
            error: null,
            // Enhanced security tracking
            tokenExpiresAt,
            tokenStoredAt: Date.now(),
            refreshInProgress: false,
            sessionAnalytics: {
              loginTime: Date.now(),
              sessionDuration: 0,
              pageViews: 0,
              actionsPerformed: 0,
              errorsEncountered: 0,
              companySwitches: 0,
              tabCount: 1,
            },
          })

          // Note: background token refresh intentionally removed.
          // The session-expiry popup handles all token refresh at 5-min warning.
        },

        /**
         * Updates store state after failed login
         * Clears authentication state and tokens
         */
        logInFailed: (error: string) => {
          Cookies.remove(AUTH_TOKEN_COOKIE_NAME)

          set({
            isAuthenticated: false,
            isAppLocked: false,
            isLoading: false,
            user: null,
            token: null,
            refreshToken: null,
            error,
          })
        },

        /**
         * Checks login status
         * Validates if user has a valid token and is authenticated
         */
        logInStatusCheck: async () => {
          set({ isLoading: true })
          try {
            const token = get().token
            if (!token) {
              // No token found - this is normal for new users, don't show error
              get().logInStatusFailed(false)
              return
            }

            // If we have a token, validate it
            const isValid = get().validateTokenExpiration(token)
            if (!isValid) {
              // Token exists but is expired - show error
              get().logInStatusFailed(true)
              return
            }

            // Token is valid, user is authenticated
            set({ isLoading: false })
          } catch (_error) {
            // Other errors - show error
            get().logInStatusFailed(true)
          }
        },

        logInStatusSuccess: (user: IUser) => {
          set({
            isAuthenticated: true,
            isAppLocked: false,
            isLoading: false,
            user,
            error: null,
          })
        },

        logInStatusFailed: (showError = false) => {
          set({
            isAuthenticated: false,
            isAppLocked: false,
            isLoading: false,
            user: null,
            token: null,
            refreshToken: null,
            error: showError ? "Session expired or invalid" : null,
          })
        },

        /**
         * Handles user logout
         * Flow:
         * 1. Call logout API
         * 2. Clear local state
         * 3. Clear cookies
         */
        logOut: async () => {
          set({ isLoading: true })

          try {
            const token = get().token
            if (token) {
              await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ refreshToken: get().refreshToken }),
              })
            }
            get().logOutSuccess()
          } catch {
            get().logOutSuccess()
          }
        },

        logOutSuccess: () => {
          Cookies.remove(AUTH_TOKEN_COOKIE_NAME)
          get().clearCurrentTabCompanyId()

          localStorage.removeItem("auth-storage")

          void import("./company-store").then(({ useCompanyStore }) => {
            useCompanyStore.getState().clearCompanyState()
          })
          void import("./session-store").then(({ useSessionStore }) => {
            useSessionStore.getState().resetSession()
          })

          set({
            isAuthenticated: false,
            isAppLocked: false,
            isLoading: false,
            user: null,
            token: null,
            refreshToken: null,
            error: null,
            companies: [],
            currentCompany: null,
            decimals: [],
          })
        },

        /**
         * Fetches companies for the current user
         * Flow:
         * 1. Check if company switching is enabled
         * 2. Make API request to get companies
         * 3. Handle response and update store
         * 4. Set default company if needed
         */
        getCompanies: async () => {
          const { useCompanyStore } = await import("./company-store")
          await useCompanyStore.getState().getCompanies()
          await syncCompanyState(set)
        },

        setCompanies: (companies: ICompany[]) => {
          set({ companies })
          void import("./company-store").then(({ useCompanyStore }) => {
            useCompanyStore.getState().setCompanies(companies)
            return syncCompanyState(set)
          })
        },

        /**
         * Switches the current company with optimistic updates and parallel API calls
         * IMPROVED: Optimistic UI updates + Parallel API calls + Better error handling
         * Flow:
         * 1. Validate company ID
         * 2. Optimistic UI update (immediate)
         * 3. Parallel API calls (non-blocking)
         * 4. Graceful error recovery
         */
        switchCompany: async (companyId: string, fetchDecimals = true) => {
          const { useCompanyStore } = await import("./company-store")
          const company = await useCompanyStore
            .getState()
            .switchCompany(companyId, fetchDecimals)
          await syncCompanyState(set)
          return company
        },

        /**
         * Fetches user permissions for the current company
         * OPTIMIZED: Now handled automatically by getUserTransactions
         * Kept for backward compatibility
         */
        getPermissions: async (retryCount = 0) => {
          const { useCompanyStore } = await import("./company-store")
          await useCompanyStore.getState().getPermissions(retryCount)
        },

        /**
         * Fetches decimal settings for the current company
         * IMPROVED: Better error handling with fallback defaults
         */
        getDecimals: async () => {
          const { useCompanyStore } = await import("./company-store")
          await useCompanyStore.getState().getDecimals()
          await syncCompanyState(set)
        },

        setDecimals: (decimals: IDecimal[]) => {
          set({ decimals })
          void import("./company-store").then(({ useCompanyStore }) => {
            useCompanyStore.getState().setDecimals(decimals)
            return syncCompanyState(set)
          })
        },

        /**
         * Fetches user transactions for the current company
         * IMPROVED: Caching + graceful error handling
         */
        getUserTransactions: async (): Promise<IUserTransactionRights[]> => {
          const { useCompanyStore } = await import("./company-store")
          return useCompanyStore.getState().getUserTransactions()
        },

        // Tab Company ID Actions
        getCurrentTabCompanyId: () => getCurrentTabCompanyIdFromSession(),
        setCurrentTabCompanyId: (companyId: string) =>
          setCurrentTabCompanyIdInSession(companyId),
        clearCurrentTabCompanyId: () => clearCurrentTabCompanyIdFromSession(),

        // Enhanced Security Actions
        /**
         * Validates if a token is expired
         */
        validateTokenExpiration: (token: string) => {
          try {
            const decoded = JSON.parse(atob(token.split(".")[1]))
            if (!decoded || !decoded.exp) return false

            const isExpired = Date.now() >= decoded.exp * 1000
            return !isExpired
          } catch (error) {
            console.error("Error validating token expiration:", error)
            return false
          }
        },

        /**
         * Sets up automatic token refresh
         */
        setupTokenRefresh: () => {
          const { tokenExpiresAt, refreshInProgress, _refreshTimerId } = get()

          if (!tokenExpiresAt || refreshInProgress) return

          // Clear any existing timer before scheduling a new one
          if (_refreshTimerId !== undefined) clearTimeout(_refreshTimerId)

          const TOKEN_REFRESH_BUFFER = 1 * 60 * 1000 // 1 minute before expiry (popup shows at 5 min)
          const timeUntilExpiry = tokenExpiresAt - Date.now()
          const refreshTime = Math.max(
            timeUntilExpiry - TOKEN_REFRESH_BUFFER,
            60000
          )

          const timerId = setTimeout(() => {
            get().refreshTokenAutomatically().catch(console.error)
          }, refreshTime)
          set({ _refreshTimerId: timerId })
        },

        /**
         * Automatically refreshes the token
         */
        refreshTokenAutomatically: async () => {
          const { token, refreshToken, refreshInProgress, lastRefreshAttempt } =
            get()

          if (!token || !refreshToken || refreshInProgress) {
            return null
          }

          // Prevent multiple simultaneous refresh attempts
          if (lastRefreshAttempt && Date.now() - lastRefreshAttempt < 30000) {
            return null
          }

          set({ refreshInProgress: true, lastRefreshAttempt: Date.now() })

          try {
            const response = await fetch("/api/auth/refresh", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ refreshToken }),
            })

            const data: AuthResponse = await response.json()

            if (!response.ok) {
              throw new Error(data.message || "Token refresh failed")
            }

            if (data.token) {
              get().logInSuccess(
                data.user || get().user,
                data.token,
                data.refreshToken || refreshToken
              )
              return data.token
            }

            return null
          } catch (error) {
            console.error("❌ [AuthStore] Token refresh failed:", error)
            set({ refreshInProgress: false })
            return null
          }
        },

        /**
         * Tracks user actions for analytics
         */
        trackUserAction: (
          action: string,
          metadata?: Record<string, unknown>
        ) => {
          void import("./session-store").then(({ useSessionStore }) => {
            useSessionStore.getState().trackUserAction(action, metadata)
            return syncSessionState(set)
          })
        },

        /**
         * Sets online/offline state
         */
        setOnline: (isOnline: boolean) => {
          set({ isOnline })
          void import("./session-store").then(({ useSessionStore }) => {
            useSessionStore.getState().setOnline(isOnline)
            return syncSessionState(set)
          })
        },

        /**
         * Adds action to pending queue when offline
         */
        addPendingAction: (action: () => Promise<void>) => {
          const { isOnline } = get()
          if (isOnline) return action()
          void import("./session-store").then(({ useSessionStore }) => {
            useSessionStore.getState().addPendingAction(action)
            return syncSessionState(set)
          })
        },

        /**
         * Processes pending actions when back online
         */
        processPendingActions: async () => {
          const { useSessionStore } = await import("./session-store")
          await useSessionStore.getState().processPendingActions()
          await syncSessionState(set)
        },

        /**
         * Initializes authentication state on app start
         */
        initializeAuth: () => {
          const { token, isAuthenticated } = get()

          if (isAuthenticated && token) {
            const isValid = get().validateTokenExpiration(token)
            if (!isValid) {
              get().logOutSuccess()
            }
            // No background refresh scheduled — session-expiry popup handles it.
          }

          if (typeof window !== "undefined") {
            // Remove any previously registered listeners before adding new ones
            window.removeEventListener("online", _handleOnline)
            window.removeEventListener("offline", _handleOffline)
            window.addEventListener("online", _handleOnline)
            window.addEventListener("offline", _handleOffline)
            get().setOnline(navigator.onLine)
          }
        },

        /**
         * Forces logout and clears all authentication state
         * Useful for clearing stuck authentication states
         */
        forceLogout: () => {
          get().logOutSuccess()
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          isAppLocked: state.isAppLocked,
          user: state.user,
          companies: state.companies,
          tokenExpiresAt: state.tokenExpiresAt,
          tokenStoredAt: state.tokenStoredAt,
          sessionAnalytics: state.sessionAnalytics,
        }),
      }
    ),
    { enabled: process.env.NODE_ENV === "development" }
  )
)
