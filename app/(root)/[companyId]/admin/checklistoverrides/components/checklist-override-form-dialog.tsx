"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { IJobOrderStatus, ISaveJobOrderStatusRequest } from "@/interfaces/admin"
import { JobStatusAutocomplete } from "@/components/autocomplete"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const checklistOverrideFormSchema = z.object({
  jobOrderId: z.number(),
  jobStatusId: z.coerce.number().min(1, "Job status is required"),
})

type ChecklistOverrideFormValues = z.infer<typeof checklistOverrideFormSchema>

interface ChecklistOverrideFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrder: IJobOrderStatus | null
  onSubmit: (data: ISaveJobOrderStatusRequest) => Promise<void>
  isSubmitting?: boolean
}

export function ChecklistOverrideFormDialog({
  open,
  onOpenChange,
  jobOrder,
  onSubmit,
  isSubmitting = false,
}: ChecklistOverrideFormDialogProps) {
  const form = useForm<ChecklistOverrideFormValues>({
    resolver: zodResolver(checklistOverrideFormSchema),
    defaultValues: {
      jobOrderId: 0,
      jobStatusId: 0,
    },
    values: jobOrder
      ? {
          jobOrderId: jobOrder.jobOrderId,
          jobStatusId: jobOrder.jobStatusId,
        }
      : undefined,
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit({
      jobOrderId: data.jobOrderId,
      jobStatusId: data.jobStatusId,
    })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Job Status</DialogTitle>
          <DialogDescription>
            Update the status for job order {jobOrder?.jobOrderNo ?? ""}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <div className="text-muted-foreground text-sm">
              <span className="font-medium">Job Order No:</span>{" "}
              {jobOrder?.jobOrderNo ?? "-"}
            </div>
            <JobStatusAutocomplete
              form={form as ReturnType<typeof useForm<Record<string, unknown>>>}
              name="jobStatusId"
              label="Job Status"
              isRequired
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
