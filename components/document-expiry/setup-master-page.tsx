"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export type SetupRow = {
  id: number
  code: string
  name: string
  isActive: boolean
  subtitle?: string
  meta?: Record<string, unknown>
}

export function SetupMasterPage<TFormValues>({
  title,
  description,
  settingsHref,
  rows,
  isLoading,
  FormComponent,
  onSave,
  isSaving,
  onDelete,
  isDeleting,
  refetch,
}: {
  title: string
  description: string
  settingsHref?: string
  rows: SetupRow[]
  isLoading: boolean
  FormComponent: React.ComponentType<{
    initialId?: number
    row?: SetupRow | null
    onSubmit: (values: TFormValues) => void | Promise<void>
    isSubmitting?: boolean
    onCancel?: () => void
  }>
  onSave: (values: TFormValues) => Promise<void>
  isSaving: boolean
  onDelete: (id: string) => Promise<void>
  isDeleting: boolean
  refetch: () => void
}) {
  const params = useParams()
  const companyId = String(params.companyId ?? "")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRow, setEditRow] = useState<SetupRow | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const handleSave = async (values: TFormValues) => {
    await onSave(values)
    setDialogOpen(false)
    setEditRow(null)
    refetch()
  }

  const handleDelete = async () => {
    if (deleteId == null) return
    await onDelete(String(deleteId))
    setDeleteId(null)
    refetch()
  }

  const backHref =
    settingsHref ?? `/${companyId}/document-expiry/settings`

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Settings
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditRow(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No records yet.
            </p>
          ) : (
            <ul className="divide-y">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {row.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({row.code})
                      </span>
                    </p>
                    {row.subtitle && (
                      <p className="text-muted-foreground text-xs">{row.subtitle}</p>
                    )}
                    {!row.isActive && (
                      <Badge variant="destructive" className="mt-1">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditRow(row)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!row.isActive}
                      onClick={() => setDeleteId(row.id)}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? `Edit ${title}` : `New ${title}`}</DialogTitle>
          </DialogHeader>
          <FormComponent
            row={editRow}
            onSubmit={handleSave}
            isSubmitting={isSaving}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId != null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate record?</AlertDialogTitle>
            <AlertDialogDescription>
              The record will be marked inactive and hidden from document forms.
              Existing documents are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
