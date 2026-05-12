"use client"

import { useState } from "react"
import { ILeave } from "@/interfaces/leave"
import { format } from "date-fns"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalLevel {
  level: number
  title: string
  name: string
  role: string
  email: string
  status: "pending" | "approved" | "rejected" | "skipped"
  approvedAt?: string
  comments?: string
}

interface LeaveApprovalWorkflowProps {
  leave: ILeave
  currentApproverId?: string
  onApprove: (
    leaveId: string,
    approverId: string,
    comments?: string
  ) => Promise<void>
  onReject: (
    leaveId: string,
    approverId: string,
    reason: string
  ) => Promise<void>
  onSkip: (leaveId: string, approverId: string) => Promise<void>
}

export function LeaveApprovalWorkflow({
  leave,
  currentApproverId,
  onApprove,
  onReject,
  onSkip,
}: LeaveApprovalWorkflowProps) {
  const [approvalComments, setApprovalComments] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Get approval hierarchy for this leave request
  const getApprovalHierarchy = (): ApprovalLevel[] => {
    // In a real system, this would be fetched from the database based on employee's department and role
    return [
      {
        level: 1,
        title: "Direct Manager",
        name: "Manager Smith",
        role: "IT Manager",
        email: "manager.smith@company.com",
        status: leave.statusName === "APPROVED" ? "approved" : "pending",
        approvedAt: leave.actionDate
          ? typeof leave.actionDate === "string"
            ? leave.actionDate
            : leave.actionDate.toISOString()
          : undefined,
        comments: "Approved for family vacation",
      },
      {
        level: 2,
        title: "Department Head",
        name: "John Manager",
        role: "IT Director",
        email: "john.manager@company.com",
        status: "pending",
      },
      {
        level: 3,
        title: "HR Manager",
        name: "Sarah HR",
        role: "HR Manager",
        email: "sarah.hr@company.com",
        status: "pending",
      },
    ]
  }

  const approvalHierarchy = getApprovalHierarchy()

  const handleApprove = async () => {
    if (!currentApproverId) {
      toast.error("Approver ID not found")
      return
    }

    try {
      setIsProcessing(true)
      await onApprove(
        leave.leaveId.toString(),
        currentApproverId,
        approvalComments
      )
      toast.success("Leave request approved successfully")
      setApprovalComments("")
    } catch {
      toast.error("Failed to approve leave request")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!currentApproverId) {
      toast.error("Approver ID not found")
      return
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    try {
      setIsProcessing(true)
      await onReject(
        leave.leaveId.toString(),
        currentApproverId,
        rejectionReason
      )
      toast.success("Leave request rejected")
      setRejectionReason("")
    } catch {
      toast.error("Failed to reject leave request")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkip = async () => {
    if (!currentApproverId) {
      toast.error("Approver ID not found")
      return
    }

    try {
      setIsProcessing(true)
      await onSkip(leave.leaveId.toString(), currentApproverId)
      toast.success("Approval level skipped")
    } catch {
      toast.error("Failed to skip approval level")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "skipped":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isCurrentApprover = (approver: ApprovalLevel) => {
    // In a real system, this would check if the current user is this approver
    return approver.status === "pending" && currentApproverId
  }

  return (
    <div className="space-y-6">
      {/* Leave Request Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Leave Request Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">Employee Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {leave.employeeName}
                </p>
                <p>
                  <span className="font-medium">Code:</span>{" "}
                  {leave.employeeCode}
                </p>
                <p>
                  <span className="font-medium">Department:</span>{" "}
                  {leave.departmentName}
                </p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Leave Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  {leave.leaveTypeName}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {leave.totalDays} days
                </p>
                <p>
                  <span className="font-medium">Dates:</span>{" "}
                  {format(new Date(leave.startDate), "MMM dd")} -{" "}
                  {format(new Date(leave.endDate), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="mb-2 font-semibold">Reason</h3>
            <p className="text-muted-foreground text-sm">{leave.reason}</p>
          </div>

          {leave.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="mb-2 font-semibold">Notes</h3>
                <p className="text-muted-foreground text-sm">{leave.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Approval Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Approval Hierarchy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvalHierarchy.map((approver, index) => (
              <div key={approver.level} className="relative">
                <div className="flex items-center space-x-4 rounded-lg border p-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-medium text-muted-foreground">
                        {approver.level}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex items-center space-x-2">
                      {getStatusIcon(approver.status)}
                      <p className="font-medium">{approver.title}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {approver.name} • {approver.role}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {approver.email}
                    </p>
                    {approver.approvedAt && (
                      <p className="text-xs text-green-600">
                        Approved on{" "}
                        {format(
                          new Date(approver.approvedAt),
                          "MMM dd, yyyy 'at' HH:mm"
                        )}
                      </p>
                    )}
                    {approver.comments && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        &quot;{approver.comments}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <Badge className={getStatusColor(approver.status)}>
                      {approver.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Connection line to next level */}
                {index < approvalHierarchy.length - 1 && (
                  <div className="absolute top-14 left-5 h-8 w-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Approver Actions */}
      {approvalHierarchy.some(isCurrentApprover) && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Approval Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-green-700">
                Approve Leave Request
              </h3>
              <Textarea
                placeholder="Add approval comments (optional)..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Leave Request
              </Button>
            </div>

            <Separator />

            {/* Rejection Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-red-700">Reject Leave Request</h3>
              <Textarea
                placeholder="Provide rejection reason (required)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="border-red-200 focus:border-red-500"
              />
              <Button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Leave Request
              </Button>
            </div>

            <Separator />

            {/* Skip Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Skip Approval Level</h3>
              <p className="text-muted-foreground text-sm">
                Skip this approval level and send to the next approver in the
                hierarchy.
              </p>
              <Button
                onClick={handleSkip}
                disabled={isProcessing}
                variant="outline"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Skip This Level
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Process Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Approval Process</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-card0"></div>
              <p>Leave requests follow a hierarchical approval process</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-card0"></div>
              <p>Each level must approve before proceeding to the next</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-card0"></div>
              <p>Approvers can add comments or provide rejection reasons</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-card0"></div>
              <p>Employees receive notifications at each approval step</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-card0"></div>
              <p>If any level rejects, the request is immediately rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
