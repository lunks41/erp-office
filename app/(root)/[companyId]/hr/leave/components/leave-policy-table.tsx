"use client"

import { ILeavePolicy } from "@/interfaces/leave"
import { Edit, Settings } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LeavePolicyTableProps {
  policies: ILeavePolicy[]
}

export function LeavePolicyTable({ policies }: LeavePolicyTableProps) {
  const handleEdit = (policy: ILeavePolicy) => {
    // Dispatch event to open form with edit mode
    const event = new CustomEvent("openPolicyForm", {
      detail: { mode: "edit", policy },
    })
    window.dispatchEvent(event)
  }

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

  // Handle empty or invalid data
  if (!policies || policies.length === 0) {
    return (
      <div className="py-8 text-center">
        <Settings className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No leave policies found
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Start by creating your first leave policy.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Policy List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <Card key={policy.leavePolicyId} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{policy.name}</CardTitle>
                <Badge variant={policy.isActive ? "default" : "secondary"}>
                  {policy.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Badge
                  variant="outline"
                  className={getLeaveTypeColor(policy.leaveTypeId)}
                >
                  Type: {policy.leaveTypeName}
                </Badge>
                {policy.description && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    {policy.description}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Default:</span>
                  <div className="font-medium">{policy.defaultDays} days</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Max:</span>
                  <div className="font-medium">{policy.maxDays} days</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Min:</span>
                  <div className="font-medium">{policy.minDays} days</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Notice:</span>
                  <div className="font-medium">
                    {policy.advanceNoticeDays} days
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Consecutive:</span>
                  <div className="font-medium">
                    {policy.maxConsecutiveDays} days
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Approval:</span>
                  <div className="font-medium">
                    {policy.requiresApproval ? "Required" : "Not Required"}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(policy)}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
