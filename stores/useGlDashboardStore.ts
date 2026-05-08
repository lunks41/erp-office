import {
  DashboardWidget,
  createDashboardStore,
} from "@/stores/dashboard-store-factory"

const widgets: DashboardWidget[] = [
  {
    id: "total-assets",
    title: "Total Assets",
    type: "total-assets",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 1, colSpan: 1, rowSpan: 1, order: 0 },
  },
  {
    id: "total-liabilities",
    title: "Total Liabilities",
    type: "total-liabilities",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 2, colSpan: 1, rowSpan: 1, order: 1 },
  },
  {
    id: "net-equity",
    title: "Net Equity",
    type: "net-equity",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 3, colSpan: 1, rowSpan: 1, order: 2 },
  },
  {
    id: "ytd-pnl",
    title: "YTD Net P&L",
    type: "ytd-pnl",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 4, colSpan: 1, rowSpan: 1, order: 3 },
  },
  {
    id: "account-balances",
    title: "Balance by Account Type",
    type: "account-balances",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "chart",
    position: { col: 1, colSpan: 2, rowSpan: 2, order: 4 },
  },
  {
    id: "recent-journals",
    title: "Recent Journal Entries",
    type: "recent-journals",
    visible: true,
    permissions: ["clerk", "manager", "cfo"],
    group: "table",
    position: { col: 3, colSpan: 2, rowSpan: 2, order: 5 },
  },
  {
    id: "trial-balance",
    title: "Trial Balance Summary",
    type: "trial-balance",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "table",
    position: { col: 1, colSpan: 4, rowSpan: 2, order: 6 },
  },
]

export const useGlDashboardStore = createDashboardStore(
  "gl-dashboard-layout",
  widgets
)
