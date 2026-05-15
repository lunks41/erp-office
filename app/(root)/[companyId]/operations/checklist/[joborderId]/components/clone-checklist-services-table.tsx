"use client"

import { ICloneChecklistServiceLine } from "@/interfaces/clone-checklist"

import { Checkbox } from "@/components/ui/checkbox"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface TaskLineGroup {
  taskId: number
  taskName: string
  lines: ICloneChecklistServiceLine[]
}

interface CloneChecklistServicesTableProps {
  taskGroups: TaskLineGroup[]
  isLoading: boolean
  selectedKeys: Set<string>
  allSelected: boolean
  someSelected: boolean
  onToggleAll: (checked: boolean) => void
  onToggleLine: (key: string, checked: boolean) => void
  onToggleTaskGroup: (
    groupLines: ICloneChecklistServiceLine[],
    checked: boolean
  ) => void
  getTaskGroupSelection: (groupLines: ICloneChecklistServiceLine[]) => {
    selectedCount: number
    totalCount: number
    allSelected: boolean
    someSelected: boolean
  }
  maxHeight?: string
}

/** Matches table-task sticky first column: border + shadow keeps the divider visible while scrolling horizontally. */
const STICKY_SELECT_HEAD =
  "sticky left-0 z-30 w-14 min-w-14 bg-muted/50 border-r border-border px-3 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)]"
const STICKY_SELECT_CELL =
  "sticky left-0 z-10 bg-background border-r border-border px-3 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)]"
const STICKY_SELECT_GROUP =
  "sticky left-0 z-10 bg-muted/40 border-r border-border px-3 shadow-[4px_0_6px_-4px_rgba(0,0,0,0.12)]"

const COLUMN_COUNT = 12

function displayValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "-"
  return String(value)
}

export function CloneChecklistServicesTable({
  taskGroups,
  isLoading,
  selectedKeys,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleLine,
  onToggleTaskGroup,
  getTaskGroupSelection,
  maxHeight = "min(52vh, 520px)",
}: CloneChecklistServicesTableProps) {
  const hasLines = taskGroups.some((group) => group.lines.length > 0)
  const dataColSpan = COLUMN_COUNT - 1

  return (
    <div
      className="overflow-auto rounded-md border border-border/80 bg-background"
      style={{ maxHeight }}
    >
      <table className="w-full min-w-[1400px] border-collapse caption-bottom text-xs">
        <TableHeader className="bg-background sticky top-0 z-20 shadow-[0_1px_0_0_hsl(var(--border))]">
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className={STICKY_SELECT_HEAD}>
              <Checkbox
                checked={allSelected || (someSelected && "indeterminate")}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label="Select all service lines"
              />
            </TableHead>
            <TableHead className="bg-muted/50 min-w-32">Task</TableHead>
            <TableHead className="bg-muted/50 min-w-48">Charge</TableHead>
            <TableHead className="bg-muted/50 min-w-28">Barge</TableHead>
            <TableHead className="bg-muted/50 min-w-32">Crew Name</TableHead>
            <TableHead className="bg-muted/50 min-w-28">Visa Type</TableHead>
            <TableHead className="bg-muted/50 min-w-28">AWB No</TableHead>
            <TableHead className="bg-muted/50 min-w-24">Status</TableHead>
            <TableHead className="bg-muted/50 min-w-20">Qty</TableHead>
            <TableHead className="bg-muted/50 min-w-22">Amount</TableHead>
            <TableHead className="bg-muted/50 min-w-28">Reference</TableHead>
            <TableHead className="bg-muted/50 min-w-40">Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="text-muted-foreground py-8 text-center"
              >
                Loading service lines...
              </TableCell>
            </TableRow>
          ) : !hasLines ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="text-muted-foreground py-8 text-center"
              >
                No service lines found on this job order.
              </TableCell>
            </TableRow>
          ) : (
            taskGroups.flatMap((group) => {
              const { selectedCount, totalCount, allSelected, someSelected } =
                getTaskGroupSelection(group.lines)

              return [
                <TableRow
                  key={`task-group-${group.taskId}`}
                  className="bg-muted/40 hover:bg-muted/40"
                >
                  <TableCell className={STICKY_SELECT_GROUP}>
                    <Checkbox
                      checked={allSelected || (someSelected && "indeterminate")}
                      onCheckedChange={(value) =>
                        onToggleTaskGroup(group.lines, value === true)
                      }
                      aria-label={`Select all ${group.taskName} lines`}
                    />
                  </TableCell>
                  <TableCell colSpan={dataColSpan} className="bg-muted/40 font-medium">
                    <span>{group.taskName}</span>
                    <span className="text-muted-foreground ml-3 text-xs font-normal">
                      {selectedCount} / {totalCount} selected
                    </span>
                  </TableCell>
                </TableRow>,
                ...group.lines.map((line) => (
                  <TableRow key={line.serviceLineKey}>
                    <TableCell className={STICKY_SELECT_CELL}>
                      <Checkbox
                        checked={selectedKeys.has(line.serviceLineKey)}
                        onCheckedChange={(value) =>
                          onToggleLine(line.serviceLineKey, value === true)
                        }
                        aria-label={`Select ${line.chargeName || "service line"}`}
                      />
                    </TableCell>
                    <TableCell>{line.taskName || "-"}</TableCell>
                    <TableCell title={line.chargeName || undefined}>
                      {displayValue(line.chargeName)}
                    </TableCell>
                    <TableCell title={line.bargeName || undefined}>
                      {displayValue(line.bargeName)}
                    </TableCell>
                    <TableCell title={line.crewName || undefined}>
                      {displayValue(line.crewName)}
                    </TableCell>
                    <TableCell title={line.visaTypeName || undefined}>
                      {displayValue(line.visaTypeName)}
                    </TableCell>
                    <TableCell title={line.awbNo || undefined}>
                      {displayValue(line.awbNo)}
                    </TableCell>
                    <TableCell>{displayValue(line.statusName)}</TableCell>
                    <TableCell>{displayValue(line.quantity)}</TableCell>
                    <TableCell>{displayValue(line.amount)}</TableCell>
                    <TableCell>{displayValue(line.referenceNo)}</TableCell>
                    <TableCell title={line.remarks || undefined}>
                      {displayValue(line.remarks)}
                    </TableCell>
                  </TableRow>
                )),
              ]
            })
          )}
        </TableBody>
      </table>
    </div>
  )
}
