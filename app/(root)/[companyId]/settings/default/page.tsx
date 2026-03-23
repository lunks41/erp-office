"use client"

import { useState } from "react"

import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { DefaultForm } from "./components/default-form"

export default function SettingsAccountPage() {
  const [isLoading] = useState(false)
  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {isLoading ? (
        <DataTableSkeleton
          columnCount={8}
          filterCount={2}
          cellWidths={[
            "10rem",
            "30rem",
            "10rem",
            "10rem",
            "10rem",
            "10rem",
            "6rem",
            "6rem",
          ]}
          shrinkZero
        />
      ) : (
        <DefaultForm />
      )}
    </div>
  )
}
