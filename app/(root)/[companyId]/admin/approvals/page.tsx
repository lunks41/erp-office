"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface ApprovalSetup {
  processId: number
  moduleCode: string
  level: number
  levelName: string
  approverId: number
  approverName: string
  minAmt: number
  maxAmt: number | null
  isActive: boolean
  createByName: string
  createDate: string
}

interface SetupForm {
  moduleCode: string
  level: number
  levelName: string
  approverId: string
  minAmt: string
  maxAmt: string
  isActive: boolean
}

const emptyForm: SetupForm = {
  moduleCode: "",
  level: 1,
  levelName: "",
  approverId: "",
  minAmt: "0",
  maxAmt: "",
  isActive: true,
}

export default function ApprovalsAdminPage() {
  const [items, setItems] = useState<ApprovalSetup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<SetupForm>(emptyForm)

  const fetchSetups = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get(
        "/approval/GetApprovalProcessList?pageNumber=1&pageSize=100"
      )
      setItems(res.data?.data ?? [])
    } catch {
      toast.error("Failed to load approval setups.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSetups() }, [fetchSetups])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (s: ApprovalSetup) => {
    setEditId(s.processId)
    setForm({
      moduleCode: s.moduleCode,
      level: s.level,
      levelName: s.levelName,
      approverId: String(s.approverId),
      minAmt: String(s.minAmt),
      maxAmt: s.maxAmt != null ? String(s.maxAmt) : "",
      isActive: s.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.moduleCode.trim() || !form.levelName.trim() || !form.approverId.trim()) {
      toast.error("Module, level name, and approver are required.")
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        processId: editId ?? 0,
        moduleCode: form.moduleCode.trim().toUpperCase(),
        level: Number(form.level),
        levelName: form.levelName.trim(),
        approverId: Number(form.approverId),
        minAmt: Number(form.minAmt) || 0,
        maxAmt: form.maxAmt ? Number(form.maxAmt) : null,
        isActive: form.isActive,
      }
      await apiClient.post("/approval/SaveApprovalProcess", payload)
      toast.success(editId ? "Setup updated." : "Setup created.")
      setDialogOpen(false)
      fetchSetups()
    } catch {
      toast.error("Failed to save.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteId == null) return
    try {
      await apiClient.delete(`/approval/DeleteApprovalProcess/${deleteId}`)
      toast.success("Setup deleted.")
      fetchSetups()
    } catch {
      toast.error("Failed to delete.")
    } finally {
      setDeleteId(null)
    }
  }

  // Group rows by module for display
  const grouped = items.reduce<Record<string, ApprovalSetup[]>>((acc, s) => {
    ;(acc[s.moduleCode] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Approval Setup
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure module approval levels and approvers.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Level
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border py-20 text-muted-foreground">
          <ShieldCheck className="h-8 w-8 opacity-40" />
          <p className="text-sm">No approval setups configured.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([moduleCode, rows]) => (
            <div key={moduleCode} className="rounded-lg border">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{moduleCode} Module</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Level</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Level Name</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Approver</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Min Amt</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Max Amt</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                      <th className="w-20 px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .sort((a, b) => a.level - b.level)
                      .map((s) => (
                        <tr key={s.processId} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="font-mono">
                              L{s.level}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 font-medium">{s.levelName}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.approverName}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{s.minAmt.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {s.maxAmt != null ? s.maxAmt.toLocaleString() : "∞"}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge
                              variant={s.isActive ? "default" : "secondary"}
                              className={s.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : ""}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEdit(s)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(s.processId)}
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
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Approval Level" : "Add Approval Level"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ap-module">
                  Module Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ap-module"
                  placeholder="e.g. AR, AP"
                  value={form.moduleCode}
                  onChange={(e) => setForm((f) => ({ ...f, moduleCode: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-level">
                  Level <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ap-level"
                  type="number"
                  min={1}
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ap-levelname">
                Level Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ap-levelname"
                placeholder="e.g. Senior DA Approval"
                value={form.levelName}
                onChange={(e) => setForm((f) => ({ ...f, levelName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ap-approver">
                Approver User ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ap-approver"
                type="number"
                placeholder="User ID"
                value={form.approverId}
                onChange={(e) => setForm((f) => ({ ...f, approverId: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ap-min">Min Amount</Label>
                <Input
                  id="ap-min"
                  type="number"
                  min={0}
                  value={form.minAmt}
                  onChange={(e) => setForm((f) => ({ ...f, minAmt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ap-max">Max Amount (blank = unlimited)</Label>
                <Input
                  id="ap-max"
                  type="number"
                  min={0}
                  placeholder="∞"
                  value={form.maxAmt}
                  onChange={(e) => setForm((f) => ({ ...f, maxAmt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="ap-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="ap-active" className="cursor-pointer font-normal">
                Active (approval required for this module)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Save Changes" : "Add Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Approval Level</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this approval level? This cannot be undone.
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
