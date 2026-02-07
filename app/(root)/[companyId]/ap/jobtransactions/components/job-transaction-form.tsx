"use client"

import { useCallback, useEffect } from "react"
import { IJobTransaction } from "@/interfaces"
import {
  IJobOrderLookup,
  IServiceItemNoLookup,
  ITaskLookup,
} from "@/interfaces/lookup"
import {
  JobTransactionUpdateSchema,
  JobTransactionUpdateSchemaType,
} from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import {
  DynamicJobOrderAutocomplete,
  JobOrderServiceAutocomplete,
  JobOrderTaskAutocomplete,
} from "@/components/autocomplete"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { usePersist } from "@/hooks/use-common"
import { ApJobTransaction } from "@/lib/api-routes"

interface JobTransactionFormProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  row: IJobTransaction | null
  onSuccessAction: () => void
}

const JobTransactionFormSchema = JobTransactionUpdateSchema.extend({
  jobOrderNo: z.string().optional(),
  taskName: z.string().optional(),
  serviceItemNoName: z.string().optional(),
  invoiceNo: z.string().optional(),
  suppInvoiceNo: z.string().optional(),
  accountDate: z.string().optional(),
})

type FormValues = z.infer<typeof JobTransactionFormSchema>

export function JobTransactionForm({
  open,
  onOpenChangeAction,
  row,
  onSuccessAction,
}: JobTransactionFormProps) {
  const updateMutation = usePersist<JobTransactionUpdateSchemaType>(
    ApJobTransaction.update
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(JobTransactionFormSchema),
    defaultValues: {
      moduleId: 0,
      transactionId: 0,
      invoiceId: "",
      itemNo: 0,
      seqNo: 0,
      jobOrderId: 0,
      jobOrderNo: "",
      taskId: 0,
      taskName: "",
      serviceItemNo: 0,
      serviceItemNoName: "",
      remarks: "",
      invoiceNo: "",
      suppInvoiceNo: "",
      accountDate: "",
    },
  })

  const watchedJobOrderId = form.watch("jobOrderId")
  const watchedTaskId = form.watch("taskId")

  const handleJobOrderChange = useCallback(
    (selectedOption: IJobOrderLookup | null) => {
      if (selectedOption) {
        form.setValue("jobOrderId", selectedOption.jobOrderId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("jobOrderNo", selectedOption.jobOrderNo || "")
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        form.setValue("jobOrderId", 0, { shouldValidate: true })
        form.setValue("jobOrderNo", "")
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    },
    [form]
  )

  const handleTaskChange = useCallback(
    (selectedOption: ITaskLookup | null) => {
      if (selectedOption) {
        form.setValue("taskId", selectedOption.taskId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("taskName", selectedOption.taskName || "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    },
    [form]
  )

  const handleServiceChange = useCallback(
    (selectedOption: IServiceItemNoLookup | null) => {
      if (selectedOption) {
        form.setValue("serviceItemNo", selectedOption.serviceItemNo, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue(
          "serviceItemNoName",
          selectedOption.serviceItemNoName || ""
        )
      } else {
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    },
    [form]
  )

  // Reset form when dialog opens with a row
  useEffect(() => {
    if (open && row) {
      const accountDateDisplay = row.accountDate
        ? new Date(row.accountDate).toLocaleDateString()
        : ""
      form.reset({
        moduleId: row.moduleId,
        transactionId: row.transactionId,
        invoiceId: row.invoiceId,
        itemNo: row.itemNo,
        seqNo: row.seqNo,
        jobOrderId: row.jobOrderId,
        jobOrderNo: row.jobOrderNo || "",
        taskId: row.taskId,
        taskName: row.taskName || "",
        serviceItemNo: row.serviceItemNo,
        serviceItemNoName: row.serviceName || "",
        remarks: row.remarks || "",
        invoiceNo: row.invoiceNo || "",
        suppInvoiceNo: row.suppInvoiceNo || "",
        accountDate: accountDateDisplay,
      })
    }
  }, [open, row, form])

  const onSubmit = useCallback(
    async (values: FormValues) => {
      const payload: JobTransactionUpdateSchemaType = {
        moduleId: values.moduleId,
        transactionId: values.transactionId,
        invoiceId: values.invoiceId,
        itemNo: values.itemNo,
        seqNo: values.seqNo,
        jobOrderId: values.jobOrderId,
        taskId: values.taskId,
        serviceItemNo: values.serviceItemNo,
        remarks: values.remarks ?? "",
      }
      try {
        const response = await updateMutation.mutateAsync(payload)
        if (response.result === 1) {
          toast.success("Job transaction updated successfully")
          onSuccessAction()
          onOpenChangeAction(false)
        } else {
          toast.error(response.message || "Update failed")
        }
      } catch {
        // usePersist handles toast on error
      }
    },
    [updateMutation, onSuccessAction, onOpenChangeAction]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Job Transaction</DialogTitle>
          <DialogDescription>
            Update Job Order, Task, Service and Remarks for this invoice line.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="invoiceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice No</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="suppInvoiceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supp Invoice No</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DynamicJobOrderAutocomplete
              form={form}
              name="jobOrderId"
              label="Job Order-D"
              onChangeEvent={handleJobOrderChange}
            />
            <JobOrderTaskAutocomplete
              key={`task-${watchedJobOrderId}`}
              form={form}
              name="taskId"
              jobOrderId={watchedJobOrderId || 0}
              label="Task"
              onChangeEvent={handleTaskChange}
            />
            <JobOrderServiceAutocomplete
              key={`service-${watchedJobOrderId}-${watchedTaskId}`}
              form={form}
              name="serviceItemNo"
              jobOrderId={watchedJobOrderId || 0}
              taskId={watchedTaskId || 0}
              label="Service"
              onChangeEvent={handleServiceChange}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Remarks"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChangeAction(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
