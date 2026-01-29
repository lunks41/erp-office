// main-tab.tsx - GL Year End Process
"use client"

import React, { useEffect, useRef, useState } from "react"
import { IGLOpeningBalance } from "@/interfaces"
import { GLYearEndProcessRequestSchemaType } from "@/schemas/gl-yearendprocess"
import { useAuthStore } from "@/stores/auth-store"
import { AlertTriangle } from "lucide-react"

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
        <div className="mt-4 space-y-4">
          {/* Information Box */}
          <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-red-900 dark:text-red-200">
                  Year-End Process Information
                </h4>
                <div className="space-y-1.5 text-sm text-red-800 dark:text-red-300">
                  <p className="font-medium">
                    Before you proceed, make sure that:
                  </p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      You have closed all 12 fiscal periods for the selected
                      year.
                    </li>
                    <li>
                      You have executed Temporary Year-End process recently to
                      register latest closing entries.
                    </li>
                    <li>
                      All pending transactions have been posted and reconciled.
                    </li>
                    <li>
                      Backup of current data has been created before proceeding.
                    </li>
                  </ul>
                  <p className="mt-2 font-semibold">
                    Click Generate to proceed with the Year-End process!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
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
