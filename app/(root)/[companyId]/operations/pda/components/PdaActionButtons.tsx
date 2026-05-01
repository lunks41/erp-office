"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PdaActionButtonsProps {
  canEdit?: boolean
  canApprove?: boolean
  className?: string
  onPrint?: () => void
  onClone?: () => void
  onDelete?: () => void
  onUpdate?: () => void
  onApprove?: () => void
}

export function PdaActionButtons({
  canEdit = true,
  canApprove = false,
  className,
  onPrint,
  onClone,
  onDelete,
  onUpdate,
  onApprove,
}: PdaActionButtonsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Button type="button" variant="outline" size="sm" onClick={onPrint}>
        Print
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onClone}>
        Clone
      </Button>
      <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
        Delete
      </Button>
      <Button type="button" size="sm" onClick={onUpdate} disabled={!canEdit}>
        Update
      </Button>
      {canApprove ? (
        <Button
          type="button"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={onApprove}
        >
          Approve
        </Button>
      ) : null}
    </div>
  )
}
