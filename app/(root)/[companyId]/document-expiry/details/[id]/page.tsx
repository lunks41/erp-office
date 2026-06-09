"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"

import {
  useDocumentById,
  useRenewalHistoryReport,
} from "@/hooks/use-document-expiry"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DocumentComments } from "@/app/(root)/[companyId]/document-expiry/components/document-comments"
import { DocumentDetailLines } from "@/app/(root)/[companyId]/document-expiry/components/document-detail-lines"
import { DocumentHistoryTimeline } from "@/app/(root)/[companyId]/document-expiry/components/document-history-timeline"

export default function DocumentDetailsPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const base = `/${companyId}/document-expiry`
  const id = String(params.id ?? "")

  const { data: docRes, isLoading } = useDocumentById(id)
  const { data: historyRes, isLoading: historyLoading } =
    useRenewalHistoryReport()

  const header = docRes?.data

  const historyForDoc = useMemo(() => {
    const all = historyRes?.data ?? []
    return all.filter((h) => h.documentId === Number(id))
  }, [historyRes?.data, id])

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!header) {
    return (
      <p className="text-muted-foreground p-6 text-sm">Document not found.</p>
    )
  }

  return (
    <div className="@container mx-auto space-y-6 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${base}/list`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`${base}/edit/${id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{header.title}</CardTitle>
          {header.companyName && (
            <p className="text-muted-foreground text-sm">
              {header.companyName}
            </p>
          )}
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Category</span>
            <p>{header.docCategoryName ?? "—"}</p>
          </div>
          {header.remarks && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Header remarks</span>
              <p>{header.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document lines</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentDetailLines documentId={id} lines={header.details} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentHistoryTimeline
              items={historyForDoc}
              isLoading={historyLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentComments documentId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
