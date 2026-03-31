"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { TaskAutocomplete } from "@/components/autocomplete"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

const bulkCloneSchema = z.object({
  taskId: z.number().min(1, "Please select a task"),
})

export type BulkCloneTariffFormValues = z.infer<typeof bulkCloneSchema>

interface BulkCloneTariffFormProps {
  defaultTaskId: number
  onSubmitAction: (taskId: number) => void
  onCancelAction: () => void
  isSubmitting?: boolean
}

export function BulkCloneTariffForm({
  defaultTaskId,
  onSubmitAction,
  onCancelAction,
  isSubmitting = false,
}: BulkCloneTariffFormProps) {
  const form = useForm<BulkCloneTariffFormValues>({
    resolver: zodResolver(bulkCloneSchema),
    defaultValues: {
      taskId: defaultTaskId > 0 ? defaultTaskId : 0,
    },
  })

  useEffect(() => {
    form.reset({
      taskId: defaultTaskId > 0 ? defaultTaskId : 0,
    })
  }, [defaultTaskId, form])

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmitAction(values.taskId))}
      >
        <TaskAutocomplete
          form={form}
          name="taskId"
          label="Task"
          isRequired
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelAction}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Cloning…" : "Clone"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
