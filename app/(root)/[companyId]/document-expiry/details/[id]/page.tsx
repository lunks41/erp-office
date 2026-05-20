"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Pencil, RefreshCw } from "lucide-react"

import { DocumentComments } from "@/components/document-expiry/document-comments"
import { DocumentHistoryTimeline } from "@/components/document-expiry/document-history-timeline"
import { ExpiryBadge } from "@/components/document-expiry/expiry-badge"
import { UploadDropzone } from "@/components/document-expiry/upload-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useDocumentAttachments,
  useDocumentById,
  useRenewDocument,
  useRenewalHistoryReport,
  useUploadDocumentAttachment,
} from "@/hooks/use-document-expiry"

function fmtDate(value?: string | null) {
  if (!value) return "—"
  try {
    return format(parseISO(value), "dd/MM/yyyy")
  } catch {
    return value
  }
}

export default function DocumentDetailsPage() {
  const params = useParams()
  const companyId = String(params.companyId ?? "")
  const id = String(params.id ?? "")

  const { data: docRes, isLoading } = useDocumentById(id)
  const { data: attachmentsRes, refetch: refetchAttachments } =
    useDocumentAttachments(id)
  const { data: historyRes, isLoading: historyLoading } =
    useRenewalHistoryReport()
  const renewMutation = useRenewDocument()
  const uploadMutation = useUploadDocumentAttachment()

  const [renewOpen, setRenewOpen] = useState(false)
  const [newExpiry, setNewExpiry] = useState("")
  const [renewRemarks, setRenewRemarks] = useState("")

  const doc = docRes?.data
  const attachments = attachmentsRes?.data ?? []

  const historyForDoc = useMemo(() => {
    const all = historyRes?.data ?? []
    return all.filter((h) => h.documentId === Number(id))
  }, [historyRes?.data, id])

  const handleRenew = async () => {
    if (!newExpiry) return
    await renewMutation.mutateAsync({
      id,
      dto: {
        documentId: Number(id),
        newExpiryDate: new Date(newExpiry).toISOString(),
        remarks: renewRemarks || undefined,
      },
    })
    setRenewOpen(false)
    setNewExpiry("")
    setRenewRemarks("")
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!doc) {
    return (
      <p className="text-muted-foreground p-6 text-sm">Document not found.</p>
    )
  }

  return (
    <div className="@container mx-auto space-y-6 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${companyId}/document-expiry/list`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${companyId}/document-expiry/edit/${id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button size="sm" onClick={() => setRenewOpen(true)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Renew
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{doc.documentTitle}</CardTitle>
              {doc.documentNo && (
                <p className="text-muted-foreground text-sm">{doc.documentNo}</p>
              )}
            </div>
            <ExpiryBadge
              priorityLevel={doc.priorityLevel}
              statusName={doc.statusName}
              daysUntilExpiry={doc.daysUntilExpiry}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Type</span>
            <p>{doc.documentTypeName ?? "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Category</span>
            <p>{doc.documentCategoryName ?? "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Expiry</span>
            <p>{fmtDate(doc.expiryDate)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Issue</span>
            <p>{fmtDate(doc.issueDate)}</p>
          </div>
          {doc.description && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Description</span>
              <p>{doc.description}</p>
            </div>
          )}
          {doc.remarks && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Remarks</span>
              <p>{doc.remarks}</p>
            </div>
          )}
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
            {doc.remarks && (
              <blockquote className="border-muted mt-4 border-l-2 pl-3 text-sm italic text-muted-foreground">
                Remarks: {doc.remarks}
              </blockquote>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attachments ({attachments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadDropzone
            disabled={uploadMutation.isPending}
            onFileSelect={async (file) => {
              await uploadMutation.mutateAsync({ documentId: id, file })
              refetchAttachments()
            }}
          />
          {attachments.length > 0 && (
            <ul className="divide-y text-sm">
              {attachments.map((a) => (
                <li
                  key={a.attachmentId}
                  className="flex justify-between py-2"
                >
                  <span>{a.fileName}</span>
                  <span className="text-muted-foreground text-xs">
                    {fmtDate(a.uploadedDate)} · v{a.versionNo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newExpiry">New expiry date</Label>
              <Input
                id="newExpiry"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewRemarks">Remarks</Label>
              <Textarea
                id="renewRemarks"
                value={renewRemarks}
                onChange={(e) => setRenewRemarks(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!newExpiry || renewMutation.isPending}
              onClick={handleRenew}
            >
              Confirm renewal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
