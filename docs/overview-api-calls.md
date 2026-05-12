# Overview API Calls

Overview UIs call the **api-core** `AccountOverviewController` (`[Route("api")]`), forwarded by Next.js **`/api/proxy/[...path]`** to `{NEXT_PUBLIC_API_URL}/{path}`.

Browser request format:

- `/api/proxy/<endpoint>?companyId={companyId}`

**Path source of truth (erp-office):** `lib/overview-dashboard-routes.ts` for AP, CB, and GL — keep in sync with `erp-kendo-portal/lib/api-routes.ts` → `OverviewDashboard` and the controller.

## AR Overview

- `/api/proxy/ar/kpi?companyId={companyId}`
- `/api/proxy/ar/aging?companyId={companyId}`
- `/api/proxy/ar/overdue-customers?companyId={companyId}`
- `/api/proxy/ar/top-customers?companyId={companyId}`
- `/api/proxy/ar/transactions/today?companyId={companyId}`
- `/api/proxy/ar/transactions/week?companyId={companyId}`

Optional AR extensions (after SQL deploy; see `api-core/Database/AccountOverview/AR_Overview_Extensions.Deploy.sql`):

- `/api/proxy/ar/sales-vs-collections?companyId={companyId}`
- `/api/proxy/ar/collection-target-vs-actual?companyId={companyId}`
- `/api/proxy/ar/cash-inflow-forecast?companyId={companyId}&horizonDays=90`
- `/api/proxy/ar/credit-limit-utilization?companyId={companyId}`
- `/api/proxy/ar/disputed-invoices?companyId={companyId}`
- `/api/proxy/ar/unapplied-receipts?companyId={companyId}`
- `/api/proxy/ar/open-collection-tasks?companyId={companyId}`

## AP Overview

- `/api/proxy/ap/kpi?companyId={companyId}`
- `/api/proxy/ap/aging?companyId={companyId}`
- `/api/proxy/ap/overdue-suppliers?companyId={companyId}`
- `/api/proxy/ap/top-suppliers?companyId={companyId}`
- `/api/proxy/ap/transactions/today?companyId={companyId}`
- `/api/proxy/ap/transactions/week?companyId={companyId}`

Optional AP extensions (after SQL deploy; see `api-core/Database/AccountOverview/AP_CB_GL_Overview_Extensions.Deploy.sql`):

- `/api/proxy/ap/spend-vs-payments?companyId={companyId}`
- `/api/proxy/ap/payment-target-vs-actual?companyId={companyId}`
- `/api/proxy/ap/cash-outflow-forecast?companyId={companyId}&horizonDays=90`
- `/api/proxy/ap/vendor-concentration?companyId={companyId}`

## GL Overview

- `/api/proxy/gl/kpi?companyId={companyId}`
- `/api/proxy/gl/account-type-balances?companyId={companyId}`
- `/api/proxy/gl/journals/recent?companyId={companyId}`
- `/api/proxy/gl/trial-balance?companyId={companyId}`

Optional GL extensions (`AP_CB_GL_Overview_Extensions.Deploy.sql`):

- `/api/proxy/gl/accounting-period-status?companyId={companyId}`
- `/api/proxy/gl/suspense-balances?companyId={companyId}`
- `/api/proxy/gl/unposted-journal-summary?companyId={companyId}`
- `/api/proxy/gl/account-type-movement?companyId={companyId}`

## CB Overview

- `/api/proxy/cb/kpi?companyId={companyId}`
- `/api/proxy/cb/bank-accounts?companyId={companyId}`
- `/api/proxy/cb/cash-flow?companyId={companyId}`
- `/api/proxy/cb/transactions/recent?companyId={companyId}`
- `/api/proxy/cb/transactions/week?companyId={companyId}`

Optional CB extensions (`AP_CB_GL_Overview_Extensions.Deploy.sql`):

- `/api/proxy/cb/liquidity-forecast?companyId={companyId}&horizonDays=90`
- `/api/proxy/cb/reconciliation-status?companyId={companyId}`
- `/api/proxy/cb/cash-concentration-by-bank?companyId={companyId}`
- `/api/proxy/cb/open-treasury-tasks?companyId={companyId}`
