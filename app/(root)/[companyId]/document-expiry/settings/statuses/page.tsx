"use client"

import { DocumentStatusDto } from "@/interfaces/document-expiry"
import {
  useDeleteDocExpiryStatus,
  useDocExpiryStatusesSetup,
  useSaveDocExpiryStatus,
} from "@/hooks/use-document-expiry-setup"
import { DocumentStatusSetupForm } from "@/components/document-expiry/setup-forms"
import {
  SetupMasterPage,
  SetupRow,
} from "@/components/document-expiry/setup-master-page"

function toRows(items: DocumentStatusDto[]): SetupRow[] {
  return items.map((s) => ({
    id: s.statusId,
    code: s.statusCode,
    name: s.statusName,
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
      onSave={(v) => saveMutation.mutateAsync(v)}
      isSaving={saveMutation.isPending}
      onDelete={(id) => deleteMutation.mutateAsync(id)}
      isDeleting={deleteMutation.isPending}
      refetch={() => refetch()}
    />
  )
}
