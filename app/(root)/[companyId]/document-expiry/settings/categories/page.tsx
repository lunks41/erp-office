"use client"

import { DocumentCategoryViewModel } from "@/interfaces/document-expiry-view-model"

import {
  useDeleteDocExpiryCategory,
  useDocExpiryCategoriesSetup,
  useSaveDocExpiryCategory,
} from "@/hooks/use-document-expiry-setup"
import { DocumentCategorySetupForm } from "@/app/(root)/[companyId]/document-expiry/components/setup-forms"
import {
  SetupMasterPage,
  SetupRow,
} from "@/app/(root)/[companyId]/document-expiry/components/setup-master-page"

function toRows(items: DocumentCategoryViewModel[]): SetupRow[] {
  return items.map((c) => ({
    id: c.documentCategoryId,
    code: c.documentCategoryCode,
    name: c.documentCategoryName,
    isActive: c.isActive,
  }))
}

export default function DocumentCategoriesSetupPage() {
  const { data, isLoading, refetch } = useDocExpiryCategoriesSetup()
  const saveMutation = useSaveDocExpiryCategory()
  const deleteMutation = useDeleteDocExpiryCategory()

  return (
    <SetupMasterPage
      title="category"
      description="Categories group documents for reporting and filtering."
      rows={toRows(data?.data ?? [])}
      isLoading={isLoading}
      FormComponent={DocumentCategorySetupForm}
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
