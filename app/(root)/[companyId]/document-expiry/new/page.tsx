"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { DocumentForm } from "@/components/document-expiry/document-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSaveDocument } from "@/hooks/use-document-expiry"
import { SaveDocumentDto } from "@/interfaces/document-expiry"
import { formatDateForApi } from "@/lib/date-utils"

function validateCreate(values: SaveDocumentDto): string | null {
  if (!values.documentTitle?.trim()) return "Document title is required."
  if (!values.documentTypeId || values.documentTypeId <= 0)
    return "Document type is required."
  if (!values.documentCategoryId || values.documentCategoryId <= 0)
    return "Category is required."
  if (!values.referenceTypeId || values.referenceTypeId <= 0)
    return "Reference type is required."
  if (!values.referenceId || values.referenceId <= 0)
    return "Reference ID must be greater than zero."
  const expiry = formatDateForApi(values.expiryDate)
  if (!expiry) return "Expiry date is required."
  return null
}

export default function NewDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = String(params.companyId ?? "")

  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentDto) => {
    const validationError = validateCreate(values)
    if (validationError) {
      toast.error(validationError)
      return
    }

    const expiryDate = formatDateForApi(values.expiryDate)
    const issueDate = formatDateForApi(values.issueDate)

    const res = await saveMutation.mutateAsync({
      ...values,
      documentId: 0,
      documentTitle: values.documentTitle.trim(),
      expiryDate: expiryDate ?? "",
      issueDate: issueDate ?? undefined,
    })

    if (res.result === 1 && res.data?.documentId) {
      router.push(
        `/${companyId}/document-expiry/details/${res.data.documentId}`
      )
    }
  }

  return (
    <div className="@container mx-auto max-w-3xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/${companyId}/document-expiry/list`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New document</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentForm
            onSubmit={handleSubmit}
            isSubmitting={saveMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
