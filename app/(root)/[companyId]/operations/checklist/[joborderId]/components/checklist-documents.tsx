"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { IJobOrderHd } from "@/interfaces/checklist"

import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import DocumentOperationsManager from "@/components/document-manager/document-operations-manager"

interface ChecklistDocumentsFormProps {
  jobData?: IJobOrderHd | null
}

export function ChecklistDocuments({ jobData }: ChecklistDocumentsFormProps) {
  const params = useParams()
  const companyId = params.companyId as string

  // Memoize jobOrderId and jobOrderNo to prevent infinite re-renders
  const jobOrderId = useMemo(
    () => jobData?.jobOrderId?.toString() || "0",
    [jobData?.jobOrderId]
  )
  const jobOrderNo = useMemo(
    () => jobData?.jobOrderNo || "",
    [jobData?.jobOrderNo]
  )

  return (
    <DocumentOperationsManager
      moduleId={ModuleId.operations}
      transactionId={OperationsTransactionId.checklist}
      recordId={jobOrderId}
      recordNo={jobOrderNo}
      companyId={Number(companyId)}
      maxFileSize={10}
      maxFiles={10}
    />
  )
}
