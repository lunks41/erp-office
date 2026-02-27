"use client"

import { IJobOrderStatus, ISaveJobOrderStatusRequest } from "@/interfaces/admin"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { JobStatusAutocomplete } from "@/components/autocomplete"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const jobOrderStatusFormSchema = z.object({
  jobOrderId: z.number(),
  jobStatusId: z.coerce.number().min(1, "Job status is required"),
})

type JobOrderStatusFormValues = z.infer<typeof jobOrderStatusFormSchema>

interface JobOrderStatusFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobOrder: IJobOrderStatus | null
  onSubmit: (data: ISaveJobOrderStatusRequest) => Promise<void>
  isSubmitting?: boolean
}

export function JobOrderStatusFormDialog({
  open,
  onOpenChange,
  jobOrder,
  onSubmit,
  isSubmitting = false,
}: JobOrderStatusFormDialogProps) {
  const form = useForm<JobOrderStatusFormValues>({
    resolver: zodResolver(jobOrderStatusFormSchema),
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
              <span className="font-medium">Job Order No:</span> {jobOrder?.jobOrderNo ?? "-"}
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
