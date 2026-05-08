import {
  DashboardWidget,
  createDashboardStore,
} from "@/stores/dashboard-store-factory"

const widgets: DashboardWidget[] = [
  {
    id: "total-ar",
    title: "Total AR",
    type: "total-ar",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 1, colSpan: 1, rowSpan: 1, order: 0 },
  },
  {
    id: "overdue-amount",
    title: "Overdue Amount",
    type: "overdue-amount",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 2, colSpan: 1, rowSpan: 1, order: 1 },
  },
  {
    id: "dso",
    title: "DSO",
    type: "dso",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 3, colSpan: 1, rowSpan: 1, order: 2 },
  },
  {
    id: "cei",
    title: "Collection Effectiveness",
    type: "cei",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 4, colSpan: 1, rowSpan: 1, order: 3 },
  },
  {
    id: "ar-aging",
    title: "AR Aging",
    type: "ar-aging",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "chart",
    position: { col: 1, colSpan: 2, rowSpan: 2, order: 4 },
  },
  {
    id: "overdue-customers",
    title: "Overdue by Customer",
    type: "overdue-customers",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "chart",
    position: { col: 3, colSpan: 2, rowSpan: 2, order: 5 },
  },
  {
    id: "top-customers",
    title: "Top 10 Customers",
    type: "top-customers",
    visible: true,
    permissions: ["cfo", "manager", "clerk"],
    group: "table",
    position: { col: 1, colSpan: 4, rowSpan: 2, order: 6 },
  },
  {
    id: "today-transactions",
    title: "Today's Transactions",
    type: "today-transactions",
    visible: true,
    permissions: ["cfo", "manager", "clerk"],
    group: "table",
    position: { col: 1, colSpan: 2, rowSpan: 2, order: 7 },
  },
  {
    id: "week-transactions",
    title: "This Week's Transactions",
    type: "week-transactions",
    visible: true,
    permissions: ["cfo", "manager", "clerk"],
    group: "table",
    position: { col: 3, colSpan: 2, rowSpan: 2, order: 8 },
  },
]

export const useArDashboardStore = createDashboardStore(
  "ar-dashboard-layout",
  widgets
)
