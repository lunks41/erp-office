"use client"

import { useCallback, useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { Loader2, ClipboardCheck, CheckCircle2, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useSignalR } from "@/hooks/use-signalr"

interface PendingApproval {
  approvalRequestId: number
  companyId: number
  moduleCode: string
  referenceId: number
  currentLevel: number
  status: string
  createdBy: number
  createdByName: string
  createdDate: string | null
  currentLevelName: string
  approverName: string
}

type ActionType = "APPROVE" | "REJECT"

function fmtDate(str: string | null | undefined) {
  if (!str) return "—"
  try { return format(parseISO(str), "dd/MM/yyyy HH:mm") } catch { return str }
}

export default function PendingApprovalsPage() {
  const [items, setItems] = useState<PendingApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<ActionType>("APPROVE")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPending = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get(
        "/approval/pending-approvals?pageNumber=1&pageSize=100"
      )
      setItems(res.data?.data ?? [])
    } catch {
      toast.error("Failed to load pending approvals.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  // Refresh when a new approval notification arrives
  useSignalR({
    ReceiveApprovalNotification: () => { fetchPending() },
  })

  const openAction = (id: number, type: ActionType) => {
    setSelectedId(id)
    setActionType(type)
    setRemarks("")
    setActionDialogOpen(true)
  }

  const handleAction = async () => {
    if (!selectedId) return
    if (actionType === "REJECT" && !remarks.trim()) {
      toast.error("Remarks are required when rejecting.")
      return
    }
    setIsSubmitting(true)
    try {
      await apiClient.post("/approval/take-action", {
        approvalRequestId: selectedId,
        action: actionType,
        remarks: remarks.trim() || null,
      })
      toast.success(actionType === "APPROVE" ? "Invoice approved." : "Invoice rejected.")
      setActionDialogOpen(false)
      fetchPending()
    } catch {
      toast.error("Failed to submit action.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
          Pending Approvals
        </h1>
        <p className="text-muted-foreground text-sm">
          Transactions waiting for your approval action.
        </p>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 opacity-40" />
            <p className="text-sm">No pending approvals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium">Module</th>
                  <th className="px-4 py-3 text-left font-medium">Reference</th>
                  <th className="px-4 py-3 text-left font-medium">Level</th>
                  <th className="px-4 py-3 text-left font-medium">Requested By</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.approvalRequestId} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Badge variant="outline">{item.moduleCode}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      #{item.referenceId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">L{item.currentLevel}</div>
                      <div className="text-[11px] text-muted-foreground">{item.currentLevelName}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.createdByName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {fmtDate(item.createdDate)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        Pending
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                          onClick={() => openAction(item.approvalRequestId, "APPROVE")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 border-red-300 text-red-600 hover:bg-red-50 text-xs dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                          onClick={() => openAction(item.approvalRequestId, "REJECT")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
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

      {/* Approve / Reject confirmation dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className={actionType === "APPROVE" ? "text-emerald-600" : "text-destructive"}>
              {actionType === "APPROVE" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              {actionType === "APPROVE"
                ? "Confirm approval of this transaction. It will proceed to the next level or be fully approved."
                : "Rejecting will notify the requestor and close this approval."}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="ap-remarks">
                Remarks {actionType === "REJECT" && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="ap-remarks"
                rows={3}
                placeholder={actionType === "REJECT" ? "Reason for rejection..." : "Optional remarks..."}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isSubmitting}
              className={actionType === "APPROVE"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-destructive hover:bg-destructive/90"}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "APPROVE" ? "Confirm Approve" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
