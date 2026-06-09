"use client"

import { DocumentStatusViewModel } from "@/interfaces/document-expiry-view-model"

import {
  useDeleteDocExpiryStatus,
  useDocExpiryStatusesSetup,
  useSaveDocExpiryStatus,
} from "@/hooks/use-document-expiry-setup"
import { DocumentStatusSetupForm } from "@/app/(root)/[companyId]/document-expiry/components/setup-forms"
import {
  SetupMasterPage,
  SetupRow,
} from "@/app/(root)/[companyId]/document-expiry/components/setup-master-page"

function toRows(items: DocumentStatusViewModel[]): SetupRow[] {
  return items.map((s) => ({
    id: s.docStatusId,
    code: s.docStatusCode,
    name: s.docStatusName,
    isActive: s.isActive,
  }))
}

export default function DocumentStatusesSetupPage() {
  const { data, isLoading, refetch } = useDocExpiryStatusesSetup()
  const saveMutation = useSaveDocExpiryStatus()
  const deleteMutation = useDeleteDocExpiryStatus()

  return (
    <SetupMasterPage
      title="status"
      description="Statuses assigned by the expiry engine based on dates and rules."
      rows={toRows(data?.data ?? [])}
      isLoading={isLoading}
      FormComponent={DocumentStatusSetupForm}
      onSave={async (v) => {
        await saveMutation.mutateAsync(v)
      }}
      isSaving={saveMutation.isPending}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync(id)
      }}
      isDeleting={deleteMutation.isPending}
      refetch={() => refetch()}
    />
  )
}
