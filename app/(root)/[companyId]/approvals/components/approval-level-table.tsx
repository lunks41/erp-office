"use client"

import { useState } from "react"
import { IApprovalLevel } from "@/interfaces/approval"
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

interface ApprovalLevelTableProps {
  data: IApprovalLevel[]
  isLoading?: boolean
  onLevelSelect?: (level: IApprovalLevel | undefined) => void
  onDeleteLevel?: (levelId: string) => void
  onEditActionLevel?: (level: IApprovalLevel) => void
  onCreateActionLevel?: () => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: Record<string, unknown>) => void
}

export function ApprovalLevelTable({
  data,
  isLoading = false,
  onLevelSelect,
  onDeleteLevel,
  onEditActionLevel,
  onCreateActionLevel,
  onRefreshAction,
  onFilterChange,
}: ApprovalLevelTableProps) {
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
              placeholder="Search levels..."
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
          {onCreateActionLevel && (
            <Button size="sm" onClick={onCreateActionLevel}>
              <Plus className="mr-2 h-4 w-4" />
              Create Level
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level ID</TableHead>
              <TableHead>Process ID</TableHead>
              <TableHead>Level Number</TableHead>
              <TableHead>User Role ID</TableHead>
              <TableHead>Level Name</TableHead>
              <TableHead>Is Final</TableHead>
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
                  No approval levels found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((level) => (
                <TableRow key={level.levelId}>
                  <TableCell>{level.levelId}</TableCell>
                  <TableCell>{level.processId}</TableCell>
                  <TableCell>{level.levelNumber}</TableCell>
                  <TableCell>{level.userRoleId}</TableCell>
                  <TableCell className="font-medium">
                    Level {level.levelNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant={level.isFinal ? "default" : "secondary"}>
                      {level.isFinal ? "Final" : "Not Final"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                      {onLevelSelect && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onLevelSelect(level)}
                        >
                          View
                        </Button>
                      )}
                      {onEditActionLevel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditActionLevel(level)}
                        >
                          Edit
                        </Button>
                      )}
                      {onDeleteLevel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onDeleteLevel(level.levelId.toString())
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
