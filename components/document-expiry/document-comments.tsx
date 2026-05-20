"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Loader2, Trash2 } from "lucide-react"

import type { DocumentCommentDto } from "@/interfaces/document-expiry"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  useAddDocumentComment,
  useDeleteDocumentComment,
  useDocumentComments,
} from "@/hooks/use-document-expiry"

function fmtDate(value: string) {
  try {
    return format(parseISO(value), "dd/MM/yyyy HH:mm")
  } catch {
    return value
  }
}

export function DocumentComments({ documentId }: { documentId: string }) {
  const [text, setText] = useState("")
  const { data, isLoading } = useDocumentComments(documentId)
  const addMutation = useAddDocumentComment()
  const deleteMutation = useDeleteDocumentComment()

  const comments: DocumentCommentDto[] = data?.data ?? []

  const handleAdd = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    await addMutation.mutateAsync({ documentId, commentText: trimmed })
    setText("")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an internal note…"
          rows={3}
          maxLength={2000}
        />
        <Button
          size="sm"
          onClick={() => void handleAdd()}
          disabled={!text.trim() || addMutation.isPending}
        >
          {addMutation.isPending && (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          )}
          Add comment
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet.</p>
      ) : (
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {comments.map((c) => (
            <li
              key={c.commentId}
              className="border-muted rounded-md border p-3 text-sm"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {c.createdByName ?? `User ${c.createdById ?? ""}`} ·{" "}
                  {fmtDate(c.createdDate)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title="Remove comment"
                  onClick={() =>
                    void deleteMutation.mutateAsync({
                      documentId,
                      commentId: c.commentId,
                    })
                  }
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="whitespace-pre-wrap">{c.commentText}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
