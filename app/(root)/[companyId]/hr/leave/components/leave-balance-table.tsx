"use client"

import { ILeaveBalance, ILeavePolicy } from "@/interfaces/leave"
import {
  Calendar,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface LeaveBalanceTableProps {
  balances: ILeaveBalance[]
  policies: ILeavePolicy[]
  showActions?: boolean
}

export function LeaveBalanceTable({
  balances,
  policies,
  showActions = true,
}: LeaveBalanceTableProps) {
  const getLeaveTypeColor = (typeId: number) => {
    const policy = policies.find((p) => p.leaveTypeId === typeId)
    const typeName = policy?.name || `Type ${typeId}`

    switch (typeName.toLowerCase()) {
      case "annual leave":
        return "bg-green-100 text-green-800 border-green-200"
      case "sick leave":
        return "bg-red-100 text-red-800 border-red-200"
      case "casual leave":
        return "bg-blue-100 text-primary border-border"
      case "maternity leave":
        return "bg-pink-100 text-pink-800 border-pink-200"
      case "bereavement leave":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getUsagePercentage = (used: number, allocated: number) => {
    if (allocated === 0) return 0
    return Math.round((used / allocated) * 100)
  }

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (percentage >= 75)
      return <TrendingUp className="h-4 w-4 text-orange-500" />
    if (percentage >= 50)
      return <TrendingUp className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-green-500" />
  }

  // Handle empty or invalid data
  if (!balances || balances.length === 0) {
    return (
      <div className="py-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No leave balances found
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          There are no leave balances to display.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-gray-600">
                Total Allocated
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold">
              {balances.reduce(
                (sum, balance) => sum + balance.totalAllocated,
                0
              )}
            </div>
            <div className="text-xs text-gray-500">Days allocated</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Used
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-green-600">
              {balances.reduce((sum, balance) => sum + balance.totalUsed, 0)}
            </div>
            <div className="text-xs text-gray-500">Days used</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-gray-600">
                Total Remaining
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-muted-foreground">
              {balances.reduce(
                (sum, balance) => sum + balance.remainingBalance,
                0
              )}
            </div>
            <div className="text-xs text-gray-500">Days remaining</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">
                Low Balance Alert
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-orange-600">
              {
                balances.filter((balance) => balance.remainingBalance < 5)
                  .length
              }
            </div>
            <div className="text-xs text-gray-500">Employees</div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Year</TableHead>
              {showActions && (
                <TableHead className="truncate text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((balance) => {
              const usagePercentage = getUsagePercentage(
                balance.totalUsed,
                balance.totalAllocated
              )

              return (
                <TableRow key={balance.leaveBalanceId}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {balance.employeeName?.toString().slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {balance.employeeName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getLeaveTypeColor(balance.leaveTypeId)}
                    >
                      {balance.leaveTypeName || `Type ${balance.leaveTypeId}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {balance.totalAllocated}
                    </span>
                    <span className="text-muted-foreground text-sm"> days</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{balance.totalUsed}</span>
                    <span className="text-muted-foreground text-sm"> days</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{balance.totalPending}</span>
                    <span className="text-muted-foreground text-sm"> days</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {balance.remainingBalance}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        days
                      </span>
                      {balance.remainingBalance < 5 && (
                        <Badge variant="destructive" className="text-xs">
                          Low
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={usagePercentage} className="w-16" />
                      <span className="text-sm font-medium">
                        {usagePercentage}%
                      </span>
                      {getUsageIcon(usagePercentage)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{balance.year}</Badge>
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
                          <DropdownMenuItem
                            onClick={() => {
                              // Dispatch event to open balance form in view mode
                              const event = new CustomEvent("openBalanceForm", {
                                detail: { mode: "view", balance },
                              })
                              window.dispatchEvent(event)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // Dispatch event to open balance form in edit mode
                              const event = new CustomEvent("openBalanceForm", {
                                detail: { mode: "edit", balance },
                              })
                              window.dispatchEvent(event)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Balance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              // Dispatch event to open balance form in add mode for specific employee
                              const event = new CustomEvent("openBalanceForm", {
                                detail: {
                                  mode: "add",
                                  employeeId: balance.employeeId,
                                },
                              })
                              window.dispatchEvent(event)
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Balance
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {balances.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No leave balances found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Start by adding leave balances for your employees.
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Leave Balance
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
