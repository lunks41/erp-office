import { create } from "zustand"

export type DashboardRole = "cfo" | "manager" | "clerk"

export interface DashboardTilePosition {
  col: number
  colSpan: number
  rowSpan: number
  order: number
}

export interface DashboardWidget {
  id: string
  title: string
  type: string
  group?: "kpi" | "chart" | "table"
  visible: boolean
  permissions: DashboardRole[]
  position: DashboardTilePosition
}

export interface DashboardLayoutUpdate {
  id: string
  position: DashboardTilePosition
}

export interface DashboardStoreState {
  widgets: DashboardWidget[]
  layoutDirty: boolean
  addWidget: (type: string) => void
  removeWidget: (id: string) => void
  updatePositions: (updates: DashboardLayoutUpdate[]) => void
  saveLayout: (companyId: string) => void
  loadLayout: (companyId: string) => void
  resetLayout: () => void
}

const cloneWidgets = (widgets: DashboardWidget[]): DashboardWidget[] =>
  widgets.map((widget) => ({
    ...widget,
    permissions: [...widget.permissions],
    position: { ...widget.position },
  }))

export const createDashboardStore = (
  storageKeyPrefix: string,
  initialWidgets: DashboardWidget[]
) => {
  const initial = cloneWidgets(initialWidgets)

  return create<DashboardStoreState>((set, get) => ({
    widgets: cloneWidgets(initial),
    layoutDirty: false,
    addWidget: (type) =>
      set((state) => ({
        widgets: state.widgets.map((widget) =>
          widget.type === type ? { ...widget, visible: true } : widget
        ),
        layoutDirty: true,
      })),
    removeWidget: (id) =>
      set((state) => ({
        widgets: state.widgets.map((widget) =>
          widget.id === id ? { ...widget, visible: false } : widget
        ),
        layoutDirty: true,
      })),
    updatePositions: (updates) =>
      set((state) => {
        const map = new Map(updates.map((u) => [u.id, u.position]))
        return {
          widgets: state.widgets.map((widget) => {
            const next = map.get(widget.id)
            return next ? { ...widget, position: { ...next } } : widget
          }),
          layoutDirty: true,
        }
      }),
    saveLayout: (companyId) => {
      if (!companyId || typeof window === "undefined") return
      const storageKey = `${storageKeyPrefix}-${companyId}`
      const payload = JSON.stringify(get().widgets)
      localStorage.setItem(storageKey, payload)
      set({ layoutDirty: false })
    },
    loadLayout: (companyId) => {
      if (!companyId || typeof window === "undefined") return
      const storageKey = `${storageKeyPrefix}-${companyId}`
      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        set({ widgets: cloneWidgets(initial), layoutDirty: false })
        return
      }
      try {
        const parsed = JSON.parse(raw) as DashboardWidget[]
        if (!Array.isArray(parsed)) throw new Error("Invalid dashboard layout")
        set({ widgets: cloneWidgets(parsed), layoutDirty: false })
      } catch {
        set({ widgets: cloneWidgets(initial), layoutDirty: false })
      }
    },
    resetLayout: () => set({ widgets: cloneWidgets(initial), layoutDirty: true }),
  }))
}
