import { create } from "zustand"

import { ICompany, IDecimal, IUserTransactionRights } from "@/interfaces/auth"
import { getData } from "@/lib/api-client"
import { Admin, DecimalSetting } from "@/lib/api-routes"
import { usePermissionStore } from "@/stores/permission-store"

import { useAuthStore } from "./auth-store"

const ENABLE_COMPANY_SWITCHING =
  process.env.NEXT_PUBLIC_ENABLE_COMPANY_SWITCH === "true"

const getDefaultDecimalSettings = (): IDecimal => ({
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

const CACHE_DURATION = 5 * 60 * 1000
const txCache = new Map<string, { data: IUserTransactionRights[]; timestamp: number }>()
const pendingRequests = new Map<string, Promise<IUserTransactionRights[]>>()

const getCached = (key: string): IUserTransactionRights[] | null => {
  const entry = txCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    txCache.delete(key)
    return null
  }
  return entry.data
}

const setCached = (key: string, data: IUserTransactionRights[]) => {
  txCache.set(key, { data, timestamp: Date.now() })
}

interface CompanyState {
  companies: ICompany[]
  currentCompany: ICompany | null
  decimals: IDecimal[]
  isCompanySwitchEnabled: boolean
  isLoadingCompanies: boolean
  companiesFetchFailed: boolean
  setCompanies: (companies: ICompany[]) => void
  setCurrentCompany: (company: ICompany | null) => void
  setDecimals: (decimals: IDecimal[]) => void
  getCompanies: () => Promise<void>
  switchCompany: (
    companyId: string,
    fetchDecimals?: boolean
  ) => Promise<ICompany | undefined>
  getDecimals: () => Promise<void>
  getUserTransactions: () => Promise<IUserTransactionRights[]>
  getPermissions: (retryCount?: number) => Promise<void>
  clearCompanyState: () => void
  reset: () => void
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  currentCompany: null,
  decimals: [],
  isCompanySwitchEnabled: ENABLE_COMPANY_SWITCHING,
  isLoadingCompanies: false,
  companiesFetchFailed: false,

  setCompanies: (companies) => set({ companies }),
  setCurrentCompany: (company) => set({ currentCompany: company }),
  setDecimals: (decimals) => set({ decimals }),

  getCompanies: async () => {
    const auth = useAuthStore.getState()
    // Use isAuthenticated (persisted in localStorage) not token (in-memory only, null on refresh)
    if (!auth.isAuthenticated) return
    set({ isLoadingCompanies: true, companiesFetchFailed: false })
    try {
      const response = await getData(Admin.getCompanies)
      const companiesData = response?.data || response || []
      if (!Array.isArray(companiesData) || companiesData.length === 0) {
        set({ isLoadingCompanies: false })
        return
      }

      const companies = companiesData.map((company: ICompany) => ({
        ...company,
        companyId: company.companyId.toString(),
      }))
      set({ companies, isLoadingCompanies: false })

      const current = get().currentCompany
      if (!current && companies.length > 0) {
        // If the URL already has a company ID, switch to that instead of blindly
        // switching to companies[0] — prevents overwriting the correct company in
        // new tabs opened via window.open("_blank") from the company switcher.
        const urlSegment =
          typeof window !== "undefined"
            ? window.location.pathname.split("/")[1]
            : null
        const urlCompany =
          urlSegment && /^\d+$/.test(urlSegment)
            ? companies.find((c) => c.companyId === urlSegment)
            : null
        await get().switchCompany(
          urlCompany ? urlCompany.companyId : companies[0].companyId,
          true
        )
      }
    } catch {
      set({ isLoadingCompanies: false, companiesFetchFailed: true })
    }
  },

  switchCompany: async (companyId, fetchDecimals = true) => {
    if (!companyId) {
      console.warn("switchCompany called without companyId")
      return undefined
    }

    let { companies, currentCompany } = get()
    const normalizedCompanyId = companyId.toString()
    if (currentCompany?.companyId === normalizedCompanyId) return currentCompany

    // Recover when switch is attempted before companies are loaded.
    if (companies.length === 0) {
      // Fast path: seed from auth-store which persists companies in localStorage.
      // This avoids an API round-trip on refresh/new-tab when token is not yet
      // in memory (token is not persisted) but isAuthenticated + companies are.
      const authCompanies = useAuthStore.getState().companies
      if (authCompanies.length > 0) {
        set({ companies: authCompanies })
        ;({ companies } = get())
      } else {
        await get().getCompanies()
        ;({ companies, currentCompany } = get())
        if (currentCompany?.companyId === normalizedCompanyId) return currentCompany
      }
    }

    let company = companies.find(
      (c) => c.companyId.toString() === normalizedCompanyId
    )

    // Gracefully recover from stale persisted tab company IDs.
    if (!company && companies.length > 0) {
      company = companies[0]
      console.warn(
        `Company with ID ${normalizedCompanyId} not found. Falling back to company ${company.companyId}.`
      )
    }

    if (!company) {
      console.warn("No companies available to switch")
      return undefined
    }

    set({ currentCompany: company })

    const auth = useAuthStore.getState()
    auth.setCurrentTabCompanyId(company.companyId)
    usePermissionStore.getState().clearPermissions()

    const tasks: Promise<unknown>[] = []
    if (fetchDecimals) tasks.push(get().getDecimals())
    tasks.push(get().getUserTransactions())
    await Promise.allSettled(tasks)
    return company
  },

  getDecimals: async () => {
    try {
      const response = await getData(DecimalSetting.get)
      const data = response?.data
      if (Array.isArray(data) && data.length > 0) {
        set({ decimals: data })
      } else if (data && typeof data === "object") {
        set({ decimals: [data as IDecimal] })
      } else {
        set({ decimals: [getDefaultDecimalSettings()] })
      }
    } catch {
      set({ decimals: [getDefaultDecimalSettings()] })
    }
  },

  getUserTransactions: async () => {
    const auth = useAuthStore.getState()
    const currentCompany = get().currentCompany
    if (!auth.user || !currentCompany) return []

    const cacheKey = `user_transactions_${currentCompany.companyId}_${auth.user.userId}`

    const cached = getCached(cacheKey)
    if (cached) {
      usePermissionStore.getState().setPermissions(cached)
      return cached
    }

    const pending = pendingRequests.get(cacheKey)
    if (pending) return pending

    const requestPromise = (async () => {
      try {
        const response = await getData(Admin.getUserTransactionsAll)
        const data = response?.data || response || []
        if (!Array.isArray(data)) return []
        const converted = data.map(
          (item: IUserTransactionRights): IUserTransactionRights => ({
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
        setCached(cacheKey, converted)
        usePermissionStore.getState().setPermissions(converted)
        return converted
      } catch {
        return []
      } finally {
        pendingRequests.delete(cacheKey)
      }
    })()

    pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  },

  getPermissions: async (retryCount = 0) => {
    const MAX_RETRIES = 2
    try {
      await get().getUserTransactions()
    } catch {
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        )
        return get().getPermissions(retryCount + 1)
      }
      usePermissionStore.getState().setPermissions([])
    }
  },

  clearCompanyState: () => {
    txCache.clear()
    pendingRequests.clear()
    set({
      companies: [],
      currentCompany: null,
      decimals: [],
      isLoadingCompanies: false,
      companiesFetchFailed: false,
      isCompanySwitchEnabled: ENABLE_COMPANY_SWITCHING,
    })
  },

  reset: () => {
    txCache.clear()
    pendingRequests.clear()
    set({
      companies: [],
      currentCompany: null,
      decimals: [],
      isLoadingCompanies: false,
      companiesFetchFailed: false,
      isCompanySwitchEnabled: ENABLE_COMPANY_SWITCHING,
    })
  },
}))
