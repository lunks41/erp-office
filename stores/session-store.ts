import { create } from "zustand"

interface SessionAnalytics {
  loginTime: number
  sessionDuration: number
  pageViews: number
  actionsPerformed: number
  errorsEncountered: number
  companySwitches: number
  tabCount: number
}

interface SessionState {
  isOnline: boolean
  pendingActions: Array<() => Promise<void>>
  sessionAnalytics: SessionAnalytics
  setOnline: (isOnline: boolean) => void
  addPendingAction: (action: () => Promise<void>) => void
  processPendingActions: () => Promise<void>
  trackUserAction: (action: string, metadata?: Record<string, unknown>) => void
  resetSession: () => void
}

const initialAnalytics = (): SessionAnalytics => ({
  loginTime: 0,
  sessionDuration: 0,
  pageViews: 0,
  actionsPerformed: 0,
  errorsEncountered: 0,
  companySwitches: 0,
  tabCount: 1,
})

export const useSessionStore = create<SessionState>((set, get) => ({
  isOnline: true,
  pendingActions: [],
  sessionAnalytics: initialAnalytics(),

  setOnline: (isOnline) => {
    set({ isOnline })
    if (isOnline) {
      void get().processPendingActions()
    }
  },

  addPendingAction: (action) => {
    const { isOnline, pendingActions } = get()
    if (isOnline) {
      void action()
      return
    }
    set({ pendingActions: [...pendingActions, action] })
  },

  processPendingActions: async () => {
    const { pendingActions, isOnline } = get()
    if (!isOnline || pendingActions.length === 0) return

    set({ pendingActions: [] })
    for (const action of pendingActions) {
      try {
        await action()
      } catch {
        // Ignore individual failures to avoid blocking queue
      }
    }
  },

  trackUserAction: (action, _metadata) => {
    set((state) => {
      const analytics = { ...state.sessionAnalytics }
      analytics.actionsPerformed += 1
      if (action === "page_view") analytics.pageViews += 1
      if (action === "company_switch") analytics.companySwitches += 1
      if (action === "error") analytics.errorsEncountered += 1
      return { sessionAnalytics: analytics }
    })
  },

  resetSession: () => {
    set({
      pendingActions: [],
      sessionAnalytics: {
        ...initialAnalytics(),
        loginTime: Date.now(),
      },
    })
  },
}))
