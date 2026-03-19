"use client"

import { useEffect, useState } from "react"
import { APPROVAL_STATUS } from "@/interfaces/approval"
import { AlertCircle, Clock, Eye, RefreshCw, Search } from "lucide-react"

import { useApproval } from "@/hooks/use-approval"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSkeleton } from "@/components/skeleton/loading-skeleton"

import { ApprovalDetailDialog } from "./components/approval-detail-dialog"
import { ApprovalRequestTable } from "./components/approval-request-table"

export default function ApprovalsPage() {
  const {
    requests,
    requestDetail,
    isLoading,
    error,
    fetchMyRequests,
    fetchPendingApprovals,
    fetchRequestDetail,
    fetchApprovalCounts,
  } = useApproval()

  const [activeTab, setActiveTab] = useState("pending")
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [processFilter, setProcessFilter] = useState<string>("all")

  // State for counts
  const [pendingCount, setPendingCount] = useState(0)
  const [myRequestsCount, setMyRequestsCount] = useState(0)

  // Fetch counts on component mount
  useEffect(() => {
    const fetchCounts = async () => {
      const counts = await fetchApprovalCounts()
      if (counts) {
        setPendingCount(counts.pendingCount)
        setMyRequestsCount(counts.myRequestsCount)
      }
    }

    fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch data when tab changes (for the main requests state)
  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingApprovals()
    } else {
      fetchMyRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleViewDetail = async (requestId: number) => {
    await fetchRequestDetail(requestId)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
  }

  const handleRefresh = async () => {
    // Refresh both counts and current tab data
    const counts = await fetchApprovalCounts()
    if (counts) {
      setPendingCount(counts.pendingCount)
      setMyRequestsCount(counts.myRequestsCount)
    }

    if (activeTab === "pending") {
      fetchPendingApprovals()
    } else {
      fetchMyRequests()
    }
  }

  // Filter requests based on search and filters
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.processName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" &&
        request.statusId === APPROVAL_STATUS.PENDING) ||
      (statusFilter === "approved" &&
        request.statusId === APPROVAL_STATUS.APPROVED) ||
      (statusFilter === "rejected" &&
        request.statusId === APPROVAL_STATUS.REJECTED)

    const matchesProcess =
      processFilter === "all" || request.processName === processFilter

    return matchesSearch && matchesStatus && matchesProcess
  })

  // Get unique process names for filter
  const processNames = [
    ...new Set(requests.map((r) => r.processName).filter(Boolean)),
  ]

  if (isLoading && requests.length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Approvals
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage approval requests and track their status
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">
              Error loading approvals: {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Simple Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="pending"
            className="flex items-center gap-1 sm:gap-2"
          >
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Pending</span>
            <span className="sm:hidden">Pending</span>
            {pendingCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-xs text-yellow-800"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="my-requests"
            className="flex items-center gap-1 sm:gap-2"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">My Requests</span>
            <span className="sm:hidden">My Req</span>
            {myRequestsCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-xs text-blue-800"
              >
                {myRequestsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Simple Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:max-w-sm"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Process" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Processes</SelectItem>
                {processNames.map((process) => (
                  <SelectItem key={process} value={process || ""}>
                    {process}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Content */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalRequestTable
                requests={filteredRequests.filter(
                  (r) => r.statusId === APPROVAL_STATUS.PENDING
                )}
                onViewDetail={handleViewDetail}
                showActions={true}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                My Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalRequestTable
                requests={filteredRequests}
                onViewDetail={handleViewDetail}
                showActions={false}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ApprovalDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        requestDetail={requestDetail}
        onCloseAction={handleCloseDetail}
        isPendingApproval={activeTab === "pending"}
      />
    </div>
  )
}
