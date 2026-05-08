import {
  DashboardWidget,
  createDashboardStore,
} from "@/stores/dashboard-store-factory"

const widgets: DashboardWidget[] = [
  {
    id: "total-cash",
    title: "Total Cash",
    type: "total-cash",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 1, colSpan: 1, rowSpan: 1, order: 0 },
  },
  {
    id: "total-bank",
    title: "Total Bank Balance",
    type: "total-bank",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 2, colSpan: 1, rowSpan: 1, order: 1 },
  },
  {
    id: "pending-receipts",
    title: "Pending Receipts",
    type: "pending-receipts",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 3, colSpan: 1, rowSpan: 1, order: 2 },
  },
  {
    id: "pending-payments",
    title: "Pending Payments",
    type: "pending-payments",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 4, colSpan: 1, rowSpan: 1, order: 3 },
  },
  {
    id: "bank-balances",
    title: "Bank Account Balances",
    type: "bank-balances",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "chart",
    position: { col: 1, colSpan: 2, rowSpan: 2, order: 4 },
  },
  {
    id: "cash-flow",
    title: "7-Day Cash Flow",
    type: "cash-flow",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "chart",
    position: { col: 3, colSpan: 2, rowSpan: 2, order: 5 },
  },
  {
    id: "recent-transactions",
    title: "Recent Transactions",
    type: "recent-transactions",
    visible: true,
    permissions: ["clerk", "manager", "cfo"],
    group: "table",
    position: { col: 1, colSpan: 4, rowSpan: 2, order: 6 },
  },
  {
    id: "week-transactions",
    title: "This Week's Transactions",
    type: "week-transactions",
    visible: true,
    permissions: ["clerk", "manager", "cfo"],
    group: "table",
    position: { col: 1, colSpan: 4, rowSpan: 2, order: 7 },
  },
]

export const useCbDashboardStore = createDashboardStore(
  "cb-dashboard-layout",
  widgets
)
