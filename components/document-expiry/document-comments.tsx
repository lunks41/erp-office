"use client"

import { format, parseISO } from "date-fns"
import { Loader2, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"

import type { DocumentCommentDto } from "@/interfaces/document-expiry"
import CustomTextarea from "@/components/custom/custom-textarea"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
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

type CommentFormValues = { commentText: string }

export function DocumentComments({ documentId }: { documentId: string }) {
  const form = useForm<CommentFormValues>({ defaultValues: { commentText: "" } })
  const { data, isLoading } = useDocumentComments(documentId)
  const addMutation = useAddDocumentComment()
  const deleteMutation = useDeleteDocumentComment()

  const comments: DocumentCommentDto[] = data?.data ?? []

  const handleAdd = form.handleSubmit(async (values) => {
    const trimmed = values.commentText.trim()
    if (!trimmed) return
    await addMutation.mutateAsync({ documentId, commentText: trimmed })
    form.reset({ commentText: "" })
  })

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={handleAdd} className="space-y-2">
          <CustomTextarea
            form={form}
            name="commentText"
            placeholder="Add an internal note…"
            minRows={3}
            maxLength={2000}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!form.watch("commentText").trim() || addMutation.isPending}
          >
            {addMutation.isPending && (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            )}
            Add comment
          </Button>
        </form>
      </Form>

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
