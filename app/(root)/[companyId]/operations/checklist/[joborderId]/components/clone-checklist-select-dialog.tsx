"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ICloneChecklistServiceLine } from "@/interfaces/clone-checklist"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"
import { JobOrder } from "@/lib/api-routes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  CloneChecklistServicesTable,
  type TaskLineGroup,
} from "./clone-checklist-services-table"

interface CloneChecklistSelectDialogProps {
  open: boolean
  jobOrderId: number
  /** Restores checkbox state when returning from confirm (e.g. 2 of 41). */
  initialSelectedKeys?: string[]
  onOpenChange: (open: boolean) => void
  onBack: () => void
  onNext: (selectedKeys: string[]) => void
}

export function CloneChecklistSelectDialog({
  open,
  jobOrderId,
  initialSelectedKeys = [],
  onOpenChange,
  onBack,
  onNext,
}: CloneChecklistSelectDialogProps) {
  const [lines, setLines] = useState<ICloneChecklistServiceLine[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const fetchLines = useCallback(async () => {
    if (!jobOrderId) return
    setIsLoading(true)
    try {
      const response = await apiClient.get(
        `${JobOrder.getCloneChecklistServices}/${jobOrderId}`
      )
      if (response.data.result === 1) {
        const data = (
          (response.data.data || []) as ICloneChecklistServiceLine[]
        ).sort(
          (a, b) => a.taskId - b.taskId || a.serviceId - b.serviceId
        )
        setLines(data)
        const allKeys = data.map((line) => line.serviceLineKey)
        if (initialSelectedKeys.length > 0) {
          const restored = initialSelectedKeys.filter((key) =>
            allKeys.includes(key)
          )
          setSelectedKeys(new Set(restored))
        } else {
          setSelectedKeys(new Set(allKeys))
        }
      } else {
        setLines([])
        setSelectedKeys(new Set())
        toast.error(response.data.message || "No service lines found to clone")
      }
    } catch {
      toast.error("Failed to load service lines")
      setLines([])
      setSelectedKeys(new Set())
    } finally {
      setIsLoading(false)
    }
  }, [jobOrderId, initialSelectedKeys])

  useEffect(() => {
    if (open) {
      fetchLines()
    }
  }, [open, fetchLines])

  const allSelected = lines.length > 0 && selectedKeys.size === lines.length
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < lines.length

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeys(new Set(lines.map((line) => line.serviceLineKey)))
    } else {
      setSelectedKeys(new Set())
    }
  }

  const toggleLine = (key: string, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const taskGroups = useMemo<TaskLineGroup[]>(() => {
    const groups: TaskLineGroup[] = []
    for (const line of lines) {
      const last = groups[groups.length - 1]
      if (!last || last.taskId !== line.taskId) {
        groups.push({
          taskId: line.taskId,
          taskName: line.taskName || `Task ${line.taskId}`,
          lines: [line],
        })
      } else {
        last.lines.push(line)
      }
    }
    return groups
  }, [lines])

  const getTaskGroupSelection = (groupLines: ICloneChecklistServiceLine[]) => {
    const selectedCount = groupLines.filter((line) =>
      selectedKeys.has(line.serviceLineKey)
    ).length
    return {
      selectedCount,
      totalCount: groupLines.length,
      allSelected: selectedCount === groupLines.length,
      someSelected: selectedCount > 0 && selectedCount < groupLines.length,
    }
  }

  const toggleTaskGroup = (
    groupLines: ICloneChecklistServiceLine[],
    checked: boolean
  ) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      for (const line of groupLines) {
        if (checked) next.add(line.serviceLineKey)
        else next.delete(line.serviceLineKey)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[70vw] max-w-[70vw] flex-col overflow-hidden sm:max-w-[70vw]">
        <DialogHeader>
          <DialogTitle>Select services to clone</DialogTitle>
          <DialogDescription>
            Uncheck any task lines you do not want copied to the new job order.
            All lines are selected by default.
            {!isLoading && lines.length > 0 && (
              <span className="mt-1 block font-medium text-foreground">
                {taskGroups.length} task{taskGroups.length === 1 ? "" : "s"} ·{" "}
                {selectedKeys.size} of {lines.length} line
                {lines.length === 1 ? "" : "s"} selected
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <CloneChecklistServicesTable
          taskGroups={taskGroups}
          isLoading={isLoading}
          selectedKeys={selectedKeys}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleAll={toggleAll}
          onToggleLine={toggleLine}
          onToggleTaskGroup={toggleTaskGroup}
          getTaskGroupSelection={getTaskGroupSelection}
        />

        <DialogFooter className="gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (lines.length > 0 && selectedKeys.size === 0) {
                toast.error("Select at least one service line to clone")
                return
              }
              // All lines selected → omit keys so API uses Ser_CloneChecklist only (no delete + Ser_CloneTask).
              const keysToSend =
                lines.length > 0 && selectedKeys.size === lines.length
                  ? []
                  : Array.from(selectedKeys)
              onNext(keysToSend)
            }}
            disabled={isLoading}
          >
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
