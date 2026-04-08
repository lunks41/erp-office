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

import { getData } from "@/lib/api-client"
import { Admin, DecimalSetting } from "@/lib/api-routes"

import { usePermissionStore } from "./permission-store"

// Constants and Configuration
// -------------------------
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL
const ENABLE_COMPANY_SWITCHING =
  process.env.NEXT_PUBLIC_ENABLE_COMPANY_SWITCH === "true"
const DEFAULT_REGISTRATION_ID = process.env
  .NEXT_PUBLIC_DEFAULT_REGISTRATION_ID as string

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

// Caching Functions
// -----------------
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>()

// Request deduplication
const pendingRequests = new Map<string, Promise<unknown>>()

const getCachedData = <T>(key: string): T | null => {
  const entry = cache.get(key)
  if (!entry) return null

  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Extracts user ID from JWT token
 * @param token - The JWT token to parse
 * @returns The user ID from the token or a default value
 */
const extractUserIdFromJwtToken = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.userId
  } catch (error) {
    console.error("Error parsing token:", error)
    return "33"
  }
}

/**
 * Gets default decimal settings as fallback
 * @returns Default decimal settings object
 */
const getDefaultDecimalSettings = () => ({
  amtDec: parseInt(process.env.NEXT_PUBLIC_DEFAULT_AMT_DEC || "2", 10),
  locAmtDec: parseInt(process.env.NEXT_PUBLIC_DEFAULT_LOC_AMT_DEC || "2", 10),
  ctyAmtDec: parseInt(process.env.NEXT_PUBLIC_DEFAULT_CTY_AMT_DEC || "2", 10),
  priceDec: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PRICE_DEC || "2", 10),
  qtyDec: parseInt(process.env.NEXT_PUBLIC_DEFAULT_QTY_DEC || "2", 10),
  exhRateDec: parseInt(process.env.NEXT_PUBLIC_DEFAULT_EXH_RATE_DEC || "2", 10),
  dateFormat: process.env.NEXT_PUBLIC_DEFAULT_DATE_FORMAT || "yyyy-MM-dd",
  longDateFormat:
    process.env.NEXT_PUBLIC_DEFAULT_LONG_DATE_FORMAT || "yyyy-MM-dd HH:mm:ss",
})

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
  logIn: (userName: string, userPassword: string) => Promise<AuthResponse>

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
        logIn: async (userName: string, userPassword: string) => {
          set({ isLoading: true, error: null })

          try {
            const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Reg-Id": DEFAULT_REGISTRATION_ID,
              },
              body: JSON.stringify({ userName, userPassword }),
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

        /**
         * Handles app lock login
         * Similar to regular login but with additional security checks
         * @returns Login response data including user info and tokens
         */
        applocklogIn: async (userName: string, userPassword: string) => {
          set({ isLoading: true, error: null })

          try {
            const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Reg-Id": DEFAULT_REGISTRATION_ID,
              },
              body: JSON.stringify({ userName, userPassword }),
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
              if (data.user.isLocked === true) {
                Cookies.remove(AUTH_TOKEN_COOKIE_NAME)
                Cookies.remove("auth-token")

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

          Cookies.set(AUTH_TOKEN_COOKIE_NAME, token, { expires: 7 })

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
          Cookies.remove("auth-token")

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
              await fetch(`${BACKEND_API_URL}/auth/revoke`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                  "X-Reg-Id": DEFAULT_REGISTRATION_ID,
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
          Cookies.remove("auth-token")
          get().clearCurrentTabCompanyId()

          // Clear both storages from localStorage
          localStorage.removeItem("auth-storage")
          localStorage.removeItem("permission-storage")

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
          const { token } = get()
          if (!token) return

          try {
            const response = await fetch(
              `${BACKEND_API_URL}${Admin.getCompanies}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "X-Reg-Id": DEFAULT_REGISTRATION_ID,
                  "X-User-Id": extractUserIdFromJwtToken(token),
                },
              }
            )

            const data = await response.json()

            if (!response.ok) {
              throw new Error(`Failed to fetch companies: ${response.status}`)
            }

            const companiesdata = data.data || data || []
            if (companiesdata.length === 0) {
              throw new Error(
                "Unauthorized: No companies available for your account. Please contact your administrator for access."
              )
            }

            const companies = companiesdata.map((company: ICompany) => ({
              ...company,
              companyId: company.companyId.toString(),
            }))

            get().setCompanies(companies)

            if (!get().currentCompany && companies.length > 0) {
              console.log(
                "🔄 AUTO-SELECTING FIRST COMPANY:",
                companies[0].companyId
              )
              console.log("📊 Will fetch decimals: true")
              await get().switchCompany(companies[0].companyId, true)
              console.log("✅ AUTO-SELECTION COMPLETE")
            }
          } catch {}
        },

        setCompanies: (companies: ICompany[]) => {
          set({ companies })
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
          console.log("🏢 SWITCH COMPANY: Starting for company:", companyId)
          console.log("📊 Switch Parameters:", {
            newCompanyId: companyId,
            fetchDecimals: fetchDecimals,
          })

          const { companies, currentCompany } = get()
          // console.log("📋 Current State:", {
          //   currentCompanyId: currentCompany?.companyId,
          //   currentCompanyName: currentCompany?.companyName,
          //   availableCompanies: companies.length,
          //   isAuthenticated: get().isAuthenticated,
          //   companiesList: companies.map((c) => ({
          //     id: c.companyId,
          //     name: c.companyName,
          //   })),
          // })

          // Check if user needs to select a company first
          if (!currentCompany && companies.length > 0) {
            console.warn(
              "⚠️ NO COMPANY SELECTED: User is authenticated but no company is selected"
            )
            // console.log(
            //   "💡 SOLUTION: User should be redirected to company selection page"
            // )
            // console.log("🔗 Expected URL: /company-select")
          }

          try {
            // console.log("🔍 STEP 2: Validating company ID")
            if (!companyId) {
              console.error("❌ STEP 2 FAILED: Company ID is required")
              throw new Error("Company ID is required")
            }
            // console.log("✅ STEP 2 PASSED: Company ID is valid")

            // console.log("🔄 STEP 3: Checking if company is already selected")
            if (currentCompany?.companyId === companyId) {
              // console.log(
              //   "ℹ️ STEP 3: Company already selected, no action needed"
              // )
              return currentCompany
            }
            // console.log("✅ STEP 3: Company switch needed")

            // console.log("🔍 STEP 4: Finding company in available companies")
            const company = companies.find(
              (c) => c.companyId.toString() === companyId
            )
            // console.log("📊 Company search result:", {
            //   found: !!company,
            //   companyName: company?.companyName,
            //   companyId: company?.companyId,
            // })

            if (!company) {
              console.error("❌ STEP 4 FAILED: Company not found")
              throw new Error(
                `Company with ID ${companyId} not found. Please select a valid company.`
              )
            }
            // console.log("✅ STEP 4 PASSED: Company found")

            // console.log("🔄 STEP 5: Updating sessionStorage (tab-specific)")
            // console.log("📊 Before sessionStorage update:", {
            //   oldSessionStorage: sessionStorage.getItem("tab_company_id"),
            //   newCompanyId: companyId,
            // })
            get().setCurrentTabCompanyId(companyId)
            // Clear permissions immediately so components don't use stale data
            usePermissionStore.getState().clearPermissions()
            // console.log("📊 After sessionStorage update:", {
            //   newSessionStorage: sessionStorage.getItem("tab_company_id"),
            //   matches: sessionStorage.getItem("tab_company_id") === companyId,
            // })
            // console.log("✅ STEP 5: sessionStorage updated")

            // console.log("🔄 STEP 6: Updating Zustand store (global state)")
            // console.log("📊 Before Zustand update:", {
            //   oldCurrentCompany: currentCompany?.companyId,
            //   newCompanyId: companyId,
            // })
            set({ currentCompany: company })
            // console.log("📊 After Zustand update:", {
            //   newCurrentCompany: get().currentCompany?.companyId,
            //   matches: get().currentCompany?.companyId === companyId,
            // })
            // console.log("✅ STEP 6: Zustand store updated")

            console.log("🔄 PREPARING API CALLS:")
            const apiPromises = []
            console.log("📋 API calls to execute:", {
              fetchDecimals: fetchDecimals,
              getUserTransactions: true,
            })

            if (fetchDecimals) {
              console.log("📊 Adding getDecimals() to API queue")
              apiPromises.push(get().getDecimals())
            } else {
              console.warn(
                "⚠️ SKIPPING getDecimals() - fetchDecimals is false!"
              )
            }

            console.log("🔐 Adding getUserTransactions() to API queue")
            apiPromises.push(
              get()
                .getUserTransactions()
                .then(() => {})
            )

            console.log("🚀 EXECUTING API CALLS IN PARALLEL")
            console.log("📊 Total API calls:", apiPromises.length)

            // Execute all API calls in parallel and await completion
            const results = await Promise.allSettled(apiPromises)

            console.log("📊 API CALLS COMPLETED")
            console.log("📋 Results summary:", {
              total: results.length,
              fulfilled: results.filter((r) => r.status === "fulfilled").length,
              rejected: results.filter((r) => r.status === "rejected").length,
            })

            results.forEach((result, index) => {
              const apiName =
                index === 0 && fetchDecimals
                  ? "getDecimals"
                  : "getUserTransactions"
              if (result.status === "rejected") {
                console.error(`❌ ${apiName} failed:`, result.reason)
              } else {
                console.log(`✅ ${apiName} succeeded`)
              }
            })

            console.log("✅ COMPANY SWITCH COMPLETED SUCCESSFULLY")
            console.log("🎯 Final result:", {
              newCompanyId: company.companyId,
              newCompanyName: company.companyName,
              apiCallsCompleted: results.length,
            })

            // Return after all data is loaded
            return company
          } catch (error) {
            console.error("❌ STEP FAILED: Company switch failed:", error)
            // console.log("🔄 Error details:", {
            //   error: error instanceof Error ? error.message : "Unknown error",
            //   companyId: companyId,
            //   currentCompany: currentCompany?.companyId,
            // })

            // Rollback optimistic update on validation error
            if (currentCompany) {
              // console.log(
              //   "🔄 Rolling back to previous company:",
              //   currentCompany.companyId
              // )
              set({ currentCompany })
            }
            throw new Error(
              error instanceof Error
                ? error.message
                : "Failed to switch company"
            )
          }
        },

        /**
         * Fetches user permissions for the current company
         * OPTIMIZED: Now handled automatically by getUserTransactions
         * Kept for backward compatibility
         */
        getPermissions: async (retryCount = 0) => {
          const { currentCompany, user } = get()
          const MAX_RETRIES = 2

          if (!currentCompany || !user) return

          try {
            // Permissions are now set automatically by getUserTransactions
            // Just call getUserTransactions to ensure permissions are set
            await get().getUserTransactions()
          } catch (error) {
            console.error("Error fetching user permissions:", error)

            // Retry mechanism for network errors
            if (retryCount < MAX_RETRIES) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (retryCount + 1))
              ) // Exponential backoff
              return get().getPermissions(retryCount + 1)
            }

            // Graceful degradation - set empty permissions to prevent app crashes
            usePermissionStore.getState().setPermissions([])
          }
        },

        /**
         * Fetches decimal settings for the current company
         * IMPROVED: Better error handling with fallback defaults
         */
        getDecimals: async () => {
          const { currentCompany, user } = get()

          console.log(
            "🔢 getDecimals called for company:",
            currentCompany?.companyId
          )

          if (!currentCompany || !user) {
            console.warn("⚠️ getDecimals aborted: No company or user")
            return
          }

          try {
            const response = await getData(DecimalSetting.get)

            const data = response.data

            console.log("🔢 getDecimals response:", data)
            console.log(
              "🔍 Response type:",
              Array.isArray(data) ? "Array" : typeof data
            )

            // Handle both array and object responses
            let decimaldata: IDecimal[]
            if (Array.isArray(data)) {
              decimaldata = data
            } else if (data && typeof data === "object") {
              // API returned single object, wrap it in array
              decimaldata = [data as IDecimal]
            } else {
              decimaldata = []
            }

            if (decimaldata.length > 0) {
              console.log("✅ Decimals loaded successfully:", decimaldata[0])
              get().setDecimals(decimaldata)
            } else {
              console.warn("⚠️ No decimal data received, using defaults")
              // Use fallback defaults if no data received
              get().setDecimals([getDefaultDecimalSettings()])
            }
          } catch (error) {
            console.error("❌ Error fetching decimal settings:", error)
            // Graceful fallback to default settings
            get().setDecimals([getDefaultDecimalSettings()])
          }
        },

        setDecimals: (decimals: IDecimal[]) => {
          set({ decimals })
        },

        /**
         * Fetches user transactions for the current company
         * IMPROVED: Caching + graceful error handling
         */
        getUserTransactions: async (): Promise<IUserTransactionRights[]> => {
          const { currentCompany, user } = get()

          if (!currentCompany || !user) return []

          const cacheKey = `user_transactions_${currentCompany.companyId}_${user.userId}`

          // Check cache first
          const cached = getCachedData<IUserTransactionRights[]>(cacheKey)
          if (cached) {
            // Set permissions from cache
            usePermissionStore.getState().setPermissions(cached)
            return cached
          }

          // Check if there's already a request in progress for this cache key
          const pendingRequest = pendingRequests.get(cacheKey)
          if (pendingRequest) {
            // Return the existing promise
            return pendingRequest as Promise<IUserTransactionRights[]>
          }

          // Create and store the promise
          const requestPromise = (async () => {
            try {
              const response = await getData(Admin.getUserTransactionsAll)
              const data = response?.data || response || []

              if (Array.isArray(data)) {
                // Convert PascalCase to camelCase
                const convertedData: IUserTransactionRights[] = data.map(
                  (item: IUserTransactionRights) => ({
                    moduleId: item.moduleId,
                    moduleCode: item.moduleCode,
                    moduleName: item.moduleName,
                    transactionId: item.transactionId,
                    transactionCode: item.transactionCode,
                    transactionName: item.transactionName,
                    transCategoryId: item.transCategoryId,
                    transCategoryCode: item.transCategoryCode,
                    transCategoryName: item.transCategoryName,
                    seqNo: item.seqNo,
                    transCatSeqNo: item.transCatSeqNo,
                    isRead: item.isRead,
                    isCreate: item.isCreate,
                    isEdit: item.isEdit,
                    isDelete: item.isDelete,
                    isExport: item.isExport,
                    isPrint: item.isPrint,
                    isPost: item.isPost,
                    isDebitNote: item.isDebitNote,
                    isVisible: item.isVisible,
                  })
                )

                setCachedData(cacheKey, convertedData)

                // Automatically set permissions after getting transaction data
                usePermissionStore.getState().setPermissions(convertedData)

                return convertedData
              } else {
                console.warn("User transactions data is not an array:", data)
                return []
              }
            } catch (error) {
              console.error("Error fetching user transactions:", error)
              return []
            } finally {
              // Always clean up the pending request
              pendingRequests.delete(cacheKey)
            }
          })()

          // Store the promise in pending requests
          pendingRequests.set(cacheKey, requestPromise)

          return requestPromise
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
          const { tokenExpiresAt, refreshInProgress } = get()

          if (!tokenExpiresAt || refreshInProgress) return

          const TOKEN_REFRESH_BUFFER = 1 * 60 * 1000 // 1 minute before expiry (popup shows at 5 min)
          const timeUntilExpiry = tokenExpiresAt - Date.now()
          const refreshTime = Math.max(
            timeUntilExpiry - TOKEN_REFRESH_BUFFER,
            60000
          )

          setTimeout(() => {
            get().refreshTokenAutomatically().catch(console.error)
          }, refreshTime)
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
            const response = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "X-Reg-Id": DEFAULT_REGISTRATION_ID,
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
          const analytics = get().sessionAnalytics
          analytics.actionsPerformed++

          // Send to analytics service if available
          if (
            typeof window !== "undefined" &&
            (window as unknown as { gtag?: unknown }).gtag
          ) {
            ;(
              window as unknown as {
                gtag: (
                  event: string,
                  action: string,
                  metadata?: Record<string, unknown>
                ) => void
              }
            ).gtag("event", action, metadata)
          }
        },

        /**
         * Sets online/offline state
         */
        setOnline: (isOnline: boolean) => {
          set({ isOnline })

          if (isOnline) {
            // Process pending actions when coming back online
            get().processPendingActions()
          }
        },

        /**
         * Adds action to pending queue when offline
         */
        addPendingAction: (action: () => Promise<void>) => {
          const { pendingActions, isOnline } = get()

          if (isOnline) {
            return action()
          } else {
            set({ pendingActions: [...pendingActions, action] })
          }
        },

        /**
         * Processes pending actions when back online
         */
        processPendingActions: async () => {
          const { pendingActions, isOnline } = get()

          if (!isOnline || pendingActions.length === 0) return

          set({ pendingActions: [] })

          for (const action of pendingActions) {
            try {
              await action()
            } catch (error) {
              console.error("Error processing pending action:", error)
            }
          }
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

          // Setup online/offline detection
          if (typeof window !== "undefined") {
            const handleOnline = () => get().setOnline(true)
            const handleOffline = () => get().setOnline(false)

            window.addEventListener("online", handleOnline)
            window.addEventListener("offline", handleOffline)

            // Set initial online state
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
          token: state.token,
          refreshToken: state.refreshToken,
          user: state.user,
          companies: state.companies,
          // Enhanced security fields
          tokenExpiresAt: state.tokenExpiresAt,
          tokenStoredAt: state.tokenStoredAt,
          sessionAnalytics: state.sessionAnalytics,
        }),
      }
    )
  )
)
