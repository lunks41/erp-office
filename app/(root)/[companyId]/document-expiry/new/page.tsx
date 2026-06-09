"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { SaveDocumentWithDetailsViewModel } from "@/interfaces/document-expiry-view-model"
import { ArrowLeft } from "lucide-react"

import { useSaveDocument } from "@/hooks/use-document-expiry"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DOCUMENT_BUNDLE_FORM_ID,
  DocumentBundleForm,
} from "@/app/(root)/[companyId]/document-expiry/components/document-bundle-form"

export default function NewDocumentPage() {
  const params = useParams()

  const router = useRouter()

  const companyId = params.companyId as string

  const base = `/${companyId}/document-expiry`

  const saveMutation = useSaveDocument()

  const handleSubmit = async (values: SaveDocumentWithDetailsViewModel) => {
    try {
      const res = await saveMutation.mutateAsync({
        ...values,
        documentId: 0,
      })

      // Success/error toasts are owned by the mutation hook; only navigate here.
      if (res.result === 1 && res.data?.documentId) {
        router.push(`${base}/details/${res.data.documentId}`)
      }
    } catch {
      // mutation onError already surfaced a toast — swallow to avoid duplicates.
    }
  }

  return (
    <div className="@container mx-auto w-full max-w-7xl space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${base}/list`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>New document record</CardTitle>
          <Button
            type="submit"
            form={DOCUMENT_BUNDLE_FORM_ID}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </CardHeader>

        <CardContent>
          <DocumentBundleForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
