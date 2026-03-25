"use client"

import { useState } from "react"
import { IPettyCashRequest } from "@/interfaces/pettycash"
import {
  CheckCircle,
  Clock as ClockIcon,
  DollarSign,
  MoreHorizontal,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"

interface PettyCashTableProps {
  pettyCashRequests: IPettyCashRequest[]
  onSaveAction?: (
    pettyCashId: string,
    action: "approve" | "reject" | "cancel",
    notes?: string
  ) => void
  showActions?: boolean
}

interface ApprovalDialogData {
  pettyCash: IPettyCashRequest | null
  action: "approve" | "reject" | "cancel" | null
  notes: string
}

export function PettyCashTable({
  pettyCashRequests,
  onSaveAction,
  showActions = true,
}: PettyCashTableProps) {
  const [_selectedPettyCash, _setSelectedPettyCash] =
    useState<IPettyCashRequest | null>(null)
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogData>({
    pettyCash: null,
    action: null,
    notes: "",
  })

  const handleApprovalAction = (
    pettyCash: IPettyCashRequest,
    action: "approve" | "reject" | "cancel"
  ) => {
    setApprovalDialog({
      pettyCash,
      action,
      notes: "",
    })
  }

  const handleApprovalSubmit = () => {
    if (!approvalDialog.pettyCash || !approvalDialog.action) return

    const { pettyCash, action, notes } = approvalDialog

    // Call the single onSaveAction function with action and notes
    onSaveAction?.(pettyCash.pettyCashId.toString(), action, notes)

    // Close dialog and reset
    setApprovalDialog({
      pettyCash: null,
      action: null,
      notes: "",
    })
  }

  const handleApprovalCancel = () => {
    setApprovalDialog({
      pettyCash: null,
      action: null,
      notes: "",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "APPROVED":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "REJECTED":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return <ClockIcon className="h-3 w-3" />
      case "APPROVED":
        return <CheckCircle className="h-3 w-3" />
      case "REJECTED":
        return <XCircle className="h-3 w-3" />
      default:
        return <ClockIcon className="h-3 w-3" />
    }
  }

  const formatDate = (date: string | Date) => {
    if (!date) return "-"
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      return dateObj.toLocaleDateString()
    } catch {
      return "-"
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Request Date</TableHead>
            <TableHead>Remarks</TableHead>
            {showActions && (
              <TableHead className="truncate text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pettyCashRequests.map((pettyCash) => (
            <TableRow key={pettyCash.pettyCashId}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={pettyCash.employeePhoto} />
                    <AvatarFallback>
                      {pettyCash.employeeName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {pettyCash.employeeName || "Unknown Employee"}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {pettyCash.employeeCode || "No Code"}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">
                    <CurrencyFormatter amount={pettyCash.amount || 0} />
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate text-sm">
                  {pettyCash.purpose || "No purpose provided"}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`flex items-center space-x-1 ${getStatusColor(pettyCash.statusName || "")}`}
                >
                  {getStatusIcon(pettyCash.statusName)}
                  <span>{pettyCash.statusName || "UNKNOWN"}</span>
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDate(pettyCash.requestDate)}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate text-sm">
                  {pettyCash.remarks || "No remarks"}
                </div>
              </TableCell>
              {showActions && (
                <TableCell className="truncate text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {pettyCash.statusName === "PENDING" && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleApprovalAction(pettyCash, "approve")
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleApprovalAction(pettyCash, "reject")
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleApprovalAction(pettyCash, "cancel")
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Approval Dialog */}
      <Dialog
        open={!!approvalDialog.pettyCash}
        onOpenChange={() =>
          setApprovalDialog({ pettyCash: null, action: null, notes: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === "approve" &&
                "Approve Petty Cash Request"}
              {approvalDialog.action === "reject" &&
                "Reject Petty Cash Request"}
              {approvalDialog.action === "cancel" &&
                "Cancel Petty Cash Request"}
            </DialogTitle>
          </DialogHeader>
          {approvalDialog.pettyCash && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <p className="text-sm font-medium">
                    {approvalDialog.pettyCash.employeeName || "Unknown"}
                  </p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="text-sm font-medium">
                    <CurrencyFormatter
                      amount={approvalDialog.pettyCash.amount}
                    />
                  </p>
                </div>
                <div>
                  <Label>Purpose</Label>
                  <p className="text-sm">{approvalDialog.pettyCash.purpose}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge
                    className={getStatusColor(
                      approvalDialog.pettyCash.statusName
                    )}
                  >
                    {approvalDialog.pettyCash.statusName}
                  </Badge>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes for this action..."
                  value={approvalDialog.notes}
                  onChange={(e) =>
                    setApprovalDialog({
                      ...approvalDialog,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleApprovalCancel}>
                  Cancel
                </Button>
                <Button onClick={handleApprovalSubmit}>
                  {approvalDialog.action === "approve" && "Approve"}
                  {approvalDialog.action === "reject" && "Reject"}
                  {approvalDialog.action === "cancel" && "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
