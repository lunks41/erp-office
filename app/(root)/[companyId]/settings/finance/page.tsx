"use client"

import { FinanceForm } from "./components/finance-form"

export default function SettingsFinancePage() {
  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {<FinanceForm />}
    </div>
  )
}
