"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"

import {
  ReminderRuleForm,
  ReminderRuleFormValues,
} from "@/components/document-expiry/reminder-rule-form"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ReminderRuleDto } from "@/interfaces/document-expiry"
import {
  useDeleteReminderRule,
  useReminderRules,
  useSaveReminderRule,
} from "@/hooks/use-document-expiry"
import { useParams } from "next/navigation"
import { EXPIRY_PRIORITY_LABELS } from "@/lib/api-routes"

export default function ReminderRulesPage() {
  const companyId = useParams().companyId as string
  const { data: rulesRes, isLoading, refetch } = useReminderRules()
  const saveMutation = useSaveReminderRule()
  const deleteMutation = useDeleteReminderRule()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRule, setEditRule] = useState<ReminderRuleDto | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const rules = rulesRes?.data ?? []

  const handleSave = async (values: ReminderRuleFormValues) => {
    await saveMutation.mutateAsync(values)
    setDialogOpen(false)
    setEditRule(null)
    refetch()
  }

  const handleDelete = async () => {
    if (deleteId == null) return
    await deleteMutation.mutateAsync(String(deleteId))
    setDeleteId(null)
    refetch()
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/${companyId}/document-expiry/settings`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Settings
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Reminder rules
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure when users are notified before expiry.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditRule(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No reminder rules configured.
            </p>
          ) : (
            <ul className="divide-y">
              {rules.map((rule) => (
                <li
                  key={rule.reminderRuleId}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {rule.documentTypeName ?? "All types"} ·{" "}
                      {rule.daysBeforeExpiry} days before
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline">
                        {EXPIRY_PRIORITY_LABELS[
                          rule.priorityLevel as 1 | 2 | 3
                        ] ?? "Info"}
                      </Badge>
                      {rule.isPopupEnabled && (
                        <Badge variant="secondary">Popup</Badge>
                      )}
                      {rule.isEmailEnabled && (
                        <Badge variant="secondary">Email</Badge>
                      )}
                      {!rule.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditRule(rule)
                        setDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(rule.reminderRuleId)}
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
            <DialogTitle>
              {editRule ? "Edit reminder rule" : "New reminder rule"}
            </DialogTitle>
          </DialogHeader>
          <ReminderRuleForm
            rule={editRule}
            onSubmit={handleSave}
            isSubmitting={saveMutation.isPending}
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
            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This reminder rule will be removed permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
