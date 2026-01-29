// main-tab.tsx - GL Year End Process
"use client"

import React, { useEffect, useRef, useState } from "react"
import { IGLOpeningBalance } from "@/interfaces"
import { GLYearEndProcessRequestSchemaType } from "@/schemas/gl-yearendprocess"
import { useAuthStore } from "@/stores/auth-store"

import YearEndProcessForm, {
  YearEndProcessFormRef,
} from "./yearendprocess-form"
import YearEndProcessTable from "./yearendprocess-table"

export interface YearEndProcessTotals {
  totDebitLocalAmt: number
  totCreditLocalAmt: number
}

interface MainProps {
  onGenerateAction?: (requestData: GLYearEndProcessRequestSchemaType) => void
  onResetAction?: () => void
  companyId: number
  documentId?: string | undefined
  tableData?: IGLOpeningBalance[]
  onTotalsChange?: (totals: YearEndProcessTotals) => void
  onTableDataChange?: (data: IGLOpeningBalance[]) => void
  formRef?: React.RefObject<YearEndProcessFormRef>
}

export default function Main({
  onGenerateAction,
  onResetAction,
  companyId,
  documentId,
  tableData = [],
  onTotalsChange,
  onTableDataChange,
  formRef,
}: MainProps) {
  const { decimals: _decimals } = useAuthStore()

  const [dataDetails, setDataDetails] = useState<IGLOpeningBalance[]>([])
  const internalFormRef = useRef<YearEndProcessFormRef>(null)
  const formRefToUse = formRef ?? internalFormRef

  // Update table data when tableData prop changes
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      setDataDetails(tableData)
    } else {
      setDataDetails([])
    }
  }, [tableData])

  // Report debit/credit totals (local amount only) to page for header badges
  useEffect(() => {
    if (!onTotalsChange) return
    const totDebitLocalAmt = dataDetails.reduce(
      (sum, d) => sum + (d.isDebit ? Number(d.totLocalAmt) || 0 : 0),
      0
    )
    const totCreditLocalAmt = dataDetails.reduce(
      (sum, d) => sum + (!d.isDebit ? Number(d.totLocalAmt) || 0 : 0),
      0
    )
    onTotalsChange({ totDebitLocalAmt, totCreditLocalAmt })
  }, [dataDetails, onTotalsChange])

  return (
    <div className="w-full">
      <YearEndProcessForm
        ref={formRefToUse}
        onGenerateAction={onGenerateAction}
        onResetAction={onResetAction}
        companyId={companyId}
        defaultDocumentId={documentId ? Number(documentId) : 0}
      />

      {dataDetails.length > 0 && (
        <div className="mt-4">
          <YearEndProcessTable
            data={(dataDetails as unknown as IGLOpeningBalance[]) || []}
            onRefreshAction={() => {}}
            onFilterChange={() => {}}
          />
        </div>
      )}
    </div>
  )
}
