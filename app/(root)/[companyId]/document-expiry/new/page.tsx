"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { DocumentBundleForm } from "@/components/document-expiry/document-bundle-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSaveDocument } from "@/hooks/use-document-expiry"
import { SaveDocumentWithDetailsViewModel } from "@/interfaces/document-expiry-view-model"
import { formatDateForApi } from "@/lib/date-utils"

function validateCreate(values: SaveDocumentWithDetailsViewModel): string | null {
  if (!values.companyId || values.companyId <= 0) return "Company is required."
  if (!values.documentTitle?.trim()) return "Document title is required."
  if (!values.documentCategoryId || values.documentCategoryId <= 0)
    return "Category is required."
  if (!values.details?.length) return "Add at least one document line."

  for (let i = 0; i < values.details.length; i++) {
    const line = values.details[i]
    if (!line.documentTypeId || line.documentTypeId <= 0)
      return `Line ${i + 1}: document type is required.`
    if (!formatDateForApi(line.expiryDate))
      return `Line ${i + 1}: expiry date is required.`
  }
  return null
}

export default function NewDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const base = `/${companyId}/document-expiry`
  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentWithDetailsViewModel) => {
    const validationError = validateCreate(values)
    if (validationError) {
      toast.error(validationError)
      return
    }

    const payload: SaveDocumentWithDetailsViewModel = {
      ...values,
      documentId: 0,
      companyId: values.companyId,
      documentTitle: values.documentTitle.trim(),
      details: values.details.map((d) => ({
        ...d,
        issueDate: formatDateForApi(d.issueDate) ?? undefined,
        expiryDate: formatDateForApi(d.expiryDate) ?? "",
      })),
    }

    const res = await saveMutation.mutateAsync(payload)

    if (res.result === 1 && res.data?.documentId) {
      router.push(`${base}/details/${res.data.documentId}`)
    }
  }

  return (
    <div className="@container mx-auto max-w-5xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${base}/list`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New document record</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentBundleForm
            onSubmit={handleSubmit}
            isSubmitting={saveMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
