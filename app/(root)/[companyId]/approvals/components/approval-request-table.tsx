"use client"

import { useState } from "react"
import {
  APPROVAL_ACTION_TYPES,
  APPROVAL_STATUS,
  IApprovalRequest,
} from "@/interfaces/approval"
import { format } from "date-fns"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  User,
  XCircle,
} from "lucide-react"

import { useApproval } from "@/hooks/use-approval"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ApprovalRequestTableProps {
  requests: IApprovalRequest[]
  onViewDetail: (requestId: number) => void
  showActions: boolean
  isLoading: boolean
}

export function ApprovalRequestTable({
  requests,
  onViewDetail,
  showActions,
  isLoading,
}: ApprovalRequestTableProps) {
  const { takeApprovalAction, canTakeAction, getStatusText } = useApproval()
  const [processingAction, setProcessingAction] = useState<number | null>(null)

  const handleAction = async (
    requestId: number,
    statusId: number,
    remarks?: string
  ) => {
    setProcessingAction(requestId)
    try {
      const request = requests.find((r) => r.requestId === requestId)
      if (!request) return

      const success = await takeApprovalAction({
        requestId,
        levelId: request.currentLevelId,
        statusId,
        remarks,
      })

      if (success) {
        // The hook will refresh the data
      }
    } finally {
      setProcessingAction(null)
    }
  }

  const getStatusIcon = (statusId: number) => {
    switch (statusId) {
      case APPROVAL_STATUS.APPROVED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case APPROVAL_STATUS.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
      case APPROVAL_STATUS.PENDING:
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (statusId: number) => {
    switch (statusId) {
      case APPROVAL_STATUS.APPROVED:
        return "text-green-700 bg-green-50 border-green-200"
      case APPROVAL_STATUS.REJECTED:
        return "text-red-700 bg-red-50 border-red-200"
      case APPROVAL_STATUS.PENDING:
        return "text-yellow-700 bg-yellow-50 border-gray-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    )

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return format(date, "MMM dd")
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Clock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-muted-foreground mb-2 text-lg font-semibold">
            {showActions ? "No pending approvals" : "No requests found"}
          </h3>
          <p className="text-muted-foreground">
            {showActions
              ? "All approval requests have been processed"
              : "You haven't submitted any requests yet"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead className="font-semibold">Reference</TableHead>
              <TableHead className="font-semibold">Process</TableHead>
              <TableHead className="font-semibold">Requested By</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Level</TableHead>
              {showActions && (
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow
                key={request.requestId}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onViewDetail(request.requestId)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    <span className="font-mono text-sm">
                      {request.referenceId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {request.processName || "N/A"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">
                      {request.requestedByName || "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Calendar className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm">
                          {getTimeAgo(request.requestedDate)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {format(
                          new Date(request.requestedDate),
                          "MMM dd, yyyy 'at' HH:mm"
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.statusId)}
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getStatusColor(request.statusId)}`}
                    >
                      {getStatusText(request.statusId)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    Level {request.currentLevelNumber || "N/A"}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewDetail(request.requestId)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View details</p>
                        </TooltipContent>
                      </Tooltip>

                      {canTakeAction(request) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              disabled={processingAction === request.requestId}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(
                                  request.requestId,
                                  APPROVAL_ACTION_TYPES.APPROVED
                                )
                              }
                              disabled={processingAction === request.requestId}
                              className="text-green-700 focus:text-green-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve Request
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(
                                  request.requestId,
                                  APPROVAL_ACTION_TYPES.REJECTED
                                )
                              }
                              disabled={processingAction === request.requestId}
                              className="text-red-700 focus:text-red-700"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Request
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
