# Overview API Calls

These overview endpoints are called through the proxy base URL.

Browser request format:

- `/api/proxy/<endpoint>?companyId={companyId}`

## AR Overview

- `/api/proxy/ar/kpi?companyId={companyId}`
- `/api/proxy/ar/aging?companyId={companyId}`
- `/api/proxy/ar/overdue-customers?companyId={companyId}`
- `/api/proxy/ar/top-customers?companyId={companyId}`
- `/api/proxy/ar/transactions/today?companyId={companyId}`
- `/api/proxy/ar/transactions/week?companyId={companyId}`

## AP Overview

- `/api/proxy/ap/kpi?companyId={companyId}`
- `/api/proxy/ap/aging?companyId={companyId}`
- `/api/proxy/ap/overdue-suppliers?companyId={companyId}`
- `/api/proxy/ap/top-suppliers?companyId={companyId}`
- `/api/proxy/ap/transactions/today?companyId={companyId}`
- `/api/proxy/ap/transactions/week?companyId={companyId}`

## GL Overview

- `/api/proxy/gl/kpi?companyId={companyId}`
- `/api/proxy/gl/account-type-balances?companyId={companyId}`
- `/api/proxy/gl/journals/recent?companyId={companyId}`
- `/api/proxy/gl/trial-balance?companyId={companyId}`

## CB Overview

- `/api/proxy/cb/kpi?companyId={companyId}`
- `/api/proxy/cb/bank-accounts?companyId={companyId}`
- `/api/proxy/cb/cash-flow?companyId={companyId}`
- `/api/proxy/cb/transactions/recent?companyId={companyId}`
- `/api/proxy/cb/transactions/week?companyId={companyId}`
