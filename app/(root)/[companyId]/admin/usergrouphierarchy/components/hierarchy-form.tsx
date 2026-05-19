"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { IUserGroupHierarchy } from "@/interfaces/admin"
import { IconArrowRight } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HierarchyFormProps {
  item: IUserGroupHierarchy
  allGroups: IUserGroupHierarchy[]
  isSubmitting: boolean
  onSubmit: (groupId: number, parentGroupId: number) => void
  onCancel: () => void
}

export function HierarchyForm({
  item,
  allGroups,
  isSubmitting,
  onSubmit,
  onCancel,
}: HierarchyFormProps) {
  const portalRef = useRef<HTMLDivElement>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )

  const [parentGroupId, setParentGroupId] = useState<string>(
    String(item.parentGroupId)
  )

  useEffect(() => {
    setParentGroupId(String(item.parentGroupId))
  }, [item.groupId, item.parentGroupId])

  useEffect(() => {
    setPortalContainer(portalRef.current)
  }, [])

  const parentOptions = useMemo(
    () =>
      allGroups.filter(
        (g) => g.groupId !== item.groupId && g.groupId > 0
      ),
    [allGroups, item.groupId]
  )

  const selectedParent = useMemo(
    () => parentOptions.find((g) => g.groupId === Number(parentGroupId)),
    [parentOptions, parentGroupId]
  )

  const handleSave = () => {
    if (!parentGroupId) return
    onSubmit(item.groupId, Number(parentGroupId))
  }

  return (
    <div ref={portalRef} className="flex flex-col gap-5">
      {/* Read-only acting group info */}
      <div className="rounded-md border bg-muted/40 p-3 text-sm">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Acting Group
        </p>
        <p className="font-semibold">
          {item.groupCode}{" "}
          <span className="font-normal text-muted-foreground">
            — {item.groupName}
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Notifications from this group will route to the selected parent group
          and all of its ancestors up to ADMIN.
        </p>
      </div>

      {/* Parent selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Notifies Group (Parent){" "}
          <span className="text-destructive">*</span>
        </label>
        <Select value={parentGroupId} onValueChange={setParentGroupId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a parent group…" />
          </SelectTrigger>
          <SelectContent
            container={portalContainer}
            position="popper"
            side="bottom"
            sideOffset={4}
            className="z-[100] max-h-72"
          >
            {parentOptions.map((g) => (
              <SelectItem key={g.groupId} value={String(g.groupId)}>
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  {g.groupCode}
                </span>
                {g.groupName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedParent && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{item.groupCode}</span>
            <IconArrowRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-foreground">
              {selectedParent.groupCode}
            </span>
            <IconArrowRight className="h-3 w-3 shrink-0" />
            <span>… → ADMIN</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t pt-3">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!parentGroupId || isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  )
}
