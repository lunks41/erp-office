"use client"

import { useState } from "react"
import { IApprovalProcess } from "@/interfaces/approval"
import { format, isValid } from "date-fns"
import { Plus, RefreshCw, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ApprovalProcessTableProps {
  data: IApprovalProcess[]
  isLoading?: boolean
  onProcessSelect?: (process: IApprovalProcess | undefined) => void
  onDeleteProcess?: (processId: string) => void
  onEditActionProcess?: (process: IApprovalProcess) => void
  onCreateActionProcess?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: Record<string, unknown>) => void
}

export function ApprovalProcessTable({
  data,
  isLoading = false,
  onProcessSelect,
  onDeleteProcess,
  onEditActionProcess,
  onCreateActionProcess,
  onRefreshAction,
  onFilterChange,
}: ApprovalProcessTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onFilterChange?.({ search: query })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search processes..."
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              className="pl-8 sm:w-[300px]"
            />
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          {onRefreshAction && (
            <Button variant="outline" size="sm" onClick={onRefreshAction}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
          {onCreateActionProcess && (
            <Button size="sm" onClick={onCreateActionProcess}>
              <Plus className="mr-2 h-4 w-4" />
              Create Process
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Process ID</TableHead>
              <TableHead>Process Name</TableHead>
              <TableHead>Module ID</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center"
                >
                  No approval processes found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((process) => (
                <TableRow key={process.processId}>
                  <TableCell>{process.processId}</TableCell>
                  <TableCell className="font-medium">
                    {process.processName}
                  </TableCell>
                  <TableCell>{process.moduleId}</TableCell>
                  <TableCell>{process.transactionId || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={process.isActive ? "default" : "secondary"}>
                      {process.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {process.createdDate &&
                    isValid(new Date(process.createdDate))
                      ? format(new Date(process.createdDate), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                      {onProcessSelect && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onProcessSelect(process)}
                        >
                          View
                        </Button>
                      )}
                      {onEditActionProcess && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditActionProcess(process)}
                        >
                          Edit
                        </Button>
                      )}
                      {onDeleteProcess && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onDeleteProcess(process.processId.toString())
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
