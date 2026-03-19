"use client"

import { DecimalForm } from "../components/decimal-form"

export default function SettingsDecimalPage() {
  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {<DecimalForm />}
    </div>
  )
}
