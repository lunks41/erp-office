import {
  DashboardWidget,
  createDashboardStore,
} from "@/stores/dashboard-store-factory"

const widgets: DashboardWidget[] = [
  {
    id: "total-ap",
    title: "Total AP",
    type: "total-ap",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 1, colSpan: 1, rowSpan: 1, order: 0 },
  },
  {
    id: "overdue-payables",
    title: "Overdue Payables",
    type: "overdue-payables",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 2, colSpan: 1, rowSpan: 1, order: 1 },
  },
  {
    id: "dpo",
    title: "Days Payable Outstanding",
    type: "dpo",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 3, colSpan: 1, rowSpan: 1, order: 2 },
  },
  {
    id: "invoices-due",
    title: "Invoices Due",
    type: "invoices-due",
    visible: true,
    permissions: ["cfo"],
    group: "kpi",
    position: { col: 4, colSpan: 1, rowSpan: 1, order: 3 },
  },
  {
    id: "ap-aging",
    title: "AP Aging",
    type: "ap-aging",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "chart",
    position: { col: 1, colSpan: 2, rowSpan: 2, order: 4 },
  },
  {
    id: "overdue-suppliers",
    title: "Overdue by Supplier",
    type: "overdue-suppliers",
    visible: true,
    permissions: ["manager", "cfo"],
    group: "chart",
    position: { col: 3, colSpan: 2, rowSpan: 2, order: 5 },
  },
  {
    id: "top-suppliers",
    title: "Top 10 Suppliers",
    type: "top-suppliers",
    visible: true,
    permissions: ["cfo", "manager", "clerk"],
    group: "table",
    position: { col: 1, colSpan: 4, rowSpan: 2, order: 6 },
  },
  {
    id: "today-transactions",
    title: "Today's AP Transactions",
    type: "today-transactions",
    visible: true,
    permissions: ["cfo", "manager", "clerk"],
    group: "table",
    position: { col: 1, colSpan: 2, rowSpan: 2, order: 7 },
  },
  {
    id: "week-transactions",
    title: "This Week's AP Transactions",
    type: "week-transactions",
    visible: true,
    permissions: ["cfo", "manager", "clerk"],
    group: "table",
    position: { col: 3, colSpan: 2, rowSpan: 2, order: 8 },
  },
]

export const useApDashboardStore = createDashboardStore(
  "ap-dashboard-layout",
  widgets
)
