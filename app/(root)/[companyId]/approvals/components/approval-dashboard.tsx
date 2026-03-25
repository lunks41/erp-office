"use client"

import { APPROVAL_STATUS, IApprovalRequest } from "@/interfaces/approval"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ApprovalDashboardProps {
  requests: IApprovalRequest[]
}

export function ApprovalDashboard({ requests }: ApprovalDashboardProps) {
  const pendingCount = requests.filter(
    (r) => r.statusId === APPROVAL_STATUS.PENDING
  ).length
  const approvedCount = requests.filter(
    (r) => r.statusId === APPROVAL_STATUS.APPROVED
  ).length
  const rejectedCount = requests.filter(
    (r) => r.statusId === APPROVAL_STATUS.REJECTED
  ).length
  const totalCount = requests.length

  // Calculate percentages
  const pendingPercentage =
    totalCount > 0 ? (pendingCount / totalCount) * 100 : 0
  const approvedPercentage =
    totalCount > 0 ? (approvedCount / totalCount) * 100 : 0
  const rejectedPercentage =
    totalCount > 0 ? (rejectedCount / totalCount) * 100 : 0

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentRequests = requests.filter(
    (r) => new Date(r.requestedDate) >= sevenDaysAgo
  ).length

  // Get unique requesters
  const uniqueRequesters = new Set(requests.map((r) => r.requestedById)).size

  const stats = [
    {
      title: "Pending Approvals",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-gray-200",
      description: "Awaiting decision",
      trend: pendingCount > 0 ? "up" : "stable",
    },
    {
      title: "Approved Requests",
      value: approvedCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
      description: "Successfully approved",
      trend: "up",
    },
    {
      title: "Rejected Requests",
      value: rejectedCount,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-200",
      description: "Declined requests",
      trend: "down",
    },
    {
      title: "Total Requests",
      value: totalCount,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      description: "All time requests",
      trend: "up",
    },
  ]

  const additionalStats = [
    {
      title: "Recent Activity",
      value: recentRequests,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Last 7 days",
    },
    {
      title: "Active Requesters",
      value: uniqueRequesters,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      description: "Unique users",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`border-l-4 ${stat.borderColor} transition-shadow hover:shadow-md`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">
                {stat.description}
              </p>
              {stat.trend && (
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp
                    className={`h-3 w-3 ${
                      stat.trend === "up"
                        ? "text-green-600"
                        : stat.trend === "down"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  />
                  <span className="text-muted-foreground text-xs">
                    {stat.trend === "up"
                      ? "Increasing"
                      : stat.trend === "down"
                        ? "Decreasing"
                        : "Stable"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats and Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Additional Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {additionalStats.map((stat) => (
                <div key={stat.title} className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-muted-foreground text-xs">
                      {stat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{pendingCount}</span>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    {pendingPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={pendingPercentage} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{approvedCount}</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {approvedPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={approvedPercentage} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{rejectedCount}</span>
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800"
                  >
                    {rejectedPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={rejectedPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {pendingCount > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">
                    {pendingCount} approval{pendingCount !== 1 ? "s" : ""}{" "}
                    pending
                  </p>
                  <p className="text-sm text-yellow-700">
                    Review and take action on pending requests
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                Action Required
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
