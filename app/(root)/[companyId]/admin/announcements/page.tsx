"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { toast } from "sonner"
import { format, parseISO } from "date-fns"

interface Announcement {
  announcementId: number
  title: string
  message: string
  isUrgent: boolean
  validFrom: string | null
  validTo: string | null
  isActive: boolean
  createdDate: string
  createdByName: string
}

interface AnnouncementForm {
  title: string
  message: string
  isUrgent: boolean
  validFrom: string
  validTo: string
}

const emptyForm: AnnouncementForm = {
  title: "",
  message: "",
  isUrgent: false,
  validFrom: "",
  validTo: "",
}

function fmtDate(str: string | null) {
  if (!str) return "—"
  try {
    return format(parseISO(str), "dd/MM/yyyy")
  } catch {
    return str
  }
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<AnnouncementForm>(emptyForm)

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get(
        "/notifications/GetAnnouncements?pageNumber=1&pageSize=50"
      )
      setItems(res.data?.items ?? res.data?.data ?? [])
    } catch {
      toast.error("Failed to load announcements.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditId(a.announcementId)
    setForm({
      title: a.title,
      message: a.message,
      isUrgent: a.isUrgent,
      validFrom: a.validFrom ? a.validFrom.substring(0, 10) : "",
      validTo: a.validTo ? a.validTo.substring(0, 10) : "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required.")
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        isUrgent: form.isUrgent,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      }
      if (editId) {
        await apiClient.post(`/notifications/UpdateAnnouncement/${editId}`, payload)
        toast.success("Announcement updated.")
      } else {
        await apiClient.post("/notifications/SaveAnnouncement", payload)
        toast.success("Announcement created.")
      }
      setDialogOpen(false)
      fetchAnnouncements()
    } catch {
      toast.error("Failed to save announcement.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId == null) return
    try {
      await apiClient.post(`/notifications/DeleteAnnouncement/${deleteId}`)
      setItems((prev) => prev.filter((a) => a.announcementId !== deleteId))
      toast.success("Announcement deleted.")
    } catch {
      toast.error("Failed to delete announcement.")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Announcements
          </h1>
          <p className="text-muted-foreground text-sm">
            Create and manage system-wide announcements.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <Megaphone className="h-8 w-8 opacity-40" />
            <p className="text-sm">No announcements yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-card">
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Message</th>
                  <th className="px-4 py-3 text-left font-medium">Urgent</th>
                  <th className="px-4 py-3 text-left font-medium">Valid From</th>
                  <th className="px-4 py-3 text-left font-medium">Valid To</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Created By</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr
                    key={a.announcementId}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{a.title}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                      {a.message}
                    </td>
                    <td className="px-4 py-3">
                      {a.isUrgent && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          Urgent
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {fmtDate(a.validFrom)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {fmtDate(a.validTo)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          a.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.createdByName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(a.announcementId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Announcement" : "New Announcement"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Announcement title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ann-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ann-message"
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Announcement message"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ann-from">Valid From</Label>
                <Input
                  id="ann-from"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validFrom: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-to">Valid To</Label>
                <Input
                  id="ann-to"
                  type="date"
                  value={form.validTo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, validTo: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ann-urgent"
                checked={form.isUrgent}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isUrgent: v === true }))
                }
              />
              <Label htmlFor="ann-urgent" className="cursor-pointer font-normal">
                Mark as Urgent
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId != null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
