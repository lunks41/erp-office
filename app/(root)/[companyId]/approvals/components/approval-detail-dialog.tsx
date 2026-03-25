"use client"

import { useState } from "react"
import {
  APPROVAL_ACTION_TYPES,
  APPROVAL_STATUS,
  IApprovalRequestDetail,
} from "@/interfaces/approval"
import { format } from "date-fns"
import {
  Activity,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  MessageSquare,
  User,
  Users,
  XCircle,
} from "lucide-react"

import { useApproval } from "@/hooks/use-approval"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ApprovalDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestDetail: IApprovalRequestDetail | null
  onCloseAction: () => void
  isPendingApproval: boolean
}

export function ApprovalDetailDialog({
  open,
  onOpenChange,
  requestDetail,
  onCloseAction,
  isPendingApproval,
}: ApprovalDetailDialogProps) {
  const {
    takeApprovalAction,
    canTakeAction,
    getStatusText,
    getActionTypeText,
  } = useApproval()
  const [remarks, setRemarks] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async (statusId: number) => {
    if (!requestDetail) return

    setIsProcessing(true)
    try {
      const success = await takeApprovalAction({
        requestId: requestDetail.requestId,
        levelId: requestDetail.currentLevelId,
        statusId,
        remarks: remarks.trim() || undefined,
      })

      if (success) {
        setRemarks("")
        onCloseAction()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (statusId: number) => {
    switch (statusId) {
      case APPROVAL_STATUS.APPROVED:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case APPROVAL_STATUS.REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />
      case APPROVAL_STATUS.PENDING:
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const canTakeActionOnThisRequest =
    requestDetail && canTakeAction(requestDetail)

  // Calculate approval progress
  const totalLevels = requestDetail?.levels?.length || 0
  const completedLevels = requestDetail?.actions?.length || 0
  const progressPercentage =
    totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] !max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approval Request Details
          </DialogTitle>
          <DialogDescription>
            Review the approval request and take necessary actions
          </DialogDescription>
        </DialogHeader>

        {requestDetail ? (
          <TooltipProvider>
            <div className="space-y-4">
              {/* Request Header */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-mono text-xl">
                          {requestDetail.referenceId}
                        </CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(requestDetail.referenceId)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy reference ID</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <CardDescription className="text-base">
                        <Building className="mr-2 inline h-4 w-4" />
                        {requestDetail.process?.processName}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(requestDetail.statusId)}
                      <Badge
                        variant="outline"
                        className={`font-medium ${getStatusColor(requestDetail.statusId)}`}
                      >
                        {getStatusText(requestDetail.statusId)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
                      <User className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Requested by
                        </p>
                        <p className="font-medium">
                          {requestDetail.requestedByName || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
                      <Calendar className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Requested on
                        </p>
                        <p className="font-medium">
                          {format(
                            new Date(requestDetail.requestedDate),
                            "MMM dd, yyyy"
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {getTimeAgo(requestDetail.requestedDate)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted/30 flex items-center gap-3 rounded-lg p-3">
                      <Activity className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Current Level
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          Level{" "}
                          {requestDetail.currentLevel?.levelNumber || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5" />
                    Approval Progress
                  </CardTitle>
                  <CardDescription>
                    {completedLevels} of {totalLevels} levels completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progressPercentage} className="h-3" />
                  <div className="text-muted-foreground flex justify-between text-sm">
                    <span>Started</span>
                    <span>{Math.round(progressPercentage)}% Complete</span>
                    <span>Final</span>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Levels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Approval Workflow
                  </CardTitle>
                  <CardDescription>
                    Approval levels and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requestDetail.levels?.map((level, index) => {
                      const action = requestDetail.actions?.find(
                        (a) => a.levelId === level.levelId
                      )
                      const isCurrentLevel =
                        level.levelId === requestDetail.currentLevelId
                      const isCompleted = action !== undefined
                      const isLast = index === requestDetail.levels.length - 1

                      return (
                        <div key={level.levelId} className="relative">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                  isCompleted
                                    ? "border-green-300 bg-green-100 text-green-600"
                                    : isCurrentLevel
                                      ? "border-gray-300 bg-yellow-100 text-yellow-600"
                                      : "border-gray-300 bg-gray-100 text-gray-400"
                                }`}
                              >
                                {isCompleted ? (
                                  action?.statusId ===
                                  APPROVAL_ACTION_TYPES.APPROVED ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : (
                                    <XCircle className="h-5 w-5" />
                                  )
                                ) : (
                                  <span className="font-semibold">
                                    {level.levelNumber}
                                  </span>
                                )}
                              </div>
                              {!isLast && (
                                <div
                                  className={`mt-2 h-8 w-0.5 ${
                                    isCompleted ? "bg-green-300" : "bg-gray-300"
                                  }`}
                                />
                              )}
                            </div>
                            <div className="flex-1 pt-1">
                              <div className="mb-2 flex items-center gap-3">
                                <span className="font-semibold">
                                  Level {level.levelNumber}
                                </span>
                                {isCurrentLevel && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-yellow-100 text-yellow-800"
                                  >
                                    Current
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge
                                    variant="outline"
                                    className={
                                      action?.statusId ===
                                      APPROVAL_ACTION_TYPES.APPROVED
                                        ? "border-green-200 bg-green-50 text-green-700"
                                        : "border-red-200 bg-red-50 text-red-700"
                                    }
                                  >
                                    {getActionTypeText(action?.statusId || 0)}
                                  </Badge>
                                )}
                              </div>

                              {action && (
                                <div className="bg-muted/50 space-y-2 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="text-muted-foreground h-4 w-4" />
                                    <span className="font-medium">
                                      {action.actionByName}
                                    </span>
                                    <span className="text-muted-foreground">
                                      •
                                    </span>
                                    <span className="text-muted-foreground">
                                      {format(
                                        new Date(action.actionDate),
                                        "MMM dd, yyyy 'at' HH:mm"
                                      )}
                                    </span>
                                  </div>
                                  {action.remarks && (
                                    <div className="flex items-start gap-2 text-sm">
                                      <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4" />
                                      <span className="text-muted-foreground">
                                        {action.remarks}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Action Section for Pending Approvals */}
              {isPendingApproval && canTakeActionOnThisRequest && (
                <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Take Action
                    </CardTitle>
                    <CardDescription>
                      Approve or reject this request. Your decision will be
                      recorded.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Remarks (Optional)
                      </label>
                      <Textarea
                        placeholder="Add any comments, feedback, or reasoning for your decision..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          handleAction(APPROVAL_ACTION_TYPES.APPROVED)
                        }
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Approve Request
                      </Button>
                      <Button
                        onClick={() =>
                          handleAction(APPROVAL_ACTION_TYPES.REJECTED)
                        }
                        disabled={isProcessing}
                        className="flex-1"
                        variant="destructive"
                        size="lg"
                      >
                        <XCircle className="mr-2 h-5 w-5" />
                        Reject Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Read-only for completed requests or non-approvers */}
              {(!isPendingApproval || !canTakeActionOnThisRequest) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-5 w-5" />
                      Request History
                    </CardTitle>
                    <CardDescription>
                      All actions taken on this request
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requestDetail.actions?.map((action, index) => (
                        <div key={action.actionId}>
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                action.statusId ===
                                APPROVAL_ACTION_TYPES.APPROVED
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {action.statusId ===
                              APPROVAL_ACTION_TYPES.APPROVED ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <XCircle className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-3">
                                <span className="font-semibold">
                                  {action.actionByName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={
                                    action.statusId ===
                                    APPROVAL_ACTION_TYPES.APPROVED
                                      ? "border-green-200 bg-green-50 text-green-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                  }
                                >
                                  {getActionTypeText(action.statusId)}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  Level {action.levelNumber}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground mb-2 text-sm">
                                {format(
                                  new Date(action.actionDate),
                                  "MMM dd, yyyy 'at' HH:mm"
                                )}
                              </div>
                              {action.remarks && (
                                <div className="bg-muted rounded-lg p-3 text-sm">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4" />
                                    <span>{action.remarks}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          {index < requestDetail.actions.length - 1 && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TooltipProvider>
        ) : (
          <div className="py-12 text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">Loading request details...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
